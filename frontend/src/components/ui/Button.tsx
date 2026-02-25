import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'cta';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}: ButtonProps) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

  const variants = {
    primary: 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-300/30 hover:from-sky-600 hover:to-sky-700 hover:shadow-sky-400/40 active:from-sky-700 active:to-sky-800 disabled:hover:from-sky-500 disabled:hover:to-sky-600',
    secondary: 'bg-white/70 border border-sky-200/60 text-sky-800 hover:bg-white hover:border-sky-300 active:bg-sky-50 disabled:hover:bg-white/70',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-200/30 hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 disabled:hover:from-red-500 disabled:hover:to-red-600',
    ghost: 'bg-transparent text-sky-700 hover:bg-sky-50 hover:text-sky-900 active:bg-sky-100 disabled:hover:bg-transparent',
    cta: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-300/30 hover:from-amber-600 hover:to-orange-600 hover:shadow-amber-300/40 active:from-amber-700 active:to-orange-700 disabled:hover:from-amber-500 disabled:hover:to-orange-500',
  };

  const sizes = {
    sm: 'min-h-[36px] px-3 py-1.5 text-sm',
    md: 'min-h-[44px] px-5 py-2.5 text-sm md:min-h-[40px]',
    lg: 'min-h-[48px] px-7 py-3 text-base md:min-h-[44px]'
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
