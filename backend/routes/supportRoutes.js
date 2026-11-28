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

    // 2. Cache miss: ask Gemini AI to populate the exact SupportContact.js schema fields
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    const prompt = `Provide verified official customer support details for "${rawName}" in India (fix minor typos like "Amazone" -> "Amazon India"). Never invent unverified phone numbers—if no official toll-free line is confirmed, state "Use official in-app Help Center callback".
Return ONLY valid JSON matching this exact structure:
{
  "name": "Canonical Brand or Platform Name",
  "phone": "Verified toll-free number or 'Use official in-app Help Center callback'",
  "email": "Official support or grievance officer email",
  "website": "https://...",
  "liveChatAvailable": true,
  "supportHours": "24/7 via official app & help portal",
  "verified": true
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

    const existingCanonical = await SupportContact.findOne({
      name: new RegExp(`^${parsed.name}$`, 'i'),
    })
    if (existingCanonical) {
      return res.json({ found: true, contact: existingCanonical, cached: true })
    }

    const newContact = new SupportContact({
      name: parsed.name || cleanedName,
      phone: parsed.phone || 'Use official in-app Help Center callback',
      email: parsed.email || 'Check official website footer under Grievance Redressal',
      website: parsed.website || '',
      liveChatAvailable: Boolean(parsed.liveChatAvailable),
      supportHours: parsed.supportHours || '24/7 In-App Help Center',
      verified: true,
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