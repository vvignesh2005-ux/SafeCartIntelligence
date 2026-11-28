const express = require('express')
const router = express.Router()
const { GoogleGenAI } = require('@google/genai')
const Platform = require('../models/Platform')
const Feedback = require('../models/Feedback')

const COMMON_PLATFORMS = [
  {
    name: 'Amazon India',
    ratings: {
      publicReputation: 4.3,
      customerSatisfaction: 4.2,
      deliveryPerformance: 4.5,
      supportQuality: 4.0,
      returnExperience: 4.3,
      refundSpeed: 4.2,
    },
    averageRefundTime: '3–5 business days to original payment method',
    commonComplaints: [
      'Replacement-only policy on select smartphones and electronics before refund',
      'Return pickup delays during major festive sale periods',
      'Third-party seller packaging mismatch on non-FBA orders',
    ],
    aiSummary:
      'Amazon India provides strong A-to-z Guarantee buyer protection and fast FBA logistics, though high-value electronics require brand service-center verification for defects. Unresolved tickets can be escalated to the Grievance Officer within 48 hours under Indian E-Commerce Rules.',
  },
  {
    name: 'Flipkart',
    ratings: {
      publicReputation: 4.1,
      customerSatisfaction: 4.0,
      deliveryPerformance: 4.3,
      supportQuality: 3.8,
      returnExperience: 4.0,
      refundSpeed: 4.0,
    },
    averageRefundTime: '3–7 business days via original payment source',
    commonComplaints: [
      'Open-Box Delivery OTP disputes if physical damage is missed at doorstep',
      'Brand technician visit required before approving electronics returns',
      'Return pickup rescheduling by courier partners',
    ],
    aiSummary:
      'Flipkart enforces Open-Box Delivery on electronics and apparel, making doorstep inspection before sharing OTP mandatory. Refunds typically clear within 3–7 business days once pickup QC passes.',
  },
  {
    name: 'Meesho',
    ratings: {
      publicReputation: 3.8,
      customerSatisfaction: 3.7,
      deliveryPerformance: 3.9,
      supportQuality: 3.6,
      returnExperience: 3.9,
      refundSpeed: 3.8,
    },
    averageRefundTime: '5–7 business days to bank account / UPI',
    commonComplaints: [
      'Fabric or print quality variance across unbranded third-party resellers',
      'Wrong item delivered requiring unboxing video proof for Wrong/Defective claims',
      'Delayed courier pickup in non-metro pin codes',
    ],
    aiSummary:
      'Meesho offers a 7-day no-questions return window on most fashion and home listings, with lower pricing tiers reflecting lower return fees. Recording an unboxing video protects against wrong-item disputes.',
  },
  {
    name: 'Myntra',
    ratings: {
      publicReputation: 4.2,
      customerSatisfaction: 4.1,
      deliveryPerformance: 4.3,
      supportQuality: 3.9,
      returnExperience: 4.2,
      refundSpeed: 4.1,
    },
    averageRefundTime: '3–5 business days after doorstep quality check',
    commonComplaints: [
      'Strict doorstep tag and barcode inspection during return pickup',
      'Convenience fee deductions on accounts with high return ratios',
      'Size exchange stock unavailability during End of Reason Sale',
    ],
    aiSummary:
      'Myntra maintains reliable apparel logistics and 7–14 day exchange/return windows, provided original brand tags remain intact at pickup. Refunds process promptly after courier QC.',
  },
]

function normalizeQuery(raw) {
  return decodeURIComponent(raw || '')
    .trim()
    .replace(/e$/i, (m, offset, str) => (/amazone/i.test(str) ? '' : m))
}

async function ensureSeededPlatforms() {
  for (const item of COMMON_PLATFORMS) {
    const escaped = item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const exists = await Platform.findOne({
      name: { $regex: `^${escaped}$`, $options: 'i' },
    })
    if (!exists) {
      await Platform.create(item)
    }
  }
}

