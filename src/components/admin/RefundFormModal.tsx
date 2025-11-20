import { useState, useEffect } from 'react'
import { X, Search, Upload } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { Order } from '@/types'
import { toast } from 'sonner'

interface RefundFormModalProps {
  onClose: () => void
  onSubmit: () => void
}

export default function RefundFormModal({ onClose, onSubmit }: RefundFormModalProps) {
  const [orderNo, setOrderNo] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderAmount, setOrderAmount] = useState(0)
  const [refundType, setRefundType] = useState<'return' | 'exchange'>('return')
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handleSearchOrder = () => {
    if (!orderNo.trim()) {
      toast.error('请输入订单编号')
      return
    }

    try {
      // 从localStorage查找订单
      const stored = localStorage.getItem('local_orders')
      const orders: Order[] = stored ? JSON.parse(stored) : []
      
      const order = orders.find(o => o.orderNo === orderNo.trim())
      
      if (order) {
        setSelectedOrder(order)
        setOrderAmount(order.totalAmount)
        toast.success('找到订单')
      } else {
        toast.error('未找到该订单')
        setSelectedOrder(null)
        setOrderAmount(0)
      }
    } catch (error) {
      console.error('查询订单失败:', error)
      toast.error('查询订单失败')
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    if (images.length + files.length > 5) {
      toast.error('最多只能上传5张图片')
      return
    }

    const newImages: string[] = []
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          newImages.push(result)
          if (newImages.length === files.length) {
            setImages(prev => [...prev, ...newImages])
          }
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!selectedOrder) {
      toast.error('请先查询并选择订单')
      return
    }

    if (!reason) {
      toast.error('请选择申请原因')
      return
    }

    setSubmitting(true)

    try {
      // 生成申请编号
      const date = new Date()
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
      
      // 创建退换货申请
      const refund = {
        _id: `refund_${Date.now()}_${random}`,
        order: selectedOrder,
        user: selectedOrder.user,
        reason: refundType === 'return' ? `退货退款 - ${reason}` : `仅换货 - ${reason}`,
        description,
        images,
        amount: orderAmount,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // 保存到localStorage
      const stored = localStorage.getItem('local_refunds')
      const refunds = stored ? JSON.parse(stored) : []
      refunds.push(refund)
      localStorage.setItem('local_refunds', JSON.stringify(refunds))

      toast.success('退换货申请提交成功')
      onSubmit()
    } catch (error) {
      console.error('提交申请失败:', error)
      toast.error('提交申请失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">新建退换货申请</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 订单编号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              订单编号
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchOrder()}
                placeholder="请输入订单编号"
                className="input flex-1"
              />
              <button
                onClick={handleSearchOrder}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 订单金额 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              订单金额:
            </label>
            <p className="text-lg font-semibold text-red-600">
              {formatPrice(orderAmount)}
            </p>
          </div>

          {/* 商品信息 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              商品信息
            </label>
            {selectedOrder ? (
              <div className="border border-gray-200 rounded-lg p-4">
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} className="flex gap-3 mb-3 last:mb-0">
                    <img
                      src={item.productImage || ''}
                      alt={item.productName || ''}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.productName || '商品'}</p>
                      <p className="text-sm text-gray-600">数量: {item.quantity}</p>
                      <p className="text-sm text-red-600 font-bold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <input
                type="text"
                placeholder="请输入订单编号查询商品信息"
                className="input w-full"
                disabled
              />
            )}
          </div>

          {/* 申请类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              申请类型
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="refundType"
                  value="return"
                  checked={refundType === 'return'}
                  onChange={() => setRefundType('return')}
                  className="w-4 h-4"
                />
                <span>退货退款</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="refundType"
                  value="exchange"
                  checked={refundType === 'exchange'}
                  onChange={() => setRefundType('exchange')}
                  className="w-4 h-4"
                />
                <span>仅换货</span>
              </label>
            </div>
          </div>

          {/* 申请原因 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              申请原因
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input w-full"
            >
              <option value="">请选择申请原因</option>
              <option value="商品质量问题">商品质量问题</option>
              <option value="商品与描述不符">商品与描述不符</option>
              <option value="商品损坏">商品损坏</option>
              <option value="尺寸不合适">尺寸不合适</option>
              <option value="颜色不满意">颜色不满意</option>
              <option value="其他">其他</option>
            </select>
          </div>

          {/* 详细描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              详细描述和原因（选填）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="详细描述和原因(选填)"
              className="input w-full"
            />
          </div>

          {/* 图片凭证 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              图片凭证
            </label>
            <div className="grid grid-cols-5 gap-4">
              {images.map((img, index) => (
                <div key={index} className="relative">
                  <img
                    src={img}
                    alt={`凭证${index + 1}`}
                    className="w-full h-24 object-cover rounded border border-gray-200"
                  />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="w-full h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Upload className="h-6 w-6 text-gray-400" />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              最多上传5张图片，支持jpg、png格式
            </p>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-secondary px-6"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '提交中...' : '提交申请'}
          </button>
        </div>
      </div>
    </div>
  )
}

