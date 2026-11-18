'use client';

import { Suspense } from 'react';
import { VerifySignupEmail } from '@/views/VerifySignupEmail';

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function VerifySignupEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifySignupEmail />
    </Suspense>
  );
}
