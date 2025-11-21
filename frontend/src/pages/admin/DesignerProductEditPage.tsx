import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Save } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { Product } from '@/types'
import { toast } from 'sonner'
import { getProductById, updateProduct } from '@/services/productService.mock'
import { getAllCategories, Category } from '@/services/categoryService'
import { createCategoryLookup, getRoleDiscountMultiplier } from '@/utils/categoryHelper'
import { useAuthStore } from '@/store/authStore'

export default function DesignerProductEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryLookup, setCategoryLookup] = useState<Map<string, Category>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editedSkus, setEditedSkus] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    setLoading(true)
    try {
      if (id) {
        const productData = await getProductById(id)
        if (productData) {
          setProduct(productData)
          setEditedSkus(productData.skus || [])
        }
      }
      
      const allCategories = await getAllCategories()
      setCategories(allCategories)
      setCategoryLookup(createCategoryLookup(allCategories))
    } catch (error) {
      console.error('加载数据失败:', error)
      toast.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const getDiscountMultiplier = (categoryKey?: string) => {
    return getRoleDiscountMultiplier(categoryLookup, user?.role, categoryKey)
  }

  const calculateDiscountedPrice = (originalPrice: number) => {
    const multiplier = getDiscountMultiplier(product?.category)
    return Math.round(originalPrice * multiplier)
  }

  const handleSkuPriceChange = (skuIndex: number, field: 'price' | 'discountPrice', value: string) => {
    const newSkus = [...editedSkus]
    const numValue = parseFloat(value) || 0
    newSkus[skuIndex] = {
      ...newSkus[skuIndex],
      [field]: numValue
    }
    setEditedSkus(newSkus)
  }

  const handleSave = async () => {
    if (!product) return
    
    setSaving(true)
    try {
      await updateProduct(product._id, { skus: editedSkus })
      toast.success('商品已保存')
      navigate('/admin/products')
    } catch (error) {
      console.error('保存失败:', error)
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">商品不存在</p>
      </div>
    )
  }

  const multiplier = getDiscountMultiplier(product.category)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8"
    >
      {/* 主容器：左右留白 */}
      <div className="max-w-5xl mx-auto px-6 space-y-6">
        
        {/* 页头 */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/products')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-gray-600 mt-1">设计师价格编辑工作台</p>
          </div>
        </div>

        {/* 商品总览 - 紧凑布局 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* 左侧：商品小图 */}
            <div className="md:col-span-1">
              {product.images && product.images.length > 0 ? (
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  className="w-full h-40 rounded-lg object-cover shadow-md"
                />
              ) : (
                <div className="w-full h-40 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                  无图片
                </div>
              )}
            </div>

            {/* 中间：基本信息 */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
                <p className="text-sm text-gray-600 mt-1">设计师价格编辑工作台</p>
              </div>

              {/* 规格和材质 - 紧凑显示 */}
              <div className="grid grid-cols-2 gap-3">
                {/* 规格 */}
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-2">规格</p>
                  <div className="space-y-1">
                    {product.specifications && Object.entries(product.specifications).length > 0 ? (
                      Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="text-xs">
                          <p className="text-blue-600 font-medium">{key}</p>
                          <p className="text-blue-900 font-semibold">{value}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-blue-600">无规格</p>
                    )}
                  </div>
                </div>

                {/* 材质 */}
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                  <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-2">材质</p>
                  <div className="space-y-1">
                    {editedSkus.length > 0 && editedSkus[0].material && Object.keys(editedSkus[0].material).length > 0 ? (
                      Object.entries(editedSkus[0].material).map(([key, value]: [string, any]) => (
                        <div key={key} className="text-xs">
                          <p className="text-amber-600 font-medium">{key}</p>
                          <p className="text-amber-900 font-semibold">
                            {typeof value === 'string' ? value : (Array.isArray(value) ? value.join(', ') : '-')}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-amber-600">无材质</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：快速信息 */}
            <div className="md:col-span-1 space-y-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">分类</p>
                <p className="text-base font-bold text-gray-900 mt-1">{product.category}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">SKU数量</p>
                <p className="text-base font-bold text-gray-900 mt-1">{editedSkus.length} 个</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-900 mb-1">💡 提示</p>
                <p className="text-xs text-blue-700">编辑SKU对外展示价</p>
              </div>
            </div>
          </div>
        </div>

        {/* SKU列表 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：SKU列表 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-900">SKU详情与价格编辑</h2>
              <div className="space-y-6">
                {editedSkus.map((sku, index) => {
                  const originalPrice = sku.price || 0
                  const discountPrice = sku.discountPrice || 0
                  const basePrice = discountPrice > 0 && discountPrice < originalPrice ? discountPrice : originalPrice
                  const designerPrice = calculateDiscountedPrice(basePrice)

                  return (
                    <div key={sku._id || index} className="border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-primary-300 transition-all bg-white">
                      {/* SKU头部 */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-gray-900">{sku.spec || sku.code || `SKU ${index + 1}`}</h3>
                          {sku.code && <p className="text-xs text-gray-500 mt-1">型号: {sku.code}</p>}
                        </div>
                        {sku.isPro && (
                          <span className="inline-block px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full ml-2">
                            PRO
                          </span>
                        )}
                      </div>

                      {/* SKU详情 */}
                      <div className="mb-6">
                        {/* SKU图片 */}
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">SKU图片</p>
                          {sku.images && sku.images.length > 0 ? (
                            <div className="w-full bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '4/3' }}>
                              <img 
                                src={sku.images[0]} 
                                alt={sku.spec || `SKU ${index + 1}`}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-full bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm" style={{ aspectRatio: '4/3' }}>
                              无图片
                            </div>
                          )}
                        </div>

                        {/* 规格和材质网格 */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* 规格信息 */}
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                            <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-3">规格</p>
                            <div className="space-y-2">
                              {(sku.length || sku.width || sku.height) && (
                                <div>
                                  <p className="text-xs text-blue-600 font-medium">尺寸</p>
                                  <p className="text-sm text-blue-900 font-semibold mt-1">
                                    {sku.length}×{sku.width}×{sku.height}
                                  </p>
                                </div>
                              )}
                              {!sku.length && !sku.width && !sku.height && (
                                <p className="text-sm text-blue-600">无尺寸信息</p>
                              )}
                            </div>
                          </div>

                          {/* 材质信息 */}
                          <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                            <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-3">材质</p>
                            <div className="space-y-1">
                              {sku.material && typeof sku.material === 'object' && Object.keys(sku.material).length > 0 ? (
                                Object.entries(sku.material).map(([key, value]: [string, any]) => (
                                  <div key={key}>
                                    <p className="text-xs text-amber-600 font-medium">{key}</p>
                                    <p className="text-xs text-amber-900 font-semibold mt-0.5">
                                      {typeof value === 'string' ? value : (Array.isArray(value) ? value.join(', ') : '-')}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-amber-600">无材质信息</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 材质图片展示 */}
                      {sku.material && typeof sku.material === 'object' && Object.keys(sku.material).length > 0 && (
                        <div className="mb-6 pb-6 border-b border-gray-200">
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">材质图片</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.entries(sku.material).map(([key, value]: [string, any]) => (
                              <div key={key} className="text-center">
                                <div className="w-full bg-gray-100 rounded-lg overflow-hidden mb-2 flex items-center justify-center" style={{ aspectRatio: '1/1' }}>
                                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                    <div className="text-center">
                                      <div className="text-2xl mb-1">🎨</div>
                                      <p className="text-xs text-gray-600 font-medium">{key}</p>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-700 font-medium truncate">
                                  {typeof value === 'string' ? value : (Array.isArray(value) ? value[0] : '-')}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 价格信息 */}
                      <div className="mb-6 pb-6 border-b border-gray-200">
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-xs text-gray-500">当前价格</span>
                          <span className="text-2xl font-bold text-red-600">{formatPrice(sku.discountPrice || designerPrice)}</span>
                          <span className="text-xs text-gray-400">¥</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>供货价: {formatPrice(designerPrice)}</span>
                          {sku.proFeature && (
                            <span className="text-purple-600 font-medium">PRO: {sku.proFeature}</span>
                          )}
                        </div>
                      </div>

                      {/* 价格编辑 */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          编辑对外展示价
                        </label>
                        <div className="relative mb-3">
                          <span className="absolute left-4 top-3.5 text-gray-500 font-bold text-lg">¥</span>
                          <input
                            type="number"
                            value={sku.discountPrice || designerPrice}
                            onChange={(e) => handleSkuPriceChange(index, 'discountPrice', e.target.value)}
                            className="input pl-10 w-full text-xl font-bold text-red-600 border-2 border-gray-300 focus:border-primary-500"
                            step="0.01"
                            min={designerPrice}
                            placeholder={`最低 ${formatPrice(designerPrice)}`}
                          />
                        </div>
                        <p className="text-xs text-gray-600 mb-3">
                          最低价格: <span className="font-semibold text-primary-600">{formatPrice(designerPrice)}</span>
                        </p>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 flex items-start gap-2">
                          <span>ℹ️</span>
                          <p>对外展示价不能低于供货价，修改后需点击保存</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 右侧：快速编辑面板 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24 space-y-6">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">快速编辑</p>
                <p className="text-sm text-gray-600">
                  选择下方SKU卡片进行编辑，设置对外展示价格
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-amber-900 mb-2">⚠️ 重要提示</p>
                <ul className="text-xs text-amber-700 space-y-1">
                  <li>• 供货价由系统自动计算</li>
                  <li>• 对外价不能低于供货价</li>
                  <li>• 修改后需点击保存</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={() => navigate('/admin/products')}
            className="btn-secondary"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="h-5 w-5" />
            {saving ? '保存中...' : '保存'}
          </button>
        </div>

      </div>
    </motion.div>
  )
}
