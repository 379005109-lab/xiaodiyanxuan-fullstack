import apiClient from '@/lib/apiClient'

// 对比服务 - 未登录用localStorage，已登录用云端API
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

const COMPARE_STORAGE_KEY = 'compare_items'
const MAX_COMPARE_ITEMS = 4

// 检查是否已登录
const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token')
  return !!token
}

// 本地存储操作
const getLocalCompareItems = (): CompareItem[] => {
  try {
    const items = localStorage.getItem(COMPARE_STORAGE_KEY)
    return items ? JSON.parse(items) : []
  } catch {
    return []
  }
}

const setLocalCompareItems = (items: CompareItem[]) => {
  localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(items))
}

// 获取对比列表
export const getAllCompareItems = async (): Promise<CompareItem[]> => {
  // 未登录时使用本地存储
  if (!isAuthenticated()) {
    return getLocalCompareItems()
  }
  
  try {
    const response = await apiClient.get('/compare')
    return response.data.data.items || []
  } catch (error: any) {
    console.error('获取对比列表失败:', error)
    if (error.response?.status === 401) {
      return getLocalCompareItems()
    }
    throw new Error(error.response?.data?.message || '获取对比列表失败')
  }
}

// 添加到对比
export const addToCompare = async (productId: string, skuId?: string, selectedMaterials?: any) => {
  // 未登录时使用本地存储
  if (!isAuthenticated()) {
    const items = getLocalCompareItems()
    if (items.length >= MAX_COMPARE_ITEMS) {
      return { success: false, message: `最多只能对比${MAX_COMPARE_ITEMS}个商品` }
    }
    if (items.some(item => item.productId === productId)) {
      return { success: false, message: '该商品已在对比列表中' }
    }
    const newItem: CompareItem = {
      _id: `local_${Date.now()}`,
      productId,
      skuId,
      selectedMaterials,
      addedAt: new Date().toISOString()
    }
    items.push(newItem)
    setLocalCompareItems(items)
    return { success: true, message: '已添加到对比' }
  }
  
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
  // 未登录时使用本地存储
  if (!isAuthenticated()) {
    const items = getLocalCompareItems()
    const filtered = items.filter(item => item.productId !== productId)
    setLocalCompareItems(filtered)
    return
  }
  
  try {
    await apiClient.delete(`/compare/${productId}`, {
      data: { skuId, selectedMaterials }
    })
  } catch (error: any) {
    console.error('移除对比失败:', error)
    throw new Error(error.response?.data?.message || '移除对比失败')
  }
}

// 检查是否在对比列表中 - 同步方法避免重复API调用
export const isInCompareSync = (productId: string, compareItems: CompareItem[]): boolean => {
  return compareItems.some(item => item.productId === productId)
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
  // 未登录时使用本地存储
  if (!isAuthenticated()) {
    setLocalCompareItems([])
    return
  }
  
  try {
    await apiClient.delete('/compare')
  } catch (error: any) {
    console.error('清空对比列表失败:', error)
    throw new Error(error.response?.data?.message || '清空对比列表失败')
  }
}

// 获取对比数量
export const getCompareCount = async (): Promise<number> => {
  // 未登录时使用本地存储
  if (!isAuthenticated()) {
    return getLocalCompareItems().length
  }
  
  try {
    const response = await apiClient.get('/compare/stats')
    return response.data.data.total || 0
  } catch (error) {
    return 0
  }
}
