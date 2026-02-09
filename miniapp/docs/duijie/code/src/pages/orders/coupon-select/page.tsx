import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { mockCoupons } from '../../../mocks/order';

export default function CouponSelectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderAmount = location.state?.amount || 0;
  const from = location.state?.from || '/orders/confirm';

  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);

  const handleSelectCoupon = (couponId: string | null) => {
    setSelectedCouponId(couponId);
  };

  const handleConfirm = () => {
    navigate(from, {
      state: { selectedCouponId },
      replace: true
    });
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
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
            <i className="ri-arrow-left-line text-[20px] text-[#000000]"></i>
          </button>
          <h1 className="text-[17px] font-semibold text-[#000000]">选择优惠券</h1>
          <div className="w-8"></div>
        </div>
      </div>

      <div 
        className="pb-[calc(80px+env(safe-area-inset-bottom))]"
        style={{ paddingTop: 'calc(44px + env(safe-area-inset-top) + 8px)' }}
      >
        {/* 不使用优惠券选项 */}
        <button
          onClick={() => handleSelectCoupon(null)}
          className={`w-full bg-white p-4 flex items-center justify-between cursor-pointer mb-2 ${
            selectedCouponId === null ? 'border-l-4 border-[#FF6B00]' : ''
          }`}
        >
          <span className="text-[15px] text-[#000000]">不使用优惠券</span>
          <div
            className={`w-5 h-5 flex items-center justify-center rounded-full border-2 transition-all duration-200 ${
              selectedCouponId === null
                ? 'bg-[#FF6B00] border-[#FF6B00]'
                : 'border-[#C6C6C8] bg-white'
            }`}
          >
            {selectedCouponId === null && (
              <i className="ri-check-line text-[14px] text-white"></i>
            )}
          </div>
        </button>

        {/* 优惠券列表 */}
        <div className="space-y-2">
          {mockCoupons.map((coupon) => {
            const canUse = orderAmount >= coupon.minAmount;
            return (
              <button
                key={coupon.id}
                onClick={() => canUse && handleSelectCoupon(coupon.id)}
                disabled={!canUse}
                className={`w-full bg-white p-4 cursor-pointer transition-all duration-200 ${
                  !canUse ? 'opacity-50' : ''
                } ${selectedCouponId === coupon.id ? 'border-l-4 border-[#FF6B00]' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 flex items-center justify-center rounded-full border-2 mt-0.5 transition-all duration-200 ${
                      selectedCouponId === coupon.id
                        ? 'bg-[#FF6B00] border-[#FF6B00]'
                        : 'border-[#C6C6C8] bg-white'
                    }`}
                  >
                    {selectedCouponId === coupon.id && (
                      <i className="ri-check-line text-[14px] text-white"></i>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[11px] text-[#FF3B30]">¥</span>
                      <span className="text-[24px] font-bold text-[#FF3B30]">
                        {coupon.discount}
                      </span>
                    </div>
                    <h4 className="text-[15px] font-medium text-[#000000] mb-1">
                      {coupon.name}
                    </h4>
                    <p className="text-[12px] text-[#8E8E93]">
                      满¥{coupon.minAmount}可用
                    </p>
                    <p className="text-[11px] text-[#C6C6C8] mt-1">
                      有效期至 {coupon.expireDate}
                    </p>
                    {!canUse && (
                      <div className="mt-2 px-2 py-1 bg-[#FF3B30]/10 rounded inline-block">
                        <span className="text-[11px] text-[#FF3B30]">
                          还差¥{coupon.minAmount - orderAmount}可用
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {mockCoupons.length === 0 && (
          <div className="bg-white p-8 flex flex-col items-center justify-center">
            <i className="ri-coupon-line text-[48px] text-[#C6C6C8] mb-3"></i>
            <p className="text-[14px] text-[#8E8E93]">暂无可用优惠券</p>
          </div>
        )}
      </div>

      {/* 底部确认按钮 */}
      <div 
        className="fixed left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#E5E5EA]"
        style={{ 
          bottom: '0',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          paddingTop: '12px'
        }}
      >
        <div className="px-4">
          <button
            onClick={handleConfirm}
            className="w-full h-12 bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] rounded-full text-[16px] text-white font-semibold cursor-pointer whitespace-nowrap"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
