import { Link } from 'react-router-dom'
import { Search, Phone, Mail, Globe, MessageCircle, Clock, CheckCircle, Copy } from 'lucide-react'

function SupportFinder() {
  return (
    <div className="dashboard">
      <Link to="/" className="back-link">← Back to Home</Link>
      <h1 className="dashboard-title">Customer Support Finder</h1>

      <div className="support-search-bar">
        <input type="text" placeholder="Search platform or seller name..." />
        <button><Search size={18} /></button>
      </div>

      <div className="trust-card">
        <div className="trust-card-header">
          <CheckCircle size={22} color="#16a34a" />
          <h2>ExampleStore — Verified Support</h2>
        </div>

        <div className="support-details">
          <div className="support-row">
            <Phone size={18} />
            <span>+91 XXXXX XXXXX</span>
            <button className="copy-btn"><Copy size={14} /> Copy</button>
            <button className="action-btn">Call</button>
          </div>

          <div className="support-row">
            <Mail size={18} />
            <span>support@examplestore.com</span>
            <button className="copy-btn"><Copy size={14} /> Copy</button>
            <button className="action-btn">Email</button>
          </div>

          <div className="support-row">
            <Globe size={18} />
            <span>www.examplestore.com</span>
            <button className="copy-btn"><Copy size={14} /> Copy</button>
          </div>

          <div className="support-row">
            <MessageCircle size={18} />
            <span>Live Chat Available</span>
          </div>

          <div className="support-row">
            <Clock size={18} />
            <span>Support Hours: 9 AM - 9 PM (Mon-Sat)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupportFinder