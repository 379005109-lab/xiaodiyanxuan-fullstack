import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Factory, Package, Truck, CheckCircle, Clock, LogOut, RefreshCw, ChevronRight, Play } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';

interface ManufacturerOrder {
  _id: string;
  orderNo: string;
  orderId: { _id: string; orderNo: string; status: number; totalAmount: number };
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
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'completed';
  trackingNo?: string;
  trackingCompany?: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: '待确认', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-4 h-4" /> },
  confirmed: { label: '已确认', color: 'bg-blue-100 text-blue-700', icon: <CheckCircle className="w-4 h-4" /> },
  processing: { label: '生产中', color: 'bg-indigo-100 text-indigo-700', icon: <Play className="w-4 h-4" /> },
  shipped: { label: '已发货', color: 'bg-purple-100 text-purple-700', icon: <Truck className="w-4 h-4" /> },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4" /> }
};

export default function ManufacturerOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ManufacturerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [stats, setStats] = useState({ pending: 0, confirmed: 0, processing: 0, shipped: 0, completed: 0 });
  const [manufacturerInfo, setManufacturerInfo] = useState<any>(null);
  const [showShipModal, setShowShipModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ManufacturerOrder | null>(null);
  const [trackingNo, setTrackingNo] = useState('');
  const [trackingCompany, setTrackingCompany] = useState('顺丰速运');

  useEffect(() => {
    const info = localStorage.getItem('manufacturerInfo');
    if (info) {
      setManufacturerInfo(JSON.parse(info));
    }
    fetchOrders();
  }, [activeTab]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('manufacturerToken');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab) params.append('status', activeTab);
      
      const res = await apiClient.get(`/manufacturer-orders/manufacturer/orders?${params}`, {
        headers: getAuthHeaders()
      });

      if (res.data.success) {
        setOrders(res.data.data);
        setStats(res.data.stats);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('登录已过期，请重新登录');
        handleLogout();
      } else {
        toast.error('获取订单失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('manufacturerToken');
    localStorage.removeItem('manufacturerInfo');
    navigate('/manufacturer/login');
  };

  const handleConfirm = async (order: ManufacturerOrder) => {
    try {
      const res = await apiClient.post(
        `/manufacturer-orders/manufacturer/orders/${order._id}/confirm`,
        {},
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        toast.success('订单已确认');
        fetchOrders();
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleStartProduction = async (order: ManufacturerOrder) => {
    try {
      const res = await apiClient.post(
        `/manufacturer-orders/manufacturer/orders/${order._id}/start-production`,
        {},
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        toast.success('已开始生产');
        fetchOrders();
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleShip = async () => {
    if (!selectedOrder || !trackingNo) {
      toast.error('请输入快递单号');
      return;
    }

    try {
      const res = await apiClient.post(
        `/manufacturer-orders/manufacturer/orders/${selectedOrder._id}/ship`,
        { trackingNo, trackingCompany },
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        toast.success('发货成功');
        setShowShipModal(false);
        setSelectedOrder(null);
        setTrackingNo('');
        fetchOrders();
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const openShipModal = (order: ManufacturerOrder) => {
    setSelectedOrder(order);
    setShowShipModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-xl flex items-center justify-center">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">{manufacturerInfo?.name || '厂家管理系统'}</h1>
              <p className="text-xs text-gray-500">订单管理</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchOrders} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 状态统计 */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-5 gap-3">
          {Object.entries(statusConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveTab(activeTab === key ? '' : key)}
              className={`p-4 rounded-xl text-center transition-all ${
                activeTab === key 
                  ? 'bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-lg' 
                  : 'bg-white hover:shadow-md'
              }`}
            >
              <div className="text-2xl font-bold">{stats[key as keyof typeof stats]}</div>
              <div className={`text-sm ${activeTab === key ? 'text-white/80' : 'text-gray-500'}`}>
                {config.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 订单列表 */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">暂无订单</div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* 订单头部 */}
                <div className="px-5 py-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${statusConfig[order.status]?.color}`}>
                      {statusConfig[order.status]?.icon}
                      {statusConfig[order.status]?.label}
                    </span>
                    <span className="text-gray-500 text-sm">{order.orderNo}</span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* 商品列表 */}
                <div className="px-5 py-4">
                  {order.items.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="flex gap-4 py-2">
                      {item.image && (
                        <img src={item.image} className="w-16 h-16 rounded-lg object-cover bg-gray-100" alt="" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{item.productName}</div>
                        <div className="text-sm text-gray-500">{item.specs || item.skuName}</div>
                        <div className="text-sm text-gray-500">数量: {item.quantity}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-orange-600">¥{item.subtotal}</div>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <div className="text-sm text-gray-400 py-2">还有 {order.items.length - 2} 件商品...</div>
                  )}
                </div>

                {/* 收货信息 */}
                <div className="px-5 py-3 bg-gray-50 text-sm text-gray-600">
                  <div className="flex gap-4">
                    <span>收货人: {order.customerName}</span>
                    <span>{order.customerPhone}</span>
                  </div>
                  <div className="truncate">{order.customerAddress}</div>
                </div>

                {/* 操作按钮 */}
                <div className="px-5 py-4 border-t flex items-center justify-between">
                  <div className="text-lg font-bold text-gray-900">
                    合计: <span className="text-orange-600">¥{order.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleConfirm(order)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" /> 确认订单
                      </button>
                    )}
                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => handleStartProduction(order)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"
                      >
                        <Play className="w-4 h-4" /> 开始生产
                      </button>
                    )}
                    {order.status === 'processing' && (
                      <button
                        onClick={() => openShipModal(order)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1"
                      >
                        <Truck className="w-4 h-4" /> 发货
                      </button>
                    )}
                    {order.trackingNo && (
                      <div className="text-sm text-gray-500">
                        {order.trackingCompany}: {order.trackingNo}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 发货弹窗 */}
      {showShipModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">发货</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">快递公司</label>
                <select
                  value={trackingCompany}
                  onChange={(e) => setTrackingCompany(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="顺丰速运">顺丰速运</option>
                  <option value="中通快递">中通快递</option>
                  <option value="圆通快递">圆通快递</option>
                  <option value="韵达快递">韵达快递</option>
                  <option value="申通快递">申通快递</option>
                  <option value="德邦物流">德邦物流</option>
                  <option value="京东物流">京东物流</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">快递单号</label>
                <input
                  type="text"
                  value={trackingNo}
                  onChange={(e) => setTrackingNo(e.target.value)}
                  placeholder="请输入快递单号"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowShipModal(false)}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleShip}
                className="flex-1 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white rounded-lg hover:from-cyan-600 hover:to-emerald-600"
              >
                确认发货
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
