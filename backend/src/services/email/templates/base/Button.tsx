/**
 * Button - Componente de botao CTA para emails
 * Alinhado com design system: sky blue primario, terracotta secundario
 */

import * as React from "react";
import { Button as EmailButton } from "@react-email/components";
import { colors } from "./BaseEmail";

interface ButtonProps {
  href: string;
  children?: React.ReactNode;
  variant?: "primary" | "secondary";
}

export function Button({ href, children, variant = "primary" }: ButtonProps) {
  const isPrimary = variant === "primary";

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
  display: "inline-block",
  padding: "14px 32px",
  fontSize: "15px",
  fontWeight: "600",
  fontFamily: '"DM Sans", Arial, Helvetica, sans-serif',
  textAlign: "center",
  textDecoration: "none",
  borderRadius: "50px",
  cursor: "pointer",
  minWidth: "200px",
  marginTop: "20px",
  marginBottom: "20px",
  letterSpacing: "0.02em",
};

const primaryStyle: React.CSSProperties = {
  backgroundColor: colors.primary500,
  color: "#ffffff",
};

const secondaryStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  color: colors.terracotta500,
  border: `2px solid ${colors.terracotta500}`,
};
