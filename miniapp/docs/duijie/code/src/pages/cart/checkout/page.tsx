import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cartItems as mockCartItems } from '../../../mocks/cart';
import { mockAddresses } from '../../../mocks/address';

interface CheckoutItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  spec: string;
  color: string;
  price: number;
  quantity: number;
}

export default function CartCheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [selectedAddress, setSelectedAddress] = useState(mockAddresses.find(addr => addr.isDefault) || null);
  const [needInvoice, setNeedInvoice] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'personal' | 'company'>('personal');
  const [invoiceTitle, setInvoiceTitle] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [invoiceEmail, setInvoiceEmail] = useState('');
  const [remark, setRemark] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const shippingFee = 0;
  const estimatedDelivery = '7-10个工作日';

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + shippingFee;

  useEffect(() => {
    setTimeout(() => {
      const selectedItems = mockCartItems
        .filter(item => item.selected)
        .map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.name,
          image: item.image,
          spec: item.spec,
          color: item.color,
          price: item.price,
          quantity: item.quantity
        }));
      
      setItems(selectedItems);
      setLoading(false);
    }, 800);
  }, []);

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleSubmitOrder = async () => {
    if (!selectedAddress) {
      showToastMessage('请选择收货地址');
      return;
    }

    if (needInvoice) {
      if (!invoiceTitle) {
        showToastMessage('请填写发票抬头');
        return;
      }
      if (invoiceType === 'company' && !taxNumber) {
        showToastMessage('请填写税号');
        return;
      }
      if (!invoiceEmail) {
        showToastMessage('请填写接收邮箱');
        return;
      }
    }

    setSubmitting(true);
    
    setTimeout(() => {
      setSubmitting(false);
      navigate('/cart/checkout/result', { 
        state: { 
          orderNo: 'ORD' + Date.now(),
          total: total 
        } 
      });
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7]">
        <div 
          className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA]"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="h-[44px] flex items-center justify-center px-4">
            <div className="w-6 h-6 rounded-lg bg-[#F5F5F7] animate-pulse"></div>
            <div className="flex-1"></div>
            <div className="w-16 h-5 rounded bg-[#F5F5F7] animate-pulse"></div>
            <div className="flex-1"></div>
            <div className="w-6 h-6"></div>
          </div>
        </div>

        <div style={{ paddingTop: 'calc(44px + env(safe-area-inset-top))' }} className="p-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4">
              <div className="h-20 bg-[#F5F5F7] rounded-xl animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F5F7]">
        <div 
          className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA]"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="h-[44px] flex items-center justify-between px-4">
            <button 
              onClick={() => navigate('/cart')}
              className="w-8 h-8 flex items-center justify-center cursor-pointer"
            >
              <i className="ri-arrow-left-line text-[20px] text-[#1D1D1F]"></i>
            </button>
            <h1 className="text-[17px] font-semibold text-[#1D1D1F]">确认订单</h1>
            <div className="w-8"></div>
          </div>
        </div>

        <div style={{ paddingTop: 'calc(44px + env(safe-area-inset-top))' }} className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 flex items-center justify-center bg-[#F5F5F7] rounded-full mb-4">
            <i className="ri-shopping-bag-line text-[48px] text-[#C6C6C8]"></i>
          </div>
          <p className="text-[15px] text-[#6E6E73] mb-4">暂无可结算商品</p>
          <button 
            onClick={() => navigate('/products/category')}
            className="h-[48px] px-6 bg-white border border-[#D2D2D7] rounded-[16px] flex items-center justify-center text-[15px] text-[#1D1D1F] font-medium cursor-pointer whitespace-nowrap transition-all duration-150 active:bg-[#F5F5F7]"
          >
            去逛逛
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-[calc(140px+env(safe-area-inset-bottom))]">
      <div 
        className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="h-[44px] flex items-center justify-between px-4">
          <button 
            onClick={() => navigate('/cart')}
            className="w-8 h-8 flex items-center justify-center cursor-pointer"
          >
            <i className="ri-arrow-left-line text-[20px] text-[#1D1D1F]"></i>
          </button>
          <h1 className="text-[17px] font-semibold text-[#1D1D1F]">确认订单</h1>
          <div className="w-8"></div>
        </div>
      </div>

      <div style={{ paddingTop: 'calc(44px + env(safe-area-inset-top))' }}>
        <div className="px-4 py-3 bg-[#FFF9E6] border-b border-[#E5E5EA]">
          <p className="text-[13px] text-[#8B7000] text-center">核对收货人与商品清单后即可提交订单</p>
        </div>

        <div className="p-4 space-y-3">
          <div className="bg-white rounded-2xl overflow-hidden border border-[#E5E5EA]">
            {selectedAddress ? (
              <button
                onClick={() => navigate('/cart/checkout/address-select')}
                className="w-full p-4 flex items-start gap-3 cursor-pointer"
              >
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  <i className="ri-map-pin-line text-[20px] text-[#6E6E73]"></i>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[15px] font-medium text-[#1D1D1F]">{selectedAddress.name}</span>
                    <span className="text-[14px] text-[#6E6E73]">{selectedAddress.phone}</span>
                    {selectedAddress.isDefault && (
                      <span className="px-1.5 py-0.5 bg-[#F5F5F7] rounded text-[10px] text-[#6E6E73]">默认</span>
                    )}
                  </div>
                  <p className="text-[13px] text-[#6E6E73] leading-[1.5]">
                    {selectedAddress.province}{selectedAddress.city}{selectedAddress.district}{selectedAddress.detail}
                  </p>
                </div>
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  <i className="ri-arrow-right-s-line text-[20px] text-[#C6C6C8]"></i>
                </div>
              </button>
            ) : (
              <button
                onClick={() => navigate('/cart/checkout/address-edit')}
                className="w-full p-4 flex items-center justify-center gap-2 cursor-pointer"
              >
                <i className="ri-add-line text-[20px] text-[#1D1D1F]"></i>
                <span className="text-[15px] text-[#1D1D1F] font-medium">新增收货地址</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E5E5EA]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-semibold text-[#1D1D1F]">商品清单</h3>
              <span className="text-[13px] text-[#6E6E73]">共 {items.reduce((sum, item) => sum + item.quantity, 0)} 件</span>
            </div>
            
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-[70px] h-[70px] rounded-xl overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] text-[#1D1D1F] line-clamp-2 leading-[1.4] mb-1">
                      {item.name}
                    </h4>
                    <p className="text-[12px] text-[#6E6E73] mb-1">{item.spec}</p>
                    <p className="text-[12px] text-[#6E6E73]">颜色：{item.color}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-baseline gap-0.5 mb-1">
                      <span className="text-[11px] text-[#1D1D1F]">¥</span>
                      <span className="text-[15px] font-semibold text-[#1D1D1F]">
                        {item.price.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#6E6E73]">x{item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-[#E5E5EA] text-right">
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-[13px] text-[#6E6E73]">小计</span>
                <span className="text-[12px] text-[#1D1D1F]">¥</span>
                <span className="text-[18px] font-bold text-[#1D1D1F]">
                  {subtotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#FFF9E6] rounded-2xl p-3 flex items-start gap-2">
            <i className="ri-information-line text-[16px] text-[#FF9500] flex-shrink-0 mt-0.5"></i>
            <p className="text-[13px] text-[#8B7000] leading-[1.5]">
              产品为定制生产，生产周期 6-8 周，下单前请确认
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E5E5EA] space-y-2.5">
            <h3 className="text-[15px] font-semibold text-[#1D1D1F] mb-3">费用明细</h3>
            
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-[#6E6E73]">商品总计</span>
              <span className="text-[14px] text-[#1D1D1F]">¥{subtotal.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-[#6E6E73]">运费</span>
              <span className="text-[14px] text-[#1D1D1F]">{shippingFee === 0 ? '免运费' : `¥${shippingFee}`}</span>
            </div>
            
            <button className="w-full flex items-center justify-between py-2 cursor-pointer">
              <span className="text-[14px] text-[#6E6E73]">优惠券</span>
              <div className="flex items-center gap-1">
                <span className="text-[14px] text-[#6E6E73]">暂无可用</span>
                <i className="ri-arrow-right-s-line text-[16px] text-[#C6C6C8]"></i>
              </div>
            </button>
            
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-[#6E6E73]">预计配送</span>
              <span className="text-[14px] text-[#1D1D1F]">{estimatedDelivery}</span>
            </div>
            
            <div className="pt-2.5 border-t border-[#E5E5EA] flex items-center justify-between">
              <span className="text-[15px] font-semibold text-[#1D1D1F]">应付合计</span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-[14px] text-[#1D1D1F]">¥</span>
                <span className="text-[22px] font-bold text-[#1D1D1F]">
                  {total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E5E5EA]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-semibold text-[#1D1D1F]">发票信息</h3>
              <button
                onClick={() => setNeedInvoice(!needInvoice)}
                className="cursor-pointer"
              >
                <div className={`w-12 h-7 rounded-full transition-colors duration-200 relative ${
                  needInvoice ? 'bg-[#6E6E73]' : 'bg-[#E5E5EA]'
                }`}>
                  <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    needInvoice ? 'right-0.5' : 'left-0.5'
                  }`}></div>
                </div>
              </button>
            </div>

            {needInvoice && (
              <div className="space-y-3 pt-3 border-t border-[#E5E5EA]">
                <div className="flex gap-3">
                  <button
                    onClick={() => setInvoiceType('personal')}
                    className={`flex-1 py-2 rounded-lg text-[14px] font-medium cursor-pointer whitespace-nowrap transition-colors duration-200 ${
                      invoiceType === 'personal'
                        ? 'bg-[#F5F5F7] text-[#1D1D1F] border-2 border-[#1D1D1F]'
                        : 'bg-[#F5F5F7] text-[#6E6E73] border-2 border-transparent'
                    }`}
                  >
                    个人
                  </button>
                  <button
                    onClick={() => setInvoiceType('company')}
                    className={`flex-1 py-2 rounded-lg text-[14px] font-medium cursor-pointer whitespace-nowrap transition-colors duration-200 ${
                      invoiceType === 'company'
                        ? 'bg-[#F5F5F7] text-[#1D1D1F] border-2 border-[#1D1D1F]'
                        : 'bg-[#F5F5F7] text-[#6E6E73] border-2 border-transparent'
                    }`}
                  >
                    企业
                  </button>
                </div>

                <input
                  type="text"
                  placeholder={invoiceType === 'personal' ? '请输入姓名' : '请输入公司名称'}
                  value={invoiceTitle}
                  onChange={(e) => setInvoiceTitle(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#F5F5F7] rounded-lg text-[14px] text-[#1D1D1F] placeholder-[#C6C6C8] outline-none border border-[#E5E5EA]"
                />

                {invoiceType === 'company' && (
                  <input
                    type="text"
                    placeholder="请输入税号"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#F5F5F7] rounded-lg text-[14px] text-[#1D1D1F] placeholder-[#C6C6C8] outline-none border border-[#E5E5EA]"
                  />
                )}

                <input
                  type="email"
                  placeholder="请输入接收邮箱"
                  value={invoiceEmail}
                  onChange={(e) => setInvoiceEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#F5F5F7] rounded-lg text-[14px] text-[#1D1D1F] placeholder-[#C6C6C8] outline-none border border-[#E5E5EA]"
                />
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E5E5EA]">
            <h3 className="text-[15px] font-semibold text-[#1D1D1F] mb-3">给商家留言</h3>
            <textarea
              placeholder="选填，对本次订单的补充说明（500字以内）"
              value={remark}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setRemark(e.target.value);
                }
              }}
              className="w-full h-24 px-3 py-2.5 bg-[#F5F5F7] rounded-lg text-[14px] text-[#1D1D1F] placeholder-[#C6C6C8] outline-none resize-none border border-[#E5E5EA]"
            />
            <div className="text-right mt-1">
              <span className="text-[12px] text-[#6E6E73]">{remark.length}/500</span>
            </div>
          </div>
        </div>
      </div>

      <div 
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E5EA]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="px-4 py-3">
          <button
            onClick={handleSubmitOrder}
            disabled={!selectedAddress || submitting}
            className={`w-full h-[48px] rounded-[16px] text-[16px] font-semibold cursor-pointer whitespace-nowrap transition-all duration-150 ${
              selectedAddress && !submitting
                ? 'bg-white border border-[#D2D2D7] text-[#1D1D1F] active:bg-[#F5F5F7]'
                : 'bg-[#F5F5F7] text-[#C6C6C8] border border-transparent'
            }`}
          >
            {submitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#C6C6C8] border-t-[#1D1D1F] rounded-full animate-spin"></div>
                <span>提交中...</span>
              </div>
            ) : (
              `提交订单 ¥${total.toLocaleString()}`
            )}
          </button>
          <button
            onClick={() => navigate('/cart')}
            className="w-full mt-2 py-2 text-[14px] text-[#6E6E73] cursor-pointer whitespace-nowrap"
          >
            返回购物车继续修改
          </button>
        </div>
      </div>

      {showToast && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 px-6 py-3 bg-black/80 rounded-2xl">
          <p className="text-[14px] text-white whitespace-nowrap">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
