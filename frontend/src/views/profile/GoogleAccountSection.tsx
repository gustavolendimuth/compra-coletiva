/**
 * GoogleAccountSection Component
 * Vincula a conta Google à conta logada e mostra o resultado da volta do Google
 */

import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { Card, Button } from '@/components/ui';
import { API_URL } from '@/lib/env';

// Motivos que o backend devolve em /perfil?google=<motivo>
const LINK_ERROR_MESSAGES: Record<string, string> = {
  email_mismatch: 'Use a conta Google com o mesmo email do seu cadastro.',
  google_in_use: 'Esta conta Google já está vinculada a outro cadastro.',
  already_linked: 'Seu cadastro já está vinculado a outra conta Google.',
  email_not_verified: 'O Google não confirmou o email dessa conta. Tente outra conta Google.',
  auth_required: 'Sua sessão expirou. Entre de novo e tente vincular outra vez.',
};
const LINK_ERROR_FALLBACK = 'Não foi possível vincular a conta Google. Tente de novo.';

interface GoogleAccountSectionProps {
  email: string;
  hasGoogle: boolean;
  onLinked: () => void;
}

export function GoogleAccountSection({ email, hasGoogle, onLinked }: GoogleAccountSectionProps) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('google');
    if (!result) return;

    if (result === 'linked') {
      toast.success('Conta Google vinculada!');
      onLinked();
    } else {
      toast.error(LINK_ERROR_MESSAGES[result] ?? LINK_ERROR_FALLBACK);
    }

    // Tira o resultado da URL para não repetir o aviso ao recarregar
    params.delete('google');
    const query = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }, [onLinked]);

  const handleLink = () => {
    window.location.href = `${API_URL}/api/auth/google?intent=link`;
  };

  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-lg font-semibold text-sky-900 mb-2">Conta Google</h2>
      {hasGoogle ? (
        <p className="text-sm text-sky-600" data-testid="google-linked">
          Sua conta está vinculada ao Google. Você pode entrar com &quot;Continuar com Google&quot;.
        </p>
      ) : (
        <>
          <p className="text-sm text-sky-600 mb-4">
            Vincule sua conta Google para entrar sem digitar a senha. Use a conta Google do email{' '}
            <strong className="break-all">{email}</strong>.
          </p>
          <Button variant="secondary" onClick={handleLink}>
            Vincular conta Google
          </Button>
        </>
      )}
    </Card>
  );
}

export default GoogleAccountSection;
