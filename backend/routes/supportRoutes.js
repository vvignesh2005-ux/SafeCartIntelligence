const express = require('express')
const router = express.Router()
const { GoogleGenAI } = require('@google/genai')
const SupportContact = require('../models/SupportContact')

function normalizeQuery(raw) {
  return decodeURIComponent(raw || '')
    .trim()
    .replace(/e$/i, (m, offset, str) => (/amazone/i.test(str) ? '' : m))
}

// GET /api/support/:name - MongoDB first, Gemini AI official contact lookup & save on miss
router.get('/:name', async (req, res) => {
  try {
    const rawName = decodeURIComponent(req.params.name || '').trim()
    if (!rawName) return res.json({ found: false })

    const cleanedName = normalizeQuery(rawName)

    // 1. Check MongoDB first
    let contact = await SupportContact.findOne({
      name: { $regex: cleanedName, $options: 'i' },
    })

    if (contact) {
      return res.json({ found: true, contact, cached: true })
    }

    // 2. Cache miss: ask Gemini AI for official support & grievance escalation channels
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    const prompt = `Provide verified official customer support and grievance escalation channels for "${rawName}" in India (fix minor spelling typos like "Amazone" -> "Amazon India"). Do NOT invent unverified phone numbers—only provide official help portal URLs, official grievance/support emails if publicly established, and statutory escalation steps.
Return ONLY valid JSON with these exact fields:
{
  "name": "Canonical Platform or Brand Name",
  "supportEmail": "Official support/grievance email or 'Use official in-app Help Center'",
  "helpPortalUrl": "https://...",
  "grievanceOfficerInfo": "How to reach their Grievance Officer under Indian E-Commerce Rules",
  "responseSla": "48 hours acknowledgment / 30 days resolution under Consumer Protection (E-Commerce) Rules",
  "antiScamWarning": "Specific warning against fake Google search helpline numbers for this brand"
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

    const existingCanonical = await SupportContact.findOne({
      name: new RegExp(`^${parsed.name}$`, 'i'),
    })
    if (existingCanonical) {
      return res.json({ found: true, contact: existingCanonical, cached: true })
    }

    const newContact = new SupportContact({
      name: parsed.name || cleanedName,
      email: parsed.supportEmail || 'Use official in-app Help Center',
      supportEmail: parsed.supportEmail || 'Use official in-app Help Center',
      website: parsed.helpPortalUrl || '',
      helpPortalUrl: parsed.helpPortalUrl || '',
      grievanceOfficerInfo: parsed.grievanceOfficerInfo || 'Check official website footer under Grievance Redressal',
      responseSla: parsed.responseSla || '48 hours acknowledgment / 30 days resolution',
      antiScamWarning:
        parsed.antiScamWarning ||
        'Never call customer-care phone numbers from sponsored search ads; use only the official app or website.',
      source: 'ai-baseline',
      verifiedCount: 0,
    })

    await newContact.save()
    return res.json({ found: true, contact: newContact, aiGenerated: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/support - create or verify a support contact
router.post('/', async (req, res) => {
  try {
    const newContact = new SupportContact(req.body)
    await newContact.save()
    res.json({ success: true, contact: newContact })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router