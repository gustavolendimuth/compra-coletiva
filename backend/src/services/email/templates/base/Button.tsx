/**
 * Button - Componente de botão CTA para emails
 * Alinhado com design system (azul primário)
 */

import * as React from 'react';
import { Button as EmailButton } from '@react-email/components';

interface ButtonProps {
  href: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ href, children, variant = 'primary' }: ButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <EmailButton
      href={href}
      style={{
        ...baseStyle,
        ...(isPrimary ? primaryStyle : secondaryStyle),
      }}
    >
      {children}
    </EmailButton>
  );
}

const baseStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '12px 24px',
  fontSize: '16px',
  fontWeight: '600',
  textAlign: 'center',
  textDecoration: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  minWidth: '200px',
  marginTop: '16px',
  marginBottom: '16px',
};

const primaryStyle: React.CSSProperties = {
  backgroundColor: '#2563eb', // Blue-600
  color: '#ffffff',
};

const secondaryStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: '#2563eb',
  border: '2px solid #2563eb',
};
