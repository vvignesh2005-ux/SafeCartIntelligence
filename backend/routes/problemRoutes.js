const { generateSolutionSteps } = require('../ai')
const express = require('express')
const router = express.Router()
const Problem = require('../models/Problem')
const Solution = require('../models/Solution')
const Feedback = require('../models/Feedback')

// POST /api/problems - merge common issues, rank #1 user-verified solution, or generate new AI playbook
router.post('/', async (req, res) => {
  try {
    const { problemText, platform, category } = req.body

    if (!problemText || !platform || !category) {
      return res.status(400).json({ error: 'problemText, platform, and category are required' })
    }

    const cleanPlatform = platform.trim()
    const cleanCategory = category.trim()

    // 1. Check if a common problem already exists for this platform + category
    const matchingProblems = await Problem.find({
      platform: new RegExp(`^${cleanPlatform}$`, 'i'),
      category: new RegExp(`^${cleanCategory}$`, 'i'),
    })

    let activeProblem

    if (matchingProblems.length > 0) {
      // Reuse the canonical common problem so individual reports consolidate into one
      activeProblem = matchingProblems[0]
      await Problem.findByIdAndUpdate(activeProblem._id, {
        $inc: { reportCount: 1 },
        $set: { lastReportedText: problemText.trim() },
      })

      const problemIds = matchingProblems.map((p) => p._id)
      const matchedSolutions = await Solution.find({ problemId: { $in: problemIds } })

      if (matchedSolutions.length > 0) {
        // Rank #1 by net user verification score (solved - failed), then highest solvedCount
        matchedSolutions.sort((a, b) => {
          const scoreA = (a.solvedCount || 0) - (a.failedCount || 0)
          const scoreB = (b.solvedCount || 0) - (b.failedCount || 0)
          if (scoreB !== scoreA) return scoreB - scoreA
          return (b.solvedCount || 0) - (a.solvedCount || 0)
        })

        return res.json({
          found: true,
          mergedCommonIssue: true,
          solution: matchedSolutions[0],
          allSolutions: matchedSolutions,
          problemId: activeProblem._id,
        })
      }
    } else {
      // Create a new canonical problem record
      activeProblem = new Problem({
        problemText: problemText.trim(),
        platform: cleanPlatform,
        category: cleanCategory,
        reportCount: 1,
      })
      await activeProblem.save()
    }

    // 2. No verified solution exists yet — generate structured playbook via Gemini AI
    const aiSteps = await generateSolutionSteps(problemText, cleanPlatform, cleanCategory)

    const newSolution = new Solution({
      problemId: activeProblem._id,
      steps: aiSteps,
      source: 'ai',
      solvedCount: 0,
      partialCount: 0,
      failedCount: 0,
    })
    await newSolution.save()

    return res.json({
      found: true,
      solution: newSolution,
      problemId: activeProblem._id,
      aiGenerated: true,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/problems/solution - save a user-contributed or AI-formatted solution
router.post('/solution', async (req, res) => {
  try {
    const { problemId, steps, source } = req.body

    const newSolution = new Solution({
      problemId,
      steps,
      source: source || 'user-verified',
      solvedCount: source === 'user' ? 1 : 0,
    })

    await newSolution.save()
    res.json({ success: true, solution: newSolution })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/problems/feedback - record user verification & boost top-performing solution
router.post('/feedback', async (req, res) => {
  try {
    const { solutionId, result, whichStepWorked } = req.body

const parsedStep =
  typeof whichStepWorked === 'number'
    ? whichStepWorked
    : Number(String(whichStepWorked || '').replace(/\D/g, '')) || null

const newFeedback = new Feedback({
  solutionId,
  result,
  whichStepWorked: parsedStep
})

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