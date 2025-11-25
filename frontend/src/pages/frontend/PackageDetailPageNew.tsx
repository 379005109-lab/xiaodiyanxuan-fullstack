import { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Minus, Check, Loader2, X, Maximize2, AlertCircle } from 'lucide-react'
import { PackagePlan, PackageProductMaterial } from '@/types'
import { getAllPackages } from '@/services/packageService'
import { getAllMaterials } from '@/services/materialService'
import { getFileUrl } from '@/services/uploadService'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

type PackageCategory = PackagePlan['categories'][number]
type PackageProduct = PackageCategory['products'][number]

// 材质加价规则
const MATERIAL_PREMIUM_RULES = [
  { keyword: '进口', extra: 1200 },
  { keyword: '真皮', extra: 1500 },
  { keyword: '航空铝', extra: 900 },
  { keyword: '高密度', extra: 800 },
  { keyword: '实木', extra: 700 },
]

// 材质名称映射
const MATERIAL_NAMES: Record<string, string> = {
  fabric: '面料',
  filling: '填充',
  frame: '框架',
  leg: '脚架',
  leather: '皮质',
  wood: '木材',
}

// 获取材质图片
const getMaterialPreviewImage = (product: PackageProduct, option: string, materialImageMap: Record<string, string>) => {
  // 1. 从材质管理中获取
  if (materialImageMap[option]) return getFileUrl(materialImageMap[option])
  // 2. 模糊匹配
  for (const [name, path] of Object.entries(materialImageMap)) {
    if (option.includes(name) || name.includes(option)) return getFileUrl(path)
  }
  // 3. 从商品中获取
  if ((product as any).materialImages?.[option]) return getFileUrl((product as any).materialImages[option])
  // 4. 默认
  return product.image ? getFileUrl(product.image) : '/placeholder.svg'
}

