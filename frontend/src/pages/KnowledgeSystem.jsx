import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, Brain, Lightbulb, User, Database, Users } from 'lucide-react'

function KnowledgeSystem() {
  const [feedback, setFeedback] = useState(null)
  const [selectedStep, setSelectedStep] = useState(null)
  const [saved, setSaved] = useState(false)

  const flowSteps = [
    { icon: <Lightbulb size={22} />, label: "Problem" },
    { icon: <Brain size={22} />, label: "AI Analysis" },
    { icon: <FileTextIcon />, label: "Solution Generated" },
    { icon: <User size={22} />, label: "User Performs Steps" },
  ]

  function FileTextIcon() {
    return <Lightbulb size={22} />
  }

  const handleSave = () => {
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

      <div className="trust-card">
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
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  className={`step-option ${selectedStep === num ? 'active' : ''}`}
                  onClick={() => setSelectedStep(num)}
                >
                  Step {num}
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
    </div>
  )
}

export default KnowledgeSystem