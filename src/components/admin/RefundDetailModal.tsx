import { X } from 'lucide-react'
import { formatPrice, formatDateTime } from '@/lib/utils'
import { Refund, Order } from '@/types'

interface RefundDetailModalProps {
  refund: Refund
  onClose: () => void
}

export default function RefundDetailModal({ refund, onClose }: RefundDetailModalProps) {
  const order = typeof refund.order === 'object' ? refund.order : null
  const statusConfig = {
    pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-700' },
    approved: { label: '已同意', color: 'bg-green-100 text-green-700' },
    rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
    completed: { label: '已完成', color: 'bg-gray-100 text-gray-700' },
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">退换货详情</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">申请编号</label>
              <p className="font-medium">
                {refund._id.startsWith('refund_') 
                  ? `RTN${refund._id.replace('refund_', '').split('_')[0].slice(-8).toUpperCase()}`
                  : `RTN${refund._id.slice(-8).toUpperCase()}`
                }
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">订单编号</label>
              <p className="font-medium">{order?.orderNo || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">申请状态</label>
              <p>
                <span className={`px-2 py-1 text-xs rounded-full ${statusConfig[refund.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                  {statusConfig[refund.status]?.label || refund.status}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">申请时间</label>
              <p className="font-medium">{formatDateTime(refund.createdAt)}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">申请金额</label>
              <p className="font-semibold text-red-600 text-lg">{formatPrice(refund.amount)}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">申请类型</label>
              <p className="font-medium">{refund.reason?.includes('退货') ? '退货退款' : '仅换货'}</p>
            </div>
          </div>

          {/* 商品信息 */}
          {order && (
            <div>
              <label className="text-sm text-gray-600 mb-2 block">商品信息</label>
              <div className="space-y-3">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex gap-3 p-3 border border-gray-200 rounded-lg">
                    <img
                      src={item.productImage || ''}
                      alt={item.productName || ''}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium mb-1">{item.productName || '商品'}</p>
                      <p className="text-sm text-gray-600">数量: {item.quantity}</p>
                      <p className="text-sm text-red-600 font-bold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 申请原因 */}
          <div>
            <label className="text-sm text-gray-600 mb-2 block">申请原因</label>
            <p className="font-medium">{refund.reason}</p>
          </div>

          {/* 详细描述 */}
          {refund.description && (
            <div>
              <label className="text-sm text-gray-600 mb-2 block">详细描述</label>
              <p className="text-gray-700 whitespace-pre-wrap">{refund.description}</p>
            </div>
          )}

          {/* 图片凭证 */}
          {refund.images && refund.images.length > 0 && (
            <div>
              <label className="text-sm text-gray-600 mb-2 block">图片凭证</label>
              <div className="grid grid-cols-3 gap-4">
                {refund.images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`凭证${index + 1}`}
                    className="w-full h-32 object-cover rounded border border-gray-200"
                  />
                ))}
              </div>
            </div>
          )}

          {/* 处理信息 */}
          {refund.processedAt && (
            <div>
              <label className="text-sm text-gray-600 mb-2 block">处理信息</label>
              <p className="text-gray-700">处理时间: {formatDateTime(refund.processedAt)}</p>
              {refund.rejectReason && (
                <p className="text-red-600 mt-2">拒绝原因: {refund.rejectReason}</p>
              )}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="btn-primary px-6"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

