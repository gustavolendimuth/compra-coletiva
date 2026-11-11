/**
 * Template: Reset de senha
 * Enviado quando usuario solicita recuperacao de senha
 */

import * as React from "react";
import { Text, Heading, Section } from "@react-email/components";
import { BaseEmail, colors } from "../base/BaseEmail";
import { Button } from "../base/Button";

export interface PasswordResetProps {
  userName: string;
  resetUrl: string;
  expiresIn: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export function PasswordReset({
  userName,
  resetUrl,
  expiresIn,
  unsubscribeUrl,
  preferencesUrl,
}: PasswordResetProps) {
  return (
    <BaseEmail
      title="Redefinir senha"
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      <Heading style={h1Style}>Redefinir senha</Heading>

      <Text style={paragraphStyle}>
        Ola, <strong>{userName}</strong>!
      </Text>

      <Text style={paragraphStyle}>
        Voce solicitou a redefinicao da sua senha no Compra Coletiva.
      </Text>

      <Text style={paragraphStyle}>
        Clique no botao abaixo para criar uma nova senha:
      </Text>

      <div style={{ textAlign: "center" }}>
        <Button href={resetUrl}>Redefinir Senha</Button>
      </div>

      <Section style={warningStyle}>
        <table cellPadding="0" cellSpacing="0">
          <tr>
            <td style={{ verticalAlign: "top", paddingRight: "10px" }}>
              <span style={{ fontSize: "16px" }}>&#x23F3;</span>
            </td>
            <td>
              <Text style={warningTextStyle}>
                Este link expira em <strong>{expiresIn}</strong>. Apos esse
                periodo, sera necessario solicitar um novo link.
              </Text>
            </td>
          </tr>
        </table>
      </Section>

      <Text style={helpTextStyle}>
        Se voce nao solicitou a redefinicao de senha, ignore este email. Sua
        senha permanecera inalterada.
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
