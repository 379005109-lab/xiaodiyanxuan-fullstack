import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { pointsData, rechargePackages, aiConsumptionReference } from '../../../mocks/points';

type FilterType = 'all' | 'earn' | 'spend';

export default function PointsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<FilterType>('all');
  const [showRules, setShowRules] = useState(false);
  const [showRecharge, setShowRecharge] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>('2');
  const [rechargeSuccess, setRechargeSuccess] = useState(false);

  // 监听URL参数，自动打开充值弹窗
  useEffect(() => {
    if (searchParams.get('recharge') === 'true') {
      setShowRecharge(true);
      // 清除URL参数
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const filteredRecords = pointsData.records.filter((record) => {
    if (filter === 'all') return true;
    if (filter === 'earn') return record.type === 'earn';
    if (filter === 'spend') return record.type === 'spend';
    return true;
  });

  const handleRecharge = () => {
    setRechargeSuccess(true);
    setTimeout(() => {
      setRechargeSuccess(false);
      setShowRecharge(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-20">
      {/* 导航栏 */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
        <div className="h-11 flex items-center justify-between px-4">
          <button
            onClick={() => navigate('/profile')}
            className="w-6 h-6 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
          >
            <i className="ri-arrow-left-s-line text-xl text-[#1D1D1F]"></i>
          </button>
          <span className="text-[15px] font-semibold text-[#1D1D1F]">我的积分</span>
          <button
            onClick={() => setShowRules(true)}
            className="text-[#1D1D1F] text-sm active:scale-95 transition-transform cursor-pointer"
          >
            规则
          </button>
        </div>
      </div>

      {/* 积分余额卡片 */}
      <div className="p-4">
        <div className="bg-white rounded-2xl p-6 relative overflow-hidden border border-[#E5E5EA]">
          {/* 装饰背景 */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#F5F5F7] rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-28 h-28 bg-[#F5F5F7] rounded-full -ml-12 -mb-12"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#6E6E73] text-sm">当前积分</span>
              {pointsData.expiringSoon > 0 && (
                <span className="text-xs px-2 py-0.5 bg-[#FF9F0A]/10 rounded-full text-[#FF9F0A]">
                  {pointsData.expiringSoon}积分即将过期
                </span>
              )}
            </div>

            <div className="text-[42px] font-bold tracking-tight mb-5 text-[#1D1D1F]">{pointsData.balance.toLocaleString()}</div>

            <button
              onClick={() => setShowRecharge(true)}
              className="w-full py-3 bg-white text-[#1D1D1F] rounded-[14px] border border-[#D2D2D7] text-sm font-semibold active:bg-[#F5F5F7] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <i className="ri-add-circle-line text-base"></i>
              充值积分
            </button>
          </div>
        </div>
      </div>

      {/* AI消耗参考 */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <i className="ri-sparkling-line text-sm text-[#FF9F0A]"></i>
            <span className="text-xs font-medium text-[#1D1D1F]">AI功能积分消耗参考</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {aiConsumptionReference.map((item, index) => (
              <div key={index} className="flex items-center gap-2 py-1.5">
                <div className="w-6 h-6 flex items-center justify-center rounded-md bg-[#F5F5F7]">
                  <i className={`${item.icon} text-xs text-[#6E6E73]`}></i>
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-[#1D1D1F] truncate">{item.name}</div>
                  <div className="text-[10px] text-[#8E8E93]">
                    {item.points === 0 ? '免费' : `${item.points}积分/次`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 积分明细标题 + 筛选标签 */}
      <div className="px-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[15px] font-semibold text-[#1D1D1F]">积分明细</span>
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all' as FilterType, label: '全部' },
            { key: 'earn' as FilterType, label: '充值' },
            { key: 'spend' as FilterType, label: '消耗' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 cursor-pointer border ${
                filter === tab.key
                  ? 'bg-[#F5F5F7] text-[#1D1D1F] font-semibold border-[#C7C7CC]'
                  : 'bg-white text-[#6E6E73] border-[#D2D2D7]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 积分记录列表 */}
      <div className="px-4 space-y-2">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center">
              <i className="ri-file-list-3-line text-3xl text-[#C7C7CC]"></i>
            </div>
            <p className="text-[#6E6E73] text-sm">暂无记录</p>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <div
              key={record.id}
              className="bg-white rounded-xl px-4 py-3.5"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                    record.type === 'earn' ? 'bg-[#34C759]/10' : 'bg-[#F5F5F7]'
                  }`}>
                    <i className={`${
                      record.type === 'earn' ? 'ri-add-line text-[#34C759]' : 'ri-subtract-line text-[#8E8E93]'
                    } text-sm`}></i>
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-[#1D1D1F] mb-0.5">{record.description}</div>
                    <div className="text-[11px] text-[#8E8E93]">{record.date}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-[15px] font-semibold ${
                      record.type === 'earn' ? 'text-[#34C759]' : 'text-[#1D1D1F]'
                    }`}
                  >
                    {record.type === 'earn' ? '+' : '-'}
                    {record.amount}
                  </div>
                  {record.balance !== undefined && (
                    <div className="text-[10px] text-[#C7C7CC]">余额 {record.balance}</div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 充值弹窗 */}
      {showRecharge && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { if (!rechargeSuccess) setShowRecharge(false); }}
          ></div>
          <div className="relative w-full bg-white rounded-t-[20px] max-h-[85vh] overflow-y-auto">
            {/* 拖拽指示条 */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-9 h-1 bg-[#C7C7CC] rounded-full"></div>
            </div>

            {rechargeSuccess ? (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#34C759]/10 flex items-center justify-center">
                  <i className="ri-check-line text-3xl text-[#34C759]"></i>
                </div>
                <p className="text-lg font-semibold text-[#1D1D1F] mb-1">充值成功</p>
                <p className="text-sm text-[#6E6E73]">积分已到账</p>
              </div>
            ) : (
              <div className="px-5 pb-8">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold text-[#1D1D1F]">充值积分</h3>
                  <button
                    onClick={() => setShowRecharge(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[#F5F5F7] cursor-pointer active:scale-90 transition-transform"
                  >
                    <i className="ri-close-line text-base text-[#6E6E73]"></i>
                  </button>
                </div>

                {/* 充值套餐 */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {rechargePackages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg.id)}
                      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                        selectedPackage === pkg.id
                          ? 'border-[#1D1D1F] bg-[#FAFAFA]'
                          : 'border-[#E5E5EA] bg-white'
                      }`}
                    >
                      {pkg.label && (
                        <span className={`absolute -top-2.5 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                          pkg.label === '最划算'
                            ? 'bg-[#FF9F0A] text-white'
                            : pkg.label === '超值'
                            ? 'bg-[#34C759] text-white'
                            : 'bg-[#FF3B30] text-white'
                        }`}>
                          {pkg.label}
                        </span>
                      )}
                      <div className="text-xl font-bold text-[#1D1D1F] mb-0.5">
                        {pkg.points.toLocaleString()}
                        <span className="text-xs font-normal text-[#8E8E93] ml-1">积分</span>
                      </div>
                      <div className="text-sm text-[#6E6E73]">¥{pkg.amount}</div>
                      {pkg.bonus > 0 && (
                        <div className="text-[11px] text-[#FF9F0A] mt-1 font-medium">
                          额外赠送 {pkg.bonus} 积分
                        </div>
                      )}
                      {selectedPackage === pkg.id && (
                        <div className="absolute top-2 left-2 w-5 h-5 flex items-center justify-center rounded-full bg-[#0071E3]">
                          <i className="ri-check-line text-xs text-white"></i>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* 充值说明 */}
                <div className="bg-[#FFFBF0] rounded-xl p-3 mb-6">
                  <div className="flex items-start gap-2">
                    <i className="ri-information-line text-sm text-[#FF9F0A] mt-0.5"></i>
                    <div className="text-xs text-[#8E8E93] leading-relaxed">
                      <p>充值后积分即时到账，有效期12个月。积分不可提现、不可转让。</p>
                    </div>
                  </div>
                </div>

                {/* 确认充值按钮 */}
                {(() => {
                  const selected = rechargePackages.find(p => p.id === selectedPackage);
                  return (
                    <button
                      onClick={handleRecharge}
                      className="w-full py-3.5 bg-white text-[#1D1D1F] rounded-xl border border-[#D2D2D7] text-sm font-semibold active:bg-[#F5F5F7] transition-all cursor-pointer"
                    >
                      确认充值 ¥{selected?.amount || 0}
                    </button>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 积分规则弹窗 */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowRules(false)}
          ></div>
          <div className="relative w-full bg-white rounded-t-[20px] max-h-[80vh] overflow-y-auto">
            {/* 拖拽指示条 */}
            <div className="flex justify-center pt-2 pb-3">
              <div className="w-9 h-1 bg-[#C7C7CC] rounded-full"></div>
            </div>

            <div className="px-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1D1D1F]">积分规则</h3>
                <button
                  onClick={() => setShowRules(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-[#F5F5F7] cursor-pointer active:scale-90 transition-transform"
                >
                  <i className="ri-close-line text-base text-[#6E6E73]"></i>
                </button>
              </div>

              {pointsData.rules.map((rule, index) => (
                <div key={index} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 bg-[#1D1D1F] rounded-full"></div>
                    <h4 className="font-medium text-[#1D1D1F]">{rule.title}</h4>
                  </div>
                  <ul className="space-y-2 ml-4">
                    {rule.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-[#6E6E73]">
                        <span className="text-[#C7C7CC] mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
