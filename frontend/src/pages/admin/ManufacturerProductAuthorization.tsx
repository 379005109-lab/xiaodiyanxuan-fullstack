import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import apiClient from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'

type Mode = 'category' | 'specific'

interface CategoryItem {
  id: string
  name: string
  parentId: string | null
  count: number
}

interface ProductItem {
  _id: string
  name: string
  productCode?: string
  category?: any
  thumbnail?: string
  images?: string[]
  status?: string
}

export default function ManufacturerProductAuthorization() {
  const navigate = useNavigate()
  const params = useParams()
  const { user } = useAuthStore()

  const isDesigner = user?.role === 'designer'

  const manufacturerId = String(params.manufacturerId || '')

  const [manufacturer, setManufacturer] = useState<any>(null)
  const [mode, setMode] = useState<Mode>('category')
  const [loading, setLoading] = useState(true)

  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [products, setProducts] = useState<ProductItem[]>([])

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])

  const [productKeyword, setProductKeyword] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const run = async () => {
      if (!manufacturerId) {
        toast.error('manufacturerId 无效')
        navigate('/admin/manufacturers')
        return
      }

      setLoading(true)
      try {
        const [mRes, cRes, pRes] = await Promise.all([
          apiClient.get(`/manufacturers/${manufacturerId}`),
          apiClient.get(`/manufacturers/${manufacturerId}/product-categories`),
          apiClient.get(`/manufacturers/${manufacturerId}/products`, { params: { status: 'active', limit: 5000 } })
        ])

        setManufacturer(mRes.data?.data || null)
        setCategories(cRes.data?.data || [])
        setProducts(pRes.data?.data || [])
      } catch (e: any) {
        toast.error(e?.response?.data?.message || '加载数据失败')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [manufacturerId, navigate])

  const categoryById = useMemo(() => new Map(categories.map(c => [String(c.id), c])), [categories])
  const productById = useMemo(() => new Map(products.map(p => [String(p._id), p])), [products])

  const filteredProducts = useMemo(() => {
    const kw = productKeyword.trim().toLowerCase()
    if (!kw) return products
    return products.filter(p => {
      const name = (p.name || '').toLowerCase()
      const code = (p.productCode || '').toLowerCase()
      return name.includes(kw) || code.includes(kw)
    })
  }, [products, productKeyword])

  const selectedCategories = useMemo(() => {
    return selectedCategoryIds
      .map(id => categoryById.get(String(id)))
      .filter(Boolean) as CategoryItem[]
  }, [selectedCategoryIds, categoryById])

  const selectedProducts = useMemo(() => {
    return selectedProductIds
      .map(id => productById.get(String(id)))
      .filter(Boolean) as ProductItem[]
  }, [selectedProductIds, productById])

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleProduct = (id: string) => {
    setSelectedProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const buildNotes = () => {
    const lines: string[] = []
    if (notes.trim()) lines.push(notes.trim())

    const scopeLabel = mode === 'category'
      ? `按分类(${selectedCategoryIds.length}个)`
      : `指定商品(${selectedProductIds.length}个)`

    lines.push(`申请范围: ${scopeLabel}`)

    if (mode === 'category') {
      const names = selectedCategories.map(c => `${c.name}(${c.count})`).slice(0, 50)
      if (names.length > 0) lines.push(`分类: ${names.join('、')}${selectedCategories.length > 50 ? '...' : ''}`)
    } else {
      const names = selectedProducts.map(p => p.name).slice(0, 50)
      if (names.length > 0) lines.push(`商品: ${names.join('、')}${selectedProducts.length > 50 ? '...' : ''}`)
    }

    if (validUntil) {
      lines.push(`期望有效期至: ${validUntil}`)
    } else {
      lines.push('期望有效期: 永久有效')
    }

    if (user?.role) {
      lines.push(`申请人角色: ${user.role}`)
    }

    return lines.join('\n')
  }

  const canSubmit = useMemo(() => {
    if (mode === 'category') return selectedCategoryIds.length > 0
    return selectedProductIds.length > 0
  }, [mode, selectedCategoryIds.length, selectedProductIds.length])

  const handleSubmit = async () => {
    if (!isDesigner) {
      toast.error('当前账号暂不支持发起授权申请，请使用设计师账号')
      return
    }
    if (!canSubmit) {
      toast.error(mode === 'category' ? '请选择至少一个分类' : '请选择至少一个商品')
      return
    }

    setSubmitting(true)
    try {
      await apiClient.post('/authorizations/designer-requests', {
        manufacturerId,
        scope: mode,
        categories: mode === 'category' ? selectedCategoryIds : [],
        products: mode === 'specific' ? selectedProductIds : [],
        validUntil: validUntil || undefined,
        notes: buildNotes()
      })
      toast.success('申请已提交')
      navigate('/admin/manufacturers')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-gray-500">厂家管理 / 商品授权</div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            {manufacturer?.fullName || manufacturer?.name || '商品授权'}
          </h1>
          <div className="text-sm text-gray-600 mt-2">
            选择你需要申请授权的商品范围（分类/指定商品），生成申请清单并提交给厂家审核。
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary" onClick={() => navigate('/admin/manufacturers')}>返回</button>
          <button className="btn btn-primary" disabled={submitting || !canSubmit || !isDesigner} onClick={handleSubmit}>
            {submitting ? '提交中...' : '提交申请'}
          </button>
        </div>
      </div>

      {!isDesigner && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          当前页面的“提交申请”暂仅支持设计师账号。厂家与厂家之间的商品授权申请流程将单独支持。
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">加载中...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-900">授权范围选择</div>
                <div className="flex items-center gap-2">
                  <button
                    className={`px-3 py-1.5 rounded-lg text-sm border ${mode === 'category' ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-gray-600 border-gray-200'}`}
                    onClick={() => setMode('category')}
                    type="button"
                  >
                    按分类
                  </button>
                  <button
                    className={`px-3 py-1.5 rounded-lg text-sm border ${mode === 'specific' ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-gray-600 border-gray-200'}`}
                    onClick={() => setMode('specific')}
                    type="button"
                  >
                    指定商品
                  </button>
                </div>
              </div>

              {mode === 'category' ? (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {categories.length === 0 ? (
                    <div className="text-sm text-gray-500">该厂家暂无可用分类</div>
                  ) : (
                    categories.map(c => (
                      <label key={c.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedCategoryIds.includes(String(c.id))}
                            onChange={() => toggleCategory(String(c.id))}
                          />
                          <span className="text-sm text-gray-900 truncate">{c.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">{c.count}件</span>
                      </label>
                    ))
                  )}
                </div>
              ) : (
                <div className="mt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      value={productKeyword}
                      onChange={(e) => setProductKeyword(e.target.value)}
                      className="input w-full"
                      placeholder="搜索商品名称/编码"
                    />
                    <div className="text-sm text-gray-500 whitespace-nowrap">共 {filteredProducts.length} 个</div>
                  </div>
                  <div className="max-h-[520px] overflow-auto space-y-2">
                    {filteredProducts.length === 0 ? (
                      <div className="text-sm text-gray-500">暂无商品</div>
                    ) : (
                      filteredProducts.map(p => (
                        <label key={p._id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={selectedProductIds.includes(String(p._id))}
                              onChange={() => toggleProduct(String(p._id))}
                            />
                            <span className="text-sm text-gray-900 truncate">{p.name}</span>
                          </div>
                          <span className="text-xs text-gray-500 font-mono">{p.productCode || ''}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-900">有效期</div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-700 mb-2">期望到期时间（可选）</div>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="input w-full"
                  />
                </div>
                <div>
                  <div className="text-sm text-gray-700 mb-2">说明/备注（可选）</div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input w-full"
                    rows={3}
                    placeholder="补充说明..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 h-fit">
            <div className="text-sm font-medium text-gray-900">申请清单</div>
            <div className="mt-3 text-sm text-gray-600">
              {mode === 'category' ? (
                <>
                  <div>模式: 按分类</div>
                  <div className="mt-1">已选分类: {selectedCategoryIds.length} 个</div>
                  <div className="mt-3 space-y-2">
                    {selectedCategories.length === 0 ? (
                      <div className="text-gray-500">尚未选择</div>
                    ) : (
                      selectedCategories.slice(0, 30).map(c => (
                        <div key={c.id} className="flex items-center justify-between gap-2">
                          <div className="truncate">{c.name}</div>
                          <div className="text-xs text-gray-500">{c.count}件</div>
                        </div>
                      ))
                    )}
                    {selectedCategories.length > 30 && (
                      <div className="text-xs text-gray-500">仅展示前 30 条</div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>模式: 指定商品</div>
                  <div className="mt-1">已选商品: {selectedProductIds.length} 个</div>
                  <div className="mt-3 space-y-2">
                    {selectedProducts.length === 0 ? (
                      <div className="text-gray-500">尚未选择</div>
                    ) : (
                      selectedProducts.slice(0, 30).map(p => (
                        <div key={p._id} className="flex items-center justify-between gap-2">
                          <div className="truncate">{p.name}</div>
                          <div className="text-xs text-gray-500 font-mono">{p.productCode || ''}</div>
                        </div>
                      ))
                    )}
                    {selectedProducts.length > 30 && (
                      <div className="text-xs text-gray-500">仅展示前 30 条</div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-700">期望有效期</div>
              <div className="text-sm text-gray-900 mt-1">{validUntil ? validUntil : '永久有效'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
