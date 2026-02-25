import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'warning' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  children?: ReactNode;
}

export default function IconButton({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  className,
  children,
  disabled,
  ...props
}: IconButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

  const variants = {
    primary: 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-sm shadow-sky-300/30 hover:shadow-md hover:shadow-sky-300/40 disabled:hover:shadow-sm',
    secondary: 'bg-white/80 text-sky-800 border border-sky-200/60 hover:bg-sky-50 hover:border-sky-300 disabled:hover:bg-white/80',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-300/20 disabled:hover:bg-red-500',
    ghost: 'bg-transparent text-sky-700 hover:bg-sky-50 disabled:hover:bg-transparent',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-300/20 disabled:hover:bg-amber-500',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-300/20 disabled:hover:bg-emerald-500'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
      {children && <span>{children}</span>}
      {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
    </button>
  );
}
