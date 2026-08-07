import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Globe, MessageSquare, AlertTriangle, Search } from 'lucide-react'

function PlatformAnalysis() {
  const [platformName, setPlatformName] = useState('')
  const [platform, setPlatform] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!platformName) return
    setLoading(true)
    setNotFound(false)

    const res = await fetch(`http://localhost:5000/api/platforms/${platformName}`)
    const data = await res.json()

    if (data.found) {
      setPlatform(data.platform)
    } else {
      setPlatform(null)
      setNotFound(true)
    }

    setLoading(false)
  }

  const renderStars = (count) => {
    return "★".repeat(count) + "☆".repeat(5 - count)
  }

  const ratingLabels = {
    publicReputation: "Public Reputation",
    customerSatisfaction: "Customer Satisfaction",
    deliveryPerformance: "Delivery Performance",
    supportQuality: "Support Quality",
    returnExperience: "Return Experience",
    refundSpeed: "Refund Speed",
  }

  return (
    <div className="dashboard">
      <Link to="/" className="back-link">← Back to Home</Link>
      <h1 className="dashboard-title">Platform Purchase Analysis</h1>

      <div className="support-search-bar">
        <input
          type="text"
          placeholder="Search platform name..."
          value={platformName}
          onChange={(e) => setPlatformName(e.target.value)}
        />
        <button onClick={handleSearch}><Search size={18} /></button>
      </div>

      {loading && <p>Searching...</p>}

      {notFound && (
        <div className="trust-card">
          <p>No platform found with that name. Try "ExampleMarket" (test data).</p>
        </div>
      )}

      {platform && (
        <>
          <div className="trust-card">
            <div className="trust-card-header">
              <Globe size={24} />
              <h2>{platform.name} — AI Analysis</h2>
            </div>

            <div className="ratings-grid">
              {Object.entries(platform.ratings).map(([key, value]) => (
                <div className="rating-row" key={key}>
                  <span className="rating-label">{ratingLabels[key]}</span>
                  <span className="rating-stars">{renderStars(value)}</span>
                </div>
              ))}
            </div>

            <div className="metric-row" style={{ marginTop: '14px' }}>
              <span className="metric-label">Average Refund Time</span>
              <span className="metric-value">{platform.averageRefundTime}</span>
            </div>
          </div>

          <div className="trust-card">
            <div className="trust-card-header">
              <AlertTriangle size={24} />
              <h2>Common Complaints</h2>
            </div>
            <ul className="complaint-list">
              {platform.commonComplaints.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>

          <div className="trust-card">
            <div className="trust-card-header">
              <MessageSquare size={24} />
              <h2>AI Generated Review Summary</h2>
            </div>
            <p className="ai-summary">{platform.aiSummary}</p>
          </div>
        </>
      )}
    </div>
  )
}

export default PlatformAnalysis