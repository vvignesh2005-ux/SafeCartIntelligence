const express = require('express')
const router = express.Router()
const Complaint = require('../models/Complaint')
const { generateComplaintText } = require('../ai')

// POST /api/complaints - generate a letter with AI and save it
router.post('/', async (req, res) => {
  try {
    const { orderId, platform, issue } = req.body

    const generatedText = await generateComplaintText(orderId, platform, issue)

    const newComplaint = new Complaint({ orderId, platform, issue, generatedText })
    await newComplaint.save()

    res.json({ success: true, complaint: newComplaint })
  } catch (err) {
    console.error('Complaint error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router