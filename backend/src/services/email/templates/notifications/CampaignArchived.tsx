/**
 * Template: Campanha arquivada
 */

import * as React from "react";
import { Text, Heading, Section } from "@react-email/components";
import { BaseEmail, colors } from "../base/BaseEmail";
import { Button } from "../base/Button";

export interface CampaignArchivedProps {
  userName: string;
  campaignName: string;
  actionUrl: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export function CampaignArchived({
  userName,
  campaignName,
  actionUrl,
  unsubscribeUrl,
  preferencesUrl,
}: CampaignArchivedProps) {
  return (
    <BaseEmail
      title="Campanha arquivada"
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      <Heading style={h1Style}>Campanha arquivada</Heading>

      <Text style={paragraphStyle}>
        Ola, <strong>{userName}</strong>!
      </Text>

      <Section style={campaignCardStyle}>
        <Text style={campaignLabelStyle}>Campanha</Text>
        <Text style={campaignNameStyle}>{campaignName}</Text>
        <Text style={statusStyle}>&#x2705; Concluida e arquivada</Text>
      </Section>

      <Text style={paragraphStyle}>
        Todos os pedidos foram pagos e o processo foi concluido. Voce ainda
        pode acessar a campanha arquivada para consultar informacoes.
      </Text>

      <div style={{ textAlign: "center" }}>
        <Button href={actionUrl} variant="secondary">
          Ver Campanha
        </Button>
      </div>

      <Text style={helpTextStyle}>
        Campanhas arquivadas ficam disponiveis para consulta a qualquer momento.
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

const campaignCardStyle: React.CSSProperties = {
  backgroundColor: colors.cream50,
  borderRadius: "12px",
  padding: "16px 20px",
  margin: "20px 0",
  borderLeft: `4px solid ${colors.cream200}`,
  border: `1px solid ${colors.cream200}`,
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
  color: colors.primary700,
  fontSize: "13px",
  fontWeight: "500",
  fontFamily: '"DM Sans", Arial, Helvetica, sans-serif',
  margin: "8px 0 0 0",
  opacity: "0.7",
};

const helpTextStyle: React.CSSProperties = {
  color: colors.primary700,
  fontSize: "13px",
  lineHeight: "20px",
  margin: "24px 0 0 0",
  opacity: "0.7",
  fontFamily: '"DM Sans", Arial, Helvetica, sans-serif',
};
