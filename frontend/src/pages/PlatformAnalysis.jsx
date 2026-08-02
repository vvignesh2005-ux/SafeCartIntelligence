import { Link } from 'react-router-dom'
import { Globe, TrendingUp, Truck, MessageSquare, AlertTriangle } from 'lucide-react'

function PlatformAnalysis() {
  const metrics = [
    { label: "Public Reputation", value: "Generally Positive" },
    { label: "Customer Satisfaction", value: "72% positive mentions" },
    { label: "Delivery Performance", value: "Usually on time" },
    { label: "Support Quality", value: "Mixed reviews" },
    { label: "Average Return Experience", value: "Moderate difficulty" },
    { label: "Average Refund Time", value: "7-10 business days" },
  ]

  const complaints = [
    "Delayed refunds for cancelled orders",
    "Difficulty reaching live support",
    "Inconsistent product quality across sellers",
  ]

  return (
    <div className="dashboard">
      <Link to="/" className="back-link">← Back to Home</Link>
      <h1 className="dashboard-title">Platform: ExampleMarket</h1>

      <div className="trust-card">
        <div className="trust-card-header">
          <Globe size={24} />
          <h2>Platform Overview — AI Analysis</h2>
        </div>

        <div className="metrics-list">
          {metrics.map((m, i) => (
            <div className="metric-row" key={i}>
              <span className="metric-label">{m.label}</span>
              <span className="metric-value">{m.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="trust-card">
        <div className="trust-card-header">
          <AlertTriangle size={24} />
          <h2>Common Complaints</h2>
        </div>
        <ul className="complaint-list">
          {complaints.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>

      <div className="trust-card">
        <div className="trust-card-header">
          <MessageSquare size={24} />
          <h2>AI Generated Review Summary</h2>
        </div>
        <p className="ai-summary">
          Based on available data, this platform shows generally reliable delivery performance,
          but customers report friction during refund and cancellation processes. Support
          responsiveness varies by seller rather than the platform itself.
        </p>
      </div>
    </div>
  )
}

export default PlatformAnalysis