import apiClient from '@/lib/apiClient';

export const getDashboardData = async () => {
  const response = await apiClient.get('/dashboard');
  return response.data.data || response.data;
};

export const getUserActivityDashboard = async () => {
  const response = await apiClient.get('/dashboard/activity');
  return response.data.data || response.data;
};

export const getUserLoginDetails = async (period: 'today' | 'week' | 'month' = 'today') => {
  const response = await apiClient.get(`/dashboard/user-logins?period=${period}`);
  return response.data;
};
