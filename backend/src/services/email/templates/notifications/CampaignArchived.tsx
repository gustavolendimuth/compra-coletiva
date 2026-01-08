/**
 * Template: Campanha arquivada
 */

import * as React from 'react';
import { Text, Heading } from '@react-email/components';
import { BaseEmail } from '../base/BaseEmail';
import { Button } from '../base/Button';

export interface CampaignArchivedProps {
  userName: string;
  campaignName: string;
  actionUrl: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export function CampaignArchived({
  userName,
  campaignName,
  actionUrl,
  unsubscribeUrl,
  preferencesUrl,
}: CampaignArchivedProps) {
  return (
    <BaseEmail
      title="Campanha arquivada"
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      <Heading style={h1Style}>
        📦 Campanha arquivada
      </Heading>

      <Text style={paragraphStyle}>
        Olá, <strong>{userName}</strong>!
      </Text>

      <Text style={paragraphStyle}>
        A campanha <strong>{campaignName}</strong> foi arquivada.
      </Text>

      <Text style={paragraphStyle}>
        Todos os pedidos foram pagos e o processo foi concluído.
      </Text>

      <Button href={actionUrl}>
        Ver Campanha
      </Button>

      <Text style={helpTextStyle}>
        Você ainda pode acessar a campanha arquivada para consultar informações.
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
