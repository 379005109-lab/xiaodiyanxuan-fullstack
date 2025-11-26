import { useState, useEffect } from 'react'
import { Package, User, Calendar, Phone, Mail, MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import axios from '@/lib/apiClient'

interface BuyingServiceRequest {
  _id: string
  user: {
    _id: string
    name: string
    phone: string
    email?: string
  }
  serviceType: 'standard' | 'expert'
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function BuyingServiceRequestsPage() {
  const [requests, setRequests] = useState<BuyingServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('')

  useEffect(() => {
    loadRequests()
  }, [filterStatus])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (filterStatus) {
        params.status = filterStatus
      }
      
      const response = await axios.get('/buying-service-requests', { params })
      console.log('✅ 陪买服务请求列表:', response.data)
      
      setRequests(response.data || [])
    } catch (error: any) {
      console.error('❌ 加载陪买服务请求失败:', error)
      if (error.response?.data?.message) {
        toast.error('加载失败：' + error.response.data.message)
      } else {
        toast.error('加载失败')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      await axios.put(`/buying-service-requests/${requestId}/status`, { status: newStatus })
      toast.success('状态更新成功')
      loadRequests()
    } catch (error) {
      console.error('更新状态失败:', error)
      toast.error('更新失败')
    }
  }

  const getServiceTypeText = (type: string) => {
    return type === 'standard' ? '基础陪买服务' : '专家定制陪买'
  }

  const getServiceTypePrice = (type: string) => {
    return type === 'standard' ? '¥1,000' : '¥5,000'
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      pending: { label: '待确认', color: 'bg-orange-100 text-orange-800', icon: <Clock className="w-4 h-4" /> },
      confirmed: { label: '已确认', color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="w-4 h-4" /> },
      completed: { label: '已完成', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
      cancelled: { label: '已取消', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> },
    }
    return configs[status] || configs.pending
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">加载中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Package className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900">陪买服务需求</h1>
        </div>
        <p className="text-gray-600">管理用户的陪买服务预约请求</p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">状态筛选：</span>
          <div className="flex gap-2">
            {[
              { value: '', label: '全部' },
              { value: 'pending', label: '待确认' },
              { value: 'confirmed', label: '已确认' },
              { value: 'completed', label: '已完成' },
              { value: 'cancelled', label: '已取消' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilterStatus(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === option.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium mb-2">暂无陪买服务请求</p>
          <p className="text-gray-400 text-sm">用户预约后将在此显示</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const statusConfig = getStatusConfig(request.status)
            return (
              <div
                key={request._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                      {statusConfig.icon}
                      {statusConfig.label}
                    </div>
                    <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      {getServiceTypeText(request.serviceType)} - {getServiceTypePrice(request.serviceType)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(request.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">客户姓名</p>
                      <p className="font-medium text-gray-900">{request.user.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">联系电话</p>
                      <p className="font-medium text-gray-900">{request.user.phone}</p>
                    </div>
                  </div>
                  {request.user.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">电子邮箱</p>
                        <p className="font-medium text-gray-900">{request.user.email}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">预约时间</p>
                      <p className="font-medium text-gray-900">
                        {new Date(request.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                </div>

                {request.notes && (
                  <div className="flex items-start gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">备注信息</p>
                      <p className="text-gray-700">{request.notes}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(request._id, 'confirmed')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        确认预约
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(request._id, 'cancelled')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        取消预约
                      </button>
                    </>
                  )}
                  {request.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusUpdate(request._id, 'completed')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      标记完成
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
