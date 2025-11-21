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
  loadCompareItems: () => void
  addToCompare: (productId: string, skuId?: string, selectedMaterials?: { fabric?: string; filling?: string; frame?: string; leg?: string }) => { success: boolean; message: string }
  removeFromCompare: (productId: string, skuId?: string, selectedMaterials?: { fabric?: string; filling?: string; frame?: string; leg?: string }) => void
  isInCompare: (productId: string, skuId?: string, selectedMaterials?: { fabric?: string; filling?: string; frame?: string; leg?: string }) => boolean
  clearAll: () => void
  getCount: () => number
}

export const useCompareStore = create<CompareStore>((set, get) => ({
  compareItems: [],
  
  loadCompareItems: () => {
    const compareItems = getAllCompareItems()
    set({ compareItems })
  },
  
  addToCompare: (productId: string, skuId?: string, selectedMaterials?: { fabric?: string; filling?: string; frame?: string; leg?: string }) => {
    const result = addToCompareApi(productId, skuId, selectedMaterials)
    if (result.success) {
      get().loadCompareItems()
    }
    return result
  },
  
  removeFromCompare: (productId: string, skuId?: string, selectedMaterials?: { fabric?: string; filling?: string; frame?: string; leg?: string }) => {
    removeFromCompareApi(productId, skuId, selectedMaterials)
    get().loadCompareItems()
  },
  
  isInCompare: (productId: string, skuId?: string, selectedMaterials?: { fabric?: string; filling?: string; frame?: string; leg?: string }) => {
    return isInCompareApi(productId, skuId, selectedMaterials)
  },
  
  clearAll: () => {
    clearCompare()
    set({ compareItems: [] })
  },
  
  getCount: () => {
    return getCompareCount()
  }
}))

