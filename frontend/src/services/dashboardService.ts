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
    // If the server response is not OK, throw an error
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch dashboard data');
  }

  const result = await response.json();
  // 后端使用successResponse包装，返回 { success: true, data: ... }
  return result.data || result;
};
