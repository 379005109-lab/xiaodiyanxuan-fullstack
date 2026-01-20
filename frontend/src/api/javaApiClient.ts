import axios from 'axios';

// 使用 /baseapi 前缀，通过Vite代理访问Java后台
// Java后台接口用于：登录、授权、租户管理、组织架构、职位管理、角色管理、应用管理、菜单管理、应用套餐
export const javaApiClient = axios.create({
  baseURL: '/baseapi',
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});

// 请求拦截器 - 添加token
javaApiClient.interceptors.request.use(
  (config) => {
    // 优先使用 access_token，其次使用 token
    const accessToken = localStorage.getItem('access_token');
    const token = localStorage.getItem('token');
    const finalToken = accessToken || token;
    if (finalToken) {
      // 如果 token 已经包含 Bearer 前缀，直接使用
      config.headers.Authorization = finalToken.startsWith('Bearer ') ? finalToken : `Bearer ${finalToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
javaApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 401 错误只记录日志，不清除认证信息
      // 让页面组件或 ProtectedRoute 处理认证状态
      console.log('[javaApiClient] 401 错误，请检查 token 是否有效');
    }
    return Promise.reject(error);
  }
);

export default javaApiClient;
