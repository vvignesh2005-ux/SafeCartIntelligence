const mongoose = require('mongoose')

const sellerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    platformType: { type: String, default: 'Marketplace / Online Store' },
    yearsInBusiness: { type: Number, default: 2 },
    productsSold: { type: String, default: 'General Consumer Goods' },
    contact: { type: String, default: 'Verify via Marketplace Seller Page' },
    rating: { type: Number, default: 4.0 },
    fulfillmentRate: { type: Number, default: 88 },
    avgRefundDays: { type: Number, default: 5 },
    evidenceCount: { type: Number, default: 1 },
    aiGenerated: { type: Boolean, default: false },
    ratings: {
      businessVerification: { type: Number, default: 4 },
      customerSatisfaction: { type: Number, default: 4 },
      deliveryReliability: { type: Number, default: 4 },
      customerSupport: { type: Number, default: 4 },
      refundExperience: { type: Number, default: 4 },
      reviewAuthenticity: { type: Number, default: 4 },
    },
    positiveReview: String,
    negativeReview: String,
    notes: {
      type: [String],
      default: [],
    },
    userReviews: [
      {
        sellerRating: { type: Number, min: 1, max: 5, required: true },
        serviceRating: { type: Number, min: 1, max: 5, default: 5 },
        comment: String,
        serviceFeedback: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
)

module.exports = mongoose.model('Seller', sellerSchema)