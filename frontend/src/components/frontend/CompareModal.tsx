import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { X, ShoppingCart, AlertCircle, Scale, Maximize2, Minimize2, Plus, Minus, RotateCcw } from 'lucide-react'
import { Product, ProductSKU } from '@/types'
import { formatPrice } from '@/lib/utils'
import { getProductById as getMockProductById } from '@/services/productService.mock'
import { getProductById as getApiProductById } from '@/services/productService'
import { getAllMaterials, getMaterialImagesByNames } from '@/services/materialService'
import { useCompareStore } from '@/store/compareStore'
import { useCartStore } from '@/store/cartStore'
import { toast } from 'sonner'
import cloudServices from '@/services/cloudServices'
import { getFileUrl } from '@/services/uploadService'

interface CompareItemDetail {
  product: Product
  sku: ProductSKU
  compareItemId: string
  selectedMaterials?: { fabric?: string; filling?: string; frame?: string; leg?: string }
}

export default function CompareModal() {
  const [compareItems, setCompareItems] = useState<CompareItemDetail[]>([])
  const [compareStats, setCompareStats] = useState<any>(null)
  const [materials, setMaterials] = useState<any[]>([])
  const [materialsLoaded, setMaterialsLoaded] = useState(false)
  const [materialImagesByName, setMaterialImagesByName] = useState<Record<string, string>>({})
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null)
  const [previewZoom, setPreviewZoom] = useState(1)
  const previewViewportRef = useRef<HTMLDivElement | null>(null)
  const isPanningRef = useRef(false)
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })
  const { compareItems: rawCompareItems, removeFromCompare, loadCompareItems, isModalOpen, closeModal } = useCompareStore()
  const { addItem } = useCartStore()

  const closePreview = () => {
    setPreviewImage(null)
    setPreviewZoom(1)
    isPanningRef.current = false
  }

  const extractMaterialNames = (value: any): string[] => {
    if (!value) return []
    if (typeof value === 'string') {
      const v = value.trim()
      return v ? [v] : []
    }
    if (Array.isArray(value)) {
      return value
        .filter((v) => typeof v === 'string')
        .map((v) => (v as string).trim())
        .filter(Boolean)
    }
    if (typeof value === 'object') {
      const res: string[] = []
      for (const v of Object.values(value)) {
        if (!v) continue
        if (typeof v === 'string') {
          const s = v.trim()
          if (s) res.push(s)
        } else if (Array.isArray(v)) {
          for (const a of v) {
            if (typeof a === 'string') {
              const s = a.trim()
              if (s) res.push(s)
            }
          }
        }
      }
      return res
    }
    return []
  }

  const getFabricFallback = (item: CompareItemDetail): { label: string; image?: string } => {
    if (item.selectedMaterials?.fabric) {
      const selected = item.selectedMaterials.fabric
      const materialInfo = materials.find((m) =>
        m.name === selected || m.name?.includes(selected) || selected?.includes(m.name)
      )
      const img =
        materialInfo?.image ||
        materialInfo?.thumbnail ||
        materialImagesByName[selected] ||
        (item.sku as any).materialImages?.[selected]
      return { label: selected, image: img }
    }

    const material = item.sku.material
    if (typeof material === 'string' && material.trim()) {
      const name = material.trim()
      const materialInfo = materials.find((m) =>
        m.name === name || m.name?.includes(name) || name?.includes(m.name)
      )
      const img =
        materialInfo?.image ||
        materialInfo?.thumbnail ||
        materialImagesByName[name] ||
        (item.sku as any).materialImages?.[name]
      return { label: name, image: img }
    }

    const getFromSelection = (selection: any): string | undefined => {
      const candidates = [selection?.fabric, selection?.['面料'], selection?.['面料/颜色'], selection?.['面料颜色']]
      for (const c of candidates) {
        if (!c) continue
        if (Array.isArray(c)) return typeof c[0] === 'string' ? c[0] : undefined
        if (typeof c === 'string') return c
      }
      return undefined
    }

    const fabricFromMaterial = material && typeof material === 'object' ? getFromSelection(material) : undefined

    if (fabricFromMaterial && typeof fabricFromMaterial === 'string') {
      const materialInfo = materials.find((m) =>
        m.name === fabricFromMaterial || m.name?.includes(fabricFromMaterial) || fabricFromMaterial?.includes(m.name)
      )
      const img =
        materialInfo?.image ||
        materialInfo?.thumbnail ||
        materialImagesByName[fabricFromMaterial] ||
        (item.sku as any).materialImages?.[fabricFromMaterial]
      return { label: fabricFromMaterial, image: img }
    }

    if (item.sku.color) {
      const color = item.sku.color

      const materialInfo = materials.find((m) =>
        typeof m?.name === 'string' && (m.name.includes(color) || color.includes(m.name))
      )
      const materialImg = materialInfo?.image || materialInfo?.thumbnail

      let byNameImg: string | undefined = materialImagesByName[color]
      if (!byNameImg) {
        const key = Object.keys(materialImagesByName).find((k) => k.includes(color) || color.includes(k))
        if (key) byNameImg = materialImagesByName[key]
      }

      let skuMaterialImg: string | undefined
      const skuMaterialImages = (item.sku as any).materialImages as Record<string, string> | undefined
      if (skuMaterialImages) {
        const key = Object.keys(skuMaterialImages).find((k) => k.includes(color) || color.includes(k))
        if (key) skuMaterialImg = skuMaterialImages[key]
      }

      return {
        label: color,
        image: materialImg || byNameImg || skuMaterialImg,
      }
    }

    return { label: '未选择面料' }
  }

  useEffect(() => {
    if (isModalOpen) {
      loadCompareItems()
      
      // 加载材质数据
      const loadMaterials = async () => {
        try {
          const allMaterials = await getAllMaterials()
          setMaterials(Array.isArray(allMaterials) ? allMaterials : [])
          setMaterialsLoaded(true)
        } catch (error) {
          console.error('加载材质失败:', error)
          setMaterials([])
          setMaterialsLoaded(true)
        }
      }
      loadMaterials()
    }
  }, [isModalOpen])

  useEffect(() => {
    if (!isModalOpen || compareItems.length === 0) return
    const set = new Set<string>()
    for (const item of compareItems) {
      if (item.selectedMaterials?.fabric) set.add(item.selectedMaterials.fabric)
      if (item.selectedMaterials?.filling) set.add(item.selectedMaterials.filling)
      if (item.selectedMaterials?.frame) set.add(item.selectedMaterials.frame)
      if (item.selectedMaterials?.leg) set.add(item.selectedMaterials.leg)
      for (const n of extractMaterialNames(item.sku.material)) set.add(n)
    }
    const names = Array.from(set).filter(Boolean)
    if (names.length === 0) {
      setMaterialImagesByName({})
      return
    }
    getMaterialImagesByNames(names)
      .then((m) => {
        setMaterialImagesByName(m || {})
      })
      .catch(() => {
        setMaterialImagesByName({})
      })
  }, [isModalOpen, compareItems])

  // 当 rawCompareItems 变化时，加载商品详情
  useEffect(() => {
    const loadCompareDetails = async () => {
      if (rawCompareItems.length === 0) {
        setCompareItems([])
        return
      }
      
      const validItems: CompareItemDetail[] = []

      for (const item of rawCompareItems) {
        try {
          const product = (await getMockProductById(item.productId)) || (await getApiProductById(item.productId))
          if (!product || !product.skus?.length) continue

          let sku: ProductSKU | undefined = item.skuId 
            ? product.skus.find((s) => s._id === item.skuId)
            : product.skus[0]
          
          if (!sku) continue

          const materialKey = item.selectedMaterials
            ? `${item.selectedMaterials.fabric || ''}|${item.selectedMaterials.filling || ''}|${item.selectedMaterials.frame || ''}|${item.selectedMaterials.leg || ''}`
            : ''

          validItems.push({
            product,
            sku,
            compareItemId: `${item.productId}-${item.skuId || ''}-${materialKey}`,
            selectedMaterials: item.selectedMaterials,
          })
        } catch (error) {
          console.error('加载商品详情失败:', item.productId, error)
        }
      }

      setCompareItems(validItems)
    }

    loadCompareDetails()
  }, [rawCompareItems])

  const handleRemove = (item: CompareItemDetail) => {
    // 立即从本地状态移除
    setCompareItems(prev => prev.filter(i => i.compareItemId !== item.compareItemId))
    toast.success('已移除')
    // 调用store删除
    removeFromCompare(item.product._id, item.sku._id, item.selectedMaterials)
  }

  const handleAddToCart = (item: CompareItemDetail) => {
    const basePrice = item.sku.discountPrice && item.sku.discountPrice > 0 && item.sku.discountPrice < item.sku.price
      ? item.sku.discountPrice
      : item.sku.price
    
    const materialUpgradePrices = (item.sku as any).materialUpgradePrices || {}
    let upgradePrice = 0
    if (item.selectedMaterials) {
      const selectedMaterialList: string[] = []
      if (item.selectedMaterials.fabric) selectedMaterialList.push(item.selectedMaterials.fabric)
      if (item.selectedMaterials.filling) selectedMaterialList.push(item.selectedMaterials.filling)
      if (item.selectedMaterials.frame) selectedMaterialList.push(item.selectedMaterials.frame)
      if (item.selectedMaterials.leg) selectedMaterialList.push(item.selectedMaterials.leg)
      
      upgradePrice = selectedMaterialList.reduce((sum, matName) => {
        return sum + (materialUpgradePrices[matName] || 0)
      }, 0)
    }
    
    const finalPrice = basePrice + upgradePrice
    addItem(item.product, item.sku, 1, item.selectedMaterials, finalPrice)
    toast.success('已添加到购物车')
  }

  if (!isModalOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeModal}
      />
      
      {/* 弹窗内容 */}
      <div className={`relative bg-white rounded-xl shadow-2xl flex flex-col transition-all duration-300 ${
        isFullscreen 
          ? 'w-full h-full rounded-none' 
          : 'w-[95vw] max-w-6xl max-h-[90vh]'
      }`}>
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <Scale className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-800">商品对比</h2>
            {compareStats && (
              <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full">
                {compareItems.length}/{compareStats.maxItems}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {compareItems.length > 0 && (
              <button
                onClick={async () => {
                  if (confirm('确定要清空所有对比商品吗？')) {
                    setCompareItems([])
                    const { clearAll } = useCompareStore.getState()
                    await clearAll()
                    toast.success('已清空对比列表')
                  }
                }}
                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="清空全部"
              >
                清空全部
              </button>
            )}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={isFullscreen ? '退出全屏' : '全屏'}
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
            <button
              onClick={closeModal}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto p-6">
          {compareItems.length === 0 ? (
            <div className="relative">
              <div className="flex flex-col items-center justify-center py-16">
                <Scale className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">对比列表为空</h3>
                <p className="text-gray-500 mb-6">还没有添加任何商品到对比列表</p>
                <button
                  onClick={closeModal}
                  className="btn-primary"
                >
                  去选购
                </button>
              </div>

              <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/60 text-white text-xs rounded-lg">
                拖拽图片可移动查看细节
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-4 px-4 text-left text-sm font-semibold bg-gray-50 w-28 sticky left-0 z-10">
                      对比项
                    </th>
                    {compareItems.map((item) => {
                      const mainImageSrc = getFileUrl(
                        item.sku.images?.[0] || item.product.images?.[0] || '/placeholder.png'
                      )

                      return (
                      <th key={item.compareItemId} className="py-4 px-4 text-center relative min-w-[240px]">
                        <button
                          onClick={() => handleRemove(item)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-all hover:scale-110 z-20"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="w-full h-56 bg-gray-50 rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                          <img
                            src={mainImageSrc}
                            alt={item.product.name}
                            className="w-full h-full object-contain cursor-zoom-in"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setPreviewZoom(1)
                              setPreviewImage({ src: mainImageSrc, alt: item.product.name })
                            }}
                          />
                        </div>
                        <Link to={`/products/${item.product._id}`} onClick={closeModal}>
                          <h3 className="font-semibold text-sm hover:text-primary-600 line-clamp-2">
                            {item.product.name}
                          </h3>
                          {item.sku.isPro && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs rounded">
                              PRO版
                            </span>
                          )}
                        </Link>
                      </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {/* 价格 */}
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-4 text-sm font-medium bg-gray-50 sticky left-0 z-10">价格</td>
                    {compareItems.map((item) => {
                      const basePrice = item.sku.discountPrice && item.sku.discountPrice > 0 && item.sku.discountPrice < item.sku.price
                        ? item.sku.discountPrice
                        : item.sku.price
                      
                      const materialUpgradePrices = (item.sku as any).materialUpgradePrices || {}
                      let upgradePrice = 0
                      if (item.selectedMaterials) {
                        const selectedMaterialList: string[] = []
                        if (item.selectedMaterials.fabric) selectedMaterialList.push(item.selectedMaterials.fabric)
                        if (item.selectedMaterials.filling) selectedMaterialList.push(item.selectedMaterials.filling)
                        if (item.selectedMaterials.frame) selectedMaterialList.push(item.selectedMaterials.frame)
                        if (item.selectedMaterials.leg) selectedMaterialList.push(item.selectedMaterials.leg)
                        
                        upgradePrice = selectedMaterialList.reduce((sum, matName) => {
                          return sum + (materialUpgradePrices[matName] || 0)
                        }, 0)
                      }
                      
                      const finalPrice = basePrice + upgradePrice
                      
                      return (
                        <td key={item.compareItemId} className="py-3 px-4 text-center">
                          <div className="text-xl font-bold text-red-600">
                            {formatPrice(finalPrice)}
                          </div>
                          {item.sku.discountPrice && item.sku.discountPrice > 0 && item.sku.discountPrice < item.sku.price && (
                            <div className="text-sm text-gray-400 line-through">
                              {formatPrice(item.sku.price + upgradePrice)}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>

                  {/* 型号 */}
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-4 text-sm font-medium bg-gray-50 sticky left-0 z-10">型号</td>
                    {compareItems.map((item) => (
                      <td key={item.compareItemId} className="py-3 px-4 text-center">
                        <div className="text-sm text-gray-700">{item.sku.code}</div>
                      </td>
                    ))}
                  </tr>

                  {/* 规格 */}
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-4 text-sm font-medium bg-gray-50 sticky left-0 z-10">规格</td>
                    {compareItems.map((item) => (
                      <td key={item.compareItemId} className="py-3 px-4 text-center">
                        <div className="text-sm text-gray-700">{item.sku.spec || '-'}</div>
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-4 text-sm font-medium bg-gray-50 sticky left-0 z-10">面料/颜色</td>
                    {compareItems.map((item) => {
                      const fabric = getFabricFallback(item)
                      const imgSrc = fabric.image ? getFileUrl(fabric.image) : undefined

                      return (
                        <td key={item.compareItemId} className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {imgSrc && (
                              <img
                                src={imgSrc}
                                alt={fabric.label}
                                className="w-16 h-16 object-contain rounded border border-gray-200 bg-white cursor-zoom-in"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setPreviewZoom(1)
                                  setPreviewImage({ src: imgSrc, alt: fabric.label })
                                }}
                              />
                            )}
                            <div className="text-sm text-gray-700">{fabric.label}</div>
                          </div>
                        </td>
                      )
                    })}
                  </tr>

                  {/* 尺寸 */}
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-4 text-sm font-medium bg-gray-50 sticky left-0 z-10">尺寸</td>
                    {compareItems.map((item) => (
                      <td key={item.compareItemId} className="py-3 px-4 text-center">
                        {item.sku.length && item.sku.width && item.sku.height ? (
                          <div className="text-sm text-gray-700">
                            {item.sku.length}×{item.sku.width}×{item.sku.height} CM
                          </div>
                        ) : (
                          <div className="text-gray-400 text-sm">-</div>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* 操作 */}
                  <tr>
                    <td className="py-3 px-4 text-sm font-medium bg-gray-50 sticky left-0 z-10">操作</td>
                    {compareItems.map((item) => (
                      <td key={item.compareItemId} className="py-3 px-4 text-center">
                        <div className="space-y-2">
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="w-full btn-primary py-2 text-sm flex items-center justify-center gap-2"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            加入购物车
                          </button>
                          <Link
                            to={`/products/${item.product._id}`}
                            onClick={closeModal}
                            className="block w-full btn-secondary py-2 text-sm text-center"
                          >
                            查看详情
                          </Link>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 底部 */}
        {compareItems.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex-shrink-0">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                对比不同商品的规格、材质和价格，帮助您做出最佳选择
              </p>
              <button
                onClick={closeModal}
                className="btn-secondary"
              >
                继续选购
              </button>
            </div>
          </div>
        )}
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div
            className="relative max-w-[92vw] max-h-[92vh]"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <button
              type="button"
              className="absolute -top-3 -right-3 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
              onClick={closePreview}
            >
              <X className="h-5 w-5" />
            </button>
            <div className="absolute -top-3 right-10 flex items-center gap-2">
              <button
                type="button"
                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                onClick={() => setPreviewZoom((z) => Math.max(1, Number((z - 0.5).toFixed(2))))}
                title="缩小"
              >
                <Minus className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                onClick={() => setPreviewZoom((z) => Math.min(4, Number((z + 0.5).toFixed(2))))}
                title="放大"
              >
                <Plus className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                onClick={() => setPreviewZoom(1)}
                title="还原"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            </div>

            <div
              ref={previewViewportRef}
              className="max-w-[92vw] max-h-[92vh] overflow-auto rounded-lg bg-white cursor-grab active:cursor-grabbing"
              style={{ touchAction: 'none' }}
              onMouseDown={(e) => {
                const el = previewViewportRef.current
                if (!el) return
                isPanningRef.current = true
                panStartRef.current = {
                  x: e.clientX,
                  y: e.clientY,
                  scrollLeft: el.scrollLeft,
                  scrollTop: el.scrollTop,
                }
              }}
              onMouseMove={(e) => {
                const el = previewViewportRef.current
                if (!el || !isPanningRef.current) return
                const dx = e.clientX - panStartRef.current.x
                const dy = e.clientY - panStartRef.current.y
                el.scrollLeft = panStartRef.current.scrollLeft - dx
                el.scrollTop = panStartRef.current.scrollTop - dy
              }}
              onMouseUp={() => {
                isPanningRef.current = false
              }}
              onMouseLeave={() => {
                isPanningRef.current = false
              }}
              onTouchStart={(e) => {
                const el = previewViewportRef.current
                if (!el) return
                const t = e.touches[0]
                if (!t) return
                isPanningRef.current = true
                panStartRef.current = {
                  x: t.clientX,
                  y: t.clientY,
                  scrollLeft: el.scrollLeft,
                  scrollTop: el.scrollTop,
                }
              }}
              onTouchMove={(e) => {
                const el = previewViewportRef.current
                if (!el || !isPanningRef.current) return
                const t = e.touches[0]
                if (!t) return
                const dx = t.clientX - panStartRef.current.x
                const dy = t.clientY - panStartRef.current.y
                el.scrollLeft = panStartRef.current.scrollLeft - dx
                el.scrollTop = panStartRef.current.scrollTop - dy
              }}
              onTouchEnd={() => {
                isPanningRef.current = false
              }}
              onTouchCancel={() => {
                isPanningRef.current = false
              }}
            >
              <div
                className="inline-block"
                style={{ transform: `scale(${previewZoom})`, transformOrigin: '0 0' }}
              >
                <img
                  src={previewImage.src}
                  alt={previewImage.alt}
                  className="block max-w-none max-h-none"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
