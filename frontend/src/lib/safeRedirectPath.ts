/**
 * Aceita só caminho interno (`/algo`) vindo da URL; recusa `//host`, `/\host` e URL absoluta,
 * que levariam o usuário para outro domínio depois do login.
 */
export function getSafeRedirectPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}
