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

const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  const limited = digits.slice(0, 11);

  if (limited.length === 0) return "";
  if (limited.length <= 2) return limited;
  if (limited.length <= 6) {
    return `${limited.slice(0, 2)} ${limited.slice(2)}`;
  }
  if (limited.length <= 10) {
    return `${limited.slice(0, 2)} ${limited.slice(2, 6)}-${limited.slice(6)}`;
  }
  return `${limited.slice(0, 2)} ${limited.slice(2, 7)}-${limited.slice(7)}`;
};

const unformatPhone = (value: string): string => {
  return value.replace(/\D/g, "");
};

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    { label, error, helperText, className, value = "", onChange, ...props },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState(() => formatPhone(value));

    useEffect(() => {
      setDisplayValue(formatPhone(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const digits = unformatPhone(inputValue);
      const formatted = formatPhone(digits);

      setDisplayValue(formatted);

      if (onChange) {
        onChange(digits);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2 text-sm font-medium text-sky-800">
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
            "w-full px-4 py-2.5",
            "bg-white text-sky-900 placeholder:text-sky-400/60",
            "[color-scheme:light]",
            "text-base",
            "border border-sky-200 rounded-xl",
            "focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent",
            "disabled:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all",
            error && "border-red-400 focus:ring-red-400",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-sky-600/70">{helperText}</p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export default PhoneInput;
