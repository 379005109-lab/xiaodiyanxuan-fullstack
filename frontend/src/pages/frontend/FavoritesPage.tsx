import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Trash2, ShoppingBag, Loader2, ShoppingCart, GitCompare } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuthModalStore } from '@/store/authModalStore'
import { useFavoriteStore } from '@/store/favoriteStore'
import { useCompareStore } from '@/store/compareStore'
import { formatPrice } from '@/lib/utils'
import { getFileUrl } from '@/services/uploadService'
import { toast } from 'sonner'

export default function FavoritesPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { openLogin } = useAuthModalStore()
  const { favorites, loadFavorites, removeFavorite, clearAll: clearAllFavorites } = useFavoriteStore()
  const { addToCompare, clearAll: clearAllCompare } = useCompareStore()
  const [loading, setLoading] = useState(true)
  const [compareList, setCompareList] = useState<string[]>([])

  useEffect(() => {
    if (!user) {
      toast.error('请先登录')
      openLogin()
      navigate('/')
      return
    }
    
    const load = async () => {
      setLoading(true)
      await loadFavorites()
      setLoading(false)
    }
    load()
  }, [user])

  const handleRemove = async (productId: string) => {
    try {
      await removeFavorite(productId)
      toast.success('已取消收藏')
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleClearAll = async () => {
    if (window.confirm('确定要清空所有收藏吗？')) {
      try {
        await clearAllFavorites()
        toast.success('已清空收藏')
      } catch (error) {
        toast.error('操作失败')
      }
    }
  }

  const handleAddToCart = (favorite: any) => {
    const productId = getProductId(favorite)
    // 跳转到商品详情页添加购物车（需要选择规格）
    navigate(`/products/${productId}?action=addToCart`)
    toast.info('请选择规格后加入购物车')
  }

  const handleToggleCompare = (productId: string) => {
    setCompareList(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId)
      }
      if (prev.length >= 4) {
        toast.error('最多只能对比4个商品')
        return prev
      }
      return [...prev, productId]
    })
  }

  const handleCompare = async () => {
    if (compareList.length < 2) {
      toast.error('请至少选择2个商品进行对比')
      return
    }
    try {
      // 清空之前的对比列表
      await clearAllCompare()
      // 将选中的商品添加到云端对比列表
      for (const productId of compareList) {
        console.log('添加商品到对比:', productId)
        const result = await addToCompare(productId)
        console.log('添加结果:', result)
      }
      toast.success(`已添加 ${compareList.length} 个商品到对比列表`)
      navigate('/compare')
    } catch (error) {
      console.error('添加对比失败:', error)
      toast.error('添加对比失败')
    }
  }

  const getProductId = (favorite: any) => {
    return typeof favorite.product === 'string' ? favorite.product : favorite.product?._id
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F4F3] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in-up pb-20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary mb-2">我的收藏</h1>
            <p className="text-stone-500 uppercase tracking-widest text-xs">My Favorites ({favorites.length})</p>
          </div>
          {favorites.length > 0 && (
            <button 
              onClick={handleClearAll}
              className="text-sm text-stone-400 hover:text-red-500 transition-colors flex items-center gap-1 border-b border-transparent hover:border-red-500 pb-0.5"
            >
              <Trash2 className="w-3 h-3" /> 清空收藏
            </button>
          )}
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-100">
            <Heart className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-400 font-serif italic mb-4">还没有收藏任何商品</p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full hover:bg-green-900 transition-colors"
            >
              去逛逛 <ShoppingBag className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((favorite) => {
              const productId = getProductId(favorite)
              const favAny = favorite as any
              const productAny = favAny.product as any
              return (
                <div key={favorite._id} className="bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                  <div className="relative">
                    <Link to={`/products/${productId}`}>
                      <img
                        src={favAny.thumbnail ? getFileUrl(favAny.thumbnail) : (productAny?.images?.[0] ? getFileUrl(productAny.images[0]) : '/placeholder.svg')}
                        alt={favAny.productName || productAny?.name || 'Product'}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }}
                      />
                    </Link>
                    <button
                      onClick={() => handleRemove(productId)}
                      className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-red-500 hover:bg-white hover:scale-110 transition-all shadow-sm"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                  
                  <div className="p-4">
                    <Link to={`/products/${productId}`}>
                      <h3 className="font-bold text-primary hover:text-green-900 transition-colors line-clamp-2 mb-2">
                        {favAny.productName || productAny?.name || 'Product'}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-serif font-bold text-accent">
                        {formatPrice(favAny.price || productAny?.skus?.[0]?.price || 0)}
                      </div>
                      <button
                        onClick={() => handleToggleCompare(productId)}
                        className={`text-xs px-2 py-1 rounded-full transition-colors flex items-center gap-1 ${compareList.includes(productId) ? 'bg-primary text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-600'}`}
                      >
                        <GitCompare className="w-3 h-3" />
                        {compareList.includes(productId) ? '已选' : '对比'}
                      </button>
                    </div>
                    <button
                      onClick={() => handleAddToCart(favorite)}
                      className="w-full text-xs bg-primary hover:bg-green-900 text-white px-3 py-2 rounded-full transition-colors flex items-center justify-center gap-1"
                    >
                      <ShoppingCart className="w-3 h-3" /> 加入购物车
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 浮动对比按钮 */}
        {compareList.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg border border-stone-200 px-6 py-3 flex items-center gap-4 z-50">
            <span className="text-sm text-stone-600">已选 {compareList.length} 件商品</span>
            <button
              onClick={() => setCompareList([])}
              className="text-xs text-stone-400 hover:text-red-500"
            >
              清空
            </button>
            <button
              onClick={handleCompare}
              className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-green-900 transition-colors flex items-center gap-2"
            >
              <GitCompare className="w-4 h-4" /> 开始对比
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
