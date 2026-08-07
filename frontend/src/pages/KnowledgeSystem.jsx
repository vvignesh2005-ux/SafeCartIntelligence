import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, Brain, Lightbulb, User, Database, Users } from 'lucide-react'

function KnowledgeSystem() {
  const [problemText, setProblemText] = useState('')
  const [platform, setPlatform] = useState('')
  const [category, setCategory] = useState('')
  const [problemId, setProblemId] = useState(null)
  const [solution, setSolution] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [selectedStep, setSelectedStep] = useState(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const flowSteps = [
    { icon: <Lightbulb size={22} />, label: "Problem" },
    { icon: <Brain size={22} />, label: "AI Analysis" },
    { icon: <Lightbulb size={22} />, label: "Solution Generated" },
    { icon: <User size={22} />, label: "User Performs Steps" },
  ]

  const handleSubmitProblem = async () => {
    if (!problemText || !platform || !category) return
    setLoading(true)

    const res = await fetch('http://localhost:5000/api/problems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problemText, platform, category }),
    })
    const data = await res.json()

    setProblemId(data.problemId)

    if (data.found) {
      setSolution(data.solution)
    } else {
      // No existing solution — ask "AI" (sample steps for now) and save it
      const aiSteps = [
        "Check your order status in My Orders.",
        "Contact the seller directly through the platform's chat.",
        "If unresolved in 48 hours, escalate to platform support.",
        "File a formal complaint if no response after escalation.",
      ]

      const solutionRes = await fetch('http://localhost:5000/api/problems/solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: data.problemId, steps: aiSteps, source: 'ai' }),
      })
      const solutionData = await solutionRes.json()
      setSolution(solutionData.solution)
    }

    setLoading(false)
  }

  const handleSave = async () => {
    if (!solution || !feedback) return

    const result = feedback === 'full' ? 'solved' : feedback === 'partial' ? 'partial' : 'not_solved'

    await fetch('http://localhost:5000/api/problems/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        solutionId: solution._id,
        result,
        whichStepWorked: selectedStep,
      }),
    })

    setSaved(true)
  }

  return (
    <div className="dashboard">
      <Link to="/" className="back-link">← Back to Home</Link>
      <h1 className="dashboard-title">Knowledge Learning System</h1>
      <p className="guide-subtitle">
        This platform improves over time using verified customer experiences.
      </p>

      <div className="trust-card">
        <div className="flow-diagram">
          {flowSteps.map((step, i) => (
            <div key={i}>
              <div className="flow-step">
                <div className="flow-icon">{step.icon}</div>
                <span>{step.label}</span>
              </div>
              {i < flowSteps.length - 1 && <ArrowDown className="flow-arrow" size={20} />}
            </div>
          ))}
        </div>
      </div>

      {!solution && (
        <div className="trust-card">
          <div className="complaint-form">
            <input
              type="text"
              placeholder="Describe your problem..."
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
            />
            <input
              type="text"
              placeholder="Platform (e.g., Amazon)"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            />
            <input
              type="text"
              placeholder="Category (e.g., refund, delivery, cancellation)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <button className="generate-btn" onClick={handleSubmitProblem} disabled={loading}>
              {loading ? 'Finding Solution...' : 'Submit Problem'}
            </button>
          </div>
        </div>
      )}

      {solution && (
        <div className="trust-card">
          <h2 className="feedback-question">Suggested Solution:</h2>
          <div className="steps-container">
            {solution.steps.map((step, i) => (
              <div className="step-card" key={i}>
                <div className="step-number">{i + 1}</div>
                <p>{step}</p>
              </div>
            ))}
          </div>

          <h2 className="feedback-question">Did your issue get solved?</h2>
          <div className="feedback-buttons">
            <button
              className={`feedback-btn ${feedback === 'full' ? 'active' : ''}`}
              onClick={() => setFeedback('full')}
            >
              😊 Completely Solved
            </button>
            <button
              className={`feedback-btn ${feedback === 'partial' ? 'active' : ''}`}
              onClick={() => setFeedback('partial')}
            >
              😐 Partially Solved
            </button>
            <button
              className={`feedback-btn ${feedback === 'none' ? 'active' : ''}`}
              onClick={() => setFeedback('none')}
            >
              ☹ Not Solved
            </button>
          </div>

          {(feedback === 'full' || feedback === 'partial') && !saved && (
            <div className="step-select">
              <p>Which step worked?</p>
              <div className="step-options">
                {solution.steps.map((_, i) => (
                  <button
                    key={i}
                    className={`step-option ${selectedStep === i + 1 ? 'active' : ''}`}
                    onClick={() => setSelectedStep(i + 1)}
                  >
                    Step {i + 1}
                  </button>
                ))}
              </div>
              {selectedStep && (
                <button className="generate-btn" onClick={handleSave}>
                  Save Verified Solution
                </button>
              )}
            </div>
          )}

          {feedback === 'none' && !saved && (
            <button className="generate-btn" onClick={handleSave} style={{ marginTop: '16px' }}>
              Submit Feedback
            </button>
          )}

          {saved && (
            <div className="knowledge-updated">
              <div className="ku-row">
                <Database size={18} />
                <span>Knowledge Base Updated</span>
              </div>
              <div className="ku-row">
                <Users size={18} />
                <span>Future Users Receive Verified Solution First</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default KnowledgeSystem