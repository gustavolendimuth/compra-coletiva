/**
 * AdminLayout Component
 * Layout do painel admin com sidebar
 */

import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './components/AdminSidebar';

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
