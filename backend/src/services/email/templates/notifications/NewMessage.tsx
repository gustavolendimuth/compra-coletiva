/**
 * Template: Nova mensagem
 * Para mensagens privadas (order chat) ou perguntas publicas (Q&A)
 */

import * as React from "react";
import { Text, Heading, Section } from "@react-email/components";
import { BaseEmail, colors } from "../base/BaseEmail";
import { Button } from "../base/Button";

export interface NewMessageProps {
  userName: string;
  senderName: string;
  messagePreview: string;
  campaignName: string;
  isQuestion: boolean;
  actionUrl: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export function NewMessage({
  userName,
  senderName,
  messagePreview,
  campaignName,
  isQuestion,
  actionUrl,
  unsubscribeUrl,
  preferencesUrl,
}: NewMessageProps) {
  return (
    <BaseEmail
      title={
        isQuestion ? "Nova pergunta na campanha" : "Nova mensagem no pedido"
      }
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      <Heading style={h1Style}>
        {isQuestion ? "Nova pergunta" : "Nova mensagem"}
      </Heading>

      <Text style={paragraphStyle}>
        Ola, <strong>{userName}</strong>!
      </Text>

      <Text style={paragraphStyle}>
        <strong>{senderName}</strong>{" "}
        {isQuestion ? "perguntou" : "enviou uma mensagem"} em{" "}
        <strong>{campaignName}</strong>:
      </Text>

      <Section style={messageBoxStyle}>
        <table cellPadding="0" cellSpacing="0" style={{ width: "100%" }}>
          <tr>
            <td style={avatarCellStyle}>
              <div style={avatarStyle}>
                {senderName.charAt(0).toUpperCase()}
              </div>
            </td>
            <td style={{ verticalAlign: "top", paddingLeft: "12px" }}>
              <Text style={senderNameStyle}>{senderName}</Text>
              <Text style={messageTextStyle}>{messagePreview}</Text>
            </td>
          </tr>
        </table>
      </Section>

      <div style={{ textAlign: "center" }}>
        <Button href={actionUrl}>
          {isQuestion ? "Ver Pergunta e Responder" : "Ver Mensagem"}
        </Button>
      </div>

      <Text style={helpTextStyle}>
        {isQuestion
          ? "Responda a pergunta para ajudar outros usuarios interessados na campanha."
          : "Clique no botao acima para continuar a conversa."}
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

const messageBoxStyle: React.CSSProperties = {
  backgroundColor: colors.cream50,
  borderLeft: `4px solid ${colors.terracotta500}`,
  padding: "16px",
  margin: "20px 0",
  borderRadius: "0 12px 12px 0",
};

const avatarCellStyle: React.CSSProperties = {
  width: "40px",
  verticalAlign: "top",
};

const avatarStyle: React.CSSProperties = {
  width: "36px",
  height: "36px",
  backgroundColor: colors.primary500,
  color: "#ffffff",
  borderRadius: "50%",
  textAlign: "center",
  lineHeight: "36px",
  fontSize: "16px",
  fontWeight: "600",
  fontFamily: '"DM Sans", Arial, Helvetica, sans-serif',
};

const senderNameStyle: React.CSSProperties = {
  color: colors.primary900,
  fontSize: "14px",
  fontWeight: "600",
  fontFamily: '"DM Sans", Arial, Helvetica, sans-serif',
  margin: "0 0 4px 0",
};

const messageTextStyle: React.CSSProperties = {
  color: colors.primary900,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
  fontStyle: "italic",
  fontFamily: '"DM Sans", Arial, Helvetica, sans-serif',
  opacity: "0.85",
};

const helpTextStyle: React.CSSProperties = {
  color: colors.primary700,
  fontSize: "13px",
  lineHeight: "20px",
  margin: "24px 0 0 0",
  opacity: "0.7",
  fontFamily: '"DM Sans", Arial, Helvetica, sans-serif',
};
