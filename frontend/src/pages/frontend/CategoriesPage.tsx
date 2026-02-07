import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Grid, ChevronRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getFileUrl } from '@/services/uploadService'

interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
  productCount?: number
  parentId?: string | null
  children?: Category[]
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.filter(c => !c.parentId).map((category) => (
            <div
              key={category._id}
              onClick={() => navigate(`/products?category=${category.slug || category._id}`)}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-lg transition-all hover:border-primary group cursor-pointer"
            >
              {/* 分类图片 */}
              <div className="aspect-square bg-stone-100 overflow-hidden">
                {category.image ? (
                  <img
                    src={getFileUrl(category.image)}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      if (target.parentElement) {
                        target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-16 h-16 text-stone-300" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg></div>'
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Grid className="w-16 h-16 text-stone-300" />
                  </div>
                )}
              </div>
              
              {/* 分类信息 */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-serif font-bold text-primary">
                    {category.name}
                  </h3>
                  <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-primary transition-colors" />
                </div>
                {category.description && (
                  <p className="text-sm text-stone-500 line-clamp-2 mb-2">
                    {category.description}
                  </p>
                )}
                {/* 子分类标签 */}
                {category.children && category.children.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {category.children.slice(0, 3).map((child) => (
                      <span
                        key={child._id}
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/products?category=${child.slug || child._id}`)
                        }}
                        className="text-xs px-2 py-0.5 bg-stone-100 rounded-full text-stone-600 hover:bg-primary/10 hover:text-primary"
                      >
                        {child.name}
                      </span>
                    ))}
                    {category.children.length > 3 && (
                      <span className="text-xs px-2 py-0.5 text-stone-400">
                        +{category.children.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
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
