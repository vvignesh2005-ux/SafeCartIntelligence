const express = require('express')
const router = express.Router()
const Platform = require('../models/Platform')

// GET /api/platforms/:name - search for a platform by name
router.get('/:name', async (req, res) => {
  try {
    const platform = await Platform.findOne({
      name: { $regex: req.params.name, $options: 'i' },
    })

    if (!platform) {
      return res.json({ found: false })
    }

    res.json({ found: true, platform })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/platforms - create a new platform (for testing/seeding data)
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