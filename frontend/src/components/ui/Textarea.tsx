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
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2 text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "w-full px-4 py-2",
            "bg-white text-gray-900 placeholder:text-gray-400",
            "[color-scheme:light]", // Force light color scheme to prevent browser dark mode override
            "text-base", // 16px minimum to prevent iOS zoom
            "border border-gray-300 rounded-lg",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors resize-none",
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

Textarea.displayName = "Textarea";

export default Textarea;
