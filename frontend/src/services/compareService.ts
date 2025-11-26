// 对比服务
export interface CompareItem {
  _id: string
  productId: string
  skuId?: string
  selectedMaterials?: {
    fabric?: string
    filling?: string
    frame?: string
    leg?: string
  }
}

const compareItems: CompareItem[] = []

// 初始化：从localStorage加载对比项
const initCompareItems = () => {
  try {
    const stored = localStorage.getItem('compare_items')
    if (stored) {
      const items = JSON.parse(stored)
      if (Array.isArray(items)) {
        compareItems.length = 0
        compareItems.push(...items)
      }
    }
  } catch (error) {
    console.error('加载对比项失败:', error)
  }
}

// 页面加载时初始化
if (typeof window !== 'undefined') {
  initCompareItems()
}

export const getAllCompareItems = () => {
  // 每次获取时从localStorage刷新
  initCompareItems()
  return compareItems
}

export const addToCompare = (productId: string, skuId?: string, selectedMaterials?: any) => {
  // 检查是否已存在相同商品+SKU+材质的组合
  const materialKey = selectedMaterials
    ? `${selectedMaterials.fabric || ''}|${selectedMaterials.filling || ''}|${selectedMaterials.frame || ''}|${selectedMaterials.leg || ''}`
    : ''
  
  const existingIndex = compareItems.findIndex(item => {
    if (item.productId !== productId) return false
    if (item.skuId !== skuId) return false
    
    const itemMaterialKey = item.selectedMaterials
      ? `${item.selectedMaterials.fabric || ''}|${item.selectedMaterials.filling || ''}|${item.selectedMaterials.frame || ''}|${item.selectedMaterials.leg || ''}`
      : ''
    
    return itemMaterialKey === materialKey
  })
  
  if (existingIndex > -1) {
    return { success: false, message: '该商品（相同规格和材质）已在对比列表中' }
  }
  
  // 限制最多4个商品
  if (compareItems.length >= 4) {
    return { success: false, message: '最多只能对比4件商品' }
  }
  
  const item = { 
    _id: `${productId}_${skuId || 'default'}_${materialKey}`, // 使用组合ID
    productId, 
    skuId, 
    selectedMaterials 
  }
  compareItems.push(item)
  // 保存到localStorage
  localStorage.setItem('compare_items', JSON.stringify(compareItems))
  return { success: true, message: '已添加到对比' }
}

export const removeFromCompare = (productId: string, skuId?: string, selectedMaterials?: any) => {
  // 生成材质组合键
  const fabric = selectedMaterials?.fabric || ''
  const filling = selectedMaterials?.filling || ''
  const frame = selectedMaterials?.frame || ''
  const leg = selectedMaterials?.leg || ''
  const materialKey = `${fabric}|${filling}|${frame}|${leg}`
  
  // 使用组合键匹配对比项
  const compositeId = `${productId}_${skuId || ''}_${materialKey}`
  
  const index = compareItems.findIndex(item => item._id === compositeId)
  if (index > -1) {
    compareItems.splice(index, 1)
    // 保存到localStorage
    localStorage.setItem('compare_items', JSON.stringify(compareItems))
  }
}

export const isInCompare = (productId: string, skuId?: string, selectedMaterials?: any) => {
  return compareItems.some(item => item.productId === productId)
}

export const clearCompare = () => {
  compareItems.length = 0
  // 保存到localStorage
  localStorage.setItem('compare_items', JSON.stringify(compareItems))
}

export const getCompareCount = () => compareItems.length
