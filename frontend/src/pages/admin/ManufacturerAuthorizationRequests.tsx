import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle, XCircle, ArrowLeft, Users } from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'

interface AuthorizationRequest {
  _id: string
  fromManufacturer: any
  toDesigner: any
  authorizationType: 'designer'
  scope: 'all' | 'category' | 'specific'
  categories: string[]
  products: any[]
  validFrom: string
  validUntil?: string
  status: 'pending' | 'active' | 'suspended' | 'revoked'
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function ManufacturerAuthorizationRequests() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const myManufacturerId = (user as any)?.manufacturerId ? String((user as any).manufacturerId) : ''

  const canAccess = useMemo(() => {
    return !!myManufacturerId
  }, [myManufacturerId])

  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<AuthorizationRequest[]>([])
  const [actingId, setActingId] = useState<string>('')

  const formatDate = (value?: string) => {
    if (!value) return '-'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleDateString()
  }

  const getScopeLabel = (scope: string, categories?: string[], productsCount?: number) => {
    if (scope === 'all') return '全部商品'
    if (scope === 'category') return `分类授权 (${(categories || []).length}个)`
    return `指定商品 (${productsCount || 0}个)`
  }

  const load = async () => {
    if (!canAccess) return
    setLoading(true)
    try {
      const res = await apiClient.get('/authorizations/designer-requests/pending')
      setItems(res.data?.data || [])
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '加载失败')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [canAccess])

  const handleApprove = async (id: string) => {
    setActingId(id)
    try {
      const res = await apiClient.put(`/authorizations/designer-requests/${id}/approve`, {})
      if (res.data?.success) {
        toast.success('已通过')
        await load()
      } else {
        toast.error(res.data?.message || '操作失败')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '通过失败')
    } finally {
      setActingId('')
    }
  }

  const handleReject = async (id: string) => {
    if (!confirm('确定要拒绝该申请吗？')) return
    setActingId(id)
    try {
      const res = await apiClient.put(`/authorizations/designer-requests/${id}/reject`, {})
      if (res.data?.success) {
        toast.success('已拒绝')
        await load()
      } else {
        toast.error(res.data?.message || '操作失败')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '拒绝失败')
    } finally {
      setActingId('')
    }
  }

  if (!canAccess) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">授权申请(待审核)</h1>
            <p className="text-sm text-gray-500 mt-1">仅厂家账号可访问</p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/manufacturers')}>
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
        </div>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          当前账号没有绑定厂家，无法查看待审核申请。请使用厂家账号访问。
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">授权申请(待审核)</h1>
          <p className="text-sm text-gray-500 mt-1">处理设计师提交的商品授权申请</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary" onClick={() => navigate('/admin/manufacturers')}>
            <ArrowLeft className="w-4 h-4" />
            返回厂家列表
          </button>
          <button className="btn btn-secondary" onClick={load} disabled={loading}>
            刷新
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">加载中...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">暂无待审核申请</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((req) => (
            <div key={req._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      设计师: {req.toDesigner?.nickname || req.toDesigner?.username || '未知'}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      待审核
                    </span>
                  </div>

                  <div className="text-sm text-gray-600">
                    <span>范围: {getScopeLabel(req.scope, req.categories, req.products?.length)}</span>
                    <span className="mx-2">•</span>
                    <span>申请时间: {formatDate(req.createdAt)}</span>
                    <span className="mx-2">•</span>
                    <span>有效期: {req.validUntil ? formatDate(req.validUntil) : '永久有效'}</span>
                  </div>

                  {req.notes && (
                    <pre className="mt-3 text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 border border-gray-100">
                      {req.notes}
                    </pre>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(req._id)}
                    disabled={!!actingId}
                    className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {actingId === req._id ? '处理中...' : '通过'}
                  </button>
                  <button
                    onClick={() => handleReject(req._id)}
                    disabled={!!actingId}
                    className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    {actingId === req._id ? '处理中...' : '拒绝'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
