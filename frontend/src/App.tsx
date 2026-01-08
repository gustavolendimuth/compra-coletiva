import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthModalManager } from './components/AuthModal';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import Layout from './components/Layout';
import CampaignList from './pages/CampaignList';
import CampaignDetail from './pages/CampaignDetail';
import AuthCallback from './pages/AuthCallback';
import { CompleteProfile } from './pages/CompleteProfile';
import { EmailPreferences } from './pages/EmailPreferences';
import { Profile } from './pages/Profile';
import { VerifyEmailChange } from './pages/VerifyEmailChange';
import { AdminLayout } from './pages/admin/AdminLayout';
import { Dashboard } from './pages/admin/Dashboard';
import { Users } from './pages/admin/Users';
import { UserDetail } from './pages/admin/UserDetail';
import { Campaigns } from './pages/admin/Campaigns';
import { Messages } from './pages/admin/Messages';
import { Audit } from './pages/admin/Audit';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

function App() {
  return (
    <AuthProvider>
      <AuthModalManager />
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/verify-email/:token" element={<VerifyEmailChange />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/" element={<Layout />}>
          <Route
            index
            element={
              <ProtectedRoute>
                <Navigate to="/campaigns" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="campaigns"
            element={
              <ProtectedRoute>
                <CampaignList />
              </ProtectedRoute>
            }
          />
          <Route
            path="campaigns/:slug"
            element={
              <ProtectedRoute>
                <CampaignDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="email-preferences"
            element={
              <ProtectedRoute>
                <EmailPreferences />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="messages" element={<Messages />} />
          <Route path="audit" element={<Audit />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
