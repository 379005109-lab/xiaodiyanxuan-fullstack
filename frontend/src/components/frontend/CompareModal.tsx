import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, ShoppingCart, AlertCircle, Scale, Maximize2, Minimize2 } from 'lucide-react'
import { Product, ProductSKU } from '@/types'
import { formatPrice } from '@/lib/utils'
import { getProductById as getMockProductById } from '@/services/productService.mock'
import { getProductById as getApiProductById } from '@/services/productService'
import { getAllMaterials } from '@/services/materialService'
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
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { compareItems: rawCompareItems, removeFromCompare, loadCompareItems, isModalOpen, closeModal } = useCompareStore()
  const { addItem } = useCartStore()

  useEffect(() => {
    if (isModalOpen) {
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
    }
  }, [isModalOpen])

  // 监听对比列表更新
  useEffect(() => {
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

  useEffect(() => {
    const loadCompareDetails = async () => {
      const validItems: CompareItemDetail[] = []
      const invalidItems: { productId: string; skuId?: string }[] = []

      await Promise.all(
        rawCompareItems.map(async (item) => {
          const product = (await getMockProductById(item.productId)) || (await getApiProductById(item.productId))
          if (!product || !product.skus?.length) {
            invalidItems.push({ productId: item.productId, skuId: item.skuId })
            return null
          }

          let sku: ProductSKU | undefined
          if (item.skuId) {
            sku = product.skus.find((s) => s._id === item.skuId)
          }
          if (!sku && product.skus.length > 0) {
            sku = product.skus[0]
          }

          if (!sku) {
            invalidItems.push({ productId: item.productId, skuId: item.skuId })
            return
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

      if (invalidItems.length > 0) {
        invalidItems.forEach((invalid) => {
          const originalItem = rawCompareItems.find(
            (item) => item.productId === invalid.productId && item.skuId === invalid.skuId
          )
          removeFromCompare(invalid.productId, invalid.skuId, originalItem?.selectedMaterials)
        })
      }

      setCompareItems(validItems)
    }

    if (rawCompareItems.length > 0) {
      loadCompareDetails()
    } else {
      setCompareItems([])
    }
  }, [rawCompareItems])

  const handleRemove = async (item: CompareItemDetail) => {
    console.log('🗑️ [CompareModal] handleRemove called for:', item.product.name, item.product._id)
    
    // 先更新本地状态
    setCompareItems(prev => prev.filter(i => 
      !(i.product._id === item.product._id && 
        i.sku._id === item.sku._id && 
        JSON.stringify(i.selectedMaterials) === JSON.stringify(item.selectedMaterials))
    ))
    
    try {
      console.log('📡 [CompareModal] Calling removeFromCompare...')
      await removeFromCompare(item.product._id, item.sku._id, item.selectedMaterials)
      console.log('✅ [CompareModal] removeFromCompare completed')
      // 重新加载确保同步
      await loadCompareItems()
      toast.success('已移除')
    } catch (error) {
      console.error('❌ [CompareModal] 删除对比项失败:', error)
      toast.error('删除失败，请重试')
      // 失败时重新加载恢复状态
      await loadCompareItems()
    }
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
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-4 px-4 text-left text-sm font-semibold bg-gray-50 w-28 sticky left-0 z-10">
                      对比项
                    </th>
                    {compareItems.map((item) => (
                      <th key={item.compareItemId} className="py-4 px-4 text-center relative min-w-[200px]">
                        <button
                          onClick={() => handleRemove(item)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-all hover:scale-110 z-20"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <Link to={`/products/${item.product._id}`} onClick={closeModal}>
                          <img
                            src={getFileUrl(item.sku.images?.[0] || item.product.images?.[0] || '/placeholder.png')}
                            alt={item.product.name}
                            className="w-full h-36 object-cover rounded-lg mb-2"
                          />
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
                    ))}
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

                  {/* 材质 - 面料 */}
                  {compareItems.some(item => {
                    const material = item.sku.material
                    return material && typeof material === 'object' && (material as any).fabric
                  }) && (
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-4 text-sm font-medium bg-gray-50 sticky left-0 z-10">面料</td>
                      {compareItems.map((item) => {
                        const material = item.sku.material
                        let fabricDisplay = '-'
                        let fabricImage: string | undefined
                        
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
                          fabricDisplay = '未选面料'
                        }
                        
                        return (
                          <td key={item.compareItemId} className="py-3 px-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              {fabricImage && (
                                <img
                                  src={getFileUrl(fabricImage)}
                                  alt={fabricDisplay}
                                  className="w-12 h-12 object-cover rounded border border-gray-200"
                                />
                              )}
                              <div className={`text-sm ${fabricDisplay === '未选面料' ? 'text-orange-500' : 'text-gray-700'}`}>
                                {fabricDisplay}
                              </div>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )}

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
    </div>
  )
}
