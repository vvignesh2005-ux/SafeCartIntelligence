import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SellerDashboard from './pages/SellerDashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<SellerDashboard />} />
    </Routes>
  )
}

export default App