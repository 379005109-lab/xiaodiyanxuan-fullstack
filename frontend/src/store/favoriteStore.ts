import { create } from 'zustand'
import { 
  getFavorites, 
  addFavorite as addFavoriteApi, 
  removeFavorite as removeFavoriteApi,
  checkFavorite,
  clearAllFavorites,
  Favorite
} from '@/services/favoriteService'
import { Product } from '@/types'

interface FavoriteStore {
  favorites: Favorite[]
  loadFavorites: () => Promise<void>
  addFavorite: (product: Product) => Promise<boolean>
  removeFavorite: (productId: string) => Promise<void>
  toggleFavorite: (product: Product) => Promise<boolean>
  isFavorited: (productId: string) => Promise<boolean>
  clearAll: () => Promise<void>
  getFavoriteCount: () => number
}

export const useFavoriteStore = create<FavoriteStore>((set, get) => ({
  favorites: [],
  
  loadFavorites: async () => {
    try {
      const favorites = await getFavorites()
      set({ favorites })
    } catch (err) {
      console.error('加载收藏列表失败:', err)
    }
  },
  
  addFavorite: async (product: Product) => {
    try {
      // 传递完整产品信息
      const productAny = product as any
      await addFavoriteApi(product._id, {
        productName: product.name,
        thumbnail: product.images?.[0] || productAny.thumbnail || '',
        price: productAny.price || (product.skus?.[0]?.price) || 0
      })
      await get().loadFavorites()
      return true
    } catch (err) {
      console.error('添加收藏失败:', err)
      return false
    }
  },
  
  removeFavorite: async (productId: string) => {
    try {
      // 先重新加载收藏列表，确保有最新数据
      await get().loadFavorites()
      
      // 找到对应的favorite记录获取favoriteId
      const favorites = get().favorites
      console.log('当前收藏列表:', favorites)
      console.log('要删除的productId:', productId)
      
      const favorite = favorites.find(fav => {
        if (!fav) return false
        
        // product可以是字符串ID或Product对象
        const favProductId = typeof fav.product === 'string' ? fav.product : fav.product?._id
        
        console.log('对比:', favProductId, '===', productId)
        return favProductId === productId
      })
      
      if (!favorite) {
        console.error('未找到收藏记录，productId:', productId)
        console.error('当前收藏列表:', favorites.map(f => ({
          _id: f._id,
          product: typeof f.product === 'string' ? f.product : f.product?._id
        })))
        throw new Error('未找到该收藏记录')
      }
      
      console.log('找到收藏记录，favoriteId:', favorite._id)
      
      // 使用favoriteId删除
      await removeFavoriteApi(favorite._id)
      
      // 删除后重新加载
      await get().loadFavorites()
    } catch (err) {
      console.error('删除收藏失败:', err)
      throw err
    }
  },
  
  toggleFavorite: async (product: Product) => {
    try {
      const isFav = await get().isFavorited(product._id)
      if (isFav) {
        await get().removeFavorite(product._id)
        return false
      } else {
        return await get().addFavorite(product)
      }
    } catch (err) {
      console.error('切换收藏状态失败:', err)
      return false
    }
  },
  
  isFavorited: async (productId: string) => {
    try {
      const result = await checkFavorite(productId)
      return result.isFavorited
    } catch (err) {
      console.error('检查收藏状态失败:', err)
      return false
    }
  },
  
  clearAll: async () => {
    try {
      await clearAllFavorites()
      set({ favorites: [] })
    } catch (err) {
      console.error('清空收藏失败:', err)
    }
  },
  
  getFavoriteCount: () => {
    return get().favorites.length
  }
}))
