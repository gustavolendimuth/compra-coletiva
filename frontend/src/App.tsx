import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthModalManager } from './components/AuthModal';
import Layout from './components/Layout';
import CampaignList from './pages/CampaignList';
import CampaignDetail from './pages/CampaignDetail';
import AuthCallback from './pages/AuthCallback';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

function App() {
  return (
    <AuthProvider>
      <AuthModalManager />
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/campaigns" replace />} />
          <Route path="campaigns" element={<CampaignList />} />
          <Route path="campaigns/:slug" element={<CampaignDetail />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
