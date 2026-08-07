const mongoose = require('mongoose')

const problemSchema = new mongoose.Schema({
  problemText: {
    type: String,
    required: true,
  },
  platform: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
}, { timestamps: true })

module.exports = mongoose.model('Problem', problemSchema)