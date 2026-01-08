/**
 * Dashboard Page
 * Página principal do painel admin
 */

import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/api';
import { DashboardStats } from './components/DashboardStats';
import { RecentActivity } from './components/RecentActivity';

export function Dashboard() {
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: () => adminService.getDashboardStats(),
  });

  const { data: activityData, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['admin', 'dashboard', 'activity'],
    queryFn: () => adminService.getDashboardActivity(),
  });

  if (isLoadingStats || isLoadingActivity) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!statsData || !activityData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-gray-600">Erro ao carregar dados do dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Visão geral da plataforma</p>
      </div>

      <DashboardStats stats={statsData.data.stats} />

      <RecentActivity
        recentUsers={statsData.data.recentUsers}
        recentCampaigns={activityData.data.recentCampaigns}
        recentOrders={activityData.data.recentOrders}
      />
    </div>
  );
}

export default Dashboard;
