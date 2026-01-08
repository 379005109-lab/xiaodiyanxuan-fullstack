import { useAuthStore } from '@/store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'https://bcvriiezbpza.sealoshzh.site/api';

// A helper to get the auth token from the Zustand store
const getAuthToken = () => {
  // This is a bit of a workaround to access the store outside of a React component.
  // It assumes the store has been initialized.
  return useAuthStore.getState().token;
};

export const getDashboardData = async () => {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}/dashboard`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch dashboard data');
  }

  const result = await response.json();
  return result.data || result;
};

export const getUserActivityDashboard = async () => {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}/dashboard/activity`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch activity dashboard');
  }

  const result = await response.json();
  return result.data || result;
};

export const getUserLoginDetails = async (period: 'today' | 'week' | 'month' = 'today') => {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}/dashboard/user-logins?period=${period}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch user login details');
  }

  const result = await response.json();
  return result;
};