// GET /api/platforms - list pre-seeded & cached platforms for quick chips
router.get('/', async (req, res) => {
  try {
    await ensureSeededPlatforms()
    const platforms = await Platform.find().sort({ updatedAt: -1 }).limit(12)
    res.json({ platforms })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/platforms/:name - MongoDB first, Gemini AI auto-seed & save on miss
router.get('/:name', async (req, res) => {
  try {
    await ensureSeededPlatforms()
    const rawName = decodeURIComponent(req.params.name || '').trim()
    if (!rawName) return res.json({ found: false })

    const cleanedName = normalizeQuery(rawName)
    const escaped = cleanedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    // 1. Check MongoDB first
    let platform = await Platform.findOne({
      name: { $regex: escaped, $options: 'i' },
    })

    if (platform) {
      return res.json({ found: true, platform, cached: true })
    }

    // 2. Cache miss: ask Gemini AI to populate the exact Platform.js schema fields
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    const prompt = `Analyze the e-commerce or social shopping platform "${rawName}" in India (fix minor typos like "Amazone" -> "Amazon India").
Return ONLY valid JSON matching this exact structure (numbers from 1.0 to 5.0 based on documented consumer dispute patterns):
{
  "name": "Canonical Platform Name",
  "ratings": {
    "publicReputation": 4.2,
    "customerSatisfaction": 4.0,
    "deliveryPerformance": 4.3,
    "supportQuality": 3.8,
    "returnExperience": 4.1,
    "refundSpeed": 4.0
  },
  "averageRefundTime": "3-5 business days to original payment method",
  "commonComplaints": [
    "Documented dispute pattern 1",
    "Documented dispute pattern 2",
    "Documented dispute pattern 3"
  ],
  "aiSummary": "2-sentence factual overview of return windows, payment protection, and grievance escalation rules under Indian E-Commerce Rules."
}`

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

    const parsed = JSON.parse(responseText.replace(/```json|```/gi, '').trim())

    const existingCanonical = await Platform.findOne({
      name: new RegExp(`^${(parsed.name || cleanedName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    })
    if (existingCanonical) {
      return res.json({ found: true, platform: existingCanonical, cached: true })
    }

    const newPlatform = new Platform({
      name: parsed.name || cleanedName,
      ratings: {
        publicReputation: Number(parsed.ratings?.publicReputation) || 3.5,
        customerSatisfaction: Number(parsed.ratings?.customerSatisfaction) || 3.5,
        deliveryPerformance: Number(parsed.ratings?.deliveryPerformance) || 3.5,
        supportQuality: Number(parsed.ratings?.supportQuality) || 3.5,
        returnExperience: Number(parsed.ratings?.returnExperience) || 3.5,
        refundSpeed: Number(parsed.ratings?.refundSpeed) || 3.5,
      },
      averageRefundTime: parsed.averageRefundTime || '3–7 business days via original payment source',
      commonComplaints: Array.isArray(parsed.commonComplaints)
        ? parsed.commonComplaints
        : ['Return pickup delays', 'Refund processing SLA tracking'],
      aiSummary:
        parsed.aiSummary ||
        'Verify seller return terms before checkout and escalate unresolved tickets to the Grievance Officer within 48 hours.',
    })

    await newPlatform.save()
    return res.json({ found: true, platform: newPlatform, aiGenerated: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/platforms - create or verify a platform record
router.post('/', async (req, res) => {
  try {
    const newPlatform = new Platform(req.body)
    await newPlatform.save()
    res.json({ success: true, platform: newPlatform })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/platforms/:id/feedback - store 1-5 star platform rating & service feedback
router.post('/:id/feedback', async (req, res) => {
  try {
    const platform = await Platform.findById(req.params.id)
    if (!platform) {
      return res.status(404).json({ error: 'Platform not found.' })
    }

    const platformRating = Math.min(5, Math.max(1, Number(req.body.platformRating) || 5))
    const serviceRating = Math.min(5, Math.max(1, Number(req.body.serviceRating) || 5))
    const comment = (req.body.comment || '').trim()
    const serviceFeedback = (req.body.serviceFeedback || '').trim()

    // Blend user's star rating into the platform's stored ratings
    const r = platform.ratings || {}
    const blend = (val) => Number((((Number(val) || 4) * 9 + platformRating) / 10).toFixed(1))
    platform.ratings = {
      publicReputation: blend(r.publicReputation),
      customerSatisfaction: blend(r.customerSatisfaction),
      deliveryPerformance: blend(r.deliveryPerformance),
      supportQuality: blend(r.supportQuality),
      returnExperience: blend(r.returnExperience),
      refundSpeed: blend(r.refundSpeed),
    }
    if (comment && Array.isArray(platform.commonComplaints)) {
      platform.commonComplaints = [comment, ...platform.commonComplaints.slice(0, 4)]
    }
    await platform.save()

    // Also log into Feedback collection so service feedback is stored globally
    try {
      await Feedback.create({
        targetType: 'Platform',
        targetName: platform.name,
        rating: platformRating,
        serviceRating,
        comment,
        serviceFeedback,
      })
    } catch {
      // Ignore if Feedback schema uses slightly different optional fields
    }

    res.json({ success: true, platform })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router