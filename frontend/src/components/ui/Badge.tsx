import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Badge Component - Design System Primitive
 *
 * Mobile-friendly status badges with consistent design system colors.
 * Uses semantic color variants for different states.
 */
export const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  className
}: BadgeProps) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full whitespace-nowrap';

  const variants: Record<BadgeVariant, string> = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    neutral: 'bg-gray-100 text-gray-800'
  };

  const sizes: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };

  return (
    <span className={cn(baseClasses, variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
};

/**
 * StatusBadge - Convenience component for campaign/order status
 */
interface StatusBadgeProps {
  status: 'active' | 'closed' | 'sent' | 'archived' | 'pending' | 'paid' | 'unpaid';
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
    active: { variant: 'success', label: 'Ativo' },
    closed: { variant: 'neutral', label: 'Fechado' },
    sent: { variant: 'info', label: 'Enviado' },
    archived: { variant: 'warning', label: 'Arquivado' },
    pending: { variant: 'warning', label: 'Pendente' },
    paid: { variant: 'success', label: 'Pago' },
    unpaid: { variant: 'danger', label: 'Não Pago' }
  };

  const config = statusConfig[status] || { variant: 'neutral', label: status };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};

export default Badge;
