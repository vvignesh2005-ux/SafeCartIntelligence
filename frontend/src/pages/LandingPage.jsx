import { useNavigate } from 'react-router-dom'
import { Search, Mic, Camera, Link as LinkIcon, ShieldCheck, Store, RotateCcw, Headphones, FileText } from 'lucide-react'

function LandingPage() {
  const navigate = useNavigate()
  const features = [
    { icon: <ShieldCheck size={28} />, title: "Seller Intelligence", desc: "Check any seller's trust profile before you buy." },
    { icon: <Store size={28} />, title: "Platform Trust", desc: "See how reliable a shopping platform really is." },
    { icon: <RotateCcw size={28} />, title: "Return Refund Guide", desc: "Step-by-step help for returns, refunds & cancellations." },
    { icon: <Headphones size={28} />, title: "Customer Support Finder", desc: "Find verified official support contacts instantly." },
    { icon: <FileText size={28} />, title: "Complaint Generator", desc: "Generate a professional complaint in seconds." },
  ]

  return (
    <div className="hero">
      <h1 className="logo">Safe Cart Intelligence</h1>
      <p className="tagline">Your AI Consumer Protection Assistant</p>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search Website, Seller, Product Link, Instagram Page, Facebook Page or Phone Number"
        />
       <button onClick={() => navigate('/dashboard')}><Search size={18} /></button>
        <button><Mic size={18} /></button>
        <button><Camera size={18} /></button>
        <button><LinkIcon size={18} /></button>
      </div>

      <div className="features">
        {features.map((f, i) => (
          <div className="feature-card" key={i}>
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>

      <footer className="footer">
        <p>© 2026 Safe Cart Intelligence. All rights reserved.</p>
        <p className="footer-sub">Empowering safer online shopping with AI.</p>
      </footer>
    </div>
  )
}

export default LandingPage