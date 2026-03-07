/**
 * Template: Pagamento liberado
 * Enviado aos participantes quando o pagamento PIX é liberado pelo criador da campanha
 */

import * as React from 'react';
import { Text, Heading, Section } from '@react-email/components';
import { BaseEmail } from '../base/BaseEmail';
import { Button } from '../base/Button';

export interface PaymentReleasedProps {
  userName: string;
  campaignName: string;
  pixKey: string;
  pixType: string;
  pixName?: string;
  actionUrl: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

const pixTypeLabels: Record<string, string> = {
  CPF: "CPF",
  CNPJ: "CNPJ",
  EMAIL: "E-mail",
  PHONE: "Telefone",
  RANDOM: "Chave Aleatória",
};

export function PaymentReleased({
  userName,
  campaignName,
  pixKey,
  pixType,
  pixName,
  actionUrl,
  unsubscribeUrl,
  preferencesUrl,
}: PaymentReleasedProps) {
  return (
    <BaseEmail
      title="Pagamento liberado"
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      <Heading style={h1Style}>
        💰 Pagamento liberado!
      </Heading>

      <Text style={paragraphStyle}>
        Olá, <strong>{userName}</strong>!
      </Text>

      <Text style={paragraphStyle}>
        O pagamento via PIX do grupo <strong>{campaignName}</strong> foi liberado.
        Realize o pagamento e envie o comprovante para confirmar.
      </Text>

      {/* PIX Details Card */}
      <Section style={pixCardStyle}>
        <Text style={pixBadgeStyle}>
          PIX
        </Text>

        <Text style={pixLabelStyle}>
          Tipo: <strong>{pixTypeLabels[pixType] || pixType}</strong>
        </Text>

        <Section style={pixKeyContainerStyle}>
          <Text style={pixKeyStyle}>
            {pixKey}
          </Text>
        </Section>

        {pixName && (
          <Text style={pixHolderStyle}>
            Titular: <strong>{pixName}</strong>
          </Text>
        )}
      </Section>

      <Text style={instructionStyle}>
        Acesse a campanha para copiar a chave PIX e enviar o comprovante de pagamento.
      </Text>

      <Button href={actionUrl}>
        Ver Campanha e Pagar
      </Button>

      <Text style={helpTextStyle}>
        Você recebeu este email porque participa do grupo {campaignName}.
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

const pixCardStyle: React.CSSProperties = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #bbf7d0',
  borderRadius: '12px',
  padding: '20px',
  margin: '24px 0',
};

const pixBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#16a34a',
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.05em',
  padding: '2px 10px',
  borderRadius: '20px',
  margin: '0 0 12px 0',
  textTransform: 'uppercase' as const,
};

const pixLabelStyle: React.CSSProperties = {
  color: '#374151',
  fontSize: '14px',
  margin: '0 0 8px 0',
};

const pixKeyContainerStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #dcfce7',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '8px 0',
};

const pixKeyStyle: React.CSSProperties = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: '600',
  fontFamily: 'monospace',
  margin: '0',
  wordBreak: 'break-all' as const,
};

const pixHolderStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '12px 0 0 0',
};

const instructionStyle: React.CSSProperties = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0 0 8px 0',
};

const helpTextStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0 0 0',
};
