import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Textarea Component - Design System Primitive
 *
 * Mobile-first textarea field with label, error, and helper text support.
 * Uses 16px font size on mobile to prevent iOS zoom.
 * Follows design system colors and spacing.
 * Uses [color-scheme:light] to prevent browser dark mode from overriding styles.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block mb-2 text-sm font-medium text-sky-800">
            {label}
          </label>
        )}
        <textarea
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
            "transition-all resize-none",
            error && "border-red-400 focus:ring-red-400",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-sky-600/60">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
