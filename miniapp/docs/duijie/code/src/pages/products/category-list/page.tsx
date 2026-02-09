
import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { categoryProducts, filterChips } from '../../../mocks/categoryProducts';
import type { CategoryProduct } from '../../../mocks/categoryProducts';
import TabBar from '../../../components/TabBar';
import ImageSearchModal from '../../../components/ImageSearchModal';

type FilterKey = keyof typeof filterChips;
type SortKey = 'default' | 'price-asc' | 'price-desc' | 'delivery';

const spaceNameMap: Record<string, string> = {
  all: '全部',
  new: '新品',
  living: '客厅空间',
  bedroom: '卧室空间',
  dining: '餐厅空间',
  study: '书房空间',
  balcony: '阳台空间',
  entrance: '玄关空间',
  bathroom: '卫浴空间',
  style: '风格合集',
};

const subCategoryNameMap: Record<string, string> = {
  'balcony-chair': '休闲椅',
  'balcony-table': '阳台小桌',
  'balcony-swing': '吊椅秋千',
  'balcony-shelf': '花架置物架',
  'balcony-storage': '阳台收纳柜',
  'living-sofa': '客厅沙发',
  'living-table': '茶几边几',
  'living-tv': '电视柜',
  'bedroom-bed': '双人床',
  'bedroom-wardrobe': '衣柜',
  'dining-table': '餐桌',
  'dining-chair': '餐椅',
  'study-desk': '书桌',
  'study-chair': '办公椅',
  sofa: '沙发系列',
  bed: '床具系列',
  dining: '餐桌椅系列',
  cabinet: '柜类系列',
  decoration: '软装饰品',
};

