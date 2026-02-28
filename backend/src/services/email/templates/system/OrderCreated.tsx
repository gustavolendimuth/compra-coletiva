/**
 * Template: Pedido criado
 * Enviado quando um pedido novo é criado para o usuário
 */

import * as React from 'react';
import { Text, Heading } from '@react-email/components';
import { BaseEmail } from '../base/BaseEmail';
import { Button } from '../base/Button';

export interface OrderCreatedProps {
  userName: string;
  campaignName: string;
  actionUrl: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export function OrderCreated({
  userName,
  campaignName,
  actionUrl,
  unsubscribeUrl,
  preferencesUrl,
}: OrderCreatedProps) {
  return (
    <BaseEmail
      title="Seu pedido foi criado"
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      <Heading style={h1Style}>
        🛒 Pedido criado com sucesso
      </Heading>

      <Text style={paragraphStyle}>
        Olá, <strong>{userName}</strong>!
      </Text>

      <Text style={paragraphStyle}>
        Um novo pedido foi criado para você na campanha <strong>{campaignName}</strong>.
      </Text>

      <Text style={paragraphStyle}>
        Você pode abrir a campanha para conferir os itens, valores e acompanhar atualizações.
      </Text>

      <Button href={actionUrl}>
        Ver Pedido
      </Button>
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

