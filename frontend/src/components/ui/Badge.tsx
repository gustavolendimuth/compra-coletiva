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

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  className
}: BadgeProps) => {
  const baseClasses = 'inline-flex items-center font-semibold rounded-full whitespace-nowrap';

  const variants: Record<BadgeVariant, string> = {
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-sky-100 text-sky-700',
    neutral: 'bg-sky-50 text-sky-700/70'
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
