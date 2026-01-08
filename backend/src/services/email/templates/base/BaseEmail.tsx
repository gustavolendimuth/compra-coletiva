/**
 * BaseEmail - Layout base para todos os emails
 * Design mobile-first e responsivo
 */

import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components';

interface BaseEmailProps {
  title: string;
  children: React.ReactNode;
  unsubscribeUrl: string;
  preferencesUrl?: string;
}

export function BaseEmail({
  title,
  children,
  unsubscribeUrl,
  preferencesUrl,
}: BaseEmailProps) {
  return (
    <Html>
      <Head>
        <title>{title}</title>
      </Head>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={logoStyle}>
              📦 Compra Coletiva
            </Text>
          </Section>

          {/* Content */}
          <Section style={contentStyle}>
            {children}
          </Section>

          {/* Footer */}
          <Hr style={hrStyle} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Você está recebendo este email porque tem uma conta no Compra Coletiva.
            </Text>

            <Text style={footerLinksStyle}>
              {preferencesUrl && (
                <>
                  <Link href={preferencesUrl} style={linkStyle}>
                    Gerenciar preferências
                  </Link>
                  {' • '}
                </>
              )}
              <Link href={unsubscribeUrl} style={linkStyle}>
                Cancelar inscrição
              </Link>
            </Text>

            <Text style={footerTextStyle}>
              © {new Date().getFullYear()} Compra Coletiva. Todos os direitos reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Estilos mobile-first
const bodyStyle: React.CSSProperties = {
  backgroundColor: '#f6f6f6',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: '0',
  padding: '0',
};

const containerStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
};

const headerStyle: React.CSSProperties = {
  backgroundColor: '#2563eb', // Blue-600
  padding: '24px',
  textAlign: 'center',
};

const logoStyle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const contentStyle: React.CSSProperties = {
  padding: '32px 24px',
};

const hrStyle: React.CSSProperties = {
  borderColor: '#e5e7eb',
  margin: '0',
};

const footerStyle: React.CSSProperties = {
  padding: '24px',
  backgroundColor: '#f9fafb',
  textAlign: 'center',
};

const footerTextStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '8px 0',
};

const footerLinksStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '8px 0',
};

const linkStyle: React.CSSProperties = {
  color: '#2563eb',
  textDecoration: 'underline',
};
