import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const cacheSize = '128.5 MB';
  const version = 'v1.0.0';

  const handleClearCache = () => {
    setToastMessage('缓存清理成功');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleLogout = () => {
    setShowLogoutDialog(false);
    setToastMessage('已退出登录');
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      navigate('/');
    }, 1500);
  };

  const settingsSections = [
    {
      title: '账号与安全',
      items: [
        { label: '绑定手机号', value: '138****8888', icon: 'ri-smartphone-line', link: '/profile/settings/phone' },
        { label: '账号注销', icon: 'ri-user-unfollow-line', link: '/profile/settings/delete-account', danger: true }
      ]
    },
    {
      title: '通用',
      items: [
        { label: '消息通知', icon: 'ri-notification-3-line', type: 'switch' },
        { label: '清理缓存', value: cacheSize, icon: 'ri-delete-bin-line', action: 'clearCache' },
        { label: '隐私政策', icon: 'ri-shield-check-line', link: '/profile/privacy' },
        { label: '用户协议', icon: 'ri-file-text-line', link: '/profile/terms' }
      ]
    },
    {
      title: '帮助与客服',
      items: [
        { label: '常见问题', icon: 'ri-question-line', link: '/profile/settings/faq' },
        { label: '在线客服', icon: 'ri-customer-service-2-line', link: '/profile/settings/support' },
        { label: '客服电话', value: '400-888-8888', icon: 'ri-phone-line', action: 'call' }
      ]
    },
    {
      title: '关于',
      items: [
        { label: '当前版本', value: version, icon: 'ri-information-line' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24">
      {/* 导航栏 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
        <div className="flex items-center justify-between h-11 px-4">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center cursor-pointer"
          >
            <i className="ri-arrow-left-s-line text-xl text-[#1D1D1F]"></i>
          </button>
          <h1 className="text-base font-semibold text-[#1D1D1F]">设置</h1>
          <div className="w-8"></div>
        </div>
      </div>

      {/* 设置列表 */}
      <div className="px-4 pt-4 space-y-4">
        {settingsSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="bg-white rounded-2xl overflow-hidden">
            {section.title && (
              <div className="px-4 pt-3 pb-2">
                <h2 className="text-xs font-medium text-[#6E6E73]">{section.title}</h2>
              </div>
            )}
            <div className="divide-y divide-[#E5E5EA]">
              {section.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  onClick={() => {
                    if (item.link) navigate(item.link);
                    if (item.action === 'clearCache') handleClearCache();
                    if (item.action === 'call') window.location.href = `tel:${item.value}`;
                  }}
                  className={`flex items-center justify-between px-4 py-3.5 ${
                    item.link || item.action ? 'cursor-pointer active:bg-black/5' : ''
                  } transition-colors`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
                      item.danger ? 'bg-red-50' : 'bg-[#F5F5F7]'
                    }`}>
                      <i className={`${item.icon} text-base ${
                        item.danger ? 'text-red-500' : 'text-[#6E6E73]'
                      }`}></i>
                    </div>
                    <span className={`text-sm font-medium ${
                      item.danger ? 'text-red-500' : 'text-[#1D1D1F]'
                    }`}>
                      {item.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.type === 'switch' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNotificationEnabled(!notificationEnabled);
                        }}
                        className={`relative inline-flex h-7 w-11 items-center rounded-full transition-colors cursor-pointer ${
                          notificationEnabled ? 'bg-[#1D1D1F]' : 'bg-[#E5E5EA]'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                            notificationEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    ) : (
                      <>
                        {item.value && (
                          <span className="text-sm text-[#8E8E93]">{item.value}</span>
                        )}
                        {(item.link || item.action === 'clearCache') && (
                          <i className="ri-arrow-right-s-line text-lg text-[#C7C7CC]"></i>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 退出登录按钮 */}
      <div className="px-4 mt-6">
        <button
          onClick={() => setShowLogoutDialog(true)}
          className="w-full h-12 bg-white text-[#FF3B30] text-sm font-medium rounded-2xl active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
        >
          退出登录
        </button>
      </div>

      {/* 退出登录确认弹窗 */}
      {showLogoutDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="bg-white rounded-[20px] w-full max-w-xs overflow-hidden shadow-xl animate-scale-in">
            <div className="px-6 pt-6 pb-4 text-center">
              <h3 className="text-base font-semibold text-[#1D1D1F] mb-2">确认退出登录？</h3>
              <p className="text-sm text-[#6E6E73]">退出后需要重新登录才能使用完整功能</p>
            </div>
            <div className="flex border-t border-[#E5E5EA]">
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="flex-1 h-12 text-sm font-medium text-[#6E6E73] active:bg-black/5 transition-colors cursor-pointer whitespace-nowrap"
              >
                取消
              </button>
              <div className="w-px bg-[#E5E5EA]"></div>
              <button
                onClick={handleLogout}
                className="flex-1 h-12 text-sm font-semibold text-[#FF3B30] active:bg-black/5 transition-colors cursor-pointer whitespace-nowrap"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-[#1D1D1F]/80 backdrop-blur-sm text-white text-sm px-6 py-3 rounded-2xl shadow-lg whitespace-nowrap">
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
}
