import { describe, it, expect } from "vitest";
import { getPasswordErrors } from "../passwordRules";

describe("getPasswordErrors", () => {
  // Mesmas regras e textos do AuthService.validatePassword do backend
  it.each([
    ["Abcd1", ["A senha deve ter pelo menos 6 caracteres"]],
    ["abcde1", ["A senha deve conter pelo menos uma letra maiúscula"]],
    ["ABCDE1", ["A senha deve conter pelo menos uma letra minúscula"]],
    ["Abcdef", ["A senha deve conter pelo menos um número"]],
    [
      "",
      [
        "A senha deve ter pelo menos 6 caracteres",
        "A senha deve conter pelo menos uma letra maiúscula",
        "A senha deve conter pelo menos uma letra minúscula",
        "A senha deve conter pelo menos um número",
      ],
    ],
  ])("senha %j quebra exatamente as regras esperadas", (password, expected) => {
    expect(getPasswordErrors(password)).toEqual(expected);
  });

  it("aceita a senha de 6 caracteres com maiúscula, minúscula e número (fronteira)", () => {
    expect(getPasswordErrors("Abcde1")).toEqual([]);
  });
});
