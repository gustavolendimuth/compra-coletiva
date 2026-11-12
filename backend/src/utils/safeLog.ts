/**
 * Erro reduzido para log: sem objetos crus (erros do Prisma trazem os `where`),
 * e-mails, JWTs e strings hex/base64 longas (tokens) trocados por [redacted].
 */

const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const JWT_PATTERN = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g;
const LONG_TOKEN_PATTERN = /\b[A-Za-z0-9_-]{32,}\b/g;
const PHONE_PATTERN = /\(?\d{2}\)?\s?9?\d{4}-?\d{4}/g;

export function redactSensitive(text: string): string {
  return text
    .replace(JWT_PATTERN, "[redacted]")
    .replace(EMAIL_PATTERN, "[redacted]")
    .replace(LONG_TOKEN_PATTERN, "[redacted]")
    .replace(PHONE_PATTERN, "[redacted]");
}

export interface SafeLogError {
  name: string;
  message: string;
  code?: string;
}

export function safeError(error: unknown): SafeLogError {
  if (error instanceof Error) {
    const code = (error as { code?: unknown }).code;
    return {
      name: error.name,
      message: redactSensitive(error.message),
      ...(typeof code === "string" ? { code } : {}),
    };
  }
  return { name: "UnknownError", message: redactSensitive(String(error)) };
}
