import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authStorage } from '../lib/authStorage';
import { reconnectSocket } from '../lib/socket';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasShownToast = useRef(false);
  const hasProcessedCallback = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasProcessedCallback.current) {
      console.log('[AuthCallback] Já processado, ignorando segunda execução');
      return;
    }
    hasProcessedCallback.current = true;

    const handleCallback = () => {
      // Check for error
      const error = searchParams.get('error');
      if (error) {
        toast.error('Erro ao fazer login com Google');
        navigate('/campaigns');
        return;
      }

      // Extract tokens and user data from URL
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const userId = searchParams.get('userId');
      const userName = searchParams.get('userName');
      const userEmail = searchParams.get('userEmail');
      const userRole = searchParams.get('userRole');
      const phoneCompleted = searchParams.get('phoneCompleted');

      if (!accessToken || !refreshToken || !userId || !userName || !userEmail || !userRole) {
        toast.error('Dados de autenticação incompletos');
        navigate('/campaigns');
        return;
      }

      // Save auth data to localStorage
      authStorage.setAuth(accessToken, refreshToken, {
        id: userId,
        name: decodeURIComponent(userName),
        email: decodeURIComponent(userEmail),
        role: userRole as 'ADMIN' | 'CAMPAIGN_CREATOR' | 'CUSTOMER',
        phoneCompleted: phoneCompleted === 'true',
      });

      // Reconnect socket with new token
      reconnectSocket();

      // Check if user needs to complete phone registration
      if (phoneCompleted === 'false') {
        console.log('[AuthCallback] Usuário precisa completar telefone, redirecionando...');
        if (!hasShownToast.current) {
          toast.success(`Bem-vindo, ${decodeURIComponent(userName)}!`);
          hasShownToast.current = true;
        }
        navigate('/complete-profile', { replace: true });
        return;
      }

      // Get return URL or default to campaigns
      const returnUrl = authStorage.getReturnUrl() || '/campaigns';
      console.log('[AuthCallback] returnUrl recuperado do storage:', returnUrl);
      authStorage.clearReturnUrl();

      // Show welcome message (prevent duplicate toasts)
      if (!hasShownToast.current) {
        toast.success(`Bem-vindo, ${decodeURIComponent(userName)}!`);
        hasShownToast.current = true;
      }

      // Navigate to the original page using React Router
      // This avoids full page reload and preserves React state
      // The AuthContext will pick up the user from localStorage on init
      // The destination component will read pendingActionData on mount
      console.log('[AuthCallback] Navegando para:', returnUrl);
      navigate(returnUrl, { replace: true });
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completando login com Google...</p>
      </div>
    </div>
  );
}
