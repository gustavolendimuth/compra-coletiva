/**
 * Template: Confirmacao de email
 * Enviado no cadastro e na troca de email
 */

import * as React from "react";
import { Text, Heading, Section } from "@react-email/components";
import { BaseEmail, colors } from "../base/BaseEmail";
import { Button } from "../base/Button";

export interface VerifyEmailProps {
  userName: string;
  verifyUrl: string;
  heading: string;
  intro: string;
  buttonLabel: string;
  expiresIn: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export function VerifyEmail({
  userName,
  verifyUrl,
  heading,
  intro,
  buttonLabel,
  expiresIn,
  unsubscribeUrl,
  preferencesUrl,
}: VerifyEmailProps) {
  return (
    <BaseEmail
      title={heading}
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      <Heading style={h1Style}>{heading}</Heading>

      <Text style={paragraphStyle}>
        Ola, <strong>{userName}</strong>!
      </Text>

      <Text style={paragraphStyle}>{intro}</Text>

      <div style={{ textAlign: "center" }}>
        <Button href={verifyUrl}>{buttonLabel}</Button>
      </div>

      <Section style={warningStyle}>
        <Text style={warningTextStyle}>
          Este link expira em <strong>{expiresIn}</strong>.
        </Text>
      </Section>

      <Text style={helpTextStyle}>
        Se voce nao fez essa solicitacao, ignore este email. Nada sera alterado.
      </Text>
    </BaseEmail>
  );
}

const h1Style: React.CSSProperties = {
  color: colors.primary900,
  fontSize: "26px",
  fontWeight: "700",
  fontFamily: '"Fraunces", Georgia, "Times New Roman", serif',
  margin: "0 0 24px 0",
  lineHeight: "34px",
};

const paragraphStyle: React.CSSProperties = {
  color: colors.primary900,
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
  fontFamily: '"DM Sans", Arial, Helvetica, sans-serif',
};

const warningStyle: React.CSSProperties = {
  backgroundColor: "#fef3c7",
  border: "1px solid #fde68a",
  borderRadius: "12px",
  padding: "16px",
  margin: "20px 0",
};

const warningTextStyle: React.CSSProperties = {
  color: "#92400e",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
  fontFamily: '"DM Sans", Arial, Helvetica, sans-serif',
};

const helpTextStyle: React.CSSProperties = {
  color: colors.primary700,
  fontSize: "13px",
  lineHeight: "20px",
  margin: "24px 0 0 0",
  opacity: "0.7",
  fontFamily: '"DM Sans", Arial, Helvetica, sans-serif',
};
