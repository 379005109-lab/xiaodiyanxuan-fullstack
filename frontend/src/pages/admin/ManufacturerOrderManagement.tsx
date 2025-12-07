import React, { useState, useEffect } from 'react';
import { Search, Eye, Truck, CheckCircle, Package } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';

interface ManufacturerOrder {
  _id: string;
  orderId: { _id: string; orderNo: string; status: number; totalAmount: number };
  orderNo: string;
  manufacturerId: { _id: string; name: string; code: string };
  manufacturerName: string;
  items: {
    productName: string;
    skuName: string;
    specs: string;
    quantity: number;
    price: number;
    subtotal: number;
    image: string;
  }[];
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  confirmedAt?: string;
  shippedAt?: string;
  trackingNo?: string;
  trackingCompany?: string;
  manufacturerRemark?: string;
  logs: { action: string; content: string; operator: string; createdAt: string }[];
  createdAt: string;
}

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'processing', label: '生产中' },
  { value: 'shipped', label: '已发货' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
];

const statusLabels: Record<string, { text: string; color: string }> = {
  pending: { text: '待确认', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { text: '已确认', color: 'bg-blue-100 text-blue-800' },
  processing: { text: '生产中', color: 'bg-indigo-100 text-indigo-800' },
  shipped: { text: '已发货', color: 'bg-purple-100 text-purple-800' },
  completed: { text: '已完成', color: 'bg-green-100 text-green-800' },
  cancelled: { text: '已取消', color: 'bg-gray-100 text-gray-800' }
};

export default function ManufacturerOrderManagement() {
  const [orders, setOrders] = useState<ManufacturerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<ManufacturerOrder | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (keyword) params.append('keyword', keyword);
      if (status) params.append('status', status);

      const res = await apiClient.get(`/api/manufacturer-orders?${params}`);
      if (res.data.success) {
        setOrders(res.data.data);
        setTotal(res.data.pagination.total);
      }
    } catch (error) {
      console.error('获取厂家订单列表失败:', error);
      toast.error('获取厂家订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, status]);

  const handleSearch = () => {
    setPage(1);
    fetchOrders();
  };

  const handleUpdateStatus = async (id: string, newStatus: string, extra?: object) => {
    try {
      const res = await apiClient.put(`/api/manufacturer-orders/${id}/status`, { status: newStatus, ...extra });
      if (res.data.success) {
        toast.success('状态更新成功');
        fetchOrders();
        if (showModal) setShowModal(false);
      }
    } catch (error) {
      toast.error('更新失败');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">厂家订单管理</h1>
        <p className="text-gray-500 mt-1">管理分发给各厂家的订单</p>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索订单号/厂家名称/客户名称"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            搜索
          </button>
        </div>
      </div>

      {/* 列表 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">订单号</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">厂家</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">商品</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">金额</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">创建时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">加载中...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">暂无厂家订单</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">{order.orderNo}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">{order.manufacturerName}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      {order.items.length > 0 && (
                        <span>{order.items[0].productName}</span>
                      )}
                      {order.items.length > 1 && (
                        <span className="text-gray-400 ml-1">等{order.items.length}件</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">¥{order.totalAmount.toFixed(2)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${statusLabels[order.status]?.color}`}>
                      {statusLabels[order.status]?.text}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* 分页 */}
        {total > 20 && (
          <div className="px-4 py-3 border-t flex justify-between items-center">
            <div className="text-sm text-gray-500">共 {total} 条记录</div>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                上一页
              </button>
              <button
                disabled={page * 20 >= total}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">厂家订单详情</h2>
              <span className={`px-3 py-1 text-sm rounded-full ${statusLabels[selectedOrder.status]?.color}`}>
                {statusLabels[selectedOrder.status]?.text}
              </span>
            </div>
            <div className="p-6 space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">订单号</div>
                  <div className="font-medium">{selectedOrder.orderNo}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">厂家</div>
                  <div className="font-medium">{selectedOrder.manufacturerName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">客户</div>
                  <div className="font-medium">{selectedOrder.customerName}</div>
                  <div className="text-sm text-gray-500">{selectedOrder.customerPhone}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">收货地址</div>
                  <div className="text-sm">{selectedOrder.customerAddress}</div>
                </div>
              </div>

              {/* 商品列表 */}
              <div>
                <div className="text-sm text-gray-500 mb-2">商品列表</div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">商品</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">规格</th>
                        <th className="px-3 py-2 text-right text-xs text-gray-500">单价</th>
                        <th className="px-3 py-2 text-right text-xs text-gray-500">数量</th>
                        <th className="px-3 py-2 text-right text-xs text-gray-500">小计</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {item.image && (
                                <img src={item.image} className="w-10 h-10 object-cover rounded" alt="" />
                              )}
                              <span className="text-sm">{item.productName}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-500">{item.specs || item.skuName || '-'}</td>
                          <td className="px-3 py-2 text-sm text-right">¥{item.price}</td>
                          <td className="px-3 py-2 text-sm text-right">{item.quantity}</td>
                          <td className="px-3 py-2 text-sm text-right font-medium">¥{item.subtotal}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-right text-sm font-medium">合计</td>
                        <td className="px-3 py-2 text-right text-lg font-bold text-orange-600">
                          ¥{selectedOrder.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 物流信息 */}
              {selectedOrder.trackingNo && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">物流信息</div>
                  <div className="font-medium">{selectedOrder.trackingCompany}: {selectedOrder.trackingNo}</div>
                </div>
              )}

              {/* 操作日志 */}
              <div>
                <div className="text-sm text-gray-500 mb-2">操作日志</div>
                <div className="space-y-2">
                  {selectedOrder.logs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-400"></div>
                      <div>
                        <div>{log.content}</div>
                        <div className="text-xs text-gray-400">
                          {log.operator} · {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-4 border-t">
                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'confirmed')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> 确认订单
                  </button>
                )}
                {selectedOrder.status === 'confirmed' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'processing')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                  >
                    <Package className="w-4 h-4" /> 开始生产
                  </button>
                )}
                {selectedOrder.status === 'processing' && (
                  <button
                    onClick={() => {
                      const trackingNo = prompt('请输入快递单号');
                      if (trackingNo) {
                        handleUpdateStatus(selectedOrder._id, 'shipped', { trackingNo, trackingCompany: '顺丰速运' });
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
                    <Truck className="w-4 h-4" /> 发货
                  </button>
                )}
                {selectedOrder.status === 'shipped' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'completed')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> 完成
                  </button>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 ml-auto"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
