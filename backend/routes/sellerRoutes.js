const express = require('express')
const router = express.Router()
const Seller = require('../models/Seller')

// GET /api/sellers/:name - search for a seller by name
router.get('/:name', async (req, res) => {
  try {
    const seller = await Seller.findOne({
      name: { $regex: req.params.name, $options: 'i' },
    })

    if (!seller) {
      return res.json({ found: false })
    }

    res.json({ found: true, seller })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/sellers - create a new seller (for testing/seeding data)
router.post('/', async (req, res) => {
  try {
    const newSeller = new Seller(req.body)
    await newSeller.save()
    res.json({ success: true, seller: newSeller })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router