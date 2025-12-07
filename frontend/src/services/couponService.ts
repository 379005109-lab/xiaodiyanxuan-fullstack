import apiClient from '@/lib/apiClient'

export interface Coupon {
  _id: string
  code: string
  type: 'fixed' | 'percent'
  value: number
  minAmount: number
  maxAmount: number
  description?: string
  validFrom: string
  validTo: string
  usageLimit: number
  usageCount: number
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface CouponCreateData {
  code?: string
  type?: 'fixed' | 'percent'
  value: number
  minAmount?: number
  maxAmount?: number
  description?: string
  validFrom?: string
  validTo?: string
  usageLimit?: number
  status?: 'active' | 'inactive'
}

// 后台管理 - 获取优惠券列表
export const getAdminCoupons = async (params?: { page?: number; pageSize?: number; status?: string; type?: string }) => {
  const response = await apiClient.get('/coupons/admin', { params })
  return response.data
}

// 后台管理 - 创建优惠券
export const createCoupon = async (data: CouponCreateData) => {
  const response = await apiClient.post('/coupons', data)
  return response.data
}

// 后台管理 - 更新优惠券
export const updateCoupon = async (id: string, data: Partial<CouponCreateData>) => {
  const response = await apiClient.put(`/coupons/${id}`, data)
  return response.data
}

// 后台管理 - 删除优惠券
export const deleteCoupon = async (id: string) => {
  const response = await apiClient.delete(`/coupons/${id}`)
  return response.data
}

// 陪买服务 - 自动发券
export const createShoppingServiceCoupon = async () => {
  const response = await apiClient.post('/coupons/shopping-service')
  return response.data
}

// 前端 - 获取可用优惠券
export const getAvailableCoupons = async () => {
  const response = await apiClient.get('/coupons')
  return response.data
}

// 前端 - 领取优惠券
export const claimCoupon = async (id: string) => {
  const response = await apiClient.post(`/coupons/${id}/claim`)
  return response.data
}
