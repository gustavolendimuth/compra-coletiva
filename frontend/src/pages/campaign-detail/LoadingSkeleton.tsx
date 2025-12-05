import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SkeletonDetailHeader, SkeletonProductCard } from '@/components/Skeleton';

export function LoadingSkeleton() {
  return (
    <div>
      <div className="mb-4 md:mb-6">
        <Link to="/campaigns" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-3 md:mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Link>
        <SkeletonDetailHeader />
      </div>

      <div className="hidden md:flex gap-1 mb-6 border-b">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-6 py-2 border-b-2 border-transparent">
            <div className="h-5 w-24 bg-gray-200 animate-pulse rounded" />
          </div>
        ))}
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="flex">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center justify-center flex-1 py-2 px-1">
              <div className="w-5 h-5 bg-gray-200 animate-pulse rounded mb-0.5" />
              <div className="h-3 w-10 bg-gray-200 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6 pb-20 md:pb-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonProductCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
