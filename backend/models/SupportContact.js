const mongoose = require('mongoose')

const supportContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: String,
  email: String,
  website: String,
  liveChatAvailable: {
    type: Boolean,
    default: false,
  },
  supportHours: String,
  verified: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true })

module.exports = mongoose.model('SupportContact', supportContactSchema)