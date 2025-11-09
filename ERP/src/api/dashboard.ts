import api from './axios';

export interface DashboardNotification {
  pending_vacation_count: number;
  pending_order_count: number;
}

export const fetchDashboardNotifications = async (): Promise<DashboardNotification> => {
  const response = await api.get('/dashboard/notifications/');
  return response.data;
};
