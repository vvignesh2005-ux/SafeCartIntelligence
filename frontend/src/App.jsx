import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SellerDashboard from './pages/SellerDashboard'
import PlatformAnalysis from './pages/PlatformAnalysis'
import ReturnGuide from './pages/ReturnGuide'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<SellerDashboard />} />
      <Route path="/platform" element={<PlatformAnalysis />} />
      <Route path="/return-guide" element={<ReturnGuide />} />
    </Routes>
  )
}

export default App