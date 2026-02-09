import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { packages, purchaseRecords } from '../../../mocks/packages';

export default function MyPackagesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'active' | 'expired'>('active');

  const activeRecords = purchaseRecords.filter((r) => r.status === 'active');
  const expiredRecords = purchaseRecords.filter((r) => r.status === 'expired');

  const displayRecords = activeTab === 'active' ? activeRecords : expiredRecords;

  const getPackageById = (pkgId: number) => packages.find((p) => p.id === pkgId);

  /** 
   * Calculate remaining days safely.
   * Returns 0 if the date string is invalid.
   */
  const calculateRemainingDays = (expireDate: string) => {
    const expire = new Date(expireDate);
    if (isNaN(expire.getTime())) {
      console.warn(`Invalid expireDate: "${expireDate}"`);
      return 0;
    }
    const now = new Date();
    const diff = expire.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-[env(safe-area-inset-bottom)]">
      {/* 顶部导航栏 - Apple风格 */}
      <div
        className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="h-11 flex items-center justify-between px-4">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-90"
          >
            <i className="ri-arrow-left-s-line text-[28px] text-[#1D1D1F]"></i>
          </button>
          <h1 className="text-[17px] font-semibold text-[#1D1D1F]">我的套餐</h1>
          <div className="w-8"></div>
        </div>
      </div>

      <div
        className="px-4"
        style={{ paddingTop: 'calc(44px + env(safe-area-inset-top) + 16px)' }}
      >
        {/* Tab 切换 - iOS Segmented Control */}
        <div className="flex bg-[#E5E5EA] rounded-lg p-1 mb-4">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 rounded-md text-[14px] font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === 'active'
                ? 'bg-white text-[#1D1D1F] shadow-sm'
                : 'text-[#6E6E73]'
            }`}
          >
            生效中 ({activeRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('expired')}
            className={`flex-1 py-2 rounded-md text-[14px] font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === 'expired'
                ? 'bg-white text-[#1D1D1F] shadow-sm'
                : 'text-[#6E6E73]'
            }`}
          >
            已过期 ({expiredRecords.length})
          </button>
        </div>

        {/* 套餐列表 */}
        {displayRecords.length > 0 ? (
          <div className="space-y-3">
            {displayRecords.map((record) => {
              const pkg = getPackageById(record.packageId);
              if (!pkg) return null;

              const remainingDays = calculateRemainingDays(record.expireDate);

              // 防止除以 0
              const progressPercent =
                pkg.validDays > 0
                  ? Math.min(100, (remainingDays / pkg.validDays) * 100)
                  : 0;

              return (
                <Link
                  key={record.id}
                  to={`/packages/detail/${record.packageId}`}
                  className="block bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-150 active:scale-[0.98]"
                >
                  <div className="flex gap-4 p-4">
                    <img
                      src={pkg.image}
                      alt={pkg.name}
                      className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-[16px] font-semibold text-[#1D1D1F]">
                          {pkg.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0 ${
                            record.status === 'active'
                              ? 'bg-[#34C759]/10 text-[#34C759]'
                              : 'bg-[#8E8E93]/10 text-[#8E8E93]'
                          }`}
                        >
                          {record.status === 'active' ? '生效中' : '已过期'}
                        </span>
                      </div>

                      <p className="text-[13px] text-[#8E8E93] mb-2">
                        购买时间：{record.purchaseDate}
                      </p>

                      {record.status === 'active' && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[#E5E5EA] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#1D1D1F] rounded-full transition-all"
                              style={{ width: `${progressPercent}%` }}
                            ></div>
                          </div>
                          <span className="text-[12px] text-[#1D1D1F] font-medium whitespace-nowrap">
                            剩余{remainingDays}天
                          </span>
                        </div>
                      )}

                      {record.status === 'expired' && (
                        <p className="text-[13px] text-[#8E8E93]">
                          过期时间：{record.expireDate}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 套餐内容预览 */}
                  <div className="px-4 pb-4">
                    <div className="flex flex-wrap gap-1.5">
                      {pkg.contents.slice(0, 3).map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-[#F5F5F7] rounded-lg text-[12px] text-[#6E6E73]"
                        >
                          {item.name}
                        </span>
                      ))}
                      {pkg.contents.length > 3 && (
                        <span className="px-2 py-1 bg-[#F5F5F7] rounded-lg text-[12px] text-[#8E8E93]">
                          +{pkg.contents.length - 3}项
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-[#E5E5EA] rounded-full flex items-center justify-center mb-4">
              <i className="ri-gift-line text-[40px] text-[#8E8E93]"></i>
            </div>
            <p className="text-[15px] text-[#6E6E73] mb-4">
              {activeTab === 'active' ? '暂无生效中的套餐' : '暂无已过期的套餐'}
            </p>
            <Link
              to="/packages"
              className="px-6 py-2.5 bg-white border border-[#D2D2D7] rounded-[14px] text-[14px] font-medium text-[#1D1D1F] cursor-pointer whitespace-nowrap transition-all duration-150 active:bg-[#F5F5F7]"
            >
              去选购套餐
            </Link>
          </div>
        )}

        {/* 底部提示 */}
        {displayRecords.length > 0 && (
          <div className="text-center py-8 text-[13px] text-[#6E6E73]">
            已展示全部记录
          </div>
        )}
      </div>
    </div>
  );
}
