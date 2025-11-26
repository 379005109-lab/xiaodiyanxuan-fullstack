import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, CheckCircle, XCircle, Package } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'

interface CancelRequest {
  _id: string
  orderNo: string
  userId: string
  totalAmount: number
  recipient: {
    name: string
    phone: string
    address: string
  }
  items: any[]
  cancelRequestedAt: string
  createdAt: string
}

export default function OrderCancelRequestsPage() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState<CancelRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCancelRequests()
  }, [])

  const loadCancelRequests = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('请先登录')
        navigate('/')
        return
      }

      const response = await fetch('https://pkochbpmcgaa.sealoshzh.site/api/orders/cancel-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('获取取消请求失败')

      const data = await response.json()
      setRequests(data.data || [])
    } catch (error) {
      console.error('获取取消请求失败:', error)
      toast.error('获取取消请求失败')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (orderId: string) => {
    if (!confirm('确定要批准取消这个订单吗？')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/cancel-approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) throw new Error('批准失败')

      toast.success('已批准取消订单')
      loadCancelRequests()
    } catch (error) {
      console.error('批准失败:', error)
      toast.error('批准失败')
    }
  }

  const handleReject = async (orderId: string) => {
    if (!confirm('确定要拒绝取消这个订单吗？')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/cancel-reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) throw new Error('拒绝失败')

      toast.success('已拒绝取消请求')
      loadCancelRequests()
    } catch (error) {
      console.error('拒绝失败:', error)
      toast.error('拒绝失败')
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">订单取消请求</h1>
        <p className="text-sm text-gray-500 mt-1">管理客户提交的订单取消请求</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无取消请求</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request._id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">订单号: ORD{request.orderNo}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    请求时间: {new Date(request.cancelRequestedAt).toLocaleString('zh-CN')}
                  </p>
                  <p className="text-sm text-gray-500">
                    下单时间: {new Date(request.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-red-600">
                    ¥{request.totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* 收货信息 */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">收货人：</span>{request.recipient?.name || '未填写'}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium">电话：</span>{request.recipient?.phone || '未填写'}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium">地址：</span>{request.recipient?.address || '未填写'}
                </p>
              </div>

              {/* 商品列表 */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">订单商品:</h4>
                <div className="space-y-2">
                  {request.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-3 text-sm">
                      <Package className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">
                        {item.name || item.productName} × {item.quantity || 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleReject(request._id)}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  拒绝取消
                </button>
                <button
                  onClick={() => handleApprove(request._id)}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  批准取消
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
