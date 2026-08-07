const mongoose = require('mongoose')

const sellerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  platformType: String,
  yearsInBusiness: Number,
  productsSold: String,
  contact: String,
  ratings: {
    businessVerification: { type: Number, default: 0 },
    customerSatisfaction: { type: Number, default: 0 },
    deliveryReliability: { type: Number, default: 0 },
    customerSupport: { type: Number, default: 0 },
    refundExperience: { type: Number, default: 0 },
    reviewAuthenticity: { type: Number, default: 0 },
  },
  positiveReview: String,
  negativeReview: String,
}, { timestamps: true })

module.exports = mongoose.model('Seller', sellerSchema)