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

export const Card = ({ children, className }: CardProps) => {
  return (
    <div className={cn(
      'bg-white rounded-3xl shadow-sm border border-sky-100/50',
      'p-4 md:p-6',
      className
    )}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className }: CardHeaderProps) => {
  return (
    <div className={cn(
      'border-b border-sky-100',
      'pb-4 mb-4 md:pb-5 md:mb-5',
      className
    )}>
      {children}
    </div>
  );
};

export const CardBody = ({ children, className }: CardBodyProps) => {
  return (
    <div className={cn(className)}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className }: CardFooterProps) => {
  return (
    <div className={cn(
      'border-t border-sky-100',
      'pt-4 mt-4 md:pt-5 md:mt-5',
      className
    )}>
      {children}
    </div>
  );
};

export default Card;
