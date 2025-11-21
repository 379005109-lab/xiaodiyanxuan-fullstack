import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Save } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'

interface Package {
  id: number
  name: string
  price: number
  image: string
  tags: string[]
  selectedProducts: Record<string, any[]>
  optionalQuantities: Record<string, number>
  productCount: number
  categoryCount: number
  channelPrice?: number
  designerPrice?: number
}

export default function DesignerPackageEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [packageData, setPackageData] = useState<Package | null>(null)
  const [packagePrice, setPackagePrice] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPackage()
  }, [id])

  const loadPackage = () => {
    setLoading(true)
    try {
      if (id) {
        const existingPackages: Package[] = JSON.parse(localStorage.getItem('packages') || '[]')
        const pkg = existingPackages.find(p => p.id === parseInt(id, 10))
        if (pkg) {
          setPackageData(pkg)
          setPackagePrice(pkg.price)
        } else {
          toast.error('套餐不存在')
          navigate('/admin/packages')
        }
      }
    } catch (error) {
      console.error('加载套餐失败:', error)
      toast.error('加载套餐失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    if (!packageData) return
    
    setSaving(true)
    try {
      const existingPackages: Package[] = JSON.parse(localStorage.getItem('packages') || '[]')
      const index = existingPackages.findIndex(p => p.id === packageData.id)
      
      if (index !== -1) {
        existingPackages[index] = {
          ...existingPackages[index],
          price: packagePrice
        }
        localStorage.setItem('packages', JSON.stringify(existingPackages))
        toast.success('套餐已保存')
        navigate('/admin/packages')
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
          <p className="text-gray-600 mt-1">设计师套餐价格编辑</p>
        </div>
      </div>

      {/* 套餐信息 */}
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
            <p className="text-sm text-gray-600">套餐标签</p>
            <p className="font-medium">{packageData.tags.length} 个</p>
          </div>
        </div>
      </div>

      {/* 套餐主图 */}
      {packageData.image && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">套餐主图</h2>
          <img 
            src={packageData.image} 
            alt={packageData.name}
            className="w-full max-w-md h-auto rounded-lg object-cover"
          />
        </div>
      )}

      {/* 价格编辑 */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">套餐价格</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              套餐售价
            </label>
            <div className="relative max-w-xs">
              <span className="absolute left-3 top-3 text-gray-500">¥</span>
              <input
                type="number"
                value={packagePrice}
                onChange={(e) => setPackagePrice(parseFloat(e.target.value) || 0)}
                className="input pl-8 w-full"
                step="0.01"
                min="0"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 设置套餐对外展示的价格
            </p>
          </div>

          {/* 价格对比 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">价格变更</p>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-blue-700">原价</p>
                <p className="text-lg font-semibold text-blue-900">{formatPrice(packageData.price)}</p>
              </div>
              <div className="text-blue-500">→</div>
              <div>
                <p className="text-xs text-blue-700">新价</p>
                <p className="text-lg font-semibold text-blue-900">{formatPrice(packagePrice)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 利润信息 */}
      {packageData.designerPrice && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">利润信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
              <p className="text-sm text-gray-600 mb-2">套餐售价</p>
              <p className="text-2xl font-bold text-purple-600 mb-4">{formatPrice(packageData.price)}</p>
              
              <p className="text-sm text-gray-600 mb-2">您的采购价</p>
              <p className="text-2xl font-bold text-purple-900 mb-4">{formatPrice(packageData.designerPrice)}</p>
              
              <div className="border-t border-purple-200 pt-4">
                <p className="text-sm text-gray-600 mb-2">利润空间</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(packageData.price - packageData.designerPrice)}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  利润率: {(((packageData.price - packageData.designerPrice) / packageData.price) * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <p className="text-sm text-gray-600 mb-2">渠道采购价</p>
              <p className="text-2xl font-bold text-blue-600 mb-4">
                {packageData.channelPrice ? formatPrice(packageData.channelPrice) : '未设置'}
              </p>
              
              <p className="text-sm text-gray-600 mb-2">您的采购价</p>
              <p className="text-2xl font-bold text-blue-900 mb-4">{formatPrice(packageData.designerPrice)}</p>
              
              <div className="border-t border-blue-200 pt-4">
                <p className="text-sm text-gray-600 mb-2">价格差异</p>
                <p className={`text-2xl font-bold ${packageData.designerPrice < (packageData.channelPrice || 0) ? 'text-green-600' : 'text-red-600'}`}>
                  {packageData.channelPrice ? formatPrice(Math.abs(packageData.channelPrice - packageData.designerPrice)) : '-'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {packageData.channelPrice && packageData.designerPrice < packageData.channelPrice ? '✓ 您的价格更优惠' : packageData.channelPrice ? '⚠ 您的价格较高' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </motion.div>
  )
}
