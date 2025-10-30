import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
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
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 disabled:hover:bg-primary-600',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:hover:bg-red-600',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 disabled:hover:bg-transparent'
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
