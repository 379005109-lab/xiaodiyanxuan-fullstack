
import { useLocation, useNavigate } from 'react-router-dom';
import { cartItems } from '../mocks/cart';

const TabBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 计算提醒数量：待付款订单数(2) + 购物车数量
  const pendingOrderCount = 2; // 待付款订单数
  const cartCount = cartItems.length;
  const profileBadgeCount = pendingOrderCount + cartCount;

  const tabs = [
    { path: '/', icon: 'ri-home-5-line', activeIcon: 'ri-home-5-fill', label: '首页', badge: 0 },
    { path: '/products/category', icon: 'ri-apps-2-line', activeIcon: 'ri-apps-2-fill', label: '分类', badge: 0 },
    { path: '/ai', icon: 'ri-magic-line', activeIcon: 'ri-magic-fill', label: 'AI', badge: 0 },
    { path: '/packages', icon: 'ri-stack-line', activeIcon: 'ri-stack-fill', label: '套餐', badge: 0 },
    { path: '/profile', icon: 'ri-user-line', activeIcon: 'ri-user-fill', label: '我的', badge: profileBadgeCount },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-apple-bg border-t border-apple-divider z-50">
      <div className="flex items-center justify-around h-[60px] max-w-[640px] mx-auto">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-all duration-150 active:scale-90"
            >
              <div className="relative">
                <i
                  className={`${active ? tab.activeIcon : tab.icon} text-[24px] mb-1 transition-all duration-200 ${
                    active ? 'animate-[iconBounce_0.3s_cubic-bezier(0.25,0.46,0.45,0.94)]' : ''
                  }`}
                  style={{ color: active ? '#1D1D1F' : '#6E6E73' }}
                />
                {tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] bg-[#FF3B30] text-white text-[10px] font-medium rounded-full flex items-center justify-center px-1">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span
                className="text-[11px] transition-colors duration-200"
                style={{ color: active ? '#1D1D1F' : '#6E6E73' }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabBar;
