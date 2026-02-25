'use client';

/**
 * AdminLayout Component
 * Layout do painel admin com sidebar
 */

import { AdminSidebar } from './components/AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen" style={{ background: '#fefdf8' }}>
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}

export default AdminLayout;
