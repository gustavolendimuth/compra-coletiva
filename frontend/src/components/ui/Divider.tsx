import { cn } from '@/lib/utils';

interface DividerProps {
  text?: string;
  className?: string;
}

/**
 * Divider Component - Design System Primitive
 *
 * Horizontal divider with optional centered text.
 * Mobile-first, follows design system colors.
 */
export const Divider = ({ text, className }: DividerProps) => {
  if (!text) {
    return <div className={cn('border-t border-gray-200', className)} />;
  }

  return (
    <div className={cn('relative my-4', className)}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-2 bg-white text-gray-500">{text}</span>
      </div>
    </div>
  );
};

export default Divider;
