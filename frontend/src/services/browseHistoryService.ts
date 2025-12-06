import apiClient from '@/lib/apiClient'

export interface BrowseRecord {
  _id: string
  userId: string
  productId: string
  productName: string
  productImage: string
  productCode: string
  categoryName: string
  source: 'web' | 'miniapp' | 'admin' | 'share'
  deviceInfo: {
    userAgent: string
    ip: string
    platform: string
  }
  viewedAt: string
}

export interface BrowsePathItem {
  step: number
  productId: string
  productName: string
  productCode: string
  productImage: string
  categoryName: string
  source: string
  viewedAt: string
  intervalMinutes: number
}

export interface BrowseStats {
  totalViews: number
  todayViews: number
  topCategories: { _id: string; count: number }[]
  recentProducts: {
    _id: string
    productName: string
    productImage: string
    lastViewedAt: string
    viewCount: number
  }[]
}

// 获取用户的浏览历史
export const getUserBrowseHistory = async (
  userId: string,
  options: { page?: number; limit?: number; startDate?: string; endDate?: string } = {}
) => {
  const { page = 1, limit = 50, startDate, endDate } = options
  const params = new URLSearchParams()
  params.append('page', String(page))
  params.append('limit', String(limit))
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)

  const response = await apiClient.get(`/browse-history/user/${userId}?${params.toString()}`)
  return response.data
}

// 获取用户的浏览路径
export const getUserBrowsePath = async (
  userId: string,
  options: { startDate?: string; endDate?: string; limit?: number } = {}
): Promise<BrowsePathItem[]> => {
  const { startDate, endDate, limit = 100 } = options
  const params = new URLSearchParams()
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  params.append('limit', String(limit))

  const response = await apiClient.get(`/browse-history/user/${userId}/path?${params.toString()}`)
  return response.data.data
}

// 获取用户的浏览统计
export const getUserBrowseStats = async (userId: string): Promise<BrowseStats> => {
  const response = await apiClient.get(`/browse-history/user/${userId}/stats`)
  return response.data.data
}

// 获取所有浏览历史（管理员）
export const getAllBrowseHistory = async (
  options: { page?: number; limit?: number; userId?: string; productId?: string; startDate?: string; endDate?: string } = {}
) => {
  const params = new URLSearchParams()
  if (options.page) params.append('page', String(options.page))
  if (options.limit) params.append('limit', String(options.limit))
  if (options.userId) params.append('userId', options.userId)
  if (options.productId) params.append('productId', options.productId)
  if (options.startDate) params.append('startDate', options.startDate)
  if (options.endDate) params.append('endDate', options.endDate)

  const response = await apiClient.get(`/browse-history/all?${params.toString()}`)
  return response.data
}
