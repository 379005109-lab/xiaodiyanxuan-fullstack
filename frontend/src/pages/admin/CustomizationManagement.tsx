import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

interface CustomizationRequest {
  _id: string
  contactName: string
  contactPhone: string
  contactEmail?: string
  productType: string
  customizationDetails: string
  dimensions?: string
  materials?: string
  colors?: string
  budget?: number
  images?: string[]
  status: 'pending' | 'contacted' | 'quoted' | 'confirmed' | 'in_production' | 'completed' | 'cancelled'
  createdAt: string
  productId?: string
}

export default function CustomizationManagement() {
  const [requests, setRequests] = useState<CustomizationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<CustomizationRequest | null>(null)
  const { token } = useAuthStore()

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      if (!token) {
        toast.error('请先登录')
        return
      }
      console.log('📋 [CustomizationManagement] 加载定制需求...')
      const response = await axios.get('/api/customization', {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('✅ [CustomizationManagement] 加载成功:', response.data)
      setRequests(response.data.data || [])
    } catch (error: any) {
      console.error('❌ [CustomizationManagement] 加载失败:', error)
      console.error('错误详情:', error.response?.data)
      toast.error('加载定制需求失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      if (!token) {
        toast.error('请先登录')
        return
      }
      await axios.put(`/api/customization/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('状态已更新')
      loadRequests()
    } catch (error) {
      console.error('更新状态失败:', error)
      toast.error('更新状态失败')
    }
  }

  const deleteRequest = async (id: string) => {
    if (!confirm('确定要删除这条定制需求吗？')) return
    
    try {
      if (!token) {
        toast.error('请先登录')
        return
      }
      await axios.delete(`/api/customization/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('已删除')
      loadRequests()
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败')
    }
  }

  const statusMap = {
    pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-800' },
    contacted: { label: '已联系', color: 'bg-blue-100 text-blue-800' },
    quoted: { label: '已报价', color: 'bg-indigo-100 text-indigo-800' },
    confirmed: { label: '已确认', color: 'bg-purple-100 text-purple-800' },
    in_production: { label: '生产中', color: 'bg-orange-100 text-orange-800' },
    completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
    cancelled: { label: '已取消', color: 'bg-red-100 text-red-800' },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">定制化需求管理</h1>
        <p className="text-gray-600 mt-1">管理客户提交的定制化需求</p>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">暂无定制需求</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户信息</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">产品类型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">定制需求</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">提交时间</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{req.contactName}</div>
                      <div className="text-sm text-gray-500">{req.contactPhone}</div>
                      {req.contactEmail && <div className="text-sm text-gray-500">{req.contactEmail}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{req.productType}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {req.dimensions && <div>📏 尺寸: {req.dimensions}</div>}
                        {req.materials && <div>🎨 材质: {req.materials}</div>}
                        {req.colors && <div>🌈 颜色: {req.colors}</div>}
                        {!req.dimensions && !req.materials && !req.colors && (
                          <div className="truncate" title={req.customizationDetails}>
                            {req.customizationDetails}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={req.status}
                        onChange={(e) => updateStatus(req._id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full ${statusMap[req.status].color}`}
                      >
                        <option value="pending">待处理</option>
                        <option value="contacted">已联系</option>
                        <option value="quoted">已报价</option>
                        <option value="confirmed">已确认</option>
                        <option value="in_production">生产中</option>
                        <option value="completed">已完成</option>
                        <option value="cancelled">已取消</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(req.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 text-right text-sm space-x-2">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        查看
                      </button>
                      <button
                        onClick={() => deleteRequest(req._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 详情弹窗 */}
          {selectedRequest && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">定制需求详情</h2>
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">客户姓名</label>
                        <p className="text-gray-900">{selectedRequest.contactName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">联系电话</label>
                        <p className="text-gray-900">{selectedRequest.contactPhone}</p>
                      </div>
                    </div>

                    {selectedRequest.contactEmail && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">邮箱</label>
                        <p className="text-gray-900">{selectedRequest.contactEmail}</p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-600">产品类型</label>
                      <p className="text-gray-900">{selectedRequest.productType}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">详细需求</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedRequest.customizationDetails}</p>
                    </div>

                    {selectedRequest.dimensions && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">尺寸要求</label>
                        <p className="text-gray-900">{selectedRequest.dimensions}</p>
                      </div>
                    )}

                    {selectedRequest.materials && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">材质要求</label>
                        <p className="text-gray-900">{selectedRequest.materials}</p>
                      </div>
                    )}

                    {selectedRequest.colors && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">颜色要求</label>
                        <p className="text-gray-900">{selectedRequest.colors}</p>
                      </div>
                    )}

                    {selectedRequest.budget && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">预算</label>
                        <p className="text-gray-900">¥{selectedRequest.budget}</p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-600">提交时间</label>
                      <p className="text-gray-900">{new Date(selectedRequest.createdAt).toLocaleString('zh-CN')}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">当前状态</label>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm ${statusMap[selectedRequest.status].color}`}>
                        {statusMap[selectedRequest.status].label}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                      关闭
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
