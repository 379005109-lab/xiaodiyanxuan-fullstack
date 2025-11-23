import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { getAllMaterials } from '@/services/materialService'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import api from '@/lib/axios'

export default function ProductSharePage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 从URL参数获取选择信息
  const version = searchParams.get('version') || 'standard'
  const spec = searchParams.get('spec') || ''
  const fabric = searchParams.get('fabric') || ''
  const filling = searchParams.get('filling') || ''
  const frame = searchParams.get('frame') || ''
  const leg = searchParams.get('leg') || ''
  const [materials, setMaterials] = useState<any[]>([])

  useEffect(() => {
    const loadMaterials = async () => {
      try {
        const allMaterials = await getAllMaterials()
        setMaterials(Array.isArray(allMaterials) ? allMaterials : [])
      } catch (err: any) {
        console.error('加载材料失败:', err)
        setMaterials([])
      }
    }

    loadMaterials()
  }, [])

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const response = await api.get(`/products/${id}`)
        const data = response?.data
        if (data) {
          setProduct(data as Product)
        } else {
          setError('商品不存在')
        }
      } catch (err: any) {
        console.error('加载商品失败:', err)
        setError(err.response?.data?.message || '加载商品失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">加载中...</div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || '商品不存在'}</p>
          <Link to="/" className="text-blue-600 hover:underline">
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  // 获取当前SKU的图片
  const getCurrentImages = () => {
    const images: string[] = []
    
    // 主图
    if (product.images && product.images.length > 0) {
      images.push(...product.images)
    }
    
    // 其他类型的图片
    const productData = product as any
    if (productData.whiteBackgroundImages) images.push(...productData.whiteBackgroundImages)
    if (productData.effectImages) images.push(...productData.effectImages)
    if (productData.componentImages) images.push(...productData.componentImages)
    if (productData.detailImages) images.push(...productData.detailImages)
    if (productData.otherImages) images.push(...productData.otherImages)
    
    // 查找匹配的SKU
    const matchingSku = product.skus.find(sku => {
      const matchesVersion = sku.isPro === (version === 'pro')
      const matchesSpec = (sku.spec || sku.code) === spec
      
      if (!matchesVersion || !matchesSpec) return false
      
      const material = sku.material
      if (typeof material === 'string') {
        return !fabric || material === fabric
      } else if (material && typeof material === 'object') {
        const materialObj = material as { fabric: string; filling: string; frame: string; leg: string }
        const matchesFabric = !fabric || materialObj.fabric === fabric
        const matchesFilling = !filling || materialObj.filling === filling
        const matchesFrame = !frame || materialObj.frame === frame
        const matchesLeg = !leg || materialObj.leg === leg
        return matchesFabric && matchesFilling && matchesFrame && matchesLeg
      }
      return true
    })
    
    // SKU图片
    if (matchingSku && matchingSku.images && matchingSku.images.length > 0) {
      images.push(...matchingSku.images)
    }
    
    // 去重
    return [...new Set(images)]
  }

  const currentImages = getCurrentImages()

  // 获取材质名称
  const getMaterialName = (materialValue: string) => {
    const material = materials.find(m => m.name === materialValue)
    return material?.name || materialValue
  }

  // 获取当前SKU信息
  const getCurrentSku = () => {
    return product.skus.find(sku => {
      const matchesVersion = sku.isPro === (version === 'pro')
      const matchesSpec = (sku.spec || sku.code) === spec
      
      if (!matchesVersion || !matchesSpec) return false
      
      const material = sku.material
      if (typeof material === 'string') {
        return !fabric || material === fabric
      } else if (material && typeof material === 'object') {
        const materialObj = material as { fabric: string; filling: string; frame: string; leg: string }
        const matchesFabric = !fabric || materialObj.fabric === fabric
        const matchesFilling = !filling || materialObj.filling === filling
        const matchesFrame = !frame || materialObj.frame === frame
        const matchesLeg = !leg || materialObj.leg === leg
        return matchesFabric && matchesFilling && matchesFrame && matchesLeg
      }
      return true
    }) || product.skus[0]
  }

  const currentSku = getCurrentSku()
  const currentPrice = currentSku?.discountPrice && currentSku.discountPrice > 0 && currentSku.discountPrice < currentSku.price
    ? currentSku.discountPrice
    : currentSku?.price || product.basePrice

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 头部 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 text-sm mb-4">
            <Link to="/" className="text-gray-600 hover:text-blue-600">首页</Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <Link to="/products" className="text-gray-600 hover:text-blue-600">商城</Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900 font-medium">{product.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          {product.description && (
            <p className="text-gray-600 mt-2">{product.description}</p>
          )}
        </div>

        {/* 商品图片 */}
        {currentImages.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">商品图片</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {currentImages.map((image, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={image}
                    alt={`${product.name} - 图片 ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // 图片加载失败时隐藏
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 商品信息 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">商品信息</h2>
          <div className="space-y-4">
            {/* 版本 */}
            <div>
              <span className="text-gray-600">版本：</span>
              <span className="font-medium">{version === 'pro' ? 'PRO版' : '标准版'}</span>
            </div>

            {/* 规格 */}
            {(spec || currentSku) && (
              <div>
                <span className="text-gray-600">规格：</span>
                <span className="font-medium">{spec || currentSku?.spec || currentSku?.code || '默认规格'}</span>
                {currentSku && (
                  <>
                    {currentSku.length && currentSku.width && currentSku.height && (
                      <span className="text-gray-500 ml-2">
                        ({currentSku.length} × {currentSku.width} × {currentSku.height} cm)
                      </span>
                    )}
                  </>
                )}
              </div>
            )}

            {/* 材质 */}
            {(fabric || filling || frame || leg) && (
              <div>
                <span className="text-gray-600">材质：</span>
                <div className="mt-2 space-y-2">
                  {fabric && (
                    <div>
                      <span className="text-gray-500">面料：</span>
                      <span className="font-medium">{getMaterialName(fabric)}</span>
                    </div>
                  )}
                  {filling && (
                    <div>
                      <span className="text-gray-500">填充：</span>
                      <span className="font-medium">{getMaterialName(filling)}</span>
                    </div>
                  )}
                  {frame && (
                    <div>
                      <span className="text-gray-500">框架：</span>
                      <span className="font-medium">{getMaterialName(frame)}</span>
                    </div>
                  )}
                  {leg && (
                    <div>
                      <span className="text-gray-500">脚架：</span>
                      <span className="font-medium">{getMaterialName(leg)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 价格 */}
            <div>
              <span className="text-gray-600">价格：</span>
              <span className="text-2xl font-bold text-red-600 ml-2">
                {formatPrice(currentPrice)}
              </span>
              {currentSku?.discountPrice && currentSku.discountPrice > 0 && currentSku.discountPrice < currentSku.price && (
                <span className="text-gray-400 line-through ml-2">
                  {formatPrice(currentSku.price)}
                </span>
              )}
            </div>

            {/* PRO特性 */}
            {currentSku?.isPro && currentSku.proFeature && (
              <div>
                <span className="text-gray-600">PRO特性：</span>
                <span className="font-medium">{currentSku.proFeature}</span>
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <Link
            to={`/products/${id}`}
            className="w-full btn-primary py-3 text-center block"
          >
            查看完整详情
          </Link>
        </div>
      </div>
    </div>
  )
}

