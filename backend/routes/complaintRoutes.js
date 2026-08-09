const express = require('express')
const router = express.Router()
const Complaint = require('../models/Complaint')

// POST /api/complaints - generate and save a new complaint
router.post('/', async (req, res) => {
  try {
    const { orderId, platform, issue } = req.body

    const generatedText = `To Whom It May Concern,

I am writing to formally report an issue regarding my order (Order ID: ${orderId}) placed on ${platform}. The issue I encountered is as follows: ${issue}

I request that this matter be reviewed and resolved at the earliest, in accordance with your platform's customer protection policies. I appreciate your prompt attention to this matter.

Sincerely,
A Concerned Customer`

    const newComplaint = new Complaint({ orderId, platform, issue, generatedText })
    await newComplaint.save()

    res.json({ success: true, complaint: newComplaint })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router