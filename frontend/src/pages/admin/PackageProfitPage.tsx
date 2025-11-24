import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Save, DollarSign } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import apiClient from '@/lib/apiClient'

interface Package {
  _id: string
  id?: number
  name: string
  price: number
  basePrice: number
  image: string
  thumbnail: string
  tags: string[]
  selectedProducts: Record<string, any[]>
  optionalQuantities: Record<string, number>
  productCount: number
  categoryCount: number
  channelPrice?: number
  designerPrice?: number
}

export default function PackageProfitPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [packageData, setPackageData] = useState<Package | null>(null)
  const [channelPrice, setChannelPrice] = useState(0)
  const [designerPrice, setDesignerPrice] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPackage()
  }, [id])

  const loadPackage = async () => {
    setLoading(true)
    try {
      if (id) {
        const response = await apiClient.get(`/packages/${id}`)
        if (response.data.success && response.data.data) {
          const pkg = response.data.data
          setPackageData(pkg)
          setChannelPrice(pkg.channelPrice || pkg.basePrice * 0.7)
          setDesignerPrice(pkg.designerPrice || pkg.basePrice * 0.6)
        } else {
          toast.error('套餐不存在')
          navigate('/admin/packages')
        }
      }
    } catch (error) {
      console.error('加载套餐失败:', error)
      toast.error('加载套餐失败')
      navigate('/admin/packages')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!packageData) return
    
    setSaving(true)
    try {
      const response = await apiClient.put(`/packages/${packageData._id}`, {
        channelPrice,
        designerPrice
      })
      
      if (response.data.success) {
        toast.success('利润设置已保存')
        navigate('/admin/packages')
      } else {
        toast.error('保存失败')
      }
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

  if (!packageData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">套餐不存在</p>
      </div>
    )
  }

  const channelProfit = packageData.price - channelPrice
  const designerProfit = packageData.price - designerPrice
  const channelProfitRate = ((channelProfit / packageData.price) * 100).toFixed(1)
  const designerProfitRate = ((designerProfit / packageData.price) * 100).toFixed(1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* 页头 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/packages')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">{packageData.name}</h1>
          <p className="text-gray-600 mt-1">利润管理</p>
        </div>
      </div>

      {/* 套餐基本信息 */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">套餐信息</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">套餐名称</p>
            <p className="font-medium">{packageData.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">包含商品</p>
            <p className="font-medium">{packageData.productCount} 件</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">商品类别</p>
            <p className="font-medium">{packageData.categoryCount} 类</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">套餐售价</p>
            <p className="font-medium text-red-600">{formatPrice(packageData.price)}</p>
          </div>
        </div>
      </div>

      {/* 利润设置 */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-green-600" />
          利润管理
        </h2>
        
        <div className="space-y-8">
          {/* 渠道价格 */}
          <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">渠道及设计师价格</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  渠道价格 (Channel Price)
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-3 text-gray-500">¥</span>
                  <input
                    type="number"
                    value={channelPrice}
                    onChange={(e) => setChannelPrice(parseFloat(e.target.value) || 0)}
                    className="input pl-8 w-full"
                    step="0.01"
                    min="0"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  💡 设置渠道合作伙伴的采购价格
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  设计师价格 (Designer Price)
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-3 text-gray-500">¥</span>
                  <input
                    type="number"
                    value={designerPrice}
                    onChange={(e) => setDesignerPrice(parseFloat(e.target.value) || 0)}
                    className="input pl-8 w-full"
                    step="0.01"
                    min="0"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  💡 设置设计师的采购价格
                </p>
              </div>
            </div>
          </div>

          {/* 利润对比 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 渠道利润 */}
            <div className="border border-green-200 rounded-lg p-6 bg-green-50">
              <h3 className="text-lg font-semibold text-green-900 mb-4">渠道利润</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">套餐售价</span>
                  <span className="font-semibold text-lg">{formatPrice(packageData.price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">渠道价格</span>
                  <span className="font-semibold text-lg">{formatPrice(channelPrice)}</span>
                </div>
                <div className="border-t border-green-200 pt-3 flex justify-between items-center">
                  <span className="text-sm font-semibold text-green-900">利润</span>
                  <div className="text-right">
                    <div className="font-bold text-xl text-green-600">{formatPrice(channelProfit)}</div>
                    <div className="text-xs text-green-600">({channelProfitRate}%)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 设计师利润 */}
            <div className="border border-purple-200 rounded-lg p-6 bg-purple-50">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">设计师利润</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">套餐售价</span>
                  <span className="font-semibold text-lg">{formatPrice(packageData.price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">设计师价格</span>
                  <span className="font-semibold text-lg">{formatPrice(designerPrice)}</span>
                </div>
                <div className="border-t border-purple-200 pt-3 flex justify-between items-center">
                  <span className="text-sm font-semibold text-purple-900">利润</span>
                  <div className="text-right">
                    <div className="font-bold text-xl text-purple-600">{formatPrice(designerProfit)}</div>
                    <div className="text-xs text-purple-600">({designerProfitRate}%)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 价格建议 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <strong>💡 建议：</strong> 渠道价格通常设置为售价的 60-70%，设计师价格设置为售价的 50-65%，以保证合理的利润空间。
            </p>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => navigate('/admin/packages')}
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
          {saving ? '保存中...' : '保存利润设置'}
        </button>
      </div>
    </motion.div>
  )
}
