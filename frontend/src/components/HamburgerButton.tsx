import React from 'react';

interface HamburgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

/**
 * Animated hamburger menu button
 * Transforms from hamburger to X when open
 */
export const HamburgerButton: React.FC<HamburgerButtonProps> = ({
  isOpen,
  onClick,
  className = ''
}) => {
  const handleClick = () => {
    console.log('HamburgerButton clicked');
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-primary-700 transition-colors ${className}`}
      aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
      aria-expanded={isOpen}
    >
      <div className="w-6 h-5 flex flex-col justify-between">
        {/* Top line */}
        <span
          className={`block h-0.5 w-full bg-white rounded-full transition-all duration-300 ease-in-out ${
            isOpen ? 'rotate-45 translate-y-2' : ''
          }`}
        />
        {/* Middle line */}
        <span
          className={`block h-0.5 w-full bg-white rounded-full transition-all duration-300 ease-in-out ${
            isOpen ? 'opacity-0' : ''
          }`}
        />
        {/* Bottom line */}
        <span
          className={`block h-0.5 w-full bg-white rounded-full transition-all duration-300 ease-in-out ${
            isOpen ? '-rotate-45 -translate-y-2' : ''
          }`}
        />
      </div>
    </button>
  );
};
