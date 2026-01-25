import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { X, ShoppingCart, AlertCircle, Plus, Minus, RotateCcw } from 'lucide-react'
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

export default function ComparePage() {
  const [compareItems, setCompareItems] = useState<CompareItemDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [materials, setMaterials] = useState<any[]>([])
  const [materialsLoaded, setMaterialsLoaded] = useState(false)
  const [materialImagesByName, setMaterialImagesByName] = useState<Record<string, string>>({})
  const [compareStats, setCompareStats] = useState<any>(null)
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null)
  const [previewZoom, setPreviewZoom] = useState(1)
  const previewViewportRef = useRef<HTMLDivElement | null>(null)
  const isPanningRef = useRef(false)
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })
  const { compareItems: rawCompareItems, removeFromCompare, loadCompareItems } = useCompareStore()
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
    loadCompareItems()
    updateCompareStats()
    
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
    
    // 监听对比列表更新事件
    const handleCompareListUpdate = () => {
      loadCompareItems()
      updateCompareStats()
    }
    
    window.addEventListener('compareListUpdated', handleCompareListUpdate)
    return () => {
      window.removeEventListener('compareListUpdated', handleCompareListUpdate)
    }
  }, [])

  const updateCompareStats = async () => {
    try {
      const stats = await cloudServices.compareService.getCompareStats()
      setCompareStats(stats)
    } catch (error) {
      console.error('获取对比统计失败:', error)
    }
  }

  // 用于防止无限循环的ref
  const processedItemsRef = useRef<string>('')
  
  useEffect(() => {
    const loadCompareDetails = async () => {
      // 生成当前项目列表的唯一标识，防止重复处理
      const currentItemsKey = rawCompareItems.map(i => i.productId).sort().join(',')
      if (currentItemsKey === processedItemsRef.current && compareItems.length > 0) {
        return // 已经处理过，跳过
      }
      
      const validItems: CompareItemDetail[] = []

      await Promise.all(
        rawCompareItems.map(async (item) => {
          const product = (await getMockProductById(item.productId)) || (await getApiProductById(item.productId))
          if (!product || !product.skus?.length) {
            return null // 跳过无效项，不触发删除
          }

          let sku: ProductSKU | undefined
          if (item.skuId) {
            sku = product.skus.find((s) => s._id === item.skuId)
          }
          if (!sku && product.skus.length > 0) {
            sku = product.skus[0]
          }

          if (!sku) {
            return null // 跳过无效项，不触发删除
          }

          const materialKey = item.selectedMaterials
            ? `${item.selectedMaterials.fabric || ''}|${item.selectedMaterials.filling || ''}|${item.selectedMaterials.frame || ''}|${item.selectedMaterials.leg || ''}`
            : ''

          validItems.push({
            product,
            sku,
            compareItemId: `${item.productId}-${item.skuId || ''}-${materialKey}`,
            selectedMaterials: item.selectedMaterials,
          })
        })
      )

      processedItemsRef.current = currentItemsKey
      setCompareItems(validItems)
      setIsLoading(false)
    }

    if (rawCompareItems.length > 0) {
      loadCompareDetails()
    } else {
      setCompareItems([])
      setIsLoading(false)
    }
  }, [rawCompareItems])

  const handleRemove = async (item: CompareItemDetail) => {
    // 立即从本地状态中移除（乐观更新）- 精确匹配 productId + skuId + materials
    const newItems = compareItems.filter(i => 
      !(i.product._id === item.product._id && 
        i.sku._id === item.sku._id && 
        JSON.stringify(i.selectedMaterials) === JSON.stringify(item.selectedMaterials))
    )
    setCompareItems(newItems)
    
    // 同时更新 processedItemsRef 防止 useEffect 重新加载
    processedItemsRef.current = newItems.map(i => i.product._id).sort().join(',')
    
    toast.success('已移除')
    
    // 然后异步删除服务器数据（不重新加载）
    try {
      await removeFromCompare(item.product._id, item.sku._id, item.selectedMaterials)
    } catch (error) {
      console.error('删除对比项失败:', error)
    }
  }

  const handleAddToCart = (item: CompareItemDetail) => {
    // 计算最终价格（包括材质升级价格）
    const basePrice = item.sku.discountPrice && item.sku.discountPrice > 0 && item.sku.discountPrice < item.sku.price
      ? item.sku.discountPrice
      : item.sku.price
    
    // 计算材质升级价格
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
    
    // 传递计算好的价格和材质选择
    addItem(item.product, item.sku, 1, item.selectedMaterials, finalPrice)
    toast.success('已添加到购物车')
  }

  if (compareItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container-custom">
          <div className="card p-12 text-center">
            <h2 className="text-2xl font-bold mb-4">对比列表为空</h2>
            <p className="text-gray-600 mb-8">还没有添加任何商品到对比列表</p>
            <Link to="/products" className="btn-primary inline-block">
              去选购
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* 头部信息 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">商品对比</h1>
            {compareStats && (
              <div className="flex items-center gap-4 text-sm">
                <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
                  <span className="text-gray-600">已对比:</span>
                  <span className="font-bold text-primary-600 ml-2">{compareItems.length}/{compareStats.maxItems}</span>
                </div>
                {compareStats.canAddMore ? (
                  <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200 text-green-700">
                    ✓ 还可添加 {compareStats.maxItems - compareItems.length} 个
                  </div>
                ) : (
                  <div className="bg-orange-50 px-4 py-2 rounded-lg border border-orange-200 text-orange-700 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    对比列表已满
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-gray-600">对比不同商品的规格、材质和价格，帮助您做出最佳选择</p>
        </div>

        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-4 px-4 text-left text-sm font-semibold bg-gray-50 w-32">
                  对比项
                </th>
                {compareItems.map((item) => {
                  const mainImageSrc = getFileUrl(
                    item.sku.images?.[0] || item.product.images?.[0] || '/placeholder.png'
                  )

                  return (
                  <th key={item.compareItemId} className="py-4 px-4 text-center relative min-w-[260px]">
                    <button
                      onClick={() => handleRemove(item)}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-all hover:scale-110 z-20"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <div className="w-full h-56 bg-gray-50 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
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
                    <Link to={`/products/${item.product._id}`}>
                      <h3 className="font-semibold text-sm hover:text-primary-600">
                        {item.product.name}
                      </h3>
                      {item.sku.isPro && (
                        <span className="inline-block mt-2 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs rounded">
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
                <td className="py-4 px-4 text-sm font-medium bg-gray-50">价格</td>
                {compareItems.map((item) => {
                  // 计算基础价格（优先显示折扣价）
                  const basePrice = item.sku.discountPrice && item.sku.discountPrice > 0 && item.sku.discountPrice < item.sku.price
                    ? item.sku.discountPrice
                    : item.sku.price
                  
                  // 计算材质升级价格
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
                    <td key={item.compareItemId} className="py-4 px-4 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {formatPrice(finalPrice)}
                      </div>
                      {item.sku.discountPrice && item.sku.discountPrice > 0 && item.sku.discountPrice < item.sku.price && (
                        <div className="text-sm text-gray-400 line-through mt-1">
                          {formatPrice(item.sku.price + upgradePrice)}
                        </div>
                      )}
                      {upgradePrice > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          (含材质升级 +{formatPrice(upgradePrice)})
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>

              {/* 型号 */}
              <tr className="border-b border-gray-200">
                <td className="py-4 px-4 text-sm font-medium bg-gray-50">型号</td>
                {compareItems.map((item) => (
                  <td key={item.compareItemId} className="py-4 px-4 text-center">
                    <div className="text-sm text-gray-700">{item.sku.code}</div>
                  </td>
                ))}
              </tr>

              {/* 规格 */}
              <tr className="border-b border-gray-200">
                <td className="py-4 px-4 text-sm font-medium bg-gray-50">规格</td>
                {compareItems.map((item) => (
                  <td key={item.compareItemId} className="py-4 px-4 text-center">
                    <div className="text-sm text-gray-700">{item.sku.spec || '-'}</div>
                  </td>
                ))}
              </tr>

              <tr className="border-b border-gray-200">
                <td className="py-4 px-4 text-sm font-medium bg-gray-50">面料/颜色</td>
                {compareItems.map((item) => {
                  const fabric = getFabricFallback(item)
                  const imgSrc = fabric.image ? getFileUrl(fabric.image) : undefined

                  return (
                    <td key={item.compareItemId} className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        {imgSrc && (
                          <img
                            src={imgSrc}
                            alt={fabric.label}
                            className="w-20 h-20 object-contain rounded border border-gray-200 bg-white cursor-zoom-in"
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

              {/* 材质 - 分别显示面料、填充、框架、脚架 */}
              {compareItems.some(item => {
                const material = item.sku.material
                return material && typeof material === 'object' && (
                  (material as any).fabric || (material as any).filling || (material as any).frame || (material as any).leg
                )
              }) && (
                <>
                  {/* 面料 */}
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-4 text-sm font-medium bg-gray-50">面料</td>
                    {compareItems.map((item) => {
                      const material = item.sku.material
                      let fabricDisplay = '-'
                      let fabricImage: string | undefined
                      
                      // 判断商品是否有面料选项
                      const hasFabricOption = material && typeof material === 'object' && (material as any).fabric
                      
                      if (item.selectedMaterials?.fabric) {
                        fabricDisplay = item.selectedMaterials.fabric
                        // 更灵活的材质匹配：精确匹配或包含匹配
                        const materialInfo = materials.find(m => 
                          m.name === item.selectedMaterials?.fabric ||
                          m.name?.includes(item.selectedMaterials?.fabric) ||
                          item.selectedMaterials?.fabric?.includes(m.name)
                        )
                        fabricImage = materialInfo?.image || materialInfo?.thumbnail
                        // 如果还是没有图片，尝试从 SKU 材质中获取
                        if (!fabricImage && (item.sku as any).materialImages) {
                          fabricImage = (item.sku as any).materialImages[item.selectedMaterials.fabric]
                        }
                      } else if (hasFabricOption) {
                        // 商品有面料选项但用户未选
                        fabricDisplay = '未选面料'
                      } else {
                        // 商品本身没有面料选项
                        fabricDisplay = '-'
                      }
                      
                      // 获取加价信息
                      const materialUpgradePrices = (item.sku as any).materialUpgradePrices || {}
                      let fabricUpgradePrice = materialUpgradePrices[fabricDisplay]
                      if (!fabricUpgradePrice && fabricDisplay !== '-') {
                        const fabricBase = fabricDisplay.split(/\s+/)[0]
                        fabricUpgradePrice = materialUpgradePrices[fabricBase]
                        if (!fabricUpgradePrice) {
                          for (const [key, price] of Object.entries(materialUpgradePrices)) {
                            if (fabricDisplay.includes(key) || key.includes(fabricDisplay)) {
                              fabricUpgradePrice = price as number
                              break
                            }
                          }
                        }
                      }
                      
                      return (
                        <td key={item.compareItemId} className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center gap-2">
                            {fabricImage && (
                              <img
                                src={getFileUrl(fabricImage)}
                                alt={fabricDisplay}
                                className="w-20 h-20 object-contain rounded border border-gray-200 bg-white cursor-zoom-in"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setPreviewZoom(1)
                                  setPreviewImage({ src: getFileUrl(fabricImage), alt: fabricDisplay })
                                }}
                              />
                            )}
                            <div className={`text-sm ${fabricDisplay === '未选面料' ? 'text-orange-500 font-medium' : 'text-gray-700'}`}>
                              {fabricDisplay}
                              {fabricUpgradePrice > 0 && (
                                <span className="block text-red-600 font-semibold text-xs mt-1">+¥{fabricUpgradePrice}</span>
                              )}
                            </div>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                  
                  {/* 填充 */}
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-4 text-sm font-medium bg-gray-50">填充</td>
                    {compareItems.map((item) => {
                      const material = item.sku.material
                      let fillingDisplay = '-'
                      let fillingImage: string | undefined
                      
                      // 判断商品是否有填充选项
                      const hasFillingOption = material && typeof material === 'object' && (material as any).filling
                      
                      if (item.selectedMaterials?.filling) {
                        fillingDisplay = item.selectedMaterials.filling
                        const materialInfo = materials.find(m => m.name === item.selectedMaterials?.filling)
                        fillingImage = materialInfo?.image
                      } else if (hasFillingOption) {
                        // 商品有填充选项但用户未选
                        fillingDisplay = '未选填充'
                      } else {
                        // 商品本身没有填充选项
                        fillingDisplay = '-'
                      }
                      
                      // 获取加价信息
                      const materialUpgradePrices = (item.sku as any).materialUpgradePrices || {}
                      let fillingUpgradePrice = materialUpgradePrices[fillingDisplay]
                      if (!fillingUpgradePrice && fillingDisplay !== '-') {
                        const fillingBase = fillingDisplay.split(/\s+/)[0]
                        fillingUpgradePrice = materialUpgradePrices[fillingBase]
                        if (!fillingUpgradePrice) {
                          for (const [key, price] of Object.entries(materialUpgradePrices)) {
                            if (fillingDisplay.includes(key) || key.includes(fillingDisplay)) {
                              fillingUpgradePrice = price as number
                              break
                            }
                          }
                        }
                      }
                      
                      return (
                        <td key={item.compareItemId} className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center gap-2">
                            {fillingImage && (
                              <img
                                src={getFileUrl(fillingImage)}
                                alt={fillingDisplay}
                                className="w-16 h-16 object-cover rounded border border-gray-200"
                              />
                            )}
                            <div className={`text-sm ${fillingDisplay === '未选填充' ? 'text-orange-500 font-medium' : 'text-gray-700'}`}>
                              {fillingDisplay}
                              {fillingUpgradePrice > 0 && (
                                <span className="block text-red-600 font-semibold text-xs mt-1">+¥{fillingUpgradePrice}</span>
                              )}
                            </div>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                  
                  {/* 框架 */}
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-4 text-sm font-medium bg-gray-50">框架</td>
                    {compareItems.map((item) => {
                      const material = item.sku.material
                      let frameDisplay = '-'
                      let frameImage: string | undefined
                      
                      // 判断商品是否有框架选项
                      const hasFrameOption = material && typeof material === 'object' && (material as any).frame
                      
                      if (item.selectedMaterials?.frame) {
                        frameDisplay = item.selectedMaterials.frame
                        const materialInfo = materials.find(m => m.name === item.selectedMaterials?.frame)
                        frameImage = materialInfo?.image
                      } else if (hasFrameOption) {
                        // 商品有框架选项但用户未选
                        frameDisplay = '未选框架'
                      } else {
                        // 商品本身没有框架选项
                        frameDisplay = '-'
                      }
                      
                      // 获取加价信息
                      const materialUpgradePrices = (item.sku as any).materialUpgradePrices || {}
                      let frameUpgradePrice = materialUpgradePrices[frameDisplay]
                      if (!frameUpgradePrice && frameDisplay !== '-') {
                        const frameBase = frameDisplay.split(/\s+/)[0]
                        frameUpgradePrice = materialUpgradePrices[frameBase]
                        if (!frameUpgradePrice) {
                          for (const [key, price] of Object.entries(materialUpgradePrices)) {
                            if (frameDisplay.includes(key) || key.includes(frameDisplay)) {
                              frameUpgradePrice = price as number
                              break
                            }
                          }
                        }
                      }
                      
                      return (
                        <td key={item.compareItemId} className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center gap-2">
                            {frameImage && (
                              <img
                                src={getFileUrl(frameImage)}
                                alt={frameDisplay}
                                className="w-16 h-16 object-cover rounded border border-gray-200"
                              />
                            )}
                            <div className={`text-sm ${frameDisplay === '未选框架' ? 'text-orange-500 font-medium' : 'text-gray-700'}`}>
                              {frameDisplay}
                              {frameUpgradePrice > 0 && (
                                <span className="block text-red-600 font-semibold text-xs mt-1">+¥{frameUpgradePrice}</span>
                              )}
                            </div>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                  
                  {/* 脚架 */}
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-4 text-sm font-medium bg-gray-50">脚架</td>
                    {compareItems.map((item) => {
                      const material = item.sku.material
                      let legDisplay = '-'
                      let legImage: string | undefined
                      
                      // 判断商品是否有脚架选项
                      const hasLegOption = material && typeof material === 'object' && (material as any).leg
                      
                      if (item.selectedMaterials?.leg) {
                        legDisplay = item.selectedMaterials.leg
                        const materialInfo = materials.find(m => m.name === item.selectedMaterials?.leg)
                        legImage = materialInfo?.image
                      } else if (hasLegOption) {
                        // 商品有脚架选项但用户未选
                        legDisplay = '未选脚架'
                      } else {
                        // 商品本身没有脚架选项
                        legDisplay = '-'
                      }
                      
                      // 获取加价信息
                      const materialUpgradePrices = (item.sku as any).materialUpgradePrices || {}
                      let legUpgradePrice = materialUpgradePrices[legDisplay]
                      if (!legUpgradePrice && legDisplay !== '-') {
                        const legBase = legDisplay.split(/\s+/)[0]
                        legUpgradePrice = materialUpgradePrices[legBase]
                        if (!legUpgradePrice) {
                          for (const [key, price] of Object.entries(materialUpgradePrices)) {
                            if (legDisplay.includes(key) || key.includes(legDisplay)) {
                              legUpgradePrice = price as number
                              break
                            }
                          }
                        }
                      }
                      
                      return (
                        <td key={item.compareItemId} className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center gap-2">
                            {legImage && (
                              <img
                                src={getFileUrl(legImage)}
                                alt={legDisplay}
                                className="w-16 h-16 object-cover rounded border border-gray-200"
                              />
                            )}
                            <div className={`text-sm ${legDisplay === '未选脚架' ? 'text-orange-500 font-medium' : 'text-gray-700'}`}>
                              {legDisplay}
                              {legUpgradePrice > 0 && (
                                <span className="block text-red-600 font-semibold text-xs mt-1">+¥{legUpgradePrice}</span>
                              )}
                            </div>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                </>
              )}
              
              {/* 尺寸 */}
              <tr className="border-b border-gray-200">
                <td className="py-4 px-4 text-sm font-medium bg-gray-50">尺寸</td>
                {compareItems.map((item) => (
                  <td key={item.compareItemId} className="py-4 px-4 text-center">
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

              {/* PRO特性 - 只要有PRO版商品就显示这一行 */}
              {compareItems.some(item => item.sku.isPro) && (
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-4 text-sm font-medium bg-gray-50">PRO特性</td>
                  {compareItems.map((item) => (
                    <td key={item.compareItemId} className="py-4 px-4">
                      {item.sku.isPro && item.sku.proFeature ? (
                        <div className="text-sm text-gray-700 text-left px-2">
                          {item.sku.proFeature}
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm text-center">-</div>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {/* 操作 */}
              <tr>
                <td className="py-4 px-4 text-sm font-medium bg-gray-50">操作</td>
                {compareItems.map((item) => (
                  <td key={item.compareItemId} className="py-4 px-4 text-center">
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

        <div className="mt-6 text-center">
          <Link to="/products" className="btn-secondary inline-block">
            继续选购
          </Link>
        </div>
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

