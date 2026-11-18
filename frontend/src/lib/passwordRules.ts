/**
 * Regras de senha do reset, iguais às do backend (AuthService.validatePassword),
 * com os mesmos textos, para o usuário ver o problema antes de enviar.
 */
export const PASSWORD_MIN_LENGTH = 6;

export const PASSWORD_RULES_HINT =
  "Use pelo menos 6 caracteres, com uma letra maiúscula, uma minúscula e um número.";

export const getPasswordErrors = (password: string): string[] => {
  const errors: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push("A senha deve ter pelo menos 6 caracteres");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("A senha deve conter pelo menos uma letra maiúscula");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("A senha deve conter pelo menos uma letra minúscula");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("A senha deve conter pelo menos um número");
  }

  return errors;
};
