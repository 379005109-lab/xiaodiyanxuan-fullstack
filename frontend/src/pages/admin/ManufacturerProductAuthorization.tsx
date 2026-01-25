import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import apiClient from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { ChevronRight, ChevronDown, Image as ImageIcon } from 'lucide-react'

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
  basePrice?: number
  skus?: Array<{
    code?: string
    spec?: string
    price?: number
    discountPrice?: number
  }>
}

export default function ManufacturerProductAuthorization() {
  const navigate = useNavigate()
  const params = useParams()
  const { user } = useAuthStore()

  const isDesigner = user?.role === 'designer'
  const isPlatformAdmin = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'platform_admin'
  const isManufacturerUser = !!(
    (user as any)?.manufacturerId ||
    Array.isArray((user as any)?.manufacturerIds) && (user as any)?.manufacturerIds?.length > 0 ||
    user?.role === 'enterprise_admin' ||
    user?.role === 'enterprise_staff'
  )

  const manufacturerId = String(params.manufacturerId || '')

  const [manufacturer, setManufacturer] = useState<any>(null)
  const [mode, setMode] = useState<Mode>('category')
  const [loading, setLoading] = useState(true)

  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [products, setProducts] = useState<ProductItem[]>([])
  const [existingAuthorizations, setExistingAuthorizations] = useState<any[]>([])

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])

  const [productKeyword, setProductKeyword] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const [tierSystemConfig, setTierSystemConfig] = useState<any>(null)
  
  // 协议相关状态
  const [authorizationPeriod, setAuthorizationPeriod] = useState(12) // 授权期限（月）
  const [cancellationPolicy, setCancellationPolicy] = useState<'mutual' | 'notice'>('mutual')
  const [noticePeriodDays, setNoticePeriodDays] = useState(30)
  const [agreementSigned, setAgreementSigned] = useState(false)
  const [showAgreementModal, setShowAgreementModal] = useState(false)

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
          apiClient.get(`/manufacturers/${manufacturerId}/products`, { params: { status: 'active', limit: 10000 } }),
          apiClient.get(`/commission-systems/manufacturer/${manufacturerId}`).catch(() => ({ data: { data: null } })),
          apiClient.get(`/authorizations`, { params: { manufacturerId, status: 'active' } }).catch(() => ({ data: { data: [] } }))
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

  const toggleCategoryExpand = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleProductExpand = (id: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const isProductAuthorized = (productId: string) => {
    return existingAuthorizations.some(auth => {
      if (auth.scope === 'specific' && auth.products?.includes(productId)) return true
      const product = productById.get(productId)
      if (auth.scope === 'category' && product?.category && auth.categories?.some((catId: string) => 
        String(product.category._id) === catId || String(product.category.id) === catId
      )) return true
      return false
    })
  }

  // Pre-select authorized products when data loads
  useEffect(() => {
    if (products.length > 0 && existingAuthorizations.length > 0) {
      const authorizedProductIds: string[] = []
      const authorizedCategoryIds: string[] = []

      existingAuthorizations.forEach(auth => {
        if (auth.scope === 'specific' && auth.products) {
          authorizedProductIds.push(...auth.products.map((id: string) => String(id)))
        } else if (auth.scope === 'category' && auth.categories) {
          authorizedCategoryIds.push(...auth.categories.map((id: string) => String(id)))
        }
      })

      setSelectedProductIds(prev => {
        const combined = [...new Set([...prev, ...authorizedProductIds])]
        return combined
      })

      setSelectedCategoryIds(prev => {
        const combined = [...new Set([...prev, ...authorizedCategoryIds])]
        return combined
      })
    }
  }, [products, existingAuthorizations])

  // 构建分类树
  const categoryTree = useMemo(() => {
    const rootCategories = categories.filter(c => !c.parentId)
    const childrenMap = new Map<string, CategoryItem[]>()
    
    categories.forEach(c => {
      if (c.parentId) {
        const children = childrenMap.get(c.parentId) || []
        children.push(c)
        childrenMap.set(c.parentId, children)
      }
    })

    return { rootCategories, childrenMap }
  }, [categories])

  // 计算SKU价格信息
  const getSkuPricing = (skuPrice: number) => {
    // 从分层体系配置中获取最低折扣率和佣金率
    let minDiscountRate = 0.6 // 默认最低6折
    let commissionRate = 0.4 // 默认40%佣金
    
    if (tierSystemConfig) {
      const modules = tierSystemConfig.roleModules || []
      const accounts = tierSystemConfig.authorizedAccounts || []
      const userAccount = accounts.find((a: any) => String(a.userId) === String(user?._id))
      
      let targetModule = null
      let targetRule = null
      
      if (userAccount) {
        targetModule = modules.find((m: any) => String(m._id) === String(userAccount.roleModuleId))
        if (targetModule && targetModule.discountRules) {
          targetRule = targetModule.discountRules.find((r: any) => String(r._id) === String(userAccount.discountRuleId))
        }
      } else {
        targetModule = modules.find((m: any) => m.code === user?.role) || modules[0]
        if (targetModule && targetModule.discountRules) {
          targetRule = targetModule.discountRules.find((r: any) => r.isDefault) || targetModule.discountRules[0]
        }
      }
      
      if (targetRule) {
        minDiscountRate = targetRule.discountRate || 0.6
        commissionRate = targetRule.commissionRate || 0.4
      }
    }
    
    const minDiscountPrice = skuPrice * minDiscountRate
    const designerCommission = minDiscountPrice * commissionRate
    const factoryIncome = minDiscountPrice - designerCommission
    
    return {
      retailPrice: skuPrice,
      minDiscountPrice,
      designerCommission,
      factoryIncome,
      discountRate: minDiscountRate,
      commissionRate
    }
  }

  // 计算商品价格信息（根据分层体系配置）
  // 价格计算逻辑：
  // 标价10000元，最低折扣6折=6000元
  // 设计师佣金 = 6000 × 40% = 2400元
  // 工厂收入 = 6000 - 2400 = 3600元（固定）
  // 如果8折成交=8000元，超出部分2000元归设计师
  // 设计师总收入 = 2000 + 2400 = 4400元
  const getProductPricing = (product: ProductItem) => {
    const basePrice = product.basePrice || 0
    const skuPrices = product.skus?.map(s => s.price || 0).filter(p => p > 0) || []
    const discountPrices = product.skus?.map(s => s.discountPrice).filter(p => p && p > 0) || []
    
    // 标价（零售价）
    const retailPrice = skuPrices.length > 0 ? Math.min(...skuPrices) : basePrice
    const maxPrice = skuPrices.length > 0 ? Math.max(...skuPrices) : basePrice
    
    // 从分层体系配置中获取最低折扣率和佣金率
    let minDiscountRate = 0.6 // 默认最低6折
    let commissionRate = 0.4 // 默认40%佣金
    
    if (tierSystemConfig) {
      const modules = tierSystemConfig.roleModules || []
      const accounts = tierSystemConfig.authorizedAccounts || []
      
      // 查找当前用户的授权账号配置
      const userAccount = accounts.find((a: any) => String(a.userId) === String(user?._id))
      
      let targetModule = null
      let targetRule = null
      
      if (userAccount) {
        targetModule = modules.find((m: any) => String(m._id) === String(userAccount.roleModuleId))
        if (targetModule && targetModule.discountRules) {
          targetRule = targetModule.discountRules.find((r: any) => String(r._id) === String(userAccount.discountRuleId))
        }
      } else {
        targetModule = modules.find((m: any) => m.code === user?.role) || modules[0]
        if (targetModule && targetModule.discountRules) {
          targetRule = targetModule.discountRules.find((r: any) => r.isDefault) || targetModule.discountRules[0]
        }
      }
      
      if (targetRule) {
        minDiscountRate = targetRule.discountRate || 0.6
        commissionRate = targetRule.commissionRate || 0.4
      }
    }
    
    // 最低折扣价（如6折）
    const minDiscountPrice = retailPrice * minDiscountRate
    
    // 设计师佣金（基于最低折扣价）
    const designerCommission = minDiscountPrice * commissionRate
    
    // 工厂固定收入
    const factoryIncome = minDiscountPrice - designerCommission
    
    return {
      priceRange: retailPrice === maxPrice ? `¥${retailPrice}` : `¥${retailPrice} - ¥${maxPrice}`,
      minDiscountPrice: `¥${minDiscountPrice.toFixed(0)}`,
      commissionPrice: `¥${designerCommission.toFixed(0)}`,
      factoryIncome: `¥${factoryIncome.toFixed(0)}`,
      discountRate: `${(minDiscountRate * 10).toFixed(0)}折`,
      commissionRate: `${(commissionRate * 100).toFixed(0)}%`
    }
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
    return selectedCategoryIds.length > 0 || selectedProductIds.length > 0
  }, [selectedCategoryIds.length, selectedProductIds.length])

  const handleSubmit = async () => {
    if (!isDesigner && !isManufacturerUser && !isPlatformAdmin) {
      toast.error('当前账号暂不支持发起授权申请，请使用设计师、厂家或平台管理员账号')
      return
    }
    if (!canSubmit) {
      toast.error('请选择至少一个分类或商品')
      return
    }
    
    // 厂家用户需要先签署协议
    if (isManufacturerUser && !agreementSigned) {
      setShowAgreementModal(true)
      return
    }

    setSubmitting(true)
    try {
      const scope = selectedCategoryIds.length > 0 && selectedProductIds.length > 0 
        ? 'mixed' 
        : selectedCategoryIds.length > 0 
          ? 'category' 
          : 'specific'

      const endpoint = (isDesigner || isPlatformAdmin)
        ? '/authorizations/designer-requests'
        : '/authorizations/manufacturer-requests'
      await apiClient.post(endpoint, {
        manufacturerId,
        scope,
        categories: selectedCategoryIds,
        products: selectedProductIds,
        validUntil: validUntil || undefined,
        notes: buildNotes(),
        authorizationPeriod,
        cancellationPolicy,
        noticePeriodDays: cancellationPolicy === 'notice' ? noticePeriodDays : undefined,
        agreementSigned
      })
      toast.success('申请已提交')
      navigate('/admin/manufacturers')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }
  
  const handleConfirmAgreement = () => {
    setAgreementSigned(true)
    setShowAgreementModal(false)
    // 自动触发提交
    setTimeout(() => handleSubmit(), 100)
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
          <button className="btn btn-primary" disabled={submitting || !canSubmit} onClick={handleSubmit}>
            {submitting ? '提交中...' : '提交申请'}
          </button>
        </div>
      </div>


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
                <div className="mt-4">
                  {categories.length === 0 ? (
                    <div className="text-sm text-gray-500">该厂家暂无可用分类</div>
                  ) : (
                    <div className="space-y-1">
                      {categoryTree.rootCategories.map(c => (
                        <CategoryTreeNode
                          key={c.id}
                          category={c}
                          childrenMap={categoryTree.childrenMap}
                          selectedIds={selectedCategoryIds}
                          expandedIds={expandedCategories}
                          onToggle={toggleCategory}
                          onToggleExpand={toggleCategoryExpand}
                          level={0}
                        />
                      ))}
                    </div>
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
                  <div className="max-h-[520px] overflow-auto space-y-3">
                    {filteredProducts.length === 0 ? (
                      <div className="text-sm text-gray-500">暂无商品</div>
                    ) : (
                      filteredProducts.map(p => {
                        const hasMultipleSkus = p.skus && p.skus.length > 1
                        const isExpanded = expandedProducts.has(String(p._id))
                        const pricing = getProductPricing(p)
                        const isAuthorized = isProductAuthorized(String(p._id))
                        
                        return (
                          <div key={p._id} className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* 主商品信息 */}
                            <div className="flex items-start gap-3 p-3 bg-white hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={selectedProductIds.includes(String(p._id))}
                                onChange={() => toggleProduct(String(p._id))}
                                className="mt-1"
                              />
                              {/* 商品图片 */}
                              <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                                {p.thumbnail || p.images?.[0] ? (
                                  <img
                                    src={p.thumbnail || p.images?.[0]}
                                    alt={p.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.currentTarget
                                      target.style.display = 'none'
                                      const parent = target.parentElement
                                      if (parent) {
                                        const placeholder = document.createElement('div')
                                        placeholder.className = 'w-full h-full flex items-center justify-center'
                                        placeholder.innerHTML = '<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>'
                                        parent.appendChild(placeholder)
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              {/* 商品信息 */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="font-medium text-gray-900 truncate">{p.name}</div>
                                  {isAuthorized && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      已授权
                                    </span>
                                  )}
                                  {hasMultipleSkus && (
                                    <button
                                      onClick={() => toggleProductExpand(String(p._id))}
                                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                      type="button"
                                    >
                                      {isExpanded ? (
                                        <>
                                          <ChevronDown className="w-3 h-3" />
                                          收起SKU
                                        </>
                                      ) : (
                                        <>
                                          <ChevronRight className="w-3 h-3" />
                                          展开{p.skus.length}个SKU
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 font-mono mt-1">{p.productCode || '无编码'}</div>
                                <div className="flex items-center gap-3 text-sm">
                                  <div className="px-2 py-1 bg-gray-50 rounded">
                                    <div className="text-xs text-gray-400">零售价</div>
                                    <div className="text-sm font-medium text-gray-500">{pricing.priceRange}</div>
                                  </div>
                                  <div className="px-2 py-1 bg-orange-50 rounded">
                                    <div className="text-xs text-orange-500">最低售价</div>
                                    <div className="text-sm font-medium text-orange-600">{pricing.minDiscountPrice}</div>
                                  </div>
                                  <div className="px-2 py-1 bg-green-50 rounded">
                                    <div className="text-xs text-green-500">返佣金额</div>
                                    <div className="text-sm font-medium text-green-600">{pricing.commissionPrice}</div>
                                  </div>
                                  <div className="px-2 py-1 bg-blue-50 rounded border border-blue-200">
                                    <div className="text-xs text-blue-500">成本价</div>
                                    <div className="text-sm font-bold text-blue-700">{pricing.factoryIncome}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* SKU列表 */}
                            {hasMultipleSkus && isExpanded && (
                              <div className="border-t border-gray-200 bg-gray-50 p-3 space-y-2">
                                {p.skus.map((sku, index) => {
                                  const skuPrice = sku.price || 0
                                  const skuPricing = getSkuPricing(skuPrice)
                                  
                                  return (
                                    <div key={index} className="bg-white p-2 rounded border border-gray-200">
                                      <div className="text-xs text-gray-700 mb-1">
                                        <span className="font-medium">SKU:</span> {sku.code || `SKU-${index + 1}`}
                                        {sku.spec && <span className="ml-2">{sku.spec}</span>}
                                      </div>
                                      <div className="grid grid-cols-4 gap-2 text-xs">
                                        <div>
                                          <div className="text-gray-500">标价</div>
                                          <div className="font-medium text-gray-900">¥{skuPrice}</div>
                                        </div>
                                        <div>
                                          <div className="text-gray-500">{(skuPricing.discountRate * 10).toFixed(0)}折价</div>
                                          <div className="font-medium text-orange-600">¥{skuPricing.minDiscountPrice.toFixed(0)}</div>
                                        </div>
                                        <div>
                                          <div className="text-gray-500">设计师佣金</div>
                                          <div className="font-medium text-green-600">¥{skuPricing.designerCommission.toFixed(0)}</div>
                                        </div>
                                        <div>
                                          <div className="text-gray-500">成本价</div>
                                          <div className="font-bold text-blue-700">¥{skuPricing.factoryIncome.toFixed(0)}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })
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
      
      {/* 协议签署弹窗 */}
      {showAgreementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">授权合作协议</h3>
              <p className="text-sm text-gray-500 mt-1">请确认以下协议条款后提交申请</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* 授权期限 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">授权期限</label>
                <select
                  value={authorizationPeriod}
                  onChange={e => setAuthorizationPeriod(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value={6}>6个月</option>
                  <option value={12}>12个月（1年）</option>
                  <option value={24}>24个月（2年）</option>
                  <option value={36}>36个月（3年）</option>
                </select>
              </div>
              
              {/* 取消政策 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">提前终止方式</label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      checked={cancellationPolicy === 'mutual'}
                      onChange={() => setCancellationPolicy('mutual')}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">双方协商同意</div>
                      <div className="text-sm text-gray-500">授权期限内如需提前终止，须经双方书面同意</div>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      checked={cancellationPolicy === 'notice'}
                      onChange={() => setCancellationPolicy('notice')}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">提前通知</div>
                      <div className="text-sm text-gray-500">任一方可提前通知终止授权</div>
                    </div>
                  </label>
                </div>
              </div>
              
              {/* 提前通知天数 */}
              {cancellationPolicy === 'notice' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">提前通知天数</label>
                  <select
                    value={noticePeriodDays}
                    onChange={e => setNoticePeriodDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value={7}>7天</option>
                    <option value={15}>15天</option>
                    <option value={30}>30天</option>
                    <option value={60}>60天</option>
                  </select>
                </div>
              )}
              
              {/* 协议条款 */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-2">
                <div className="font-medium text-gray-900">协议条款</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>双方同意在授权期限内保持合作关系</li>
                  <li>被授权方应遵守授权方的价格政策和销售规范</li>
                  <li>授权期满前30天，双方可协商续期事宜</li>
                  <li>如一方违约，另一方有权立即终止授权</li>
                  <li>授权终止后，被授权方应停止销售授权商品</li>
                </ul>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowAgreementModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAgreement}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                同意协议并提交申请
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 树状分类节点组件
interface CategoryTreeNodeProps {
  category: CategoryItem
  childrenMap: Map<string, CategoryItem[]>
  selectedIds: string[]
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onToggleExpand: (id: string) => void
  level: number
}

function CategoryTreeNode({
  category,
  childrenMap,
  selectedIds,
  expandedIds,
  onToggle,
  onToggleExpand,
  level
}: CategoryTreeNodeProps) {
  const children = childrenMap.get(category.id) || []
  const hasChildren = children.length > 0
  const isExpanded = expandedIds.has(category.id)
  const isSelected = selectedIds.includes(String(category.id))

  return (
    <div>
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 hover:bg-gray-50"
        style={{ marginLeft: `${level * 20}px` }}
      >
        {/* 展开/收起按钮 */}
        {hasChildren ? (
          <button
            onClick={() => onToggleExpand(category.id)}
            className="p-0.5 hover:bg-gray-200 rounded"
            type="button"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* 复选框和分类名称 */}
        <label className="flex items-center justify-between gap-3 flex-1 cursor-pointer">
          <div className="flex items-center gap-2 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggle(String(category.id))}
            />
            <span className="text-sm text-gray-900 truncate">{category.name}</span>
          </div>
          <span className="text-xs text-gray-500">{category.count}件</span>
        </label>
      </div>

      {/* 子分类 */}
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {children.map(child => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              childrenMap={childrenMap}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onToggleExpand={onToggleExpand}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
