/**
 * Avatar Component
 * Displays user avatar with fallback to initials
 */
/* eslint-disable @next/next/no-img-element */

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-24 h-24 text-2xl',
};

function getInitials(name: string): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

function getColorFromName(name: string): string {
  // Generate consistent color based on name
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  src,
  name,
  size = 'md',
  className = '',
  onClick,
}: AvatarProps) {
  const sizeClass = sizeClasses[size];
  const initials = getInitials(name);
  const bgColor = getColorFromName(name);

  const baseClasses = `rounded-full flex items-center justify-center font-semibold text-white overflow-hidden ${sizeClass} ${className}`;
  const clickableClasses = onClick
    ? 'cursor-pointer hover:opacity-80 transition-opacity'
    : '';

  if (src) {
    return (
      <div className={`${baseClasses} ${clickableClasses}`} onClick={onClick}>
        <img
          src={src}
          alt={`Avatar de ${name}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Hide image on error, show initials
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        {/* Fallback initials (hidden when image loads) */}
        <span className={`absolute ${bgColor} w-full h-full flex items-center justify-center -z-10`}>
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${bgColor} ${clickableClasses}`}
      onClick={onClick}
    >
      {initials}
    </div>
  );
}

export default Avatar;
