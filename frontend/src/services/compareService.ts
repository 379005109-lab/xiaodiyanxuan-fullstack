import apiClient from '@/lib/apiClient'

// 对比服务 - 使用云端API
export interface CompareItem {
  _id: string
  userId?: string
  productId: string
  skuId?: string
  selectedMaterials?: {
    fabric?: string
    filling?: string
    frame?: string
    leg?: string
  }
  addedAt?: string
}

// 获取对比列表
export const getAllCompareItems = async (): Promise<CompareItem[]> => {
  try {
    const response = await apiClient.get('/compare')
    return response.data.data.items || []
  } catch (error: any) {
    console.error('获取对比列表失败:', error)
    // 如果未登录，返回空数组
    if (error.response?.status === 401) {
      return []
    }
    throw new Error(error.response?.data?.message || '获取对比列表失败')
  }
}

// 添加到对比
export const addToCompare = async (productId: string, skuId?: string, selectedMaterials?: any) => {
  try {
    const response = await apiClient.post('/compare', {
      productId,
      skuId,
      selectedMaterials
    })
    return { success: true, message: response.data.message || '已添加到对比' }
  } catch (error: any) {
    const message = error.response?.data?.message || '添加对比失败'
    return { success: false, message }
  }
}

// 移除对比
export const removeFromCompare = async (productId: string, skuId?: string, selectedMaterials?: any) => {
  try {
    await apiClient.delete(`/compare/${productId}`, {
      data: { skuId, selectedMaterials }
    })
  } catch (error: any) {
    console.error('移除对比失败:', error)
    throw new Error(error.response?.data?.message || '移除对比失败')
  }
}

// 检查是否在对比列表中
export const isInCompare = async (productId: string, skuId?: string, selectedMaterials?: any): Promise<boolean> => {
  try {
    const items = await getAllCompareItems()
    return items.some(item => item.productId === productId)
  } catch (error) {
    return false
  }
}

// 清空对比列表
export const clearCompare = async () => {
  try {
    await apiClient.delete('/compare')
  } catch (error: any) {
    console.error('清空对比列表失败:', error)
    throw new Error(error.response?.data?.message || '清空对比列表失败')
  }
}

// 获取对比数量
export const getCompareCount = async (): Promise<number> => {
  try {
    const response = await apiClient.get('/compare/stats')
    return response.data.data.total || 0
  } catch (error) {
    return 0
  }
}
