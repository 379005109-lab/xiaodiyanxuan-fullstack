import { useState } from 'react'
import { Download, Eye, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface DesignRequest {
  id: string
  userName: string
  userPhone: string
  userEmail?: string
  description: string
  images: string[]
  status: 'pending' | 'in_progress' | 'completed' | 'rejected'
  createdAt: string
  updatedAt: string
  notes?: string
}

export default function DesignManagement() {
  const [designRequests, setDesignRequests] = useState<DesignRequest[]>([
    {
      id: '1',
      userName: '张三',
      userPhone: '13800138000',
      userEmail: 'zhangsan@example.com',
      description: '三室两厅，现代简约风格，预算 5-8 万，家里有宠物',
      images: ['https://via.placeholder.com/200x200?text=Image1'],
      status: 'pending',
      createdAt: '2024-11-20 10:30',
      updatedAt: '2024-11-20 10:30',
      notes: ''
    },
    {
      id: '2',
      userName: '李四',
      userPhone: '13900139000',
      userEmail: 'lisi@example.com',
      description: '两室一厅，北欧风格，预算 3-5 万',
      images: ['https://via.placeholder.com/200x200?text=Image2', 'https://via.placeholder.com/200x200?text=Image3'],
      status: 'in_progress',
      createdAt: '2024-11-19 15:45',
      updatedAt: '2024-11-20 09:00',
      notes: '已分配给设计师王五'
    }
  ])

  const [selectedRequest, setSelectedRequest] = useState<DesignRequest | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'rejected'>('all')
  const [notes, setNotes] = useState<string>('')

  const filteredRequests = filterStatus === 'all'
    ? designRequests
    : designRequests.filter(r => r.status === filterStatus)

  const handleStatusChange = (id: string, newStatus: DesignRequest['status']) => {
    setDesignRequests(designRequests.map(r =>
      r.id === id ? { ...r, status: newStatus, updatedAt: new Date().toLocaleString() } : r
    ))
  }

  const handleAddNotes = (id: string) => {
    setDesignRequests(designRequests.map(r =>
      r.id === id ? { ...r, notes } : r
    ))
    setNotes('')
    setSelectedRequest(null)
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个设计需求吗？')) {
      setDesignRequests(designRequests.filter(r => r.id !== id))
    }
  }

  const getStatusBadge = (status: DesignRequest['status']) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: Clock, label: '待处理' },
      in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', icon: AlertCircle, label: '处理中' },
      completed: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle, label: '已完成' },
      rejected: { bg: 'bg-red-50', text: 'text-red-700', icon: AlertCircle, label: '已拒绝' }
    }
    const config = statusConfig[status]
    const Icon = config.icon
    return (
      <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${config.bg} ${config.text} text-sm font-medium`}>
        <Icon size={14} />
        {config.label}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">设计管理</h1>
          <p className="text-sm text-gray-500">管理用户提交的免费设计需求</p>
        </div>
        <div className="text-sm text-gray-600">
          总计: <span className="font-bold">{designRequests.length}</span> 个需求
        </div>
      </div>

      {/* 筛选器 */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'in_progress', 'completed', 'rejected'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? '全部' : status === 'pending' ? '待处理' : status === 'in_progress' ? '处理中' : status === 'completed' ? '已完成' : '已拒绝'}
            {status !== 'all' && (
              <span className="ml-2 text-xs">
                ({designRequests.filter(r => r.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 列表 */}
      <div className="card overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>暂无设计需求</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">用户信息</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">需求描述</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">图片</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">状态</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">提交时间</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{request.userName}</p>
                        <p className="text-gray-600">{request.userPhone}</p>
                        {request.userEmail && <p className="text-gray-500 text-xs">{request.userEmail}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 line-clamp-2">{request.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {request.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`image-${idx}`}
                            className="w-10 h-10 rounded object-cover cursor-pointer hover:opacity-80"
                            onClick={() => window.open(img, '_blank')}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {request.createdAt}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="查看详情"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(request.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="删除"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 详情模态框 */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">设计需求详情</h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 用户信息 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">用户信息</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">姓名</p>
                    <p className="font-medium">{selectedRequest.userName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">电话</p>
                    <p className="font-medium">{selectedRequest.userPhone}</p>
                  </div>
                  {selectedRequest.userEmail && (
                    <div>
                      <p className="text-sm text-gray-600">邮箱</p>
                      <p className="font-medium">{selectedRequest.userEmail}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 需求描述 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">需求描述</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedRequest.description}</p>
              </div>

              {/* 上传的图片 */}
              {selectedRequest.images.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">上传的图片</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedRequest.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative group cursor-pointer"
                        onClick={() => window.open(img, '_blank')}
                      >
                        <img
                          src={img}
                          alt={`image-${idx}`}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center">
                          <Eye className="text-white opacity-0 group-hover:opacity-100" size={24} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 状态管理 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">状态管理</h3>
                <div className="flex gap-2 flex-wrap">
                  {(['pending', 'in_progress', 'completed', 'rejected'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        handleStatusChange(selectedRequest.id, status)
                        setSelectedRequest({ ...selectedRequest, status })
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedRequest.status === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status === 'pending' ? '待处理' : status === 'in_progress' ? '处理中' : status === 'completed' ? '已完成' : '已拒绝'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 备注 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">备注</h3>
                <textarea
                  value={notes || selectedRequest.notes || ''}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="添加处理备注..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows={4}
                />
              </div>

              {/* 时间信息 */}
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 space-y-1">
                <p>提交时间: {selectedRequest.createdAt}</p>
                <p>更新时间: {selectedRequest.updatedAt}</p>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleAddNotes(selectedRequest.id)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  保存备注
                </button>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
