import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import axios from 'axios'

interface CustomizationRequest {
  _id: string
  name: string
  phone: string
  email?: string
  productType: string
  description: string
  budget?: string
  images?: string[]
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  createdAt: string
}

export default function CustomizationManagement() {
  const [requests, setRequests] = useState<CustomizationRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/customization', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRequests(response.data.data || [])
    } catch (error) {
      console.error('加载定制需求失败:', error)
      toast.error('加载定制需求失败')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token')
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
      const token = localStorage.getItem('token')
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
    processing: { label: '处理中', color: 'bg-blue-100 text-blue-800' },
    completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
    rejected: { label: '已拒绝', color: 'bg-red-100 text-red-800' },
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户信息</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">产品类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">需求描述</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">预算</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">提交时间</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.map((req) => (
                <tr key={req._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{req.name}</div>
                    <div className="text-sm text-gray-500">{req.phone}</div>
                    {req.email && <div className="text-sm text-gray-500">{req.email}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{req.productType}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={req.description}>
                      {req.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{req.budget || '-'}</td>
                  <td className="px-6 py-4">
                    <select
                      value={req.status}
                      onChange={(e) => updateStatus(req._id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full ${statusMap[req.status].color}`}
                    >
                      <option value="pending">待处理</option>
                      <option value="processing">处理中</option>
                      <option value="completed">已完成</option>
                      <option value="rejected">已拒绝</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(req.createdAt).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <button
                      onClick={() => deleteRequest(req._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
