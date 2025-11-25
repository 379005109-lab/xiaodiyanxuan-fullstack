import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Minus, Check, Loader2, X, Maximize2 } from 'lucide-react'
import { PackagePlan } from '@/types'
import { getAllPackages } from '@/services/packageService'
import { getFileUrl } from '@/services/uploadService'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

type PackageCategory = PackagePlan['categories'][number]
type PackageProduct = PackageCategory['products'][number]

export default function PackageDetailPageNew() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pkg, setPkg] = useState<PackagePlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState<Record<string, string[]>>({})
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [previewProduct, setPreviewProduct] = useState<PackageProduct | null>(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [orderForm, setOrderForm] = useState({ name: '', phone: '', address: '' })
  const [submitting, setSubmitting] = useState(false)
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const { isAuthenticated, token } = useAuthStore()

  useEffect(() => {
    loadPackage()
  }, [id])

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

  const toggleProduct = (categoryKey: string, product: PackageProduct, maxRequired: number) => {
    setSelectedProducts(prev => {
      const current = prev[categoryKey] || []
      if (current.includes(product.id)) {
        return { ...prev, [categoryKey]: current.filter(id => id !== product.id) }
      }
      if (current.length >= maxRequired) {
        toast.error(`最多选择 ${maxRequired} 件`)
        return prev
      }
      return { ...prev, [categoryKey]: [...current, product.id] }
    })
    if (!quantities[product.id]) {
      setQuantities(prev => ({ ...prev, [product.id]: 1 }))
    }
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

  const totalPrice = pkg ? pkg.price : 0
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
          {/* Hero */}
          <div className="relative w-full h-56 md:h-72 overflow-hidden">
            <img 
              src={pkg.gallery?.[0] || (pkg.banner ? getFileUrl(pkg.banner) : '/placeholder.svg')}
              alt={pkg.name}
              className="w-full h-full object-cover"
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
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-stone-300">0{idx + 1}</span>
                        <h3 className="text-xl font-serif font-bold text-primary">{category.name}</h3>
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
                              onClick={() => !isDisabled && toggleProduct(category.key, product, category.required)}
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

        {/* 右侧清单 */}
        <div className="hidden lg:flex lg:flex-col w-96 bg-white border-l border-stone-100 shadow-2xl">
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
                return (
                  <div key={productId} className="flex gap-3 items-start">
                    <div className="w-12 h-12 rounded-lg bg-stone-50 overflow-hidden border border-stone-100">
                      <img src={product.image ? getFileUrl(product.image) : '/placeholder.svg'} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-stone-700 line-clamp-1">{product.name}</span>
                        <span className="text-xs font-serif font-bold text-stone-900">¥{((product.price || 0) * qty).toLocaleString()}</span>
                      </div>
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
              <div className="flex justify-between"><span>商品总额</span><span>¥{totalPrice.toLocaleString()}</span></div>
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
    </div>
  )
}
