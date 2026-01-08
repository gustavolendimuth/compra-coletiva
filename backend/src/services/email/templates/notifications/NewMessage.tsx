/**
 * Template: Nova mensagem
 * Para mensagens privadas (order chat) ou perguntas públicas (Q&A)
 */

import * as React from 'react';
import { Text, Heading } from '@react-email/components';
import { BaseEmail } from '../base/BaseEmail';
import { Button } from '../base/Button';

export interface NewMessageProps {
  userName: string;
  senderName: string;
  messagePreview: string;
  campaignName: string;
  isQuestion: boolean;
  actionUrl: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export function NewMessage({
  userName,
  senderName,
  messagePreview,
  campaignName,
  isQuestion,
  actionUrl,
  unsubscribeUrl,
  preferencesUrl,
}: NewMessageProps) {
  return (
    <BaseEmail
      title={isQuestion ? 'Nova pergunta na campanha' : 'Nova mensagem no pedido'}
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      <Heading style={h1Style}>
        {isQuestion ? '❓ Nova pergunta' : '💬 Nova mensagem'}
      </Heading>

      <Text style={paragraphStyle}>
        Olá, <strong>{userName}</strong>!
      </Text>

      <Text style={paragraphStyle}>
        <strong>{senderName}</strong> {isQuestion ? 'perguntou' : 'enviou uma mensagem'} em{' '}
        <strong>{campaignName}</strong>:
      </Text>

      <div style={messageBoxStyle}>
        <Text style={messageTextStyle}>
          "{messagePreview}"
        </Text>
      </div>

      <Button href={actionUrl}>
        {isQuestion ? 'Ver Pergunta e Responder' : 'Ver Mensagem'}
      </Button>

      <Text style={helpTextStyle}>
        {isQuestion
          ? 'Responda à pergunta para ajudar outros usuários interessados na campanha.'
          : 'Clique no botão acima para continuar a conversa.'}
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

const messageBoxStyle: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  borderLeft: '4px solid #2563eb',
  padding: '16px',
  marginTop: '16px',
  marginBottom: '16px',
  borderRadius: '4px',
};

const messageTextStyle: React.CSSProperties = {
  color: '#1f2937',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0',
  fontStyle: 'italic',
};

const helpTextStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0 0 0',
};
