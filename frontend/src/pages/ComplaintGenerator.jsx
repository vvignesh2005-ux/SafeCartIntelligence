import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Copy, Download, Send } from 'lucide-react'

function ComplaintGenerator() {
  const [orderId, setOrderId] = useState('')
  const [issue, setIssue] = useState('')
  const [platform, setPlatform] = useState('')
  const [generatedText, setGeneratedText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!orderId || !issue || !platform) return
    setLoading(true)

    const res = await fetch('http://localhost:5000/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, platform, issue }),
    })
    const data = await res.json()

    setGeneratedText(data.complaint.generatedText)
    setLoading(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText)
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
          <button className="generate-btn" onClick={handleGenerate} disabled={loading}>
            <Send size={16} /> {loading ? 'Generating...' : 'Generate Complaint'}
          </button>
        </div>
      </div>

      {generatedText && (
        <div className="trust-card">
          <div className="trust-card-header">
            <FileText size={22} />
            <h2>Generated Complaint</h2>
          </div>

          <div className="generated-text">
            {generatedText.split('\n').map((line, i) => (
              <p key={i}>{line || '\u00A0'}</p>
            ))}
          </div>

          <div className="complaint-actions">
            <button className="copy-btn" onClick={copyToClipboard}>
              <Copy size={14} /> Copy
            </button>
            <button className="action-btn"><Download size={14} /> Download PDF</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ComplaintGenerator