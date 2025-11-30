import apiClient from '@/lib/apiClient'

// 角色常量
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  PLATFORM_ADMIN: 'platform_admin',
  PLATFORM_STAFF: 'platform_staff',
  ENTERPRISE_ADMIN: 'enterprise_admin',
  ENTERPRISE_STAFF: 'enterprise_staff',
  DESIGNER: 'designer',
  SPECIAL_GUEST: 'special_guest',
  CUSTOMER: 'customer',
} as const

export const ROLE_LABELS: Record<string, string> = {
  super_admin: '超级管理员',
  platform_admin: '平台管理员',
  platform_staff: '平台子账号',
  enterprise_admin: '企业管理员',
  enterprise_staff: '企业子账号',
  designer: '设计师',
  special_guest: '特殊账号',
  customer: '普通客户',
}

export const ORGANIZATION_TYPES = {
  PLATFORM: 'platform',
  ENTERPRISE: 'enterprise',
} as const

export const ORG_TYPE_LABELS: Record<string, string> = {
  platform: '供应链平台',
  enterprise: '企业',
}

// 类型定义
export interface Organization {
  _id: string
  name: string
  type: 'platform' | 'enterprise'
  code: string
  logo?: string
  description?: string
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
  adminUserId?: {
    _id: string
    username: string
    nickname: string
  }
  discountConfig?: {
    defaultDiscount: number
    canViewCostPrice: boolean
    categoryDiscounts: Array<{
      categoryId: string
      categoryName: string
      discountRate: number
    }>
  }
  quota?: {
    maxUsers: number
    maxProducts: number
    usedUsers: number
    usedProducts: number
  }
  status: 'active' | 'inactive' | 'suspended'
  createdAt: string
}

export interface AccountUser {
  _id: string
  username: string
  nickname: string
  phone?: string
  email?: string
  avatar?: string
  role: string
  organizationId?: Organization
  permissions?: {
    canAccessAdmin: boolean
    canViewCostPrice: boolean
    canDownloadMaterial: boolean
    canManageUsers: boolean
    canManageProducts: boolean
    canManageOrders: boolean
    canViewReports: boolean
  }
  specialAccountConfig?: {
    expiresAt: string
    accessCode: string
    maxUsage: number
    usedCount: number
    note?: string
  }
  // 用户标签（如：批量下载、高风险等）
  tags?: string[]
  // 下载统计
  downloadStats?: {
    totalDownloads: number
    consecutiveDownloads: number
    lastDownloadAt?: string
    firstTaggedAt?: string
  }
  status: 'active' | 'inactive' | 'banned' | 'expired'
  createdAt: string
  lastLoginAt?: string
}

// ==================== 组织管理 API ====================

export const getOrganizations = async (params?: {
  type?: string
  status?: string
  page?: number
  limit?: number
}) => {
  const response = await apiClient.get('/accounts/organizations', { params })
  return response.data.data
}

export const createOrganization = async (data: {
  name: string
  type: 'platform' | 'enterprise'
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
  description?: string
}) => {
  const response = await apiClient.post('/accounts/organizations', data)
  return response.data.data
}

export const updateOrganization = async (id: string, data: Partial<Organization>) => {
  const response = await apiClient.put(`/accounts/organizations/${id}`, data)
  return response.data.data
}

export const deleteOrganization = async (id: string) => {
  const response = await apiClient.delete(`/accounts/organizations/${id}`)
  return response.data
}

export const setOrganizationDiscount = async (id: string, data: {
  defaultDiscount?: number
  canViewCostPrice?: boolean
  categoryDiscounts?: Array<{
    categoryId: string
    categoryName: string
    discountRate: number
  }>
}) => {
  const response = await apiClient.put(`/accounts/organizations/${id}/discount`, data)
  return response.data.data
}

// ==================== 用户管理 API ====================

export const getUsers = async (params?: {
  role?: string
  organizationId?: string
  status?: string
  keyword?: string
  page?: number
  limit?: number
}) => {
  const response = await apiClient.get('/accounts/users', { params })
  return response.data.data
}

export const createUser = async (data: {
  username: string
  password: string
  nickname?: string
  phone?: string
  email?: string
  role: string
  organizationId?: string
}) => {
  const response = await apiClient.post('/accounts/users', data)
  return response.data.data
}

export const updateUser = async (id: string, data: Partial<AccountUser>) => {
  const response = await apiClient.put(`/accounts/users/${id}`, data)
  return response.data.data
}

export const resetUserPassword = async (id: string, newPassword: string) => {
  const response = await apiClient.post(`/accounts/users/${id}/reset-password`, { newPassword })
  return response.data
}

export const deleteUser = async (id: string) => {
  const response = await apiClient.delete(`/accounts/users/${id}`)
  return response.data
}

// ==================== 特殊账号 API ====================

export const getSpecialAccounts = async (params?: {
  page?: number
  limit?: number
}) => {
  const response = await apiClient.get('/accounts/special-accounts', { params })
  return response.data.data
}

export const createSpecialAccount = async (data: {
  note?: string
  expiresInHours?: number
  maxUsage?: number
}) => {
  const response = await apiClient.post('/accounts/special-accounts', data)
  return response.data.data
}

export const invalidateSpecialAccount = async (id: string) => {
  const response = await apiClient.post(`/accounts/special-accounts/${id}/invalidate`)
  return response.data
}

// ==================== 统计 API ====================

export const getRoleStats = async () => {
  const response = await apiClient.get('/accounts/stats')
  return response.data.data
}
