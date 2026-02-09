import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockUser } from '../../mocks/user';
import { cartItems } from '../../mocks/cart';
import TabBar from '../../components/TabBar';

// 骨架屏组件
function Skeleton() {
  return (
    <div className="min-h-screen bg-white pb-20 animate-pulse">
      {/* 导航栏骨架 */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
        <div className="h-11 flex items-center justify-center">
          <div className="w-12 h-5 bg-[#E5E5EA] rounded-md"></div>
        </div>
      </div>
      {/* 用户信息骨架 */}
      <div className="bg-[#F5F5F7] mx-4 mt-4 rounded-2xl p-5 border border-[#E5E5EA]">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#E5E5EA] rounded-full"></div>
          <div className="flex-1">
            <div className="w-24 h-5 bg-[#E5E5EA] rounded-md mb-2"></div>
            <div className="w-32 h-4 bg-[#E5E5EA] rounded-md"></div>
          </div>
        </div>
      </div>
      {/* 资产卡片骨架 */}
      <div className="flex gap-3 mx-4 mt-3">
        <div className="flex-1 h-32 bg-[#E5E5EA] rounded-2xl border border-[#E5E5EA]"></div>
        <div className="flex-1 h-32 bg-[#E5E5EA] rounded-2xl border border-[#E5E5EA]"></div>
      </div>
      {/* 订单骨架 */}
      <div className="bg-[#F5F5F7] mx-4 mt-3 rounded-2xl p-5 border border-[#E5E5EA]">
        <div className="w-20 h-4 bg-[#E5E5EA] rounded-md mb-5"></div>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-[#E5E5EA] rounded-xl border border-[#E5E5EA]"></div>
              <div className="w-8 h-3 bg-[#E5E5EA] rounded border border-[#E5E5EA]"></div>
            </div>
          ))}
        </div>
      </div>
      {/* 服务列表骨架 */}
      <div className="bg-[#F5F5F7] mx-4 mt-3 rounded-2xl overflow-hidden border border-[#E5E5EA]">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center px-5 py-4 border-b border-[#E5E5EA] last:border-b-0">
            <div className="w-6 h-6 bg-[#E5E5EA] rounded-lg border border-[#E5E5EA]"></div>
            <div className="ml-3 w-24 h-4 bg-[#E5E5EA] rounded-md border border-[#E5E5EA]"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Toast 组件
function Toast({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] bg-[#1D1D1F]/90 backdrop-blur-sm text-white text-[15px] px-6 py-3 rounded-2xl shadow-lg animate-[fadeIn_0.2s_ease-out]">
      {message}
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<typeof mockUser | null>(mockUser);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });

  const cartCount = cartItems.length;

  // 模拟加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // 下拉刷新
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    showToast('刷新成功');
  };

  // 重试加载
  const handleRetry = () => {
    setLoadError(false);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };

  // 显示 Toast
  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 2000);
  };

  // 骨架屏
  if (isLoading) {
    return <Skeleton />;
  }

  // 加载失败
  if (loadError) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 bg-[#F5F5F7] rounded-full flex items-center justify-center mb-4">
          <i className="ri-wifi-off-line text-4xl text-[#8E8E93]"></i>
        </div>
        <p className="text-[15px] text-[#6E6E73] mb-6">加载失败，请检查网络</p>
        <p className="text-sm text-[#6E6E73] mb-4">加载失败，请重试</p>
        <button
          onClick={handleRetry}
          className="px-8 h-11 bg-white text-[#1D1D1F] text-[15px] font-medium rounded-[14px] border border-[#D2D2D7] cursor-pointer whitespace-nowrap transition-all duration-150 active:bg-[#F5F5F7]"
        >
          重新加载
        </button>
      </div>
    );
  }

  // 未登录态
  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        {/* 导航栏 */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
          <div className="h-11 flex items-center justify-center">
            <h1 className="text-[17px] font-semibold text-[#1D1D1F]">我的</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center pt-32 px-8">
          <div className="w-24 h-24 bg-[#F5F5F7] rounded-full flex items-center justify-center mb-6">
            <i className="ri-user-line text-5xl text-[#6E6E73]"></i>
          </div>
          <h2 className="text-[22px] font-semibold text-[#1D1D1F] mb-2">欢迎来到软装家具商城</h2>
          <p className="text-[15px] text-[#6E6E73] mb-8 text-center leading-relaxed">
            登录后可查看订单、管理收藏<br />享受更多会员专属权益
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="w-64 h-12 bg-white text-[#1D1D1F] text-[17px] font-medium rounded-[14px] border border-[#D2D2D7] whitespace-nowrap cursor-pointer transition-all duration-150 active:bg-[#F5F5F7]"
          >
            立即登录
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="mt-4 text-[15px] text-[#1D1D1F] cursor-pointer whitespace-nowrap transition-opacity duration-150 active:opacity-60"
          >
            还没有账号？立即注册
          </button>
        </div>
      </div>
    );
  }

  // 已登录态
  return (
    <div className="min-h-screen bg-white pb-[calc(60px+env(safe-area-inset-bottom)+24px)]">
      {/* Toast */}
      <Toast message={toast.message} visible={toast.visible} />

      {/* 导航栏 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
        <div className="h-11 flex items-center justify-center">
          <h1 className="text-[17px] font-semibold text-[#1D1D1F]">我的</h1>
        </div>
      </div>

      {/* 下拉刷新提示 */}
      {isRefreshing && (
        <div className="flex items-center justify-center py-3 bg-white">
          <i className="ri-loader-4-line text-[#1D1D1F] animate-spin mr-2"></i>
          <span className="text-[13px] text-[#6E6E73]">刷新中...</span>
        </div>
      )}

      {/* 1. 顶部个人信息卡 */}
      <div className="bg-[#F5F5F7] mx-4 mt-4 rounded-2xl p-5 border border-[#E5E5EA]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/profile/avatar')}
            className="cursor-pointer transition-transform duration-150 active:scale-95"
          >
            <img
              src={user.avatar}
              alt={user.nickname}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-[#E5E5EA]"
            />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-[20px] font-semibold text-[#1D1D1F]">{user.nickname}</h2>
              <button
                onClick={() => navigate('/profile/edit')}
                className="w-6 h-6 flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-90"
              >
                <i className="ri-pencil-line text-sm text-[#8E8E93]"></i>
              </button>
            </div>
            <p className="text-[14px] text-[#8E8E93] mt-0.5">{user.phone}</p>
          </div>
          <button
            onClick={() => navigate('/profile/edit')}
            className="w-8 h-8 flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-90"
          >
            <i className="ri-arrow-right-s-line text-xl text-[#C7C7CC]"></i>
          </button>
        </div>
      </div>

      {/* 2. 核心资产区 */}
      <div className="flex gap-3 mx-4 mt-3">
        {/* 我的积分 */}
        <div
          onClick={() => navigate('/profile/points')}
          className="flex-1 bg-gradient-to-br from-[#F5F5F7] to-[#E8E8ED] rounded-2xl p-4 cursor-pointer transition-all duration-150 active:scale-[0.98] border border-[#E5E5EA]"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[13px] text-[#6E6E73]">我的积分</span>
            <i className="ri-arrow-right-s-line text-[#C7C7CC]"></i>
          </div>
          <p className="text-[32px] font-bold text-[#1D1D1F] leading-tight">{user.points || 2580}</p>
          <p className="text-[12px] text-[#8E8E93] mt-1 mb-3">用于 AI 生图消耗</p>
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/profile/points?recharge=true'); }}
              className="flex-1 h-8 bg-[#FFF8F0] text-[#1D1D1F] text-[13px] font-medium rounded-full border border-[#E8D5C4] whitespace-nowrap cursor-pointer transition-all duration-150 active:bg-[#FFEFE0]"
            >
              去充值
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/ai'); }}
              className="flex-1 h-8 bg-white text-[#1D1D1F] text-[13px] font-medium rounded-full border border-[#D2D2D7] whitespace-nowrap cursor-pointer transition-all duration-150 active:bg-[#F5F5F7]"
            >
              去生成
            </button>
          </div>
        </div>

        {/* 优惠券 */}
        <div
          onClick={() => navigate('/profile/coupons')}
          className="flex-1 bg-gradient-to-br from-[#F5F5F7] to-[#E8E8ED] rounded-2xl p-4 cursor-pointer transition-all duration-150 active:scale-[0.98] border border-[#E5E5EA]"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[13px] text-[#6E6E73]">优惠券</span>
            <i className="ri-arrow-right-s-line text-[#C7C7CC]"></i>
          </div>
          <p className="text-[32px] font-bold text-[#1D1D1F] leading-tight">
            {user.stats?.coupons || 3}
            <span className="text-[14px] font-normal ml-1 text-[#6E6E73]">张可用</span>
          </p>
          <p className="text-[12px] text-[#8E8E93] mt-1 mb-3">下单立减，限时优惠</p>
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/profile/coupons'); }}
            className="w-full h-8 bg-white text-[#1D1D1F] text-[13px] font-medium rounded-full border border-[#D2D2D7] whitespace-nowrap cursor-pointer transition-all duration-150 active:bg-[#F5F5F7]"
          >
            去使用
          </button>
        </div>
      </div>

      {/* 3. 我的订单模块 */}
      <div className="bg-[#F5F5F7] mx-4 mt-3 rounded-2xl overflow-hidden border border-[#E5E5EA]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5EA]">
          <h3 className="text-[17px] font-semibold text-[#1D1D1F]">我的订单</h3>
          <button
            onClick={() => navigate('/orders/list')}
            className="flex items-center text-[14px] text-[#8E8E93] cursor-pointer whitespace-nowrap transition-opacity duration-150 active:opacity-60"
          >
            全部订单
            <i className="ri-arrow-right-s-line text-lg ml-0.5"></i>
          </button>
        </div>
        <div className="py-4 px-6">
          {/* 首屏4个高频状态 */}
          <div className="grid grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/orders/list?status=pending')}
              className="flex flex-col items-center cursor-pointer transition-all duration-150 active:scale-95"
            >
              <div className="relative w-12 h-12 bg-white rounded-full flex items-center justify-center border border-[#E5E5EA]">
                <i className="ri-wallet-3-line text-[24px] text-[#1D1D1F]"></i>
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#FF3B30] text-white text-[11px] rounded-full flex items-center justify-center px-1">2</span>
              </div>
              <span className="text-[13px] text-[#1D1D1F] mt-2 whitespace-nowrap">待付款</span>
            </button>
            <button
              onClick={() => navigate('/orders/list?status=paid')}
              className="flex flex-col items-center cursor-pointer transition-all duration-150 active:scale-95"
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-[#E5E5EA]">
                <i className="ri-box-3-line text-[24px] text-[#1D1D1F]"></i>
              </div>
              <span className="text-[13px] text-[#1D1D1F] mt-2 whitespace-nowrap">待发货</span>
            </button>
            <button
              onClick={() => navigate('/orders/list?status=shipping')}
              className="flex flex-col items-center cursor-pointer transition-all duration-150 active:scale-95"
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-[#E5E5EA]">
                <i className="ri-truck-line text-[24px] text-[#1D1D1F]"></i>
              </div>
              <span className="text-[13px] text-[#1D1D1F] mt-2 whitespace-nowrap">待收货</span>
            </button>
            <button
              onClick={() => navigate('/orders/list?status=all')}
              className="flex flex-col items-center cursor-pointer transition-all duration-150 active:scale-95"
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-[#E5E5EA]">
                <i className="ri-more-line text-[24px] text-[#1D1D1F]"></i>
              </div>
              <span className="text-[13px] text-[#1D1D1F] mt-2 whitespace-nowrap">更多</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. 更多服务列表 */}
      <div className="bg-[#F5F5F7] mx-4 mt-3 rounded-2xl overflow-hidden border border-[#E5E5EA]">
        <button
          onClick={() => navigate('/cart')}
          className="w-full flex items-center px-5 py-4 border-b border-[#E5E5EA] cursor-pointer transition-colors duration-150 active:bg-[#E8E8ED]"
        >
          <div className="w-7 h-7 flex items-center justify-center">
            <i className="ri-shopping-cart-2-line text-[22px] text-[#6E6E73]"></i>
          </div>
          <span className="ml-3 flex-1 text-left text-[17px] text-[#1D1D1F]">购物车</span>
          {cartCount > 0 && (
            <span className="mr-2 px-2 py-0.5 bg-[#FF3B30] text-white text-[11px] font-medium rounded-full">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
          <i className="ri-arrow-right-s-line text-xl text-[#C7C7CC]"></i>
        </button>

        <button
          onClick={() => navigate('/profile/address')}
          className="w-full flex items-center px-5 py-4 border-b border-[#E5E5EA] cursor-pointer transition-colors duration-150 active:bg-[#E8E8ED]"
        >
          <div className="w-7 h-7 flex items-center justify-center">
            <i className="ri-map-pin-2-line text-[22px] text-[#6E6E73]"></i>
          </div>
          <span className="ml-3 flex-1 text-left text-[17px] text-[#1D1D1F]">地址管理</span>
          <i className="ri-arrow-right-s-line text-xl text-[#C7C7CC]"></i>
        </button>

        <button
          onClick={() => navigate('/profile/invoice')}
          className="w-full flex items-center px-5 py-4 border-b border-[#E5E5EA] cursor-pointer transition-colors duration-150 active:bg-[#E8E8ED]"
        >
          <div className="w-7 h-7 flex items-center justify-center">
            <i className="ri-file-text-line text-[22px] text-[#6E6E73]"></i>
          </div>
          <span className="ml-3 flex-1 text-left text-[17px] text-[#1D1D1F]">发票管理</span>
          <i className="ri-arrow-right-s-line text-xl text-[#C7C7CC]"></i>
        </button>

        <button
          onClick={() => navigate('/profile/privacy')}
          className="w-full flex items-center px-5 py-4 border-b border-[#E5E5EA] cursor-pointer transition-colors duration-150 active:bg-[#E8E8ED]"
        >
          <div className="w-7 h-7 flex items-center justify-center">
            <i className="ri-shield-keyhole-line text-[22px] text-[#6E6E73]"></i>
          </div>
          <span className="ml-3 flex-1 text-left text-[17px] text-[#1D1D1F]">隐私与账号安全</span>
          <i className="ri-arrow-right-s-line text-xl text-[#C7C7CC]"></i>
        </button>

        <a
          href="tel:400-888-8888"
          className="w-full flex items-center px-5 py-4 cursor-pointer transition-colors duration-150 active:bg-[#E8E8ED]"
        >
          <div className="w-7 h-7 flex items-center justify-center">
            <i className="ri-customer-service-line text-[22px] text-[#6E6E73]"></i>
          </div>
          <span className="ml-3 flex-1 text-left text-[17px] text-[#1D1D1F]">帮助与客服</span>
          <span className="text-[15px] text-[#1D1D1F] font-medium mr-2">400-888-8888</span>
          <i className="ri-arrow-right-s-line text-xl text-[#C7C7CC]"></i>
        </a>
      </div>

      {/* 5. 退出登录按钮 */}
      <div className="mx-4 mt-6">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full h-12 bg-white text-[#FF3B30] text-[17px] font-medium rounded-[14px] border border-[#D2D2D7] cursor-pointer whitespace-nowrap transition-all duration-150 active:bg-[#F5F5F7]"
        >
          退出登录
        </button>
      </div>

      {/* 底部安全间距 */}
      <div className="h-6"></div>

      {/* 退出登录确认弹窗 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-8 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-[20px] w-full max-w-[280px] overflow-hidden animate-[scaleIn_0.22s_cubic-bezier(0.25,0.46,0.45,0.94)]">
            <div className="px-6 pt-8 pb-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#FFF5F5] rounded-full flex items-center justify-center">
                <i className="ri-logout-circle-r-line text-[32px] text-[#FF3B30]"></i>
              </div>
              <h3 className="text-[20px] font-semibold text-[#1D1D1F] mb-2">确认退出登录？</h3>
              <p className="text-[15px] text-[#6E6E73]">退出后需要重新登录才能查看订单和个人信息</p>
            </div>
            <div className="grid grid-cols-2 border-t border-[#E5E5EA]">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="h-14 text-[17px] text-[#6E6E73] border-r border-[#E5E5EA] cursor-pointer whitespace-nowrap transition-colors duration-150 active:bg-[#F5F5F7]"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setUser(null);
                  setShowLogoutConfirm(false);
                  showToast('已退出登录');
                  // 延迟跳转到登录页
                  setTimeout(() => {
                    navigate('/login');
                  }, 500);
                }}
                className="h-14 text-[17px] text-[#FF3B30] font-medium cursor-pointer whitespace-nowrap transition-colors duration-150 active:bg-[#F5F5F7]"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      )}

      <TabBar />
    </div>
  );
}
