const { generateSolutionSteps } = require('../ai')
const { GoogleGenAI } = require('@google/genai')
const express = require('express')
const router = express.Router()
const Problem = require('../models/Problem')
const Solution = require('../models/Solution')
const Feedback = require('../models/Feedback')

// POST /api/problems - merge common issues, rank #1 user-verified solution, or generate new AI playbook
router.post('/', async (req, res) => {
  try {
    const { problemText, platform, category } = req.body

    if (!problemText || !platform || !category) {
      return res.status(400).json({ error: 'problemText, platform, and category are required' })
    }

    const cleanPlatform = platform.trim()
    const cleanCategory = category.trim()

    // 1. Check if a common problem already exists for this platform + category
    const matchingProblems = await Problem.find({
      platform: new RegExp(`^${cleanPlatform}$`, 'i'),
      category: new RegExp(`^${cleanCategory}$`, 'i'),
    })

    let activeProblem

    if (matchingProblems.length > 0) {
      // Reuse the canonical common problem so individual reports consolidate into one
      activeProblem = matchingProblems[0]
      await Problem.findByIdAndUpdate(activeProblem._id, {
        $inc: { reportCount: 1 },
        $set: { lastReportedText: problemText.trim() },
      })

      const problemIds = matchingProblems.map((p) => p._id)
      const matchedSolutions = await Solution.find({ problemId: { $in: problemIds } })

      if (matchedSolutions.length > 0) {
        // Rank #1 by net user verification score (solved - failed), then highest solvedCount
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
      // Create a new canonical problem record
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
    const { solutionId, result, whichStepWorked } = req.body

    const parsedStep =
      typeof whichStepWorked === 'number'
        ? whichStepWorked
        : Number(String(whichStepWorked || '').replace(/\D/g, '')) || null

    const newFeedback = new Feedback({
      solutionId,
      result,
      whichStepWorked: parsedStep,
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