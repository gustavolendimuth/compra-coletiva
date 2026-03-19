/**
 * Template: Campanha pronta para enviar
 * Quando todos os pedidos estao pagos
 */

import * as React from "react";
import { Text, Heading, Section } from "@react-email/components";
import { BaseEmail, colors } from "../base/BaseEmail";
import { Button } from "../base/Button";

export interface CampaignReadyToSendProps {
  userName: string;
  campaignName: string;
  actionUrl: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export function CampaignReadyToSend({
  userName,
  campaignName,
  actionUrl,
  unsubscribeUrl,
  preferencesUrl,
}: CampaignReadyToSendProps) {
  return (
    <BaseEmail
      title="Grupo pronto para enviar"
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      <Section style={celebrationBannerStyle}>
        <Text style={celebrationEmojiStyle}>&#x1f389;</Text>
        <Heading style={h1BannerStyle}>Grupo pronto para enviar!</Heading>
      </Section>

      <Text style={paragraphStyle}>
        Ola, <strong>{userName}</strong>!
      </Text>

      <Section style={campaignCardStyle}>
        <Text style={campaignLabelStyle}>Campanha</Text>
        <Text style={campaignNameStyle}>{campaignName}</Text>
        <Text style={statusStyle}>
          &#x2705; Todos os pedidos foram pagos
        </Text>
      </Section>

      <Text style={paragraphStyle}>
        Voce ja pode fazer o pedido ao fornecedor e alterar o status da campanha
        para <strong>ENVIADO</strong> quando concluir.
      </Text>

      <div style={{ textAlign: "center" }}>
        <Button href={actionUrl}>Ver Campanha</Button>
      </div>

      <Text style={helpTextStyle}>
        Esta campanha esta pronta para voce enviar ao fornecedor.
      </Text>
    </BaseEmail>
  );
}

const celebrationBannerStyle: React.CSSProperties = {
  backgroundColor: "#ecfdf5",
  borderRadius: "12px",
  padding: "20px",
  textAlign: "center",
  margin: "0 0 24px 0",
  border: "1px solid #a7f3d0",
};

const celebrationEmojiStyle: React.CSSProperties = {
  fontSize: "36px",
  margin: "0 0 8px 0",
  lineHeight: "1",
};

const h1BannerStyle: React.CSSProperties = {
  color: "#065f46",
  fontSize: "24px",
  fontWeight: "700",
  fontFamily: '"Fraunces", Georgia, "Times New Roman", serif',
  margin: "0",
  lineHeight: "32px",
};

const paragraphStyle: React.CSSProperties = {
  color: colors.primary900,
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
  fontFamily: '"DM Sans", Arial, Helvetica, sans-serif',
};

const campaignCardStyle: React.CSSProperties = {
  backgroundColor: colors.primary50,
  borderRadius: "12px",
  padding: "16px 20px",
  margin: "20px 0",
  borderLeft: `4px solid ${colors.primary500}`,
};

const campaignLabelStyle: React.CSSProperties = {
  color: colors.primary600,
  fontSize: "11px",
  fontWeight: "600",
  fontFamily: '"DM Sans", Arial, Helvetica, sans-serif',
  margin: "0 0 4px 0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
};

const campaignNameStyle: React.CSSProperties = {
  color: colors.primary900,
  fontSize: "18px",
  fontWeight: "600",
  fontFamily: '"Fraunces", Georgia, "Times New Roman", serif',
  margin: "0",
  lineHeight: "24px",
};

const statusStyle: React.CSSProperties = {
  color: "#059669",
  fontSize: "13px",
  fontWeight: "500",
  fontFamily: '"DM Sans", Arial, Helvetica, sans-serif',
  margin: "8px 0 0 0",
};

const helpTextStyle: React.CSSProperties = {
  color: colors.primary700,
  fontSize: "13px",
  lineHeight: "20px",
  margin: "24px 0 0 0",
  opacity: "0.7",
  fontFamily: '"DM Sans", Arial, Helvetica, sans-serif',
};
