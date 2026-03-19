/**
 * Template: Pagamento liberado
 * Enviado aos participantes quando o pagamento PIX e liberado pelo criador da campanha
 */

import * as React from "react";
import { Text, Heading, Section } from "@react-email/components";
import { BaseEmail, colors } from "../base/BaseEmail";
import { Button } from "../base/Button";

export interface PaymentReleasedProps {
  userName: string;
  campaignName: string;
  pixKey: string;
  pixType: string;
  pixName?: string;
  actionUrl: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

const pixTypeLabels: Record<string, string> = {
  CPF: "CPF",
  CNPJ: "CNPJ",
  EMAIL: "E-mail",
  PHONE: "Telefone",
  RANDOM: "Chave Aleatoria",
};

export function PaymentReleased({
  userName,
  campaignName,
  pixKey,
  pixType,
  pixName,
  actionUrl,
  unsubscribeUrl,
  preferencesUrl,
}: PaymentReleasedProps) {
  return (
    <BaseEmail
      title="Pagamento liberado"
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      <Heading style={h1Style}>Pagamento liberado!</Heading>

      <Text style={paragraphStyle}>
        Ola, <strong>{userName}</strong>!
      </Text>

      <Text style={paragraphStyle}>
        O pagamento via PIX do grupo <strong>{campaignName}</strong> foi
        liberado. Realize o pagamento e envie o comprovante para confirmar.
      </Text>

      {/* PIX Details Card */}
      <Section style={pixCardStyle}>
        <table cellPadding="0" cellSpacing="0" style={{ width: "100%" }}>
          <tr>
            <td>
              <Text style={pixBadgeStyle}>PIX</Text>
            </td>
          </tr>
          <tr>
            <td>
              <Text style={pixLabelStyle}>
                Tipo: <strong>{pixTypeLabels[pixType] || pixType}</strong>
              </Text>
            </td>
          </tr>
          <tr>
            <td>
              <Section style={pixKeyContainerStyle}>
                <Text style={pixKeyStyle}>{pixKey}</Text>
              </Section>
            </td>
          </tr>
          {pixName && (
            <tr>
              <td>
                <Text style={pixHolderStyle}>
                  Titular: <strong>{pixName}</strong>
                </Text>
              </td>
            </tr>
          )}
        </table>
      </Section>

      <Text style={instructionStyle}>
        Acesse a campanha para copiar a chave PIX e enviar o comprovante de
        pagamento.
      </Text>

      <div style={{ textAlign: "center" }}>
        <Button href={actionUrl}>Ver Campanha e Pagar</Button>
      </div>

      <Text style={helpTextStyle}>
        Voce recebeu este email porque participa do grupo {campaignName}.
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

const pixCardStyle: React.CSSProperties = {
  backgroundColor: "#ecfdf5",
  border: "2px solid #a7f3d0",
  borderRadius: "16px",
  padding: "24px",
  margin: "24px 0",
};

const pixBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#059669",
  color: "#ffffff",
  fontSize: "11px",
  fontWeight: "700",
  fontFamily: '"DM Sans", Arial, Helvetica, sans-serif',
  letterSpacing: "0.08em",
  padding: "4px 14px",
  borderRadius: "50px",
  margin: "0 0 16px 0",
  textTransform: "uppercase" as const,
};

const pixLabelStyle: React.CSSProperties = {
  color: "#065f46",
  fontSize: "13px",
  margin: "0 0 8px 0",
  fontFamily: '"DM Sans", Arial, Helvetica, sans-serif',
};

const pixKeyContainerStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #d1fae5",
  borderRadius: "10px",
  padding: "14px 18px",
  margin: "8px 0",
};

const pixKeyStyle: React.CSSProperties = {
  color: colors.primary900,
  fontSize: "18px",
  fontWeight: "600",
  fontFamily: '"Courier New", Courier, monospace',
  margin: "0",
  wordBreak: "break-all" as const,
  letterSpacing: "0.03em",
};

const pixHolderStyle: React.CSSProperties = {
  color: "#065f46",
  fontSize: "13px",
  margin: "12px 0 0 0",
  fontFamily: '"DM Sans", Arial, Helvetica, sans-serif',
  opacity: "0.8",
};

const instructionStyle: React.CSSProperties = {
  color: colors.primary900,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 8px 0",
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
