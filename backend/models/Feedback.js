const mongoose = require('mongoose')

const feedbackSchema = new mongoose.Schema({
  solutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Solution',
    required: true,
  },
  result: {
    type: String,
    enum: ['solved', 'partial', 'not_solved'],
    required: true,
  },
  whichStepWorked: {
    type: Number,
    default: null,
  },
}, { timestamps: true })

module.exports = mongoose.model('Feedback', feedbackSchema)