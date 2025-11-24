import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ShoppingCart, Scale, X } from 'lucide-react'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'
import { getProductById as getMockProductById } from '@/services/productService.mock'
import { getProductById as getApiProductById } from '@/services/productService'
import { useFavoriteStore } from '@/store/favoriteStore'
import { useCompareStore } from '@/store/compareStore'
import { useCartStore } from '@/store/cartStore'
import { toast } from 'sonner'
import { getFileUrl } from '@/services/uploadService'

export default function FavoritesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const { favorites, removeFavorite, loadFavorites } = useFavoriteStore()
  const { addToCompare: addToCompareStore } = useCompareStore()
  const { addItem } = useCartStore()

  useEffect(() => {
    loadFavorites()
  }, [])

  useEffect(() => {
    const loadFavoriteProducts = async () => {
      const result = await Promise.all(
        favorites.map(async (fav) => {
          // 如果 product 是对象，直接返回
          if (typeof fav.product === 'object' && fav.product !== null) {
            return fav.product as Product
          }
          // 否则根据 product ID 获取
          const productId = typeof fav.product === 'string' ? fav.product : fav._id
          const mockProduct = await getMockProductById(productId)
          if (mockProduct) return mockProduct
          return await getApiProductById(productId)
        })
      )
      setProducts(result.filter((product): product is Product => !!product))
    }

    if (favorites.length > 0) {
      loadFavoriteProducts()
    }
  }, [favorites])

  const handleRemove = async (productId: string) => {
    await removeFavorite(productId)
    toast.success('已取消收藏')
  }

  const handleAddToCart = (product: Product) => {
    if (product.skus.length === 0) {
      toast.error('该商品暂无可选规格')
      return
    }
    addItem(product, product.skus[0], 1)
    toast.success('已添加到购物车')
  }

  const handleAddToCompare = (product: Product) => {
    if (!product.skus || product.skus.length === 0) {
      toast.error('该商品暂无可选规格')
      return
    }
    const result = addToCompareStore(product._id, product.skus[0]._id)
    if (result.success) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container-custom">
          <div className="card p-12 text-center">
            <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Heart className="h-16 w-16 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold mb-4">收藏夹为空</h2>
            <p className="text-gray-600 mb-8">还没有收藏任何商品</p>
            <Link to="/products" className="btn-primary inline-block">
              去选购
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">我的收藏 ({products.length})</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card hover:shadow-lg transition-shadow"
            >
              <Link to={`/products/${product._id}`}>
                {/* 商品图片 */}
                <div className="relative aspect-square mb-4 overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={getFileUrl((product.images && product.images[0]) || '/placeholder.png')}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleRemove(product._id)
                    }}
                    className="absolute top-2 right-2 p-2 bg-primary-500 text-white rounded-full shadow-md hover:bg-primary-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* 商品信息 */}
                <div className="mb-4">
                  <h3 className="font-semibold text-lg hover:text-primary-600 transition-colors mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold text-red-600">
                      {formatPrice(product.basePrice)}
                    </span>
                    {product.skus.length > 1 && (
                      <span className="text-sm text-gray-500">起</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>已售 {product.sales} 件</span>
                    <span>{product.skus.length} 个规格</span>
                  </div>
                </div>
              </Link>

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddToCart(product)}
                  className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm flex items-center justify-center gap-1 transition-all duration-200 hover:shadow-md"
                  style={{ backgroundColor: '#1F64FF' }}
                >
                  <ShoppingCart className="h-4 w-4" />
                  加购物车
                </button>
                <button
                  onClick={() => handleAddToCompare(product)}
                  className="flex-1 py-2.5 rounded-lg border font-medium text-sm flex items-center justify-center gap-1 transition-all duration-200"
                  style={{ borderColor: '#1F64FF', color: '#1F64FF', backgroundColor: '#f0f5ff' }}
                >
                  <Scale className="h-4 w-4" />
                  对比
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link to="/products" className="btn-secondary inline-block">
            继续选购
          </Link>
        </div>
      </div>
    </div>
  )
}

