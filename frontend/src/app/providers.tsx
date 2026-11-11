'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthModalManager } from '@/components/AuthModal';
import { ClientErrorListener } from '@/components/shared/ClientErrorListener';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ClientErrorListener />
      <AuthProvider>
        <AuthModalManager />
        {children}
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
