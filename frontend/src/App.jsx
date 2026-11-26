import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import SellerDashboard from './pages/SellerDashboard';
import PlatformAnalysis from './pages/PlatformAnalysis';
import ReturnGuide from './pages/ReturnGuide';
import SupportFinder from './pages/SupportFinder';
import ComplaintGenerator from './pages/ComplaintGenerator';
import KnowledgeSystem from './pages/KnowledgeSystem';

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/seller" element={<SellerDashboard />} />
          <Route path="/platform" element={<PlatformAnalysis />} />
          <Route path="/returns" element={<ReturnGuide />} />
          <Route path="/support" element={<SupportFinder />} />
          <Route path="/complaint" element={<ComplaintGenerator />} />
          <Route path="/knowledge" element={<KnowledgeSystem />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="site-footer">
        Safe Cart Intelligence — Evidence-only shopping verification. We show
        documented facts, never "safe" or "unsafe" labels.
      </footer>
    </div>
  );
}