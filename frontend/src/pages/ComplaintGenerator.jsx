import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Copy, Download, Send } from 'lucide-react'

function ComplaintGenerator() {
  const [orderId, setOrderId] = useState('')
  const [issue, setIssue] = useState('')
  const [platform, setPlatform] = useState('')
  const [generated, setGenerated] = useState(false)

  const handleGenerate = () => {
    if (orderId && issue && platform) {
      setGenerated(true)
    }
  }

  return (
    <div className="dashboard">
      <Link to="/" className="back-link">← Back to Home</Link>
      <h1 className="dashboard-title">Complaint Generator</h1>
      <p className="guide-subtitle">Fill in your order details to generate a professional complaint.</p>

      <div className="trust-card">
        <div className="complaint-form">
          <input
            type="text"
            placeholder="Order ID"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Platform (e.g., Amazon, Instagram Seller)"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          />
          <textarea
            placeholder="Describe your issue..."
            rows={4}
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
          />
          <button className="generate-btn" onClick={handleGenerate}>
            <Send size={16} /> Generate Complaint
          </button>
        </div>
      </div>

      {generated && (
        <div className="trust-card">
          <div className="trust-card-header">
            <FileText size={22} />
            <h2>Generated Complaint</h2>
          </div>

          <div className="generated-text">
            <p>To Whom It May Concern,</p>
            <p>
              I am writing to formally report an issue regarding my order (Order ID: {orderId}) placed on {platform}.
              The issue I encountered is as follows: {issue}
            </p>
            <p>
              I request that this matter be reviewed and resolved at the earliest, in accordance with your platform's
              customer protection policies. I appreciate your prompt attention to this matter.
            </p>
            <p>Sincerely,<br />A Concerned Customer</p>
          </div>

          <div className="complaint-actions">
            <button className="copy-btn"><Copy size={14} /> Copy</button>
            <button className="action-btn"><Download size={14} /> Download PDF</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ComplaintGenerator