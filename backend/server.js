require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const problemRoutes = require('./routes/problemRoutes')

const app = express()
const PORT = 5000

app.use(express.json())

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err))

app.get('/', (req, res) => {
  res.send('Safe Cart Intelligence backend is running!')
})

app.use('/api/problems', problemRoutes)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})