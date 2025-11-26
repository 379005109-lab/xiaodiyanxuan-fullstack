import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Grid, ChevronRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
  productCount?: number
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  // 登录检查
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('请先登录')
      navigate('/')
      return
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await fetch('https://pkochbpmcgaa.sealoshzh.site/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error('加载分类失败:', error)
      toast.error('加载分类失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F4F3]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F2F4F3] py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-serif font-bold text-primary mb-3">商品分类</h1>
          <p className="text-stone-500 uppercase tracking-widest text-xs">PRODUCT CATEGORIES</p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => navigate(`/products?category=${category.slug}`)}
              className="bg-white rounded-2xl border border-stone-200 p-6 hover:shadow-lg transition-all hover:border-primary group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Grid className="w-8 h-8 text-primary" />
                </div>
                <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-xl font-serif font-bold text-primary mb-2 text-left">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-sm text-stone-500 text-left line-clamp-2 mb-3">
                  {category.description}
                </p>
              )}
              {category.productCount !== undefined && (
                <p className="text-xs text-stone-400 text-left">
                  {category.productCount} 件商品
                </p>
              )}
            </button>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-20">
            <Grid className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-400 font-serif italic">暂无分类</p>
          </div>
        )}
      </div>
    </div>
  )
}
