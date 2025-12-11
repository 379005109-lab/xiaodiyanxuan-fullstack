import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Users, Eye, Edit2, Trash2, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
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
  const { token } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'granted' | 'received'>('granted')
  const [grantedAuths, setGrantedAuths] = useState<Authorization[]>([])
  const [receivedAuths, setReceivedAuths] = useState<Authorization[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadAuthorizations()
  }, [activeTab])

  const loadAuthorizations = async () => {
    setLoading(true)
    try {
      const endpoint = activeTab === 'granted' 
        ? '/api/authorizations/my-grants'
        : '/api/authorizations/received'
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (data.success) {
        if (activeTab === 'granted') {
          setGrantedAuths(data.data)
        } else {
          setReceivedAuths(data.data)
        }
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

  return (
    <div className="p-6">
      {/* 页头 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">授权管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理商品授权关系和拿货价格</p>
        </div>
        {activeTab === 'granted' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            创建授权
          </button>
        )}
      </div>

      {/* 标签切换 */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('granted')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'granted'
                ? 'border-primary-600 text-primary-600 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            我授权的
            {grantedAuths.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
                {grantedAuths.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'received'
                ? 'border-primary-600 text-primary-600 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            我收到的授权
            {receivedAuths.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
                {receivedAuths.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 授权列表 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">加载中...</p>
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

              {auth.allowSubAuthorization && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="inline-flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    允许下级授权
                  </span>
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
    </div>
  )
}

// 创建授权模态框组件
function CreateAuthorizationModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { token } = useAuthStore()
  const [formData, setFormData] = useState({
    authorizationType: 'manufacturer',
    toManufacturer: '',
    toDesigner: '',
    scope: 'all',
    categories: [] as string[],
    globalDiscount: 0.85,
    validUntil: '',
    allowSubAuthorization: false,
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const payload = {
      authorizationType: formData.authorizationType,
      ...(formData.authorizationType === 'manufacturer' 
        ? { toManufacturer: formData.toManufacturer }
        : { toDesigner: formData.toDesigner }),
      scope: formData.scope,
      categories: formData.scope === 'category' ? formData.categories : undefined,
      priceSettings: {
        globalDiscount: formData.globalDiscount
      },
      validUntil: formData.validUntil || undefined,
      allowSubAuthorization: formData.allowSubAuthorization,
      notes: formData.notes
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/authorizations`, {
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

          {/* 授权对象 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.authorizationType === 'manufacturer' ? '目标厂家ID' : '目标设计师ID'}
            </label>
            <input
              type="text"
              value={formData.authorizationType === 'manufacturer' ? formData.toManufacturer : formData.toDesigner}
              onChange={(e) => setFormData({
                ...formData,
                [formData.authorizationType === 'manufacturer' ? 'toManufacturer' : 'toDesigner']: e.target.value
              })}
              className="input w-full"
              placeholder="请输入ID"
              required
            />
          </div>

          {/* 授权范围 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              授权范围
            </label>
            <select
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value as any })}
              className="input w-full"
            >
              <option value="all">全部商品</option>
              <option value="category">按分类</option>
              <option value="specific">指定商品</option>
            </select>
          </div>

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

          {/* 允许下级授权 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allowSub"
              checked={formData.allowSubAuthorization}
              onChange={(e) => setFormData({ ...formData, allowSubAuthorization: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="allowSub" className="text-sm text-gray-700">
              允许被授权方继续授权给他人
            </label>
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
