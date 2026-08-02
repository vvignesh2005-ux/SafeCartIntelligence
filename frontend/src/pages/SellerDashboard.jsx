import { Link } from 'react-router-dom'
import { ShieldCheck, Star, Clock, Store, Package, Phone } from 'lucide-react'

function SellerDashboard() {
  const ratings = [
    { label: "Business Verification", value: 5 },
    { label: "Customer Satisfaction", value: 4 },
    { label: "Delivery Reliability", value: 4 },
    { label: "Customer Support", value: 3 },
    { label: "Refund Experience", value: 2 },
    { label: "Review Authenticity", value: 4 },
  ]

  const renderStars = (count) => {
    return "★".repeat(count) + "☆".repeat(5 - count)
  }

  return (
   <div className="dashboard">
      <Link to="/" className="back-link">← Back to Home</Link>
      <h1 className="dashboard-title">Business Name: ExampleStore</h1>

      <div className="trust-card">
        <div className="trust-card-header">
          <ShieldCheck size={24} />
          <h2>Overall Trust Profile</h2>
        </div>

        <div className="ratings-grid">
          {ratings.map((r, i) => (
            <div className="rating-row" key={i}>
              <span className="rating-label">{r.label}</span>
              <span className="rating-stars">{renderStars(r.value)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card">
          <Clock size={20} />
          <h4>Years in Business</h4>
          <p>4 years</p>
        </div>
        <div className="info-card">
          <Store size={20} />
          <h4>Platform Type</h4>
          <p>Instagram Store</p>
        </div>
        <div className="info-card">
          <Package size={20} />
          <h4>Products Sold</h4>
          <p>Clothing, Accessories</p>
        </div>
        <div className="info-card">
          <Phone size={20} />
          <h4>Verified Contact</h4>
          <p>+91 XXXXX XXXXX</p>
        </div>
      </div>

      <div className="review-summary">
        <div className="review-box positive">
          <h4>Most Common Positive Reviews</h4>
          <p>"Fast delivery and good packaging."</p>
        </div>
        <div className="review-box negative">
          <h4>Most Common Negative Reviews</h4>
          <p>"Refund process took longer than expected."</p>
        </div>
      </div>
    </div>
  )
}

export default SellerDashboard