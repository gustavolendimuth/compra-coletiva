import { AppError } from "../middleware/errorHandler";

export type FileExtension = "jpg" | "png" | "webp" | "pdf";

export interface DetectedFileType {
  extension: FileExtension;
  mime: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
}

export const IMAGE_EXTENSIONS: FileExtension[] = ["jpg", "png", "webp"];
export const PAYMENT_PROOF_EXTENSIONS: FileExtension[] = ["jpg", "png", "webp", "pdf"];

const startsWith = (buffer: Buffer, bytes: number[], offset = 0) =>
  buffer.length >= offset + bytes.length && bytes.every((byte, index) => buffer[offset + index] === byte);

const ascii = (text: string) => Array.from(text).map((char) => char.charCodeAt(0));

/**
 * Detecta o tipo pelo conteúdo (assinatura dos bytes iniciais), nunca pelo nome ou Content-Type
 */
export function detectFileType(buffer: Buffer | undefined | null): DetectedFileType | null {
  if (!buffer || buffer.length === 0) {
    return null;
  }
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) {
    return { extension: "jpg", mime: "image/jpeg" };
  }
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47])) {
    return { extension: "png", mime: "image/png" };
  }
  if (startsWith(buffer, ascii("RIFF")) && startsWith(buffer, ascii("WEBP"), 8)) {
    return { extension: "webp", mime: "image/webp" };
  }
  if (startsWith(buffer, ascii("%PDF-"))) {
    return { extension: "pdf", mime: "application/pdf" };
  }
  return null;
}

/**
 * Garante que o arquivo é de um dos tipos permitidos; senão lança 400
 */
export function assertAllowedFileType(buffer: Buffer, allowed: FileExtension[]): DetectedFileType {
  const detected = detectFileType(buffer);
  if (!detected || !allowed.includes(detected.extension)) {
    const accepted = allowed.includes("pdf")
      ? "Apenas imagens (JPEG, PNG, WebP) ou PDF são permitidos"
      : "Apenas imagens (JPEG, PNG, WebP) são permitidas";
    throw new AppError(400, `Arquivo inválido. ${accepted}`);
  }
  return detected;
}

/**
 * Nome de arquivo aleatório com extensão do tipo detectado
 */
export function buildStoredFilename(detected: DetectedFileType): string {
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}.${detected.extension}`;
}
