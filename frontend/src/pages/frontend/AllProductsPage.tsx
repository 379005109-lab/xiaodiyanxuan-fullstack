import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllCategories } from '@/services/categoryService'
import { getFileUrl } from '@/services/uploadService'
import { toast } from 'sonner'

interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
  parentId?: string | null
  children?: Category[]
}

export default function AllProductsPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTopId, setSelectedTopId] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await getAllCategories()
        setCategories((data as any) || [])
      } catch (e) {
        toast.error('加载分类失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const topCategories = useMemo(() => {
    return (categories || []).filter(c => !c.parentId)
  }, [categories])

  useEffect(() => {
    if (!selectedTopId && topCategories.length > 0) {
      setSelectedTopId(topCategories[0]._id)
    }
  }, [selectedTopId, topCategories])

  const selectedTopCategory = useMemo(() => {
    if (!selectedTopId) return null
    return topCategories.find(c => c._id === selectedTopId) || null
  }, [selectedTopId, topCategories])

  const children = useMemo(() => {
    const c = selectedTopCategory as any
    return Array.isArray(c?.children) ? c.children : []
  }, [selectedTopCategory])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1800px] mx-auto px-4 lg:px-8 py-10">
        <div className="flex gap-10">
          <aside className="w-64 flex-shrink-0">
            <div className="space-y-1">
              {topCategories.map(cat => {
                const active = cat._id === selectedTopId
                return (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => setSelectedTopId(cat._id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active ? 'bg-primary/10 text-primary' : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {cat.name}
                  </button>
                )
              })}
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="mb-6">
              <h1 className="text-lg font-semibold text-stone-900">{selectedTopCategory?.name || '所有商品'}</h1>
            </div>

            {children.length === 0 ? (
              <div className="text-stone-400">暂无分类</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10">
                {children.map((c: any) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => {
                      const name = String(c?.name || '')
                      const categoryKey = c.slug || c._id
                      if (name.includes('沙发')) {
                        const params = new URLSearchParams()
                        if (categoryKey) params.set('category', String(categoryKey))
                        if (selectedTopCategory?.name) params.set('parent', String(selectedTopCategory.name))
                        navigate(`/all-products/sofa?${params.toString()}`)
                        return
                      }
                      navigate(`/products?category=${categoryKey}`)
                    }}
                    className="text-left"
                  >
                    <div className="w-full aspect-[4/3] bg-stone-100 rounded-lg overflow-hidden">
                      {c.image ? (
                        <img
                          src={getFileUrl(c.image)}
                          alt={c.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src = '/placeholder.svg'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <span className="text-sm">{c.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-stone-800">{c.name}</div>
                  </button>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
