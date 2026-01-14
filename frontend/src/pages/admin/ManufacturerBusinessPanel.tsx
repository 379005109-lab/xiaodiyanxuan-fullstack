import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import apiClient from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { 
  ChevronDown, 
  ChevronRight,
  DollarSign, 
  TrendingUp, 
  Users, 
  Package,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Eye
} from 'lucide-react'

type TabType = 'channels' | 'products' | 'received_auth' | 'granted_auth'
type ProductFilter = 'all' | 'own' | 'authorized' | 'pending'

interface ChannelItem {
  _id: string
  type: 'manufacturer' | 'designer'
  name: string
  avatar?: string
  validUntil?: string
  skuCount: number
  gmv: number
  status: string
  minDiscount?: number  // 最低折扣（百分比）
  commissionRate?: number  // 返佣比例（百分比）
}

interface ProductItem {
  _id: string
  name: string
  productCode?: string
  category?: any
  categoryName?: string
  thumbnail?: string
  images?: string[]
  mainImage?: string
  basePrice?: number
  status?: string
  authStatus?: 'own' | 'authorized' | 'pending'
  skus?: Array<{
    code?: string
    spec?: string
    price?: number
    discountPrice?: number
  }>
}

interface CategoryGroup {
  id: string
  name: string
  products: ProductItem[]
}

interface DashboardStats {
  totalGmv: number
  monthlyGrowth: number
  channelCount: number
  productCount: number
}

