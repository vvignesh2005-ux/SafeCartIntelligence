import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ShieldCheck, Clock, Store, Package, Phone, Search } from 'lucide-react'

function SellerDashboard() {
  const [searchParams] = useSearchParams()
  const [sellerName, setSellerName] = useState(searchParams.get('name') || '')
  const [seller, setSeller] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!sellerName) return
    setLoading(true)
    setNotFound(false)

    const res = await fetch(`http://localhost:5000/api/sellers/${sellerName}`)
    const data = await res.json()

    if (data.found) {
      setSeller(data.seller)
    } else {
      setSeller(null)
      setNotFound(true)
    }

    setLoading(false)
  }

  const renderStars = (count) => {
    return "★".repeat(count) + "☆".repeat(5 - count)
  }

  const ratingLabels = {
    businessVerification: "Business Verification",
    customerSatisfaction: "Customer Satisfaction",
    deliveryReliability: "Delivery Reliability",
    customerSupport: "Customer Support",
    refundExperience: "Refund Experience",
    reviewAuthenticity: "Review Authenticity",
  }

  return (
    <div className="dashboard">
      <Link to="/" className="back-link">← Back to Home</Link>
      <h1 className="dashboard-title">Seller Intelligence Dashboard</h1>

      <div className="support-search-bar">
        <input
          type="text"
          placeholder="Search seller name..."
          value={sellerName}
          onChange={(e) => setSellerName(e.target.value)}
        />
        <button onClick={handleSearch}><Search size={18} /></button>
      </div>

      {loading && <p>Searching...</p>}

      {notFound && (
        <div className="trust-card">
          <p>No seller found with that name. Try "ExampleStore" (test data).</p>
        </div>
      )}

      {seller && (
        <>
          <div className="trust-card">
            <div className="trust-card-header">
              <ShieldCheck size={24} />
              <h2>{seller.name} — Trust Profile</h2>
            </div>

            <div className="ratings-grid">
              {Object.entries(seller.ratings).map(([key, value]) => (
                <div className="rating-row" key={key}>
                  <span className="rating-label">{ratingLabels[key]}</span>
                  <span className="rating-stars">{renderStars(value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="info-grid">
            <div className="info-card">
              <Clock size={20} />
              <h4>Years in Business</h4>
              <p>{seller.yearsInBusiness} years</p>
            </div>
            <div className="info-card">
              <Store size={20} />
              <h4>Platform Type</h4>
              <p>{seller.platformType}</p>
            </div>
            <div className="info-card">
              <Package size={20} />
              <h4>Products Sold</h4>
              <p>{seller.productsSold}</p>
            </div>
            <div className="info-card">
              <Phone size={20} />
              <h4>Verified Contact</h4>
              <p>{seller.contact}</p>
            </div>
          </div>

          <div className="review-summary">
            <div className="review-box positive">
              <h4>Most Common Positive Reviews</h4>
              <p>"{seller.positiveReview}"</p>
            </div>
            <div className="review-box negative">
              <h4>Most Common Negative Reviews</h4>
              <p>"{seller.negativeReview}"</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SellerDashboard