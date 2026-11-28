const { generateSolutionSteps } = require('../ai')
const { GoogleGenAI } = require('@google/genai')
const express = require('express')
const router = express.Router()
const Problem = require('../models/Problem')
const Solution = require('../models/Solution')
const Feedback = require('../models/Feedback')

const COMMON_PROBLEMS = [
  {
    platform: 'Amazon India',
    category: 'Refund Delayed',
    problemText: 'Return pickup completed 5 days ago, but refund is still not credited to bank account.',
    steps: [
      'Open Your Orders in the Amazon app and capture a screenshot showing Return Picked Up status.',
      'Request a callback in Amazon Help Center and ask for the Refund Reference Number (RRN / ARN).',
      'Email cs-reply@amazon.in with your Order ID and RRN demanding credit within 48 hours.',
      'Submit the RRN to your bank or file a grievance on National Consumer Helpline (1915).',
    ],
    solvedCount: 18,
  },
  {
    platform: 'Flipkart',
    category: 'Wrong or Damaged Item',
    problemText: 'Received a different or damaged product and return request was rejected.',
    steps: [
      'Gather your unboxing video, outer shipping label photo, and IMEI/serial number images.',
      'Reopen the return ticket in Flipkart Help Center under Escalate to Senior Executive.',
      'Email grievance.officer@flipkart.com citing Indian E-Commerce Rules with your Ticket ID.',
      'If unresolved after 7 days, file a chargeback dispute with your UPI/card bank using the proof.',
    ],
    solvedCount: 14,
  },
  {
    platform: 'Instagram Store',
    category: 'Order Not Delivered',
    problemText: 'Paid via UPI to an Instagram seller who stopped replying and shared no tracking ID.',
    steps: [
      'Save screenshots of the Instagram profile URL, chat agreement, and UPI transaction UTR.',
      'Report the merchant UPI ID in your UPI app (GPay/PhonePe/Paytm) under Fraud / Non-Delivery.',
      'File an online complaint at cybercrime.gov.in (1930) and consumerhelpline.gov.in (1915).',
      'Submit the complaint acknowledgement PDF to your bank branch to freeze or reverse the transfer.',
    ],
    solvedCount: 22,
  },
]

