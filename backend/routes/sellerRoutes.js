const express = require('express')
const router = express.Router()
const { GoogleGenAI } = require('@google/genai')
const Seller = require('../models/Seller')

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const COMMON_SELLERS = [
  {
    name: 'Cocoblu Retail',
    platformType: 'Amazon India Authorized Seller',
    yearsInBusiness: 5,
    productsSold: 'Apparel, Books, Home & Everyday Essentials',
    contact: 'Amazon Seller Profile & GST Tax Invoice',
    rating: 4.4,
    fulfillmentRate: 95,
    avgRefundDays: 4,
    evidenceCount: 342,
    aiGenerated: false,
    ratings: {
      businessVerification: 5,
      customerSatisfaction: 4.3,
      deliveryReliability: 4.6,
      customerSupport: 4.2,
      refundExperience: 4.4,
      reviewAuthenticity: 4.5,
    },
    positiveReview: 'Fast FBA shipping, authentic GST-billed items, and smooth Amazon-backed returns.',
    negativeReview: 'Occasional outer packaging wear during peak sale events.',
    notes: [
      'Major authorized Amazon.in merchant with FBA warehouse fulfillment.',
      'Consistent GST invoice generation and standard 7–10 day return compliance.',
    ],
  },
  {
    name: 'Clicktech Retail',
    platformType: 'Amazon India Authorized Seller',
    yearsInBusiness: 4,
    productsSold: 'Smartphones, Electronics, Laptops & Accessories',
    contact: 'Amazon Seller Profile & Brand Warranty Portal',
    rating: 4.2,
    fulfillmentRate: 93,
    avgRefundDays: 5,
    evidenceCount: 289,
    aiGenerated: false,
    ratings: {
      businessVerification: 5,
      customerSatisfaction: 4.1,
      deliveryReliability: 4.4,
      customerSupport: 4.0,
      refundExperience: 4.1,
      reviewAuthenticity: 4.3,
    },
    positiveReview: 'Genuine brand-sealed electronics with valid manufacturer warranty and Open-Box delivery.',
    negativeReview: 'Replacement approvals for high-value electronics require brand technician verification.',
    notes: [
      'High-volume electronics seller on Amazon India; always record an unboxing video.',
      'Valid GSTIN for brand service center warranty claims.',
    ],
  },
  {
    name: 'VRP Telematics',
    platformType: 'Amazon India Authorized Seller',
    yearsInBusiness: 6,
    productsSold: 'Mobile Phones, Wearables, Audio & Smart Devices',
    contact: 'Amazon Seller Profile & GST Invoice',
    rating: 4.3,
    fulfillmentRate: 94,
    avgRefundDays: 5,
    evidenceCount: 215,
    aiGenerated: false,
    ratings: {
      businessVerification: 5,
      customerSatisfaction: 4.2,
      deliveryReliability: 4.5,
      customerSupport: 4.1,
      refundExperience: 4.2,
      reviewAuthenticity: 4.4,
    },
    positiveReview: 'Authentic serial-numbered devices and reliable Prime dispatch.',
    negativeReview: 'Strict inspection required before return pickup on mobile devices.',
    notes: [
      'Verified electronics seller on Amazon.in with Prime fulfillment.',
      'Check IMEI/serial number on the GST invoice immediately upon delivery.',
    ],
  },
  {
    name: 'ExampleStore',
    platformType: 'Verified Direct D2C & Marketplace Store',
    yearsInBusiness: 4,
    productsSold: 'Consumer Electronics & Accessories',
    contact: 'support@examplestore.in',
    rating: 4.3,
    fulfillmentRate: 94,
    avgRefundDays: 4,
    evidenceCount: 128,
    aiGenerated: false,
    ratings: {
      businessVerification: 4.6,
      customerSatisfaction: 4.3,
      deliveryReliability: 4.5,
      customerSupport: 4.1,
      refundExperience: 4.2,
      reviewAuthenticity: 4.4,
    },
    positiveReview: 'Tracked courier dispatch within 24 hours and clear GST billing.',
    negativeReview: 'Email support replies can take up to 24 hours on weekends.',
    notes: [
      'GST & warehouse details logged; 94% on-time delivery across 128 buyer reports.',
      'Refunds credited within 4 business days after pickup scan.',
    ],
  },
]

