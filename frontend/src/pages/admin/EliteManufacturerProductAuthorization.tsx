import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import apiClient from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'

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
  basePrice?: number
  skus?: Array<{
    code?: string
    spec?: string
    price?: number
    discountPrice?: number
  }>
}

export default function EliteManufacturerProductAuthorization() {
  const navigate = useNavigate()
  const params = useParams()
  const { user } = useAuthStore()

  const manufacturerId = String(params.manufacturerId || '')

  const isDesigner = user?.role === 'designer'
  const isManufacturerUser = !!(user as any)?.manufacturerId

  const [manufacturer, setManufacturer] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [products, setProducts] = useState<ProductItem[]>([])
  const [existingAuthorizations, setExistingAuthorizations] = useState<any[]>([])
  const [tierSystemConfig, setTierSystemConfig] = useState<any>(null)

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [expandedProductIds, setExpandedProductIds] = useState<string[]>([])
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
        const [mRes, cRes, pRes, tRes, aRes] = await Promise.all([
          apiClient.get(`/manufacturers/${manufacturerId}`),
          apiClient.get(`/manufacturers/${manufacturerId}/product-categories`),
          apiClient.get(`/manufacturers/${manufacturerId}/products`, { params: { status: 'active', limit: 5000 } }),
          apiClient.get('/tier-system/effective', { params: { manufacturerId } }).catch(() => ({ data: { data: null } })),
          apiClient.get(`/authorizations`, { params: { manufacturerId, status: 'approved' } }).catch(() => ({ data: { data: [] } })),
        ])

        setManufacturer(mRes.data?.data || null)
        setCategories(cRes.data?.data || [])
        setProducts(pRes.data?.data || [])
        setTierSystemConfig(tRes.data?.data || null)
        setExistingAuthorizations(aRes.data?.data || [])
      } catch (e: any) {
        toast.error(e?.response?.data?.message || '加载数据失败')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [manufacturerId, navigate])

  const productById = useMemo(() => new Map(products.map(p => [String(p._id), p])), [products])
  const categoryById = useMemo(() => new Map(categories.map(c => [String(c.id), c])), [categories])

  const categoryTree = useMemo(() => {
    const rootCategories = categories.filter(c => !c.parentId)
    const childrenMap = new Map<string, CategoryItem[]>()

    categories.forEach(c => {
      if (c.parentId) {
        const children = childrenMap.get(String(c.parentId)) || []
        children.push(c)
        childrenMap.set(String(c.parentId), children)
      }
    })

    return { rootCategories, childrenMap }
  }, [categories])

  useEffect(() => {
    if (expandedCategories.length > 0) return
    if (categoryTree.rootCategories.length > 0) {
      setExpandedCategories([String(categoryTree.rootCategories[0].id)])
    }
  }, [categoryTree.rootCategories, expandedCategories.length])

  const getDescendantCategoryIds = (catId: string): string[] => {
    const result: string[] = []
    const stack: string[] = [String(catId)]

    while (stack.length) {
      const id = stack.pop()!
      result.push(id)
      const children = categoryTree.childrenMap.get(String(id)) || []
      children.forEach(ch => stack.push(String(ch.id)))
    }

    return result
  }

  const getProductCategoryId = (product: ProductItem | undefined | null) => {
    const toIdString = (v: any): string => {
      if (!v) return ''
      if (typeof v === 'string' || typeof v === 'number') return String(v)
      if (typeof v === 'object') {
        if (typeof v.$oid === 'string') return v.$oid
        if (typeof v.oid === 'string') return v.oid
        if (typeof v.toHexString === 'function') return v.toHexString()
        const s = String(v)
        return s && s !== '[object Object]' ? s : ''
      }
      return ''
    }

    const c: any = product?.category
    if (!c) return ''
    if (typeof c === 'string') return String(c)
    if (typeof c === 'object') {
      return (
        toIdString(c._id) ||
        toIdString(c.id) ||
        toIdString(c.slug) ||
        toIdString(c.name) ||
        toIdString(c)
      )
    }
    return ''
  }

  const isProductAuthorized = (productId: string) => {
    return existingAuthorizations.some(auth => {
      if (auth.scope === 'all') return true
      if ((auth.scope === 'specific' || auth.scope === 'mixed') && auth.products?.includes(productId)) return true
      const product = productById.get(productId)
      if ((auth.scope === 'category' || auth.scope === 'mixed') && product?.category && auth.categories?.some((catId: string) => {
        const prodCatId = getProductCategoryId(product)
        return prodCatId === String(catId)
      })) return true
      return false
    })
  }

  const filteredProducts = useMemo(() => {
    const kw = productKeyword.trim().toLowerCase()
    if (!kw) return products
    return products.filter(p => {
      const name = (p.name || '').toLowerCase()
      const code = (p.productCode || '').toLowerCase()
      return name.includes(kw) || code.includes(kw)
    })
  }, [products, productKeyword])

  const getProductsByCategoryId = (catId: string) => {
    const ids = new Set(getDescendantCategoryIds(String(catId)))
    const nameKeys = new Set(
      Array.from(ids)
        .map(id => categoryById.get(String(id))?.name)
        .filter(Boolean)
        .map(n => String(n).trim().toLowerCase())
    )

    return filteredProducts.filter(p => {
      const prodCatId = getProductCategoryId(p)
      if (prodCatId && ids.has(String(prodCatId))) return true

      const c: any = (p as any)?.category
      if (typeof c === 'string' && nameKeys.has(String(c).trim().toLowerCase())) return true
      const prodCatName = typeof c === 'object' && c ? c.name : ''
      if (prodCatName && nameKeys.has(String(prodCatName).trim().toLowerCase())) return true

      return false
    })
  }

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleProductExpansion = (id: string) => {
    setExpandedProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleProduct = (id: string, disabled: boolean) => {
    if (disabled) return
    setSelectedProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleCategorySelection = (catId: string) => {
    const descIds = getDescendantCategoryIds(String(catId))
    setSelectedCategoryIds(prev => {
      const set = new Set(prev)
      const isSelected = set.has(String(catId))
      if (isSelected) {
        descIds.forEach(id => set.delete(String(id)))
      } else {
        descIds.forEach(id => set.add(String(id)))
      }
      return Array.from(set)
    })
  }

  const getSkuPricing = (skuPrice: number) => {
    const profitSettings = tierSystemConfig?.profitSettings || {}
    const rule = tierSystemConfig?.discountRule || null

    const minSaleDiscountRate = Number(profitSettings?.minSaleDiscountRate ?? 1)
    const safeMinSaleRate = Number.isFinite(minSaleDiscountRate) ? Math.max(0, Math.min(1, minSaleDiscountRate)) : 1

    const discountType = rule?.discountType || (typeof rule?.minDiscountPrice === 'number' ? 'minPrice' : 'rate')
    const ruleDiscountRate = typeof rule?.discountRate === 'number' && Number.isFinite(rule.discountRate)
      ? Math.max(0, Math.min(1, rule.discountRate))
      : 0.6
    const minDiscountPrice = typeof rule?.minDiscountPrice === 'number' && Number.isFinite(rule.minDiscountPrice)
      ? Math.max(0, rule.minDiscountPrice)
      : 0

    let discountedPrice = 0
    if (discountType === 'minPrice') {
      discountedPrice = minDiscountPrice
    } else {
      discountedPrice = skuPrice * ruleDiscountRate
    }

    const minAllowed = skuPrice * safeMinSaleRate
    discountedPrice = Math.max(discountedPrice, minAllowed)
    discountedPrice = Math.round(discountedPrice)

    const commissionRateRaw = typeof rule?.commissionRate === 'number' && Number.isFinite(rule.commissionRate)
      ? rule.commissionRate
      : 0.4
    const commissionRate = Math.max(0, Math.min(0.5, commissionRateRaw))
    const commission = Math.round(discountedPrice * commissionRate)

    return {
      listPrice: skuPrice,
      discountPrice: discountedPrice,
      commission,
      discountRate: discountType === 'rate' ? ruleDiscountRate : undefined
    }
  }

  const getProductPricing = (product: ProductItem) => {
    const basePrice = product.basePrice || 0
    const skuPrices = product.skus?.map(s => s.price || 0).filter(p => p > 0) || []

    const retailPrice = skuPrices.length > 0 ? Math.min(...skuPrices) : basePrice
    const maxPrice = skuPrices.length > 0 ? Math.max(...skuPrices) : basePrice

    const { discountPrice, commission } = getSkuPricing(retailPrice)

    return {
      priceRange: retailPrice === maxPrice ? `¥${retailPrice}` : `¥${retailPrice} - ¥${maxPrice}`,
      minDiscountPrice: `¥${discountPrice.toFixed(0)}`,
      commissionPrice: `¥${commission.toFixed(0)}`
    }
  }

  const selectedRootCategories = categoryTree.rootCategories.filter(c => selectedCategoryIds.includes(String(c.id)))
  const selectedCount = selectedRootCategories.length + selectedProductIds.length
  const canSubmit = selectedCategoryIds.length > 0 || selectedProductIds.length > 0

  const buildNotes = () => {
    const selectedCategoryNames = selectedRootCategories
      .map(c => c.name)
      .slice(0, 50)

    const selectedNames = selectedProductIds
      .map(id => productById.get(id))
      .filter(Boolean)
      .map(p => (p as ProductItem).name)
      .slice(0, 50)

    const lines: string[] = []
    if (notes.trim()) lines.push(notes.trim())

    const scope = selectedCategoryIds.length > 0 && selectedProductIds.length > 0
      ? 'mixed'
      : selectedCategoryIds.length > 0
        ? 'category'
        : 'specific'

    const scopeLabel = scope === 'mixed'
      ? `混合(分类${selectedRootCategories.length}个 + 商品${selectedProductIds.length}个)`
      : scope === 'category'
        ? `按分类(${selectedRootCategories.length}个)`
        : `指定商品(${selectedProductIds.length}个)`

    lines.push(`申请范围: ${scopeLabel}`)
    if (selectedCategoryNames.length > 0) lines.push(`分类: ${selectedCategoryNames.join('、')}${selectedRootCategories.length > selectedCategoryNames.length ? '…' : ''}`)
    if (selectedNames.length > 0) lines.push(`商品: ${selectedNames.join('、')}${selectedProductIds.length > selectedNames.length ? '…' : ''}`)
    return lines.join('\n')
  }

  const handleSubmit = async () => {
    if (!isDesigner && !isManufacturerUser) {
      toast.error('当前账号暂不支持发起授权申请，请使用设计师或厂家账号')
      return
    }
    if (!canSubmit) {
      toast.error('请选择至少一个商品')
      return
    }

    setSubmitting(true)
    try {
      const scope = selectedCategoryIds.length > 0 && selectedProductIds.length > 0
        ? 'mixed'
        : selectedCategoryIds.length > 0
          ? 'category'
          : 'specific'

      await apiClient.post('/authorizations/designer-requests', {
        manufacturerId,
        scope,
        categories: selectedCategoryIds,
        products: selectedProductIds,
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      </div>
    )
  }

  const displayName = manufacturer?.fullName || manufacturer?.name || '品牌'
  const displayCode = manufacturer?.code || manufacturer?.shortName || ''
  const displayLogo = manufacturer?.logo

  return (
    <div className="min-h-screen bg-[#fcfdfd]">
      <div className="max-w-[1200px] mx-auto pb-24 px-4 pt-6 animate-fadeIn">
        <div className="bg-white rounded-[2rem] p-8 md:p-10 mb-8 border border-gray-100 shadow-xl shadow-gray-200/30 flex flex-col md:flex-row gap-8 items-center md:items-start overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-40" />

          <div className="relative z-10 shrink-0">
            {displayLogo ? (
              <img
                src={displayLogo}
                alt={displayName}
                className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover shadow-xl border-4 border-white"
              />
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-emerald-50 border-4 border-white shadow-xl flex items-center justify-center">
                <span className="text-emerald-700 font-black text-2xl">{(displayCode || displayName).slice(0, 2)}</span>
              </div>
            )}
          </div>

          <div className="relative z-10 flex-grow text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3 justify-center md:justify-start">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{displayName}</h1>
              {displayCode && (
                <span className="inline-flex px-3 py-1 bg-[#153e35] text-white text-[10px] font-bold rounded-full tracking-widest uppercase self-center">
                  {displayCode}
                </span>
              )}
            </div>
            {manufacturer?.description && (
              <p className="text-base text-gray-500 leading-relaxed max-w-2xl font-medium italic">“{manufacturer.description}”</p>
            )}
          </div>

          <div className="relative z-10 flex gap-3">
            <button
              className="rounded-xl px-6 py-2 border border-gray-200 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-all font-bold text-sm"
              onClick={() => navigate('/admin/manufacturers')}
              type="button"
            >
              返回品牌
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
              <h2 className="text-xl font-black text-gray-900 tracking-tight shrink-0">商品选库搜索</h2>
              <div className="relative flex-grow max-w-md">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="搜索商品名称或编码..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all text-sm font-medium shadow-sm"
                  value={productKeyword}
                  onChange={(e) => setProductKeyword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              {categoryTree.rootCategories.length === 0 ? (
                <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-6 text-gray-500">该品牌暂无分类</div>
              ) : (
                categoryTree.rootCategories.map(cat => {
                  const catId = String(cat.id)
                  const isOpen = expandedCategories.includes(catId)
                  const catProducts = getProductsByCategoryId(catId)

                  const isCatSelected = selectedCategoryIds.includes(catId)

                  if (catProducts.length === 0 && productKeyword) return null

                  return (
                    <div key={catId} className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden transition-all duration-300">
                      <div className={`p-5 flex items-center justify-between transition-colors ${isOpen ? 'bg-gray-50/50 border-b border-gray-50' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-4 flex-grow cursor-pointer" onClick={() => toggleCategory(catId)}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isOpen ? 'bg-[#153e35] text-white' : 'bg-gray-100 text-gray-400'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-gray-900">{cat.name}</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{catProducts.length} 款商品</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer group select-none">
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={isCatSelected}
                              onChange={() => toggleCategorySelection(catId)}
                            />
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isCatSelected ? 'bg-emerald-600 border-emerald-600' : 'border-gray-200 bg-white group-hover:border-emerald-300'}`}>
                              {isCatSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-xs font-bold transition-colors ${isCatSelected ? 'text-emerald-700' : 'text-gray-400'}`}>选择该类</span>
                          </label>
                          <div onClick={() => toggleCategory(catId)} className={`cursor-pointer transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className={`transition-all duration-300 ${isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        <div className="p-3 space-y-3">
                          {catProducts.map(prod => {
                            const productId = String(prod._id)
                            const isAuth = isProductAuthorized(productId)
                            const isSelected = selectedProductIds.includes(productId)
                            const isExpanded = expandedProductIds.includes(productId)
                            const pricing = getProductPricing(prod)
                            const img = prod.thumbnail || prod.images?.[0]

                            return (
                              <div key={productId} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                <div className={`flex items-center gap-4 p-4 transition-all ${isAuth ? 'bg-emerald-50/20' : 'bg-white'}`}>
                                  <label className="relative flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      className="hidden"
                                      checked={isAuth || isSelected}
                                      onChange={() => toggleProduct(productId, !!isAuth)}
                                      disabled={isAuth}
                                    />
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isAuth ? 'bg-emerald-600 border-emerald-600' : isSelected ? 'bg-[#153e35] border-[#153e35]' : 'border-gray-200 bg-white'}`}>
                                      {(isAuth || isSelected) && (
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                  </label>

                                  <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                    {img ? (
                                      <img src={img} className="w-full h-full object-cover" alt={prod.name} />
                                    ) : (
                                      <svg className="w-8 h-8 text-gray-200" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z" />
                                      </svg>
                                    )}
                                  </div>

                                  <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-base font-bold text-gray-800 truncate">{prod.name}</h4>
                                      <button
                                        onClick={() => toggleProductExpansion(productId)}
                                        className="text-blue-500 text-xs font-bold hover:underline flex items-center"
                                        type="button"
                                      >
                                        {isExpanded ? '收起SKU' : '展开SKU'}
                                        <svg className={`w-3 h-3 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold mt-0.5 tracking-tight uppercase">{prod.productCode || '无编码'}</p>

                                    <div className="flex flex-wrap items-center gap-x-12 gap-y-2 mt-3">
                                      <div>
                                        <p className="text-[10px] text-gray-400 font-medium">价格</p>
                                        <p className="text-sm font-bold text-gray-900">{pricing.priceRange}</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] text-orange-400 font-medium">最低折扣价</p>
                                        <p className="text-sm font-bold text-orange-600">{pricing.minDiscountPrice}</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] text-emerald-500 font-medium">返佣价格</p>
                                        <p className="text-sm font-bold text-emerald-600">{pricing.commissionPrice}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="bg-gray-50/50 p-3 border-t border-gray-100">
                                    <div className="space-y-2">
                                      {(prod.skus || []).length === 0 ? (
                                        <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-4 shadow-sm text-sm text-gray-500">
                                          暂无 SKU
                                        </div>
                                      ) : (
                                        (prod.skus || []).map((sku, idx) => {
                                          const skuPrice = sku.price || 0
                                          const skuPricing = getSkuPricing(skuPrice)
                                          const discountLabel = typeof skuPricing.discountRate === 'number'
                                            ? `${(skuPricing.discountRate * 10).toFixed(0)}折价`
                                            : '最低折扣价'
                                          return (
                                            <div key={`${productId}-${idx}`} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-4 shadow-sm">
                                              <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                                                <svg className="w-6 h-6 text-gray-200" fill="currentColor" viewBox="0 0 24 24">
                                                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z" />
                                                </svg>
                                              </div>

                                              <div className="grid grid-cols-4 flex-grow gap-4 items-center">
                                                <div className="col-span-1 min-w-0">
                                                  <p className="text-[10px] font-bold text-gray-400 mb-0.5 uppercase tracking-tighter">SKU: {sku.code || `SKU-${idx + 1}`}</p>
                                                  <p className="text-xs text-gray-700 font-bold truncate leading-tight" title={sku.spec || ''}>{sku.spec || '-'}</p>
                                                </div>
                                                <div className="space-y-0.5">
                                                  <p className="text-[10px] text-gray-400 font-medium">标价</p>
                                                  <p className="text-sm font-bold text-gray-900 leading-none">¥{skuPricing.listPrice}</p>
                                                </div>
                                                <div className="space-y-0.5">
                                                  <p className="text-[10px] text-orange-400 font-medium">{discountLabel}</p>
                                                  <p className="text-sm font-bold text-orange-600 leading-none">¥{skuPricing.discountPrice.toFixed(0)}</p>
                                                </div>
                                                <div className="space-y-0.5">
                                                  <p className="text-[10px] text-emerald-500 font-medium">设计师佣金</p>
                                                  <p className="text-sm font-bold text-emerald-600 leading-none">¥{skuPricing.commission.toFixed(0)}</p>
                                                </div>
                                              </div>
                                            </div>
                                          )
                                        })
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-bold text-gray-900">期望到期时间（可选）</div>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full mt-2 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">说明/备注（可选）</div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full mt-2 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                    rows={3}
                    placeholder="补充说明..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-[#153e35] rounded-[2rem] p-8 text-white shadow-2xl sticky top-24 overflow-hidden border border-emerald-900/10">
              <h3 className="text-lg font-bold mb-8 flex items-center">
                <svg className="w-5 h-5 mr-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                申请清单
              </h3>

              <div className="space-y-6 mb-8">
                <div className="flex justify-between items-center bg-black/20 rounded-2xl p-4 border border-white/5">
                  <div>
                    <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-widest mb-1">本次新选</p>
                    <p className="text-3xl font-black">{selectedCount}<span className="text-xs font-normal ml-1 opacity-50">项</span></p>
                  </div>
                  <div className="w-px h-8 bg-white/10 mx-4"></div>
                  <div className="flex-grow">
                    <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-widest mb-1">已获授权</p>
                    <p className="text-xl font-bold opacity-60">{products.filter(p => isProductAuthorized(String(p._id))).length}</p>
                  </div>
                </div>

                {selectedCount > 0 ? (
                  <div className="space-y-3">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                      {selectedRootCategories.map(cat => {
                        const id = String(cat.id)
                        return (
                          <div key={`cat-${id}`} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/5">
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                              <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                              </svg>
                            </div>
                            <div className="flex-grow min-w-0 text-[11px] font-bold truncate">{cat.name}</div>
                            <button
                              onClick={() => toggleCategorySelection(id)}
                              className="text-white/30 hover:text-red-400"
                              type="button"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )
                      })}
                      {selectedProductIds.map(id => {
                        const p = productById.get(id)
                        const img = p?.thumbnail || p?.images?.[0]
                        return (
                          <div key={id} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/5">
                            {img ? (
                              <img src={img} className="w-10 h-10 rounded-lg object-cover" alt={p?.name || ''} />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            <div className="flex-grow min-w-0 text-[11px] font-bold truncate">{p?.name || '未知商品'}</div>
                            <button
                              onClick={() => toggleProduct(id, false)}
                              className="text-white/30 hover:text-red-400"
                              type="button"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <p className="text-sm text-emerald-200/40 font-medium">勾选分类或商品开始申请</p>
                  </div>
                )}
              </div>

              <button
                className="w-full py-5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-[#153e35] font-black text-lg border-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canSubmit || submitting || (!isDesigner && !isManufacturerUser)}
                onClick={handleSubmit}
                type="button"
              >
                {submitting ? '提交中...' : '提交选库申请'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
