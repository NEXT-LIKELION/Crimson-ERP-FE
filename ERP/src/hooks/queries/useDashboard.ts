import { useQuery } from '@tanstack/react-query';
import { fetchDashboardData, DashboardData } from '../../api/dashboard';

export const useDashboard = () => {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await fetchDashboardData();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5분
    refetchOnWindowFocus: false,
  });
};
