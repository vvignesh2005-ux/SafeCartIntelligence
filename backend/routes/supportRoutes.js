const express = require('express')
const router = express.Router()
const SupportContact = require('../models/SupportContact')

// GET /api/support/:name - search for support contact by name
router.get('/:name', async (req, res) => {
  try {
    const contact = await SupportContact.findOne({
      name: { $regex: req.params.name, $options: 'i' },
    })

    if (!contact) {
      return res.json({ found: false })
    }

    res.json({ found: true, contact })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/support - create a new support contact (for testing/seeding data)
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