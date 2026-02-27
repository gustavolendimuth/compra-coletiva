import { cn } from '@/lib/utils';

interface DividerProps {
  text?: string;
  className?: string;
}

export const Divider = ({ text, className }: DividerProps) => {
  if (!text) {
    return <div className={cn('border-t border-sky-100', className)} />;
  }

  return (
    <div className={cn('relative my-4', className)}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-sky-100" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-3 bg-white text-sky-500">{text}</span>
      </div>
    </div>
  );
};

export default Divider;
