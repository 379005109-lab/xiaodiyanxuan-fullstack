import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bargainProducts } from '../../../mocks/bargain';
import { useInViewAnimation } from '../../../hooks/useInViewAnimation';
import { usePressAnimation } from '../../../hooks/usePressAnimation';

interface FilterState {
  style: string[];
  discount: string;
  timeRange: string;
  priceRange: [number, number];
}

export default function BargainListPage() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('hot');
  const [showFilter, setShowFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState(bargainProducts);
  const [filters, setFilters] = useState<FilterState>({
    style: [],
    discount: '',
    timeRange: '',
    priceRange: [0, 20000],
  });
  const [, setTick] = useState(0);

  useEffect(() => {
    const loadingTimer = setTimeout(() => setIsLoading(false), 600);
    const tickTimer = setInterval(() => setTick((prev) => prev + 1), 1000);
    return () => {
      clearTimeout(loadingTimer);
      clearInterval(tickTimer);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSort = (type: string) => {
    setSortBy(type);
    const sorted = [...products];
    if (type === 'hot') sorted.sort((a, b) => b.hotLevel - a.hotLevel);
    else if (type === 'latest') sorted.sort((a, b) => b.remainingTime - a.remainingTime);
    else if (type === 'discount') sorted.sort((a, b) => b.progress - a.progress);
    setProducts(sorted);
  };

  const applyFilters = () => {
    let filtered = [...bargainProducts];
    if (filters.style.length > 0) filtered = filtered.filter((p) => filters.style.includes(p.style));
    if (filters.discount === 'high') filtered = filtered.filter((p) => p.progress >= 70);
    else if (filters.discount === 'medium')
      filtered = filtered.filter((p) => p.progress >= 50 && p.progress < 70);
    if (filters.timeRange === 'urgent') filtered = filtered.filter((p) => p.remainingTime < 14400);
    else if (filters.timeRange === 'today') filtered = filtered.filter((p) => p.remainingTime < 86400);
    filtered = filtered.filter(
      (p) => p.currentPrice >= filters.priceRange[0] && p.currentPrice <= filters.priceRange[1]
    );
    setProducts(filtered);
    setShowFilter(false);
  };

  const resetFilters = () => {
    setFilters({ style: [], discount: '', timeRange: '', priceRange: [0, 20000] });
    setProducts(bargainProducts);
  };

  // 搜索过滤
  const displayProducts = searchText
    ? products.filter((p) => p.title.includes(searchText))
    : products;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 z-50 bg-white border-b border-[#E5E5EA]">
          <div className="flex items-center h-12 px-4">
            <div className="w-6 h-6 bg-[#F5F5F7] rounded-full animate-pulse" />
            <div className="flex-1 mx-3">
              <div className="h-9 bg-[#F5F5F7] rounded-full animate-pulse" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E5E5EA]">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-14 h-7 bg-[#F5F5F7] rounded-full animate-pulse" />
          ))}
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3 py-3">
              <div className="w-24 h-24 bg-[#F5F5F7] rounded-2xl animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2.5 py-1">
                <div className="h-4 bg-[#F5F5F7] rounded-lg animate-pulse" />
                <div className="h-4 bg-[#F5F5F7] rounded-lg animate-pulse w-2/3" />
                <div className="h-5 bg-[#F5F5F7] rounded-lg animate-pulse w-1/3 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-6">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#E5E5EA]">
        <div className="flex items-center h-12 px-4">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-all duration-150 active:scale-90 active:bg-[#F5F5F7]"
          >
            <i className="ri-arrow-left-line text-lg text-[#1D1D1F]" />
          </button>
          <div className="flex-1 mx-3">
            <div className="relative">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="搜索砍价商品"
                className="w-full h-9 pl-9 pr-9 bg-[#F5F5F7] rounded-full text-[13px] text-[#1D1D1F] outline-none placeholder:text-[#86868B]"
              />
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B] text-sm" />
              {searchText && (
                <button
                  onClick={() => setSearchText('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  <i className="ri-close-circle-fill text-[#C6C6C8] text-sm" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 排序栏 */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-t border-[#E5E5EA] overflow-x-auto">
          {[
            { key: 'hot', label: '热度' },
            { key: 'latest', label: '最新' },
            { key: 'discount', label: '折扣' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => handleSort(item.key)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] cursor-pointer whitespace-nowrap transition-all duration-200 active:scale-95 ${
                sortBy === item.key
                  ? 'bg-[#1D1D1F] text-white font-medium'
                  : 'text-[#6E6E73] hover:bg-[#F5F5F7]'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => setShowFilter(true)}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[13px] text-[#6E6E73] cursor-pointer whitespace-nowrap transition-all duration-200 active:scale-95 hover:bg-[#F5F5F7]"
          >
            <i className="ri-filter-3-line text-sm" />
            筛选
          </button>
        </div>
      </div>

      {/* 商品列表 */}
      <div className="px-4">
        {displayProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-20 h-20 rounded-full bg-[#F5F5F7] flex items-center justify-center mb-4">
              <i className="ri-shopping-bag-3-line text-3xl text-[#C6C6C8]" />
            </div>
            <p className="text-[13px] text-[#86868B] mb-6">暂无砍价商品</p>
            <button
              onClick={resetFilters}
              className="px-6 py-2.5 bg-white text-[#1D1D1F] rounded-[14px] text-[13px] font-medium cursor-pointer whitespace-nowrap transition-all duration-200 active:bg-[#F5F5F7] border border-[#D2D2D7]"
            >
              重置筛选
            </button>
          </div>
        ) : (
          <div className="space-y-0">
            {displayProducts.map((product, index) => (
              <BargainProductCard
                key={product.id}
                product={product}
                index={index}
                formatTime={formatTime}
                onNavigate={(path) => navigate(path)}
                isLast={index === displayProducts.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* 筛选抽屉 */}
      {showFilter && (
        <FilterDrawer
          filters={filters}
          setFilters={setFilters}
          setShowFilter={setShowFilter}
          applyFilters={applyFilters}
          resetFilters={resetFilters}
        />
      )}
    </div>
  );
}

/* ========== 砍价商品卡片 ========== */
function BargainProductCard({
  product,
  index,
  formatTime,
  onNavigate,
  isLast,
}: {
  product: any;
  index: number;
  formatTime: (s: number) => string;
  onNavigate: (path: string) => void;
  isLast: boolean;
}) {
  const { ref, isInView } = useInViewAnimation({ threshold: 0.1 });
  const { pressProps, pressStyle } = usePressAnimation({ scale: 0.985, translateY: 1 });

  return (
    <div
      ref={ref as any}
      className={`transition-all duration-500 ease-out ${
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <div
        {...pressProps}
        onClick={() => onNavigate(`/bargain/detail/${product.id}`)}
        className="flex gap-3.5 py-4 cursor-pointer rounded-xl px-1 -mx-1 transition-all duration-200 hover:bg-[#F5F5F7]/60 group"
        style={{
          ...pressStyle,
          transition:
            'transform 0.2s ease-out, box-shadow 0.2s ease-out, background-color 0.2s ease-out',
        }}
      >
        {/* 商品图片 */}
        <div className="relative w-[100px] h-[100px] flex-shrink-0 rounded-2xl overflow-hidden bg-[#F5F5F7]">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#1D1D1F]/65 backdrop-blur-md text-white text-[10px] rounded-full">
            {product.style}
          </div>
        </div>

        {/* 商品信息 */}
        <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
          <h3 className="text-[14px] font-medium text-[#1D1D1F] line-clamp-2 leading-[1.4] tracking-tight">
            {product.title}
          </h3>

          <div className="space-y-2">
            {/* 倒计时 */}
            <div className="flex items-center gap-1 text-[11px] text-[#86868B]">
              <i className="ri-time-line text-[11px]" />
              <span className="font-mono">{formatTime(product.remainingTime)}</span>
            </div>

            {/* 价格 + 进度 */}
            <div className="flex items-end justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[18px] font-bold text-[#1D1D1F] tracking-tight">
                  <span className="text-[11px]">¥</span>
                  {product.currentPrice.toLocaleString()}
                </span>
                <span className="text-[11px] text-[#86868B] line-through">
                  ¥{product.originalPrice.toLocaleString()}
                </span>
              </div>
              <span className="text-[11px] text-[#86868B] font-medium">{product.progress}%</span>
            </div>

            {/* 进度条 */}
            <div className="h-[2px] bg-[#E5E5EA] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1D1D1F] rounded-full transition-all duration-300"
                style={{ width: `${product.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      {!isLast && <div className="ml-[116px] border-t border-[#E5E5EA]" />}
    </div>
  );
}

/* ========== 筛选抽屉 ========== */
function FilterDrawer({
  filters,
  setFilters,
  setShowFilter,
  applyFilters,
  resetFilters,
}: {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  setShowFilter: (show: boolean) => void;
  applyFilters: () => void;
  resetFilters: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div
        className="absolute inset-0 bg-black/25 animate-[fadeIn_0.2s_ease-out]"
        onClick={() => setShowFilter(false)}
      />
      <div className="relative w-full bg-white rounded-t-[20px] max-h-[80vh] overflow-y-auto animate-[slideUp_0.26s_cubic-bezier(0.25,0.46,0.45,0.94)]">
        {/* 头部 */}
        <div className="sticky top-0 bg-white border-b border-[#E5E5EA] px-4 py-3.5 flex items-center justify-between z-10">
          <button
            onClick={resetFilters}
            className="text-[13px] text-[#86868B] cursor-pointer transition-opacity active:opacity-60"
          >
            重置
          </button>
          <h3 className="text-[15px] font-semibold text-[#1D1D1F]">筛选</h3>
          <button
            onClick={() => setShowFilter(false)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-[#F5F5F7] cursor-pointer transition-all duration-150 active:scale-90"
          >
            <i className="ri-close-line text-base text-[#6E6E73]" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* 风格 */}
          <div>
            <h4 className="text-[13px] font-semibold text-[#1D1D1F] mb-3">风格</h4>
            <div className="flex flex-wrap gap-2">
              {[
                '意式轻奢',
                '北欧风格',
                '现代简约',
                '新中式',
                '轻奢风格',
                '日式风格',
                '美式风格',
              ].map((style) => (
                <button
                  key={style}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      style: prev.style.includes(style)
                        ? prev.style.filter((s) => s !== style)
                        : [...prev.style, style],
                    }))
                  }
                  className={`px-3.5 py-2 rounded-full text-[13px] cursor-pointer whitespace-nowrap transition-all duration-150 active:scale-95 ${
                    filters.style.includes(style)
                      ? 'bg-[#1D1D1F] text-white'
                      : 'bg-[#F5F5F7] text-[#6E6E73]'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* 折扣力度 */}
          <div>
            <h4 className="text-[13px] font-semibold text-[#1D1D1F] mb-3">折扣力度</h4>
            <div className="flex gap-2">
              {[
                { label: '高折扣 (≥70%)', value: 'high' },
                { label: '中折扣 (50-70%)', value: 'medium' },
                { label: '全部', value: '' },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilters((prev) => ({ ...prev, discount: item.value }))}
                  className={`flex-1 px-3 py-2 rounded-full text-[13px] cursor-pointer whitespace-nowrap transition-all duration-150 active:scale-95 ${
                    filters.discount === item.value
                      ? 'bg-[#1D1D1F] text-white'
                      : 'bg-[#F5F5F7] text-[#6E6E73]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 剩余时间 */}
          <div>
            <h4 className="text-[13px] font-semibold text-[#1D1D1F] mb-3">剩余时间</h4>
            <div className="flex gap-2">
              {[
                { label: '即将结束 (<4h)', value: 'urgent' },
                { label: '今日结束', value: 'today' },
                { label: '全部', value: '' },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilters((prev) => ({ ...prev, timeRange: item.value }))}
                  className={`flex-1 px-3 py-2 rounded-full text-[13px] cursor-pointer whitespace-nowrap transition-all duration-150 active:scale-95 ${
                    filters.timeRange === item.value
                      ? 'bg-[#1D1D1F] text-white'
                      : 'bg-[#F5F5F7] text-[#6E6E73]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 价格区间 */}
          <div>
            <h4 className="text-[13px] font-semibold text-[#1D1D1F] mb-3">价格区间</h4>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={filters.priceRange[0]}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    priceRange: [Number(e.target.value), prev.priceRange[1]],
                  }))
                }
                placeholder="最低价"
                className="flex-1 px-3 py-2.5 border border-[#E5E5EA] rounded-xl text-[13px] text-[#1D1D1F] outline-none focus:border-[#1D1D1F] transition-colors"
              />
              <span className="text-[#C6C6C8]">—</span>
              <input
                type="number"
                value={filters.priceRange[1]}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    priceRange: [prev.priceRange[0], Number(e.target.value)],
                  }))
                }
                placeholder="最高价"
                className="flex-1 px-3 py-2.5 border border-[#E5E5EA] rounded-xl text-[13px] text-[#1D1D1F] outline-none focus:border-[#1D1D1F] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="sticky bottom-0 bg-white border-t border-[#E5E5EA] p-4">
          <button
            onClick={applyFilters}
            className="w-full h-[48px] bg-white text-[#1D1D1F] rounded-[14px] text-[15px] font-medium cursor-pointer whitespace-nowrap transition-all duration-200 active:bg-[#F5F5F7] border border-[#D2D2D7]"
          >
            查看结果
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
}
