import { inspect } from "util";

const consoleMethods = ["log", "info", "warn", "error", "debug"] as const;

// Silencia o console e junta tudo o que foi logado, para procurar dados pessoais
export function captureConsole() {
  const spies = consoleMethods.map((method) => jest.spyOn(console, method).mockImplementation(() => undefined));
  return {
    text: () =>
      spies
        .flatMap((spy) => spy.mock.calls)
        .map((args) => args.map((arg: unknown) => (typeof arg === "string" ? arg : inspect(arg, { depth: 10 }))).join(" "))
        .join("\n"),
    restore: () => spies.forEach((spy) => spy.mockRestore()),
  };
}