export default function ManufacturerBusinessPanel() {
  const navigate = useNavigate()
  const params = useParams()
  const { user, token } = useAuthStore()

  const manufacturerId = params.manufacturerId || (user as any)?.manufacturerId || (user as any)?.manufacturerIds?.[0]

  const [activeTab, setActiveTab] = useState<TabType>('channels')
  const [productFilter, setProductFilter] = useState<ProductFilter>('all')
  const [loading, setLoading] = useState(true)
  const [manufacturer, setManufacturer] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalGmv: 0,
    monthlyGrowth: 0,
    channelCount: 0,
    productCount: 0
  })
  const [channels, setChannels] = useState<ChannelItem[]>([])
  const [products, setProducts] = useState<ProductItem[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [searchKeyword, setSearchKeyword] = useState('')
  const [pendingCount, setPendingCount] = useState(0)
  const [tierSystemConfig, setTierSystemConfig] = useState<any>(null)
  const [channelFilter, setChannelFilter] = useState<'all' | 'manufacturer' | 'designer'>('all')
  const [receivedAuths, setReceivedAuths] = useState<any[]>([])
  const [grantedAuths, setGrantedAuths] = useState<any[]>([])

  useEffect(() => {
    if (!manufacturerId) {
      toast.error('无法获取厂家信息')
      navigate('/admin/manufacturers')
      return
    }
    loadData()
  }, [manufacturerId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [mRes, pRes, cRes, authRes, tRes, receivedRes] = await Promise.all([
        apiClient.get(`/manufacturers/${manufacturerId}`),
        apiClient.get(`/manufacturers/${manufacturerId}/products`, { params: { status: 'active', limit: 10000 } }),
        apiClient.get(`/categories`),
        apiClient.get(`/authorizations/my-grants`).catch(() => ({ data: { data: [] } })),
        apiClient.get(`/commission-systems/manufacturer/${manufacturerId}`).catch(() => ({ data: { data: null } })),
        apiClient.get(`/authorizations/received`).catch(() => ({ data: { data: [] } }))
      ])

      setManufacturer(mRes.data?.data || null)
      const categoryList = cRes.data?.data || []
      setCategories(categoryList)
      setTierSystemConfig(tRes.data?.data || null)
      setReceivedAuths(receivedRes.data?.data || [])
      setGrantedAuths(authRes.data?.data || [])
      
      // Create category lookup map
      const categoryMap = new Map<string, any>()
      const flattenCategories = (cats: any[], parentName = '') => {
        cats.forEach(cat => {
          const fullName = parentName ? `${parentName} > ${cat.name}` : cat.name
          categoryMap.set(String(cat._id), { ...cat, fullName })
          if (cat.children?.length) {
            flattenCategories(cat.children, cat.name)
          }
        })
      }
      flattenCategories(categoryList)
      
      // Process own products with category names
      const ownProducts = (pRes.data?.data || []).map((p: any) => {
        const catId = p.category?._id || p.category
        const catInfo = catId ? categoryMap.get(String(catId)) : null
        return {
          ...p,
          categoryName: catInfo?.name || p.category?.name || '未分类',
          authStatus: 'own'
        }
      })
      
      // Fetch authorized products (from other manufacturers)
      let authorizedProducts: any[] = []
      try {
        const authProdRes = await apiClient.get('/authorizations/products/authorized', { params: { pageSize: 10000 } })
        authorizedProducts = (authProdRes.data?.data || []).map((p: any) => {
          const catId = p.category?._id || p.category
          const catInfo = catId ? categoryMap.get(String(catId)) : null
          return {
            ...p,
            categoryName: catInfo?.name || p.category?.name || '未分类',
            authStatus: 'authorized'
          }
        })
      } catch {
        // Ignore if API fails
      }
      
      // Merge own and authorized products
      const existingIds = new Set(ownProducts.map((p: any) => p._id))
      const uniqueAuthorized = authorizedProducts.filter(p => !existingIds.has(p._id))
      const productList = [...ownProducts, ...uniqueAuthorized]
      setProducts(productList)

      // Process authorizations to get channels
      const authorizations = authRes.data?.data || []
      
      // Fetch real GMV data for each authorization
      let gmvData: Record<string, number> = {}
      try {
        const gmvRes = await apiClient.get(`/authorizations/gmv-stats`, { params: { manufacturerId } })
        gmvData = gmvRes.data?.data || {}
      } catch {
        // Use 0 if GMV API fails
      }
      
      const channelList: ChannelItem[] = authorizations.map((auth: any) => {
        const targetId = auth.authorizationType === 'manufacturer' 
          ? (auth.toManufacturer?._id || auth.toManufacturer)
          : (auth.toDesigner?._id || auth.toDesigner)
        
        // 获取折扣和返佣信息 - 直接从授权记录根级别读取，默认值为0
        const minDiscount = typeof auth.minDiscountRate === 'number' ? auth.minDiscountRate : 0
        const commissionRate = typeof auth.commissionRate === 'number' ? auth.commissionRate : 0
        
        // SKU数量：scope='all'时使用actualProductCount，否则使用products数组长度
        const skuCount = auth.actualProductCount || (Array.isArray(auth.products) ? auth.products.length : 0)
        
        return {
          _id: auth._id,
          type: auth.authorizationType,
          name: auth.authorizationType === 'manufacturer' 
            ? (auth.toManufacturer?.name || auth.toManufacturer?.fullName || '未知商家')
            : (auth.toDesigner?.nickname || auth.toDesigner?.username || '未知设计师'),
          avatar: auth.authorizationType === 'manufacturer'
            ? auth.toManufacturer?.logo
            : auth.toDesigner?.avatar,
          validUntil: auth.validUntil,
          skuCount,
          gmv: gmvData[String(targetId)] || 0,
          status: auth.status,
          minDiscount,
          commissionRate
        }
      })
      setChannels(channelList.filter(c => c.status === 'active'))

      // Calculate stats
      const activeChannels = channelList.filter(c => c.status === 'active')
      setStats({
        totalGmv: activeChannels.reduce((sum, c) => sum + c.gmv, 0),
        monthlyGrowth: 12.5, // TODO: Calculate real growth
        channelCount: activeChannels.length,
        productCount: productList.length
      })

      // Get pending authorization requests
      try {
        const pendingRes = await apiClient.get(`/authorizations/manufacturer-requests/pending`)
        setPendingCount(pendingRes.data?.data?.length || 0)
      } catch {
        setPendingCount(0)
      }

    } catch (e: any) {
      toast.error(e?.response?.data?.message || '加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  // Group products by category
  const categoryGroups = useMemo(() => {
    const categoryMap = new Map<string, CategoryGroup>()
    
    const filteredProducts = products.filter(p => {
      // Filter by search keyword
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase()
        if (!(p.name?.toLowerCase().includes(kw) || p.productCode?.toLowerCase().includes(kw))) {
          return false
        }
      }
      
      // Filter by product filter
      if (productFilter === 'own') {
        return p.authStatus === 'own' || !p.authStatus
      }
      if (productFilter === 'authorized') {
        return p.authStatus === 'authorized'
      }
      if (productFilter === 'pending') {
        return p.authStatus === 'pending'
      }
      return true
    })

    filteredProducts.forEach(product => {
      const catId = product.category?._id || product.category || 'uncategorized'
      const catName = product.categoryName || product.category?.name || '未分类'
      
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          id: catId,
          name: catName,
          products: []
        })
      }
      categoryMap.get(catId)!.products.push(product)
    })

    return Array.from(categoryMap.values()).filter(g => g.products.length > 0)
  }, [products, searchKeyword, productFilter])

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  // Calculate product pricing
  const getProductPricing = (product: ProductItem) => {
    const basePrice = product.basePrice || 0
    const skuPrices = product.skus?.map(s => s.price || 0).filter(p => p > 0) || []
    const retailPrice = skuPrices.length > 0 ? Math.min(...skuPrices) : basePrice
    const maxPrice = skuPrices.length > 0 ? Math.max(...skuPrices) : basePrice

    let minDiscountRate = 0.6
    let commissionRate = 0.4

    if (tierSystemConfig) {
      const modules = tierSystemConfig.roleModules || []
      const defaultModule = modules[0]
      if (defaultModule?.discountRules?.[0]) {
        minDiscountRate = defaultModule.discountRules[0].discountRate || 0.6
        commissionRate = defaultModule.discountRules[0].commissionRate || 0.4
      }
    }

    const minDiscountPrice = retailPrice * minDiscountRate
    const designerCommission = minDiscountPrice * commissionRate

    return {
      retailPrice,
      maxPrice,
      minDiscountPrice,
      designerCommission,
      discountRate: minDiscountRate,
      commissionRate
    }
  }

  const getAuthStatusBadge = (status?: string) => {
    switch (status) {
      case 'authorized':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">已授权</span>
      case 'pending':
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">厂家审批中</span>
      default:
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">自有</span>
    }
  }

  const getProductStatusBadge = (product: ProductItem) => {
    if (product.status === 'active') {
      return <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle className="w-3 h-3" /> 正在销售</span>
    }
    return <span className="flex items-center gap-1 text-gray-500 text-xs"><Clock className="w-3 h-3" /> 待上架</span>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center overflow-hidden">
                {manufacturer?.logo ? (
                  <img src={manufacturer.logo.startsWith('http') ? manufacturer.logo : `/api/files/${manufacturer.logo}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  FACTORY PANEL
                </h1>
                <p className="text-xs text-gray-500">{manufacturer?.name || '厂家'} · 核心经营监测概览</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin/manufacturers')}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                返回厂家中心
              </button>
              <button
                onClick={() => navigate('/admin/product-management')}
                className="px-4 py-2 text-sm bg-[#153e35] text-white rounded-lg hover:bg-[#1a4d42]"
              >
                商品全库管理
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mb-4">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-xs text-gray-500 mb-1">累计授权GMV</div>
            <div className="text-2xl font-bold text-green-600">¥{stats.totalGmv.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-xs text-gray-500 mb-1">本月增长率</div>
            <div className="text-2xl font-bold text-orange-600">+{stats.monthlyGrowth}%</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-xs text-gray-500 mb-1">渠道分销商</div>
            <div className="text-2xl font-bold text-gray-900">{stats.channelCount}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-xs text-gray-500 mb-1">授权产品总数</div>
            <div className="text-2xl font-bold text-gray-900">{stats.productCount}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-100">
            <div className="flex items-center gap-8 px-6">
              <button
                onClick={() => setActiveTab('channels')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'channels'
                    ? 'border-[#153e35] text-[#153e35]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  渠道管控
                </span>
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'products'
                    ? 'border-[#153e35] text-[#153e35]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  统一商品库
                </span>
              </button>
              <button
                onClick={() => setActiveTab('received_auth')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'received_auth'
                    ? 'border-[#153e35] text-[#153e35]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  被授权模式
                </span>
              </button>
              <button
                onClick={() => setActiveTab('granted_auth')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'granted_auth'
                    ? 'border-[#153e35] text-[#153e35]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  授权模式
                </span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'channels' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">渠道管控</h3>
                    <p className="text-sm text-gray-500">管理厂家、设计师及设计师公司等渠道授权</p>
                  </div>
                  <button
                    onClick={() => navigate(`/admin/authorization-requests`)}
                    className="px-4 py-2 bg-[#153e35] text-white text-sm rounded-lg hover:bg-[#1a4d42]"
                  >
                    下发准入邀请码
                  </button>
                </div>

                {/* Channel Filters */}
                <div className="flex items-center gap-2 mb-6">
                  {[
                    { key: 'all', label: '全部' },
                    { key: 'manufacturer', label: '厂家' },
                    { key: 'designer', label: '设计师/设计师公司' }
                  ].map(filter => (
                    <button
                      key={filter.key}
                      onClick={() => setChannelFilter(filter.key as typeof channelFilter)}
                      className={`px-4 py-2 text-sm rounded-full transition-colors ${
                        channelFilter === filter.key
                          ? 'bg-[#153e35] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {channels.filter(c => channelFilter === 'all' || c.type === channelFilter).length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>暂无授权渠道商</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {channels.filter(c => channelFilter === 'all' || c.type === channelFilter).map(channel => (
                      <div key={channel._id} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden">
                                {channel.avatar ? (
                                  <img src={channel.avatar.startsWith('http') ? channel.avatar : `/api/files/${channel.avatar}`} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    {channel.type === 'manufacturer' ? <Package className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                                  </div>
                                )}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{channel.name}</span>
                                <span className={`px-2 py-0.5 text-xs rounded ${
                                  channel.type === 'manufacturer' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-purple-100 text-purple-700'
                                }`}>
                                  {channel.type === 'manufacturer' ? '厂家' : '设计师'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                合约期至: {channel.validUntil ? new Date(channel.validUntil).toLocaleDateString() : '永久有效'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <div className="text-xs text-gray-500">最低折扣</div>
                              <div className="text-lg font-bold text-green-600">{channel.minDiscount ?? '--'}%</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500">返佣比例</div>
                              <div className="text-lg font-bold text-blue-600">{channel.commissionRate ?? '--'}%</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500">已授权SKU</div>
                              <div className="text-lg font-bold text-gray-900">{channel.skuCount}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500">累计贡献GMV</div>
                              <div className="text-lg font-bold text-orange-600">¥{channel.gmv.toLocaleString()}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => navigate(`/admin/authorizations/${channel._id}/pricing`)}
                                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                              >
                                进入专属价格池
                              </button>
                              <button 
                                onClick={() => {
                                  if (window.confirm('确定要撤销此授权吗？')) {
                                    apiClient.delete(`/authorizations/${channel._id}`)
                                      .then(() => {
                                        toast.success('已撤销授权')
                                        loadData()
                                      })
                                      .catch(() => toast.error('撤销失败'))
                                  }
                                }}
                                className="p-2 text-gray-400 hover:text-red-600"
                                title="撤销授权"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'products' && (
              <div>
                {/* Product Library Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden">
                      {manufacturer?.logo ? (
                        <img src={manufacturer.logo.startsWith('http') ? manufacturer.logo : `/api/files/${manufacturer.logo}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-gray-400 m-auto mt-3" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{manufacturer?.name || '厂家'}统一商品库</h3>
                      <p className="text-sm text-gray-500">自有产品与跨厂授权商品深度整合</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {pendingCount > 0 && (
                      <button
                        onClick={() => navigate('/admin/authorization-requests')}
                        className="px-4 py-2 text-sm border-2 border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50"
                      >
                        授权审批 ({pendingCount})
                      </button>
                    )}
                    <button
                      onClick={() => navigate('/admin/manufacturers')}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      退出管理
                    </button>
                  </div>
                </div>

                {/* Product Filters */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    {[
                      { key: 'all', label: '全部商品' },
                      { key: 'own', label: '自有品牌' },
                      { key: 'authorized', label: '已获授权' },
                      { key: 'pending', label: '审批中' }
                    ].map(filter => (
                      <button
                        key={filter.key}
                        onClick={() => setProductFilter(filter.key as ProductFilter)}
                        className={`px-4 py-2 text-sm rounded-full transition-colors ${
                          productFilter === filter.key
                            ? 'bg-[#153e35] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索商品名/编码..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:border-[#153e35]"
                    />
                  </div>
                </div>

                {/* Product List by Category */}
                {categoryGroups.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>暂无商品</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {categoryGroups.map(group => (
                      <div key={group.id} className="border border-gray-100 rounded-xl overflow-hidden">
                        {/* Category Header */}
                        <button
                          onClick={() => toggleCategoryExpand(group.id)}
                          className="w-full px-5 py-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#153e35] text-white flex items-center justify-center">
                              {expandedCategories.has(group.id) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </div>
                            <span className="font-semibold text-[#153e35]">{group.name}</span>
                            <span className="text-sm text-gray-500">({group.products.length})</span>
                          </div>
                        </button>

                        {/* Products */}
                        {expandedCategories.has(group.id) && (
                          <div className="divide-y divide-gray-50">
                            {group.products.map(product => {
                              const pricing = getProductPricing(product)
                              return (
                                <div key={product._id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center gap-4">
                                    {/* Product Image */}
                                    <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                      {(product.images?.[0] || product.thumbnail || product.mainImage) ? (
                                        <img 
                                          src={(() => {
                                            const img = product.images?.[0] || product.thumbnail || product.mainImage
                                            if (!img) return '/placeholder.svg'
                                            if (img.startsWith('http')) return img
                                            return `/api/files/${img}`
                                          })()}
                                          alt={product.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                          <Package className="w-6 h-6" />
                                        </div>
                                      )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-gray-900 truncate">{product.name}</span>
                                        {getAuthStatusBadge(product.authStatus)}
                                      </div>
                                      <div className="flex items-center gap-6 text-sm">
                                        <div>
                                          <span className="text-gray-500">产品编码</span>
                                          <div className="text-gray-900">{product.productCode || '-'}</div>
                                        </div>
                                        <div>
                                          <span className="text-orange-500">结算底价</span>
                                          <div className="text-orange-600 font-semibold">
                                            ¥{pricing.minDiscountPrice.toFixed(0)} ({(pricing.discountRate * 100).toFixed(0)}%)
                                          </div>
                                        </div>
                                        <div>
                                          <span className="text-green-500">渠道佣金</span>
                                          <div className="text-green-600 font-semibold">
                                            ¥{pricing.designerCommission.toFixed(0)} ({(pricing.commissionRate * 100).toFixed(0)}%)
                                          </div>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">跨域建议价</span>
                                          <div className="text-gray-900">
                                            {pricing.retailPrice === pricing.maxPrice 
                                              ? `¥${pricing.retailPrice}`
                                              : `¥${pricing.retailPrice} - ¥${pricing.maxPrice}`
                                            }
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Status */}
                                    <div className="flex-shrink-0">
                                      {getProductStatusBadge(product)}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'received_auth' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900">被授权模式</h3>
                  <p className="text-sm text-gray-500">显示其他厂家授权给我的产品</p>
                </div>

                {receivedAuths.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>暂无收到的授权</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {receivedAuths.map(auth => {
                      const fromName = auth.fromManufacturer?.name || auth.fromManufacturer?.fullName || '未知厂家'
                      const productCount = auth.scope === 'all' 
                        ? '全部商品' 
                        : auth.scope === 'category'
                        ? `${auth.categories?.length || 0}个分类`
                        : `${auth.products?.length || 0}个商品`

                      return (
                        <div key={auth._id} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-gray-900">{fromName}</h4>
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                  {auth.authorizationType === 'manufacturer' ? '厂家授权' : '设计师授权'}
                                </span>
                                <span className={`px-2 py-1 text-xs rounded ${
                                  auth.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {auth.status === 'active' ? '有效' : '已失效'}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>授权范围: {productCount}</span>
                                {auth.minDiscountRate > 0 && (
                                  <span>最低折扣: {auth.minDiscountRate}%</span>
                                )}
                                {auth.commissionRate > 0 && (
                                  <span>返佣: {auth.commissionRate}%</span>
                                )}
                                <span>有效期: {auth.validUntil ? new Date(auth.validUntil).toLocaleDateString() : '永久有效'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'granted_auth' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900">授权模式</h3>
                  <p className="text-sm text-gray-500">显示我授权给对方的信息和分成体系</p>
                </div>

                {grantedAuths.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>暂无授权记录</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {grantedAuths.map(auth => {
                      const toName = auth.authorizationType === 'manufacturer'
                        ? (auth.toManufacturer?.name || auth.toManufacturer?.fullName || '未知厂家')
                        : (auth.toDesigner?.nickname || auth.toDesigner?.username || '未知设计师')
                      const productCount = auth.scope === 'all' 
                        ? '全部商品' 
                        : auth.scope === 'category'
                        ? `${auth.categories?.length || 0}个分类`
                        : `${auth.products?.length || 0}个商品`

                      return (
                        <div key={auth._id} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-gray-900">{toName}</h4>
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                                  {auth.authorizationType === 'manufacturer' ? '厂家' : '设计师'}
                                </span>
                                <span className={`px-2 py-1 text-xs rounded ${
                                  auth.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {auth.status === 'active' ? '有效' : '已失效'}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>授权范围: {productCount}</span>
                                {auth.minDiscountRate > 0 && (
                                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                                    最低折扣: {auth.minDiscountRate}%
                                  </span>
                                )}
                                {auth.commissionRate > 0 && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                    返佣: {auth.commissionRate}%
                                  </span>
                                )}
                              </div>
                              {auth.tierCompanyName && (
                                <div className="mt-2 text-sm text-gray-500">
                                  所属公司: {auth.tierCompanyName} (层级 {auth.tierLevel || 0})
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
