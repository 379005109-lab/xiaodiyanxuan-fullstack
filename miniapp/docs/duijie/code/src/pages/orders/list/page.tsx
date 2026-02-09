
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mockOrders } from '../../../mocks/orders';

type OrderStatus =
  | 'all'
  | 'pending_confirm'
  | 'pending_payment'
  | 'pending_inspection'
  | 'paid'
  | 'shipped'
  | 'completed'
  | 'cancelled';

const tabs = [
  { key: 'all' as OrderStatus, label: '全部' },
  { key: 'pending_confirm' as OrderStatus, label: '待确认' },
  { key: 'pending_payment' as OrderStatus, label: '待付款' },
  { key: 'pending_inspection' as OrderStatus, label: '待验货' },
  { key: 'paid' as OrderStatus, label: '已付款' },
  { key: 'shipped' as OrderStatus, label: '已发货' },
  { key: 'completed' as OrderStatus, label: '已完成' },
  { key: 'cancelled' as OrderStatus, label: '已取消' },
];

export default function OrderListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawStatus = searchParams.get('status');
  const statusParam = rawStatus as OrderStatus | null;
  const [activeTab, setActiveTab] = useState<OrderStatus>(statusParam || 'all');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [expandedDetails, setExpandedDetails] = useState<Set<string>>(new Set());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Keep tab in sync with URL query param
  useEffect(() => {
    if (statusParam && statusParam !== activeTab) {
      setActiveTab(statusParam);
    }
  }, [statusParam]);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const getFilteredOrders = () => {
    if (activeTab === 'all') return mockOrders;

    return mockOrders.filter((order) => {
      switch (activeTab) {
        case 'pending_confirm':
          return order.status === 'pending_confirm';
        case 'pending_payment':
          return (
            order.status === 'pending_deposit' ||
            order.status === 'pending_balance' ||
            order.status === 'pending'
          );
        case 'pending_inspection':
          return order.status === 'pending_inspection';
        case 'paid':
          return order.status === 'paid';
        case 'shipped':
          return order.status === 'shipped';
        case 'completed':
          return order.status === 'completed';
        case 'cancelled':
          return order.status === 'cancelled';
        default:
          return true;
      }
    });
  };

  const filteredOrders = getFilteredOrders();

  const toggleExpand = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const toggleDetails = (orderId: string) => {
    const newExpanded = new Set(expandedDetails);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedDetails(newExpanded);
  };

  const hasExtraInfo = (order: typeof mockOrders[0]) => {
    return order.hasRebate || order.needInvoice || (order.isInstallment && order.productionCycle);
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handlePayDeposit = (orderId: string) => {
    showToastMessage('正在跳转支付...');
  };

  const handlePayBalance = (orderId: string) => {
    showToastMessage('正在跳转支付...');
  };

  const handlePayNow = (orderId: string) => {
    showToastMessage('正在跳转支付...');
  };

  const handleCancelOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    // In a real app, you would call an API here and handle errors.
    showToastMessage('订单已取消');
    setShowCancelDialog(false);
  };

  const handleRemindConfirm = (orderId: string) => {
    showToastMessage('已提醒商家确认');
  };

  const handleViewLogistics = (orderId: string) => {
    navigate(`/orders/detail/${orderId}`);
  };

  const handleApplyAftersale = (orderId: string) => {
    showToastMessage('售后申请功能开发中');
  };

  const handleApplyRebate = (orderId: string) => {
    showToastMessage('返佣申请已提交');
  };

  const handleBuyAgain = (orderId: string) => {
    showToastMessage('已加入购物车');
  };

  const handleViewDetail = (orderId: string) => {
    navigate(`/orders/detail/${orderId}`);
  };

  const SkeletonCard = () => (
    <div className="bg-white rounded-xl overflow-hidden p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="flex gap-3">
        <div className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-[calc(20px+env(safe-area-inset-bottom))]">
      {/* 导航栏 */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
        <div className="flex items-center h-11 px-4">
          <button
            onClick={() => navigate('/profile')}
            className="w-8 h-8 flex items-center justify-center -ml-2"
          >
            <i className="ri-arrow-left-s-line text-xl text-[#1D1D1F]"></i>
          </button>
          <h1 className="flex-1 text-center text-base font-semibold text-[#1D1D1F] pr-8">
            我的订单
          </h1>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="sticky top-11 z-40 bg-white border-b border-[#E5E5EA] overflow-x-auto">
        <div className="flex items-center min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap"
              style={{
                color: activeTab === tab.key ? '#1D1D1F' : '#6E6E73',
              }}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#1D1D1F] rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 订单列表 */}
      <div className="p-3 space-y-3">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-32 h-32 flex items-center justify-center bg-[#F5F5F7] rounded-full mb-4">
              <i className="ri-file-list-3-line text-6xl text-[#C6C6C8]"></i>
            </div>
            <p className="text-sm text-[#6E6E73] mb-6">暂无订单</p>
            <button
              onClick={() => navigate('/products/category')}
              className="px-6 h-11 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-sm font-medium rounded-[14px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors"
            >
              去逛逛
            </button>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isExpanded = expandedOrders.has(order.id);
            const isDetailsExpanded = expandedDetails.has(order.id);
            const displayProducts = isExpanded ? order.products : order.products.slice(0, 2);
            const extraInfo = hasExtraInfo(order);

            return (
              <div key={order.id} className="bg-white rounded-xl overflow-hidden border border-[#E5E5EA]">
                {/* 订单头部 */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5EA]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#F5F5F7] text-[#6E6E73]">
                      {order.statusText}
                    </span>
                    <span className="text-xs text-[#6E6E73]">{order.orderType}</span>
                  </div>
                  <span className="text-base font-bold text-[#1D1D1F]">
                    ¥{order.actualAmount.toLocaleString()}
                  </span>
                </div>

                {/* 分期支付模块 */}
                {order.isInstallment && (
                  <div className="px-4 py-3 bg-[#F5F5F7] border-b border-[#E5E5EA]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-[#E5E5EA] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#6E6E73] rounded-full transition-all"
                            style={{
                              width:
                                order.depositPaid && order.balancePaid
                                  ? '100%'
                                  : order.depositPaid
                                  ? '50%'
                                  : '0%',
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* 定金 */}
                      <div className="flex-1 flex items-center justify-between p-2 bg-white rounded-lg">
                        <div className="flex-1">
                          <div className="text-xs text-[#6E6E73] mb-1">定金({order.depositPercent}%)</div>
                          <div className="text-sm font-semibold text-[#1D1D1F]">¥{order.depositAmount}</div>
                          <div className="text-xs text-[#6E6E73] mt-1">{order.depositPaid ? '已支付' : '待支付'}</div>
                        </div>
                        {!order.depositPaid && (
                          <button
                            onClick={() => handlePayDeposit(order.id)}
                            className="px-3 h-8 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-xs font-medium rounded-[12px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors"
                          >
                            支付定金
                          </button>
                        )}
                        {order.depositPaid && (
                          <div className="w-5 h-5 flex items-center justify-center bg-[#6E6E73] rounded-full">
                            <i className="ri-check-line text-xs text-white"></i>
                          </div>
                        )}
                      </div>

                      {/* 尾款 */}
                      <div className="flex-1 flex items-center justify-between p-2 bg-white rounded-lg">
                        <div className="flex-1">
                          <div className="text-xs text-[#6E6E73] mb-1">尾款({order.balancePercent}%)</div>
                          <div className="text-sm font-semibold text-[#1D1D1F]">¥{order.balanceAmount}</div>
                          <div className="text-xs text-[#6E6E73] mt-1">
                            {order.balancePaid
                              ? '已支付'
                              : order.depositPaid
                              ? '待支付'
                              : '待请求'}
                          </div>
                        </div>
                        {order.depositPaid && !order.balancePaid && order.balanceStatus === 'unpaid' && (
                          <button
                            onClick={() => handlePayBalance(order.id)}
                            className="px-3 h-8 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-xs font-medium rounded-[12px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors"
                          >
                            支付尾款
                          </button>
                        )}
                        {!order.depositPaid && (
                          <div className="px-3 py-1.5 bg-[#F5F5F7] text-[#6E6E73] text-xs font-medium rounded-full whitespace-nowrap">
                            待请求
                          </div>
                        )}
                        {order.balancePaid && (
                          <div className="w-5 h-5 flex items-center justify-center bg-[#6E6E73] rounded-full">
                            <i className="ri-check-line text-xs text-white"></i>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 商品列表 */}
                <div className="p-4 space-y-3">
                  {displayProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex gap-3 cursor-pointer active:bg-[#F5F5F7] -mx-4 px-4 py-2 rounded-lg"
                      onClick={() => handleViewDetail(order.id)}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-20 h-20 rounded-lg object-cover bg-gray-50 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-[#1D1D1F] line-clamp-1 mb-1">{product.name}</h3>
                        <p className="text-xs text-[#6E6E73] mb-1">
                          规格: {product.model} · {product.size}
                        </p>
                        <p className="text-xs text-[#6E6E73] mb-2 line-clamp-1">
                          {product.material} · {product.color}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-[#1D1D1F]">¥{product.price.toLocaleString()}</span>
                          <span className="text-xs text-[#6E6E73]">x{product.quantity}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* 展开/收起商品按钮 */}
                  {order.products.length > 2 && (
                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="w-full py-2 text-xs text-[#1D1D1F] flex items-center justify-center gap-1"
                    >
                      {isExpanded ? (
                        <>
                          收起
                          <i className="ri-arrow-up-s-line text-sm"></i>
                        </>
                      ) : (
                        <>
                          查看全部商品 (共{order.products.length}件)
                          <i className="ri-arrow-down-s-line text-sm"></i>
                        </>
                      )}
                    </button>
                  )}

                  {/* 展开后显示订单信息 */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-[#E5E5EA] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#6E6E73]">订单号</span>
                        <span className="text-xs text-[#1D1F1F]">{order.orderNo}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#6E6E73]">收货人</span>
                        <span className="text-xs text-[#1D1F1F]">
                          {order.receiverName} {order.receiverPhone}
                        </span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="text-xs text-[#6E6E73]">收货地址</span>
                        <span className="text-xs text-[#1D1F1F] text-right max-w-[200px]">{order.receiverAddress}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 更多信息折叠区 */}
                {extraInfo && (
                  <div className="border-t border-[#E5E5EA]">
                    <button
                      onClick={() => toggleDetails(order.id)}
                      className="w-full flex items-center justify-center gap-1 py-2.5 text-xs text-[#8E8E93] cursor-pointer active:bg-[#F5F5F7] transition-colors"
                    >
                      <span>{isDetailsExpanded ? '收起更多' : '更多信息'}</span>
                      <i
                        className={`ri-arrow-${isDetailsExpanded ? 'up' : 'down'}-s-line text-sm transition-transform`}
                      ></i>
                    </button>

                    {isDetailsExpanded && (
                      <div className="px-4 pb-3 space-y-2 animate-[fadeSlideIn_0.2s_ease-out]">
                        {/* 返佣信息 */}
                        {order.hasRebate && (
                          <div className="flex items-center justify-between py-2 px-3 bg-[#F9F9FB] rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 flex items-center justify-center">
                                <i className="ri-money-cny-circle-line text-sm text-[#8E8E93]"></i>
                              </div>
                              <span className="text-xs text-[#6E6E73]">返佣金额</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-[#1D1D1F]">¥{order.rebateAmount}</span>
                              <span className="text-xs text-[#8E8E93]">
                                {order.rebateStatus === 'available' ? '可申请' : '订单完成后可申请'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 发票信息 */}
                        {order.needInvoice && (
                          <div className="flex items-center justify-between py-2 px-3 bg-[#F9F9FB] rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 flex items-center justify-center">
                                <i className="ri-file-text-line text-sm text-[#8E8E93]"></i>
                              </div>
                              <span className="text-xs text-[#6E6E73]">发票</span>
                              <span className="text-xs text-[#1D1D1F]">
                                {order.invoiceType} · {order.invoiceTitle}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-[#8E8E93]">{order.invoiceStatus}</span>
                              <span className="text-xs text-[#1D1D1F]">+¥{order.invoiceExtraFee}</span>
                            </div>
                          </div>
                        )}

                        {/* 制作周期 */}
                        {order.isInstallment && order.productionCycle && (
                          <div className="flex items-center justify-between py-2 px-3 bg-[#F9F9FB] rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 flex items-center justify-center">
                                <i className="ri-time-line text-sm text-[#8E8E93]"></i>
                              </div>
                              <span className="text-xs text-[#6E6E73]">制作周期</span>
                            </div>
                            <span className="text-xs text-[#1D1D1F]">{order.productionCycle}天</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="px-4 pb-4 flex items-center justify-end gap-2 flex-wrap">
                  {order.status === 'pending_deposit' && (
                    <>
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-4 h-9 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-sm font-medium rounded-[14px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors cursor-pointer"
                      >
                        取消订单
                      </button>
                      <button
                        onClick={() => handlePayDeposit(order.id)}
                        className="px-4 h-9 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-sm font-medium rounded-[14px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors cursor-pointer"
                      >
                        支付定金
                      </button>
                    </>
                  )}

                  {order.status === 'pending_balance' && (
                    <>
                      <button
                        onClick={() => handleViewDetail(order.id)}
                        className="px-4 h-9 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-sm font-medium rounded-[14px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors cursor-pointer"
                      >
                        查看详情
                      </button>
                      <button
                        onClick={() => handlePayBalance(order.id)}
                        className="px-4 h-9 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-sm font-medium rounded-[14px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors cursor-pointer"
                      >
                        支付尾款
                      </button>
                    </>
                  )}

                  {order.status === 'pending_confirm' && (
                    <button
                      onClick={() => handleRemindConfirm(order.id)}
                      className="px-4 h-9 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-sm font-medium rounded-[14px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors cursor-pointer"
                    >
                      提醒确认
                    </button>
                  )}

                  {order.status === 'pending_inspection' && (
                    <>
                      <button
                        onClick={() => handleViewDetail(order.id)}
                        className="px-4 h-9 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-sm font-medium rounded-[14px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors cursor-pointer"
                      >
                        查看详情
                      </button>
                      <button
                        onClick={() => showToastMessage('已提醒商家安排验货')}
                        className="px-4 h-9 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-sm font-medium rounded-[14px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors cursor-pointer"
                      >
                        提醒验货
                      </button>
                    </>
                  )}

                  {order.status === 'paid' && (
                    <>
                      <button
                        onClick={() => handleApplyAftersale(order.id)}
                        className="px-4 h-9 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-sm font-medium rounded-[14px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors cursor-pointer"
                      >
                        申请售后
                      </button>
                      <button
                        onClick={() => handleViewDetail(order.id)}
                        className="px-4 h-9 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-sm font-medium rounded-[14px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors cursor-pointer"
                      >
                        查看详情
                      </button>
                    </>
                  )}

                  {order.status === 'shipped' && (
                    <>
                      <button
                        onClick={() => handleApplyAftersale(order.id)}
                        className="px-4 h-9 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-sm font-medium rounded-[14px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors cursor-pointer"
                      >
                        申请售后
                      </button>
                      <button
                        onClick={() => handleViewLogistics(order.id)}
                        className="px-4 h-9 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-sm font-medium rounded-[14px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors cursor-pointer"
                      >
                        查看物流
                      </button>
                    </>
                  )}

                  {order.status === 'completed' && (
                    <>
                      {order.hasRebate && order.rebateStatus === 'available' && (
                        <button
                          onClick={() => handleApplyRebate(order.id)}
                          className="px-4 h-9 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-sm font-medium rounded-[14px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors cursor-pointer"
                        >
                          申请返佣
                        </button>
                      )}
                      <button
                        onClick={() => handleBuyAgain(order.id)}
                        className="px-4 h-9 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-sm font-medium rounded-[14px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors cursor-pointer"
                      >
                        再次购买
                      </button>
                    </>
                  )}

                  {order.status === 'cancelled' && (
                    <button
                      onClick={() => handleBuyAgain(order.id)}
                      className="px-4 h-9 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-sm font-medium rounded-[14px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors cursor-pointer"
                    >
                      重新下单
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Toast 提示 */}
      {showToast && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 px-6 py-3 bg-black/80 text-white text-sm rounded-lg whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* 取消订单确认弹窗 */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-[#F5F5F7] rounded-full">
                <i className="ri-error-warning-line text-3xl text-[#6E6E73]"></i>
              </div>
              <h3 className="text-base font-semibold text-[#1D1D1F] mb-2">确认取消订单?</h3>
              <p className="text-sm text-[#6E6E73]">取消后订单将无法恢复</p>
            </div>
            <div className="flex border-t border-[#E5E5EA]">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 py-3 text-sm font-medium text-[#1D1D1F] cursor-pointer"
              >
                再想想
              </button>
              <div className="w-px bg-[#E5E5EA]"></div>
              <button
                onClick={confirmCancel}
                className="flex-1 py-3 text-sm font-medium text-[#1D1D1F] cursor-pointer"
              >
                确认取消
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