export default function CategoryListPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const space = searchParams.get('space') || 'balcony';
  const category = searchParams.get('category') || 'balcony-chair';

  const spaceName = spaceNameMap[space] || space;
  const categoryName = subCategoryNameMap[category] || category;

  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<FilterKey, string[]>>({
    material: [],
    style: [],
    craft: [],
    price: [],
    delivery: [],
    type: [],
  });
  const [expandedFilter, setExpandedFilter] = useState<FilterKey | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('default');
  const [products, setProducts] = useState<CategoryProduct[]>([]);
  const [viewMode, setViewMode] = useState<'double' | 'single'>('double');
  const [showImageSearch, setShowImageSearch] = useState(false);

  // Simulate loading
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setProducts(categoryProducts);
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [space, category]);

  // Filter
  const filteredProducts = products.filter((p) => {
    if (
      searchText &&
      !p.name.includes(searchText) &&
      !p.manufacturer.includes(searchText)
    )
      return false;
    return true;
  });

  // Sort
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.priceFrom - b.priceFrom;
      case 'price-desc':
        return b.priceFrom - a.priceFrom;
      case 'delivery':
        return a.deliveryDays - b.deliveryDays;
      default:
        return 0;
    }
  });

  const hasActiveFilters = Object.values(activeFilters).some((v) => v.length > 0);

  const toggleFilter = useCallback((key: FilterKey, value: string) => {
    setActiveFilters((prev) => {
      const current = prev[key];
      return {
        ...prev,
        [key]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters({
      material: [],
      style: [],
      craft: [],
      price: [],
      delivery: [],
      type: [],
    });
    setExpandedFilter(null);
  }, []);

  return (
    <div className="min-h-screen bg-white pb-[calc(60px+env(safe-area-inset-bottom))]">
      {/* Navigation Bar */}
      <div
        className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-2xl border-b border-[#D2D2D7]/60"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="h-[44px] flex items-center justify-between px-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center cursor-pointer rounded-full
              transition-all duration-[180ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]
              hover:bg-[#F5F5F7] active:scale-[0.92] active:bg-[#E5E5EA]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-1"
          >
            <i className="ri-arrow-left-line text-[20px] text-[#1D1D1F]"></i>
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-[#6E6E73] leading-tight">{spaceName}</span>
            <h1 className="text-[17px] font-semibold text-[#1D1D1F] leading-tight">{categoryName}</h1>
          </div>
          <button
            onClick={() => setViewMode(viewMode === 'double' ? 'single' : 'double')}
            className="w-9 h-9 flex items-center justify-center cursor-pointer rounded-full
              transition-all duration-[180ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]
              hover:bg-[#F5F5F7] active:scale-[0.92] active:bg-[#E5E5EA]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-1"
          >
            <i
              className={`${
                viewMode === 'double' ? 'ri-layout-grid-line' : 'ri-list-check'
              } text-[20px] text-[#1D1D1F]`}
            ></i>
          </button>
        </div>
      </div>

      <div style={{ paddingTop: 'calc(44px + env(safe-area-inset-top))' }}>
        {/* Search Bar */}
        <div className="bg-white px-4 py-3 border-b border-[#D2D2D7]/40">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-[#F5F5F7] rounded-[12px] px-3 h-[38px] border border-transparent
              transition-all duration-[180ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]
              focus-within:bg-white focus-within:border-[#D2D2D7] focus-within:shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <i className="ri-search-line text-[16px] text-[#6E6E73] mr-2"></i>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={`在${categoryName}中搜索`}
                className="flex-1 bg-transparent text-[15px] text-[#1D1D1F] placeholder-[#6E6E73] outline-none"
              />
              {searchText && (
                <button
                  onClick={() => setSearchText('')}
                  className="w-[18px] h-[18px] flex items-center justify-center bg-[#AEAEB2] rounded-full cursor-pointer
                    transition-all duration-[160ms] hover:bg-[#8E8E93] active:scale-[0.9]"
                >
                  <i className="ri-close-line text-[11px] text-white"></i>
                </button>
              )}
            </div>
            <button
              onClick={() => setShowImageSearch(true)}
              className="w-[38px] h-[38px] flex items-center justify-center bg-[#F5F5F7] rounded-[12px] flex-shrink-0 cursor-pointer
                border border-transparent
                transition-all duration-[180ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]
                hover:bg-[#E5E5EA] hover:border-[#D2D2D7]
                active:scale-[0.94] active:bg-[#D2D2D7]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-1"
            >
              <i className="ri-camera-line text-[18px] text-[#1D1D1F]"></i>
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="bg-white border-b border-[#D2D2D7]/40">
          <div className="px-4 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {(Object.keys(filterChips) as FilterKey[]).map((key) => {
              const labelMap: Record<FilterKey, string> = {
                material: '材质',
                style: '风格',
                craft: '工艺',
                price: '价格',
                delivery: '交期',
                type: '现货/定制',
              };
              const isActive = activeFilters[key].length > 0;
              const isExpanded = expandedFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setExpandedFilter(isExpanded ? null : key)}
                  className={`flex items-center gap-1 px-3.5 py-[7px] rounded-[16px] text-[13px] whitespace-nowrap cursor-pointer
                    border transition-all duration-[180ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]
                    active:scale-[0.96] active:translate-y-[1px]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-1
                    ${isActive
                      ? 'bg-[#E8F0FE] text-[#1D1D1F] font-semibold border-[#0071E3]/30'
                      : isExpanded
                      ? 'bg-[#F5F5F7] text-[#1D1F] font-medium border-[#C7C7CC]'
                      : 'bg-white text-[#1D1D1F] border-[#D2D2D7] hover:bg-[#F5F5F7] hover:border-[#C7C7CC]'}
                    `}>
                  {isActive && (
                    <span className="w-[6px] h-[6px] rounded-full bg-[#0071E3] mr-0.5"></span>
                  )}
                  <span>
                    {labelMap[key]}
                    {isActive ? ` · ${activeFilters[key].length}` : ''}
                  </span>
                  <i
                    className={`ri-arrow-${isExpanded ? 'up' : 'down'}-s-line text-[14px] text-[#6E6E73]`}
                  ></i>
                </button>
              );
            })}
          </div>

          {/* Expanded Filter Panel */}
          {expandedFilter && (
            <div
              className="px-4 pb-3 border-t border-[#E5E5EA]"
              style={{
                animation:
                  'plpSlideDown 0.22s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
              }}
            >
              <div className="flex flex-wrap gap-2 pt-3">
                {filterChips[expandedFilter].map((item) => {
                  const isSelected = activeFilters[expandedFilter].includes(item);
                  return (
                    <button
                      key={item}
                      onClick={() => toggleFilter(expandedFilter, item)}
                      className={`px-3.5 py-[7px] rounded-[16px] text-[13px] whitespace-nowrap cursor-pointer
                        border transition-all duration-[180ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]
                        active:scale-[0.96] active:translate-y-[1px]
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-1
                        ${isSelected
                          ? 'bg-[#E8F0FE] text-[#1D1D1F] font-semibold border-[#0071E3]/30'
                          : 'bg-white text-[#1D1D1F] border-[#D2D2D7] hover:bg-[#F5F5F7] hover:border-[#C7C7CC]'}
                        `}>
                      {isSelected && (
                        <i className="ri-check-line text-[12px] text-[#0071E3] mr-1"></i>
                      )}
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sort Bar */}
        <div className="bg-[#F5F5F7] px-4 py-2.5 flex items-center justify-between border-b border-[#E5E5EA]/60">
          <div className="flex items-center gap-1">
            <span className="text-[13px] text-[#6E6E73]">
              {isLoading ? '加载中...' : `${sortedProducts.length} 件商品`}
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="ml-2 text-[12px] text-[#0071E3] cursor-pointer
                  transition-all duration-[160ms] hover:underline active:opacity-70"
              >
                清除筛选
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 bg-white rounded-[10px] p-1 border border-[#E5E5EA]">
            {[
              { key: 'default' as SortKey, label: '综合' },
              { key: 'price-asc' as SortKey, label: '价格↑' },
              { key: 'price-desc' as SortKey, label: '价格↓' },
              { key: 'delivery' as SortKey, label: '交期' },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key)}
                className={`px-3 py-1.5 rounded-[8px] text-[12px] whitespace-nowrap cursor-pointer
                  transition-all duration-[180ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]
                  active:scale-[0.96]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-1
                  ${sortBy === s.key
                    ? 'bg-[#F5F5F7] text-[#1D1D1F] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#FAFAFA]'}
                `}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product List */}
        <div className="px-4 pt-4 pb-8 bg-[#F5F5F7]">
          {isLoading ? (
            <SkeletonGrid viewMode={viewMode} />
          ) : sortedProducts.length === 0 ? (
            <EmptyState onClear={clearAllFilters} hasFilters={hasActiveFilters} />
          ) : viewMode === 'double' ? (
            <div className="grid grid-cols-2 gap-3">
              {sortedProducts.map((product, index) => (
                <DoubleColCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedProducts.map((product, index) => (
                <SingleColCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>

        {!isLoading && sortedProducts.length > 0 && (
          <div className="text-center pb-10 bg-[#F5F5F7]">
            <span className="text-[12px] text-[#AEAEB2]">— 已展示全部 —</span>
          </div>
        )}
      </div>

      {/* TabBar */}
      <TabBar />

      {/* Image Search Modal */}
      <ImageSearchModal
        visible={showImageSearch}
        onClose={() => setShowImageSearch(false)}
      />

      {/* Animation Styles */}
      <style>{`
        @keyframes plpSlideDown {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 200px; }
        }
        @keyframes plpCardIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

/* ========== Double Column Card - Apple Style Micro Interaction ========== */
function DoubleColCard({ product, index }: { product: CategoryProduct; index: number }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const cardStyle = {
    opacity: 0,
    animation: `plpCardIn 0.4s cubic-bezier(0.25,0.46,0.45,0.94) forwards`,
    animationDelay: `${index * 50}ms`,
    transform: isPressed
      ? 'scale(0.985) translateY(1px)'
      : isHovered
      ? 'scale(1) translateY(-2px)'
      : 'scale(1) translateY(0)',
    boxShadow: isPressed
      ? '0 2px 8px rgba(0,0,0,0.04)'
      : isHovered
      ? '0 8px 24px rgba(0,0,0,0.1)'
      : '0 2px 12px rgba(0,0,0,0.04)',
    transition:
      'transform 200ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 200ms cubic-bezier(0.2,0.8,0.2,1)',
  };

  return (
    <Link
      to={`/products/detail/${product.id}`}
      className="block bg-white rounded-[16px] overflow-hidden cursor-pointer select-none
        border border-[#E5E5EA] hover:border-[#D2D2D7]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-2"
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchCancel={() => setIsPressed(false)}
    >
      <div className="relative w-full aspect-square bg-[#FAFAFA] overflow-hidden">
        {!imgLoaded && <div className="absolute inset-0 bg-[#F5F5F7] animate-pulse" />}
        <img
          src={product.image}
          alt={product.name}
          onLoad={() => setImgLoaded(true)}
          className="w-full h-full object-cover object-top transition-all duration-[220ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
          style={{
            opacity: imgLoaded ? 1 : 0,
            transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          }}
        />
        {/* Tags - Light Capsule */}
        {product.tags.length > 0 && (
          <div className="absolute top-2.5 left-2.5 flex gap-1.5">
            {product.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-[4px] rounded-full text-[10px] font-medium leading-tight 
                  bg-white/90 text-[#1D1D1F] backdrop-blur-md border border-[#E5E5EA]/60
                  shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-[14px] font-medium text-[#1D1D1F] leading-[1.4] line-clamp-2 mb-1.5">
          {product.name}
        </h3>
        <p className="text-[12px] text-[#6E6E73] mb-2.5 truncate">
          {product.craft} · {product.material}
        </p>
        <div className="flex items-baseline gap-0.5 mb-2">
          <span className="text-[11px] text-[#1D1D1F]">¥</span>
          <span className="text-[18px] font-semibold text-[#1D1D1F] tracking-tight">
            {product.priceFrom.toLocaleString()}
          </span>
          <span className="text-[11px] text-[#6E6E73] ml-0.5">起</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#AEAEB2]">{product.deliveryDays}天交付</span>
          <span className="text-[11px] text-[#AEAEB2] truncate max-w-[80px]">{product.manufacturer}</span>
        </div>
      </div>
    </Link>
  );
}

/* ========== Single Column Card - Apple Style Micro Interaction ========== */
function SingleColCard({ product, index }: { product: CategoryProduct; index: number }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const cardStyle = {
    opacity: 0,
    animation: `plpCardIn 0.4s cubic-bezier(0.25,0.46,0.45,0.94) forwards`,
    animationDelay: `${index * 55}ms`,
    transform: isPressed
      ? 'scale(0.985) translateY(1px)'
      : isHovered
      ? 'scale(1) translateY(-2px)'
      : 'scale(1) translateY(0)',
    boxShadow: isPressed
      ? '0 2px 8px rgba(0,0,0,0.04)'
      : isHovered
      ? '0 8px 24px rgba(0,0,0,0.1)'
      : '0 2px 12px rgba(0,0,0,0.04)',
    transition:
      'transform 200ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 200ms cubic-bezier(0.2,0.8,0.2,1)',
  };

  return (
    <Link
      to={`/products/detail/${product.id}`}
      className="flex bg-white rounded-[16px] overflow-hidden cursor-pointer select-none
        border border-[#E5E5EA] hover:border-[#D2D2D7]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-2"
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchCancel={() => setIsPressed(false)}
    >
      <div className="relative w-[140px] h-[140px] flex-shrink-0 bg-[#FAFAFA] overflow-hidden">
        {!imgLoaded && <div className="absolute inset-0 bg-[#F5F5F7] animate-pulse" />}
        <img
          src={product.image}
          alt={product.name}
          onLoad={() => setImgLoaded(true)}
          className="w-full h-full object-cover object-top transition-all duration-[220ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
          style={{
            opacity: imgLoaded ? 1 : 0,
            transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          }}
        />
        {/* Tags - Light Capsule */}
        {product.tags.length > 0 && (
          <div className="absolute top-2.5 left-2.5 flex gap-1.5">
            {product.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-[4px] rounded-full text-[10px] font-medium leading-tight 
                  bg-white/90 text-[#1D1D1F] backdrop-blur-md border border-[#E5E5EA]/60
                  shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="text-[15px] font-medium text-[#1D1D1F] leading-[1.4] line-clamp-2 mb-1">
            {product.name}
          </h3>
          <p className="text-[12px] text-[#6E6E73] truncate">
            {product.craft} · {product.material}
          </p>
        </div>
        <div>
          <div className="flex items-baseline gap-0.5 mb-1.5">
            <span className="text-[11px] text-[#1D1D1F]">¥</span>
            <span className="text-[20px] font-semibold text-[#1D1D1F] tracking-tight">
              {product.priceFrom.toLocaleString()}
            </span>
            <span className="text-[11px] text-[#6E6E73] ml-0.5">起</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#AEAEB2]">{product.deliveryDays}天交付</span>
            <span className="w-[3px] h-[3px] rounded-full bg-[#D2D2D7]"></span>
            <span className="text-[11px] text-[#AEAEB2] truncate">{product.manufacturer}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ========== Skeleton Grid ========== */
function SkeletonGrid({ viewMode }: { viewMode: 'double' | 'single' }) {
  if (viewMode === 'single') {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex bg-white rounded-[16px] overflow-hidden border border-[#E5E5EA]">
            <div className="w-[140px] h-[140px] bg-[#F5F5F7] animate-pulse flex-shrink-0" />
            <div className="flex-1 p-3.5 space-y-3">
              <div className="h-4 bg-[#F5F5F7] rounded-md animate-pulse w-3/4" />
              <div className="h-3 bg-[#F5F5F7] rounded-md animate-pulse w-1/2" />
              <div className="h-5 bg-[#F5F7] rounded-md animate-pulse w-1/3 mt-auto" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-[16px] overflow-hidden border border-[#E5E5EA]">
          <div className="w-full aspect-square bg-[#F5F5F7] animate-pulse" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-[#F5F5F7] rounded-md animate-pulse w-4/5" />
            <div className="h-3 bg-[#F5F5F7] rounded-md animate-pulse w-3/5" />
            <div className="h-5 bg-[#F5F5F7] rounded-md animate-pulse w-2/5" />
            <div className="h-3 bg-[#F5F5F7] rounded-md animate-pulse w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ========== Empty State ========== */
function EmptyState({ onClear, hasFilters }: { onClear: () => void; hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="w-16 h-16 flex items-center justify-center bg-white rounded-full mb-4 border border-[#E5E5EA] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <i className="ri-search-line text-[28px] text-[#AEAEB2]"></i>
      </div>
      <p className="text-[15px] text-[#6E6E73] mb-1">未找到相关商品</p>
      <p className="text-[13px] text-[#AEAEB2] mb-5">试试调整筛选条件或搜索关键词</p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="px-5 py-2.5 bg-white text-[#1D1D1F] text-[14px] font-medium rounded-[14px] 
            border border-[#D2D2D7] cursor-pointer whitespace-nowrap
            transition-all duration-[180ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]
            hover:bg-[#F5F5F7] hover:border-[#C7C7CC]
            active:scale-[0.985] active:translate-y-[1px]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-2"
        >
          清除全部筛选
        </button>
      )}
    </div>
  );
}
