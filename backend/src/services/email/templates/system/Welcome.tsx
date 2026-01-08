/**
 * Template: Boas-vindas
 * Enviado quando usuário se cadastra
 */

import * as React from 'react';
import { Text, Heading } from '@react-email/components';
import { BaseEmail } from '../base/BaseEmail';
import { Button } from '../base/Button';

export interface WelcomeProps {
  userName: string;
  homeUrl: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export function Welcome({
  userName,
  homeUrl,
  unsubscribeUrl,
  preferencesUrl,
}: WelcomeProps) {
  return (
    <BaseEmail
      title="Bem-vindo ao Compra Coletiva!"
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      <Heading style={h1Style}>
        👋 Bem-vindo ao Compra Coletiva!
      </Heading>

      <Text style={paragraphStyle}>
        Olá, <strong>{userName}</strong>!
      </Text>

      <Text style={paragraphStyle}>
        Estamos felizes em ter você conosco! Sua conta foi criada com sucesso.
      </Text>

      <Text style={paragraphStyle}>
        Com o Compra Coletiva, você pode:
      </Text>

      <ul style={listStyle}>
        <li style={listItemStyle}>Criar grupos de compra e economizar comprando em quantidade</li>
        <li style={listItemStyle}>Participar de campanhas existentes e aproveitar melhores preços</li>
        <li style={listItemStyle}>Gerenciar seus pedidos e acompanhar entregas</li>
        <li style={listItemStyle}>Conversar com organizadores e tirar dúvidas</li>
      </ul>

      <Button href={homeUrl}>
        Explorar Campanhas
      </Button>

      <Text style={helpTextStyle}>
        Dúvidas? Entre em contato conosco a qualquer momento.
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

const listStyle: React.CSSProperties = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px 0',
  paddingLeft: '20px',
};

const listItemStyle: React.CSSProperties = {
  marginBottom: '8px',
};

const helpTextStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0 0 0',
};
