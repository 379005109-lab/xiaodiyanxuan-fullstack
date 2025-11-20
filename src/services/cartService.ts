import apiClient from '@/lib/apiClient'

export interface CartItem {
  _id: string
  product: string
  productName: string
  productImage: string
  sku: {
    color: string
    material: string
  }
  skuId: string
  quantity: number
  price: number
  selections?: any
}

export interface Cart {
  _id: string
  user: string
  items: CartItem[]
  totalAmount: number
  totalQuantity: number
  createdAt: string
  updatedAt: string
}

// 获取购物车
export const getCart = async () => {
  try {
    const response = await apiClient.get('/api/cart')
    return response.data.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取购物车失败')
  }
}

// 添加到购物车
export const addToCart = async (productId: string, skuId: string, quantity: number, price: number, selections?: any) => {
  try {
    const response = await apiClient.post('/api/cart', {
      productId,
      skuId,
      quantity,
      price,
      selections,
    })
    return response.data.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '添加到购物车失败')
  }
}

// 更新购物车项
export const updateCartItem = async (itemId: string, quantity: number) => {
  try {
    const response = await apiClient.put(`/api/cart/${itemId}`, { quantity })
    return response.data.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '更新购物车失败')
  }
}

// 删除购物车项
export const removeFromCart = async (itemId: string) => {
  try {
    const response = await apiClient.delete(`/api/cart/${itemId}`)
    return response.data.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '删除购物车项失败')
  }
}

// 清空购物车
export const clearCart = async () => {
  try {
    const response = await apiClient.delete('/api/cart')
    return response.data.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '清空购物车失败')
  }
}
