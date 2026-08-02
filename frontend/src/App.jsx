import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SellerDashboard from './pages/SellerDashboard'
import PlatformAnalysis from './pages/PlatformAnalysis'
import ReturnGuide from './pages/ReturnGuide'
import SupportFinder from './pages/SupportFinder'
import ComplaintGenerator from './pages/ComplaintGenerator'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<SellerDashboard />} />
      <Route path="/platform" element={<PlatformAnalysis />} />
      <Route path="/return-guide" element={<ReturnGuide />} />
      <Route path="/support" element={<SupportFinder />} />
      <Route path="/complaint" element={<ComplaintGenerator />} />
    </Routes>
  )
}

export default App