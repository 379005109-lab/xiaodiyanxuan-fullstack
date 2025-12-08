// 统一的云端服务管理 - 使用本地化实现
import * as notificationService from './notificationService'
import { getAllCompareItems, addToCompare, removeFromCompare, isInCompare, clearCompare, getCompareCount } from './compareService'

// 防止多次401重定向
let isRedirecting = false;

/**
 * 云端服务配置
 */
export const cloudConfig = {
  apiUrl: import.meta.env.VITE_API_URL || '/api',
  useCloud: import.meta.env.VITE_USE_CLOUD === 'true',
  enableLocalFallback: import.meta.env.VITE_ENABLE_LOCAL_FALLBACK === 'true'
}

/**
 * 获取认证令牌
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('token')
}

/**
 * 设置认证令牌
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem('token', token)
}

/**
 * 清除认证令牌
 */
export const clearAuthToken = (): void => {
  localStorage.removeItem('token')
}

/**
 * 检查是否已认证
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken()
}

/**
 * 统一的 API 请求方法
 */
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = getAuthToken()
  const url = `${cloudConfig.apiUrl}${endpoint}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    })

    if (response.status === 401 && !isRedirecting) {
      // 令牌过期，清除并重定向到首页，防止重复重定向
      isRedirecting = true;
      clearAuthToken()
      setTimeout(() => {
        window.location.href = '/'
      }, 100)
      return null
    }

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `API 错误: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API 请求失败:', error)
    throw error
  }
}

/**
 * 通知服务导出 - 使用本地实现
 */
export const notificationServiceExport = {
  getAllNotifications: notificationService.getAllNotifications,
  getUnreadNotifications: notificationService.getUnreadNotifications,
  getUnreadCount: notificationService.getUnreadCount,
  addNotification: notificationService.addNotification,
  markAsRead: notificationService.markAsRead,
  markAllAsRead: notificationService.markAllAsRead,
  deleteNotification: notificationService.deleteNotification,
  clearAllNotifications: notificationService.clearAllNotifications,
  getRecentNotifications: notificationService.getRecentNotifications,
  getNotificationsByType: notificationService.getNotificationsByType,
  createOrderNotification: notificationService.createOrderNotification,
  createSystemNotification: notificationService.createSystemNotification,
  createMessageNotification: notificationService.createMessageNotification,
  getNotificationStats: notificationService.getNotificationStats
}

/**
 * 对比服务导出 - 使用本地实现
 */
export const compareServiceExport = {
  getAllCompareItems,
  addToCompare,
  removeFromCompare,
  isInCompare,
  clearCompare,
  getCompareCount,
  getCompareStats: () => ({ count: getCompareCount() }),
  addMultipleToCompare: (items: any[]) => items.forEach(item => addToCompare(item.productId, item.skuId, item.selectedMaterials))
}

/**
 * 高级功能服务（需要后端实现）
 */
export const advancedService = {
  // 搜索
  searchNotifications: async (query: string) => {
    return apiRequest('/notifications/search', {
      method: 'GET',
      body: JSON.stringify({ query })
    })
  },

  // 导出
  exportNotifications: async (format: 'json' | 'csv') => {
    return apiRequest(`/notifications/export?format=${format}`, {
      method: 'GET'
    })
  },

  // 批量操作
  batchOperateNotifications: async (
    ids: string[],
    operation: 'read' | 'unread' | 'delete'
  ) => {
    return apiRequest('/notifications/batch', {
      method: 'POST',
      body: JSON.stringify({ ids, operation })
    })
  },

  // 统计
  getNotificationStats: async () => {
    return apiRequest('/notifications/stats', {
      method: 'GET'
    })
  },

  // 报告
  generateReport: async () => {
    return apiRequest('/notifications/report', {
      method: 'GET'
    })
  }
}

/**
 * 用户服务（云端化）
 */
export const userService = {
  // 登录
  login: async (username: string, password: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
    if (response.data?.token) {
      setAuthToken(response.data.token)
    }
    return response
  },

  // 注册
  register: async (userData: any) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  },

  // 登出
  logout: async () => {
    clearAuthToken()
    return apiRequest('/auth/logout', {
      method: 'POST'
    })
  },

  // 获取当前用户
  getCurrentUser: async () => {
    return apiRequest('/auth/me', {
      method: 'GET'
    })
  },

  // 更新用户信息
  updateProfile: async (userData: any) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    })
  }
}

/**
 * 订单服务（云端化）
 */
export const orderService = {
  // 获取订单列表
  getOrders: async (params?: any) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/orders?${query}`, {
      method: 'GET'
    })
  },

  // 获取订单详情
  getOrderDetail: async (orderId: string) => {
    return apiRequest(`/orders/${orderId}`, {
      method: 'GET'
    })
  },

  // 创建订单
  createOrder: async (orderData: any) => {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    })
  },

  // 更新订单
  updateOrder: async (orderId: string, orderData: any) => {
    return apiRequest(`/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(orderData)
    })
  },

  // 取消订单
  cancelOrder: async (orderId: string) => {
    return apiRequest(`/orders/${orderId}/cancel`, {
      method: 'POST'
    })
  }
}

/**
 * 产品服务（云端化）
 */
export const productService = {
  // 获取产品列表
  getProducts: async (params?: any) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/products?${query}`, {
      method: 'GET'
    })
  },

  // 获取产品详情
  getProductDetail: async (productId: string) => {
    return apiRequest(`/products/${productId}`, {
      method: 'GET'
    })
  },

  // 搜索产品
  searchProducts: async (query: string) => {
    return apiRequest(`/products/search?q=${query}`, {
      method: 'GET'
    })
  }
}

/**
 * 统计服务（云端化）
 */
export const analyticsService = {
  // 获取仪表板数据
  getDashboardData: async () => {
    return apiRequest('/analytics/dashboard', {
      method: 'GET'
    })
  },

  // 获取订单统计
  getOrderStats: async (params?: any) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/analytics/orders?${query}`, {
      method: 'GET'
    })
  },

  // 获取用户统计
  getUserStats: async (params?: any) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/analytics/users?${query}`, {
      method: 'GET'
    })
  },

  // 获取销售统计
  getSalesStats: async (params?: any) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/analytics/sales?${query}`, {
      method: 'GET'
    })
  }
}

/**
 * 导出所有云端服务
 */
export default {
  cloudConfig,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  isAuthenticated,
  apiRequest,
  notificationService: notificationServiceExport,
  compareService: compareServiceExport,
  advancedService,
  userService,
  orderService,
  productService,
  analyticsService
}
