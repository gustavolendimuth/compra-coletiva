/**
 * Template: Campanha pronta para enviar
 * Quando todos os pedidos estão pagos
 */

import * as React from 'react';
import { Text, Heading } from '@react-email/components';
import { BaseEmail } from '../base/BaseEmail';
import { Button } from '../base/Button';

export interface CampaignReadyToSendProps {
  userName: string;
  campaignName: string;
  actionUrl: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export function CampaignReadyToSend({
  userName,
  campaignName,
  actionUrl,
  unsubscribeUrl,
  preferencesUrl,
}: CampaignReadyToSendProps) {
  return (
    <BaseEmail
      title="Grupo pronto para enviar"
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      <Heading style={h1Style}>
        🎉 Grupo pronto para enviar!
      </Heading>

      <Text style={paragraphStyle}>
        Olá, <strong>{userName}</strong>!
      </Text>

      <Text style={paragraphStyle}>
        Todos os pedidos do grupo <strong>{campaignName}</strong> foram pagos.
      </Text>

      <Text style={paragraphStyle}>
        Você já pode fazer o pedido ao fornecedor e alterar o status da campanha para <strong>ENVIADO</strong> quando concluir.
      </Text>

      <Button href={actionUrl}>
        Ver Campanha
      </Button>

      <Text style={helpTextStyle}>
        Esta campanha está pronta para você enviar ao fornecedor.
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

const helpTextStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0 0 0',
};
