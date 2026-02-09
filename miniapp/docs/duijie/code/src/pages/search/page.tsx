import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { furnitureProducts, furnitureCategories } from '../../mocks/furnitureProducts';

type FilterType = 'category' | 'price' | 'style' | 'material' | 'size' | 'location' | 'stock';
type SortType = 'default' | 'sales' | 'price-asc' | 'price-desc' | 'new';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  sold?: number;
  tags?: string[];
  category?: string;
  specs?: {
    material?: string;
    size?: string;
  };
}

// 热门搜索标签
const hotSearchTags = ['软装', '沙发', '床具', '餐桌椅', '柜类', '桌类', '灯具', '软装饰', '户外家具'];

// 筛选选项
const filterOptions = {
  category: ['全部', '沙发', '床具', '餐桌椅', '柜类', '桌类', '灯具', '软装饰', '户外家具'],
  price: ['不限', '0-1000', '1000-3000', '3000-5000', '5000-10000', '10000以上'],
  style: ['不限', '现代简约', '北欧风', '轻奢', '中式', '美式', '日式', '工业风'],
  material: ['不限', '实木', '真皮', '布艺', '金属', '大理石', '藤编'],
  size: ['不限', '小型', '中型', '大型'],
  location: ['不限', '广东', '浙江', '江苏', '上海', '北京'],
  stock: ['不限', '现货', '预售']
};

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const isImageSearch = searchParams.get('type') === 'image';

  const [searchText, setSearchText] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(['意式轻奢沙发', '实木餐桌', '北欧床具']);
  const [sortType, setSortType] = useState<SortType>('default');
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<FilterType, string>>({
    category: '全部',
    price: '不限',
    style: '不限',
    material: '不限',
    size: '不限',
    location: '不限',
    stock: '不限'
  });

  // 以图搜索状态
  const [showImageSearch, setShowImageSearch] = useState(isImageSearch);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [imageSearchTab, setImageSearchTab] = useState<'similar' | 'same' | 'style'>('similar');
  const [imageSearchResults, setImageSearchResults] = useState<Product[]>([]);
  const [imageSearchTag, setImageSearchTag] = useState('');

  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 骨架屏组件
  const SkeletonCard = () => (
    <div className="bg-white rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200"></div>
      <div className="p-3">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
        <div className="h-5 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );

  // 搜索建议骨架屏
  const SuggestionSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-20 mb-4"></div>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-8 bg-gray-200 rounded-full w-16"></div>
        ))}
      </div>
    </div>
  );

  // 执行搜索
  const handleSearch = (query?: string) => {
    const searchQuery = query || searchText;
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setLoadError(false);
    setHasSearched(true);

    // 保存搜索历史
    if (!recentSearches.includes(searchQuery)) {
      setRecentSearches(prev => [searchQuery, ...prev.slice(0, 9)]);
    }

    // 模拟搜索
    setTimeout(() => {
      const results = furnitureProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.includes(searchQuery) ||
        p.specs?.material?.includes(searchQuery)
      );
      setSearchResults(results.length > 0 ? results : furnitureProducts.slice(0, 8));
      setIsLoading(false);
    }, 800);
  };

  // 清空搜索
  const clearSearch = () => {
    setSearchText('');
    setHasSearched(false);
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  // 清空历史
  const clearHistory = () => {
    setRecentSearches([]);
  };

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        startImageRecognition();
      };
      reader.readAsDataURL(file);
    }
  };

  // 开始图片识别
  const startImageRecognition = () => {
    setIsRecognizing(true);
    setTimeout(() => {
      setIsRecognizing(false);
      setImageSearchTag('相似：意式轻奢 沙发');
      setImageSearchResults(furnitureProducts.filter(p => p.category === 'sofa').slice(0, 6));
    }, 2000);
  };

  // 切换回文字搜索
  const switchToTextSearch = () => {
    if (imageSearchTag) {
      setSearchText(imageSearchTag);
    }
    setShowImageSearch(false);
    setUploadedImage(null);
    handleSearch(imageSearchTag);
  };

  // 排序
  const sortProducts = (products: Product[]) => {
    switch (sortType) {
      case 'sales':
        return [...products].sort((a, b) => (b.sold || 0) - (a.sold || 0));
      case 'price-asc':
        return [...products].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...products].sort((a, b) => b.price - a.price);
      default:
        return products;
    }
  };

  // 下拉刷新
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      if (hasSearched) {
        handleSearch();
      }
    }, 1000);
  };

  // 重试
  const handleRetry = () => {
    if (showImageSearch && uploadedImage) {
      startImageRecognition();
    } else {
      handleSearch();
    }
  };

  // 初始化搜索
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, []);

  const displayResults = sortProducts(hasSearched ? searchResults : []);

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA]">
        <div className="flex items-center px-4 py-2 gap-3">
          {/* 返回按钮 */}
          <button 
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center cursor-pointer"
          >
            <i className="ri-arrow-left-s-line text-2xl text-[#1D1D1F]"></i>
          </button>

          {/* 搜索框 */}
          <div className="flex-1 relative">
            <div className="flex items-center bg-[#F5F5F7] rounded-[12px] px-3 py-2">
              <i className="ri-search-line text-[#8E8E93] mr-2"></i>
              <input
                ref={searchInputRef}
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜索商品/品牌/型号"
                className="flex-1 bg-transparent text-[15px] outline-none placeholder-[#8E8E93] text-[#1D1D1F]"
              />
              {searchText && (
                <button onClick={clearSearch} className="p-1 cursor-pointer">
                  <i className="ri-close-circle-fill text-[#8E8E93]"></i>
                </button>
              )}
              <button 
                onClick={() => setShowImageSearch(true)}
                className="ml-2 p-1 cursor-pointer"
              >
                <i className="ri-camera-line text-[#1D1D1F] text-lg"></i>
              </button>
            </div>
          </div>

          {/* 搜索按钮 */}
          <button 
            onClick={() => handleSearch()}
            className="px-4 py-2 bg-white text-[#1D1D1F] text-[14px] font-medium rounded-[14px] whitespace-nowrap cursor-pointer hover:bg-[#F5F5F7] transition-colors border border-[#D2D2D7] active:bg-[#F5F5F7]"
          >
            搜索
          </button>
        </div>

        {/* 筛选条 - 有结果时显示 */}
        {hasSearched && !isLoading && searchResults.length > 0 && (
          <div className="flex items-center px-4 py-2 gap-4 border-t border-[#E5E5EA] overflow-x-auto">
            <button 
              onClick={() => setSortType('default')}
              className={`text-[14px] whitespace-nowrap cursor-pointer ${sortType === 'default' ? 'text-[#1D1D1F] font-medium' : 'text-[#6E6E73]'}`}
            >
              综合
            </button>
            <button 
              onClick={() => setSortType('sales')}
              className={`text-[14px] whitespace-nowrap cursor-pointer ${sortType === 'sales' ? 'text-[#1D1D1F] font-medium' : 'text-[#6E6E73]'}`}
            >
              销量
            </button>
            <button 
              onClick={() => setSortType(sortType === 'price-asc' ? 'price-desc' : 'price-asc')}
              className={`text-[14px] whitespace-nowrap flex items-center gap-1 cursor-pointer ${sortType.startsWith('price') ? 'text-[#1D1D1F] font-medium' : 'text-[#6E6E73]'}`}
            >
              价格
              <div className="flex flex-col">
                <i className={`ri-arrow-up-s-fill text-xs leading-none ${sortType === 'price-asc' ? 'text-[#1D1D1F]' : 'text-[#C6C6C8]'}`}></i>
                <i className={`ri-arrow-down-s-fill text-xs leading-none -mt-1 ${sortType === 'price-desc' ? 'text-[#1D1D1F]' : 'text-[#C6C6C8]'}`}></i>
              </div>
            </button>
            <button 
              onClick={() => setSortType('new')}
              className={`text-[14px] whitespace-nowrap cursor-pointer ${sortType === 'new' ? 'text-[#1D1D1F] font-medium' : 'text-[#6E6E73]'}`}
            >
              上新
            </button>
            <div className="flex-1"></div>
            <button 
              onClick={() => setShowFilter(true)}
              className="flex items-center gap-1 text-[14px] text-[#6E6E73] cursor-pointer"
            >
              <i className="ri-filter-3-line"></i>
              筛选
            </button>
          </div>
        )}
      </div>

      {/* 下拉刷新提示 */}
      {isRefreshing && (
        <div className="flex items-center justify-center py-4 bg-white">
          <i className="ri-loader-4-line animate-spin text-[#1D1D1F] mr-2"></i>
          <span className="text-[14px] text-[#8E8E93]">刷新中...</span>
        </div>
      )}

      {/* 主内容区 */}
      <div className="pb-6">
        {/* 未搜索时显示搜索建议 */}
        {!hasSearched && !isLoading && (
          <div className="px-4 py-4">
            {/* 热门搜索 */}
            <div className="mb-6">
              <h3 className="text-[15px] font-medium text-[#1D1D1F] mb-3">热门搜索</h3>
              <div className="flex flex-wrap gap-2">
                {hotSearchTags.map((tag, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchText(tag);
                      handleSearch(tag);
                    }}
                    className="px-4 py-2 bg-white rounded-full text-[14px] text-[#6E6E73] cursor-pointer hover:bg-[#F5F5F7] hover:text-[#1D1D1F] transition-colors border border-[#E5E5EA]"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* 最近搜索 */}
            {recentSearches.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[15px] font-medium text-[#1D1D1F]">最近搜索</h3>
                  <button 
                    onClick={clearHistory}
                    className="text-[13px] text-[#8E8E93] cursor-pointer"
                  >
                    清空
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchText(item);
                        handleSearch(item);
                      }}
                      className="px-4 py-2 bg-white rounded-full text-[14px] text-[#6E6E73] flex items-center gap-2 cursor-pointer hover:bg-[#F5F5F7] hover:text-[#1D1D1F] transition-colors border border-[#E5E5EA]"
                    >
                      <i className="ri-time-line text-[#8E8E93]"></i>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 推荐类目 */}
            <div>
              <h3 className="text-[15px] font-medium text-[#1D1D1F] mb-3">推荐类目</h3>
              <div className="grid grid-cols-4 gap-3">
                {furnitureCategories.slice(0, 8).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSearchText(cat.name);
                      handleSearch(cat.name);
                    }}
                    className="flex flex-col items-center p-3 bg-white rounded-[16px] cursor-pointer hover:shadow-sm transition-shadow border border-[#E5E5EA]"
                  >
                    <div className="w-12 h-12 flex items-center justify-center bg-[#F5F5F7] rounded-full mb-2">
                      <i className={`${cat.icon} text-xl text-[#1D1D1F]`}></i>
                    </div>
                    <span className="text-[12px] text-[#1D1D1F]">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 加载中骨架屏 */}
        {isLoading && (
          <div className="px-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        )}

        {/* 搜索结果 */}
        {hasSearched && !isLoading && !loadError && (
          <>
            {searchResults.length > 0 ? (
              <div className="px-4 py-4">
                <div className="text-[13px] text-[#8E8E93] mb-3">
                  共找到 {searchResults.length} 件商品
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {displayResults.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => navigate(`/products/detail?id=${product.id}`)}
                      className="bg-white rounded-[16px] overflow-hidden cursor-pointer hover:shadow-sm transition-shadow border border-[#E5E5EA]"
                    >
                      <div className="aspect-square relative">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover object-top"
                        />
                        {product.tags?.includes('现货') && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#6E6E73]/80 backdrop-blur-sm text-white text-[11px] rounded">
                            现货
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="text-[14px] text-[#1D1D1F] line-clamp-2 mb-2 leading-snug">
                          {product.name}
                        </h4>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-[#1D1D1F] font-semibold">
                            ¥{product.price.toLocaleString()}
                          </span>
                          {product.originalPrice && (
                            <span className="text-[12px] text-[#8E8E93] line-through">
                              ¥{product.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[12px] text-[#8E8E93]">
                          <span>已售 {product.sold || 0}</span>
                          <span>广东发货</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* 空状态 */
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-24 h-24 flex items-center justify-center bg-[#F5F5F7] rounded-full mb-4">
                  <i className="ri-search-line text-4xl text-[#C6C6C8]"></i>
                </div>
                <p className="text-[#8E8E93] mb-4">未找到相关商品</p>
                <button
                  onClick={() => navigate('/products/category')}
                  className="px-6 py-2.5 bg-white text-[#1D1D1F] text-[14px] rounded-[14px] cursor-pointer whitespace-nowrap hover:bg-[#F5F5F7] border border-[#D2D2D7] active:bg-[#F5F5F7] font-medium"
                >
                  去逛分类
                </button>
              </div>
            )}
          </>
        )}

        {/* 加载失败 */}
        {loadError && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 flex items-center justify-center bg-[#F5F5F7] rounded-full mb-4">
              <i className="ri-wifi-off-line text-4xl text-[#C6C6C8]"></i>
            </div>
            <p className="text-[#8E8E93] mb-4">加载失败</p>
            <button
              onClick={handleRetry}
              className="px-6 py-2.5 bg-white text-[#1D1D1F] text-[14px] rounded-[14px] cursor-pointer whitespace-nowrap hover:bg-[#F5F5F7] border border-[#D2D2D7] active:bg-[#F5F5F7] font-medium"
            >
              重试
            </button>
          </div>
        )}
      </div>

      {/* 以图搜索弹窗 */}
      {showImageSearch && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => !uploadedImage && setShowImageSearch(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[20px] max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5EA]">
              <button 
                onClick={() => {
                  setShowImageSearch(false);
                  setUploadedImage(null);
                  setImageSearchResults([]);
                }}
                className="text-[#6E6E73] cursor-pointer"
              >
                取消
              </button>
              <h3 className="font-medium text-[#1D1D1F]">以图搜索</h3>
              {uploadedImage && imageSearchResults.length > 0 && (
                <button 
                  onClick={switchToTextSearch}
                  className="text-[#1D1D1F] text-[14px] cursor-pointer whitespace-nowrap"
                >
                  文字搜索
                </button>
              )}
              {!uploadedImage && <div className="w-10"></div>}
            </div>

            {/* 未上传图片 */}
            {!uploadedImage && (
              <div className="p-6">
                <div className="flex gap-4 justify-center mb-6">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-2 p-6 bg-[#F5F5F7] rounded-[16px] flex-1 max-w-[140px] cursor-pointer hover:bg-[#E5E5EA] transition-colors border border-[#E5E5EA]"
                  >
                    <div className="w-14 h-14 flex items-center justify-center bg-[#1D1D1F] rounded-full">
                      <i className="ri-camera-line text-2xl text-white"></i>
                    </div>
                    <span className="text-[14px] text-[#1D1D1F]">拍照搜索</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-2 p-6 bg-[#F5F5F7] rounded-[16px] flex-1 max-w-[140px] cursor-pointer hover:bg-[#E5E5EA] transition-colors border border-[#E5E5EA]"
                  >
                    <div className="w-14 h-14 flex items-center justify-center bg-[#1D1D1F] rounded-full">
                      <i className="ri-image-line text-2xl text-white"></i>
                    </div>
                    <span className="text-[14px] text-[#1D1D1F]">相册选择</span>
                  </button>
                </div>
                <p className="text-center text-[13px] text-[#8E8E93]">
                  支持拍照或上传图片搜索相似商品
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            )}

            {/* 已上传图片 - 识别中 */}
            {uploadedImage && isRecognizing && (
              <div className="p-6">
                <div className="relative mb-6">
                  <img
                    src={uploadedImage}
                    alt="上传的图片"
                    className="w-full h-48 object-contain rounded-[16px] bg-[#F5F5F7]"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 rounded-[16px]">
                    <i className="ri-loader-4-line animate-spin text-3xl text-white mb-2"></i>
                    <span className="text-white text-[14px]">识别中...</span>
                  </div>
                </div>
                {/* 骨架屏 */}
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-square bg-[#F5F5F7] rounded-lg mb-2"></div>
                      <div className="h-3 bg-[#F5F5F7] rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 已上传图片 - 识别结果 */}
            {uploadedImage && !isRecognizing && (
              <div className="max-h-[80vh] overflow-y-auto">
                {/* 图片预览 */}
                <div className="p-4">
                  <div className="relative">
                    <img
                      src={uploadedImage}
                      alt="上传的图片"
                      className="w-full h-40 object-contain rounded-[16px] bg-[#F5F5F7]"
                    />
                    <button
                      onClick={() => {
                        setUploadedImage(null);
                        setImageSearchResults([]);
                        fileInputRef.current?.click();
                      }}
                      className="absolute top-2 right-2 px-3 py-1 bg-black/50 text-white text-[12px] rounded-full cursor-pointer whitespace-nowrap"
                    >
                      更换图片
                    </button>
                  </div>
                  {imageSearchTag && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[13px] text-[#8E8E93]">识别结果：</span>
                      <span className="px-3 py-1 bg-[#F5F5F7] text-[#1D1D1F] text-[13px] rounded-full">
                        {imageSearchTag}
                      </span>
                    </div>
                  )}
                </div>

                {/* 结果切换 */}
                {imageSearchResults.length > 0 ? (
                  <>
                    <div className="flex items-center gap-4 px-4 py-2 border-t border-[#E5E5EA]">
                      {(['similar', 'same', 'style'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setImageSearchTab(tab)}
                          className={`text-[14px] pb-2 border-b-2 cursor-pointer whitespace-nowrap ${
                            imageSearchTab === tab 
                              ? 'text-[#1D1D1F] border-[#1D1D1F] font-medium' 
                              : 'text-[#6E6E73] border-transparent'
                          }`}
                        >
                          {tab === 'similar' ? '相似商品' : tab === 'same' ? '同款' : '同风格'}
                        </button>
                      ))}
                    </div>

                    {/* 商品列表 */}
                    <div className="p-4 grid grid-cols-2 gap-3">
                      {imageSearchResults.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => {
                            setShowImageSearch(false);
                            navigate(`/products/detail?id=${product.id}`);
                          }}
                          className="bg-white rounded-[16px] overflow-hidden border border-[#E5E5EA] cursor-pointer"
                        >
                          <div className="aspect-square">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                          <div className="p-2">
                            <h4 className="text-[13px] text-[#1D1D1F] line-clamp-2 mb-1">
                              {product.name}
                            </h4>
                            <span className="text-[#1D1D1F] text-[14px] font-medium">
                              ¥{product.price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  /* 无结果空状态 */
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-20 h-20 flex items-center justify-center bg-[#F5F5F7] rounded-full mb-4">
                      <i className="ri-image-line text-3xl text-[#C6C6C8]"></i>
                    </div>
                    <p className="text-[#8E8E93] mb-2">未找到相似商品</p>
                    <p className="text-[13px] text-[#8E8E93] mb-4">请尝试更换图片或调整裁剪区域</p>
                    <button
                      onClick={() => {
                        setUploadedImage(null);
                        fileInputRef.current?.click();
                      }}
                      className="px-6 py-2.5 bg-white text-[#1D1D1F] text-[14px] rounded-[14px] cursor-pointer whitespace-nowrap hover:bg-[#F5F5F7] border border-[#D2D2D7] active:bg-[#F5F5F7] font-medium"
                    >
                      更换图片
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 筛选面板 */}
      {showFilter && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowFilter(false)}>
          <div 
            className="absolute right-0 top-0 bottom-0 w-[80%] max-w-[320px] bg-white overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-4 py-3 border-b border-[#E5E5EA]">
              <h3 className="font-medium text-[#1D1D1F]">筛选</h3>
              <button 
                onClick={() => setShowFilter(false)}
                className="w-8 h-8 flex items-center justify-center cursor-pointer"
              >
                <i className="ri-close-line text-xl text-[#8E8E93]"></i>
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* 类目 */}
              <div>
                <h4 className="text-[15px] font-medium text-[#1D1D1F] mb-3">类目</h4>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.category.map((item) => (
                    <button
                      key={item}
                      onClick={() => setActiveFilters(prev => ({ ...prev, category: item }))}
                      className={`px-3 py-1.5 rounded-full text-[14px] cursor-pointer whitespace-nowrap ${
                        activeFilters.category === item
                          ? 'bg-[#1D1D1F] text-white'
                          : 'bg-[#F5F5F7] text-[#6E6E73]'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* 价格区间 */}
              <div>
                <h4 className="text-[15px] font-medium text-[#1D1D1F] mb-3">价格区间</h4>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.price.map((item) => (
                    <button
                      key={item}
                      onClick={() => setActiveFilters(prev => ({ ...prev, price: item }))}
                      className={`px-3 py-1.5 rounded-full text-[14px] cursor-pointer whitespace-nowrap ${
                        activeFilters.price === item
                          ? 'bg-[#1D1D1F] text-white'
                          : 'bg-[#F5F5F7] text-[#6E6E73]'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* 风格 */}
              <div>
                <h4 className="text-[15px] font-medium text-[#1D1D1F] mb-3">风格</h4>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.style.map((item) => (
                    <button
                      key={item}
                      onClick={() => setActiveFilters(prev => ({ ...prev, style: item }))}
                      className={`px-3 py-1.5 rounded-full text-[14px] cursor-pointer whitespace-nowrap ${
                        activeFilters.style === item
                          ? 'bg-[#1D1D1F] text-white'
                          : 'bg-[#F5F5F7] text-[#6E6E73]'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* 材质 */}
              <div>
                <h4 className="text-[15px] font-medium text-[#1D1D1F] mb-3">材质</h4>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.material.map((item) => (
                    <button
                      key={item}
                      onClick={() => setActiveFilters(prev => ({ ...prev, material: item }))}
                      className={`px-3 py-1.5 rounded-full text-[14px] cursor-pointer whitespace-nowrap ${
                        activeFilters.material === item
                          ? 'bg-[#1D1D1F] text-white'
                          : 'bg-[#F5F5F7] text-[#6E6E73]'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* 发货地 */}
              <div>
                <h4 className="text-[15px] font-medium text-[#1D1D1F] mb-3">发货地</h4>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.location.map((item) => (
                    <button
                      key={item}
                      onClick={() => setActiveFilters(prev => ({ ...prev, location: item }))}
                      className={`px-3 py-1.5 rounded-full text-[14px] cursor-pointer whitespace-nowrap ${
                        activeFilters.location === item
                          ? 'bg-[#1D1D1F] text-white'
                          : 'bg-[#F5F5F7] text-[#6E6E73]'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* 库存 */}
              <div>
                <h4 className="text-[15px] font-medium text-[#1D1D1F] mb-3">是否现货</h4>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.stock.map((item) => (
                    <button
                      key={item}
                      onClick={() => setActiveFilters(prev => ({ ...prev, stock: item }))}
                      className={`px-3 py-1.5 rounded-full text-[14px] cursor-pointer whitespace-nowrap ${
                        activeFilters.stock === item
                          ? 'bg-[#1D1D1F] text-white'
                          : 'bg-[#F5F5F7] text-[#6E6E73]'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="sticky bottom-0 bg-white border-t border-[#E5E5EA] p-4 flex gap-3">
              <button
                onClick={() => setActiveFilters({
                  category: '全部',
                  price: '不限',
                  style: '不限',
                  material: '不限',
                  size: '不限',
                  location: '不限',
                  stock: '不限'
                })}
                className="flex-1 h-[48px] border border-[#D2D2D7] rounded-[14px] text-[#1D1D1F] text-[15px] cursor-pointer whitespace-nowrap hover:bg-[#F5F5F7] active:bg-[#F5F5F7] font-medium"
              >
                重置
              </button>
              <button
                onClick={() => {
                  setShowFilter(false);
                  handleSearch();
                }}
                className="flex-1 h-[48px] bg-white text-[#1D1D1F] rounded-[14px] text-[15px] cursor-pointer whitespace-nowrap hover:bg-[#F5F5F7] border border-[#D2D2D7] active:bg-[#F5F5F7] font-medium"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
