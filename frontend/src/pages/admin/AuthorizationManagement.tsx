import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Plus, Users, Eye, Edit2, Trash2, AlertCircle, CheckCircle, XCircle, Copy } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import FolderSelectionModal from '@/components/FolderSelectionModal'
import apiClient from '@/lib/apiClient'

interface Authorization {
  _id: string
  fromManufacturer: any
  toManufacturer?: any
  toDesigner?: any
  authorizationType: 'manufacturer' | 'designer'
  scope: 'all' | 'category' | 'specific' | 'mixed'
  categories: string[]
  products: any[]
  priceSettings: {
    globalDiscount: number
    categoryDiscounts: Array<{ category: string; discount: number }>
    productPrices: Array<{ productId: string; price: number; discount: number }>
  }
  status: 'pending' | 'active' | 'suspended' | 'revoked'
  validFrom: string
  validUntil?: string
  allowSubAuthorization: boolean
  notes?: string
  savedToFolderId?: string
  savedToFolderName?: string
  isFolderSelected?: boolean
  createdAt: string
  updatedAt: string
}

export default function AuthorizationManagement() {
  const { token, user } = useAuthStore()
  const isDesigner = user?.role === 'designer'
  const isPlatformAdmin = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'platform_admin'
  const isManufacturerUser = !!(
    (user as any)?.manufacturerId ||
    Array.isArray((user as any)?.manufacturerIds) && (user as any)?.manufacturerIds?.length > 0 ||
    user?.role === 'enterprise_admin' ||
    user?.role === 'enterprise_staff'
  )

  type TabKey = 'granted' | 'received' | 'pending_requests' | 'my_requests' | 'tier_hierarchy'
  const [activeTab, setActiveTab] = useState<TabKey>('received')
  const [grantedAuths, setGrantedAuths] = useState<Authorization[]>([])
  const [receivedAuths, setReceivedAuths] = useState<Authorization[]>([])
  const [pendingRequests, setPendingRequests] = useState<Authorization[]>([])
  const [myRequests, setMyRequests] = useState<Authorization[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [selectedAuthId, setSelectedAuthId] = useState<string>('')
  const [categories, setCategories] = useState<any[]>([])

  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [detailAuth, setDetailAuth] = useState<Authorization | null>(null)
  const [editAuth, setEditAuth] = useState<Authorization | null>(null)
  const [loadingAuthDetail, setLoadingAuthDetail] = useState(false)

  // 审批模态框状态
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [approveRequest, setApproveRequest] = useState<Authorization | null>(null)
  const [approveDiscount, setApproveDiscount] = useState(85)
  const [approveCommission, setApproveCommission] = useState(5)
  const [tierType, setTierType] = useState<'new_company' | 'existing_tier'>('new_company')
  const [tierCompanyName, setTierCompanyName] = useState('')
  const [parentAuthId, setParentAuthId] = useState('')
  const [allowSubAuth, setAllowSubAuth] = useState(true)
  const [availableParentAuths, setAvailableParentAuths] = useState<Authorization[]>([])
  
  // 层级结构状态
  const [tierHierarchy, setTierHierarchy] = useState<any[]>([])
  const [myAuthIds, setMyAuthIds] = useState<string[]>([])

  const didInitTab = useRef(false)

  useEffect(() => {
    if (didInitTab.current) return
    if (!user) return
    const desired: TabKey = (isDesigner || isPlatformAdmin) ? 'received' : (isManufacturerUser ? 'granted' : 'received')
    setActiveTab(desired)
    didInitTab.current = true
  }, [user, isDesigner, isManufacturerUser, isPlatformAdmin])

  useEffect(() => {
    loadAuthorizations()
  }, [activeTab])

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await apiClient.get('/categories')
        const data = response.data
        if (data?.success || data?.data) {
          setCategories(data.data || [])
        } else {
          setCategories([])
        }
      } catch (e) {
        setCategories([])
      }
    }
    loadCategories()
  }, [])

  const loadAuthorizations = async () => {
    setLoading(true)
    try {
      if (activeTab === 'granted') {
        const response = await apiClient.get('/authorizations/my-grants')
        const data = response.data
        if (data?.success) setGrantedAuths(data.data || [])
        else toast.error(data?.message || '加载失败')
      } else if (activeTab === 'received') {
        const response = await apiClient.get('/authorizations/received')
        const data = response.data
        if (data?.success) setReceivedAuths(data.data || [])
        else toast.error(data?.message || '加载失败')
      } else if (activeTab === 'tier_hierarchy') {
        const response = await apiClient.get('/authorizations/tier-hierarchy')
        const data = response.data
        if (data?.success) {
          setTierHierarchy(data.data?.visible || [])
          setMyAuthIds(data.data?.myAuthorizations || [])
        } else {
          toast.error(data?.message || '加载失败')
        }
      } else if (activeTab === 'pending_requests') {
        if (isManufacturerUser && !isDesigner) {
          const [designerResp, manufacturerResp] = await Promise.all([
            apiClient.get('/authorizations/designer-requests/pending').catch(() => null as any),
            apiClient.get('/authorizations/manufacturer-requests/pending').catch(() => null as any),
          ])

          const designerList = designerResp?.data?.success ? (designerResp.data.data || []) : []
          const manufacturerList = manufacturerResp?.data?.success ? (manufacturerResp.data.data || []) : []
          setPendingRequests([...(designerList || []), ...(manufacturerList || [])])
        } else {
          const response = await apiClient.get('/authorizations/designer-requests/pending')
          const data = response.data
          if (data?.success) setPendingRequests(data.data || [])
          else toast.error(data?.message || '加载失败')
        }
      } else {
        if (isDesigner || isPlatformAdmin) {
          const response = await apiClient.get('/authorizations/designer-requests/my')
          const data = response.data
          if (data?.success) setMyRequests(data.data || [])
          else toast.error(data?.message || '加载失败')
        } else if (isManufacturerUser) {
          const response = await apiClient.get('/authorizations/manufacturer-requests/my')
          const data = response.data
          if (data?.success) setMyRequests(data.data || [])
          else toast.error(data?.message || '加载失败')
        } else {
          setMyRequests([])
        }
      }
    } catch (error) {
      console.error('加载授权列表失败:', error)
      toast.error('加载授权列表失败')
    } finally {
      setLoading(false)
    }
  }

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('已复制')
    } catch {
      toast.error('复制失败')
    }
  }

  const openApproveModal = async (id: string) => {
    const req = pendingRequests.find((r) => r._id === id)
    if (req) {
      // 加载申请人的详细信息
      try {
        const userId = req.authorizationType === 'designer' ? req.toDesigner?._id : req.toManufacturer?._id
        if (userId) {
          const response = await apiClient.get(`/users/${userId}/profile`)
          const userData = response.data?.data
          if (userData) {
            // 将用户详细信息附加到请求对象
            req.userProfile = userData
          }
        }
      } catch (error) {
        console.error('加载用户详情失败:', error)
      }
      
      // 加载可用的父级授权（用于插入现有层级）
      try {
        const response = await apiClient.get('/authorizations/my-grants')
        if (response.data?.success) {
          // 只显示允许下级授权的授权
          const availableAuths = (response.data.data || []).filter(
            (auth: Authorization) => auth.status === 'active' && auth.allowSubAuthorization !== false
          )
          setAvailableParentAuths(availableAuths)
        }
      } catch (error) {
        console.error('加载可用父级授权失败:', error)
        setAvailableParentAuths([])
      }
      
      setApproveRequest(req)
      setApproveDiscount(85)
      setApproveCommission(5)
      setTierType('new_company')
      setTierCompanyName('')
      setParentAuthId('')
      setAllowSubAuth(true)
      setShowApproveModal(true)
    }
  }

  const handleApproveRequest = async () => {
    if (!approveRequest) return
    
    // 验证必填字段
    if (tierType === 'new_company' && !tierCompanyName.trim()) {
      toast.error('请输入公司名称')
      return
    }
    if (tierType === 'existing_tier' && !parentAuthId) {
      toast.error('请选择父级授权')
      return
    }
    
    try {
      const endpoint = approveRequest.authorizationType === 'manufacturer'
        ? `/authorizations/manufacturer-requests/${approveRequest._id}/approve`
        : `/authorizations/designer-requests/${approveRequest._id}/approve`

      const response = await apiClient.put(endpoint, {
        discountRate: approveDiscount,
        commissionRate: approveCommission,
        tierType,
        tierCompanyName: tierCompanyName.trim(),
        parentAuthorizationId: tierType === 'existing_tier' ? parentAuthId : undefined,
        allowSubAuthorization: allowSubAuth
      })
      const data = response.data
      if (data?.success) {
        toast.success('已通过')
        setShowApproveModal(false)
        setApproveRequest(null)
        loadAuthorizations()
      } else {
        toast.error(data?.message || '审核失败')
      }
    } catch (error) {
      console.error('审核失败:', error)
      toast.error('审核失败')
    }
  }

  const handleRejectRequest = async (id: string) => {
    try {
      const req = pendingRequests.find((r) => r._id === id)
      const endpoint = req?.authorizationType === 'manufacturer'
        ? `/authorizations/manufacturer-requests/${id}/reject`
        : `/authorizations/designer-requests/${id}/reject`

      const response = await apiClient.put(endpoint, {})
      const data = response.data
      if (data?.success) {
        toast.success('已拒绝')
        loadAuthorizations()
      } else {
        toast.error(data?.message || '拒绝失败')
      }
    } catch (error) {
      console.error('拒绝失败:', error)
      toast.error('拒绝失败')
    }
  }

  const handleRevoke = async (id: string) => {
    if (!confirm('确定要撤销此授权吗？')) return
    
    try {
      const response = await apiClient.delete(`/authorizations/${id}`)
      const data = response.data
      if (data?.success) {
        toast.success('授权已撤销')
        loadAuthorizations()
      } else {
        toast.error(data?.message || '撤销授权失败')
      }
    } catch (error) {
      console.error('撤销授权失败:', error)
      toast.error('撤销授权失败')
    }
  }

  const openFolderSelection = (authId: string) => {
    setSelectedAuthId(authId)
    setShowFolderModal(true)
  }

  const fetchAuthorizationDetail = async (id: string) => {
    setLoadingAuthDetail(true)
    try {
      const resp = await apiClient.get(`/authorizations/${id}`)
      const data = resp.data
      if (!data?.success) {
        toast.error(data?.message || '加载授权详情失败')
        return null
      }
      return data.data as Authorization
    } catch (e) {
      toast.error('加载授权详情失败')
      return null
    } finally {
      setLoadingAuthDetail(false)
    }
  }

  const openDetail = async (id: string) => {
    const auth = await fetchAuthorizationDetail(id)
    if (!auth) return
    setDetailAuth(auth)
    setShowDetailModal(true)
  }

  const openEdit = async (id: string) => {
    const auth = await fetchAuthorizationDetail(id)
    if (!auth) return
    setEditAuth(auth)
    setShowEditModal(true)
  }

  const handleSaveFolder = async (folderId: string, folderName: string) => {
    if (!selectedAuthId) return
    try {
      const response = await apiClient.put(`/authorizations/${selectedAuthId}/select-folder`, {
        folderId,
        folderName,
      })
      const data = response.data
      if (data?.success) {
        toast.success('已保存文件夹')
        setShowFolderModal(false)
        setSelectedAuthId('')
        loadAuthorizations()
      } else {
        toast.error(data?.message || '保存失败')
      }
    } catch (error) {
      console.error('保存文件夹失败:', error)
      toast.error('保存文件夹失败')
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      active: { label: '有效', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
      suspended: { label: '暂停', color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
      revoked: { label: '已撤销', color: 'bg-red-100 text-red-700', icon: XCircle }
    }
    const { label, color, icon: Icon } = config[status as keyof typeof config]
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    )
  }

  const getScopeLabel = (scope: string, categories?: string[], productsCount?: number) => {
    if (scope === 'all') return '全部商品'
    if (scope === 'category') return `分类授权 (${categories?.join(', ')})`
    if (scope === 'mixed') return `混合授权 (分类${categories?.length || 0} + 商品${productsCount || 0})`
    return `指定商品 (${productsCount}个)`
  }

  const formatDate = (value?: string) => {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString()
  }

  const authorizations = activeTab === 'granted' ? grantedAuths : receivedAuths
  const tabCounts: Record<TabKey, number> = {
    granted: grantedAuths.length,
    received: receivedAuths.length,
    pending_requests: pendingRequests.length,
    my_requests: myRequests.length,
    tier_hierarchy: tierHierarchy.length
  }

  const tabs: Array<{ id: TabKey; label: string; visible: boolean }> = [
    { id: 'granted', label: '我授权的', visible: !isDesigner && isManufacturerUser },
    { id: 'received', label: '我收到的授权', visible: true },
    { id: 'tier_hierarchy', label: '层级结构', visible: true },
    { id: 'pending_requests', label: '待审核申请', visible: !isDesigner && isManufacturerUser },
    { id: 'my_requests', label: '我的申请', visible: isDesigner || isManufacturerUser }
  ]

  return (
    <div className="p-6">
      {/* 页头 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">授权管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理商品授权关系和拿货价格</p>
        </div>
        {activeTab === 'granted' && !isDesigner && isManufacturerUser && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            创建授权
          </button>
        )}

        {activeTab === 'my_requests' && isDesigner && (
          <button
            onClick={() => setShowApplyModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            申请厂家授权
          </button>
        )}
      </div>

      {/* 标签切换 */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-8">
          {tabs.filter(t => t.visible).map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === t.id
                  ? 'border-primary-600 text-primary-600 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              {tabCounts[t.id] > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
                  {tabCounts[t.id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 授权列表 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">加载中...</p>
        </div>
      ) : activeTab === 'pending_requests' ? (
        pendingRequests.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">暂无待审核申请</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((req) => (
              <div
                key={req._id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {req.authorizationType === 'manufacturer'
                          ? `厂家: ${req.toManufacturer?.fullName || req.toManufacturer?.name || '未知厂家'}`
                          : `设计师: ${req.toDesigner?.nickname || req.toDesigner?.username || '未知'}`}
                      </h3>
                      {getStatusBadge(req.status)}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="font-mono">ID: {req.authorizationType === 'manufacturer' ? (req.toManufacturer?._id || req.toManufacturer) : (req.toDesigner?._id || req.toDesigner)}</span>
                      <button
                        onClick={() => copyText(String(req.authorizationType === 'manufacturer' ? (req.toManufacturer?._id || req.toManufacturer || '') : (req.toDesigner?._id || req.toDesigner || '')))}
                        className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                        title="复制ID"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <span>申请时间: {formatDate(req.createdAt || (req as any).validFrom) || '-'}</span>
                      <span className="mx-2">•</span>
                      <span>有效期: {(req.validUntil ? formatDate(req.validUntil) : '永久有效') || '永久有效'}</span>
                    </div>
                    {req.notes && (
                      <p className="mt-2 text-sm text-gray-500">{req.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openApproveModal(req._id)}
                      className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      通过
                    </button>
                    <button
                      onClick={() => handleRejectRequest(req._id)}
                      className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      拒绝
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'tier_hierarchy' ? (
        tierHierarchy.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">暂无层级结构</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">层级可见性说明</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 您只能看到直接授权给您的上级</li>
                <li>• 您只能看到您直接创建的下级</li>
                <li>• 其他层级对您不可见</li>
              </ul>
            </div>

            {tierHierarchy.map((auth: any) => {
              const isMyAuth = myAuthIds.includes(auth._id)
              const tierLevel = auth.tierLevel || 0
              const tierName = auth.tierCompanyName || '未命名层级'
              const targetName = auth.authorizationType === 'designer'
                ? (auth.toDesigner?.nickname || auth.toDesigner?.username || '未知设计师')
                : (auth.toManufacturer?.name || auth.toManufacturer?.fullName || '未知厂家')

              return (
                <div
                  key={auth._id}
                  className={`border-l-4 rounded-lg p-6 ${
                    isMyAuth
                      ? 'bg-green-50 border-green-500'
                      : auth.isParent
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-purple-50 border-purple-500'
                  }`}
                  style={{ marginLeft: `${tierLevel * 2}rem` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{tierName}</h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          层级 {tierLevel}
                        </span>
                        {isMyAuth && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-medium">
                            我的授权
                          </span>
                        )}
                        {auth.isParent && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            上级
                          </span>
                        )}
                        {auth.isChild && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                            下级
                          </span>
                        )}
                        {getStatusBadge(auth.status)}
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          <span>被授权方: <strong>{targetName}</strong></span>
                          <span>类型: {auth.authorizationType === 'designer' ? '设计师' : '企业'}</span>
                        </div>

                        <div className="flex items-center gap-4">
                          {auth.minDiscountRate > 0 && (
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                              最低折扣: {auth.minDiscountRate}%
                            </span>
                          )}
                          {auth.commissionRate > 0 && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              返佣: {auth.commissionRate}%
                            </span>
                          )}
                          {auth.allowSubAuthorization && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                              允许下级授权
                            </span>
                          )}
                        </div>

                        <div>
                          <span>授权范围: {getScopeLabel(auth.scope, auth.categories, auth.products?.length)}</span>
                        </div>

                        {auth.parentAuthorizationId && (
                          <div className="text-xs text-gray-500">
                            父级ID: {auth.parentAuthorizationId}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openDetail(auth._id)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : activeTab === 'my_requests' ? (
        <div>
          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">{isDesigner ? '我的设计师ID' : '我的厂家ID'}</div>
              <div className="font-mono text-gray-900">{String(isDesigner ? ((user as any)?._id || '') : ((user as any)?.manufacturerId || ''))}</div>
            </div>
            <button
              onClick={() => copyText(String(isDesigner ? ((user as any)?._id || '') : ((user as any)?.manufacturerId || '')))}
              className="px-3 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              复制
            </button>
          </div>

          {myRequests.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">暂无申请记录</p>
              <button
                onClick={() => setShowApplyModal(true)}
                className="mt-4 btn btn-secondary"
              >
                申请厂家授权
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myRequests.map((req) => (
                <div
                  key={req._id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          厂家: {req.fromManufacturer?.fullName || req.fromManufacturer?.name || '未知厂家'}
                        </h3>
                        {getStatusBadge(req.status)}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span>申请时间: {formatDate(req.createdAt || (req as any).validFrom) || '-'}</span>
                        <span className="mx-2">•</span>
                        <span>有效期: {(req.validUntil ? formatDate(req.validUntil) : '永久有效') || '永久有效'}</span>
                      </div>
                      {req.notes && (
                        <p className="mt-2 text-sm text-gray-500">{req.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : authorizations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">
            {activeTab === 'granted' ? '暂无授权记录' : '暂无收到的授权'}
          </p>
          {activeTab === 'granted' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 btn btn-secondary"
            >
              创建第一个授权
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {authorizations.map((auth) => (
            <div
              key={auth._id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {activeTab === 'granted' 
                        ? (auth.authorizationType === 'manufacturer' 
                            ? `授权给: ${auth.toManufacturer?.name || '未知厂家'}`
                            : `授权给设计师: ${auth.toDesigner?.username || '未知设计师'}`)
                        : `来自: ${auth.fromManufacturer?.name || '未知厂家'}`
                      }
                    </h3>
                    {getStatusBadge(auth.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>授权范围: {getScopeLabel(auth.scope, auth.categories, auth.products?.length)}</span>
                    <span>•</span>
                    <span>全局折扣: {(((auth.priceSettings?.globalDiscount ?? 1) as number) * 100).toFixed(0)}折</span>
                    <span>•</span>
                    <span>生效: {formatDate(auth.validFrom) || '-'}</span>
                    <span>•</span>
                    <span>有效期: {auth.validUntil ? formatDate(auth.validUntil) : '永久有效'}</span>
                  </div>
                  {auth.notes && (
                    <p className="mt-2 text-sm text-gray-500">{auth.notes}</p>
                  )}

                  {activeTab === 'received' && auth.savedToFolderName && (
                    <p className="mt-2 text-sm text-gray-600">归档文件夹: {auth.savedToFolderName}</p>
                  )}
                </div>
                
                {activeTab === 'granted' && (
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openDetail(auth._id)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="查看详情"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEdit(auth._id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {auth.status === 'active' && (
                      <button
                        onClick={() => handleRevoke(auth._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="撤销授权"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                {activeTab === 'received' && (
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openDetail(auth._id)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="查看详情"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {auth.status === 'active' && !auth.isFolderSelected && (
                      <button
                        onClick={() => openFolderSelection(auth._id)}
                        className="px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        选择文件夹
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 价格设置详情 */}
              {(auth.priceSettings?.categoryDiscounts || []).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">分类折扣设置</h4>
                  <div className="flex flex-wrap gap-2">
                    {(auth.priceSettings?.categoryDiscounts || []).map((cd, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                      >
                        {cd.category}: {(cd.discount * 100).toFixed(0)}折
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {/* 创建授权模态框 */}
      {showCreateModal && (
        <CreateAuthorizationModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadAuthorizations()
          }}
        />
      )}

      {showApplyModal && (
        <DesignerApplyAuthorizationModal
          token={token || ''}
          onClose={() => setShowApplyModal(false)}
          onSuccess={() => {
            setShowApplyModal(false)
            setActiveTab('my_requests')
            loadAuthorizations()
          }}
        />
      )}

      {showFolderModal && (
        <FolderSelectionModal
          categories={categories}
          onClose={() => {
            setShowFolderModal(false)
            setSelectedAuthId('')
          }}
          onSave={handleSaveFolder}
        />
      )}

      {showDetailModal && (
        <AuthorizationDetailModal
          authorization={detailAuth}
          categories={categories}
          loading={loadingAuthDetail}
          onClose={() => {
            setShowDetailModal(false)
            setDetailAuth(null)
          }}
        />
      )}

      {showEditModal && (
        <AuthorizationEditModal
          authorization={editAuth}
          categories={categories}
          loading={loadingAuthDetail}
          onClose={() => {
            setShowEditModal(false)
            setEditAuth(null)
          }}
          onSaved={() => {
            setShowEditModal(false)
            setEditAuth(null)
            loadAuthorizations()
          }}
        />
      )}

      {/* 审批模态框 */}
      {showApproveModal && approveRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">审批授权申请</h3>
            
            {/* 申请人基本信息 */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">申请方信息</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {approveRequest.authorizationType === 'manufacturer'
                      ? (approveRequest.toManufacturer?.fullName || approveRequest.toManufacturer?.name || '未知厂家')
                      : (approveRequest.toDesigner?.nickname || approveRequest.toDesigner?.username || '未知设计师')}
                  </span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                    {approveRequest.authorizationType === 'manufacturer' ? '企业' : '设计师'}
                  </span>
                </div>
                {approveRequest.toDesigner?.phone && (
                  <div className="text-sm text-gray-600">电话: {approveRequest.toDesigner.phone}</div>
                )}
                {approveRequest.toDesigner?.email && (
                  <div className="text-sm text-gray-600">邮箱: {approveRequest.toDesigner.email}</div>
                )}
              </div>
            </div>

            {/* 身份证明文件 */}
            {(approveRequest as any).userProfile && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-900 mb-3">身份证明文件</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {approveRequest.authorizationType === 'manufacturer' && (approveRequest as any).userProfile?.businessLicense && (
                    <div>
                      <div className="text-xs text-gray-600 mb-2">营业执照</div>
                      <img 
                        src={(approveRequest as any).userProfile.businessLicense} 
                        alt="营业执照" 
                        className="w-full h-48 object-contain bg-white rounded border cursor-pointer hover:opacity-80"
                        onClick={() => window.open((approveRequest as any).userProfile.businessLicense, '_blank')}
                      />
                    </div>
                  )}
                  {approveRequest.authorizationType === 'designer' && (approveRequest as any).userProfile?.workId && (
                    <div>
                      <div className="text-xs text-gray-600 mb-2">工作证</div>
                      <img 
                        src={(approveRequest as any).userProfile.workId} 
                        alt="工作证" 
                        className="w-full h-48 object-contain bg-white rounded border cursor-pointer hover:opacity-80"
                        onClick={() => window.open((approveRequest as any).userProfile.workId, '_blank')}
                      />
                    </div>
                  )}
                  {(approveRequest as any).userProfile?.idCard && (
                    <div>
                      <div className="text-xs text-gray-600 mb-2">身份证</div>
                      <img 
                        src={(approveRequest as any).userProfile.idCard} 
                        alt="身份证" 
                        className="w-full h-48 object-contain bg-white rounded border cursor-pointer hover:opacity-80"
                        onClick={() => window.open((approveRequest as any).userProfile.idCard, '_blank')}
                      />
                    </div>
                  )}
                </div>
                {!(approveRequest as any).userProfile?.businessLicense && !(approveRequest as any).userProfile?.workId && (
                  <div className="text-sm text-gray-500 italic">暂无上传身份证明文件</div>
                )}
              </div>
            )}
            
            {/* 分层体系设置 */}
            <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-sm font-medium text-purple-900 mb-3">分层体系设置</div>
              
              {/* 层级类型选择 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">层级类型</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={tierType === 'new_company'}
                      onChange={() => setTierType('new_company')}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm">新建公司</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={tierType === 'existing_tier'}
                      onChange={() => setTierType('existing_tier')}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm">插入现有层级</span>
                  </label>
                </div>
              </div>
              
              {/* 新建公司 */}
              {tierType === 'new_company' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    公司名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={tierCompanyName}
                    onChange={(e) => setTierCompanyName(e.target.value)}
                    className="input w-full"
                    placeholder="请输入公司名称"
                  />
                  <p className="text-xs text-gray-500 mt-1">将创建一个新的顶级公司层级</p>
                </div>
              )}
              
              {/* 插入现有层级 */}
              {tierType === 'existing_tier' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择父级授权 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={parentAuthId}
                      onChange={(e) => setParentAuthId(e.target.value)}
                      className="input w-full"
                    >
                      <option value="">请选择父级授权</option>
                      {availableParentAuths.map((auth) => (
                        <option key={auth._id} value={auth._id}>
                          {auth.tierCompanyName || '未命名'} (层级 {auth.tierLevel || 0})
                          {auth.toDesigner && ` - ${auth.toDesigner.nickname || auth.toDesigner.username}`}
                          {auth.toManufacturer && ` - ${auth.toManufacturer.name}`}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">将作为所选授权的下级层级</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      层级名称
                    </label>
                    <input
                      type="text"
                      value={tierCompanyName}
                      onChange={(e) => setTierCompanyName(e.target.value)}
                      className="input w-full"
                      placeholder="可选，留空将自动生成"
                    />
                  </div>
                </div>
              )}
              
              {/* 是否允许下级授权 */}
              <div className="mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowSubAuth}
                    onChange={(e) => setAllowSubAuth(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm text-gray-700">允许该用户继续向下级授权</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  勾选后，该用户可以创建自己的下级授权层级
                </p>
              </div>
            </div>
            
            {/* 折扣和返佣设置 */}
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  折扣比例 (%)
                </label>
                <input
                  type="number"
                  value={approveDiscount}
                  onChange={(e) => setApproveDiscount(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                  className="input w-full"
                  min="0"
                  max="100"
                  placeholder="如85表示85折"
                />
                <p className="text-xs text-gray-500 mt-1">授权方给申请方的折扣，如85表示可享受85折</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  返佣比例 (%)
                </label>
                <input
                  type="number"
                  value={approveCommission}
                  onChange={(e) => setApproveCommission(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                  className="input w-full"
                  min="0"
                  max="100"
                  placeholder="如5表示5%返佣"
                />
                <p className="text-xs text-gray-500 mt-1">申请方销售后可获得的返佣比例</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setShowApproveModal(false)
                  setApproveRequest(null)
                }}
                className="btn btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleApproveRequest}
                className="btn btn-primary bg-green-600 hover:bg-green-700"
              >
                确认通过
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AuthorizationDetailModal({
  authorization,
  categories,
  loading,
  onClose
}: {
  authorization: Authorization | null
  categories: any[]
  loading: boolean
  onClose: () => void
}) {
  const getCategoryName = (idOrObj: any) => {
    const id = typeof idOrObj === 'string' ? idOrObj : (idOrObj?._id || idOrObj?.id)
    if (!id) return ''
    const match = categories.find((c) => String(c._id) === String(id) || String(c.slug) === String(id))
    return match?.name || String(id)
  }

  const auth = authorization
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">授权详情</h2>
          <button onClick={onClose} className="btn btn-secondary">关闭</button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-500">加载中...</p>
            </div>
          ) : !auth ? (
            <div className="text-sm text-gray-500">暂无数据</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500">授权方</div>
                  <div className="text-sm text-gray-900 mt-1">{auth.fromManufacturer?.name || auth.fromManufacturer?.fullName || '-'}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500">被授权方</div>
                  <div className="text-sm text-gray-900 mt-1">
                    {auth.authorizationType === 'manufacturer'
                      ? (auth.toManufacturer?.name || auth.toManufacturer?.fullName || '-')
                      : (auth.toDesigner?.nickname || auth.toDesigner?.username || '-')}
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium text-gray-900 mb-2">授权范围</div>
                <div className="text-sm text-gray-700">
                  <div>scope: {auth.scope}</div>
                  {(auth.categories || []).length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 mb-1">分类</div>
                      <div className="flex flex-wrap gap-2">
                        {(auth.categories || []).map((c: any) => (
                          <span key={String(c?._id || c)} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                            {getCategoryName(c)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(auth.products || []).length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs text-gray-500 mb-2">授权商品 ({(auth.products || []).length}个)</div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                        {(auth.products || []).slice(0, 30).map((p: any) => (
                          <div key={String(p?._id || p)} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            {p?.thumbnail && (
                              <img 
                                src={p.thumbnail.startsWith('http') ? p.thumbnail : `/api/files/${p.thumbnail}`} 
                                alt={p?.name || ''} 
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-900 truncate">{p?.name || p?.productCode || String(p?._id || p)}</div>
                              {p?.productCode && <div className="text-xs text-gray-500">{p.productCode}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                      {(auth.products || []).length > 30 && (
                        <div className="text-xs text-gray-500 mt-2">仅展示前 30 个商品，共 {(auth.products || []).length} 个</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium text-gray-900 mb-2">折扣/价格设置</div>
                <div className="text-sm text-gray-700">
                  <div>全局折扣: {(((auth.priceSettings?.globalDiscount ?? 1) as number) * 100).toFixed(0)}折</div>
                  {(auth.priceSettings?.categoryDiscounts || []).length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 mb-1">分类折扣</div>
                      <div className="flex flex-wrap gap-2">
                        {(auth.priceSettings?.categoryDiscounts || []).map((cd: any, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                            {getCategoryName(cd.category)}: {((cd.discount ?? 1) * 100).toFixed(0)}折
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(auth.priceSettings?.productPrices || []).length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs text-gray-500 mb-1">单品设置</div>
                      <div className="space-y-1">
                        {(auth.priceSettings?.productPrices || []).slice(0, 50).map((pp: any, idx: number) => (
                          <div key={idx} className="text-sm text-gray-700">
                            {String(pp.productId)} — 折扣 {((pp.discount ?? 1) * 100).toFixed(0)}折{pp.price ? `，固定价 ${pp.price}` : ''}
                          </div>
                        ))}
                        {(auth.priceSettings?.productPrices || []).length > 50 && (
                          <div className="text-xs text-gray-500">仅展示前 50 条单品设置</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AuthorizationEditModal({
  authorization,
  categories,
  loading,
  onClose,
  onSaved
}: {
  authorization: Authorization | null
  categories: any[]
  loading: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const auth = authorization
  const [saving, setSaving] = useState(false)
  const [globalDiscount, setGlobalDiscount] = useState<number>(auth?.priceSettings?.globalDiscount ?? 1)
  const [categoryDiscounts, setCategoryDiscounts] = useState<Array<{ category: string; discount: number }>>(
    (auth?.priceSettings?.categoryDiscounts || []).map((cd: any) => ({
      category: String(cd.category?._id || cd.category || ''),
      discount: Number(cd.discount ?? 1),
    }))
  )

  useEffect(() => {
    setGlobalDiscount(auth?.priceSettings?.globalDiscount ?? 1)
    setCategoryDiscounts(
      (auth?.priceSettings?.categoryDiscounts || []).map((cd: any) => ({
        category: String(cd.category?._id || cd.category || ''),
        discount: Number(cd.discount ?? 1),
      }))
    )
  }, [auth?._id])

  const addCategoryDiscount = () => {
    setCategoryDiscounts((prev) => [...prev, { category: '', discount: globalDiscount }])
  }

  const updateCategoryDiscount = (idx: number, next: Partial<{ category: string; discount: number }>) => {
    setCategoryDiscounts((prev) => prev.map((row, i) => (i === idx ? { ...row, ...next } : row)))
  }

  const removeCategoryDiscount = (idx: number) => {
    setCategoryDiscounts((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSave = async () => {
    if (!auth?._id) return

    const cleanedCategoryDiscounts = categoryDiscounts
      .filter((cd) => cd.category)
      .map((cd) => ({ category: cd.category, discount: cd.discount }))

    try {
      setSaving(true)
      const resp = await apiClient.put(`/authorizations/${auth._id}`, {
        priceSettings: {
          globalDiscount,
          categoryDiscounts: cleanedCategoryDiscounts,
          productPrices: auth?.priceSettings?.productPrices || [],
        }
      })
      const data = resp.data
      if (data?.success) {
        toast.success('已保存')
        onSaved()
      } else {
        toast.error(data?.message || '保存失败')
      }
    } catch (e) {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">编辑授权</h2>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-secondary" disabled={saving}>取消</button>
            <button onClick={handleSave} className="btn btn-primary" disabled={saving || loading || !auth}>保存</button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-500">加载中...</p>
            </div>
          ) : !auth ? (
            <div className="text-sm text-gray-500">暂无数据</div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium text-gray-900 mb-3">全局折扣</div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0.5"
                    max="1"
                    step="0.05"
                    value={globalDiscount}
                    onChange={(e) => setGlobalDiscount(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="w-20 text-right text-sm text-gray-700">{(globalDiscount * 100).toFixed(0)}折</div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-gray-900">分类折扣</div>
                  <button type="button" onClick={addCategoryDiscount} className="btn btn-secondary">新增</button>
                </div>
                {categoryDiscounts.length === 0 ? (
                  <div className="text-sm text-gray-500">暂无分类折扣</div>
                ) : (
                  <div className="space-y-3">
                    {categoryDiscounts.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-7">
                          <select
                            value={row.category}
                            onChange={(e) => updateCategoryDiscount(idx, { category: e.target.value })}
                            className="input w-full"
                          >
                            <option value="">-- 选择分类 --</option>
                            {categories.map((c: any) => (
                              <option key={String(c._id)} value={String(c._id)}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-4 flex items-center gap-3">
                          <input
                            type="range"
                            min="0.5"
                            max="1"
                            step="0.05"
                            value={row.discount}
                            onChange={(e) => updateCategoryDiscount(idx, { discount: parseFloat(e.target.value) })}
                            className="w-full"
                          />
                          <div className="w-16 text-right text-sm text-gray-700">{(row.discount * 100).toFixed(0)}折</div>
                        </div>
                        <div className="md:col-span-1">
                          <button type="button" onClick={() => removeCategoryDiscount(idx)} className="btn btn-secondary w-full">删</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium text-gray-900 mb-2">单品设置</div>
                {(auth.priceSettings?.productPrices || []).length === 0 ? (
                  <div className="text-sm text-gray-500">暂无单品设置（当前版本仅展示/保留已有设置）</div>
                ) : (
                  <div className="text-sm text-gray-700">已存在 {(auth.priceSettings?.productPrices || []).length} 条单品设置（当前版本仅展示/保留已有设置）</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DesignerApplyAuthorizationModal({
  token,
  onClose,
  onSuccess
}: {
  token: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [manufacturers, setManufacturers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ manufacturerId: '', notes: '' })

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/manufacturers?pageSize=200`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()
        if (data.success || data.data) {
          setManufacturers(data.data || [])
        }
      } catch (e) {
        setManufacturers([])
      }
    }
    load()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.manufacturerId) {
      toast.error('请选择厂家')
      return
    }
    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/authorizations/designer-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ manufacturerId: form.manufacturerId, notes: form.notes })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('申请已提交')
        onSuccess()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('申请失败:', error)
      toast.error('申请失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">申请厂家授权</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">选择厂家</label>
            <select
              value={form.manufacturerId}
              onChange={(e) => setForm({ ...form, manufacturerId: e.target.value })}
              className="input w-full"
              required
            >
              <option value="">-- 请选择厂家 --</option>
              {manufacturers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.fullName || m.name} {m.shortName ? `[${m.shortName}]` : ''} {m.code ? `- ${m.code}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">备注（可选）</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input w-full"
              rows={3}
              placeholder="说明你的合作需求..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '提交中...' : '提交申请'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 创建授权模态框组件
function CreateAuthorizationModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { token } = useAuthStore()
  const [manufacturers, setManufacturers] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [manufacturerProducts, setManufacturerProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    authorizationType: 'manufacturer',
    toManufacturer: '',
    toDesigner: '',
    scope: 'all',
    categories: [] as string[],
    products: [] as string[],
    globalDiscount: 0.85,
    validUntil: '',
    notes: ''
  })

  // 加载厂家列表
  useEffect(() => {
    const loadManufacturers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/manufacturers?pageSize=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()
        if (data.success || data.data) {
          setManufacturers(data.data || [])
        }
      } catch (error) {
        console.error('加载厂家列表失败:', error)
      }
    }
    loadManufacturers()
  }, [token])

  // 加载系统分类
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()
        if (data.success || data.data) {
          setCategories(data.data || [])
        }
      } catch (error) {
        console.error('加载分类失败:', error)
      }
    }
    loadCategories()
  }, [token])

  // 当选择厂家后，加载该厂家的商品分类
  useEffect(() => {
    if (formData.toManufacturer) {
      const loadManufacturerProducts = async () => {
        setLoading(true)
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || '/api'}/products?manufacturer=${formData.toManufacturer}&pageSize=200`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          )
          const data = await response.json()
          if (data.success || data.data) {
            setManufacturerProducts(data.data || [])
          }
        } catch (error) {
          console.error('加载厂家商品失败:', error)
        } finally {
          setLoading(false)
        }
      }
      loadManufacturerProducts()
    }
  }, [formData.toManufacturer, token])

  // 获取该厂家商品的分类列表（包含分类名称和商品数量）
  const getManufacturerCategories = () => {
    const categoryMap = new Map<string, { id: string; name: string; count: number; parentId?: string }>()
    
    manufacturerProducts.forEach(product => {
      if (product.category) {
        const catId = typeof product.category === 'object' ? product.category._id : product.category
        if (!categoryMap.has(catId)) {
          // 从分类列表中查找分类名称
          const categoryInfo = categories.find(c => c._id === catId || c.slug === catId)
          categoryMap.set(catId, {
            id: catId,
            name: categoryInfo?.name || catId,
            count: 1,
            parentId: categoryInfo?.parentId || categoryInfo?.parent
          })
        } else {
          categoryMap.get(catId)!.count++
        }
      }
    })
    
    return Array.from(categoryMap.values())
  }

  // 构建树状分类结构
  const buildCategoryTree = (cats: { id: string; name: string; count: number; parentId?: string }[]) => {
    const rootCats: typeof cats = []
    const childMap = new Map<string, typeof cats>()
    
    // 分离根分类和子分类
    cats.forEach(cat => {
      if (!cat.parentId) {
        rootCats.push(cat)
      } else {
        if (!childMap.has(cat.parentId)) {
          childMap.set(cat.parentId, [])
        }
        childMap.get(cat.parentId)!.push(cat)
      }
    })
    
    return { rootCats, childMap }
  }

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const handleProductToggle = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.includes(productId)
        ? prev.products.filter(p => p !== productId)
        : [...prev.products, productId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.toManufacturer && formData.authorizationType === 'manufacturer') {
      toast.error('请选择目标厂家')
      return
    }
    if (formData.scope === 'category' && formData.categories.length === 0) {
      toast.error('请至少选择一个商品分类')
      return
    }
    if (formData.scope === 'specific' && formData.products.length === 0) {
      toast.error('请至少选择一个商品')
      return
    }
    
    const payload = {
      authorizationType: formData.authorizationType,
      ...(formData.authorizationType === 'manufacturer' 
        ? { toManufacturer: formData.toManufacturer }
        : { toDesigner: formData.toDesigner }),
      scope: formData.scope,
      categories: formData.scope === 'category' ? formData.categories : undefined,
      products: formData.scope === 'specific' ? formData.products : undefined,
      priceSettings: {
        globalDiscount: formData.globalDiscount
      },
      validUntil: formData.validUntil || undefined,
      notes: formData.notes
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/authorizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (data.success) {
        toast.success('授权创建成功')
        onSuccess()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('创建授权失败:', error)
      toast.error('创建授权失败')
    }
  }

  const manufacturerCategories = getManufacturerCategories()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">创建授权</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 授权类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              授权类型
            </label>
            <select
              value={formData.authorizationType}
              onChange={(e) => setFormData({ ...formData, authorizationType: e.target.value as any })}
              className="input w-full"
              required
            >
              <option value="manufacturer">授权给厂家</option>
              <option value="designer">授权给设计师</option>
            </select>
          </div>

          {/* 目标厂家选择 */}
          {formData.authorizationType === 'manufacturer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择目标厂家 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.toManufacturer}
                onChange={(e) => setFormData({ ...formData, toManufacturer: e.target.value, categories: [], products: [] })}
                className="input w-full"
                required
              >
                <option value="">-- 请选择厂家 --</option>
                {manufacturers.map(m => (
                  <option key={m._id} value={m._id}>
                    {m.fullName || m.name} {m.shortName && `[${m.shortName}]`} {m.code && `- ${m.code}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 目标设计师输入 */}
          {formData.authorizationType === 'designer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                目标设计师ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.toDesigner}
                onChange={(e) => setFormData({ ...formData, toDesigner: e.target.value })}
                className="input w-full"
                placeholder="请输入设计师ID"
                required
              />
            </div>
          )}

          {/* 授权范围 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              授权范围
            </label>
            <select
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value as any, categories: [], products: [] })}
              className="input w-full"
            >
              <option value="all">全部商品</option>
              <option value="category">按分类授权</option>
              <option value="specific">指定商品授权</option>
            </select>
          </div>

          {/* 分类选择（当选择按分类授权时显示） */}
          {formData.scope === 'category' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择商品分类 <span className="text-red-500">*</span>
              </label>
              {loading ? (
                <p className="text-sm text-gray-500">加载中...</p>
              ) : manufacturerCategories.length > 0 ? (
                <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                  {(() => {
                    const { rootCats, childMap } = buildCategoryTree(manufacturerCategories)
                    
                    // 渲染分类项（树状结构）
                    const renderCategory = (cat: typeof manufacturerCategories[0], level: number = 0) => {
                      const children = childMap.get(cat.id) || []
                      return (
                        <div key={cat.id} style={{ marginLeft: level * 16 }}>
                          <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={formData.categories.includes(cat.id)}
                              onChange={() => handleCategoryToggle(cat.id)}
                              className="rounded text-primary"
                            />
                            <span className="text-sm font-medium">{cat.name}</span>
                            <span className="text-xs text-gray-400">
                              ({cat.count}个商品)
                            </span>
                          </label>
                          {children.length > 0 && (
                            <div className="border-l-2 border-gray-100 ml-2">
                              {children.map(child => renderCategory(child, level + 1))}
                            </div>
                          )}
                        </div>
                      )
                    }
                    
                    return rootCats.map(cat => renderCategory(cat))
                  })()}
                </div>
              ) : (
                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                  {formData.toManufacturer ? '该厂家暂无商品分类' : '请先选择厂家'}
                </p>
              )}
              {formData.categories.length > 0 && (
                <p className="text-xs text-primary mt-2">
                  已选择 {formData.categories.length} 个分类
                </p>
              )}
            </div>
          )}

          {/* 商品选择（当选择指定商品授权时显示） */}
          {formData.scope === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择商品 <span className="text-red-500">*</span>
              </label>
              {loading ? (
                <p className="text-sm text-gray-500">加载中...</p>
              ) : manufacturerProducts.length > 0 ? (
                <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {manufacturerProducts.map(product => (
                      <label key={product._id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={formData.products.includes(product._id)}
                          onChange={() => handleProductToggle(product._id)}
                          className="rounded text-primary"
                        />
                        <img src={product.images?.[0] || '/placeholder.png'} alt="" className="w-10 h-10 object-cover rounded" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.category} · ¥{product.basePrice}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                  {formData.toManufacturer ? '该厂家暂无商品' : '请先选择厂家'}
                </p>
              )}
              {formData.products.length > 0 && (
                <p className="text-xs text-primary mt-2">
                  已选择 {formData.products.length} 个商品
                </p>
              )}
            </div>
          )}

          {/* 全局折扣率 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              全局折扣率 ({(formData.globalDiscount * 100).toFixed(0)}折)
            </label>
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.05"
              value={formData.globalDiscount}
              onChange={(e) => setFormData({ ...formData, globalDiscount: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5折</span>
              <span>原价</span>
            </div>
          </div>

          {/* 有效期 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              有效期（可选）
            </label>
            <input
              type="date"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              className="input w-full"
            />
            <p className="text-xs text-gray-500 mt-1">留空表示永久有效</p>
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              备注说明（可选）
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input w-full"
              rows={3}
              placeholder="添加备注信息..."
            />
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              创建授权
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
