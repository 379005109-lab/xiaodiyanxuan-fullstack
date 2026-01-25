import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  getAllCompareItems, 
  addToCompare as addToCompareApi, 
  removeFromCompare as removeFromCompareApi,
  clearCompare as clearCompareApi,
  CompareItem
} from '@/services/compareService'

interface CompareStore {
  compareItems: CompareItem[]
  isModalOpen: boolean
  initialized: boolean
  loadCompareItems: () => Promise<void>
  addToCompare: (productId: string, skuId?: string, selectedMaterials?: Record<string, string>) => Promise<{ success: boolean; message: string }>
  removeFromCompare: (productId: string, skuId?: string, selectedMaterials?: Record<string, string>) => void
  isInCompare: (productId: string, skuId?: string) => boolean
  clearAll: () => void
  getCount: () => number
  openModal: () => void
  closeModal: () => void
}

// 生成唯一key
const getItemKey = (productId: string, skuId?: string, materials?: Record<string, string>) => {
  return `${productId}-${skuId || ''}-${materials ? JSON.stringify(materials) : ''}`
}

export const useCompareStore = create<CompareStore>()((set, get) => ({
  compareItems: [],
  isModalOpen: false,
  initialized: false,
  
  loadCompareItems: async () => {
    if (get().initialized) return
    try {
      const items = await getAllCompareItems()
      set({ compareItems: items, initialized: true })
    } catch (error) {
      console.error('加载对比列表失败:', error)
      set({ initialized: true })
    }
  },
  
  addToCompare: async (productId: string, skuId?: string, selectedMaterials?: Record<string, string>) => {
    const { compareItems } = get()
    
    // 检查是否已存在
    const key = getItemKey(productId, skuId, selectedMaterials)
    const exists = compareItems.some(item => getItemKey(item.productId, item.skuId, item.selectedMaterials) === key)
    
    if (exists) {
      return { success: false, message: '该商品已在对比列表中' }
    }
    
    if (compareItems.length >= 4) {
      return { success: false, message: '最多只能对比4个商品' }
    }
    
    // 先更新本地状态
    const newItem: CompareItem = { 
      _id: `local_${Date.now()}`, 
      productId, 
      skuId, 
      selectedMaterials,
      addedAt: new Date().toISOString()
    }
    set({ compareItems: [...compareItems, newItem] })
    
    // 后台同步到服务器
    try {
      await addToCompareApi(productId, skuId, selectedMaterials)
    } catch (err) {
      console.error('同步对比项到服务器失败:', err)
    }
    
    return { success: true, message: '已添加到对比' }
  },
  
  removeFromCompare: (productId: string, skuId?: string, selectedMaterials?: Record<string, string>) => {
    const key = getItemKey(productId, skuId, selectedMaterials)
    set(state => ({
      compareItems: state.compareItems.filter(item => 
        getItemKey(item.productId, item.skuId, item.selectedMaterials) !== key
      )
    }))
    
    // 后台同步到服务器，不等待
    removeFromCompareApi(productId, skuId, selectedMaterials).catch(err => {
      console.error('从服务器删除对比项失败:', err)
    })
  },
  
  isInCompare: (productId: string, skuId?: string) => {
    return get().compareItems.some(item => 
      item.productId === productId && (!skuId || item.skuId === skuId)
    )
  },
  
  clearAll: () => {
    set({ compareItems: [] })
    clearCompareApi().catch(err => {
      console.error('清空服务器对比列表失败:', err)
    })
  },
  
  getCount: () => get().compareItems.length,
  
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false })
}))
