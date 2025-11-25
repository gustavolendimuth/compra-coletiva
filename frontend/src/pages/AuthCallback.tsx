import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authStorage } from '../lib/authStorage';
import { reconnectSocket } from '../lib/socket';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
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

      if (!accessToken || !refreshToken || !userId || !userName || !userEmail || !userRole) {
        toast.error('Dados de autenticação incompletos');
        navigate('/campaigns');
        return;
      }

      // Save auth data
      authStorage.setAuth(accessToken, refreshToken, {
        id: userId,
        name: decodeURIComponent(userName),
        email: decodeURIComponent(userEmail),
        role: userRole as 'ADMIN' | 'CAMPAIGN_CREATOR' | 'CUSTOMER',
      });

      // Reconnect socket with new token
      reconnectSocket();

      toast.success(`Bem-vindo, ${decodeURIComponent(userName)}!`);

      // Redirect to home
      navigate('/campaigns');

      // Reload to update auth state in entire app
      window.location.reload();
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
