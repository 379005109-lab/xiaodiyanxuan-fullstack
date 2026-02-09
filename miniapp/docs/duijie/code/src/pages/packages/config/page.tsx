import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { packages, packageConfigCategories } from '../../../mocks/packages';

interface ProductSpec {
  id: string;
  name: string;
  size: string;
  price: number;
}

interface ProductFabric {
  id: string;
  name: string;
  color: string;
  priceAdd: number;
}

interface Product {
  id: string;
  name: string;
  image: string;
  images: string[];
  specs: ProductSpec[];
  fabrics?: ProductFabric[];
}

interface SelectedProduct {
  categoryId: string;
  categoryName: string;
  productId: string;
  productName: string;
  image: string;
  specId: string;
  specName: string;
  specSize: string;
  fabricId?: string;
  fabricName?: string;
  price: number;
}

const defaultFabrics: ProductFabric[] = [
  { id: 'f1', name: '科技布', color: '#8B8B8B', priceAdd: 0 },
  { id: 'f2', name: '头层真皮', color: '#4A4A4A', priceAdd: 2000 },
  { id: 'f3', name: '意大利进口皮', color: '#2C2C2C', priceAdd: 5000 },
  { id: 'f4', name: '纳帕皮', color: '#5D4E37', priceAdd: 3500 },
];

