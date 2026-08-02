import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RotateCcw, CheckCircle, Clock, AlertCircle } from 'lucide-react'

function ReturnGuide() {
  const [activeTab, setActiveTab] = useState('Return')

  const tabs = ['Return', 'Refund', 'Replacement', 'Cancellation']

  const stepsData = {
    Return: [
      "Go to 'My Orders' and select the item you want to return.",
      "Tap 'Return Item' and choose a reason for the return.",
      "Schedule a pickup or drop it off at the nearest center.",
      "Track your return status until it's marked as received.",
    ],
    Refund: [
      "Once your return is received, refund processing begins.",
      "Refunds are usually sent to your original payment method.",
      "Check your bank statement after the estimated processing time.",
      "Contact support if refund isn't received after the window.",
    ],
    Replacement: [
      "Select 'Replace Item' instead of 'Return' on your order.",
      "Confirm the issue (damaged, wrong item, size, etc).",
      "A replacement is shipped once the original item is picked up.",
      "Track your replacement like a new order.",
    ],
    Cancellation: [
      "Go to 'My Orders' before the item ships.",
      "Tap 'Cancel Order' and confirm the reason.",
      "If payment was made online, refund is auto-initiated.",
      "Cancelled orders usually can't be reversed once confirmed.",
    ],
  }

  const infoData = {
    Return: { window: "7-10 days from delivery", eligibility: "Item must be unused, with tags/packaging" },
    Refund: { window: "5-7 business days after return received", eligibility: "Valid for all approved returns" },
    Replacement: { window: "7 days from delivery", eligibility: "Only for damaged/wrong/defective items" },
    Cancellation: { window: "Before order ships", eligibility: "Available for all pre-shipping orders" },
  }

  return (
    <div className="dashboard">
      <Link to="/" className="back-link">← Back to Home</Link>
      <h1 className="dashboard-title">Return, Refund & Cancellation Guide</h1>
      <p className="guide-subtitle">Platform: Amazon (Example)</p>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="steps-container">
        {stepsData[activeTab].map((step, i) => (
          <div className="step-card" key={i}>
            <div className="step-number">{i + 1}</div>
            <p>{step}</p>
          </div>
        ))}
      </div>

      <div className="info-grid">
        <div className="info-card">
          <Clock size={20} />
          <h4>Estimated Timeline</h4>
          <p>{infoData[activeTab].window}</p>
        </div>
        <div className="info-card">
          <CheckCircle size={20} />
          <h4>Eligibility</h4>
          <p>{infoData[activeTab].eligibility}</p>
        </div>
      </div>
    </div>
  )
}

export default ReturnGuide