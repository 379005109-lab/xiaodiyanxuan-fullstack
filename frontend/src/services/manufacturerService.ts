import apiClient from '@/lib/apiClient'

export interface Manufacturer {
  _id: string
  name: string
  code?: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  address?: string
  description?: string
  status: 'active' | 'inactive'
  createdAt: string
}

// 获取所有厂家（用于下拉选择）
export const getAllManufacturers = async (): Promise<Manufacturer[]> => {
  try {
    const response = await apiClient.get('/manufacturers/all')
    return response.data.data || []
  } catch (error) {
    console.error('获取厂家列表失败:', error)
    return []
  }
}

// 获取厂家列表（分页）
export const getManufacturers = async (params?: { page?: number; pageSize?: number; keyword?: string; status?: string }) => {
  try {
    const response = await apiClient.get('/manufacturers', { params })
    return response.data
  } catch (error) {
    console.error('获取厂家列表失败:', error)
    throw error
  }
}

// 创建厂家
export const createManufacturer = async (data: Partial<Manufacturer>) => {
  const response = await apiClient.post('/manufacturers', data)
  return response.data
}

// 更新厂家
export const updateManufacturer = async (id: string, data: Partial<Manufacturer>) => {
  const response = await apiClient.put(`/manufacturers/${id}`, data)
  return response.data
}

// 删除厂家
export const deleteManufacturer = async (id: string) => {
  const response = await apiClient.delete(`/manufacturers/${id}`)
  return response.data
}
