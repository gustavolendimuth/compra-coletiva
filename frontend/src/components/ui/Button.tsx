import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

/**
 * Button Component - Design System Primitive
 *
 * Mobile-first, theme-consistent button with variants.
 * Follows design system colors and spacing.
 * Touch-friendly with 44px minimum height on mobile.
 */
export const Button = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}: ButtonProps) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:hover:bg-blue-600',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 disabled:hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:hover:bg-red-600',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 disabled:hover:bg-transparent'
  };

  // Mobile-first sizing with touch-friendly targets
  const sizes = {
    sm: 'min-h-[36px] px-3 py-1.5 text-sm',
    md: 'min-h-[44px] px-4 py-2 text-base md:min-h-[40px]', // 44px mobile, 40px desktop
    lg: 'min-h-[48px] px-6 py-3 text-lg md:min-h-[44px]'  // 48px mobile, 44px desktop
  };

  return (
    <button
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
