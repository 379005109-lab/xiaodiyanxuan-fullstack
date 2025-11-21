import apiClient from '@/lib/apiClient'
import { Product } from '@/types'

export interface Favorite {
  _id: string
  user: string
  product: string | Product
  productName: string
  productImage: string
  productPrice: number
  createdAt: string
  updatedAt: string
}

// 获取收藏列表
export const getFavorites = async (page = 1, limit = 10) => {
  try {
    const response = await apiClient.get('/favorites', {
      params: { page, limit },
    })
    return response.data.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取收藏列表失败')
  }
}

// 添加收藏
export const addFavorite = async (productId: string) => {
  try {
    const response = await apiClient.post('/favorites', { productId })
    return response.data.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '添加收藏失败')
  }
}

// 删除收藏
export const removeFavorite = async (favoriteId: string) => {
  try {
    await apiClient.delete(`/api/favorites/${favoriteId}`)
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '删除收藏失败')
  }
}

// 检查商品是否已收藏
export const checkFavorite = async (productId: string) => {
  try {
    const response = await apiClient.get(`/api/favorites/check/${productId}`)
    return response.data.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '检查收藏状态失败')
  }
}

// 清空所有收藏
export const clearAllFavorites = async () => {
  try {
    await apiClient.delete('/favorites')
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '清空收藏失败')
  }
}

