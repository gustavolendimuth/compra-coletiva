import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * ProtectedRoute Component
 * Wrapper that ensures OAuth users have completed phone registration
 * Redirects to /complete-profile if phone is not completed
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  // If user is authenticated and needs to complete phone
  if (user && user.phoneCompleted === false && !user.phone) {
    console.log('[ProtectedRoute] Usuário precisa completar telefone, redirecionando para /complete-profile');
    // Save current URL to redirect back after completing phone
    sessionStorage.setItem('returnTo', location.pathname + location.search);
    return <Navigate to="/complete-profile" replace />;
  }

  console.log('[ProtectedRoute] Usuário autenticado, permitindo acesso:', {
    phoneCompleted: user?.phoneCompleted,
    phone: user?.phone
  });

  return <>{children}</>;
}
