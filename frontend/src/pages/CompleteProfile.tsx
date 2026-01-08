import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/api';
import { authStorage } from '@/lib/authStorage';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import toast from 'react-hot-toast';

/**
 * CompleteProfile Page
 * Page for OAuth users to complete phone registration
 * Mobile-first design with responsive layout
 */
export function CompleteProfile() {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone
    if (!phone || phone.length < 10) {
      toast.error('Por favor, informe um telefone válido');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[CompleteProfile] Enviando telefone:', phone);
      const updatedUser = await authService.completePhone({ phone });
      console.log('[CompleteProfile] Telefone cadastrado com sucesso:', updatedUser);

      // Only update state if component is still mounted
      if (!isMountedRef.current) {
        console.log('[CompleteProfile] Componente desmontado, abortando atualização');
        return;
      }

      // Update user in context and localStorage
      console.log('[CompleteProfile] Atualizando usuário no contexto e localStorage');
      setUser(updatedUser);
      authStorage.setUser(updatedUser); // Ensure localStorage is updated immediately

      toast.success('Cadastro completado com sucesso!');

      // Redirect to requested page or home
      const returnTo = sessionStorage.getItem('returnTo') || '/';
      sessionStorage.removeItem('returnTo');
      console.log('[CompleteProfile] Redirecionando para:', returnTo);

      // Force page reload to ensure all components pick up the updated user
      window.location.href = returnTo;
    } catch (error: any) {
      console.error('[CompleteProfile] Erro ao completar telefone:', error);

      // Only update state if component is still mounted
      if (!isMountedRef.current) {
        console.log('[CompleteProfile] Componente desmontado durante erro');
        return;
      }

      // More detailed error handling
      if (error.code === 'ERR_CANCELED') {
        toast.error('Requisição cancelada. Por favor, tente novamente.');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(`Erro: ${error.message}`);
      } else {
        toast.error('Erro ao completar cadastro. Por favor, tente novamente.');
      }
      setIsLoading(false);
    }
  };

  // Show info about phone requirement
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Complete seu cadastro
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Para continuar, precisamos do seu telefone para contato.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <PhoneInput
              value={phone}
              onChange={setPhone}
              required
              disabled={isLoading}
              autoFocus
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !phone}
            >
              {isLoading ? 'Salvando...' : 'Continuar'}
            </Button>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-xs md:text-sm text-blue-800">
              <strong>Por que precisamos do seu telefone?</strong> Utilizamos
              seu telefone para comunicação sobre pedidos e campanhas.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
