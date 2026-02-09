import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockOrders } from '../../../mocks/orders';

type InfoTab = 'order' | 'logistics' | 'aftersale';

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<InfoTab>('order');
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showAftersaleDialog, setShowAftersaleDialog] = useState(false);
  const [showPriceDetail, setShowPriceDetail] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const order = mockOrders.find(o => o.id === id);

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-5 bg-white rounded-full flex items-center justify-center shadow-sm">
            <i className="ri-file-list-3-line text-4xl text-[#C7C7CC]"></i>
          </div>
          <p className="text-base font-semibold text-[#1D1D1F] mb-1">订单不存在</p>
          <p className="text-sm text-[#6E6E73] mb-6">该订单可能已被删除或链接无效</p>
          <button
            onClick={() => navigate('/orders/list')}
            className="px-6 h-11 bg-white text-[#1D1D1F] text-sm font-medium rounded-[14px] border border-[#D2D2D7] whitespace-nowrap cursor-pointer active:bg-[#F5F5F7] transition-colors"
          >
            返回订单列表
          </button>
        </div>
      </div>
    );
  }

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const getStatusIcon = () => {
    switch (order.status) {
      case 'pending_deposit':
      case 'pending_balance':
      case 'pending':
        return 'ri-time-line';
      case 'pending_confirm':
        return 'ri-question-line';
      case 'paid':
        return 'ri-checkbox-circle-line';
      case 'shipped':
        return 'ri-truck-line';
      case 'completed':
        return 'ri-checkbox-circle-line';
      case 'cancelled':
        return 'ri-close-circle-line';
      default:
        return 'ri-file-list-3-line';
    }
  };

  const getStatusColor = () => {
    return '#FFFFFF';
  };

  const getStatusDescription = () => {
    if (order.status === 'pending_deposit') {
      return `请尽快支付定金 ¥${order.depositAmount}`;
    }
    if (order.status === 'pending_balance') {
      return `定金已支付，请支付尾款 ¥${order.balanceAmount}`;
    }
    if (order.status === 'pending') {
      return order.paymentDeadline ? `请在 ${order.paymentDeadline} 前完成支付` : '请尽快完成支付';
    }
    if (order.status === 'pending_confirm') {
      return '等待商家确认订单';
    }
    if (order.status === 'paid') {
      return order.productionCycle ? `商品制作中，预计 ${order.productionCycle} 天完成` : '商家正在准备发货';
    }
    if (order.status === 'shipped') {
      return '商品正在配送中，请注意查收';
    }
    if (order.status === 'completed') {
      return '订单已完成，感谢您的购买';
    }
    if (order.status === 'cancelled') {
      return '订单已取消';
    }
    return '';
  };

  const handlePayDeposit = () => {
    console.log('支付定金:', order.id);
    showToastMessage('正在跳转支付...');
  };

  const handlePayBalance = () => {
    console.log('支付尾款:', order.id);
    showToastMessage('正在跳转支付...');
  };

  const handleCancelOrder = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    console.log('取消订单:', order.id);
    showToastMessage('订单已取消');
    setShowCancelDialog(false);
    setTimeout(() => navigate('/orders/list'), 1500);
  };

  const handleApplyAftersale = () => {
    setShowAftersaleDialog(true);
  };

  const confirmAftersale = () => {
    console.log('申请售后:', order.id);
    showToastMessage('售后申请已提交');
    setShowAftersaleDialog(false);
  };

  const handleApplyRebate = () => {
    console.log('申请返佣:', order.id);
    showToastMessage('返佣申请已提交');
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showToastMessage('已复制');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24">
      {/* 导航栏 */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
        <div className="flex items-center h-11 px-4">
          <button 
            onClick={() => navigate('/orders/list')}
            className="w-8 h-8 flex items-center justify-center -ml-2"
          >
            <i className="ri-arrow-left-s-line text-xl text-[#1D1D1F]"></i>
          </button>
          <h1 className="flex-1 text-center text-base font-semibold text-[#1D1D1F] pr-8">订单详情</h1>
        </div>
      </div>

      {/* 订单状态页头 - Apple 风格 */}
      <div className="px-4 py-8 bg-white border-b border-[#E5E5EA]">
        <div className="text-center mb-4">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-[#F5F5F7] rounded-full">
            <i className={`${getStatusIcon()} text-3xl text-[#1D1D1F]`}></i>
          </div>
          <h2 className="text-2xl font-semibold text-[#1D1D1F] mb-2">{order.statusText}</h2>
          <p className="text-sm text-[#6E6E73]">{getStatusDescription()}</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-[#6E6E73]">实付金额</span>
          <span className="text-3xl font-bold text-[#1D1D1F]">¥{order.actualAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-3 space-y-3">
        {/* 支付信息（分期） */}
        {order.isInstallment && (
          <div className="bg-white rounded-xl overflow-hidden border border-[#E5E5EA]">
            <div className="px-4 py-3 border-b border-[#E5E5EA]">
              <h3 className="text-sm font-semibold text-[#1D1D1F]">支付信息</h3>
            </div>
            <div className="p-4">
              {/* 进度条 */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 h-1.5 bg-[#E5E5EA] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#6E6E73] rounded-full transition-all"
                    style={{ 
                      width: order.depositPaid && order.balancePaid ? '100%' : 
                             order.depositPaid ? '50%' : '0%' 
                    }}
                  ></div>
                </div>
              </div>

              {/* 定金和尾款 */}
              <div className="space-y-3">
                {/* 定金 */}
                <div className="flex items-center justify-between p-3 bg-[#F5F5F7] rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[#1D1D1F]">定金({order.depositPercent}%)</span>
                      {order.depositPaid && (
                        <span className="px-2 py-0.5 bg-[#6E6E73] text-white text-xs rounded-full">已支付</span>
                      )}
                      {!order.depositPaid && (
                        <span className="px-2 py-0.5 bg-[#E5E5EA] text-[#6E6E73] text-xs rounded-full">待支付</span>
                      )}
                    </div>
                    <div className="text-lg font-bold text-[#1D1D1F]">¥{order.depositAmount}</div>
                  </div>
                  {!order.depositPaid && (
                    <button
                      onClick={handlePayDeposit}
                      className="px-4 h-11 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-sm font-medium rounded-[14px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors"
                    >
                      支付定金
                    </button>
                  )}
                </div>

                {/* 尾款 */}
                <div className="flex items-center justify-between p-3 bg-[#F5F5F7] rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[#1D1D1F]">尾款({order.balancePercent}%)</span>
                      {order.balancePaid && (
                        <span className="px-2 py-0.5 bg-[#6E6E73] text-white text-xs rounded-full">已支付</span>
                      )}
                      {!order.balancePaid && order.depositPaid && (
                        <span className="px-2 py-0.5 bg-[#E5E5EA] text-[#6E6E73] text-xs rounded-full">待支付</span>
                      )}
                      {!order.depositPaid && (
                        <span className="px-2 py-0.5 bg-[#E5E5EA] text-[#6E6E73] text-xs rounded-full">待请求</span>
                      )}
                    </div>
                    <div className="text-lg font-bold text-[#1D1D1F]">¥{order.balanceAmount}</div>
                  </div>
                  {order.depositPaid && !order.balancePaid && order.balanceStatus === 'unpaid' && (
                    <button
                      onClick={handlePayBalance}
                      className="px-4 h-11 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-sm font-medium rounded-[14px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors"
                    >
                      支付尾款
                    </button>
                  )}
                </div>
              </div>

              {order.productionCycle && (
                <div className="mt-3 p-3 bg-[#FFF9F5] rounded-lg flex items-start gap-2">
                  <i className="ri-information-line text-base text-[#FF9500] flex-shrink-0 mt-0.5"></i>
                  <p className="text-xs text-[#6E6E73] leading-relaxed">
                    产品为定制生产，生产周期约 {order.productionCycle} 天，下单前请确认
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 商品信息 */}
        <div className="bg-white rounded-xl overflow-hidden border border-[#E5E5EA]">
          <div className="px-4 py-3 border-b border-[#E5E5EA]">
            <h3 className="text-sm font-semibold text-[#1D1D1F]">商品信息</h3>
          </div>
          <div className="p-4 space-y-3">
            {order.products.map((product) => (
              <div key={product.id} className="flex gap-3">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-20 h-20 rounded-lg object-cover bg-gray-50 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-[#1D1D1F] line-clamp-2 mb-1">
                    {product.name}
                  </h4>
                  <p className="text-xs text-[#6E6E73] mb-1">型号: {product.model}</p>
                  <p className="text-xs text-[#6E6E73] mb-1">尺寸: {product.size}</p>
                  <p className="text-xs text-[#6E6E73] mb-2 line-clamp-1">{product.material} · {product.color}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1D1D1F]">
                      ¥{product.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-[#6E6E73]">x{product.quantity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 价格明细 */}
        <div className="bg-white rounded-xl overflow-hidden border border-[#E5E5EA]">
          <div 
            className="px-4 py-3 border-b border-[#E5E5EA] flex items-center justify-between cursor-pointer active:bg-[#F5F5F7]"
            onClick={() => setShowPriceDetail(!showPriceDetail)}
          >
            <h3 className="text-sm font-semibold text-[#1D1D1F]">价格明细</h3>
            <i className={`ri-arrow-${showPriceDetail ? 'up' : 'down'}-s-line text-lg text-[#6E6E73]`}></i>
          </div>
          <div className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6E6E73]">商品金额</span>
              <span className="text-sm text-[#1D1D1F]">¥{order.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6E6E73]">运费</span>
              <span className="text-sm text-[#1D1D1F]">
                {order.freight === 0 ? '免运费' : `¥${order.freight.toLocaleString()}`}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6E6E73]">优惠</span>
                <span className="text-sm text-[#1D1D1F]">-¥{order.discount.toLocaleString()}</span>
              </div>
            )}
            {order.needInvoice && order.invoiceExtraFee > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6E6E73]">开票加价</span>
                <span className="text-sm text-[#1D1D1F]">+¥{order.invoiceExtraFee}</span>
              </div>
            )}

            {/* 返佣模式摘要（可折叠） */}
            {showPriceDetail && order.hasRebate && (
              <div className="pt-2 border-t border-[#E5E5EA] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6E6E73]">原价</span>
                  <span className="text-sm text-[#6E6E73] line-through">¥{order.originalPrice?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6E6E73]">折扣价</span>
                  <span className="text-sm text-[#1D1D1F]">¥{order.discountPrice?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6E6E73]">返佣金额</span>
                  <span className="text-sm font-semibold text-[#1D1D1F]">¥{order.rebateAmount}</span>
                </div>
              </div>
            )}

            <div className="pt-2.5 border-t border-[#E5E5EA] flex items-center justify-between">
              <span className="text-sm font-semibold text-[#1D1D1F]">实付金额</span>
              <span className="text-lg font-bold text-[#1D1D1F]">
                ¥{order.actualAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 收货地址 */}
        <div className="bg-white rounded-xl overflow-hidden border border-[#E5E5EA]">
          <div className="px-4 py-3 border-b border-[#E5E5EA]">
            <h3 className="text-sm font-semibold text-[#1D1D1F]">收货地址</h3>
          </div>
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 flex items-center justify-center bg-[#F5F5F7] rounded-full flex-shrink-0">
                <i className="ri-map-pin-line text-base text-[#6E6E73]"></i>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-[#1D1D1F]">{order.receiverName}</span>
                  <span className="text-sm text-[#6E6E73]">{order.receiverPhone}</span>
                </div>
                <p className="text-sm text-[#6E6E73] leading-relaxed">
                  {order.receiverAddress}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 发票信息 */}
        {order.needInvoice && (
          <div className="bg-white rounded-xl overflow-hidden border border-[#E5E5EA]">
            <div className="px-4 py-3 border-b border-[#E5E5EA]">
              <h3 className="text-sm font-semibold text-[#1D1D1F]">发票信息</h3>
            </div>
            <div className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6E6E73]">发票类型</span>
                <span className="text-sm text-[#1D1D1F]">{order.invoiceType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6E6E73]">发票抬头</span>
                <span className="text-sm text-[#1D1D1F]">{order.invoiceTitle}</span>
              </div>
              {order.invoiceTaxNo && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6E6E73]">税号</span>
                  <span className="text-sm text-[#1D1D1F]">{order.invoiceTaxNo}</span>
                </div>
              )}
              {order.invoiceEmail && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6E6E73]">邮箱</span>
                  <span className="text-sm text-[#1D1D1F]">{order.invoiceEmail}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6E6E73]">开票状态</span>
                <span 
                  className="text-sm font-medium text-[#6E6E73]"
                >
                  {order.invoiceStatus}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 订单信息 */}
        <div className="bg-white rounded-xl overflow-hidden border border-[#E5E5EA]">
          <div className="px-4 py-3 border-b border-[#E5E5EA]">
            <h3 className="text-sm font-semibold text-[#1D1D1F]">订单信息</h3>
          </div>
          <div className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6E6E73]">订单号</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#1D1D1F]">{order.orderNo}</span>
                <button 
                  onClick={() => copyText(order.orderNo)}
                  className="text-xs text-[#1D1D1F]"
                >
                  复制
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6E6E73]">下单时间</span>
              <span className="text-sm text-[#1D1D1F]">{order.createTime}</span>
            </div>
            {order.payTime && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6E6E73]">支付时间</span>
                <span className="text-sm text-[#1D1D1F]">{order.payTime}</span>
              </div>
            )}
            {order.shipTime && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6E6E73]">发货时间</span>
                <span className="text-sm text-[#1D1D1F]">{order.shipTime}</span>
              </div>
            )}
            {order.receiveTime && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6E6E73]">收货时间</span>
                <span className="text-sm text-[#1D1D1F]">{order.receiveTime}</span>
              </div>
            )}
            {order.cancelTime && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6E6E73]">取消时间</span>
                <span className="text-sm text-[#1D1D1F]">{order.cancelTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* 物流信息 */}
        {order.expressCompany && order.expressNo && (
          <div className="bg-white rounded-xl overflow-hidden border border-[#E5E5EA]">
            <div className="px-4 py-3 border-b border-[#E5E5EA]">
              <h3 className="text-sm font-semibold text-[#1D1D1F]">物流信息</h3>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[#6E6E73]">物流公司</span>
                <span className="text-sm font-medium text-[#1D1D1F]">{order.expressCompany}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6E6E73]">运单号</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#1D1D1F]">{order.expressNo}</span>
                  <button 
                    onClick={() => copyText(order.expressNo!)}
                    className="text-xs text-[#1D1D1F]"
                  >
                    复制
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E5EA] px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setShowContactDialog(true)}
          className="flex-1 h-11 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-sm font-medium rounded-[14px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors"
        >
          联系客服
        </button>
        
        {(order.status === 'pending_deposit' || order.status === 'pending') && (
          <>
            <button
              onClick={handleCancelOrder}
              className="flex-1 h-11 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-sm font-medium rounded-[14px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors"
            >
              取消订单
            </button>
            <button
              onClick={order.status === 'pending_deposit' ? handlePayDeposit : handlePayBalance}
              className="flex-1 h-11 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-sm font-medium rounded-[14px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors"
            >
              {order.status === 'pending_deposit' ? '支付定金' : '立即支付'}
            </button>
          </>
        )}

        {order.status === 'pending_balance' && (
          <button
            onClick={handlePayBalance}
            className="flex-1 h-11 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-sm font-medium rounded-[14px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors"
          >
            支付尾款
          </button>
        )}

        {(order.status === 'shipped' || order.status === 'paid') && (
          <button
            onClick={handleApplyAftersale}
            className="flex-1 h-11 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-sm font-medium rounded-[14px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors"
          >
            申请售后
          </button>
        )}

        {order.status === 'completed' && order.hasRebate && order.rebateStatus === 'available' && (
          <button
            onClick={handleApplyRebate}
            className="flex-1 h-11 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-sm font-medium rounded-[14px] whitespace-nowrap active:bg-[#F5F5F7] transition-colors"
          >
            申请返佣
          </button>
        )}
      </div>

      {/* Toast 提示 */}
      {showToast && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 px-6 py-3 bg-black/80 text-white text-sm rounded-lg whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* 联系客服弹窗 */}
      {showContactDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-[#F5F5F7] rounded-full">
                <i className="ri-customer-service-2-line text-3xl text-[#6E6E73]"></i>
              </div>
              <h3 className="text-base font-semibold text-[#1D1D1F] mb-2">联系客服</h3>
              <p className="text-sm text-[#6E6E73] mb-1">客服热线: 400-888-8888</p>
              <p className="text-xs text-[#6E6E73]">工作时间: 9:00-21:00</p>
            </div>
            <div className="flex border-t border-[#E5E5EA]">
              <button
                onClick={() => setShowContactDialog(false)}
                className="flex-1 py-3 text-sm font-medium text-[#1D1D1F]"
              >
                关闭
              </button>
              <div className="w-px bg-[#E5E5EA]"></div>
              <button
                onClick={() => {
                  console.log('拨打电话');
                  setShowContactDialog(false);
                }}
                className="flex-1 py-3 text-sm font-medium text-[#1D1D1F]"
              >
                立即拨打
              </button>
            </div>
          </div>
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
                className="flex-1 py-3 text-sm font-medium text-[#1D1D1F]"
              >
                再想想
              </button>
              <div className="w-px bg-[#E5E5EA]"></div>
              <button
                onClick={confirmCancel}
                className="flex-1 py-3 text-sm font-medium text-[#1D1D1F]"
              >
                确认取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 申请售后弹窗 */}
      {showAftersaleDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-[#F5F5F7] rounded-full">
                <i className="ri-customer-service-2-line text-3xl text-[#6E6E73]"></i>
              </div>
              <h3 className="text-base font-semibold text-[#1D1D1F] mb-2">申请售后</h3>
              <p className="text-sm text-[#6E6E73]">提交后客服将在24小时内联系您</p>
            </div>
            <div className="flex border-t border-[#E5E5EA]">
              <button
                onClick={() => setShowAftersaleDialog(false)}
                className="flex-1 py-3 text-sm font-medium text-[#1D1D1F]"
              >
                取消
              </button>
              <div className="w-px bg-[#E5E5EA]"></div>
              <button
                onClick={confirmAftersale}
                className="flex-1 py-3 text-sm font-medium text-[#1D1D1F]"
              >
                确认申请
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
