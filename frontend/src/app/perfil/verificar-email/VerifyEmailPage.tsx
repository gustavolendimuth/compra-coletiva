'use client';

import { Suspense } from 'react';
import { VerifyEmailChange } from '@/views/VerifyEmailChange';

export function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailChange />
    </Suspense>
  );
}
