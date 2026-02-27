import { forwardRef, useState, useEffect, useRef, ChangeEvent } from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  id?: string;
  label?: string;
  error?: string;
  helperText?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  placeholder?: string;
}

/**
 * CurrencyInput Component - Brazilian Real (BRL) Currency Input
 *
 * Features:
 * - Uses comma as decimal separator (Brazilian format)
 * - Limits to 2 decimal places
 * - Returns numeric string value (with dot) for form submission
 * - Mobile-first with 16px font to prevent iOS zoom
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      id,
      label,
      error,
      helperText,
      value,
      onChange,
      required,
      disabled,
      autoFocus,
      className,
      placeholder = "0,00",
    },
    ref
  ) => {
    // Track if we're currently typing (to avoid useEffect overwriting input)
    const isTypingRef = useRef(false);

    // Display value with comma formatting
    const [displayValue, setDisplayValue] = useState(() => {
      // Initialize from value prop
      if (value === "" || value === undefined) return "";
      const num = parseFloat(value);
      if (isNaN(num)) return "";
      return num.toLocaleString("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    });

    // Only sync from external value changes (not from typing)
    useEffect(() => {
      if (isTypingRef.current) {
        return;
      }

      if (value === "" || value === undefined) {
        setDisplayValue("");
        return;
      }

      const numericValue = parseFloat(value);
      if (isNaN(numericValue)) {
        setDisplayValue("");
        return;
      }

      // Format with comma as decimal separator
      setDisplayValue(
        numericValue.toLocaleString("pt-BR", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })
      );
    }, [value]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      isTypingRef.current = true;

      let inputValue = e.target.value;

      // Remove everything except digits and comma
      inputValue = inputValue.replace(/[^\d,]/g, "");

      // Handle multiple commas - keep only the first one
      const parts = inputValue.split(",");
      if (parts.length > 2) {
        inputValue = parts[0] + "," + parts.slice(1).join("");
      }

      // Limit decimal places to 2
      if (parts.length === 2 && parts[1].length > 2) {
        inputValue = parts[0] + "," + parts[1].slice(0, 2);
      }

      setDisplayValue(inputValue);

      // Convert to numeric string (with dot) for form value
      const numericString = inputValue.replace(",", ".");
      onChange(numericString);

      // Reset typing flag after a short delay
      setTimeout(() => {
        isTypingRef.current = false;
      }, 100);
    };

    const handleBlur = () => {
      isTypingRef.current = false;

      // On blur, format the value properly
      if (displayValue === "" || displayValue === ",") {
        setDisplayValue("");
        onChange("");
        return;
      }

      const numericValue = parseFloat(displayValue.replace(",", "."));
      if (isNaN(numericValue)) {
        setDisplayValue("");
        onChange("");
        return;
      }

      // Format with 2 decimal places
      const formatted = numericValue.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      setDisplayValue(formatted);
      onChange(numericValue.toString());
    };

    const handleFocus = () => {
      // When focusing, if it ends with ,00 remove it for easier editing
      if (displayValue.endsWith(",00")) {
        const withoutZeros = displayValue.slice(0, -3);
        setDisplayValue(withoutZeros);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block mb-2 text-sm font-medium text-sky-800"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-500 select-none font-medium">
            R$
          </span>
          <input
            ref={ref}
            id={id}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            required={required}
            disabled={disabled}
            autoFocus={autoFocus}
            placeholder={placeholder}
            className={cn(
              "w-full pl-10 pr-4 py-2.5",
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
          />
        </div>
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-sky-600/70">{helperText}</p>
        )}
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export default CurrencyInput;
