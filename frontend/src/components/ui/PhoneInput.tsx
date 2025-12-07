import { InputHTMLAttributes, forwardRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PhoneInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  label?: string;
  error?: string;
  helperText?: string;
  value?: string;
  onChange?: (value: string) => void;
}

/**
 * Formata número de telefone brasileiro
 * Entrada: "11999998888" ou "1199998888"
 * Saída: "11 99999-8888" ou "11 9999-8888"
 */
const formatPhone = (value: string): string => {
  // Remove tudo que não é dígito
  const digits = value.replace(/\D/g, "");

  // Limita a 11 dígitos (DDD + 9 dígitos)
  const limited = digits.slice(0, 11);

  if (limited.length === 0) return "";
  if (limited.length <= 2) return limited;
  if (limited.length <= 6) {
    return `${limited.slice(0, 2)} ${limited.slice(2)}`;
  }
  if (limited.length <= 10) {
    // Telefone fixo: XX XXXX-XXXX
    return `${limited.slice(0, 2)} ${limited.slice(2, 6)}-${limited.slice(6)}`;
  }
  // Celular: XX XXXXX-XXXX
  return `${limited.slice(0, 2)} ${limited.slice(2, 7)}-${limited.slice(7)}`;
};

/**
 * Remove formatação e retorna apenas dígitos
 */
const unformatPhone = (value: string): string => {
  return value.replace(/\D/g, "");
};

/**
 * PhoneInput Component - Design System Primitive
 *
 * Input de telefone com máscara brasileira (XX XXXXX-XXXX).
 * Mobile-first com touch targets adequados.
 * Armazena valor sem formatação, exibe com formatação.
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    { label, error, helperText, className, value = "", onChange, ...props },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState(() => formatPhone(value));

    // Sincroniza quando value externo muda
    useEffect(() => {
      setDisplayValue(formatPhone(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const digits = unformatPhone(inputValue);
      const formatted = formatPhone(digits);

      setDisplayValue(formatted);

      // Passa o valor sem formatação para o parent
      if (onChange) {
        onChange(digits);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2 text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type="tel"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          placeholder="11 99999-8888"
          className={cn(
            "w-full px-4 py-2",
            "bg-white text-gray-900 placeholder:text-gray-400",
            "[color-scheme:light]",
            "text-base", // 16px minimum to prevent iOS zoom
            "border border-gray-300 rounded-lg",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export default PhoneInput;