export default function PackageDetailPageNew() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pkg, setPkg] = useState<PackagePlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState<Record<string, string[]>>({})
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [materialSelections, setMaterialSelections] = useState<Record<string, Record<string, string>>>({})
  const [skuSelections, setSkuSelections] = useState<Record<string, any>>({})
  const [previewProduct, setPreviewProduct] = useState<PackageProduct | null>(null)
  const [selectingProduct, setSelectingProduct] = useState<{ categoryKey: string; product: PackageProduct } | null>(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [orderForm, setOrderForm] = useState({ name: '', phone: '', address: '' })
  const [submitting, setSubmitting] = useState(false)
  const [materialImageMap, setMaterialImageMap] = useState<Record<string, string>>({})
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const { isAuthenticated, token } = useAuthStore()

  useEffect(() => {
    loadPackage()
    loadMaterialImages()
  }, [id])

  const loadMaterialImages = async () => {
    try {
      const materials = await getAllMaterials()
      const imageMap: Record<string, string> = {}
      materials.forEach((m: any) => {
        if (m.name && m.image) imageMap[m.name] = m.image
      })
      setMaterialImageMap(imageMap)
    } catch (e) {
      console.error('加载材质图片失败:', e)
    }
  }

  const loadPackage = async () => {
    if (!id) return
    setLoading(true)
    const data = await getAllPackages()
    const packageData = data.find((p) => p.id === id)
    setPkg(packageData || null)
    setLoading(false)
  }

  const scrollCategory = (key: string, dir: 'left' | 'right') => {
    const el = scrollRefs.current[key]
    if (el) el.scrollBy({ left: dir === 'left' ? -350 : 350, behavior: 'smooth' })
  }

  // 打开商品选择窗口（选择规格材质）
  const openProductSelector = (categoryKey: string, product: PackageProduct) => {
    const isSelected = (selectedProducts[categoryKey] || []).includes(product.id)
    if (isSelected) {
      // 已选中，点击取消选择
      setSelectedProducts(prev => ({
        ...prev,
        [categoryKey]: prev[categoryKey].filter(id => id !== product.id)
      }))
      toast.success('已移除')
    } else {
      // 未选中，打开选择窗口
      setSelectingProduct({ categoryKey, product })
    }
  }

  // 确认添加商品
  const confirmAddProduct = (categoryKey: string, product: PackageProduct, materials: Record<string, string>, sku: any) => {
    const category = pkg?.categories.find(c => c.key === categoryKey)
    if (!category) return
    
    const current = selectedProducts[categoryKey] || []
    if (current.length >= category.required) {
      toast.error(`最多选择 ${category.required} 件`)
      return
    }
    
    setSelectedProducts(prev => ({
      ...prev,
      [categoryKey]: [...(prev[categoryKey] || []), product.id]
    }))
    setMaterialSelections(prev => ({
      ...prev,
      [product.id]: materials
    }))
    // 保存选择的SKU
    if (sku) {
      setSkuSelections(prev => ({
        ...prev,
        [product.id]: sku
      }))
    }
    if (!quantities[product.id]) {
      setQuantities(prev => ({ ...prev, [product.id]: 1 }))
    }
    setSelectingProduct(null)
    toast.success('已添加到清单')
  }

  // 获取商品材质标签
  const getMaterialLabel = (productId: string) => {
    const selections = materialSelections[productId]
    if (!selections || Object.keys(selections).length === 0) return null
    return Object.values(selections).join(' / ')
  }

  const updateQty = (productId: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + delta)
    }))
  }

  const getSelectedCount = (categoryKey: string) => {
    return (selectedProducts[categoryKey] || []).reduce((sum, id) => sum + (quantities[id] || 1), 0)
  }

  // 计算单个商品的材质升级费用
  const getProductSurcharge = (productId: string) => {
    const materials = materialSelections[productId]
    if (!materials) return 0
    
    const product = pkg?.categories.flatMap(c => c.products).find(p => p.id === productId)
    if (!product) return 0
    
    let surcharge = 0
    Object.entries(materials).forEach(([key, option]) => {
      const options = (product.materials as any)?.[key] as string[]
      if (!options || options[0] === option) return
      
      // 从SKU中获取加价
      const productAny = product as any
      if (productAny.skus) {
        for (const sku of productAny.skus) {
          if (sku.materialUpgradePrices?.[option]) {
            surcharge += sku.materialUpgradePrices[option]
            return
          }
          for (const [k, price] of Object.entries(sku.materialUpgradePrices || {})) {
            if (option.includes(k) || k.includes(option)) {
              surcharge += price as number
              return
            }
          }
        }
      }
    })
    return surcharge
  }

  // 计算总材质升级费用
  const totalMaterialSurcharge = useMemo(() => {
    if (!pkg) return 0
    let total = 0
    pkg.categories.forEach(cat => {
      const ids = selectedProducts[cat.key] || []
      ids.forEach(id => {
        const qty = quantities[id] || 1
        total += getProductSurcharge(id) * qty
      })
    })
    return total
  }, [pkg, selectedProducts, materialSelections, quantities])

  const basePrice = pkg ? pkg.price : 0
  const totalPrice = basePrice + totalMaterialSurcharge
  const progressPercent = pkg ? Math.round(
    (pkg.categories.reduce((sum, cat) => sum + Math.min(getSelectedCount(cat.key), cat.required), 0) /
    pkg.categories.reduce((sum, cat) => sum + cat.required, 0)) * 100
  ) : 0

  const handleSubmit = async () => {
    if (!pkg || !isAuthenticated) {
      toast.error('请先登录')
      return
    }
    setSubmitting(true)
    try {
      // 构建订单数据
      const items = pkg.categories.flatMap(cat => {
        const ids = selectedProducts[cat.key] || []
        return ids.map(id => {
          const product = cat.products.find(p => p.id === id)
          return product ? {
            productId: id,
            productName: product.name,
            quantity: quantities[id] || 1,
            price: product.price || 0
          } : null
        }).filter(Boolean)
      })

      const response = await fetch('https://pkochbpmcgaa.sealoshzh.site/api/orders/package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          packageId: pkg.id,
          packageName: pkg.name,
          items,
          totalAmount: totalPrice,
          customer: orderForm
        })
      })

      if (response.ok) {
        toast.success('订单提交成功！')
        setIsOrderModalOpen(false)
        navigate('/orders')
      } else {
        throw new Error('提交失败')
      }
    } catch (e) {
      toast.error('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F4F3]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2F4F3]">
        <p className="text-lg mb-4 text-stone-600">未找到对应套餐</p>
        <Link to="/packages" className="bg-primary text-white px-6 py-2 rounded-xl">返回套餐列表</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F2F4F3] pb-20 animate-fade-in-up">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* 左侧内容区 */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero - 使用固定宽高比避免变形 */}
          <div className="relative w-full aspect-[21/9] max-h-72 overflow-hidden">
            <img 
              src={pkg.gallery?.[0] || (pkg.banner ? getFileUrl(pkg.banner) : '/placeholder.svg')}
              alt={pkg.name}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/50 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full p-8 text-white">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-accent text-stone-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Collection</span>
                <span className="text-white/60 text-[10px] uppercase tracking-widest">NORDIC SERIES</span>
              </div>
              <h1 className="text-3xl font-serif font-bold mb-2">{pkg.name}</h1>
              <p className="opacity-90 text-sm max-w-2xl">{pkg.description}</p>
            </div>
            <button 
              onClick={() => navigate('/packages')} 
              className="absolute top-4 left-4 flex items-center gap-1 bg-white/20 backdrop-blur text-white rounded-full px-4 py-2 text-sm hover:bg-white/30 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> 返回列表
            </button>
          </div>

          {/* 分类商品 */}
          <div className="p-6 lg:p-10 space-y-12">
            {pkg.categories.map((category, idx) => {
              const selectedIds = selectedProducts[category.key] || []
              return (
                <div key={category.key} id={category.key}>
                  {/* 分类头部 */}
                  <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-bold text-stone-300">0{idx + 1}</span>
                        <h3 className="text-xl font-serif font-bold text-primary">{category.name}</h3>
                        <span className="text-xs font-medium text-white bg-primary/80 px-2 py-0.5 rounded">
                          {category.products.length}选{category.required}
                        </span>
                        {selectedIds.length > 0 && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${selectedIds.length >= category.required ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            已选 {selectedIds.length}/{category.required}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <span>快速筛选:</span>
                        <button className="px-2 py-0.5 rounded bg-primary text-white">全部</button>
                        <button className="px-2 py-0.5 rounded hover:bg-stone-200">真皮</button>
                        <button className="px-2 py-0.5 rounded hover:bg-stone-200">布艺</button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => scrollCategory(category.key, 'left')} className="w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center hover:bg-black shadow-lg">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button onClick={() => scrollCategory(category.key, 'right')} className="w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center hover:bg-black shadow-lg">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* 横向滚动商品 */}
                  <div 
                    ref={el => scrollRefs.current[category.key] = el}
                    className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x"
                    style={{ scrollBehavior: 'smooth' }}
                  >
                    {category.products.map(product => {
                      const isSelected = selectedIds.includes(product.id)
                      const isDisabled = product.isDeleted || product.status === 'inactive'
                      return (
                        <div 
                          key={product.id}
                          className={`snap-start flex-shrink-0 w-[280px] bg-white rounded-xl overflow-hidden border-2 transition-all ${
                            isSelected ? 'border-primary ring-2 ring-primary/20 shadow-lg' : 'border-stone-100 hover:shadow-md'
                          } ${isDisabled ? 'opacity-50' : ''}`}
                        >
                          <div className="relative h-36 bg-stone-100">
                            <img 
                              src={product.image ? getFileUrl(product.image) : '/placeholder.svg'} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                            <button 
                              onClick={() => setPreviewProduct(product)}
                              className="absolute top-2 left-2 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full text-stone-600 hover:text-primary shadow-md"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h4 className="font-bold text-stone-800 line-clamp-1 mb-1">{product.name}</h4>
                            <div className="text-accent font-serif font-bold text-lg mb-2">¥{(product.price || 0).toLocaleString()}</div>
                            <div className="text-[10px] text-stone-400 mb-3">可选规格: {product.materials ? Object.keys(product.materials).length : 0} 款</div>
                            <button 
                              onClick={() => !isDisabled && openProductSelector(category.key, product)}
                              disabled={isDisabled}
                              className={`w-full py-2.5 rounded-lg text-sm font-bold transition-colors ${
                                isDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
                                isSelected ? 'bg-primary text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                              }`}
                            >
                              {isDisabled ? '已下架' : isSelected ? '已添加到清单' : '加入配置'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 右侧悬浮清单 */}
        <div className="hidden lg:block w-96 flex-shrink-0">
          <div className="sticky top-4 m-4 bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-stone-100 bg-stone-50/50">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-serif font-bold text-primary text-lg mb-1">配置清单</h3>
                <span className="text-xs text-stone-400 uppercase tracking-widest">PRO FORMA INVOICE</span>
              </div>
              <div className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">Draft</div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {/* 进度条 */}
            <div className="mb-6">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-stone-500">完成度</span>
                <span className="text-primary">{progressPercent}%</span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            {/* 已选商品 */}
            <div className="space-y-4">
              {pkg.categories.map(cat => (selectedProducts[cat.key] || []).map(productId => {
                const product = cat.products.find(p => p.id === productId)
                if (!product) return null
                const qty = quantities[productId] || 1
                const surcharge = getProductSurcharge(productId)
                const itemTotal = ((product.price || 0) + surcharge) * qty
                const hasSurcharge = surcharge > 0
                
                return (
                  <div key={productId} className={`flex gap-3 items-start group p-2 rounded-lg ${hasSurcharge ? 'bg-amber-50 border border-amber-200' : ''}`}>
                    <div className="w-12 h-12 rounded-lg bg-stone-50 overflow-hidden border border-stone-100 flex-shrink-0 relative">
                      <img src={product.image ? getFileUrl(product.image) : '/placeholder.svg'} alt="" className="w-full h-full object-cover" />
                      {hasSurcharge && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                          <span className="text-[8px] text-white font-bold">↑</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-stone-700 line-clamp-1">{product.name}</span>
                        <span className="text-xs font-serif font-bold text-stone-900">¥{itemTotal.toLocaleString()}</span>
                      </div>
                      {getMaterialLabel(productId) && (
                        <div className="text-[10px] text-stone-500 mt-0.5 truncate">{getMaterialLabel(productId)}</div>
                      )}
                      {hasSurcharge && (
                        <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                          材质升级 +¥{(surcharge * qty).toLocaleString()}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-stone-200 rounded bg-white">
                          <button onClick={() => updateQty(productId, -1)} className="p-1 hover:bg-stone-50"><Minus className="w-3 h-3 text-stone-400" /></button>
                          <span className="text-[10px] w-5 text-center">{qty}</span>
                          <button onClick={() => updateQty(productId, 1)} className="p-1 hover:bg-stone-50"><Plus className="w-3 h-3 text-stone-400" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }))}
              {Object.values(selectedProducts).every(arr => arr.length === 0) && (
                <div className="text-center py-8 text-stone-400 text-sm">还未选择任何商品</div>
              )}
            </div>
          </div>

          {/* 底部汇总 */}
          <div className="p-6 bg-stone-50 border-t border-stone-200 space-y-4">
            <div className="space-y-2 text-xs text-stone-500">
              <div className="flex justify-between"><span>套餐基础价</span><span>¥{basePrice.toLocaleString()}</span></div>
              {totalMaterialSurcharge > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>材质升级费用</span>
                  <span>+¥{totalMaterialSurcharge.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="pt-4 border-t border-stone-200">
              <div className="flex justify-between items-end mb-4">
                <span className="font-bold text-primary">预估总价</span>
                <span className="font-serif font-bold text-2xl text-accent">¥{totalPrice.toLocaleString()}</span>
              </div>
              <button 
                onClick={() => setIsOrderModalOpen(true)}
                disabled={progressPercent < 100}
                className="w-full bg-primary text-white py-3.5 rounded-xl font-bold hover:bg-green-900 shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                提交采购意向 <ChevronRight className="w-4 h-4" />
              </button>
              <p className="text-[10px] text-center text-stone-400 mt-2">* 最终报价以销售顾问确认为准</p>
            </div>
          </div>
          </div>
        </div>

        {/* 移动端底部栏 */}
        <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-stone-200 p-4 z-50 flex justify-between items-center shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          <div>
            <div className="text-[10px] text-stone-400 uppercase">Total Estimate</div>
            <div className="font-serif font-bold text-xl text-accent">¥{totalPrice.toLocaleString()}</div>
          </div>
          <button onClick={() => setIsOrderModalOpen(true)} disabled={progressPercent < 100} className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg disabled:opacity-50">
            提交意向
          </button>
        </div>
      </div>

      {/* 预览弹窗 */}
      {previewProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setPreviewProduct(null)}>
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="relative h-64 bg-stone-100">
              <img src={previewProduct.image ? getFileUrl(previewProduct.image) : '/placeholder.svg'} alt="" className="w-full h-full object-cover" />
              <button onClick={() => setPreviewProduct(null)} className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-serif font-bold text-primary mb-1">{previewProduct.name}</h3>
              <div className="text-2xl font-serif font-bold text-accent mb-4">¥{(previewProduct.price || 0).toLocaleString()}</div>
            </div>
            <div className="p-4 border-t border-stone-100 bg-stone-50">
              <button onClick={() => setPreviewProduct(null)} className="w-full bg-stone-200 text-stone-600 py-3 rounded-xl font-bold hover:bg-stone-300">关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* 订单确认弹窗 */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsOrderModalOpen(false)}>
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-stone-100">
              <h3 className="text-xl font-serif font-bold text-primary">确认订单</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase">联系人</label>
                <input type="text" value={orderForm.name} onChange={e => setOrderForm(f => ({ ...f, name: e.target.value }))} className="w-full mt-1 px-4 py-2 border border-stone-200 rounded-lg focus:border-primary outline-none" placeholder="您的姓名" />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase">电话</label>
                <input type="tel" value={orderForm.phone} onChange={e => setOrderForm(f => ({ ...f, phone: e.target.value }))} className="w-full mt-1 px-4 py-2 border border-stone-200 rounded-lg focus:border-primary outline-none" placeholder="联系电话" />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase">地址</label>
                <input type="text" value={orderForm.address} onChange={e => setOrderForm(f => ({ ...f, address: e.target.value }))} className="w-full mt-1 px-4 py-2 border border-stone-200 rounded-lg focus:border-primary outline-none" placeholder="收货地址" />
              </div>
              <div className="pt-4 border-t border-stone-100">
                <div className="flex justify-between items-end">
                  <span className="text-stone-600">订单总额</span>
                  <span className="font-serif font-bold text-2xl text-accent">¥{totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-stone-100 bg-stone-50 flex gap-3">
              <button onClick={() => setIsOrderModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold bg-stone-200 text-stone-600">取消</button>
              <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 rounded-xl font-bold bg-primary text-white disabled:opacity-50">
                {submitting ? '提交中...' : '确认提交'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 商品选择弹窗 - 选择规格材质 */}
      {selectingProduct && (
        <ProductSelectorModal
          product={selectingProduct.product}
          categoryKey={selectingProduct.categoryKey}
          materialImageMap={materialImageMap}
          onConfirm={confirmAddProduct}
          onClose={() => setSelectingProduct(null)}
        />
      )}
    </div>
  )
}

// 商品选择弹窗组件 - 包含规格、材质选择、图片预览、加价逻辑
function ProductSelectorModal({ 
  product, 
  categoryKey, 
  materialImageMap,
  onConfirm, 
  onClose 
}: { 
  product: PackageProduct
  categoryKey: string
  materialImageMap: Record<string, string>
  onConfirm: (categoryKey: string, product: PackageProduct, materials: Record<string, string>, sku: any) => void
  onClose: () => void
}) {
  const productAny = product as any
  const [selectedSku, setSelectedSku] = useState<any>(productAny.skus?.[0] || null)
  const [materialSelections, setMaterialSelections] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {}
    if (product.materials) {
      Object.entries(product.materials).forEach(([key, options]) => {
        if (Array.isArray(options) && options.length > 0) defaults[key] = options[0]
      })
    }
    return defaults
  })
  const [previewImage, setPreviewImage] = useState(product.image ? getFileUrl(product.image) : '/placeholder.svg')
  const [showAllSpecs, setShowAllSpecs] = useState(false)

  const hasSkus = productAny.skus && productAny.skus.length > 0
  const hasMaterials = product.materials && Object.keys(product.materials).length > 0

  // 计算材质加价
  const getOptionPremium = (option: string) => {
    if (productAny.skus) {
      for (const sku of productAny.skus) {
        if (sku.materialUpgradePrices?.[option]) {
          return sku.materialUpgradePrices[option]
        }
        // 模糊匹配
        for (const [key, price] of Object.entries(sku.materialUpgradePrices || {})) {
          if (option.includes(key) || key.includes(option)) return price as number
        }
      }
    }
    return 0
  }

  // 计算总加价
  const totalSurcharge = Object.entries(materialSelections).reduce((sum, [key, option]) => {
    const options = (product.materials as any)?.[key] as string[]
    if (!options || options[0] === option) return sum
    return sum + getOptionPremium(option)
  }, 0)

  // 选择材质时更新图片
  const handleSelectMaterial = (materialKey: string, option: string) => {
    setMaterialSelections(prev => ({ ...prev, [materialKey]: option }))
    const newImage = getMaterialPreviewImage(product, option, materialImageMap)
    setPreviewImage(newImage)
  }

  // 选择规格
  const handleSelectSku = (sku: any) => {
    setSelectedSku(sku)
    if (sku.images?.[0]) {
      setPreviewImage(getFileUrl(sku.images[0]))
    }
  }

  const currentPrice = selectedSku?.price || selectedSku?.discountPrice || product.price || 0

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="flex items-center justify-between border-b px-6 py-4 flex-shrink-0">
          <div>
            <p className="text-xs text-stone-400">选择规格材质</p>
            <h3 className="text-xl font-serif font-bold text-primary">{product.name}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-stone-100">
            <X className="h-5 w-5 text-stone-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-6 p-6">
            {/* 左侧图片 */}
            <div className="relative aspect-square bg-stone-100 rounded-2xl overflow-hidden">
              <img src={previewImage} alt={product.name} className="w-full h-full object-cover" />
            </div>

            {/* 右侧选择 */}
            <div className="space-y-6">
              {/* 规格选择 */}
              {hasSkus && (
                <div>
                  <h4 className="text-sm font-bold text-stone-700 mb-3">选择规格</h4>
                  <div className="space-y-2">
                    {productAny.skus.slice(0, showAllSpecs ? undefined : 3).map((sku: any, idx: number) => {
                      const isSelected = selectedSku?.code === sku.code
                      const skuPrice = sku.price || sku.discountPrice || 0
                      const dims = sku.length && sku.width && sku.height
                        ? `${Math.round(sku.length/10)}×${Math.round(sku.width/10)}×${Math.round(sku.height/10)}cm`
                        : ''
                      return (
                        <button
                          key={sku.code || idx}
                          onClick={() => handleSelectSku(sku)}
                          className={`w-full border-2 rounded-xl p-3 text-left transition ${
                            isSelected ? 'border-primary bg-primary/5' : 'border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-stone-800">{sku.spec || `规格${idx+1}`}</span>
                            <span className="text-accent font-bold">¥{skuPrice.toLocaleString()}</span>
                          </div>
                          {dims && <p className="text-xs text-stone-500 mt-1">尺寸：{dims}</p>}
                        </button>
                      )
                    })}
                    {productAny.skus.length > 3 && (
                      <button onClick={() => setShowAllSpecs(!showAllSpecs)} className="w-full text-xs text-stone-500 py-2 hover:text-primary">
                        {showAllSpecs ? '收起' : `展开更多 (${productAny.skus.length - 3}个)`}
                        <ChevronRight className={`inline w-3 h-3 ml-1 transition ${showAllSpecs ? 'rotate-90' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 无规格时显示商品信息 */}
              {!hasSkus && (
                <div className="border-2 border-primary rounded-xl p-4 bg-primary/5">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-stone-800">{product.name}</span>
                    <span className="text-accent font-bold text-lg">¥{(product.price || 0).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* 材质选择 */}
              {hasMaterials && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-stone-700">选择材质</h4>
                    <span className="text-[10px] text-stone-400">点击材质可切换</span>
                  </div>
                  {Object.entries(product.materials as PackageProductMaterial).map(([materialKey, options]) => {
                    const materialOptions = (options ?? []) as string[]
                    
                    // 按材质类型分组
                    const groups: Record<string, Array<{value: string, label: string, idx: number}>> = {}
                    const groupOrder: string[] = []
                    
                    materialOptions.forEach((mat, idx) => {
                      let group = '其他', label = mat
                      if (mat.includes('-')) {
                        const parts = mat.split('-')
                        group = parts[0]
                        label = parts.slice(1).join('-')
                      } else if (['全青皮','真皮','普通皮','牛皮','半皮'].some(s => mat.includes(s))) {
                        group = mat
                        label = '默认'
                      }
                      if (!groups[group]) { groups[group] = []; groupOrder.push(group) }
                      groups[group].push({ value: mat, label, idx })
                    })

                    return (
                      <div key={materialKey} className="mb-4">
                        <p className="text-xs font-medium text-stone-500 mb-2">{MATERIAL_NAMES[materialKey] || materialKey}</p>
                        {groupOrder.map(groupName => (
                          <div key={groupName} className="mb-3">
                            <p className="text-[10px] text-stone-400 mb-1.5">{groupName}</p>
                            <div className="grid grid-cols-4 gap-2">
                              {groups[groupName].map(({ value, label, idx }) => {
                                const isSelected = materialSelections[materialKey] === value
                                const preview = getMaterialPreviewImage(product, value, materialImageMap)
                                const upgradePrice = idx > 0 ? getOptionPremium(value) : 0
                                
                                return (
                                  <button
                                    key={value}
                                    onClick={() => handleSelectMaterial(materialKey, value)}
                                    className="flex flex-col items-center gap-1 relative"
                                  >
                                    {upgradePrice > 0 && (
                                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] px-1 py-0.5 rounded-full z-10">
                                        +¥{upgradePrice}
                                      </span>
                                    )}
                                    <span className={`w-12 h-12 rounded-lg border-2 overflow-hidden ${
                                      isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-stone-200'
                                    }`}>
                                      <img src={preview} alt={label} className="w-full h-full object-cover" onError={e => (e.target as HTMLImageElement).src = '/placeholder.svg'} />
                                    </span>
                                    <span className={`text-[10px] text-center leading-tight ${isSelected ? 'text-primary font-medium' : 'text-stone-600'}`}>
                                      {label.length > 4 ? label.slice(0,4) + '..' : label}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* 价格汇总 */}
              {totalSurcharge > 0 && (
                <div className="flex items-center gap-2 text-sm bg-amber-50 text-amber-700 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  材质升级费用：<span className="font-bold">+¥{totalSurcharge.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="border-t border-stone-100 p-4 flex items-center justify-between flex-shrink-0 bg-stone-50">
          <div>
            <span className="text-sm text-stone-500">合计：</span>
            <span className="text-2xl font-serif font-bold text-accent ml-2">¥{(currentPrice + totalSurcharge).toLocaleString()}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-stone-300 text-stone-600 font-medium hover:bg-stone-100">取消</button>
            <button 
              onClick={() => onConfirm(categoryKey, product, materialSelections, selectedSku)}
              className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-green-900 flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> 确认添加
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
