import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Package, Save, Percent, Lock, Building2, Users } from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'

interface AuthorizationDetail {
  _id: string
  authorizationType: 'manufacturer' | 'designer'
  fromManufacturer?: { _id: string; name: string; logo?: string }
  toManufacturer?: { _id: string; name: string; logo?: string }
  toDesigner?: { _id: string; nickname?: string; username?: string; avatar?: string }
  scope: 'all' | 'category' | 'specific' | 'mixed'
  products?: string[]
  categories?: string[]
  priceSettings?: {
    minDiscountRate?: number
    commissionRate?: number
  }
  status: string
  createdAt: string
}

interface ProductItem {
  _id: string
  name: string
  productCode?: string
  images?: string[]
  basePrice?: number
  skus?: Array<{ price?: number }>
  manufacturerId?: string
  isOwnProduct?: boolean
  category?: { _id: string; name: string }
}

export default function AuthorizationPricingPage() {
  const navigate = useNavigate()
  const { authorizationId } = useParams()
  const { user } = useAuthStore()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [authorization, setAuthorization] = useState<AuthorizationDetail | null>(null)
  const [ownProducts, setOwnProducts] = useState<ProductItem[]>([])
  const [partnerProducts, setPartnerProducts] = useState<ProductItem[]>([])
  
  const [minDiscountRate, setMinDiscountRate] = useState(60)
  const [commissionRate, setCommissionRate] = useState(40)
  const [productTab, setProductTab] = useState<'own' | 'partner'>('own')
  
  // Check if user is the owner (grantor) of this authorization
  const isOwner = useMemo(() => {
    if (!authorization || !user) return false
    const myManufacturerId = (user as any)?.manufacturerId
    const isAdmin = ['admin', 'super_admin'].includes((user as any)?.role)
    if (isAdmin) return true
    if (!myManufacturerId) return false
    const fromId = authorization.fromManufacturer?._id || (authorization as any).fromManufacturer
    return String(fromId) === String(myManufacturerId)
  }, [authorization, user])
  
  const isReadOnly = !isOwner

  const displayProducts = productTab === 'own' ? ownProducts : partnerProducts

  // 计算分类汇总统计
  const categoryStats = useMemo(() => {
    const calcPrice = (product: ProductItem) => {
      const skuPrices = product.skus?.map(s => s.price || 0).filter(p => p > 0) || []
      return skuPrices.length > 0 ? Math.min(...skuPrices) : (product.basePrice || 0)
    }
    const calcStats = (items: ProductItem[]) => {
      const totalRetail = items.reduce((sum, p) => sum + calcPrice(p), 0)
      const totalMinPrice = totalRetail * (minDiscountRate / 100)
      const totalCommission = totalMinPrice * (commissionRate / 100)
      return { count: items.length, totalRetail, totalMinPrice, totalCommission }
    }
    return {
      own: calcStats(ownProducts),
      partner: calcStats(partnerProducts)
    }
  }, [ownProducts, partnerProducts, minDiscountRate, commissionRate])

  useEffect(() => {
    if (authorizationId) {
      loadData()
    }
  }, [authorizationId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load authorization detail
      const authRes = await apiClient.get(`/authorizations/${authorizationId}`)
      const authData = authRes.data?.data
      setAuthorization(authData)
      
      // Set initial values from authorization
      if (authData?.priceSettings) {
        setMinDiscountRate((authData.priceSettings.minDiscountRate || 0.6) * 100)
        setCommissionRate((authData.priceSettings.commissionRate || 0.4) * 100)
      }
      
      // Load authorized products
      if (authData) {
        const prodRes = await apiClient.get(`/authorizations/${authorizationId}/products`)
        console.log('[AuthPricing] products response:', prodRes.data)
        setOwnProducts(prodRes.data?.ownProducts || [])
        setPartnerProducts(prodRes.data?.partnerProducts || [])
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (minDiscountRate < 0 || minDiscountRate > 100) {
      toast.error('折扣率必须在 0-100% 之间')
      return
    }
    if (commissionRate < 0 || commissionRate > 100) {
      toast.error('返佣比例必须在 0-100% 之间')
      return
    }
    
    setSaving(true)
    try {
      await apiClient.put(`/authorizations/${authorizationId}/pricing`, {
        priceSettings: {
          minDiscountRate: minDiscountRate / 100,
          commissionRate: commissionRate / 100
        }
      })
      toast.success('价格设置已保存')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const getProductPrice = (product: ProductItem) => {
    const skuPrices = product.skus?.map(s => s.price || 0).filter(p => p > 0) || []
    return skuPrices.length > 0 ? Math.min(...skuPrices) : (product.basePrice || 0)
  }

  const getChannelName = () => {
    if (!authorization) return '未知渠道'
    if (authorization.authorizationType === 'manufacturer') {
      return authorization.toManufacturer?.name || '未知厂家'
    }
    return authorization.toDesigner?.nickname || authorization.toDesigner?.username || '未知设计师'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (!authorization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">授权不存在或已失效</p>
          <button 
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            返回
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">专属价格池设置</h1>
                <p className="text-sm text-gray-500">
                  渠道: {getChannelName()} · 
                  <span className={`ml-1 ${authorization.authorizationType === 'manufacturer' ? 'text-blue-600' : 'text-purple-600'}`}>
                    {authorization.authorizationType === 'manufacturer' ? '厂家' : '设计师'}
                  </span>
                </p>
              </div>
            </div>
            {isReadOnly ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg">
                <Lock className="w-4 h-4" />
                只读模式
              </div>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-[#153e35] text-white rounded-lg hover:bg-[#1a4d42] disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? '保存中...' : '保存设置'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Price Settings */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">价格策略设置</h2>
          <p className="text-sm text-gray-500 mb-6">设置该渠道的最低折扣率和返佣比例，这些设置将应用于所有授权商品</p>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-orange-50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Percent className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">最低折扣率</div>
                  <div className="text-xs text-gray-500">渠道可售卖的最低价格比例</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={minDiscountRate}
                  onChange={(e) => !isReadOnly && setMinDiscountRate(Number(e.target.value))}
                  min={0}
                  max={100}
                  disabled={isReadOnly}
                  className={`w-24 px-4 py-2 border border-gray-200 rounded-lg text-xl font-bold text-center focus:outline-none focus:border-orange-500 ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                <span className="text-xl font-bold text-orange-600">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                例: 设置60%表示商品最低可打6折出售
              </p>
            </div>
            
            <div className="bg-green-50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Percent className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">渠道返佣比例</div>
                  <div className="text-xs text-gray-500">渠道从销售额中获得的佣金</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={commissionRate}
                  onChange={(e) => !isReadOnly && setCommissionRate(Number(e.target.value))}
                  min={0}
                  max={100}
                  disabled={isReadOnly}
                  className={`w-24 px-4 py-2 border border-gray-200 rounded-lg text-xl font-bold text-center focus:outline-none focus:border-green-500 ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                <span className="text-xl font-bold text-green-600">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                例: 设置40%表示渠道获得销售额的40%作为佣金
              </p>
            </div>
          </div>
        </div>

        {/* Product List Preview */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">授权商品价格预览</h2>
                <p className="text-sm text-gray-500">共 {products.length} 个商品</p>
              </div>
              {/* 产品分类TAB */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProductTab('own')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    productTab === 'own'
                      ? 'bg-[#153e35] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  自有产品 ({ownProducts.length})
                </button>
                <button
                  onClick={() => setProductTab('partner')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    productTab === 'partner'
                      ? 'bg-[#153e35] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  合作商产品 ({partnerProducts.length})
                </button>
              </div>
            </div>
          </div>

          {/* 当前分类汇总统计 */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {productTab === 'own' ? '自有产品' : '合作商产品'}汇总
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-xs text-gray-500">商品数量</div>
                  <div className="text-lg font-bold text-gray-900">
                    {productTab === 'own' ? categoryStats.own.count : categoryStats.partner.count}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">最低折扣</div>
                  <div className="text-lg font-bold text-orange-600">{minDiscountRate}%</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">预计总返佣</div>
                  <div className="text-lg font-bold text-green-600">
                    ¥{(productTab === 'own' ? categoryStats.own.totalCommission : categoryStats.partner.totalCommission).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">商品总价</div>
                  <div className="text-lg font-bold text-gray-700">
                    ¥{(productTab === 'own' ? categoryStats.own.totalRetail : categoryStats.partner.totalRetail).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {displayProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>{productTab === 'own' ? '暂无自有产品' : '暂无合作商产品'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {displayProducts.map(product => {
                const retailPrice = getProductPrice(product)
                const minPrice = retailPrice * (minDiscountRate / 100)
                const commission = minPrice * (commissionRate / 100)
                
                return (
                  <div key={product._id} className="px-6 py-4 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {product.images?.[0] ? (
                        <img 
                          src={product.images[0].startsWith('http') ? product.images[0] : `/api/files/${product.images[0]}`}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.productCode || '-'}</div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-xs text-gray-500">零售价</div>
                        <div className="font-semibold text-gray-900">¥{retailPrice.toFixed(0)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-orange-500">最低售价</div>
                        <div className="font-semibold text-orange-600">¥{minPrice.toFixed(0)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-green-500">渠道佣金</div>
                        <div className="font-semibold text-green-600">¥{commission.toFixed(0)}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
