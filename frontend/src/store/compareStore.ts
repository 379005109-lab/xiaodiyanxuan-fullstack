import { create } from 'zustand'
import { 
  getAllCompareItems, 
  addToCompare as addToCompareApi, 
  removeFromCompare as removeFromCompareApi,
  isInCompare as isInCompareApi,
  clearCompare,
  getCompareCount,
  CompareItem
} from '@/services/compareService'

interface CompareStore {
  compareItems: CompareItem[]
  isModalOpen: boolean
  loadCompareItems: () => Promise<void>
  addToCompare: (productId: string, skuId?: string, selectedMaterials?: { fabric?: string; filling?: string; frame?: string; leg?: string }) => Promise<{ success: boolean; message: string }>
  removeFromCompare: (productId: string, skuId?: string, selectedMaterials?: { fabric?: string; filling?: string; frame?: string; leg?: string }) => Promise<void>
  isInCompare: (productId: string, skuId?: string, selectedMaterials?: { fabric?: string; filling?: string; frame?: string; leg?: string }) => Promise<boolean>
  clearAll: () => Promise<void>
  getCount: () => number
  openModal: () => void
  closeModal: () => void
}

export const useCompareStore = create<CompareStore>((set, get) => ({
  compareItems: [],
  isModalOpen: false,
  
  loadCompareItems: async () => {
    try {
      const compareItems = await getAllCompareItems()
      set({ compareItems })
    } catch (error) {
      console.error('加载对比列表失败:', error)
      set({ compareItems: [] })
    }
  },
  
  addToCompare: async (productId: string, skuId?: string, selectedMaterials?: { fabric?: string; filling?: string; frame?: string; leg?: string }) => {
    const result = await addToCompareApi(productId, skuId, selectedMaterials)
    if (result.success) {
      await get().loadCompareItems()
    }
    return result
  },
  
  removeFromCompare: async (productId: string, skuId?: string, selectedMaterials?: { fabric?: string; filling?: string; frame?: string; leg?: string }) => {
    await removeFromCompareApi(productId, skuId, selectedMaterials)
    await get().loadCompareItems()
  },
  
  isInCompare: async (productId: string, skuId?: string, selectedMaterials?: { fabric?: string; filling?: string; frame?: string; leg?: string }) => {
    return await isInCompareApi(productId, skuId, selectedMaterials)
  },
  
  clearAll: async () => {
    await clearCompare()
    set({ compareItems: [] })
  },
  
  getCount: () => get().compareItems.length, // return getCompareCount()
  
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false })
}))
