/**
 * Segredos de assinatura exigidos em produção.
 * Fora de produção, a ausência cai nos defaults de desenvolvimento (públicos).
 */

export const REQUIRED_SECRETS = [
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "PUBLIC_ALIAS_SECRET",
] as const;

export type SecretName = (typeof REQUIRED_SECRETS)[number];

export const MIN_SECRET_LENGTH = 32;

export const DEV_SECRET_DEFAULTS: Record<SecretName, string> = {
  JWT_ACCESS_SECRET: "dev-access-secret-change-in-production",
  JWT_REFRESH_SECRET: "dev-refresh-secret-change-in-production",
  PUBLIC_ALIAS_SECRET: "dev-public-alias-secret-change-in-production",
};

/**
 * Lista os problemas dos segredos (nunca inclui o valor na mensagem).
 */
export function findSecretProblems(env: NodeJS.ProcessEnv = process.env): string[] {
  const problems: string[] = [];
  for (const name of REQUIRED_SECRETS) {
    const value = env[name];
    if (!value) {
      problems.push(`${name} ausente`);
    } else if (value === DEV_SECRET_DEFAULTS[name]) {
      problems.push(`${name} igual ao valor padrão de desenvolvimento`);
    } else if (value.length < MIN_SECRET_LENGTH) {
      problems.push(`${name} com menos de ${MIN_SECRET_LENGTH} caracteres`);
    }
  }
  return problems;
}

/**
 * Em produção, encerra o processo (exit 1) se algum segredo estiver ausente, fraco ou padrão.
 */
export function assertProductionSecrets(
  env: NodeJS.ProcessEnv = process.env,
  exit: (code: number) => never = process.exit
): void {
  if (env.NODE_ENV !== "production") return;

  const problems = findSecretProblems(env);
  if (problems.length === 0) return;

  for (const problem of problems) {
    console.error(`[Secrets] ${problem}`);
  }
  console.error("[Secrets] Configure segredos aleatórios com 32+ caracteres. Encerrando.");
  exit(1);
}

/**
 * Valor efetivo de um segredo (default de dev quando ausente fora de produção).
 */
export function getSecret(name: SecretName, env: NodeJS.ProcessEnv = process.env): string {
  return env[name] || DEV_SECRET_DEFAULTS[name];
}
