const express = require('express')
const router = express.Router()
const { GoogleGenAI } = require('@google/genai')
const Platform = require('../models/Platform')

function normalizeQuery(raw) {
  return decodeURIComponent(raw || '')
    .trim()
    .replace(/e$/i, (m, offset, str) => (/amazone/i.test(str) ? '' : m))
}

// GET /api/platforms/:name - MongoDB first, Gemini AI auto-seed & save on miss
router.get('/:name', async (req, res) => {
  try {
    const rawName = decodeURIComponent(req.params.name || '').trim()
    if (!rawName) return res.json({ found: false })

    const cleanedName = normalizeQuery(rawName)

    // 1. Check MongoDB first
    let platform = await Platform.findOne({
      name: { $regex: cleanedName, $options: 'i' },
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
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
      })
      responseText = fallback.text
    }

    const parsed = JSON.parse(responseText.replace(/```json|```/gi, '').trim())

    const existingCanonical = await Platform.findOne({
      name: new RegExp(`^${parsed.name}$`, 'i'),
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

module.exports = router