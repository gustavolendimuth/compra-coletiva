/**
 * Template: Boas-vindas
 * Enviado quando usuario se cadastra
 */

import * as React from "react";
import { Text, Heading, Section } from "@react-email/components";
import { BaseEmail, colors } from "../base/BaseEmail";
import { Button } from "../base/Button";

export interface WelcomeProps {
  userName: string;
  homeUrl: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export function Welcome({
  userName,
  homeUrl,
  unsubscribeUrl,
  preferencesUrl,
}: WelcomeProps) {
  return (
    <BaseEmail
      title="Bem-vindo ao Compra Coletiva!"
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      <Heading style={h1Style}>Bem-vindo ao Compra Coletiva!</Heading>

      <Text style={paragraphStyle}>
        Ola, <strong>{userName}</strong>!
      </Text>

      <Text style={paragraphStyle}>
        Estamos felizes em ter voce conosco! Sua conta foi criada com sucesso.
      </Text>

      <Section style={featuresContainerStyle}>
        <Text style={featuresTitle}>Com o Compra Coletiva, voce pode:</Text>

        <table cellPadding="0" cellSpacing="0" style={{ width: "100%" }}>
          <tr>
            <td style={featureIconCellStyle}>
              <div style={featureIconStyle}>
                <span style={{ fontSize: "18px" }}>&#x1f4e6;</span>
              </div>
            </td>
            <td style={featureTextCellStyle}>
              <Text style={featureTextStyle}>
                Criar grupos de compra e economizar comprando em quantidade
              </Text>
            </td>
          </tr>
          <tr>
            <td style={featureIconCellStyle}>
              <div style={featureIconStyle}>
                <span style={{ fontSize: "18px" }}>&#x1f91d;</span>
              </div>
            </td>
            <td style={featureTextCellStyle}>
              <Text style={featureTextStyle}>
                Participar de campanhas e aproveitar melhores precos
              </Text>
            </td>
          </tr>
          <tr>
            <td style={featureIconCellStyle}>
              <div style={featureIconStyle}>
                <span style={{ fontSize: "18px" }}>&#x1f4cb;</span>
              </div>
            </td>
            <td style={featureTextCellStyle}>
              <Text style={featureTextStyle}>
                Gerenciar seus pedidos e acompanhar entregas
              </Text>
            </td>
          </tr>
          <tr>
            <td style={featureIconCellStyle}>
              <div style={featureIconStyle}>
                <span style={{ fontSize: "18px" }}>&#x1f4ac;</span>
              </div>
            </td>
            <td style={featureTextCellStyle}>
              <Text style={featureTextStyle}>
                Conversar com organizadores e tirar duvidas
              </Text>
            </td>
          </tr>
        </table>
      </Section>

      <div style={{ textAlign: "center" }}>
        <Button href={homeUrl}>Explorar Campanhas</Button>
      </div>

      <Text style={helpTextStyle}>
        Duvidas? Entre em contato conosco a qualquer momento.
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

const featuresContainerStyle: React.CSSProperties = {
  backgroundColor: colors.cream50,
  borderRadius: "12px",
  padding: "20px",
  margin: "24px 0",
  border: `1px solid ${colors.cream200}`,
};

const featuresTitle: React.CSSProperties = {
  color: colors.terracotta500,
  fontSize: "14px",
  fontWeight: "600",
  fontFamily: '"DM Sans", Arial, Helvetica, sans-serif',
  margin: "0 0 16px 0",
  letterSpacing: "0.02em",
  textTransform: "uppercase" as const,
};

const featureIconCellStyle: React.CSSProperties = {
  width: "36px",
  verticalAlign: "top",
  paddingBottom: "12px",
};

const featureIconStyle: React.CSSProperties = {
  width: "32px",
  height: "32px",
  backgroundColor: colors.primary50,
  borderRadius: "8px",
  textAlign: "center",
  lineHeight: "32px",
};

const featureTextCellStyle: React.CSSProperties = {
  verticalAlign: "middle",
  paddingLeft: "8px",
  paddingBottom: "12px",
};

const featureTextStyle: React.CSSProperties = {
  color: colors.primary900,
  fontSize: "14px",
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
