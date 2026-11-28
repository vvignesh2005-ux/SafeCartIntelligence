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

    // 1. Check MongoDB first (exact or partial case-insensitive match)
    let platform = await Platform.findOne({
      name: { $regex: cleanedName, $options: 'i' },
    })

    if (platform) {
      return res.json({ found: true, platform, cached: true })
    }

    // 2. Cache miss: ask Gemini AI to identify official platform details & save to MongoDB
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    const prompt = `Identify the e-commerce or social shopping platform "${rawName}" (fix minor spelling typos like "Amazone" -> "Amazon India").
Return ONLY valid JSON with these exact fields:
{
  "name": "Canonical Platform Name",
  "type": "Marketplace" | "Social Commerce" | "Quick Commerce" | "Direct Store",
  "returnWindow": "Typical return/refund policy summary (e.g., 7-10 days replacement/refund on eligible items)",
  "refundSpeed": "Typical refund timeline (e.g., 3-5 business days to original payment source)",
  "grievanceProcess": "How to escalate unresolved issues (in-app help -> Grievance Officer -> NCH 1915)",
  "buyerProtectionTips": [
    "Actionable safety tip 1 before paying",
    "Actionable safety tip 2 for proof/unboxing"
  ],
  "officialWebsite": "https://..."
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

    // Check again by canonical name to avoid duplicate records
    const existingCanonical = await Platform.findOne({
      name: new RegExp(`^${parsed.name}$`, 'i'),
    })
    if (existingCanonical) {
      return res.json({ found: true, platform: existingCanonical, cached: true })
    }

    const newPlatform = new Platform({
      name: parsed.name || cleanedName,
      type: parsed.type || 'Online Platform',
      returnWindow: parsed.returnWindow || 'Verify seller return policy before checkout',
      refundSpeed: parsed.refundSpeed || '3–7 business days via original payment mode',
      grievanceProcess: parsed.grievanceProcess || 'Escalate via official Grievance Officer email or NCH 1915',
      buyerProtectionTips: parsed.buyerProtectionTips || [
        'Pay via traceable UPI or Credit Card instead of direct personal bank transfers.',
        'Record an uncut unboxing video for high-value deliveries.',
      ],
      officialWebsite: parsed.officialWebsite || '',
      source: 'ai-baseline',
      verifiedCount: 0,
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