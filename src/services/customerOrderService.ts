import apiClient from '@/lib/apiClient'
import { CustomerOrder, CustomerOrderItem, OrderStatus } from '@/types'

// 获取订单列表
export const getCustomerOrders = async (): Promise<CustomerOrder[]> => {
  try {
    const response = await apiClient.get('/api/orders')
    return response.data.data || []
  } catch (error: any) {
    console.error('获取订单列表失败:', error)
    throw error
  }
}

// 创建订单
export const createCustomerOrder = async (payload: Omit<CustomerOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const response = await apiClient.post('/api/orders', payload)
    return response.data.data
  } catch (error: any) {
    console.error('创建订单失败:', error)
    throw error
  }
}

// 更新订单
export const updateCustomerOrder = async (id: string, updates: Partial<CustomerOrder>) => {
  try {
    const response = await apiClient.put(`/api/orders/${id}`, updates)
    return response.data.data
  } catch (error: any) {
    console.error('更新订单失败:', error)
    throw error
  }
}

// 删除订单
export const deleteCustomerOrder = async (id: string) => {
  try {
    const response = await apiClient.delete(`/api/orders/${id}`)
    return response.data.success
  } catch (error: any) {
    console.error('删除订单失败:', error)
    throw error
  }
}

// 添加订单项目
export const appendItemToOrder = async (orderId: string, item: CustomerOrderItem) => {
  try {
    const response = await apiClient.post(`/api/orders/${orderId}/items`, item)
    return response.data.data
  } catch (error: any) {
    console.error('添加订单项目失败:', error)
    throw error
  }
}

// 更新订单状态
export const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  try {
    const response = await apiClient.patch(`/api/orders/${orderId}/status`, { status })
    return response.data.data
  } catch (error: any) {
    console.error('更新订单状态失败:', error)
    throw error
  }
}
