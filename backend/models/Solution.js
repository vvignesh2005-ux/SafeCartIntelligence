const mongoose = require('mongoose')

const solutionSchema = new mongoose.Schema({
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
  },
  steps: {
    type: [String],
    required: true,
  },
  source: {
    type: String,
    enum: ['ai', 'verified'],
    default: 'ai',
  },
  solvedCount: {
    type: Number,
    default: 0,
  },
  partialCount: {
    type: Number,
    default: 0,
  },
  failedCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true })

module.exports = mongoose.model('Solution', solutionSchema)