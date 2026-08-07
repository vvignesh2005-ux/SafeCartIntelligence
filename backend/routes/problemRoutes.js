const express = require('express')
const router = express.Router()
const Problem = require('../models/Problem')
const Solution = require('../models/Solution')

// POST /api/problems - submit a new problem, get back best solution or ask AI
router.post('/', async (req, res) => {
  try {
    const { problemText, platform, category } = req.body

    // Save the problem
    const newProblem = new Problem({ problemText, platform, category })
    await newProblem.save()

    // Look for existing solutions matching category + platform
    const existingSolutions = await Solution.find()
      .populate({
        path: 'problemId',
        match: { category, platform },
      })

    // Filter out solutions where problemId didn't match (populate returns null if no match)
    const matched = existingSolutions.filter((s) => s.problemId !== null)

    if (matched.length > 0) {
      // Sort by success rate (solvedCount is highest priority)
      matched.sort((a, b) => b.solvedCount - a.solvedCount)
      return res.json({ found: true, solution: matched[0], problemId: newProblem._id })
    }

    // No existing solution found
    return res.json({ found: false, problemId: newProblem._id })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// POST /api/problems/solution - save a new solution for a problem
router.post('/solution', async (req, res) => {
  try {
    const { problemId, steps, source } = req.body

    const newSolution = new Solution({
      problemId,
      steps,
      source: source || 'ai',
    })

    await newSolution.save()

    res.json({ success: true, solution: newSolution })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// POST /api/problems/feedback - submit feedback on a solution
router.post('/feedback', async (req, res) => {
  try {
    const { solutionId, result, whichStepWorked } = req.body

    // Save the feedback record
    const Feedback = require('../models/Feedback')
    const newFeedback = new Feedback({ solutionId, result, whichStepWorked })
    await newFeedback.save()

    // Update the solution's counters
    const updateField =
      result === 'solved' ? 'solvedCount' :
      result === 'partial' ? 'partialCount' : 'failedCount'

    const updatedSolution = await Solution.findByIdAndUpdate(
      solutionId,
      { $inc: { [updateField]: 1 } },
      { returnDocument: 'after' }
    )

    res.json({ success: true, solution: updatedSolution })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
