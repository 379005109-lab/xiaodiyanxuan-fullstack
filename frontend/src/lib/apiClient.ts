import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// 获取 API 基础 URL
const getApiUrl = () => {
  // 优先使用环境变量
  if (import.meta.env.VITE_API_URL) {
    const apiUrl = import.meta.env.VITE_API_URL;
    console.log(`✅ 使用环境变量 VITE_API_URL: ${apiUrl}`);
    return apiUrl;
  }
  
  // 开发环境默认本地
  if (import.meta.env.DEV) {
    console.log('✅ 开发环境，使用本地 API: http://localhost:8080');
    return 'http://localhost:8080';
  }
  
  // 生产环境：直接使用后端API地址
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // 如果在本地，使用本地 API
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
      console.log('✅ 本地环境，使用本地 API: http://localhost:8080');
      return 'http://localhost:8080';
    }
    
    // 如果在公网，使用相对路径（需要配置代理）或使用当前协议
    const protocol = window.location.protocol; // https: or http:
    const apiUrl = `${protocol}//lgpzubdtdxjf.sealoshzh.site/api`;
    console.log(`✅ 生产环境 (${hostname})，使用后端API: ${apiUrl}`);
    return apiUrl;
  }
  
  // 默认使用本地
  console.log('✅ 默认使用本地 API: http://localhost:8080');
  return 'http://localhost:8080';
};

const API_URL = getApiUrl();

console.log(`🔗 API 基础 URL: ${API_URL}`);
console.log(`📍 当前页面: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}`);
console.log(`🌍 环境: ${import.meta.env.MODE}`);

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: false, // 不发送凭证，避免 CORS 问题
});

apiClient.interceptors.request.use(
  (config) => {
    // 直接从Zustand store获取状态
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期或无效
      useAuthStore.getState().logout();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