export default function PackageConfigPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(packageConfigCategories[0].id);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSpec, setSelectedSpec] = useState<ProductSpec | null>(null);
  const [selectedFabric, setSelectedFabric] = useState<ProductFabric | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);

  const pkg = packages.find(p => p.id === Number(id));
  const currentCategory = packageConfigCategories.find(c => c.id === activeCategory);

  const totalPrice = useMemo(() => {
    return selectedProducts.reduce((sum, item) => sum + item.price, 0);
  }, [selectedProducts]);

  const selectedCount = selectedProducts.length;
  const basePrice = pkg?.price || 0;
  const estimatedPrice = basePrice + totalPrice;

  const currentTotalPrice = useMemo(() => {
    const specPrice = selectedSpec?.price || 0;
    const fabricPrice = selectedFabric?.priceAdd || 0;
    return specPrice + fabricPrice;
  }, [selectedSpec, selectedFabric]);

  const handleOpenSpecModal = (product: Product) => {
    setCurrentProduct(product);
    setCurrentImageIndex(0);
    setSelectedSpec(product.specs[0] || null);
    setSelectedFabric(defaultFabrics[0]);
    setShowSpecModal(true);
  };

  const handleConfirmAdd = () => {
    if (!currentProduct || !selectedSpec || !currentCategory) return;

    const newItem: SelectedProduct = {
      categoryId: currentCategory.id,
      categoryName: currentCategory.name,
      productId: currentProduct.id,
      productName: currentProduct.name,
      image: currentProduct.image,
      specId: selectedSpec.id,
      specName: selectedSpec.name,
      specSize: selectedSpec.size,
      fabricId: selectedFabric?.id,
      fabricName: selectedFabric?.name,
      price: currentTotalPrice,
    };

    setSelectedProducts(prev => {
      const existingIndex = prev.findIndex(p => p.categoryId === currentCategory.id);
      if (existingIndex >= 0) {
        const newList = [...prev];
        newList[existingIndex] = newItem;
        return newList;
      }
      return [...prev, newItem];
    });

    setShowSpecModal(false);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 1500);
  };

  const handleRemoveProduct = (categoryId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.categoryId !== categoryId));
  };

  const getCategorySelectedProduct = (categoryId: string) => {
    return selectedProducts.find(p => p.categoryId === categoryId);
  };

  const isProductSelected = (productId: string) => {
    return selectedProducts.some(p => p.productId === productId && p.categoryId === activeCategory);
  };

  const handleSubmit = () => {
    if (selectedProducts.length === 0) return;
    
    // 跳转到订单确认页，传递套餐信息和已选商品
    navigate('/orders/confirm', {
      state: {
        isPackageOrder: true,
        packageInfo: {
          id: pkg?.id,
          name: pkg?.name,
          basePrice: basePrice,
        },
        packageItems: selectedProducts.map(item => ({
          id: item.productId,
          name: item.productName,
          image: item.image,
          spec: item.specName,
          size: item.specSize,
          fabric: item.fabricName,
          price: item.price,
          categoryName: item.categoryName,
          quantity: 1,
        })),
        totalPrice: estimatedPrice,
      }
    });
  };

  const handlePrevImage = () => {
    if (!currentProduct) return;
    setCurrentImageIndex(prev =>
      prev === 0 ? currentProduct.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!currentProduct) return;
    setCurrentImageIndex(prev =>
      prev === currentProduct.images.length - 1 ? 0 : prev + 1
    );
  };

  if (!pkg) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-center">
          <i className="ri-error-warning-line text-[48px] text-[#C7C7CC] mb-4"></i>
          <p className="text-[15px] text-[#6E6E73]">套餐不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
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
          <h1 className="text-[17px] font-semibold text-[#1D1D1F]">{pkg.name}</h1>
          <button
            onClick={() => setShowCart(true)}
            className="relative w-8 h-8 flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-90"
          >
            <i className="ri-shopping-bag-line text-[22px] text-[#1D1D1F]"></i>
            {selectedCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-[#FF3B30] rounded-full text-[10px] text-white flex items-center justify-center font-medium px-1">
                {selectedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div
        className="flex-1 flex"
        style={{
          paddingTop: 'calc(44px + env(safe-area-inset-top))',
          paddingBottom: 'calc(180px + env(safe-area-inset-bottom))',
        }}
      >
        {/* 左侧分类导航 */}
        <div className="w-[80px] bg-[#F5F5F7] flex-shrink-0 overflow-y-auto">
          {packageConfigCategories.map(category => {
            const isActive = activeCategory === category.id;
            const hasSelected = getCategorySelectedProduct(category.id);
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`w-full py-4 px-2 flex flex-col items-center gap-1 cursor-pointer transition-all relative ${
                  isActive ? 'bg-white' : ''
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[20px] bg-[#1D1D1F] rounded-r-full"></div>
                )}
                <span
                  className={`text-[13px] ${
                    isActive ? 'font-semibold text-[#1D1D1F]' : 'text-[#6E6E73]'
                  }`}
                >
                  {category.name}
                </span>
                {category.badge && (
                  <span className="text-[10px] text-[#6E6E73] bg-[#E5E5EA] px-1.5 py-0.5 rounded-full">
                    {category.badge}
                  </span>
                )}
                {hasSelected && (
                  <i className="ri-checkbox-circle-fill text-[14px] text-[#1D1D1F]"></i>
                )}
              </button>
            );
          })}
        </div>

        {/* 右侧产品列表 */}
        <div className="flex-1 bg-white overflow-y-auto">
          {/* 分类标题 */}
          <div className="sticky top-0 bg-white/80 backdrop-blur-xl px-4 py-3 border-b border-[#E5E5EA] z-10">
            <h3 className="text-[15px] font-semibold text-[#1D1D1F]">{currentCategory?.name}</h3>
            <p className="text-[12px] text-[#8E8E93] mt-0.5">点击商品选择规格加入配置</p>
          </div>

          {/* 产品网格 */}
          <div className="p-3">
            <div className="grid grid-cols-2 gap-3">
              {currentCategory?.products.map(product => {
                const selected = isProductSelected(product.id);
                return (
                  <div
                    key={product.id}
                    className={`bg-[#F5F5F7] rounded-2xl overflow-hidden transition-all duration-200 ${
                      selected ? 'ring-2 ring-[#1D1D1F]' : ''
                    }`}
                  >
                    {/* 产品图片 */}
                    <div className="relative aspect-square bg-white">
                      {selected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center z-10 bg-[#1D1D1F]">
                          <i className="ri-check-line text-[12px] text-white"></i>
                        </div>
                      )}
                      {product.images && product.images.length > 1 && (
                        <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full z-10">
                          1/{product.images.length}
                        </div>
                      )}
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                    {/* 产品信息 */}
                    <div className="p-2.5 bg-[#F5F5F7]">
                      <p className="text-[13px] font-medium text-[#1D1D1F] truncate">{product.name}</p>
                      <p className="text-[11px] text-[#8E8E93] mt-0.5">
                        {product.specs.length}种规格可选
                      </p>
                      <button
                        onClick={() => handleOpenSpecModal(product as Product)}
                        className="w-full mt-2 py-2 bg-white border border-[#D2D2D7] rounded-lg text-[13px] font-medium text-[#1D1D1F] cursor-pointer transition-all duration-150 active:bg-[#F5F5F7] whitespace-nowrap"
                      >
                        加入配置
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 底部配置清单和操作栏 */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-t border-[#E5E5EA]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* 已选配置清单 */}
        {selectedCount > 0 && (
          <div className="px-4 py-3 border-b border-[#E5E5EA] max-h-[80px] overflow-y-auto">
            <div className="flex items-center gap-2 overflow-x-auto">
              {selectedProducts.map(item => (
                <div key={item.categoryId} className="flex-shrink-0 relative">
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-14 h-14 rounded-xl object-contain bg-[#F5F5F7] border border-[#E5E5EA]"
                  />
                  <button
                    onClick={() => handleRemoveProduct(item.categoryId)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-[#1D1D1F] rounded-full flex items-center justify-center cursor-pointer"
                  >
                    <i className="ri-close-line text-[10px] text-white"></i>
                  </button>
                </div>
              ))}
              <button
                onClick={() => setShowCart(true)}
                className="flex-shrink-0 w-14 h-14 bg-[#F5F5F7] rounded-xl flex items-center justify-center cursor-pointer transition-colors duration-150 active:bg-[#E5E5EA]"
              >
                <i className="ri-arrow-right-s-line text-[20px] text-[#6E6E73]"></i>
              </button>
            </div>
          </div>
        )}

        {/* 价格信息和操作按钮 */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[11px] text-[#8E8E93]">基础价</p>
                <p className="text-[15px] font-semibold text-[#1D1D1F]">¥{basePrice.toLocaleString()}</p>
              </div>
              <div className="w-px h-8 bg-[#E5E5EA]"></div>
              <div>
                <p className="text-[11px] text-[#8E8E93]">已选 {selectedCount} 件</p>
                <p className="text-[15px] font-semibold text-[#1D1D1F]">+¥{totalPrice.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-[#8E8E93]">预估价格</p>
              <p className="text-[20px] font-bold text-[#1D1F]">¥{estimatedPrice.toLocaleString()}</p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={selectedCount === 0}
            className={`w-full px-6 py-3 rounded-[14px] text-[15px] font-medium cursor-pointer whitespace-nowrap transition-all duration-150 ${
              selectedCount > 0
                ? 'bg-white border border-[#D2D2D7] text-[#1D1D1F] active:bg-[#F5F5F7]'
                : 'bg-[#E5E5EA] text-[#8E8E93] border border-[#E5E5EA]'
            }`}
          >
            提交采购意向
          </button>
        </div>
      </div>

      {/* 规格选择弹窗 - Apple ActionSheet风格 */}
      {showSpecModal && currentProduct && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowSpecModal(false)}
          ></div>
          <div
            className="relative w-full bg-white rounded-t-[20px] flex flex-col animate-slide-up"
            style={{
              maxHeight: '85vh',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* 拖拽指示条 */}
            <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
              <div className="w-9 h-1 bg-[#D1D1D6] rounded-full"></div>
            </div>

            {/* 标题栏 */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#E5E5EA] flex-shrink-0">
              <span className="text-[15px] font-medium text-[#1D1D1F]">选择规格材质</span>
              <button
                onClick={() => setShowSpecModal(false)}
                className="w-8 h-8 flex items-center justify-center bg-[#F5F5F7] rounded-full cursor-pointer transition-transform duration-150 active:scale-90"
              >
                <i className="ri-close-line text-[20px] text-[#6E6E73]"></i>
              </button>
            </div>

            {/* 商品名称 */}
            <div className="px-4 py-3 bg-[#F5F5F7] flex-shrink-0">
              <h3 className="text-[17px] font-semibold text-[#1D1D1F]">{currentProduct.name}</h3>
            </div>

            {/* 可滚动内容区域 */}
            <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
              {/* 图片轮播区域 */}
              <div className="bg-white px-4 py-4">
                <div className="relative aspect-[4/3] max-h-[200px] mx-auto bg-[#F5F5F7] rounded-2xl overflow-hidden">
                  <img
                    src={currentProduct.images[currentImageIndex]}
                    alt={currentProduct.name}
                    className="w-full h-full object-contain"
                  />

                  {currentProduct.images.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer shadow-sm transition-transform duration-150 active:scale-90"
                      >
                        <i className="ri-arrow-left-s-line text-[20px] text-[#1D1D1F]"></i>
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer shadow-sm transition-transform duration-150 active:scale-90"
                      >
                        <i className="ri-arrow-right-s-line text-[20px] text-[#1D1D1F]"></i>
                      </button>
                    </>
                  )}

                  {currentProduct.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[11px] px-2 py-0.5 rounded-full">
                      {currentImageIndex + 1}/{currentProduct.images.length}
                    </div>
                  )}
                </div>

                {currentProduct.images.length > 1 && (
                  <div className="flex justify-center gap-1.5 mt-3">
                    {currentProduct.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-2 rounded-full cursor-pointer transition-all duration-200 ${
                          index === currentImageIndex ? 'bg-[#1D1D1F] w-4' : 'bg-[#D1D1D6] w-2'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 选择规格 */}
              <div className="px-4 pb-4">
                <p className="text-[13px] font-medium text-[#6E6E73] mb-3">选择规格</p>
                <div className="space-y-2">
                  {currentProduct.specs.map(spec => (
                    <button
                      key={spec.id}
                      onClick={() => setSelectedSpec(spec)}
                      className={`w-full p-3 rounded-[16px] cursor-pointer transition-all duration-200 text-left flex items-center justify-between ${
                        selectedSpec?.id === spec.id
                          ? 'border border-[#C7C7CC] bg-[#F5F5F7] ring-2 ring-[#0071E3]/30'
                          : 'border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            selectedSpec?.id === spec.id ? 'border-[#0071E3] bg-[#0071E3]' : 'border-[#D2D2D7]'
                          }`}
                        >
                          {selectedSpec?.id === spec.id && (
                            <i className="ri-check-line text-[12px] text-white"></i>
                          )}
                        </div>
                        <div>
                          <p className={`text-[15px] text-[#1D1D1F] ${selectedSpec?.id === spec.id ? 'font-semibold' : 'font-medium'}`}>{spec.name}</p>
                          <p className="text-[12px] text-[#8E8E93] mt-0.5">尺寸：{spec.size}</p>
                        </div>
                      </div>
                      <p className={`text-[16px] text-[#1D1D1F] ${selectedSpec?.id === spec.id ? 'font-bold' : 'font-medium'}`}>¥{spec.price.toLocaleString()}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 选择面料 */}
              <div className="px-4 pb-6">
                <p className="text-[13px] font-medium text-[#6E6E73] mb-3">选择面料</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {defaultFabrics.map(fabric => (
                    <button
                      key={fabric.id}
                      onClick={() => setSelectedFabric(fabric)}
                      className={`p-3 rounded-[16px] cursor-pointer transition-all duration-200 text-left ${
                        selectedFabric?.id === fabric.id
                          ? 'border border-[#C7C7CC] bg-[#F5F5F7] ring-2 ring-[#0071E3]/30'
                          : 'border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border border-[#E5E5EA] flex-shrink-0"
                          style={{ backgroundColor: fabric.color }}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[14px] text-[#1D1D1F] truncate ${selectedFabric?.id === fabric.id ? 'font-semibold' : 'font-medium'}`}>{fabric.name}</p>
                          <p className="text-[12px] text-[#6E6E73]">
                            {fabric.priceAdd > 0 ? `+¥${fabric.priceAdd.toLocaleString()}` : '标配'}
                          </p>
                        </div>
                        {selectedFabric?.id === fabric.id && (
                          <i className="ri-check-line text-[14px] text-[#0071E3] flex-shrink-0"></i>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 底部操作区域 */}
            <div className="flex-shrink-0 px-4 py-3 border-t border-[#E5E5EA] bg-white">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] text-[#8E6E73]">合计</span>
                <span className="text-[22px] font-bold text-[#1D1D1F]">
                  ¥{currentTotalPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSpecModal(false)}
                  className="flex-1 py-3 bg-white border border-[#D2D2D7] rounded-full text-[15px] font-medium text-[#1D1D1F] cursor-pointer transition-all duration-150 active:bg-[#F5F5F7] whitespace-nowrap"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmAdd}
                  className="flex-1 py-3 bg-white border border-[#D2D2D7] rounded-full text-[15px] font-medium text-[#1D1D1F] cursor-pointer transition-all duration-150 active:bg-[#F5F5F7] flex items-center justify-center gap-1 whitespace-nowrap"
                >
                  <i className="ri-check-line text-[16px]"></i>
                  确认添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 配置单弹窗 */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowCart(false)}
          ></div>
          <div
            className="relative w-full bg-white rounded-t-[20px] max-h-[70vh] flex flex-col animate-slide-up"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* 拖拽指示条 */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-9 h-1 bg-[#D1D1D6] rounded-full"></div>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5EA]">
              <h3 className="text-[17px] font-semibold text-[#1D1D1F]">配置单</h3>
              <button
                onClick={() => setShowCart(false)}
                className="text-[15px] text-[#1D1D1F] font-medium cursor-pointer whitespace-nowrap"
              >
                完成
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {selectedProducts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-[#F5F5F7] rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-shopping-bag-line text-[32px] text-[#C7C7CC]"></i>
                  </div>
                  <p className="text-[15px] text-[#6E6E73]">暂无配置产品</p>
                  <p className="text-[13px] text-[#C7C7CC] mt-1">请选择商品加入配置单</p>
                </div>
              ) : (
                <div className="divide-y divide-[#E5E5EA]">
                  {selectedProducts.map(item => (
                    <div key={item.categoryId} className="flex items-center gap-3 p-4">
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-16 h-16 rounded-xl object-contain bg-[#F5F5F7]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-[#6E6E73] font-medium">{item.categoryName}</p>
                        <p className="text-[15px] font-medium text-[#1D1F] truncate">{item.productName}</p>
                        <p className="text-[12px] text-[#8E8E93] mt-0.5">{item.specName} · {item.specSize}</p>
                        <p className="text-[15px] font-bold text-[#1D1F] mt-1">¥{item.price.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveProduct(item.categoryId)}
                        className="w-8 h-8 flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-90"
                      >
                        <i className="ri-delete-bin-line text-[20px] text-[#6E6E73]"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedProducts.length > 0 && (
              <div className="p-4 border-t border-[#E5E5EA] bg-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] text-[#8E6E73]">共 {selectedCount} 件商品</span>
                  <span className="text-[18px] font-bold text-[#1D1F]">¥{totalPrice.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => {
                    setShowCart(false);
                    handleSubmit();
                  }}
                  className="w-full py-3.5 bg-white border border-[#D2D2D7] rounded-[14px] text-[17px] font-medium text-[#1D1D1F] cursor-pointer transition-all duration-150 active:bg-[#F5F5F7] whitespace-nowrap"
                >
                  提交采购意向
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 添加成功提示 */}
      {showSuccessToast && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] bg-[#1D1D1F]/80 backdrop-blur-sm text-white px-6 py-4 rounded-2xl flex items-center gap-2 animate-fade-in">
          <i className="ri-checkbox-circle-fill text-[20px] text-[#34C759]"></i>
          <span className="text-[15px]">已加入配置单</span>
        </div>
      )}

      {/* 提交成功弹窗 - iOS Alert风格 */}
      {showSubmitSuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-8">
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="relative bg-white rounded-[20px] w-[280px] overflow-hidden animate-scale-in">
            <div className="pt-8 pb-6 px-6 text-center">
              <div className="w-16 h-16 bg-[#F5F5F7] rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-checkbox-circle-fill text-[40px] text-[#34C759]"></i>
              </div>
              <h3 className="text-[17px] font-semibold text-[#1D1D1F] mb-2">提交成功</h3>
              <p className="text-[13px] text-[#6E6E73]">您的采购意向已提交，我们会尽快与您联系</p>
            </div>
            <button
              onClick={() => {
                setShowSubmitSuccess(false);
                navigate(-1);
              }}
              className="w-full py-4 border-t border-[#E5E5EA] text-[17px] font-medium text-[#1D1D1F] cursor-pointer transition-colors duration-150 active:bg-[#F5F5F7]"
            >
              确定
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
