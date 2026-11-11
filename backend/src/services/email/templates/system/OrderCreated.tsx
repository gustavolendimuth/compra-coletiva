/**
 * Template: Pedido criado
 * Enviado quando um pedido novo e criado para o usuario
 */

import * as React from "react";
import { Text, Heading, Section } from "@react-email/components";
import { BaseEmail, colors } from "../base/BaseEmail";
import { Button } from "../base/Button";

export interface OrderCreatedProps {
  userName: string;
  campaignName: string;
  actionUrl: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export function OrderCreated({
  userName,
  campaignName,
  actionUrl,
  unsubscribeUrl,
  preferencesUrl,
}: OrderCreatedProps) {
  return (
    <BaseEmail
      title="Seu pedido foi criado"
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      <Heading style={h1Style}>Pedido criado com sucesso</Heading>

      <Text style={paragraphStyle}>
        Ola, <strong>{userName}</strong>!
      </Text>

      <Section style={campaignCardStyle}>
        <Text style={campaignLabelStyle}>Campanha</Text>
        <Text style={campaignNameStyle}>{campaignName}</Text>
      </Section>

      <Text style={paragraphStyle}>
        Um novo pedido foi criado para voce nesta campanha. Voce pode abrir a
        campanha para conferir os itens, valores e acompanhar atualizacoes.
      </Text>

      <div style={{ textAlign: "center" }}>
        <Button href={actionUrl}>Ver Pedido</Button>
      </div>
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
