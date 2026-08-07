const mongoose = require('mongoose')

const platformSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  ratings: {
    publicReputation: { type: Number, default: 0 },
    customerSatisfaction: { type: Number, default: 0 },
    deliveryPerformance: { type: Number, default: 0 },
    supportQuality: { type: Number, default: 0 },
    returnExperience: { type: Number, default: 0 },
    refundSpeed: { type: Number, default: 0 },
  },
  averageRefundTime: String,
  commonComplaints: [String],
  aiSummary: String,
}, { timestamps: true })

module.exports = mongoose.model('Platform', platformSchema)