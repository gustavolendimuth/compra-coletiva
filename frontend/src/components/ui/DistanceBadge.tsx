interface DistanceBadgeProps {
  distanceKm: number;
  className?: string;
}

export function DistanceBadge({ distanceKm, className = '' }: DistanceBadgeProps) {
  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };

  const getColor = (km: number) => {
    if (km <= 5) return 'bg-green-100 text-green-800';
    if (km <= 20) return 'bg-blue-100 text-blue-800';
    if (km <= 50) return 'bg-gray-100 text-gray-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getColor(distanceKm)} ${className}`}
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      {formatDistance(distanceKm)}
    </span>
  );
}
