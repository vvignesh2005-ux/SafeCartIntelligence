const mongoose = require('mongoose')

const complaintSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
  },
  platform: {
    type: String,
    required: true,
  },
  issue: {
    type: String,
    required: true,
  },
  generatedText: {
    type: String,
    required: true,
  },
}, { timestamps: true })

module.exports = mongoose.model('Complaint', complaintSchema)