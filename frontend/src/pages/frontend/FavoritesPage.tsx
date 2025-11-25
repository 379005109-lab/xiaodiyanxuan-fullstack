import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Trash2, ShoppingBag, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuthModalStore } from '@/store/authModalStore'
import { useFavoriteStore } from '@/store/favoriteStore'
import { formatPrice } from '@/lib/utils'
import { getFileUrl } from '@/services/uploadService'
import { toast } from 'sonner'

export default function FavoritesPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { openLogin } = useAuthModalStore()
  const { favorites, loadFavorites, removeFavorite, clearAll } = useFavoriteStore()
  const [loading, setLoading] = useState(true)

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

  const handleRemove = async (favoriteId: string) => {
    try {
      await removeFavorite(favoriteId)
      toast.success('已取消收藏')
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleClearAll = async () => {
    if (window.confirm('确定要清空所有收藏吗？')) {
      try {
        await clearAll()
        toast.success('已清空收藏')
      } catch (error) {
        toast.error('操作失败')
      }
    }
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
            {favorites.map((favorite) => (
              <div key={favorite._id} className="bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                <div className="relative">
                  <Link to={`/products/${favorite.product._id}`}>
                    <img
                      src={favorite.product.images?.[0] ? getFileUrl(favorite.product.images[0]) : '/placeholder.svg'}
                      alt={favorite.product.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }}
                    />
                  </Link>
                  <button
                    onClick={() => handleRemove(favorite._id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-red-500 hover:bg-white hover:scale-110 transition-all shadow-sm"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                </div>
                
                <div className="p-4">
                  <Link to={`/products/${favorite.product._id}`}>
                    <h3 className="font-bold text-primary hover:text-green-900 transition-colors line-clamp-2 mb-2">
                      {favorite.product.name}
                    </h3>
                  </Link>
                  
                  <div className="flex items-center justify-between">
                    <div className="font-serif font-bold text-accent">
                      {formatPrice(favorite.product.skus?.[0]?.price || 0)}
                    </div>
                    <Link
                      to={`/products/${favorite.product._id}`}
                      className="text-xs bg-stone-100 hover:bg-primary hover:text-white px-3 py-1 rounded-full transition-colors"
                    >
                      查看详情
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
