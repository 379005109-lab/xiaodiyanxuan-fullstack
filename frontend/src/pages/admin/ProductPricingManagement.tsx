import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Edit2,
  DollarSign,
  Users,
  Settings,
  Info
} from 'lucide-react'

interface TierPricing {
  tierLevel: number
  tierName: string
  discountRate: number
  commissionRate: number
  minQuantity: number
  isActive: boolean
}

interface ProductPricingConfig {
  enabled: boolean
  tiers: TierPricing[]
}

interface ProductPricingData {
  _id: string
  name: string
  basePrice: number
  ownerId: string
  ownerName: string
  pricingMode: 'owner_managed' | 'superior_managed'
  tierPricingConfig: ProductPricingConfig
}

const ProductPricingManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [product, setProduct] = useState<ProductPricingData | null>(null)
  const [pricingMode, setPricingMode] = useState<'owner_managed' | 'superior_managed'>('owner_managed')
  const [tierConfig, setTierConfig] = useState<ProductPricingConfig>({
    enabled: false,
    tiers: []
  })

  // 获取产品定价配置
  const fetchProductPricing = async () => {
    try {
      const response = await fetch(`/api/products/${id}/pricing`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('获取产品定价配置失败')
      }

      const data = await response.json()
      if (data.success) {
        setProduct(data.data)
        setPricingMode(data.data.pricingMode || 'owner_managed')
        setTierConfig(data.data.tierPricingConfig || { enabled: false, tiers: [] })
      }
    } catch (error) {
      console.error('获取产品定价配置失败:', error)
      toast.error('获取产品定价配置失败')
    } finally {
      setLoading(false)
    }
  }

  // 保存定价配置
  const handleSave = async () => {
    if (!product) return

    setSaving(true)
    try {
      const response = await fetch(`/api/products/${id}/pricing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          pricingMode,
          tierPricingConfig: tierConfig
        })
      })

      if (!response.ok) {
        throw new Error('保存定价配置失败')
      }

      const data = await response.json()
      if (data.success) {
        toast.success('定价配置保存成功')
        setProduct(data.data)
      }
    } catch (error) {
      console.error('保存定价配置失败:', error)
      toast.error('保存定价配置失败')
    } finally {
      setSaving(false)
    }
  }

  // 添加新的定价层级
  const addTier = () => {
    const newTier: TierPricing = {
      tierLevel: tierConfig.tiers.length + 1,
      tierName: `层级 ${tierConfig.tiers.length + 1}`,
      discountRate: 0.9, // 默认9折
      commissionRate: 0.1, // 默认10%分佣
      minQuantity: 1,
      isActive: true
    }

    setTierConfig(prev => ({
      ...prev,
      tiers: [...prev.tiers, newTier]
    }))
  }

  // 删除定价层级
  const removeTier = (index: number) => {
    setTierConfig(prev => ({
      ...prev,
      tiers: prev.tiers.filter((_, i) => i !== index)
    }))
  }

  // 更新定价层级
  const updateTier = (index: number, field: keyof TierPricing, value: any) => {
    setTierConfig(prev => ({
      ...prev,
      tiers: prev.tiers.map((tier, i) => 
        i === index ? { ...tier, [field]: value } : tier
      )
    }))
  }

  useEffect(() => {
    if (id) {
      fetchProductPricing()
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">产品不存在或无权限访问</p>
          <button 
            onClick={() => navigate('/admin/products')}
            className="btn btn-primary"
          >
            返回产品列表
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/products')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">产品定价管理</h1>
                <p className="text-gray-500 mt-1">
                  {product.name} - 拥有者: {product.ownerName}
                </p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? '保存中...' : '保存配置'}
            </button>
          </div>
        </div>

        {/* 基础信息 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">基础定价信息</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">产品名称</p>
              <p className="font-medium text-gray-900">{product.name}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">基础价格</p>
              <p className="font-medium text-gray-900">¥{product.basePrice}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">产品拥有者</p>
              <p className="font-medium text-gray-900">{product.ownerName}</p>
            </div>
          </div>
        </div>

        {/* 定价模式选择 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">定价模式</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="pricingMode"
                value="owner_managed"
                checked={pricingMode === 'owner_managed'}
                onChange={(e) => setPricingMode(e.target.value as 'owner_managed')}
                className="mr-3"
              />
              <div>
                <p className="font-medium text-gray-900">拥有者管理定价</p>
                <p className="text-sm text-gray-500">产品拥有者可以设置每个层级的折扣及分佣架构</p>
              </div>
            </label>
            
            <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="pricingMode"
                value="superior_managed"
                checked={pricingMode === 'superior_managed'}
                onChange={(e) => setPricingMode(e.target.value as 'superior_managed')}
                className="mr-3"
              />
              <div>
                <p className="font-medium text-gray-900">上级管理定价</p>
                <p className="text-sm text-gray-500">由上级来做折扣及分佣设置</p>
              </div>
            </label>
          </div>
        </div>

        {/* 分层定价配置 */}
        {pricingMode === 'owner_managed' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">分层定价配置</h2>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={tierConfig.enabled}
                    onChange={(e) => setTierConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">启用分层定价</span>
                </label>
                {tierConfig.enabled && (
                  <button
                    onClick={addTier}
                    className="btn btn-primary btn-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    添加层级
                  </button>
                )}
              </div>
            </div>

            {tierConfig.enabled && (
              <div className="space-y-4">
                {tierConfig.tiers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">暂无定价层级</p>
                    <button
                      onClick={addTier}
                      className="btn btn-primary"
                    >
                      添加第一个层级
                    </button>
                  </div>
                ) : (
                  tierConfig.tiers.map((tier, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-gray-900">层级 {index + 1}</h3>
                        <button
                          onClick={() => removeTier(index)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            层级名称
                          </label>
                          <input
                            type="text"
                            value={tier.tierName}
                            onChange={(e) => updateTier(index, 'tierName', e.target.value)}
                            className="input"
                            placeholder="输入层级名称"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            折扣率 (0-1)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.01"
                            value={tier.discountRate}
                            onChange={(e) => updateTier(index, 'discountRate', parseFloat(e.target.value))}
                            className="input"
                            placeholder="0.9"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            实际价格: ¥{(product.basePrice * tier.discountRate).toFixed(2)}
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            分佣率 (0-1)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.01"
                            value={tier.commissionRate}
                            onChange={(e) => updateTier(index, 'commissionRate', parseFloat(e.target.value))}
                            className="input"
                            placeholder="0.1"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            分佣金额: ¥{(product.basePrice * tier.discountRate * tier.commissionRate).toFixed(2)}
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            最小起订量
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={tier.minQuantity}
                            onChange={(e) => updateTier(index, 'minQuantity', parseInt(e.target.value))}
                            className="input"
                            placeholder="1"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={tier.isActive}
                            onChange={(e) => updateTier(index, 'isActive', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700">启用此层级</span>
                        </label>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {!tierConfig.enabled && (
              <div className="text-center py-8">
                <Info className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">分层定价功能已禁用</p>
                <p className="text-sm text-gray-400">启用后可以为不同层级设置不同的折扣和分佣</p>
              </div>
            )}
          </div>
        )}

        {pricingMode === 'superior_managed' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-center py-8">
              <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">上级管理模式</p>
              <p className="text-sm text-gray-400">定价配置将由上级用户管理</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductPricingManagement
