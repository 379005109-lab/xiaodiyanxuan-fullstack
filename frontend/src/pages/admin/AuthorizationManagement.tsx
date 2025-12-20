import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Plus, Users, Eye, Edit2, Trash2, AlertCircle, CheckCircle, XCircle, Copy } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

interface Authorization {
  _id: string
  fromManufacturer: any
  toManufacturer?: any
  toDesigner?: any
  authorizationType: 'manufacturer' | 'designer'
  scope: 'all' | 'category' | 'specific'
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
  createdAt: string
  updatedAt: string
}

export default function AuthorizationManagement() {
  const { token, user } = useAuthStore()
  const isDesigner = user?.role === 'designer'
  const isManufacturerUser = !!(user as any)?.manufacturerId

  type TabKey = 'granted' | 'received' | 'pending_requests' | 'my_requests'
  const [activeTab, setActiveTab] = useState<TabKey>('received')
  const [grantedAuths, setGrantedAuths] = useState<Authorization[]>([])
  const [receivedAuths, setReceivedAuths] = useState<Authorization[]>([])
  const [pendingRequests, setPendingRequests] = useState<Authorization[]>([])
  const [myRequests, setMyRequests] = useState<Authorization[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const [showApplyModal, setShowApplyModal] = useState(false)

  const didInitTab = useRef(false)

  useEffect(() => {
    if (didInitTab.current) return
    if (!user) return
    const desired: TabKey = isDesigner ? 'received' : (isManufacturerUser ? 'granted' : 'received')
    setActiveTab(desired)
    didInitTab.current = true
  }, [user, isDesigner, isManufacturerUser])

  useEffect(() => {
    loadAuthorizations()
  }, [activeTab])

  const loadAuthorizations = async () => {
    setLoading(true)
    try {
      const endpoint =
        activeTab === 'granted'
          ? '/api/authorizations/my-grants'
          : activeTab === 'received'
            ? '/api/authorizations/received'
            : activeTab === 'pending_requests'
              ? '/api/authorizations/designer-requests/pending'
              : '/api/authorizations/designer-requests/my'
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (data.success) {
        if (activeTab === 'granted') setGrantedAuths(data.data)
        else if (activeTab === 'received') setReceivedAuths(data.data)
        else if (activeTab === 'pending_requests') setPendingRequests(data.data)
        else setMyRequests(data.data)
      } else {
        toast.error(data.message)
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

  const handleApproveRequest = async (id: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/authorizations/designer-requests/${id}/approve`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({})
        }
      )
      const data = await response.json()
      if (data.success) {
        toast.success('已通过')
        loadAuthorizations()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('审核失败:', error)
      toast.error('审核失败')
    }
  }

  const handleRejectRequest = async (id: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/authorizations/designer-requests/${id}/reject`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({})
        }
      )
      const data = await response.json()
      if (data.success) {
        toast.success('已拒绝')
        loadAuthorizations()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('拒绝失败:', error)
      toast.error('拒绝失败')
    }
  }

  const handleRevoke = async (id: string) => {
    if (!confirm('确定要撤销此授权吗？')) return
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/authorizations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success('授权已撤销')
        loadAuthorizations()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('撤销授权失败:', error)
      toast.error('撤销授权失败')
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
    return `指定商品 (${productsCount}个)`
  }

  const authorizations = activeTab === 'granted' ? grantedAuths : receivedAuths
  const tabCounts: Record<TabKey, number> = {
    granted: grantedAuths.length,
    received: receivedAuths.length,
    pending_requests: pendingRequests.length,
    my_requests: myRequests.length
  }

  const tabs: Array<{ id: TabKey; label: string; visible: boolean }> = [
    { id: 'granted', label: '我授权的', visible: !isDesigner && isManufacturerUser },
    { id: 'received', label: '我收到的授权', visible: true },
    { id: 'pending_requests', label: '待审核申请', visible: !isDesigner && isManufacturerUser },
    { id: 'my_requests', label: '我的申请', visible: isDesigner }
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
                        设计师: {req.toDesigner?.nickname || req.toDesigner?.username || '未知'}
                      </h3>
                      {getStatusBadge(req.status)}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="font-mono">ID: {req.toDesigner?._id || req.toDesigner}</span>
                      <button
                        onClick={() => copyText(String(req.toDesigner?._id || req.toDesigner || ''))}
                        className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                        title="复制ID"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    {req.notes && (
                      <p className="mt-2 text-sm text-gray-500">{req.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveRequest(req._id)}
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
      ) : activeTab === 'my_requests' ? (
        <div>
          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">我的设计师ID</div>
              <div className="font-mono text-gray-900">{String((user as any)?._id || '')}</div>
            </div>
            <button
              onClick={() => copyText(String((user as any)?._id || ''))}
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
                    <span>全局折扣: {(auth.priceSettings.globalDiscount * 100).toFixed(0)}折</span>
                    {auth.validUntil && (
                      <>
                        <span>•</span>
                        <span>有效期至: {new Date(auth.validUntil).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                  {auth.notes && (
                    <p className="mt-2 text-sm text-gray-500">{auth.notes}</p>
                  )}
                </div>
                
                {activeTab === 'granted' && (
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="查看详情"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
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
              </div>

              {/* 价格设置详情 */}
              {auth.priceSettings.categoryDiscounts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">分类折扣设置</h4>
                  <div className="flex flex-wrap gap-2">
                    {auth.priceSettings.categoryDiscounts.map((cd, idx) => (
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
