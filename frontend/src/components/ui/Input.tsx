import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: "default" | "warning";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, variant = "default", ...props }, ref) => {
    const isWarning = variant === "warning" && !error;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block mb-2 text-sm font-medium text-sky-800">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
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
            isWarning && "border-amber-400 focus:ring-amber-400",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className={cn(
            "mt-1.5 text-sm",
            isWarning ? "text-amber-700" : "text-sky-600/60"
          )}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
