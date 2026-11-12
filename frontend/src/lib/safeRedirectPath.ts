const PROBE_ORIGIN = "https://redirect-check.invalid";

/**
 * Aceita só caminho interno (`/algo`) vindo da URL; recusa o que levaria o usuário para outro
 * domínio depois do login. Resolve o caminho como o navegador faz, porque ele remove tab e
 * quebra de linha e trata `\` como `/`: `"/\t/evil.com"` e `"/\evil.com"` viram `//evil.com`.
 */
export function getSafeRedirectPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/")) return null;
  if (new URL(value, PROBE_ORIGIN).origin !== PROBE_ORIGIN) return null;
  return value;
}
