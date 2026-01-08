/**
 * Template: Reset de senha
 * Enviado quando usuário solicita recuperação de senha
 */

import * as React from 'react';
import { Text, Heading } from '@react-email/components';
import { BaseEmail } from '../base/BaseEmail';
import { Button } from '../base/Button';

export interface PasswordResetProps {
  userName: string;
  resetUrl: string;
  expiresIn: string; // Ex: "1 hora"
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export function PasswordReset({
  userName,
  resetUrl,
  expiresIn,
  unsubscribeUrl,
  preferencesUrl,
}: PasswordResetProps) {
  return (
    <BaseEmail
      title="Redefinir senha"
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      <Heading style={h1Style}>
        🔒 Redefinir senha
      </Heading>

      <Text style={paragraphStyle}>
        Olá, <strong>{userName}</strong>!
      </Text>

      <Text style={paragraphStyle}>
        Você solicitou a redefinição da sua senha no Compra Coletiva.
      </Text>

      <Text style={paragraphStyle}>
        Clique no botão abaixo para criar uma nova senha:
      </Text>

      <Button href={resetUrl}>
        Redefinir Senha
      </Button>

      <Text style={warningStyle}>
        ⚠️ Este link expira em <strong>{expiresIn}</strong>.
      </Text>

      <Text style={helpTextStyle}>
        Se você não solicitou a redefinição de senha, ignore este email.
        Sua senha permanecerá inalterada.
      </Text>
    </BaseEmail>
  );
}

const h1Style: React.CSSProperties = {
  color: '#111827',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 24px 0',
  lineHeight: '32px',
};

const paragraphStyle: React.CSSProperties = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px 0',
};

const warningStyle: React.CSSProperties = {
  color: '#dc2626',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  padding: '12px',
  backgroundColor: '#fef2f2',
  borderLeft: '4px solid #dc2626',
  borderRadius: '4px',
};

const helpTextStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0 0 0',
};
