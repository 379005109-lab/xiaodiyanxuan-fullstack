import { useNavigate, useLocation } from 'react-router-dom';

export default function CheckoutResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderNo, total } = location.state || { orderNo: 'ORD' + Date.now(), total: 0 };

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* 顶部导航栏 */}
      <div 
        className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#C6C6C8]/30"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="h-[44px] flex items-center justify-between px-4">
          <button 
            onClick={() => navigate('/')}
            className="w-8 h-8 flex items-center justify-center cursor-pointer"
          >
            <i className="ri-close-line text-[20px] text-[#000000]"></i>
          </button>
          <h1 className="text-[17px] font-semibold text-[#000000]">订单提交成功</h1>
          <div className="w-8"></div>
        </div>
      </div>

      <div style={{ paddingTop: 'calc(44px + env(safe-area-inset-top))' }} className="flex flex-col items-center justify-center py-12 px-4">
        {/* 成功图标 */}
        <div className="w-20 h-20 flex items-center justify-center bg-[#34C759]/10 rounded-full mb-4">
          <i className="ri-check-line text-[48px] text-[#34C759]"></i>
        </div>

        <h2 className="text-[20px] font-semibold text-[#000000] mb-2">订单提交成功</h2>
        <p className="text-[14px] text-[#8E8E93] mb-6">请尽快完成支付</p>

        {/* 订单信息 */}
        <div className="w-full bg-white rounded-2xl p-4 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#F2F2F7]">
            <span className="text-[14px] text-[#8E8E93]">订单号</span>
            <span className="text-[14px] text-[#000000] font-mono">{orderNo}</span>
          </div>
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#F2F2F7]">
            <span className="text-[14px] text-[#8E8E93]">订单状态</span>
            <span className="text-[14px] text-[#FF9500] font-medium">待付款</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#8E8E93]">订单金额</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-[12px] text-[#FF3B30]">¥</span>
              <span className="text-[18px] font-bold text-[#FF3B30]">
                {total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="w-full bg-[#FFF9E6] rounded-2xl p-3 flex items-start gap-2 mb-6">
          <i className="ri-information-line text-[16px] text-[#FF9500] flex-shrink-0 mt-0.5"></i>
          <p className="text-[13px] text-[#8B7000] leading-[1.5]">
            订单已提交，请在24小时内完成支付，超时订单将自动取消
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="w-full space-y-3">
          <button
            onClick={() => {
              // 支付功能占位
              alert('支付功能开发中');
            }}
            className="w-full h-[48px] bg-white border border-[#D2D2D7] rounded-[16px] text-[16px] font-semibold text-[#1D1D1F] cursor-pointer whitespace-nowrap transition-all duration-150 active:bg-[#F5F5F7]"
          >
            去支付
          </button>
          <button
            onClick={() => navigate('/orders/list')}
            className="w-full h-[48px] bg-white border border-[#D2D2D7] rounded-[16px] text-[16px] font-medium text-[#1D1D1F] cursor-pointer whitespace-nowrap transition-all duration-150 active:bg-[#F5F5F7]"
          >
            查看订单
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 text-[14px] text-[#8E8E93] cursor-pointer whitespace-nowrap"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}
