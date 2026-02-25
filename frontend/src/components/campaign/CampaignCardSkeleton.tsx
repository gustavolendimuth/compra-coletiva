export function CampaignCardSkeleton() {
  return (
    <div className="h-full bg-white rounded-3xl border border-sky-100/50 p-5 shadow-sm animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-16 bg-sky-100 rounded-full" />
        <div className="h-6 w-3/4 bg-sky-100 rounded-xl" />
        <div className="h-4 w-1/2 bg-sky-50 rounded-lg" />
      </div>

      {/* Body skeleton */}
      <div className="mt-3 space-y-3">
        <div className="space-y-2">
          <div className="h-4 w-full bg-sky-50 rounded-lg" />
          <div className="h-4 w-2/3 bg-sky-50 rounded-lg" />
        </div>
        <div className="flex gap-4">
          <div className="h-4 w-24 bg-sky-50 rounded-lg" />
          <div className="h-4 w-24 bg-sky-50 rounded-lg" />
        </div>
      </div>

      {/* Products preview skeleton */}
      <div className="mt-4 flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-20 h-16 bg-sky-50 rounded-2xl" />
        ))}
      </div>

      {/* Footer skeleton */}
      <div className="mt-4 pt-3 border-t border-sky-100/60">
        <div className="flex justify-between">
          <div className="h-4 w-20 bg-sky-50 rounded-lg" />
          <div className="h-6 w-28 bg-sky-100 rounded-full" />
        </div>
      </div>
    </div>
  );
}

interface CampaignGridSkeletonProps {
  count?: number;
}

export function CampaignGridSkeleton({ count = 6 }: CampaignGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CampaignCardSkeleton key={i} />
      ))}
    </div>
  );
}
