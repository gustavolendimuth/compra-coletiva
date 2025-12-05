import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

/**
 * Card Component - Design System Primitive
 *
 * Composable card component with mobile-first responsive padding.
 * Follows design system colors, shadows, and spacing.
 */
export const Card = ({ children, className }: CardProps) => {
  return (
    <div className={cn(
      'bg-white rounded-lg shadow-sm border border-gray-200',
      'p-4 md:p-6', // Mobile-first padding
      className
    )}>
      {children}
    </div>
  );
};

/**
 * CardHeader - Optional header section with bottom border
 */
export const CardHeader = ({ children, className }: CardHeaderProps) => {
  return (
    <div className={cn(
      'border-b border-gray-200',
      'pb-4 mb-4 md:pb-6 md:mb-6', // Mobile-first spacing
      className
    )}>
      {children}
    </div>
  );
};

/**
 * CardBody - Main content area (no extra styling needed usually)
 */
export const CardBody = ({ children, className }: CardBodyProps) => {
  return (
    <div className={cn(className)}>
      {children}
    </div>
  );
};

/**
 * CardFooter - Optional footer section with top border
 */
export const CardFooter = ({ children, className }: CardFooterProps) => {
  return (
    <div className={cn(
      'border-t border-gray-200',
      'pt-4 mt-4 md:pt-6 md:mt-6', // Mobile-first spacing
      className
    )}>
      {children}
    </div>
  );
};

export default Card;
