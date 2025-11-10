import { useQuery } from '@tanstack/react-query';
import { DashboardNotification, fetchDashboardNotifications } from '../../api/dashboard';

export const useDashboard = (role?: string) => {
  return useQuery<DashboardNotification>({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardNotifications,
    enabled: role === 'MANAGER', // MANAGER일 때만 쿼리 실행
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 10, // 10분
    refetchOnWindowFocus: false,
  });
};
