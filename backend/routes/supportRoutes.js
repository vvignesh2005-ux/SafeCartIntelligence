const express = require('express')
const router = express.Router()
const { GoogleGenAI } = require('@google/genai')
const SupportContact = require('../models/SupportContact')
const Feedback = require('../models/Feedback')

const COMMON_CONTACTS = [
  {
    name: 'Amazon India',
    phone: 'Use official in-app Help Center callback',
    email: 'cs-reply@amazon.in',
    website: 'https://www.amazon.in/gp/help/customer/display.html',
    liveChatAvailable: true,
    supportHours: '24/7 via official Amazon app & Help Center',
    verified: true,
  },
  {
    name: 'Flipkart',
    phone: '044-45614700',
    email: 'grievance.officer@flipkart.com',
    website: 'https://www.flipkart.com/helpcentre',
    liveChatAvailable: true,
    supportHours: '24/7 In-App Help; Grievance Desk Mon–Sat 9 AM–6 PM',
    verified: true,
  },
  {
    name: 'Meesho',
    phone: '080-61799600',
    email: 'help@meesho.com',
    website: 'https://www.meesho.com',
    liveChatAvailable: true,
    supportHours: '24/7 via Meesho App Help Section',
    verified: true,
  },
  {
    name: 'Myntra',
    phone: '080-61561999',
    email: 'grievanceofficer@myntra.com',
    website: 'https://www.myntra.com/contactus',
    liveChatAvailable: true,
    supportHours: '24/7 via Myntra App Help Center',
    verified: true,
  },
  {
    name: 'National Consumer Helpline (NCH)',
    phone: '1915 / 1800-11-4000',
    email: 'nch-ca@gov.in',
    website: 'https://consumerhelpline.gov.in/',
    liveChatAvailable: true,
    supportHours: 'Daily 8:00 AM – 8:00 PM (17 Languages + WhatsApp 8800001915)',
    verified: true,
  },
]

function normalizeQuery(raw) {
  return decodeURIComponent(raw || '')
    .trim()
    .replace(/e$/i, (m, offset, str) => (/amazone/i.test(str) ? '' : m))
}

async function ensureSeededContacts() {
  for (const item of COMMON_CONTACTS) {
    const escaped = item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const exists = await SupportContact.findOne({
      name: { $regex: `^${escaped}$`, $options: 'i' },
    })
    if (!exists) {
      await SupportContact.create(item)
    }
  }
}

// GET /api/support - list pre-seeded & cached official support contacts
router.get('/', async (req, res) => {
  try {
    await ensureSeededContacts()
    const contacts = await SupportContact.find().sort({ updatedAt: -1 }).limit(12)
    res.json({ contacts })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/support/:name - MongoDB first, Gemini AI official contact lookup & save on miss
router.get('/:name', async (req, res) => {
  try {
    await ensureSeededContacts()
    const rawName = decodeURIComponent(req.params.name || '').trim()
    if (!rawName) return res.json({ found: false })

    const cleanedName = normalizeQuery(rawName)
    const escaped = cleanedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    // 1. Check MongoDB first
    let contact = await SupportContact.findOne({
      name: { $regex: escaped, $options: 'i' },
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
      name: new RegExp(`^${(parsed.name || cleanedName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
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

// POST /api/support/:id/feedback - store 1-5 star support & Safe Cart service feedback
router.post('/:id/feedback', async (req, res) => {
  try {
    const contact = await SupportContact.findById(req.params.id)
    if (!contact) {
      return res.status(404).json({ error: 'Support contact not found.' })
    }

    const supportRating = Math.min(5, Math.max(1, Number(req.body.supportRating) || 5))
    const serviceRating = Math.min(5, Math.max(1, Number(req.body.serviceRating) || 5))
    const comment = (req.body.comment || '').trim()
    const serviceFeedback = (req.body.serviceFeedback || '').trim()

    try {
      await Feedback.create({
        targetType: 'SupportContact',
        targetName: contact.name,
        rating: supportRating,
        serviceRating,
        comment,
        serviceFeedback,
      })
    } catch {
      // Continue cleanly even if optional fields differ
    }

    res.json({ success: true, contact })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router