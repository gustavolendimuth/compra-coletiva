/**
 * BaseEmail - Layout base para todos os emails
 * Design alinhado com a identidade visual do site:
 * Sky blue, terracotta, cream, Fraunces + DM Sans
 */

import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
  Font,
} from "@react-email/components";

interface BaseEmailProps {
  title: string;
  children?: React.ReactNode;
  unsubscribeUrl: string;
  preferencesUrl?: string;
}

export function BaseEmail({
  title,
  children,
  unsubscribeUrl,
  preferencesUrl,
}: BaseEmailProps) {
  return (
    <Html>
      <Head>
        <title>{title}</title>
        <Font
          fontFamily="Fraunces"
          fallbackFontFamily="Georgia"
          webFont={{
            url: "https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&display=swap",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="DM Sans"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <table
              cellPadding="0"
              cellSpacing="0"
              style={{ margin: "0 auto" }}
            >
              <tr>
                <td style={{ verticalAlign: "middle", paddingRight: "10px" }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="28"
                    height="28"
                  >
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" x2="21" y1="6" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </td>
                <td style={{ verticalAlign: "middle" }}>
                  <Text style={logoStyle}>Compra Coletiva</Text>
                </td>
              </tr>
            </table>
            <Text style={taglineStyle}>Compre junto, pague menos</Text>
          </Section>

          {/* Content */}
          <Section style={contentStyle}>{children}</Section>

          {/* Footer */}
          <Hr style={hrStyle} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Voce esta recebendo este email porque tem uma conta no Compra
              Coletiva.
            </Text>

            <Text style={footerLinksStyle}>
              {preferencesUrl && (
                <>
                  <Link href={preferencesUrl} style={linkStyle}>
                    Gerenciar preferencias
                  </Link>
                  {" \u2022 "}
                </>
              )}
              <Link href={unsubscribeUrl} style={linkStyle}>
                Cancelar inscricao
              </Link>
            </Text>

            <Text style={copyrightStyle}>
              &copy; {new Date().getFullYear()} Compra Coletiva. Todos os
              direitos reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// === Design tokens (alinhados com o site) ===
const colors = {
  primary50: "#f0f9ff",
  primary100: "#e0f2fe",
  primary500: "#0ea5e9",
  primary600: "#0284c7",
  primary700: "#0369a1",
  primary900: "#0c4a6e",
  terracotta500: "#d4644a",
  terracotta600: "#c04d33",
  cream50: "#fefdf8",
  cream100: "#fdf9ed",
  cream200: "#faf0d7",
};

// === Estilos ===
const bodyStyle: React.CSSProperties = {
  backgroundColor: colors.cream100,
  fontFamily: '"DM Sans", Arial, Helvetica, sans-serif',
  margin: "0",
  padding: "24px 0",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  overflow: "hidden",
  border: `1px solid ${colors.cream200}`,
};

const headerStyle: React.CSSProperties = {
  background: `linear-gradient(135deg, ${colors.primary500} 0%, ${colors.primary700} 100%)`,
  padding: "32px 24px 24px",
  textAlign: "center",
};

const logoStyle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "26px",
  fontWeight: "700",
  fontFamily: '"Fraunces", Georgia, "Times New Roman", serif',
  margin: "0",
  lineHeight: "1",
};

const taglineStyle: React.CSSProperties = {
  color: colors.primary100,
  fontSize: "13px",
  fontWeight: "400",
  fontFamily: '"DM Sans", Arial, Helvetica, sans-serif',
  margin: "8px 0 0 0",
  letterSpacing: "0.03em",
  opacity: "0.85",
};

const contentStyle: React.CSSProperties = {
  padding: "36px 32px",
};

const hrStyle: React.CSSProperties = {
  borderColor: colors.cream200,
  borderWidth: "1px",
  margin: "0",
};

const footerStyle: React.CSSProperties = {
  padding: "24px 32px",
  backgroundColor: colors.cream50,
  textAlign: "center",
};

const footerTextStyle: React.CSSProperties = {
  color: colors.primary700,
  fontSize: "12px",
  lineHeight: "20px",
  margin: "8px 0",
  opacity: "0.6",
};

const footerLinksStyle: React.CSSProperties = {
  color: colors.primary700,
  fontSize: "12px",
  margin: "8px 0",
};

const linkStyle: React.CSSProperties = {
  color: colors.terracotta500,
  textDecoration: "underline",
};

const copyrightStyle: React.CSSProperties = {
  color: colors.primary700,
  fontSize: "11px",
  lineHeight: "18px",
  margin: "12px 0 4px 0",
  opacity: "0.45",
};

export { colors };
