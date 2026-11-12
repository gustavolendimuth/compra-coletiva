/**
 * Serializa dados para <script type="application/ld+json"> sem permitir que conteúdo
 * do usuário feche a tag (`</script>`) ou abra comentário (`<!--`): todo `<` vira `\u003c`,
 * e os separadores U+2028/U+2029 viram escapes. O resultado continua JSON válido e equivalente.
 */
const LINE_SEPARATOR = new RegExp(String.fromCharCode(0x2028), "g");
const PARAGRAPH_SEPARATOR = new RegExp(String.fromCharCode(0x2029), "g");

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(LINE_SEPARATOR, "\\u2028")
    .replace(PARAGRAPH_SEPARATOR, "\\u2029");
}
