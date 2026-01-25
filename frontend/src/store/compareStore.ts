import { create } from 'zustand'
import { 
  getAllCompareItems, 
  addToCompare as addToCompareApi, 
  removeFromCompare as removeFromCompareApi,
  clearCompare,
  CompareItem
} from '@/services/compareService'

interface CompareStore {
  compareItems: CompareItem[]
  isModalOpen: boolean
  isLoading: boolean
  loadCompareItems: () => Promise<void>
  addToCompare: (productId: string, skuId?: string, selectedMaterials?: { fabric?: string; filling?: string; frame?: string; leg?: string }) => Promise<{ success: boolean; message: string }>
  removeFromCompare: (productId: string, skuId?: string, selectedMaterials?: { fabric?: string; filling?: string; frame?: string; leg?: string }) => Promise<void>
  clearAll: () => Promise<void>
  getCount: () => number
  openModal: () => void
  closeModal: () => void
}

export const useCompareStore = create<CompareStore>((set, get) => ({
  compareItems: [],
  isModalOpen: false,
  isLoading: false,
  
  loadCompareItems: async () => {
    // 防止重复加载
    if (get().isLoading) return
    set({ isLoading: true })
    try {
      const compareItems = await getAllCompareItems()
      set({ compareItems, isLoading: false })
    } catch (error) {
      console.error('加载对比列表失败:', error)
      set({ compareItems: [], isLoading: false })
    }
  },
  
  addToCompare: async (productId: string, skuId?: string, selectedMaterials?: { fabric?: string; filling?: string; frame?: string; leg?: string }) => {
    const result = await addToCompareApi(productId, skuId, selectedMaterials)
    if (result.success) {
      // 添加成功后重新加载
      await get().loadCompareItems()
    }
    return result
  },
  
  removeFromCompare: async (productId: string, skuId?: string, selectedMaterials?: { fabric?: string; filling?: string; frame?: string; leg?: string }) => {
    // 立即从本地状态移除（乐观更新）
    const materialKey = selectedMaterials ? JSON.stringify(selectedMaterials) : ''
    set(state => ({
      compareItems: state.compareItems.filter(item => {
        if (item.productId !== productId) return true
        if (skuId && item.skuId !== skuId) return true
        if (materialKey) {
          const itemMaterialKey = item.selectedMaterials ? JSON.stringify(item.selectedMaterials) : ''
          if (itemMaterialKey !== materialKey) return true
        }
        return false
      })
    }))
    // 后台调用API，不等待也不重新加载
    removeFromCompareApi(productId, skuId, selectedMaterials).catch(err => {
      console.error('删除对比项API调用失败:', err)
    })
  },
  
  clearAll: async () => {
    set({ compareItems: [] })
    await clearCompare()
  },
  
  getCount: () => get().compareItems.length,
  
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false })
}))
