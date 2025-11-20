import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, RotateCcw, Plus, Eye, Check, X } from 'lucide-react'
import { formatPrice, formatDateTime } from '@/lib/utils'
import { Refund, Order } from '@/types'
import { toast } from 'sonner'
import RefundFormModal from '@/components/admin/RefundFormModal'
import RefundDetailModal from '@/components/admin/RefundDetailModal'

export default function RefundManagement() {
  const [searchOrderNo, setSearchOrderNo] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null)

  // 从localStorage加载退换货数据
  useEffect(() => {
    loadRefunds()
  }, [filterStatus, filterDate])

  const loadRefunds = () => {
    try {
      setLoading(true)
      const stored = localStorage.getItem('local_refunds')
      let allRefunds: Refund[] = stored ? JSON.parse(stored) : []
      
      // 应用筛选
      if (filterStatus) {
        allRefunds = allRefunds.filter(r => r.status === filterStatus)
      }
      
      if (filterDate) {
        const filterDateObj = new Date(filterDate)
        allRefunds = allRefunds.filter(r => {
          const refundDate = new Date(r.createdAt)
          return refundDate.toDateString() === filterDateObj.toDateString()
        })
      }
      
      // 应用搜索
      if (searchOrderNo) {
        allRefunds = allRefunds.filter(r => {
          const order = typeof r.order === 'object' ? r.order : null
          return order?.orderNo?.toLowerCase().includes(searchOrderNo.toLowerCase())
        })
      }
      
      setRefunds(allRefunds)
    } catch (error) {
      console.error('加载退换货列表失败:', error)
      setRefunds([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadRefunds()
  }

  const handleReset = () => {
    setSearchOrderNo('')
    setFilterStatus('')
    setFilterDate('')
    loadRefunds()
  }

  const handleView = (refund: Refund) => {
    setSelectedRefund(refund)
    setShowDetailModal(true)
  }

  const handleApprove = (refund: Refund) => {
    if (confirm('确定要同意这个退换货申请吗？')) {
      updateRefundStatus(refund._id, 'approved')
    }
  }

  const handleReject = (refund: Refund) => {
    const reason = prompt('请输入拒绝原因：')
    if (reason) {
      updateRefundStatus(refund._id, 'rejected', reason)
    }
  }

  const updateRefundStatus = (id: string, status: 'approved' | 'rejected', rejectReason?: string) => {
    try {
      const stored = localStorage.getItem('local_refunds')
      const allRefunds: Refund[] = stored ? JSON.parse(stored) : []
      
      const updated = allRefunds.map(r => {
        if (r._id === id) {
          return {
            ...r,
            status,
            processedAt: new Date().toISOString(),
            rejectReason: rejectReason || r.rejectReason
          }
        }
        return r
      })
      
      localStorage.setItem('local_refunds', JSON.stringify(updated))
      loadRefunds()
      toast.success(status === 'approved' ? '已同意申请' : '已拒绝申请')
    } catch (error) {
      console.error('更新状态失败:', error)
      toast.error('操作失败')
    }
  }

  const handleFormSubmit = () => {
    loadRefunds()
    setShowFormModal(false)
  }

  const statusConfig = {
    pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-700' },
    approved: { label: '已同意', color: 'bg-green-100 text-green-700' },
    rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
    completed: { label: '已完成', color: 'bg-gray-100 text-gray-700' },
  }

  const typeConfig = {
    return: { label: '退货', color: 'bg-red-100 text-red-700' },
    exchange: { label: '换货', color: 'bg-blue-100 text-blue-700' },
  }

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">退换货列表</h1>
      </div>

      {/* 搜索和筛选 */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* 订单编号搜索 */}
          <div className="relative">
            <input
              type="text"
              value={searchOrderNo}
              onChange={(e) => setSearchOrderNo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="请输入订单编号"
              className="input w-full pr-10"
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          {/* 申请状态筛选 */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value)
              loadRefunds()
            }}
            className="input"
          >
            <option value="">全部</option>
            <option value="pending">待处理</option>
            <option value="approved">已同意</option>
            <option value="rejected">已拒绝</option>
            <option value="completed">已完成</option>
          </select>

          {/* 申请时间筛选 */}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value)
              loadRefunds()
            }}
            className="input"
          />

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="btn-secondary flex items-center justify-center"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              重置
            </button>
            <button
              onClick={() => setShowFormModal(true)}
              className="btn-primary flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              新建退换货申请
            </button>
          </div>
        </div>
      </div>

      {/* 退换货列表 */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">申请编号</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">订单编号</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">商品信息</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">申请类型</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">申请金额</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">申请状态</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">申请时间</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : refunds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    暂无退换货记录
                  </td>
                </tr>
              ) : (
                refunds.map((refund, index) => {
                  const order = typeof refund.order === 'object' ? refund.order : null
                  const orderItem = order?.items?.[0]
                  const refundType = refund.reason?.includes('退货') ? 'return' : 'exchange'
                  
                  return (
                    <motion.tr
                      key={refund._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-4 px-4">
                        <span className="font-medium">
                          {refund._id.startsWith('refund_') 
                            ? `RTN${refund._id.replace('refund_', '').slice(-8).toUpperCase()}`
                            : `RTN${refund._id.slice(-8).toUpperCase()}`
                          }
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {order?.orderNo || 'N/A'}
                      </td>
                      <td className="py-4 px-4">
                        {orderItem && (
                          <div className="flex gap-3">
                            <img
                              src={orderItem.productImage || ''}
                              alt={orderItem.productName || ''}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm mb-1 truncate">
                                {orderItem.productName || '商品'}
                              </p>
                              <p className="text-xs text-gray-500">{refund.reason}</p>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${typeConfig[refundType]?.color || 'bg-gray-100 text-gray-700'}`}>
                          {typeConfig[refundType]?.label || '退货'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-red-600">
                          {formatPrice(refund.amount)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${statusConfig[refund.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                          {statusConfig[refund.status]?.label || refund.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {formatDateTime(refund.createdAt)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleView(refund)}
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                          >
                            <Eye className="h-4 w-4" />
                            查看
                          </button>
                          {refund.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(refund)}
                                className="text-green-600 hover:text-green-700 flex items-center gap-1 text-sm"
                              >
                                <Check className="h-4 w-4" />
                                同意
                              </button>
                              <button
                                onClick={() => handleReject(refund)}
                                className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm"
                              >
                                <X className="h-4 w-4" />
                                拒绝
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分页信息 */}
        {refunds.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>显示1到{refunds.length}，共{refunds.length}条记录</span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 bg-blue-600 text-white rounded">1</button>
            </div>
          </div>
        )}
      </div>

      {/* 新建退换货申请弹窗 */}
      {showFormModal && (
        <RefundFormModal
          onClose={() => setShowFormModal(false)}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* 查看详情弹窗 */}
      {showDetailModal && selectedRefund && (
        <RefundDetailModal
          refund={selectedRefund}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedRefund(null)
          }}
        />
      )}
    </div>
  )
}
