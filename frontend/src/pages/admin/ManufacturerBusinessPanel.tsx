import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import apiClient from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import PartnerCard from '@/components/PartnerCard'
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
  Eye,
  Settings
} from 'lucide-react'

type TabType = 'home' | 'partners' | 'channels'
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
  const [searchParams] = useSearchParams()
  const { user, token } = useAuthStore()

  const manufacturerId = params.manufacturerId || (user as any)?.manufacturerId || (user as any)?.manufacturerIds?.[0]

  const urlTab = searchParams.get('tab') as TabType | null
  const [activeTab, setActiveTab] = useState<TabType>(urlTab || 'home')
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
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set())  // 折叠状态
  const [channelTiers, setChannelTiers] = useState<Record<string, any[]>>({})  // 每个渠道的层级数据
  const [receivedAuths, setReceivedAuths] = useState<any[]>([])
  const [grantedAuths, setGrantedAuths] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [showTierMapModal, setShowTierMapModal] = useState(false)
  const [selectedAuthForMap, setSelectedAuthForMap] = useState<{ id?: string; name: string; auths: any[] } | null>(null)

  useEffect(() => {
    if (!manufacturerId) {
      toast.error('无法获取厂家信息')
      navigate('/admin/manufacturers')
      return
    }
    loadData()
  }, [manufacturerId])

  useEffect(() => {
    const t = searchParams.get('tab') as TabType | null
    if (t && t !== activeTab) {
      setActiveTab(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const loadData = async () => {
    setLoading(true)
    try {
      const [mRes, pRes, cRes, authRes, tRes, receivedRes, pendingDesignerRes, pendingManufacturerRes] = await Promise.all([
        apiClient.get(`/manufacturers/${manufacturerId}`),
        apiClient.get(`/manufacturers/${manufacturerId}/products`, { params: { status: 'active', limit: 10000 } }),
        apiClient.get(`/categories`),
        apiClient.get(`/authorizations/my-grants`).catch(() => ({ data: { data: [] } })),
        apiClient.get(`/commission-systems/manufacturer/${manufacturerId}`).catch(() => ({ data: { data: null } })),
        apiClient.get(`/authorizations/received`).catch(() => ({ data: { data: [] } })),
        apiClient.get(`/authorizations/designer-requests/pending`).catch(() => ({ data: { data: [] } })),
        apiClient.get(`/authorizations/manufacturer-requests/pending`).catch(() => ({ data: { data: [] } }))
      ])

      setManufacturer(mRes.data?.data || null)
      const categoryList = cRes.data?.data || []
      setCategories(categoryList)
      setTierSystemConfig(tRes.data?.data || null)
      setReceivedAuths(receivedRes.data?.data || [])
      setGrantedAuths((authRes.data?.data || []).filter((a: any) => a?.status === 'active'))
      
      // 合并待审批请求
      const pendingDesigner = pendingDesignerRes.data?.data || []
      const pendingManufacturer = pendingManufacturerRes.data?.data || []
      setPendingRequests([...pendingDesigner, ...pendingManufacturer])
      
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
      let growthData = { monthlyGrowth: 0 }
      try {
        const [gmvRes, growthRes] = await Promise.all([
          apiClient.get(`/authorizations/gmv-stats`, { params: { manufacturerId } }),
          apiClient.get(`/authorizations/growth-stats`, { params: { manufacturerId } })
        ])
        gmvData = gmvRes.data?.data || {}
        growthData = growthRes.data?.data || { monthlyGrowth: 0 }
      } catch {
        // Use defaults if API fails
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
        monthlyGrowth: growthData.monthlyGrowth || 0,
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

  // 快速审批通过
  const handleQuickApprove = async (request: any) => {
    try {
      const endpoint = request.authorizationType === 'manufacturer'
        ? `/authorizations/manufacturer-requests/${request._id}/approve`
        : `/authorizations/designer-requests/${request._id}/approve`
      
      const response = await apiClient.put(endpoint, {
        discountRate: 85,
        commissionRate: 5,
        tierType: 'new_company',
        tierCompanyName: request.toDesigner?.nickname || request.toManufacturer?.name || '新合作商',
        allowSubAuthorization: true
      })
      
      if (response.data?.success) {
        toast.success('审批通过')
        loadData()
      } else {
        toast.error(response.data?.message || '审批失败')
      }
    } catch (error) {
      console.error('审批失败:', error)
      toast.error('审批失败')
    }
  }

  // 拒绝申请
  const handleRejectRequest = async (request: any) => {
    if (!confirm('确定要拒绝此申请吗？')) return
    
    try {
      const endpoint = request.authorizationType === 'manufacturer'
        ? `/authorizations/manufacturer-requests/${request._id}/reject`
        : `/authorizations/designer-requests/${request._id}/reject`
      
      const response = await apiClient.put(endpoint, {})
      
      if (response.data?.success) {
        toast.success('已拒绝')
        loadData()
      } else {
        toast.error(response.data?.message || '拒绝失败')
      }
    } catch (error) {
      console.error('拒绝失败:', error)
      toast.error('拒绝失败')
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

  // 切换渠道展开/折叠并加载层级数据
  const toggleChannelExpand = async (channelId: string) => {
    const isCurrentlyExpanded = expandedChannels.has(channelId)
    
    setExpandedChannels(prev => {
      const next = new Set(prev)
      if (next.has(channelId)) {
        next.delete(channelId)
      } else {
        next.add(channelId)
      }
      return next
    })
    
    // 如果展开且尚未加载层级数据，则加载
    if (!isCurrentlyExpanded && !channelTiers[channelId]) {
      try {
        const res = await apiClient.get(`/authorizations/tier-hierarchy-v2`, {
          params: { manufacturerId, companyId: channelId }
        })
        const nodes = res.data?.data?.nodes || []
        setChannelTiers(prev => ({ ...prev, [channelId]: nodes }))
      } catch (error) {
        console.error('加载层级数据失败:', error)
      }
    }
  }

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
                onClick={() => setActiveTab('home')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'home'
                    ? 'border-[#153e35] text-[#153e35]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  首页
                </span>
              </button>
              <button
                onClick={() => setActiveTab('partners')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'partners'
                    ? 'border-[#153e35] text-[#153e35]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  合作商家
                </span>
              </button>
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
                  渠道管理
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

                {/* 待审批的合作申请 */}
                {pendingRequests.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                      <h4 className="text-base font-bold text-gray-900">待审批的合作申请</h4>
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">{pendingRequests.length}个</span>
                    </div>
                    <div className="space-y-3">
                      {pendingRequests.map((req: any) => {
                        const applicantName = req.authorizationType === 'manufacturer'
                          ? (req.toManufacturer?.name || req.toManufacturer?.fullName || '未知商家')
                          : (req.toDesigner?.nickname || req.toDesigner?.username || '未知设计师')
                        const applicantAvatar = req.authorizationType === 'manufacturer'
                          ? req.toManufacturer?.logo
                          : req.toDesigner?.avatar
                        const scopeLabel = req.scope === 'all' 
                          ? '全部商品' 
                          : req.scope === 'category' 
                            ? `分类授权 (${req.categories?.length || 0}个)` 
                            : `指定商品 (${req.products?.length || 0}个)`
                        const requestedDiscount = req.priceSettings?.globalDiscount || req.minDiscountRate || '--'
                        
                        return (
                          <div key={req._id} className="border-2 border-orange-200 bg-orange-50 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <div className="w-12 h-12 rounded-full bg-white border-2 border-orange-300 overflow-hidden">
                                    {applicantAvatar ? (
                                      <img src={applicantAvatar.startsWith('http') ? applicantAvatar : `/api/files/${applicantAvatar}`} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-orange-400">
                                        {req.authorizationType === 'manufacturer' ? <Package className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                                      </div>
                                    )}
                                  </div>
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                    <Clock className="w-3 h-3 text-white" />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900">{applicantName}</span>
                                    <span className={`px-2 py-0.5 text-xs rounded ${
                                      req.authorizationType === 'manufacturer' 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : 'bg-purple-100 text-purple-700'
                                    }`}>
                                      {req.authorizationType === 'manufacturer' ? '厂家' : '设计师'}
                                    </span>
                                    <span className="px-2 py-0.5 bg-orange-200 text-orange-800 text-xs rounded">待审批</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    申请时间: {new Date(req.createdAt || req.validFrom).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-6">
                                <div className="text-center">
                                  <div className="text-xs text-gray-500">申请折扣</div>
                                  <div className="text-lg font-bold text-orange-600">{requestedDiscount}%</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-gray-500">授权范围</div>
                                  <div className="text-sm font-medium text-gray-700">{scopeLabel}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => handleQuickApprove(req)}
                                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                                  >
                                    通过
                                  </button>
                                  <button 
                                    onClick={() => handleRejectRequest(req)}
                                    className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                                  >
                                    拒绝
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

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

                {/* 已合作渠道列表 */}
                <div className="flex items-center gap-2 mb-4">
                  <h4 className="text-base font-bold text-gray-900">已合作渠道</h4>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">{channels.filter(c => channelFilter === 'all' || c.type === channelFilter).length}个</span>
                </div>

                {channels.filter(c => channelFilter === 'all' || c.type === channelFilter).length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>暂无授权渠道商</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {channels.filter(c => channelFilter === 'all' || c.type === channelFilter).map(channel => (
                      <div key={channel._id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                        {/* 渠道卡片头部 */}
                        <div className="p-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {/* 展开/折叠按钮 */}
                              <button
                                onClick={() => toggleChannelExpand(channel._id)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                {expandedChannels.has(channel._id) ? (
                                  <ChevronDown className="w-5 h-5 text-gray-500" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-gray-500" />
                                )}
                              </button>
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
                        
                        {/* 展开的层级列表 */}
                        {expandedChannels.has(channel._id) && (
                          <div className="bg-gray-50 border-t border-gray-100 p-4">
                            <div className="text-sm font-medium text-gray-700 mb-3">下级层级</div>
                            {channelTiers[channel._id]?.length > 0 ? (
                              <div className="space-y-2">
                                {channelTiers[channel._id].map((tier: any) => (
                                  <div key={tier._id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
                                        {tier.tierDisplayName?.charAt(0) || '?'}
                                      </div>
                                      <div>
                                        <div className="font-medium text-gray-900">{tier.tierDisplayName || '未命名'}</div>
                                        <div className="text-xs text-gray-500">
                                          返佣: {tier.tierCommissionRate || 0}% | 下放: {tier.tierDelegatedRate || 0}%
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => navigate(`/admin/tier-hierarchy?manufacturerId=${manufacturerId}&companyId=${channel._id}`)}
                                      className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                      管理层级
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-gray-400 text-sm">
                                暂无下级层级
                              </div>
                            )}
                            <button
                              onClick={() => navigate(`/admin/tier-hierarchy?manufacturerId=${manufacturerId}&companyId=${channel._id}`)}
                              className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors text-sm"
                            >
                              + 管理层级体系
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'home' && (
              <div>
                {/* 厂家本家信息 */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900">厂家信息</h3>
                  <p className="text-sm text-gray-500">本厂家的基本信息和商品概览</p>
                </div>

                {/* 厂家基本信息卡片 */}
                <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                  <div className="flex items-start gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-white border overflow-hidden flex-shrink-0">
                      {manufacturer?.logo ? (
                        <img src={manufacturer.logo.startsWith('http') ? manufacturer.logo : `/api/files/${manufacturer.logo}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-10 h-10 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">{manufacturer?.name || manufacturer?.fullName || '厂家'}</h2>
                      <p className="text-sm text-gray-500 mb-3">{manufacturer?.code || manufacturerId}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                          {manufacturer?.status === 'active' ? '运营中' : '已停用'}
                        </span>
                        <span className="text-gray-500">商品数量: {products.length}</span>
                        <span className="text-gray-500">渠道数量: {channels.length}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/admin/manufacturers/${manufacturerId}/settings`)}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                      >
                        <Settings className="w-4 h-4 inline mr-1" />
                        设置
                      </button>
                      <button
                        onClick={() => navigate(`/admin/product-management`)}
                        className="px-4 py-2 bg-[#153e35] text-white rounded-lg text-sm hover:bg-[#1a4d42]"
                      >
                        商品管理
                      </button>
                    </div>
                  </div>
                </div>

                {/* 快捷操作 */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <button
                    onClick={() => setActiveTab('partners')}
                    className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-left hover:shadow-md transition-all"
                  >
                    <Users className="w-8 h-8 text-blue-600 mb-3" />
                    <h4 className="font-semibold text-gray-900 mb-1">合作商家</h4>
                    <p className="text-sm text-gray-500">查看授权给本厂家的商家 ({receivedAuths.length})</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('channels')}
                    className="bg-green-50 border border-green-100 rounded-xl p-6 text-left hover:shadow-md transition-all"
                  >
                    <TrendingUp className="w-8 h-8 text-green-600 mb-3" />
                    <h4 className="font-semibold text-gray-900 mb-1">渠道管理</h4>
                    <p className="text-sm text-gray-500">管理本厂家授权的渠道商 ({channels.length})</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('channels')}
                    className="bg-purple-50 border border-purple-100 rounded-xl p-6 text-left hover:shadow-md transition-all"
                  >
                    <DollarSign className="w-8 h-8 text-purple-600 mb-3" />
                    <h4 className="font-semibold text-gray-900 mb-1">层级分成</h4>
                    <p className="text-sm text-gray-500">在渠道管理中设置分成体系</p>
                  </button>
                </div>

                {/* 待审批提醒 */}
                {pendingRequests.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-yellow-800">有 {pendingRequests.length} 条待审批申请</span>
                      </div>
                      <button
                        onClick={() => navigate('/admin/authorizations?tab=pending_requests')}
                        className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700"
                      >
                        去审批
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'partners' && (
              <div>
                {/* 合作商家：其他商家授权给本厂家的信息 */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900">合作商家</h3>
                  <p className="text-sm text-gray-500">其他商家授权给本厂家的合作信息</p>
                </div>

                {receivedAuths.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>暂无合作商家</p>
                    <p className="text-sm mt-2">当其他商家授权给您时，会显示在这里</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {receivedAuths.map((auth: any) => {
                      const partnerName = auth.fromManufacturer?.name || auth.fromManufacturer?.fullName || '未知厂家'
                      const partnerLogo = auth.fromManufacturer?.logo
                      const partnerId = auth.fromManufacturer?._id || auth._id
                      const productCount = auth.actualProductCount || (Array.isArray(auth.products) ? auth.products.length : 0)
                      
                      return (
                        <div key={auth._id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                              {partnerLogo ? (
                                <img src={partnerLogo.startsWith('http') ? partnerLogo : `/api/files/${partnerLogo}`} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-6 h-6 text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">{partnerName}</h4>
                              <p className="text-xs text-gray-500">{partnerId?.slice(-8)}</p>
                            </div>
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">已授权</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                              <div className="text-xs text-gray-500 mb-1">授权折扣</div>
                              <div className="text-xl font-bold text-gray-900">{auth.minDiscountRate || 0}%</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                              <div className="text-xs text-gray-500 mb-1">返佣比例</div>
                              <div className="text-xl font-bold text-gray-900">{auth.commissionRate || 0}%</div>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-500 mb-4">
                            已授权 {productCount} 件商品
                          </div>
                          
                          <div className="space-y-2">
                            <button
                              onClick={() => navigate(`/admin/authorizations/${auth._id}/pricing?productTab=partner`)}
                              className="w-full py-2.5 bg-[#153e35] text-white rounded-lg text-sm hover:bg-[#1a4d42]"
                            >
                              查看授权商品
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('确定要取消与该厂家的合作吗？取消后将无法继续销售其授权商品。')) {
                                  apiClient.delete(`/authorizations/${auth._id}`)
                                    .then(() => {
                                      toast.success('已取消合作')
                                      loadData()
                                    })
                                    .catch(() => toast.error('取消合作失败'))
                                }
                              }}
                              className="w-full py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50"
                            >
                              取消合作
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {false && (
              <div>
                {/* 旧的products tab内容 - 已废弃 */}
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

            {false && (
              <div>
                {/* 旧的授权管理 - 已废弃 */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900">授权管理</h3>
                  <p className="text-sm text-gray-500">管理所有合作商的授权关系（我授权的 + 我收到的）</p>
                </div>

                {/* 待审批申请区域 */}
                {pendingRequests.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-5 h-5 text-yellow-500" />
                      <h4 className="text-md font-semibold text-gray-800">待审批申请 ({pendingRequests.length})</h4>
                    </div>
                    <div className="space-y-3">
                      {pendingRequests.map((request: any) => {
                        const requesterName = request.toDesigner?.nickname || request.toDesigner?.username || 
                                             request.toManufacturer?.name || request.toManufacturer?.fullName || '未知申请人'
                        const requesterAvatar = request.toDesigner?.avatar || request.toManufacturer?.logo
                        const requestType = request.authorizationType === 'designer' ? '设计师' : '厂家'
                        
                        return (
                          <div key={request._id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {requesterAvatar ? (
                                  <img src={requesterAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-yellow-600" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium text-gray-900">{requesterName}</div>
                                  <div className="text-sm text-gray-500">
                                    {requestType}申请授权 · {new Date(request.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleQuickApprove(request)}
                                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-1"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  通过
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(request)}
                                  className="px-4 py-2 bg-red-100 text-red-600 text-sm rounded-lg hover:bg-red-200 flex items-center gap-1"
                                >
                                  <XCircle className="w-4 h-4" />
                                  拒绝
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {(() => {
                  // 合并 receivedAuths 和 grantedAuths，按合作商分组
                  const partnerMap = new Map<string, { 
                    partnerId: string
                    partnerName: string
                    partnerLogo?: string
                    grantedAuths: any[]
                    receivedAuths: any[]
                  }>()

                  // 处理我授权给别人的（granted）
                  grantedAuths.forEach((auth: any) => {
                    const partnerId = auth.toDesigner?._id || auth.toManufacturer?._id || auth._id
                    const partnerName = auth.toDesigner?.nickname || auth.toDesigner?.username || auth.toManufacturer?.name || auth.toManufacturer?.fullName || '未知合作商'
                    const partnerLogo = auth.toDesigner?.avatar || auth.toManufacturer?.logo
                    
                    if (!partnerMap.has(partnerId)) {
                      partnerMap.set(partnerId, {
                        partnerId,
                        partnerName,
                        partnerLogo,
                        grantedAuths: [],
                        receivedAuths: []
                      })
                    }
                    partnerMap.get(partnerId)!.grantedAuths.push(auth)
                  })

                  // 处理别人授权给我的（received）
                  receivedAuths.forEach((auth: any) => {
                    const partnerId = auth.fromManufacturer?._id || auth._id
                    const partnerName = auth.fromManufacturer?.name || auth.fromManufacturer?.fullName || '未知厂家'
                    const partnerLogo = auth.fromManufacturer?.logo
                    
                    if (!partnerMap.has(partnerId)) {
                      partnerMap.set(partnerId, {
                        partnerId,
                        partnerName,
                        partnerLogo,
                        grantedAuths: [],
                        receivedAuths: []
                      })
                    }
                    partnerMap.get(partnerId)!.receivedAuths.push(auth)
                  })

                  const partners = Array.from(partnerMap.values())

                  if (partners.length === 0) {
                    return (
                      <div className="text-center py-12 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>暂无合作商</p>
                        <button
                          onClick={() => navigate('/admin/authorizations?tab=pending_requests')}
                          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          去审批授权申请
                        </button>
                      </div>
                    )
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {partners.map(partner => {
                        // 计算总商品数
                        const totalProducts = [...partner.grantedAuths, ...partner.receivedAuths].reduce((sum, auth) => {
                          if (auth.scope === 'all') return sum + 1000
                          if (auth.scope === 'category') return sum + (auth.categories?.length || 0) * 10
                          return sum + (auth.products?.length || 0)
                        }, 0)

                        // 计算平均折扣和返佣
                        const allAuths = [...partner.grantedAuths, ...partner.receivedAuths]
                        const avgDiscount = allAuths.reduce((sum, a) => sum + (a.minDiscountRate || 0), 0) / allAuths.length
                        const avgCommission = allAuths.reduce((sum, a) => sum + (a.commissionRate || 0), 0) / allAuths.length

                        return (
                          <PartnerCard
                            key={partner.partnerId}
                            partnerId={partner.partnerId}
                            partnerName={partner.partnerName}
                            partnerLogo={partner.partnerLogo}
                            status="active"
                            productCount={totalProducts}
                            grantedAuth={partner.grantedAuths.length > 0 ? {
                              minDiscountRate: Math.round(partner.grantedAuths.reduce((sum, a) => sum + (a.minDiscountRate || 0), 0) / partner.grantedAuths.length),
                              commissionRate: Math.round(partner.grantedAuths.reduce((sum, a) => sum + (a.commissionRate || 0), 0) / partner.grantedAuths.length * 10) / 10
                            } : undefined}
                            receivedAuth={partner.receivedAuths.length > 0 ? {
                              minDiscountRate: Math.round(partner.receivedAuths.reduce((sum, a) => sum + (a.minDiscountRate || 0), 0) / partner.receivedAuths.length),
                              commissionRate: Math.round(partner.receivedAuths.reduce((sum, a) => sum + (a.commissionRate || 0), 0) / partner.receivedAuths.length * 10) / 10
                            } : undefined}
                            onViewProducts={() => {
                              const firstAuth = (partner.receivedAuths && partner.receivedAuths[0]) || (partner.grantedAuths && partner.grantedAuths[0])
                              const authId = firstAuth?._id
                              if (!authId) {
                                toast.error('未找到授权记录')
                                return
                              }
                              navigate(`/admin/authorizations/${authId}/pricing?productTab=partner`)
                            }}
                            onViewTierSystem={() => {
                              const rt = encodeURIComponent(`/admin/manufacturers/${manufacturerId}/business-panel?tab=authorizations`)
                              navigate(`/admin/tier-hierarchy?manufacturerId=${manufacturerId}&partnerId=${partner.partnerId}&returnTo=${rt}`)
                            }}
                          />
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* 旧的 granted_auth 代码已删除，合并到上面的 authorizations tab */}
            {false && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900">授权模式 - 分成体系管理</h3>
                  <p className="text-sm text-gray-500">每个公司都是独立的分成体系，点击公司查看完整管理功能</p>
                </div>

                {grantedAuths.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>暂无授权记录</p>
                    <button
                      onClick={() => navigate('/admin/authorizations?tab=pending_requests')}
                      className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      去审批授权申请
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* 按公司分组显示 */}
                    {(() => {
                      const companies = new Map<string, any[]>()
                      grantedAuths.forEach((auth: any) => {
                        const companyId = auth.tierCompanyId ? String(auth.tierCompanyId) : ''
                        const companyName = auth.tierCompanyName || '未命名公司'
                        // 使用 companyId 作为主键，如果没有则用目标用户ID避免重复
                        let key = companyId
                        if (!key) {
                          const targetUserId = auth.toDesigner?._id || auth.toManufacturer?._id
                          key = targetUserId ? `user:${targetUserId}` : `name:${companyName}`
                        }
                        if (!companies.has(key)) {
                          companies.set(key, [])
                        }
                        companies.get(key)!.push(auth)
                      })

                      return Array.from(companies.entries()).map(([companyKey, auths]) => {
                        const first = auths[0] || {}
                        const companyId = first.tierCompanyId ? String(first.tierCompanyId) : ''
                        let companyName = first.tierCompanyName || '未命名公司'
                        
                        // 如果是'未命名公司'，尝试从根授权的目标用户中提取真实名称
                        if (companyName === '未命名公司') {
                          const rootAuth = auths.find((a: any) => (a.tierLevel || 0) === 0) || first
                          if (rootAuth.toDesigner) {
                            const designerName = rootAuth.toDesigner.nickname || rootAuth.toDesigner.username
                            companyName = designerName ? `${designerName}的公司` : `公司 ${companyId.slice(-6)}`
                          } else if (rootAuth.toManufacturer) {
                            companyName = rootAuth.toManufacturer.name || rootAuth.toManufacturer.fullName || `公司 ${companyId.slice(-6)}`
                          } else if (companyId) {
                            companyName = `公司 ${companyId.slice(-6)}`
                          }
                        }
                        
                        const memberCount = auths.length
                        const avgDiscount = auths.reduce((sum, a) => sum + (a.minDiscountRate || 0), 0) / memberCount
                        const avgCommission = auths.reduce((sum, a) => sum + (a.commissionRate || 0), 0) / memberCount

                        const companyIdShort = companyId ? `...${companyId.slice(-4)}` : ''
                        const memberNames = auths.slice(0, 3).map((a: any) => 
                          a.toDesigner?.nickname || a.toDesigner?.username || a.toManufacturer?.name || '未知'
                        ).join('、')
                        const moreCount = memberCount > 3 ? memberCount - 3 : 0
                        const oldestAuth = auths.reduce((oldest: any, a: any) => 
                          !oldest || new Date(a.createdAt) < new Date(oldest.createdAt) ? a : oldest
                        , null)
                        const createdDate = oldestAuth?.createdAt ? new Date(oldestAuth.createdAt).toLocaleDateString('zh-CN') : ''

                        return (
                          <div
                            key={companyKey}
                            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
                            onClick={() => {
                              const rt = encodeURIComponent(`/admin/manufacturers/${manufacturerId}/business-panel?tab=authorizations`)
                              const base = `/admin/tier-hierarchy?manufacturerId=${encodeURIComponent(String(manufacturerId))}&returnTo=${rt}`
                              const withCompany = companyId
                                ? `${base}&companyId=${encodeURIComponent(companyId)}&companyName=${encodeURIComponent(companyName)}`
                                : `${base}&companyName=${encodeURIComponent(companyName)}`
                              navigate(withCompany)
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                                  {companyName.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-bold text-gray-900">{companyName}</h3>
                                    {companyIdShort && (
                                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded font-mono">
                                        ID{companyIdShort}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                                    <span>成员: {memberCount} 人</span>
                                    <span>•</span>
                                    <span>折扣: {avgDiscount.toFixed(0)}%</span>
                                    <span>•</span>
                                    <span>返佣: {avgCommission.toFixed(1)}%</span>
                                    {createdDate && (
                                      <>
                                        <span>•</span>
                                        <span className="text-xs text-gray-400">{createdDate}</span>
                                      </>
                                    )}
                                  </div>
                                  {memberNames && (
                                    <div className="text-xs text-gray-500 mt-1 truncate">
                                      成员: {memberNames}{moreCount > 0 && ` 等${moreCount}人`}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  className="px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 text-sm"
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    if (!confirm(`确定要删除公司"${companyName}"的所有授权吗？此操作不可恢复。`)) return
                                    try {
                                      const authIds = auths.map((a: any) => a._id)
                                      const results = await Promise.allSettled(
                                        authIds.map((id: string) => apiClient.delete(`/authorizations/${id}?permanent=true`))
                                      )
                                      const failed = results.filter(r => r.status === 'rejected')
                                      if (failed.length > 0) {
                                        console.error('部分删除失败:', failed)
                                        toast.error(`删除失败 ${failed.length}/${authIds.length} 条`)
                                      } else {
                                        toast.success(`已删除 ${authIds.length} 条授权`)
                                      }
                                      await loadData()
                                    } catch (err: any) {
                                      console.error('删除失败:', err)
                                      toast.error(err?.response?.data?.message || '删除失败')
                                    }
                                  }}
                                >
                                  删除
                                </button>
                                <button
                                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    try {
                                      const response = await apiClient.get('/authorizations/tier-hierarchy')
                                      if (response.data?.success) {
                                        const hierarchy = response.data.data?.visible || []
                                        const companyAuths = hierarchy.filter((h: any) => {
                                          const hid = h.tierCompanyId ? String(h.tierCompanyId) : ''
                                          if (companyId) return hid === companyId
                                          return (h.tierCompanyName || '未命名公司') === companyName
                                        })
                                        setSelectedAuthForMap({ id: companyId, name: companyName, auths: companyAuths.length > 0 ? companyAuths : auths })
                                        setShowTierMapModal(true)
                                      }
                                    } catch {
                                      setSelectedAuthForMap({ id: companyId, name: companyName, auths })
                                      setShowTierMapModal(true)
                                    }
                                  }}
                                >
                                  预览地图
                                </button>
                                <button
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const rt = encodeURIComponent(`/admin/manufacturers/${manufacturerId}/business-panel?tab=authorizations`)
                                    const base = `/admin/tier-hierarchy?manufacturerId=${encodeURIComponent(String(manufacturerId))}&returnTo=${rt}`
                                    const withCompany = companyId
                                      ? `${base}&companyId=${encodeURIComponent(companyId)}&companyName=${encodeURIComponent(companyName)}`
                                      : `${base}&companyName=${encodeURIComponent(companyName)}`
                                    navigate(withCompany)
                                  }}
                                >
                                  管理体系
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 分成地图弹窗 - 卡片连线可视化 */}
      {showTierMapModal && selectedAuthForMap && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedAuthForMap.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">分成体系地图</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const companyName = String(selectedAuthForMap.name || '').trim() || '未命名公司'
                      const companyId = selectedAuthForMap.id ? String(selectedAuthForMap.id) : ''
                      const rt = encodeURIComponent(`/admin/manufacturers/${manufacturerId}/business-panel?tab=granted_auth`)
                      setShowTierMapModal(false)
                      setSelectedAuthForMap(null)
                      const base = `/admin/tier-hierarchy?manufacturerId=${encodeURIComponent(String(manufacturerId))}&returnTo=${rt}`
                      const withCompany = companyId
                        ? `${base}&companyId=${encodeURIComponent(companyId)}&companyName=${encodeURIComponent(companyName)}`
                        : `${base}&companyName=${encodeURIComponent(companyName)}`
                      navigate(withCompany)
                    }}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    进入管理
                  </button>
                  <button
                    onClick={() => {
                      setShowTierMapModal(false)
                      setSelectedAuthForMap(null)
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-8 overflow-auto max-h-[70vh] bg-gray-50">
              {/* 卡片连线地图 - 树状结构 */}
              <div className="flex flex-col items-center gap-0 min-w-max">
                {(() => {
                  // 构建父子关系映射
                  const authMap = new Map(selectedAuthForMap.auths.map((a: any) => [a._id, a]))
                  const childrenMap = new Map<string, any[]>()
                  
                  selectedAuthForMap.auths.forEach((auth: any) => {
                    if (auth.parentAuthorizationId) {
                      const parentId = typeof auth.parentAuthorizationId === 'object'
                        ? String(auth.parentAuthorizationId?._id || auth.parentAuthorizationId)
                        : String(auth.parentAuthorizationId)
                      if (!childrenMap.has(parentId)) {
                        childrenMap.set(parentId, [])
                      }
                      childrenMap.get(parentId)!.push(auth)
                    }
                  })

                  // 找到顶级节点（tierLevel = 0 或没有 parentAuthorizationId）
                  const rootAuth = selectedAuthForMap.auths.find((a: any) => 
                    (a.tierLevel === 0 || !a.parentAuthorizationId)
                  ) || selectedAuthForMap.auths[0]

                  // 递归渲染函数
                  const renderNode = (auth: any, isRoot = false): JSX.Element => {
                    const targetName = auth.authorizationType === 'designer'
                      ? (auth.toDesigner?.nickname || auth.toDesigner?.username || '未知设计师')
                      : (auth.toManufacturer?.name || auth.toManufacturer?.fullName || '未知厂家')
                    const initial = targetName.charAt(0)
                    const children = childrenMap.get(auth._id) || []

                    return (
                      <div key={auth._id} className="flex flex-col items-center">
                        {/* 当前节点卡片 */}
                        <div className={`bg-white rounded-2xl shadow-lg border-2 p-6 w-72 ${
                          isRoot ? 'border-purple-400' : 'border-purple-200'
                        }`}>
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-14 h-14 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xl font-bold ${
                              isRoot ? 'from-purple-600 to-blue-600' : 'from-purple-400 to-blue-400'
                            }`}>
                              {initial}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900">{targetName}</h4>
                              <p className="text-xs text-gray-500">
                                {auth.authorizationType === 'designer' ? '设计师' : '厂家'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-green-50 rounded-lg p-3 text-center">
                              <div className="text-xs text-green-700">最低折扣</div>
                              <div className="text-xl font-bold text-green-600">{auth.minDiscountRate || 0}%</div>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                              <div className="text-xs text-blue-700">返佣比例</div>
                              <div className="text-xl font-bold text-blue-600">{auth.commissionRate || 0}%</div>
                            </div>
                          </div>
                          
                          {auth.allowSubAuthorization && (
                            <div className="mt-3 text-xs text-center text-purple-600">
                              ✓ 允许下级授权
                            </div>
                          )}
                        </div>

                        {/* 子节点 */}
                        {children.length > 0 && (
                          <div className="flex flex-col items-center">
                            {/* 连接线 */}
                            <div className="w-0.5 h-12 bg-gradient-to-b from-purple-300 to-purple-200"></div>
                            
                            {/* 子节点水平排列 */}
                            <div className="flex items-start justify-center gap-8">
                              {children.map((child: any, index: number) => (
                                <div key={child._id} className="flex flex-col items-center">
                                  {/* 从父节点到子节点的连接线 */}
                                  {index === 0 && children.length > 1 && (
                                    <div className="absolute w-full h-0.5 bg-purple-200" style={{ top: '-12px', left: '50%', right: '50%' }}></div>
                                  )}
                                  {renderNode(child, false)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  }

                  return renderNode(rootAuth, true)
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