function escapeRegex(str) {
  return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function ensureSeededProblems() {
  for (const item of COMMON_PROBLEMS) {
    const existing = await Problem.findOne({
      platform: new RegExp(`^${escapeRegex(item.platform)}$`, 'i'),
      category: new RegExp(`^${escapeRegex(item.category)}$`, 'i'),
    })
    if (!existing) {
      const createdProblem = await Problem.create({
        problemText: item.problemText,
        platform: item.platform,
        category: item.category,
        reportCount: item.solvedCount,
      })
      await Solution.create({
        problemId: createdProblem._id,
        steps: item.steps,
        source: 'user-verified',
        solvedCount: item.solvedCount,
        partialCount: 1,
        failedCount: 0,
      })
    }
  }
}

// GET /api/problems/common - list pre-seeded & top community problems for quick chips
router.get('/common', async (req, res) => {
  try {
    await ensureSeededProblems()
    const problems = await Problem.find().sort({ reportCount: -1, updatedAt: -1 }).limit(8)
    res.json({ problems })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/problems - merge common issues, rank #1 user-verified solution, or generate new AI playbook
router.post('/', async (req, res) => {
  try {
    await ensureSeededProblems()
    const { problemText, platform, category } = req.body

    if (!problemText || !platform || !category) {
      return res.status(400).json({ error: 'problemText, platform, and category are required' })
    }

    const cleanPlatform = platform.trim()
    const cleanCategory = category.trim()

    // 1. Check if a common problem already exists for this platform + category
    const matchingProblems = await Problem.find({
      platform: new RegExp(`^${escapeRegex(cleanPlatform)}$`, 'i'),
      category: new RegExp(`^${escapeRegex(cleanCategory)}$`, 'i'),
    })

    let activeProblem

    if (matchingProblems.length > 0) {
      activeProblem = matchingProblems[0]
      await Problem.findByIdAndUpdate(activeProblem._id, {
        $inc: { reportCount: 1 },
        $set: { lastReportedText: problemText.trim() },
      })

      const problemIds = matchingProblems.map((p) => p._id)
      const matchedSolutions = await Solution.find({ problemId: { $in: problemIds } })

      if (matchedSolutions.length > 0) {
        matchedSolutions.sort((a, b) => {
          const scoreA = (a.solvedCount || 0) - (a.failedCount || 0)
          const scoreB = (b.solvedCount || 0) - (b.failedCount || 0)
          if (scoreB !== scoreA) return scoreB - scoreA
          return (b.solvedCount || 0) - (a.solvedCount || 0)
        })

        return res.json({
          found: true,
          mergedCommonIssue: true,
          solution: matchedSolutions[0],
          allSolutions: matchedSolutions,
          problemId: activeProblem._id,
        })
      }
    } else {
      activeProblem = new Problem({
        problemText: problemText.trim(),
        platform: cleanPlatform,
        category: cleanCategory,
        reportCount: 1,
      })
      await activeProblem.save()
    }

    // 2. No verified solution exists yet — generate structured playbook via Gemini AI
    const aiSteps = await generateSolutionSteps(problemText, cleanPlatform, cleanCategory)

    const newSolution = new Solution({
      problemId: activeProblem._id,
      steps: aiSteps,
      source: 'ai',
      solvedCount: 0,
      partialCount: 0,
      failedCount: 0,
    })
    await newSolution.save()

    return res.json({
      found: true,
      solution: newSolution,
      problemId: activeProblem._id,
      aiGenerated: true,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/problems/solution - save a user-contributed or AI-formatted solution
router.post('/solution', async (req, res) => {
  try {
    const { problemId, steps, source } = req.body

    const newSolution = new Solution({
      problemId,
      steps,
      source: source || 'user-verified',
      solvedCount: source === 'user' ? 1 : 0,
    })

    await newSolution.save()
    res.json({ success: true, solution: newSolution })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/problems/feedback - record user verification & boost top-performing solution
router.post('/feedback', async (req, res) => {
  try {
    const { solutionId, result, whichStepWorked, serviceRating, serviceFeedback } = req.body

    const parsedStep =
      typeof whichStepWorked === 'number'
        ? whichStepWorked
        : Number(String(whichStepWorked || '').replace(/\D/g, '')) || null

    const newFeedback = new Feedback({
      solutionId,
      result,
      whichStepWorked: parsedStep,
      serviceRating: Number(serviceRating) || 5,
      serviceFeedback: (serviceFeedback || '').trim(),
    })
    await newFeedback.save()

    const updateField =
      result === 'solved' ? 'solvedCount' :
      result === 'partial' ? 'partialCount' : 'failedCount'

    const updatedSolution = await Solution.findByIdAndUpdate(
      solutionId,
      { $inc: { [updateField]: 1 } },
      { returnDocument: 'after' }
    )

    res.json({ success: true, solution: updatedSolution })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/problems/analyze-checkout - Pre-purchase dark pattern & hidden fee detector
router.post('/analyze-checkout', async (req, res) => {
  try {
    const { platform = 'Unknown Platform', checkoutText } = req.body
    if (!checkoutText || !checkoutText.trim()) {
      return res.status(400).json({ error: 'Checkout summary or pricing text is required.' })
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    const prompt = `Analyze this e-commerce checkout breakdown or product offer from "${platform}" for Indian consumer dark patterns (drip pricing, hidden platform/handling fees, pre-ticked add-ons, false urgency, or non-returnable traps).
Return ONLY valid JSON with this exact shape:
{
  "riskLevel": "Low" | "Moderate" | "High",
  "flags": [
    { "type": "Short Flag Name", "detail": "One-sentence factual explanation", "ruleReference": "Consumer Protection (E-Commerce) Rules / Dark Patterns Guidelines" }
  ],
  "safestPaymentTip": "One actionable payment/evidence tip before paying"
}
Text to inspect:
"""${checkoutText.trim()}"""`

    let responseText = ''
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      })
      responseText = response.text
    } catch (primaryErr) {
      const fallback = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
      })
      responseText = fallback.text
    }

    const cleaned = responseText.replace(/```json|```/gi, '').trim()
    const parsed = JSON.parse(cleaned)
    res.json(parsed)
  } catch (err) {
    res.json({
      riskLevel: 'Moderate',
      flags: [
        {
          type: 'Manual Fee Verification Advised',
          detail: 'Compare item base price against final payable total for unannounced handling, packaging, or convenience fees.',
          ruleReference: 'Central Consumer Protection Authority (CCPA) Dark Patterns Guidelines',
        },
      ],
      safestPaymentTip: 'Use a credit card or UPI with screenshot proof of the final checkout breakdown before paying.',
    })
  }
})

module.exports = router