import { useState, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { furnitureProducts, brands, furnitureCategories } from '../../../mocks/furnitureProducts';
import { useInViewAnimation } from '../../../hooks/useInViewAnimation';
import { usePressAnimation } from '../../../hooks/usePressAnimation';
import TabBar from '../../../components/TabBar';

export default function ProductListPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryId = searchParams.get('category') || 'sofa';
  const subCategoryId = searchParams.get('sub') || '';
  
  const [showFilter, setShowFilter] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [stockOnly, setStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [searchText, setSearchText] = useState('');
  
  // 以图搜索相关状态
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 动效 hooks - 必须在组件顶层调用
  const filterBarRef = useInViewAnimation<HTMLDivElement>({ threshold: 0.1 });
  const productGridRef = useInViewAnimation<HTMLDivElement>({ 
    threshold: 0.1,
    staggerDelay: 70,
    staggerChildren: true 
  });

  // 所有按压动画 hooks 必须在顶层声明
  const cameraButtonPress = usePressAnimation();
  const filterButtonPress = usePressAnimation();
  const priceButtonPress = usePressAnimation();
  const salesButtonPress = usePressAnimation();
  const stockButtonPress = usePressAnimation();
  const resetButtonPress = usePressAnimation();
  const confirmButtonPress = usePressAnimation();
  const closeButtonPress = usePressAnimation({ scale: 0.9 });
  const reSelectButtonPress = usePressAnimation();
  const searchButtonPress = usePressAnimation();

  // 为品牌按钮创建固定数量的动画 hooks（brands 数组长度）
  const brandPress0 = usePressAnimation();
  const brandPress1 = usePressAnimation();
  const brandPress2 = usePressAnimation();
  const brandPress3 = usePressAnimation();
  const brandPress4 = usePressAnimation();
  const brandPress5 = usePressAnimation();
  const brandPress6 = usePressAnimation();
  const brandPress7 = usePressAnimation();
  const brandPressAnimations = [brandPress0, brandPress1, brandPress2, brandPress3, brandPress4, brandPress5, brandPress6, brandPress7];
  
  // 为标签按钮创建固定数量的动画 hooks
  const tagPress0 = usePressAnimation();
  const tagPress1 = usePressAnimation();
  const tagPress2 = usePressAnimation();
  const tagPress3 = usePressAnimation();
  const tagPressAnimations = [tagPress0, tagPress1, tagPress2, tagPress3];

  // 获取当前分类名称
  const currentCategory = furnitureCategories.find(cat => cat.id === categoryId);
  const currentSubCategory = currentCategory?.subCategories.find(sub => sub.id === subCategoryId);

  // 以图搜索处理函数
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setShowImageSearch(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageSearch = () => {
    if (selectedImage) {
      setIsSearching(true);
      // 模拟搜索过程
      setTimeout(() => {
        setIsSearching(false);
        setShowImageSearch(false);
        setSelectedImage(null);
        // 刷新当前页面显示搜索结果
        navigate('/products/list?imageSearch=true');
      }, 2000);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleTextSearch = () => {
    if (searchText.trim()) {
      navigate(`/products/list?keyword=${encodeURIComponent(searchText)}`);
    }
  };

  // 筛选商品
  const filteredProducts = furnitureProducts.filter(product => {
    if (categoryId && product.category !== categoryId) return false;
    if (subCategoryId && product.subCategory !== subCategoryId) return false;
    if (selectedBrand !== 'all' && product.brand !== selectedBrand) return false;
    if (selectedTags.length > 0 && !selectedTags.some(tag => product.tags.includes(tag))) return false;
    if (product.price < priceRange[0] || product.price > priceRange[1]) return false;
    if (stockOnly && product.stock === 0) return false;
    return true;
  });

  // 排序
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'sales':
        return b.sold - a.sold;
      default:
        return 0;
    }
  });

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-[60px]">
      {/* 顶部导航栏 */}
      <div 
        className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="h-[44px] flex items-center justify-between px-4">
          <Link to="/products/category" className="w-8 h-8 flex items-center justify-center cursor-pointer">
            <i className="ri-arrow-left-line text-[20px] text-[#1D1D1F]"></i>
          </Link>
          <h1 className="text-[17px] font-semibold text-[#1D1D1F]">{currentSubCategory?.name || currentCategory?.name}</h1>
          <div className="w-8"></div>
        </div>
      </div>

      <div 
        style={{ 
          paddingTop: 'calc(44px + env(safe-area-inset-top))',
          paddingBottom: '80px'
        }}
      >
        {/* 搜索框 */}
        <div className="bg-white px-4 py-3 border-b border-[#E5E5EA]">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#F5F5F7] rounded-[12px] px-3 py-2 flex items-center gap-2">
              <i className="ri-search-line text-[16px] text-[#8E8E93]"></i>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTextSearch()}
                placeholder="搜索商品"
                className="flex-1 bg-transparent text-[15px] text-[#1D1D1F] placeholder-[#8E8E93] outline-none"
              />
              {currentSubCategory && (
                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-[6px]">
                  <span className="text-[12px] text-[#1D1D1F] whitespace-nowrap">{currentSubCategory.name}</span>
                  <i className="ri-close-line text-[14px] text-[#8E8E93] cursor-pointer"></i>
                </div>
              )}
            </div>
            {/* 以图搜索按钮 */}
            <button
              {...cameraButtonPress}
              onClick={handleCameraClick}
              className="w-10 h-10 flex items-center justify-center bg-[#F5F5F7] rounded-[12px] cursor-pointer hover:bg-[#E5E5EA] transition-colors duration-200"
            >
              <i className="ri-camera-line text-[20px] text-[#1D1D1F]"></i>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* 筛选条 */}
        <div ref={filterBarRef} className="bg-white px-4 py-2 border-b border-[#E5E5EA]">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            <button
              {...filterButtonPress}
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#F5F5F7] rounded-[8px] cursor-pointer whitespace-nowrap hover:bg-[#E5E5EA] transition-colors duration-200"
            >
              <i className="ri-filter-3-line text-[14px] text-[#1D1D1F]"></i>
              <span className="text-[13px] text-[#1D1D1F]">筛选</span>
            </button>
            
            <button
              {...priceButtonPress}
              onClick={() => setSortBy(sortBy === 'price-asc' ? 'price-desc' : 'price-asc')}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#F5F5F7] rounded-[8px] cursor-pointer whitespace-nowrap hover:bg-[#E5E5EA] transition-colors duration-200"
            >
              <span className="text-[13px] text-[#1D1D1F]">价格</span>
              <i className={`ri-arrow-${sortBy === 'price-asc' ? 'up' : 'down'}-line text-[14px] text-[#1D1D1F]`}></i>
            </button>

            <button
              {...salesButtonPress}
              onClick={() => setSortBy('sales')}
              className={`px-3 py-1.5 rounded-[8px] cursor-pointer whitespace-nowrap transition-colors duration-200 ${
                sortBy === 'sales' ? 'bg-[#F5F5F7] text-[#1D1D1F] font-semibold border border-[#C7C7CC]' : 'bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5EA] border border-transparent'
              }`}
            >
              <span className="text-[13px]">{sortBy === 'sales' && '✓ '}销量</span>
            </button>

            <button
              {...stockButtonPress}
              onClick={() => setStockOnly(!stockOnly)}
              className={`px-3 py-1.5 rounded-[8px] cursor-pointer whitespace-nowrap transition-colors duration-200 ${
                stockOnly ? 'bg-[#F5F5F7] text-[#1D1D1F] font-semibold border border-[#C7C7CC]' : 'bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5EA] border border-transparent'
              }`}
            >
              <span className="text-[13px]">{stockOnly && '✓ '}仅看有货</span>
            </button>
          </div>
        </div>

        {/* 筛选面板 */}
        {showFilter && (
          <div 
            className="bg-white border-b border-[#E5E5EA] p-4 overflow-hidden"
            style={{
              animation: 'slideDown 0.26s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
            }}
          >
            {/* 品牌筛选 */}
            <div className="mb-4">
              <h3 className="text-[15px] font-medium text-[#1D1D1F] mb-2">品牌</h3>
              <div className="flex flex-wrap gap-2">
                {brands.map((brand, index) => (
                  <button
                    key={brand.id}
                    {...brandPressAnimations[index]}
                    onClick={() => setSelectedBrand(brand.id)}
                    className={`px-3.5 py-1.5 rounded-[16px] text-[13px] cursor-pointer whitespace-nowrap transition-all duration-200 border ${
                      selectedBrand === brand.id
                        ? 'bg-[#F5F5F7] text-[#1D1D1F] font-semibold border-[#C7C7CC] shadow-sm'
                        : 'bg-white text-[#1D1D1F] border-[#D2D2D7] hover:bg-[#F5F5F7]'
                    }`}
                  >
                    {selectedBrand === brand.id && <i className="ri-check-line text-[12px] text-[#0071E3] mr-1"></i>}
                    {brand.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 标签筛选 */}
            <div className="mb-4">
              <h3 className="text-[15px] font-medium text-[#1D1D1F] mb-2">标签</h3>
              <div className="flex flex-wrap gap-2">
                {['现货', '热销', '新品', '推荐'].map((tag, index) => (
                  <button
                    key={tag}
                    {...tagPressAnimations[index]}
                    onClick={() => toggleTag(tag)}
                    className={`px-3.5 py-1.5 rounded-[16px] text-[13px] cursor-pointer whitespace-nowrap transition-all duration-200 border ${
                      selectedTags.includes(tag)
                        ? 'bg-[#F5F5F7] text-[#1D1D1F] font-semibold border-[#C7C7CC] shadow-sm'
                        : 'bg-white text-[#1D1D1F] border-[#D2D2D7] hover:bg-[#F5F5F7]'
                    }`}
                  >
                    {selectedTags.includes(tag) && <i className="ri-check-line text-[12px] text-[#0071E3] mr-1"></i>}
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* 价格区间 */}
            <div className="mb-4">
              <h3 className="text-[15px] font-medium text-[#1D1D1F] mb-2">价格区间</h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                  className="flex-1 px-3 py-2 bg-[#F5F5F7] rounded-[8px] text-[14px] text-[#1D1D1F] outline-none border border-[#E5E5EA] focus:border-[#1D1D1F]"
                  placeholder="最低价"
                />
                <span className="text-[13px] text-[#8E8E93]">-</span>
                <input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="flex-1 px-3 py-2 bg-[#F5F5F7] rounded-[8px] text-[14px] text-[#1D1D1F] outline-none border border-[#E5E5EA] focus:border-[#1D1D1F]"
                  placeholder="最高价"
                />
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <button
                {...resetButtonPress}
                onClick={() => {
                  setSelectedBrand('all');
                  setSelectedTags([]);
                  setPriceRange([0, 50000]);
                  setStockOnly(false);
                }}
                className="flex-1 py-2.5 bg-[#F5F5F7] rounded-[12px] text-[15px] text-[#1D1D1F] font-medium cursor-pointer whitespace-nowrap hover:bg-[#E5E5EA] transition-colors duration-200 border border-[#E5E5EA]"
              >
                重置
              </button>
              <button
                {...confirmButtonPress}
                onClick={() => setShowFilter(false)}
                className="flex-1 py-2.5 bg-[#1D1D1F] rounded-[12px] text-[15px] text-white font-medium cursor-pointer whitespace-nowrap hover:bg-[#000000] transition-colors duration-200"
              >
                确定
              </button>
            </div>
          </div>
        )}

        {/* 商品列表 */}
        <div className="p-4">
          <div ref={productGridRef} className="grid grid-cols-2 gap-3">
            {sortedProducts.map((product, index) => (
              <Link
                key={product.id}
                to={`/products/detail/${product.id}`}
                className="bg-white rounded-[12px] overflow-hidden cursor-pointer group border border-[#E5E5EA] press-interactive"
                style={{
                  opacity: 0,
                  animation: `fadeInUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
                  animationDelay: `${Math.floor(index / 2) * 70}ms`
                }}
              >
                <div className="relative w-full h-[180px] overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {product.tags.includes('现货') && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#6E6E73]/80 backdrop-blur-sm rounded-[4px]">
                      <span className="text-[11px] text-white font-medium">现货</span>
                    </div>
                  )}
                  {product.tags.includes('热销') && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-[#6E6E73]/80 backdrop-blur-sm rounded-[4px]">
                      <span className="text-[11px] text-white font-medium">热销</span>
                    </div>
                  )}
                  {product.tags.includes('新品') && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-[#6E6E73]/80 backdrop-blur-sm rounded-[4px]">
                      <span className="text-[11px] text-white font-medium">新品</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="mb-1">
                    <span className="text-[11px] text-[#8E8E93]">{product.model}</span>
                  </div>
                  <h3 className="text-[14px] font-medium text-[#1D1D1F] mb-2 line-clamp-2 leading-[1.4]">
                    {product.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-[10px] text-[#1D1D1F]">¥</span>
                    <span className="text-[18px] font-semibold text-[#1D1D1F]">{product.price.toLocaleString()}</span>
                    {product.originalPrice && (
                      <span className="text-[11px] text-[#8E8E93] line-through ml-1">
                        ¥{product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#8E8E93]">已售 {product.sold}</span>
                    <button 
                      className="w-6 h-6 flex items-center justify-center bg-[#1D1D1F] rounded-[6px] cursor-pointer hover:bg-[#000000] transition-colors duration-200 press-button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <i className="ri-shopping-cart-line text-[14px] text-white"></i>
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {sortedProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <i className="ri-inbox-line text-[48px] text-[#E5E5EA] mb-3"></i>
              <p className="text-[14px] text-[#8E8E93]">暂无商品</p>
            </div>
          )}

          {sortedProducts.length > 0 && (
            <div className="text-center py-6">
              <span className="text-[12px] text-[#8E8E93]">已经到底了</span>
            </div>
          )}
        </div>
      </div>

      {/* 以图搜索弹窗 */}
      {showImageSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div 
            className="w-[90%] max-w-[360px] bg-white rounded-[20px] overflow-hidden"
            style={{
              animation: 'springScaleIn 0.26s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
            }}
          >
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5EA]">
              <h3 className="text-[17px] font-semibold text-[#1D1D1F]">以图搜索</h3>
              <button
                {...closeButtonPress}
                onClick={() => {
                  setShowImageSearch(false);
                  setSelectedImage(null);
                }}
                className="w-8 h-8 flex items-center justify-center cursor-pointer"
              >
                <i className="ri-close-line text-[22px] text-[#8E8E93]"></i>
              </button>
            </div>

            {/* 图片预览区 */}
            <div className="p-4">
              <div className="relative w-full h-[240px] rounded-[16px] overflow-hidden bg-[#F5F5F7]">
                {selectedImage && (
                  <img
                    src={selectedImage}
                    alt="搜索图片"
                    className="w-full h-full object-contain"
                  />
                )}
                {isSearching && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-3 border-white/30 border-t-white rounded-full animate-spin mb-3"></div>
                    <span className="text-white text-[14px]">正在识别商品...</span>
                  </div>
                )}
              </div>

              {/* 提示文字 */}
              <p className="text-[13px] text-[#8E8E93] text-center mt-3">
                上传家具图片，为您找到相似商品
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="px-4 pb-4 flex gap-3">
              <button
                {...reSelectButtonPress}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-3 bg-[#F5F5F7] rounded-[12px] text-[15px] font-medium text-[#1D1D1F] cursor-pointer whitespace-nowrap hover:bg-[#E5E5EA] transition-colors duration-200 border border-[#E5E5EA]"
              >
                重新选择
              </button>
              <button
                {...searchButtonPress}
                onClick={handleImageSearch}
                disabled={isSearching}
                className="flex-1 py-3 bg-[#1D1D1F] rounded-[12px] text-[15px] font-medium text-white cursor-pointer whitespace-nowrap hover:bg-[#000000] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? '搜索中...' : '开始搜索'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部导航栏 */}
      <TabBar />

      {/* 动画样式 */}
      <style>{`
        @keyframes springScaleIn {
          0% {
            opacity: 0;
            transform: scale(0.92);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideDown {
          0% {
            opacity: 0;
            max-height: 0;
            transform: translateY(-8px);
          }
          100% {
            opacity: 1;
            max-height: 600px;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}