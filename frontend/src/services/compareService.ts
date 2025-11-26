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

export const getAllCompareItems = () => compareItems

export const addToCompare = (productId: string, skuId?: string, selectedMaterials?: any) => {
  // 检查是否已存在
  const existingIndex = compareItems.findIndex(item => item.productId === productId)
  if (existingIndex > -1) {
    return { success: false, message: '该商品已在对比列表中' }
  }
  
  // 限制最多4个商品
  if (compareItems.length >= 4) {
    return { success: false, message: '最多只能对比4件商品' }
  }
  
  const item = { 
    _id: productId, // 直接使用productId作为_id
    productId, 
    skuId, 
    selectedMaterials 
  }
  compareItems.push(item)
  return { success: true, message: '已添加到对比' }
}

export const removeFromCompare = (productId: string, skuId?: string, selectedMaterials?: any) => {
  const index = compareItems.findIndex(item => item.productId === productId)
  if (index > -1) {
    compareItems.splice(index, 1)
  }
}

export const isInCompare = (productId: string, skuId?: string, selectedMaterials?: any) => {
  return compareItems.some(item => item.productId === productId)
}

export const clearCompare = () => {
  compareItems.length = 0
}

export const getCompareCount = () => compareItems.length
