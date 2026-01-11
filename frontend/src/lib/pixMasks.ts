/**
 * PIX Input Masks
 * Utility functions to format and mask PIX keys based on their type
 */

export type PixKeyType = "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "RANDOM";

/**
 * Format CPF: ###.###.###-##
 */
export function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, "");
  const limited = numbers.slice(0, 11);

  if (limited.length <= 3) return limited;
  if (limited.length <= 6) return `${limited.slice(0, 3)}.${limited.slice(3)}`;
  if (limited.length <= 9) return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
  return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
}

/**
 * Format CNPJ: ##.###.###/####-##
 */
export function formatCNPJ(value: string): string {
  const numbers = value.replace(/\D/g, "");
  const limited = numbers.slice(0, 14);

  if (limited.length <= 2) return limited;
  if (limited.length <= 5) return `${limited.slice(0, 2)}.${limited.slice(2)}`;
  if (limited.length <= 8) return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5)}`;
  if (limited.length <= 12) return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8)}`;
  return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8, 12)}-${limited.slice(12)}`;
}

/**
 * Format Phone: (##) #####-####
 */
export function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, "");
  const limited = numbers.slice(0, 11);

  if (limited.length <= 2) return limited.length > 0 ? `(${limited}` : "";
  if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
}

/**
 * Apply mask based on PIX type
 */
export function applyPixMask(value: string, type: PixKeyType | ""): string {
  if (!type) return value;

  switch (type) {
    case "CPF":
      return formatCPF(value);
    case "CNPJ":
      return formatCNPJ(value);
    case "PHONE":
      return formatPhone(value);
    case "EMAIL":
    case "RANDOM":
      // No formatting for email and random keys
      return value;
    default:
      return value;
  }
}

/**
 * Remove mask from value (get only numbers for CPF/CNPJ/PHONE)
 */
export function removeMask(value: string, type: PixKeyType | ""): string {
  if (!type) return value;

  switch (type) {
    case "CPF":
    case "CNPJ":
    case "PHONE":
      return value.replace(/\D/g, "");
    case "EMAIL":
    case "RANDOM":
      return value;
    default:
      return value;
  }
}

/**
 * Get placeholder text based on PIX type
 */
export function getPixPlaceholder(type: PixKeyType | ""): string {
  switch (type) {
    case "CPF":
      return "000.000.000-00";
    case "CNPJ":
      return "00.000.000/0000-00";
    case "EMAIL":
      return "email@exemplo.com";
    case "PHONE":
      return "(00) 00000-0000";
    case "RANDOM":
      return "Chave aleatória gerada pelo banco";
    default:
      return "Selecione o tipo primeiro";
  }
}
