
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { mockAddresses } from '../../../mocks/address';
import { mockOrderItem, mockShippingFee, mockCoupons, mockProductionCycle } from '../../../mocks/order';

interface PackageItem {
  id: string;
  name: string;
  image: string;
  spec: string;
  size: string;
  fabric?: string;
  price: number;
  categoryName: string;
  quantity: number;
}

interface PackageInfo {
  id: number;
  name: string;
  basePrice: number;
}

export default function ConfirmOrderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 判断是否为套餐订单
  const isPackageOrder = location.state?.isPackageOrder || false;
  const packageInfo: PackageInfo | null = location.state?.packageInfo || null;
  const packageItems: PackageItem[] = location.state?.packageItems || [];
  
  // 从路由获取商品信息（普通订单）
  const orderItem = location.state?.orderItem || mockOrderItem;
  
  const [selectedAddress, setSelectedAddress] = useState(mockAddresses.find(addr => addr.isDefault) || null);
  const [quantity, setQuantity] = useState(orderItem.quantity || 1);
  const [selectedCoupon, setSelectedCoupon] = useState<typeof mockCoupons[0] | null>(null);
  const [needInvoice, setNeedInvoice] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'personal' | 'company'>('personal');
  const [invoiceTitle, setInvoiceTitle] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [invoiceEmail, setInvoiceEmail] = useState('');
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 计算费用
  const itemTotal = isPackageOrder 
    ? (packageInfo?.basePrice || 0) + packageItems.reduce((sum, item) => sum + item.price, 0)
    : orderItem.price * quantity;
  const shippingFee = mockShippingFee;
  const couponDiscount = selectedCoupon ? selectedCoupon.discount : 0;
  const totalAmount = itemTotal + shippingFee - couponDiscount;

  // 检查是否可以提交
  const canSubmit = selectedAddress !== null && (isPackageOrder ? packageItems.length > 0 : quantity >= 1);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= orderItem.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleSubmitOrder = async () => {
    if (!canSubmit) {
      showToastMessage('请先选择收货地址');
      return;
    }

    if (needInvoice && (!invoiceTitle || !invoiceEmail)) {
      showToastMessage('请完善发票信息');
      return;
    }

    setIsSubmitting(true);
    
    // 模拟提交订单
    setTimeout(() => {
      setIsSubmitting(false);
      // 跳转到订单详情页
      navigate('/orders/detail/ORD' + Date.now(), {
        state: {
          orderNumber: 'ORD' + Date.now(),
          status: 'pending_payment',
          amount: totalAmount,
          isPackageOrder,
          packageInfo,
          packageItems,
        }
      });
    }, 1500);
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* 导航栏 */}
      <div 
        className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="h-[44px] flex items-center justify-between px-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center cursor-pointer"
          >
            <i className="ri-arrow-left-line text-[20px] text-[#1D1D1F]"></i>
          </button>
          <h1 className="text-[17px] font-semibold text-[#1D1D1F]">确认订单</h1>
          <div className="w-8"></div>
        </div>
      </div>

      <div 
        className="pb-[calc(140px+env(safe-area-inset-bottom))]"
        style={{ paddingTop: 'calc(44px + env(safe-area-inset-top))' }}
      >
        {/* 收货信息卡 */}
        <div className="bg-white mt-2 border-b border-[#E5E5EA]">
          {selectedAddress ? (
            <button
              onClick={() => navigate('/orders/address-select', { 
                state: { from: '/orders/confirm' } 
              })}
              className="w-full p-4 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-start gap-3 flex-1">
                <i className="ri-map-pin-line text-[20px] text-[#6E6E73] mt-0.5"></i>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[15px] font-medium text-[#1D1D1F]">{selectedAddress.name}</span>
                    <span className="text-[14px] text-[#6E6E73]">{selectedAddress.phone}</span>
                  </div>
                  <p className="text-[13px] text-[#6E6E73] leading-[1.5]">
                    {selectedAddress.province} {selectedAddress.city} {selectedAddress.district} {selectedAddress.detail}
                  </p>
                  {selectedAddress.isDefault && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 bg-[#F5F5F7] text-[#6E6E73] text-[11px] rounded">
                      默认地址
                    </span>
                  )}
                </div>
              </div>
              <i className="ri-arrow-right-s-line text-[18px] text-[#C6C6C8]"></i>
            </button>
          ) : (
            <button
              onClick={() => navigate('/orders/address-select', { 
                state: { from: '/orders/confirm' } 
              })}
              className="w-full p-4 flex items-center justify-center gap-2 cursor-pointer"
            >
              <i className="ri-add-circle-line text-[20px] text-[#1D1D1F]"></i>
              <span className="text-[15px] text-[#1D1D1F] font-medium">新增收货地址</span>
            </button>
          )}
        </div>

        {/* 套餐订单 - 商品清单 */}
        {isPackageOrder && packageInfo && (
          <div className="bg-white mt-2 border-b border-[#E5E5EA]">
            {/* 套餐信息头部 */}
            <div className="px-4 py-3 border-b border-[#E5E5EA] bg-[#FAFAFA]">
              <div className="flex items-center gap-2">
                <i className="ri-gift-line text-[18px] text-[#1D1D1F]"></i>
                <span className="text-[15px] font-semibold text-[#1D1D1F]">{packageInfo.name}</span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-[12px] text-[#6E6E73]">
                  基础价：¥{packageInfo.basePrice.toLocaleString()}
                </span>
                <span className="text-[12px] text-[#6E6E73]">
                  已选 {packageItems.length} 件商品
                </span>
              </div>
            </div>
            
            {/* 商品列表 */}
            <div className="divide-y divide-[#E5E5EA]">
              {packageItems.map((item, index) => (
                <div key={item.id + '-' + index} className="flex gap-3 p-4">
                  <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-[#F5F5F7]">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="inline-block px-1.5 py-0.5 bg-[#F5F5F7] text-[#6E6E73] text-[10px] rounded mb-1">
                          {item.categoryName}
                        </span>
                        <h4 className="text-[14px] text-[#1D1D1F] line-clamp-1 leading-[1.4]">
                          {item.name}
                        </h4>
                      </div>
                      <span className="text-[11px] text-[#6E6E73] flex-shrink-0">x{item.quantity}</span>
                    </div>
                    <p className="text-[12px] text-[#6E6E73] mt-1">
                      {item.spec} · {item.size}
                      {item.fabric && ` · ${item.fabric}`}
                    </p>
                    <div className="flex items-center justify-end mt-2">
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-[11px] text-[#1D1D1F]">¥</span>
                        <span className="text-[15px] font-semibold text-[#1D1D1F]">
                          {item.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 套餐小计 */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E5EA] bg-[#FAFAFA]">
              <span className="text-[13px] text-[#6E6E73]">套餐合计</span>
              <div className="flex items-baseline gap-1">
                <span className="text-[11px] text-[#1D1D1F]">¥</span>
                <span className="text-[18px] font-semibold text-[#1D1D1F]">
                  {itemTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 普通订单 - 商品清单卡 */}
        {!isPackageOrder && (
          <div className="bg-white mt-2 p-4 border-b border-[#E5E5EA]">
            <h3 className="text-[15px] font-medium text-[#1D1D1F] mb-3">商品清单</h3>
            <div className="flex gap-3">
              <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-[#F5F5F7]">
                <img 
                  src={orderItem.image} 
                  alt={orderItem.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] text-[#1D1D1F] mb-1 line-clamp-2 leading-[1.4]">
                  {orderItem.name}
                </h4>
                <p className="text-[12px] text-[#6E6E73] mb-2">
                  {orderItem.spec} · {orderItem.size}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[11px] text-[#1D1D1F]">¥</span>
                    <span className="text-[16px] font-semibold text-[#1D1D1F]">
                      {orderItem.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className={`w-7 h-7 flex items-center justify-center rounded-md cursor-pointer ${
                        quantity <= 1
                          ? 'bg-[#F5F5F7] text-[#C6C6C8]'
                          : 'bg-[#F5F5F7] text-[#1D1D1F]'
                      }`}
                    >
                      <i className="ri-subtract-line text-[14px]"></i>
                    </button>
                    <span className="text-[14px] text-[#1D1D1F] min-w-[24px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= orderItem.stock}
                      className={`w-7 h-7 flex items-center justify-center rounded-md cursor-pointer ${
                        quantity >= orderItem.stock
                          ? 'bg-[#F5F5F7] text-[#C6C6C8]'
                          : 'bg-[#F5F5F7] text-[#1D1D1F]'
                      }`}
                    >
                      <i className="ri-add-line text-[14px]"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E5E5EA]">
              <span className="text-[13px] text-[#6E6E73]">小计</span>
              <div className="flex items-baseline gap-1">
                <span className="text-[11px] text-[#1D1D1F]">¥</span>
                <span className="text-[18px] font-semibold text-[#1D1D1F]">
                  {itemTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 生产周期提醒 */}
        <div className="bg-[#FFF9E6] mx-4 mt-3 p-3 rounded-lg flex items-start gap-2">
          <i className="ri-information-line text-[16px] text-[#FF9500] mt-0.5"></i>
          <p className="text-[12px] text-[#6E6E73] leading-[1.5] flex-1">
            {mockProductionCycle}
          </p>
        </div>

        {/* 费用明细卡 */}
        <div className="bg-white mt-2 p-4 border-b border-[#E5E5EA]">
          <h3 className="text-[15px] font-medium text-[#1D1D1F] mb-3">费用明细</h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#6E6E73]">
                {isPackageOrder ? '套餐总计' : '商品总计'}
              </span>
              <span className="text-[14px] text-[#1D1D1F]">¥{itemTotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#6E6E73]">运费</span>
              <span className="text-[14px] text-[#1D1D1F]">
                {shippingFee === 0 ? '免邮' : `¥${shippingFee}`}
              </span>
            </div>
            <button
              onClick={() => navigate('/orders/coupon-select', {
                state: { 
                  from: '/orders/confirm',
                  amount: itemTotal 
                }
              })}
              className="w-full flex items-center justify-between cursor-pointer"
            >
              <span className="text-[13px] text-[#6E6E73]">优惠券</span>
              <div className="flex items-center gap-1">
                {selectedCoupon ? (
                  <span className="text-[14px] text-[#1D1D1F]">-¥{selectedCoupon.discount}</span>
                ) : (
                  <span className="text-[13px] text-[#C6C6C8]">选择优惠券</span>
                )}
                <i className="ri-arrow-right-s-line text-[16px] text-[#C6C6C8]"></i>
              </div>
            </button>
            <div className="flex items-center justify-between pt-2.5 border-t border-[#E5E5EA]">
              <span className="text-[15px] font-medium text-[#1D1D1F]">应付合计</span>
              <div className="flex items-baseline gap-1">
                <span className="text-[12px] text-[#1D1D1F]">¥</span>
                <span className="text-[22px] font-bold text-[#1D1D1F]">
                  {totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 发票信息卡 */}
        <div className="bg-white mt-2 p-4 border-b border-[#E5E5EA]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-medium text-[#1D1D1F]">发票信息</h3>
            <button
              onClick={() => setNeedInvoice(!needInvoice)}
              className={`relative w-12 h-7 rounded-full transition-colors duration-200 cursor-pointer ${
                needInvoice ? 'bg-[#6E6E73]' : 'bg-[#E5E5EA]'
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                  needInvoice ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {needInvoice && (
            <div className="space-y-3 pt-3 border-t border-[#E5E5EA]">
              <div>
                <label className="text-[13px] text-[#6E6E73] mb-2 block">发票类型</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setInvoiceType('personal')}
                    className={`flex-1 h-10 rounded-lg text-[13px] font-medium cursor-pointer whitespace-nowrap transition-all duration-200 ${
                      invoiceType === 'personal'
                        ? 'bg-[#F5F5F7] text-[#1D1D1F] border-2 border-[#1D1D1F]'
                        : 'bg-[#F5F5F7] text-[#6E6E73] border-2 border-transparent'
                    }`}
                  >
                    个人
                  </button>
                  <button
                    onClick={() => setInvoiceType('company')}
                    className={`flex-1 h-10 rounded-lg text-[13px] font-medium cursor-pointer whitespace-nowrap transition-all duration-200 ${
                      invoiceType === 'company'
                        ? 'bg-[#F5F5F7] text-[#1D1D1F] border-2 border-[#1D1D1F]'
                        : 'bg-[#F5F5F7] text-[#6E6E73] border-2 border-transparent'
                    }`}
                  >
                    企业
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[13px] text-[#6E6E73] mb-2 block">
                  {invoiceType === 'personal' ? '个人名称' : '企业名称'}
                </label>
                <input
                  type="text"
                  value={invoiceTitle}
                  onChange={(e) => setInvoiceTitle(e.target.value)}
                  placeholder={invoiceType === 'personal' ? '请输入个人名称' : '请输入企业名称'}
                  className="w-full h-11 px-4 bg-[#F5F5F7] rounded-lg text-[14px] text-[#1D1D1F] placeholder:text-[#C6C6C8] outline-none border border-[#E5E5EA]"
                />
              </div>
              {invoiceType === 'company' && (
                <div>
                  <label className="text-[13px] text-[#6E6E73] mb-2 block">税号</label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    placeholder="请输入企业税号"
                    className="w-full h-11 px-4 bg-[#F5F5F7] rounded-lg text-[14px] text-[#1D1D1F] placeholder:text-[#C6C6C8] outline-none border border-[#E5E5EA]"
                  />
                </div>
              )}
              <div>
                <label className="text-[13px] text-[#6E6E73] mb-2 block">接收邮箱</label>
                <input
                  type="email"
                  value={invoiceEmail}
                  onChange={(e) => setInvoiceEmail(e.target.value)}
                  placeholder="请输入接收发票的邮箱"
                  className="w-full h-11 px-4 bg-[#F5F5F7] rounded-lg text-[14px] text-[#1D1D1F] placeholder:text-[#C6C6C8] outline-none border border-[#E5E5EA]"
                />
              </div>
            </div>
          )}
        </div>

        {/* 备注输入 */}
        <div className="bg-white mt-2 p-4 border-b border-[#E5E5EA]">
          <label className="text-[15px] font-medium text-[#1D1D1F] mb-3 block">给商家留言</label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="选填，如有特殊需求请在此说明..."
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 bg-[#F5F5F7] rounded-lg text-[14px] text-[#1D1D1F] placeholder:text-[#C6C6C8] outline-none resize-none border border-[#E5E5EA]"
          />
          <div className="flex items-center justify-end mt-2">
            <span className="text-[11px] text-[#C6C6C8]">{remark.length}/500</span>
          </div>
        </div>
      </div>

      {/* 底部吸底栏 */}
      <div 
        className="fixed left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#E5E5EA]"
        style={{ 
          bottom: '0',
          paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
          paddingTop: '12px'
        }}
      >
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] text-[#6E6E73]">合计</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[12px] text-[#1D1D1F]">¥</span>
              <span className="text-[24px] font-bold text-[#1D1D1F]">
                {totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
          <button
            onClick={handleSubmitOrder}
            disabled={!canSubmit || isSubmitting}
            className={`w-full h-12 rounded-[16px] text-[16px] font-semibold cursor-pointer whitespace-nowrap transition-all duration-200 ${
              canSubmit && !isSubmitting
                ? 'bg-white border border-[#D2D2D7] text-[#1D1D1F] active:bg-[#F5F5F7]'
                : 'bg-[#E5E5EA] text-[#C6C6C8] border border-transparent'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <i className="ri-loader-4-line text-[18px] animate-spin"></i>
                提交中...
              </span>
            ) : (
              '提交订单'
            )}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full h-10 mt-2 text-[14px] text-[#6E6E73] cursor-pointer whitespace-nowrap"
          >
            返回继续逛
          </button>
        </div>
      </div>

      {/* Toast 提示 */}
      {showToast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-black/80 rounded-2xl px-6 py-4 max-w-[280px]">
            <p className="text-[14px] text-white text-center">{toastMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