async function ensureSeededSellers() {
  for (const item of COMMON_SELLERS) {
    const exists = await Seller.findOne({
      name: { $regex: `^${item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    })
    if (!exists) {
      await Seller.create(item)
    }
  }
}

async function generateSellerFromGemini(sellerName) {
  const prompt = `Research and summarize publicly known online buyer reviews, marketplace reputation, delivery reliability, and refund experience for the online seller or store "${sellerName}" (especially in India if applicable).
Respond ONLY with valid JSON (no markdown fences) matching this exact structure:
{
  "name": "${sellerName}",
  "platformType": "e.g., Amazon India Seller / Instagram Store / D2C Website",
  "yearsInBusiness": 3,
  "productsSold": "Main product categories sold",
  "contact": "How buyers reach support or verify GST/contact",
  "rating": 3.8,
  "fulfillmentRate": 85,
  "avgRefundDays": 6,
  "positiveReview": "One concise sentence summarizing common positive buyer feedback",
  "negativeReview": "One concise sentence summarizing common buyer complaints or risks",
  "notes": [
    "Key factual observation 1 from online buyer reviews",
    "Key factual observation 2 about returns, authenticity, or support"
  ]
}`

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: prompt,
  })

  const rawText = (response.text || '').replace(/```json|```/gi, '').trim()
  const parsed = JSON.parse(rawText)

  const baseRating = Math.min(5, Math.max(1, Number(parsed.rating) || 3.8))
  return {
    name: parsed.name || sellerName,
    platformType: parsed.platformType || 'Online Seller / Storefront',
    yearsInBusiness: Number(parsed.yearsInBusiness) || 2,
    productsSold: parsed.productsSold || 'Consumer Goods',
    contact: parsed.contact || 'Verify via platform order invoice',
    rating: baseRating,
    fulfillmentRate: Math.min(100, Math.max(10, Number(parsed.fulfillmentRate) || 85)),
    avgRefundDays: Math.max(1, Number(parsed.avgRefundDays) || 6),
    evidenceCount: 1,
    aiGenerated: true,
    ratings: {
      businessVerification: baseRating,
      customerSatisfaction: baseRating,
      deliveryReliability: baseRating,
      customerSupport: baseRating,
      refundExperience: baseRating,
      reviewAuthenticity: baseRating,
    },
    positiveReview: parsed.positiveReview || 'Mixed online buyer feedback; verify seller invoice.',
    negativeReview: parsed.negativeReview || 'Limited independent return logs; record unboxing video.',
    notes: Array.isArray(parsed.notes) && parsed.notes.length > 0
      ? parsed.notes
      : ['Synthesized from public online buyer reviews via Gemini AI.'],
  }
}

// GET /api/sellers - list common/popular sellers for quick search chips
router.get('/', async (req, res) => {
  try {
    await ensureSeededSellers()
    const sellers = await Seller.find().sort({ evidenceCount: -1, updatedAt: -1 }).limit(12)
    res.json({ sellers })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/sellers/:name - search MongoDB first, else research with Gemini & save
router.get('/:name', async (req, res) => {
  try {
    await ensureSeededSellers()
    const rawName = decodeURIComponent(req.params.name).trim()
    const escaped = rawName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    let seller = await Seller.findOne({
      name: { $regex: `^${escaped}$`, $options: 'i' },
    })

    if (!seller) {
      seller = await Seller.findOne({
        name: { $regex: escaped, $options: 'i' },
      })
    }

    if (seller) {
      return res.json({ found: true, seller, aiGenerated: false })
    }

    // Not in database yet -> generate from online review intelligence via Gemini and store
    const aiData = await generateSellerFromGemini(rawName)
    const savedSeller = await Seller.create(aiData)
    return res.json({ found: true, seller: savedSeller, aiGenerated: true })
  } catch (err) {
    console.error('Seller lookup/AI error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/sellers - create or update a seller record with new buyer evidence
router.post('/', async (req, res) => {
  try {
    const cleanName = (req.body.name || '').trim()
    if (!cleanName) {
      return res.status(400).json({ error: 'Seller name is required.' })
    }

    const escaped = cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    let existing = await Seller.findOne({ name: { $regex: `^${escaped}$`, $options: 'i' } })

    const incomingRating = Math.min(5, Math.max(1, Number(req.body.rating) || 4))
    const incomingNote = Array.isArray(req.body.notes) ? req.body.notes[0] : req.body.summary

    if (existing) {
      const totalCount = existing.evidenceCount || 1
      const newAvg = Number(
        ((existing.rating * totalCount + incomingRating) / (totalCount + 1)).toFixed(1)
      )
      existing.rating = newAvg
      existing.evidenceCount = totalCount + 1
      if (req.body.avgRefundDays) {
        existing.avgRefundDays = Math.round(
          (existing.avgRefundDays * totalCount + Number(req.body.avgRefundDays)) / (totalCount + 1)
        )
      }
      if (incomingNote) existing.notes.unshift(incomingNote)
      existing.userReviews.unshift({
        sellerRating: incomingRating,
        serviceRating: Number(req.body.serviceRating) || 5,
        comment: incomingNote || '',
        serviceFeedback: req.body.serviceFeedback || '',
      })
      await existing.save()
      return res.json({ success: true, seller: existing })
    }

    const newSeller = await Seller.create({
      ...req.body,
      name: cleanName,
      rating: incomingRating,
      evidenceCount: 1,
      notes: incomingNote ? [incomingNote] : [],
    })
    res.json({ success: true, seller: newSeller })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/sellers/:id/feedback - save 1-5 star seller rating & Safe Cart service feedback
router.post('/:id/feedback', async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id)
    if (!seller) {
      return res.status(404).json({ error: 'Seller record not found.' })
    }

    const sellerRating = Math.min(5, Math.max(1, Number(req.body.sellerRating) || 5))
    const serviceRating = Math.min(5, Math.max(1, Number(req.body.serviceRating) || 5))
    const comment = (req.body.comment || '').trim()
    const serviceFeedback = (req.body.serviceFeedback || '').trim()

    const total = seller.evidenceCount || 1
    seller.rating = Number(((seller.rating * total + sellerRating) / (total + 1)).toFixed(1))
    seller.evidenceCount = total + 1
    if (comment) {
      seller.notes.unshift(comment)
    }
    seller.userReviews.unshift({
      sellerRating,
      serviceRating,
      comment,
      serviceFeedback,
    })

    await seller.save()
    res.json({ success: true, seller })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router