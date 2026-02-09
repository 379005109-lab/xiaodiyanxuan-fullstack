import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockCoupons, Coupon } from '../../../mocks/coupons';

type TabType = 'available' | 'used' | 'expired';
type FilterType = 'all' | 'amount' | 'discount' | 'shipping';
type ScopeType = 'all' | 'category' | 'product';
type SortType = 'default' | 'expiring' | 'value';

export default function CouponsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('available');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterScope, setFilterScope] = useState<ScopeType>('all');
  const [sortType, setSortType] = useState<SortType>('default');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = () => {
    setLoading(true);
    setError(false);
    setTimeout(() => {
      try {
        setCoupons(mockCoupons);
        setLoading(false);
      } catch {
        setError(true);
        setLoading(false);
      }
    }, 800);
  };

  const filteredCoupons = coupons
    .filter(c => c.status === activeTab)
    .filter(c => filterType === 'all' || c.type === filterType)
    .filter(c => filterScope === 'all' || c.scope === filterScope)
    .sort((a, b) => {
      if (sortType === 'expiring') {
        return new Date(a.validEnd).getTime() - new Date(b.validEnd).getTime();
      }
      if (sortType === 'value') {
        const aVal = a.type === 'discount' ? (1 - a.value) * 1000 : a.value;
        const bVal = b.type === 'discount' ? (1 - b.value) * 1000 : b.value;
        return bVal - aVal;
      }
      return 0;
    });

  const handleRedeem = () => {
    if (!redeemCode.trim()) return;
    // 模拟兑换
    setRedeemCode('');
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatValue = (coupon: Coupon) => {
    if (coupon.type === 'discount') {
      return `${coupon.value * 10}折`;
    }
    if (coupon.type === 'shipping') {
      return '免运费';
    }
    return `¥${coupon.value}`;
  };

  const getStatusBadge = (coupon: Coupon) => {
    if (coupon.status === 'used') return '已使用';
    if (coupon.status === 'expired') return '已过期';
    return null;
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'available', label: '可用' },
    { key: 'used', label: '已使用' },
    { key: 'expired', label: '已过期' }
  ];

  const availableCount = coupons.filter(c => c.status === 'available').length;
  const usedCount = coupons.filter(c => c.status === 'used').length;
  const expiredCount = coupons.filter(c => c.status === 'expired').length;

  const getTabCount = (key: TabType) => {
    if (key === 'available') return availableCount;
    if (key === 'used') return usedCount;
    return expiredCount;
  };

  // 骨架屏
  const renderSkeleton = () => (
    <div className="px-3 pt-3 space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
          <div className="flex">
            <div className="w-24 h-20 bg-[#E5E5EA] rounded-xl"></div>
            <div className="flex-1 ml-3">
              <div className="h-4 bg-[#E5E5EA] rounded-xl w-24 mb-2"></div>
              <div className="h-3 bg-[#E5E5EA] rounded-xl w-32 mb-2"></div>
              <div className="h-3 bg-[#E5E5EA] rounded-xl w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // 空状态
  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center pt-24 px-6">
      <div className="w-20 h-20 bg-[#F5F5F7] rounded-full flex items-center justify-center mb-4">
        <i className="ri-coupon-line text-4xl text-[#C7C7CC]"></i>
      </div>
      <p className="text-sm text-[#6E6E73] mb-2">
        {activeTab === 'available' ? '暂无可用优惠券' : activeTab === 'used' ? '暂无已使用优惠券' : '暂无已过期优惠券'}
      </p>
      {activeTab === 'available' && (
        <p className="text-xs text-[#8E8E93]">去商城逛逛，领取更多优惠</p>
      )}
    </div>
  );

  // 失败重试
  const renderError = () => (
    <div className="flex flex-col items-center justify-center pt-24 px-6">
      <div className="w-20 h-20 bg-[#F5F5F7] rounded-full flex items-center justify-center mb-4">
        <i className="ri-wifi-off-line text-4xl text-[#C7C7CC]"></i>
      </div>
      <p className="text-sm text-[#6E6E73] mb-4">加载失败，请重试</p>
      <button
        onClick={loadCoupons}
        className="px-6 h-11 bg-white text-[#1D1D1F] text-sm font-medium rounded-2xl border border-[#D2D2D7] cursor-pointer active:bg-[#F5F5F7] transition-all whitespace-nowrap"
      >
        重新加载
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-6">
      {/* 导航栏 */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
        <div className="px-4 h-11 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center cursor-pointer active:scale-95"
          >
            <i className="ri-arrow-left-s-line text-xl text-[#1D1D1F]"></i>
          </button>
          <h1 className="flex-1 text-center text-base font-semibold text-[#1D1D1F]">优惠券</h1>
          <button
            onClick={() => setShowRules(true)}
            className="w-8 h-8 flex items-center justify-center cursor-pointer active:scale-95"
          >
            <i className="ri-question-line text-lg text-[#6E6E73]"></i>
          </button>
        </div>
      </div>

      {/* 兑换码输入 */}
      <div className="px-3 pt-3">
        <div className="bg-white rounded-xl p-3 flex items-center gap-2">
          <input
            type="text"
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value)}
            placeholder="请输入优惠码"
            className="flex-1 h-9 px-3 bg-[#F5F5F7] rounded-lg text-sm text-[#1D1D1F] placeholder:text-[#C7C7CC] outline-none"
          />
          <button
            onClick={handleRedeem}
            className={`h-9 px-5 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer transition-all ${
              redeemCode.trim()
                ? 'bg-white text-[#1D1D1F] border border-[#D2D2D7] active:bg-[#F5F5F7]'
                : 'bg-[#F5F5F7] text-[#C7C7CC]'
            }`}
          >
            兑换
          </button>
        </div>
      </div>

      {/* Tab切换 */}
      <div className="px-3 pt-3">
        <div className="bg-white rounded-xl p-1 flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 h-9 rounded-lg text-sm font-medium cursor-pointer transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-[#F5F5F7] text-[#1D1D1F] font-semibold border border-[#C7C7CC]'
                  : 'text-[#6E6E73]'
              }`}
            >
              {tab.label}
              {getTabCount(tab.key) > 0 && (
                <span className="ml-1">({getTabCount(tab.key)})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="px-3 pt-3 flex items-center gap-2">
        <button
          onClick={() => setShowFilter(true)}
          className="h-8 px-3 bg-white rounded-full flex items-center gap-1 text-sm text-[#6E6E73] cursor-pointer active:scale-95 whitespace-nowrap"
        >
          <i className="ri-filter-3-line text-base"></i>
          筛选
        </button>
        <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide">
          {filterType !== 'all' && (
            <span className="h-8 px-3 bg-[#E5E5EA] text-[#1D1D1F] rounded-full flex items-center text-xs whitespace-nowrap">
              {filterType === 'amount' ? '满减券' : filterType === 'discount' ? '折扣券' : '运费券'}
              <i
                onClick={() => setFilterType('all')}
                className="ri-close-line ml-1 cursor-pointer"
              ></i>
            </span>
          )}
          {filterScope !== 'all' && (
            <span className="h-8 px-3 bg-[#E5E5EA] text-[#1D1D1F] rounded-full flex items-center text-xs whitespace-nowrap">
              {filterScope === 'category' ? '品类券' : '商品券'}
              <i
                onClick={() => setFilterScope('all')}
                className="ri-close-line ml-1 cursor-pointer"
              ></i>
            </span>
          )}
        </div>
        <button
          onClick={() => setSortType(sortType === 'default' ? 'expiring' : sortType === 'expiring' ? 'value' : 'default')}
          className="h-8 px-3 bg-white rounded-full flex items-center gap-1 text-sm text-[#6E6E73] cursor-pointer active:scale-95 whitespace-nowrap"
        >
          <i className="ri-sort-desc text-base"></i>
          {sortType === 'default' ? '默认' : sortType === 'expiring' ? '即将过期' : '面额最高'}
        </button>
      </div>

      {/* 优惠券列表 */}
      {loading ? (
        renderSkeleton()
      ) : error ? (
        renderError()
      ) : filteredCoupons.length === 0 ? (
        renderEmpty()
      ) : (
        <div className="px-3 pt-3 space-y-3">
          {filteredCoupons.map(coupon => (
            <div
              key={coupon.id}
              onClick={() => setSelectedCoupon(coupon)}
              className={`bg-white rounded-xl overflow-hidden cursor-pointer active:scale-[0.99] transition-transform relative ${
                coupon.status !== 'available' ? 'opacity-60' : ''
              }`}
            >
              {/* 状态角标 */}
              {getStatusBadge(coupon) && (
                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden z-10">
                  <div className="absolute top-3 -right-4 w-20 text-center text-xs text-white py-0.5 transform rotate-45 bg-[#8E8E93]">
                    {getStatusBadge(coupon)}
                  </div>
                </div>
              )}

              <div className="flex">
                {/* 左侧金额区 - Apple 浅底风格 */}
                <div className={`w-28 py-4 flex flex-col items-center justify-center border-r border-dashed ${
                  coupon.status === 'available'
                    ? 'bg-[#F5F5F7] border-[#D2D2D7]'
                    : 'bg-[#F2F2F7] border-[#E5E5EA]'
                }`}>
                  <span className={`text-2xl font-bold ${
                    coupon.status === 'available' ? 'text-[#1D1D1F]' : 'text-[#AEAEB2]'
                  }`}>
                    {coupon.type === 'discount' ? `${coupon.value * 10}` : coupon.type === 'shipping' ? '免' : `¥${coupon.value}`}
                  </span>
                  <span className={`text-xs mt-0.5 ${
                    coupon.status === 'available' ? 'text-[#6E6E73]' : 'text-[#AEAEB2]'
                  }`}>
                    {coupon.type === 'discount' ? '折' : coupon.type === 'shipping' ? '运费' : ''}
                  </span>
                  {coupon.threshold > 0 && (
                    <span className={`text-xs mt-1 ${
                      coupon.status === 'available' ? 'text-[#8E8E93]' : 'text-[#AEAEB2]'
                    }`}>满¥{coupon.threshold}可用</span>
                  )}
                </div>

                {/* 右侧信息区 */}
                <div className="flex-1 p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-[#1D1D1F] mb-0.5">{coupon.title}</h3>
                      <p className="text-xs text-[#6E6E73]">{coupon.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-1.5 py-0.5 bg-[#F5F5F7] text-[#6E6E73] text-xs rounded whitespace-nowrap">
                      {coupon.type === 'amount' ? '满减' : coupon.type === 'discount' ? '折扣' : '运费'}
                    </span>
                    <span className="px-1.5 py-0.5 bg-[#F5F5F7] text-[#6E6E73] text-xs rounded whitespace-nowrap">
                      {coupon.scope === 'all' ? '全场' : coupon.scope === 'category' ? '品类' : '商品'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#8E8E93]">
                        {coupon.validStart} 至 {coupon.validEnd}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[#8E8E93]">券码：{coupon.code}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyCode(coupon.code, coupon.id);
                          }}
                          className="text-xs text-[#1D1D1F] cursor-pointer whitespace-nowrap active:opacity-60"
                        >
                          {copiedId === coupon.id ? '已复制' : '复制'}
                        </button>
                      </div>
                      {coupon.totalCount > 1 && (
                        <p className="text-xs text-[#8E8E93] mt-1">
                          使用次数：{coupon.usedCount}/{coupon.totalCount}
                        </p>
                      )}
                    </div>
                    {coupon.status === 'available' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/products/list');
                        }}
                        className="h-8 px-4 bg-white text-[#1D1D1F] text-xs font-medium rounded-full border border-[#D2D2D7] cursor-pointer active:bg-[#F5F5F7] transition-all whitespace-nowrap"
                      >
                        去使用
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 筛选弹窗 */}
      {showFilter && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowFilter(false)}
          ></div>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[20px] max-h-[70vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-4 py-3 border-b border-[#E5E5EA] flex items-center justify-between">
              <span className="text-base font-semibold text-[#1D1D1F]">筛选</span>
              <button
                onClick={() => setShowFilter(false)}
                className="w-8 h-8 flex items-center justify-center cursor-pointer active:scale-95"
              >
                <i className="ri-close-line text-xl text-[#6E6E73]"></i>
              </button>
            </div>

            <div className="p-4">
              {/* 券类型 */}
              <div className="mb-6">
                <p className="text-sm font-medium text-[#1D1D1F] mb-3">券类型</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: '全部' },
                    { key: 'amount', label: '满减券' },
                    { key: 'discount', label: '折扣券' },
                    { key: 'shipping', label: '运费券' }
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => setFilterType(item.key as FilterType)}
                      className={`h-9 px-4 rounded-[18px] text-sm cursor-pointer whitespace-nowrap transition-all border ${
                        filterType === item.key
                          ? 'bg-[#F5F5F7] text-[#1D1D1F] font-semibold border-[#C7C7CC]'
                          : 'bg-white text-[#6E6E73] border-[#D2D2D7] active:scale-95'
                      }`}
                    >
                      {filterType === item.key && <i className="ri-check-line text-xs text-[#0071E3] mr-1"></i>}
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 使用范围 */}
              <div className="mb-6">
                <p className="text-sm font-medium text-[#1D1D1F] mb-3">使用范围</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: '全部' },
                    { key: 'category', label: '品类券' },
                    { key: 'product', label: '商品券' }
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => setFilterScope(item.key as ScopeType)}
                      className={`h-9 px-4 rounded-[18px] text-sm cursor-pointer whitespace-nowrap transition-all border ${
                        filterScope === item.key
                          ? 'bg-[#F5F5F7] text-[#1D1D1F] font-semibold border-[#C7C7CC]'
                          : 'bg-white text-[#6E6E73] border-[#D2D2D7] active:scale-95'
                      }`}
                    >
                      {filterScope === item.key && <i className="ri-check-line text-xs text-[#0071E3] mr-1"></i>}
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 排序方式 */}
              <div className="mb-6">
                <p className="text-sm font-medium text-[#1D1D1F] mb-3">排序方式</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'default', label: '默认排序' },
                    { key: 'expiring', label: '即将过期' },
                    { key: 'value', label: '面额最高' }
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => setSortType(item.key as SortType)}
                      className={`h-9 px-4 rounded-[18px] text-sm cursor-pointer whitespace-nowrap transition-all border ${
                        sortType === item.key
                          ? 'bg-[#F5F5F7] text-[#1D1D1F] font-semibold border-[#C7C7CC]'
                          : 'bg-white text-[#6E6E73] border-[#D2D2D7] active:scale-95'
                      }`}
                    >
                      {sortType === item.key && <i className="ri-check-line text-xs text-[#0071E3] mr-1"></i>}
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white px-4 py-3 border-t border-[#E5E5EA] flex gap-3">
              <button
                onClick={() => {
                  setFilterType('all');
                  setFilterScope('all');
                  setSortType('default');
                }}
                className="flex-1 h-11 bg-white text-[#1D1D1F] text-sm font-medium rounded-2xl border border-[#D2D2D7] cursor-pointer active:bg-[#F5F5F7] transition-all whitespace-nowrap"
              >
                重置
              </button>
              <button
                onClick={() => setShowFilter(false)}
                className="flex-1 h-11 bg-white text-[#1D1D1F] text-sm font-medium rounded-2xl border border-[#D2D2D7] cursor-pointer active:bg-[#F5F5F7] transition-all whitespace-nowrap"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 使用说明弹窗 */}
      {showRules && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowRules(false)}
          ></div>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[20px] max-h-[70vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-4 py-3 border-b border-[#E5E5EA] flex items-center justify-between">
              <span className="text-base font-semibold text-[#1D1D1F]">使用说明</span>
              <button
                onClick={() => setShowRules(false)}
                className="w-8 h-8 flex items-center justify-center cursor-pointer active:scale-95"
              >
                <i className="ri-close-line text-xl text-[#6E6E73]"></i>
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-[#1D1D1F] mb-2">1. 优惠券类型</h4>
                <p className="text-sm text-[#6E6E73] leading-relaxed">
                  满减券：满足门槛金额后可抵扣固定金额<br />
                  折扣券：满足门槛金额后可享受折扣优惠<br />
                  运费券：可免除订单运费
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#1D1D1F] mb-2">2. 使用规则</h4>
                <p className="text-sm text-[#6E6E73] leading-relaxed">
                  • 每笔订单仅可使用一张优惠券<br />
                  • 优惠券不可兑换现金，不可转让<br />
                  • 部分商品可能不参与优惠券活动<br />
                  • 订单取消后优惠券可能不予退还
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#1D1D1F] mb-2">3. 有效期说明</h4>
                <p className="text-sm text-[#6E6E73] leading-relaxed">
                  • 优惠券需在有效期内使用<br />
                  • 过期优惠券将自动失效<br />
                  • 请关注优惠券到期时间，及时使用
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#1D1D1F] mb-2">4. 兑换码使用</h4>
                <p className="text-sm text-[#6E6E73] leading-relaxed">
                  • 在顶部输入框输入优惠码即可兑换<br />
                  • 每个兑换码仅可使用一次<br />
                  • 兑换成功后优惠券自动添加到账户
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 优惠券详情弹窗 */}
      {selectedCoupon && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedCoupon(null)}
          ></div>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[20px] max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-4 py-3 border-b border-[#E5E5EA] flex items-center justify-between">
              <span className="text-base font-semibold text-[#1D1D1F]">优惠券详情</span>
              <button
                onClick={() => setSelectedCoupon(null)}
                className="w-8 h-8 flex items-center justify-center cursor-pointer active:scale-95"
              >
                <i className="ri-close-line text-xl text-[#6E6E73]"></i>
              </button>
            </div>

            {/* 券面信息 */}
            <div className={`mx-4 mt-4 rounded-xl overflow-hidden border ${
              selectedCoupon.status === 'available'
                ? 'bg-[#F5F5F7] border-[#D2D2D7]'
                : 'bg-[#F2F2F7] border-[#E5E5EA]'
            }`}>
              <div className="p-6 text-center">
                <div className={`text-4xl font-bold mb-1 ${
                  selectedCoupon.status === 'available' ? 'text-[#1D1D1F]' : 'text-[#AEAEB2]'
                }`}>
                  {formatValue(selectedCoupon)}
                </div>
                {selectedCoupon.threshold > 0 && (
                  <p className={`text-sm ${
                    selectedCoupon.status === 'available' ? 'text-[#6E6E73]' : 'text-[#AEAEB2]'
                  }`}>满¥{selectedCoupon.threshold}可用</p>
                )}
                <p className={`text-xs mt-2 ${
                  selectedCoupon.status === 'available' ? 'text-[#8E8E93]' : 'text-[#AEAEB2]'
                }`}>{selectedCoupon.title}</p>
              </div>
            </div>

            {/* 券码和二维码 */}
            <div className="mx-4 mt-4 bg-[#F5F5F7] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[#6E6E73]">券码</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#1D1D1F]">{selectedCoupon.code}</span>
                  <button
                    onClick={() => handleCopyCode(selectedCoupon.code, selectedCoupon.id)}
                    className="text-xs text-[#1D1D1F] cursor-pointer whitespace-nowrap active:opacity-60"
                  >
                    {copiedId === selectedCoupon.id ? '已复制' : '复制'}
                  </button>
                </div>
              </div>
              {/* 核销二维码 */}
              <div className="flex justify-center py-4">
                <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <i className="ri-qr-code-line text-5xl text-[#C7C7CC]"></i>
                    <p className="text-xs text-[#8E8E93] mt-1">核销二维码</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 详细信息 */}
            <div className="mx-4 mt-4 space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-[#E5E5EA]">
                <span className="text-sm text-[#6E6E73]">券类型</span>
                <span className="text-sm text-[#1D1D1F]">
                  {selectedCoupon.type === 'amount' ? '满减券' : selectedCoupon.type === 'discount' ? '折扣券' : '运费券'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#E5E5EA]">
                <span className="text-sm text-[#6E6E73]">使用范围</span>
                <span className="text-sm text-[#1D1D1F]">{selectedCoupon.scopeDesc}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#E5E5EA]">
                <span className="text-sm text-[#6E6E73]">有效期</span>
                <span className="text-sm text-[#1D1D1F]">{selectedCoupon.validStart} 至 {selectedCoupon.validEnd}</span>
              </div>
              {selectedCoupon.totalCount > 1 && (
                <div className="flex items-center justify-between py-2 border-b border-[#E5E5EA]">
                  <span className="text-sm text-[#6E6E73]">使用次数</span>
                  <span className="text-sm text-[#1D1D1F]">{selectedCoupon.usedCount}/{selectedCoupon.totalCount}</span>
                </div>
              )}
            </div>

            {/* 使用规则 */}
            <div className="mx-4 mt-4 mb-6">
              <h4 className="text-sm font-semibold text-[#1D1D1F] mb-2">使用规则</h4>
              <ul className="space-y-1">
                {selectedCoupon.rules.map((rule, index) => (
                  <li key={index} className="text-sm text-[#6E6E73] flex items-start">
                    <span className="mr-2">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 底部按钮 */}
            {selectedCoupon.status === 'available' && (
              <div className="sticky bottom-0 bg-white px-4 py-3 border-t border-[#E5E5EA]">
                <button
                  onClick={() => {
                    setSelectedCoupon(null);
                    navigate('/products/list');
                  }}
                  className="w-full h-11 bg-white text-[#1D1D1F] text-base font-medium rounded-2xl border border-[#D2D2D7] cursor-pointer active:bg-[#F5F5F7] transition-all whitespace-nowrap"
                >
                  去使用
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
