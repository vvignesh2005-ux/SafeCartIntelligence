import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Phone, Mail, Globe, MessageCircle, Clock, CheckCircle, Copy } from 'lucide-react'

function SupportFinder() {
  const [searchName, setSearchName] = useState('')
  const [contact, setContact] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!searchName) return
    setLoading(true)
    setNotFound(false)

    const res = await fetch(`http://localhost:5000/api/support/${searchName}`)
    const data = await res.json()

    if (data.found) {
      setContact(data.contact)
    } else {
      setContact(null)
      setNotFound(true)
    }

    setLoading(false)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="dashboard">
      <Link to="/" className="back-link">← Back to Home</Link>
      <h1 className="dashboard-title">Customer Support Finder</h1>

      <div className="support-search-bar">
        <input
          type="text"
          placeholder="Search platform or seller name..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <button onClick={handleSearch}><Search size={18} /></button>
      </div>

      {loading && <p>Searching...</p>}

      {notFound && (
        <div className="trust-card">
          <p>No support contact found. Try "ExampleStore" (test data).</p>
        </div>
      )}

      {contact && (
        <div className="trust-card">
          <div className="trust-card-header">
            {contact.verified && <CheckCircle size={22} color="#16a34a" />}
            <h2>{contact.name} — {contact.verified ? 'Verified Support' : 'Support Info'}</h2>
          </div>

          <div className="support-details">
            <div className="support-row">
              <Phone size={18} />
              <span>{contact.phone}</span>
              <button className="copy-btn" onClick={() => copyToClipboard(contact.phone)}>
                <Copy size={14} /> Copy
              </button>
              <a className="action-btn" href={`tel:${contact.phone}`}>Call</a>
            </div>

            <div className="support-row">
              <Mail size={18} />
              <span>{contact.email}</span>
              <button className="copy-btn" onClick={() => copyToClipboard(contact.email)}>
                <Copy size={14} /> Copy
              </button>
              <a className="action-btn" href={`mailto:${contact.email}`}>Email</a>
            </div>

            <div className="support-row">
              <Globe size={18} />
              <span>{contact.website}</span>
              <button className="copy-btn" onClick={() => copyToClipboard(contact.website)}>
                <Copy size={14} /> Copy
              </button>
            </div>

            {contact.liveChatAvailable && (
              <div className="support-row">
                <MessageCircle size={18} />
                <span>Live Chat Available</span>
              </div>
            )}

            <div className="support-row">
              <Clock size={18} />
              <span>Support Hours: {contact.supportHours}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SupportFinder