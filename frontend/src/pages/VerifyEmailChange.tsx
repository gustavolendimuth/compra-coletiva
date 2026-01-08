/**
 * VerifyEmailChange Page
 * Página de verificação de troca de email
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button } from '@/components/ui';
import { profileService } from '@/api';
import { useAuth } from '@/contexts/AuthContext';

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired';

export function VerifyEmailChange() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState('');
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token de verificação ausente');
        return;
      }

      try {
        const response = await profileService.verifyEmailChange(token);
        setStatus('success');
        setNewEmail(response.data.email);
        setMessage('Seu email foi alterado com sucesso!');
        // Refresh user data to get updated email
        await refreshUser();
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || 'Erro ao verificar email';

        if (errorMessage.toLowerCase().includes('expirado') ||
            errorMessage.toLowerCase().includes('expired')) {
          setStatus('expired');
          setMessage('O link de verificação expirou. Solicite uma nova troca de email.');
        } else {
          setStatus('error');
          setMessage(errorMessage);
        }
      }
    };

    verifyEmail();
  }, [token, refreshUser]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600">Verificando seu email...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Email Verificado!</h2>
            <p className="text-gray-600 mb-2">{message}</p>
            {newEmail && (
              <p className="text-sm text-gray-500 mb-6">
                Seu novo email: <strong>{newEmail}</strong>
              </p>
            )}
            <Button onClick={() => navigate('/profile')}>
              Ir para o Perfil
            </Button>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Link Expirado</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Button onClick={() => navigate('/profile')}>
              Solicitar Novamente
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Erro na Verificação</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex justify-center gap-3">
              <Link to="/profile">
                <Button variant="secondary">Ir para o Perfil</Button>
              </Link>
              <Link to="/campaigns">
                <Button>Ver Campanhas</Button>
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Verificação de Email
        </h1>
        {renderContent()}
      </Card>
    </div>
  );
}

export default VerifyEmailChange;
