import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML para prevenir XSS
 * Remove scripts, event handlers e tags perigosas
 */
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'span'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false
  });
};

/**
 * Sanitiza texto simples, convertendo para HTML seguro
 * Preserva quebras de linha
 */
export const sanitizeText = (text: string): string => {
  // Escapa HTML básico
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  // Converte quebras de linha em <br>
  return escaped.replace(/\n/g, '<br>');
};

/**
 * Hook para sanitizar e renderizar texto com quebras de linha
 */
export const useSanitizedHtml = (text: string): string => {
  return sanitizeText(text);
};
