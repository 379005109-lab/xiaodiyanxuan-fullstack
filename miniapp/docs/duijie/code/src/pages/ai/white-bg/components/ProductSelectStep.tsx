import { useState } from 'react';
import { furnitureProductsExtended, furnitureCategories, fabricOptions, materialColorOptions } from '../../../../mocks/aiMaterials';
import type { SelectedProduct } from '../page';

interface ProductSelectStepProps {
  selectedProduct: SelectedProduct | null;
  setSelectedProduct: (product: SelectedProduct | null) => void;
}

export default function ProductSelectStep({
  selectedProduct,
  setSelectedProduct,
}: ProductSelectStepProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [showSpecPicker, setShowSpecPicker] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<
    typeof furnitureProductsExtended[0] | null
  >(null);
  const [selectedSpec, setSelectedSpec] = useState('');
  const [selectedFabric, setSelectedFabric] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  const filteredProducts = furnitureProductsExtended.filter((p) => {
    const matchCategory =
      activeCategory === 'all' || p.category === activeCategory;
    const matchSearch =
      searchText === '' ||
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchText.toLowerCase());
    return matchCategory && matchSearch;
  });

  // 获取产品的面料和颜色选项
  const getProductFabrics = (product: typeof furnitureProductsExtended[0]) => {
    if (!product?.fabrics?.length) return [];
    return fabricOptions.filter((f) => product.fabrics.includes(f.id));
  };

  const getProductColors = (product: typeof furnitureProductsExtended[0]) => {
    if (!product?.colors?.length) return [];
    return materialColorOptions.filter((c) => product.colors.includes(c.id));
  };

  const currentFabrics = pendingProduct ? getProductFabrics(pendingProduct) : [];
  const currentColors = pendingProduct ? getProductColors(pendingProduct) : [];

  // 获取已选配置摘要
  const getSelectionSummary = () => {
    const parts: string[] = [];
    if (selectedSpec) parts.push(selectedSpec);
    if (selectedFabric) {
      const fabric = fabricOptions.find((f) => f.id === selectedFabric);
      if (fabric) parts.push(fabric.name);
    }
    if (selectedColor) {
      const color = materialColorOptions.find((c) => c.id === selectedColor);
      if (color) parts.push(color.name);
    }
    return parts.join(' · ');
  };

  const handleProductClick = (product: typeof furnitureProductsExtended[0]) => {
    setPendingProduct(product);
    const firstSpec = Array.isArray(product.specs) && product.specs.length > 0 ? product.specs[0] : '';
    setSelectedSpec(firstSpec);
    
    // 初始化面料和颜色
    const fabrics = getProductFabrics(product);
    const colors = getProductColors(product);
    setSelectedFabric(fabrics.length > 0 ? fabrics[0].id : '');
    setSelectedColor(colors.length > 0 ? colors[0].id : '');
    
    setShowSpecPicker(true);
  };

  const handleConfirmSelect = () => {
    try {
      if (pendingProduct) {
        setSelectedProduct({
          id: pendingProduct.id,
          name: pendingProduct.name,
          image: pendingProduct.image,
          sku: pendingProduct.sku,
          price: pendingProduct.price,
          spec: selectedSpec,
        });
        setShowSpecPicker(false);
        setPendingProduct(null);
        setSelectedSpec('');
        setSelectedFabric('');
        setSelectedColor('');
      }
    } catch (error) {
      console.error('Failed to confirm product selection:', error);
    }
  };

  return (
    <div>
      {/* 已选商品展示 */}
      {selectedProduct && (
        <div className="bg-white rounded-[16px] p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[15px] text-[#1C1C1E] font-medium">已选商品</span>
            <button
              onClick={() => setSelectedProduct(null)}
              className="text-[13px] text-[#FF9500] cursor-pointer whitespace-nowrap"
            >
              重新选择
            </button>
          </div>
          <div className="flex items-center gap-3 bg-[#F9F9F9] rounded-[12px] p-3">
            <div className="w-16 h-16 rounded-[8px] overflow-hidden bg-[#F2F2F7] flex-shrink-0">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] text-[#1C1C1E] font-medium truncate">
                {selectedProduct.name}
              </p>
              <p className="text-[12px] text-[#8E8E93] mt-0.5">
                SKU: {selectedProduct.sku}
              </p>
              {selectedProduct.spec && (
                <p className="text-[12px] text-[#8E8E93]">
                  规格: {selectedProduct.spec}
                </p>
              )}
              <p className="text-[14px] text-[#FF9500] font-semibold mt-1">
                &yen;{selectedProduct.price.toLocaleString()}
              </p>
            </div>
            <div className="w-6 h-6 bg-[#34C759] rounded-full flex items-center justify-center flex-shrink-0">
              <i className="ri-check-line text-white text-[14px]"></i>
            </div>
          </div>
        </div>
      )}

      {/* 搜索栏 */}
      <div className="bg-white rounded-[12px] px-3 py-2.5 mb-3 flex items-center gap-2.5">
        <i className="ri-search-line text-[18px] text-[#8E8E93]"></i>
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="搜索商品名称或SKU编号"
          className="flex-1 text-[14px] text-[#1C1C1E] placeholder-[#C6C6C8] outline-none bg-transparent"
        />
        {searchText && (
          <button
            onClick={() => setSearchText('')}
            className="w-5 h-5 flex items-center justify-center cursor-pointer"
          >
            <i className="ri-close-circle-fill text-[#C6C6C8] text-[16px]"></i>
          </button>
        )}
      </div>

      {/* 分类筛选 */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
        {furnitureCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer text-[13px] font-medium ${
              activeCategory === cat.id
                ? 'bg-[#FF9500] text-white'
                : 'bg-white text-[#1C1C1E] hover:bg-[#F2F2F7]'
            }`}
          >
            <i className={`${cat.icon} text-[13px]`}></i>
            {cat.name}
          </button>
        ))}
      </div>

      {/* 商品列表 */}
      <div className="grid grid-cols-2 gap-2.5">
        {filteredProducts.map((product) => {
          const isSelected = selectedProduct?.id === product.id;
          return (
            <div
              key={product.id}
              onClick={() => handleProductClick(product)}
              className={`bg-white rounded-[12px] overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-[#FF9500]' : ''
              }`}
            >
              <div className="relative aspect-square bg-[#F2F2F7]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-[#FF9500] rounded-full flex items-center justify-center">
                    <i className="ri-check-line text-white text-[12px]"></i>
                  </div>
                )}
                {product.originalPrice > product.price && (
                  <div className="absolute top-2 left-2 bg-[#FF3B30] px-1.5 py-0.5 rounded">
                    <span className="text-[10px] text-white font-medium">
                      {Math.round(
                        (1 - product.price / product.originalPrice) * 100,
                      )}
                      %OFF
                    </span>
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-[13px] text-[#1C1C1E] font-medium line-clamp-1 mb-1">
                  {product.name}
                </p>
                <p className="text-[11px] text-[#8E8E93] mb-1.5">
                  SKU: {product.sku}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[15px] text-[#FF9500] font-semibold">
                    &yen;{product.price.toLocaleString()}
                  </span>
                  {product.originalPrice > product.price && (
                    <span className="text-[11px] text-[#C6C6C8] line-through">
                      &yen;{product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-[#8E8E93]">
                    库存 {product.stock}
                  </span>
                  <span className="text-[10px] text-[#8E8E93]">
                    已售 {product.sold}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 空状态 */}
      {filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <i className="ri-search-line text-[48px] text-[#C6C6C8] mb-3"></i>
          <p className="text-[14px] text-[#8E8E93]">未找到匹配的商品</p>
          <button
            onClick={() => {
              setSearchText('');
              setActiveCategory('all');
            }}
            className="mt-3 text-[14px] text-[#FF9500] cursor-pointer whitespace-nowrap"
          >
            清除筛选条件
          </button>
        </div>
      )}

      {/* SKU配置选择弹窗 */}
      {showSpecPicker && pendingProduct && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-50"
            onClick={() => setShowSpecPicker(false)}
          ></div>

          {/* 底部弹窗 */}
          <div className="fixed left-0 right-0 bottom-0 z-50 bg-white rounded-t-[20px] max-h-[85vh] flex flex-col animate-slide-up">
            <div className="flex justify-center pt-2 pb-3 flex-shrink-0">
              <div className="w-9 h-1 bg-[#E5E5EA] rounded-full"></div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4">
              {/* 商品信息 */}
              <div className="flex gap-3 mb-5">
                <div className="w-20 h-20 rounded-[10px] overflow-hidden bg-[#F2F2F7] flex-shrink-0">
                  <img
                    src={pendingProduct.image}
                    alt={pendingProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] text-[#1C1C1E] font-medium line-clamp-2">
                    {pendingProduct.name}
                  </p>
                  <p className="text-[12px] text-[#8E8E93] mt-1">
                    SKU: {pendingProduct.sku}
                  </p>
                  <p className="text-[17px] text-[#FF9500] font-semibold mt-1">
                    &yen;{pendingProduct.price.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* 选择规格 */}
              <div className="mb-5">
                <p className="text-[14px] text-[#1C1C1E] font-medium mb-3">
                  选择规格
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(pendingProduct.specs) &&
                    pendingProduct.specs.length > 0 ? (
                    pendingProduct.specs.map((spec) => (
                      <button
                        key={spec}
                        onClick={() => setSelectedSpec(spec)}
                        className={`relative px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap border ${
                          selectedSpec === spec
                            ? 'bg-[#FFF8F0] border-[#FF9500] text-[#E08600]'
                            : 'bg-[#F2F2F7] border-transparent text-[#1C1C1E] hover:bg-[#E5E5EA]'
                        }`}
                      >
                        {selectedSpec === spec && (
                          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#FF9500] rounded-full flex items-center justify-center">
                            <i className="ri-check-line text-white text-[10px] font-bold"></i>
                          </span>
                        )}
                        {spec}
                      </button>
                    ))
                  ) : (
                    <span className="text-[12px] text-[#8E8E93]">
                      暂无规格可选
                    </span>
                  )}
                </div>
              </div>

              {/* 选择面料 */}
              {currentFabrics.length > 0 && (
                <div className="mb-5">
                  <p className="text-[14px] text-[#1C1C1E] font-medium mb-3">
                    选择面料
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentFabrics.map((fabric) => {
                      const isSelected = selectedFabric === fabric.id;
                      return (
                        <button
                          key={fabric.id}
                          onClick={() => setSelectedFabric(fabric.id)}
                          className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl border transition-all cursor-pointer active:scale-[0.98] ${
                            isSelected
                              ? 'bg-[#FFF8F0] border-[#FF9500] text-[#E08600]'
                              : 'bg-[#F2F2F7] border-[#E5E5EA] text-[#1C1C1E] hover:bg-[#E5E5EA]'
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#FF9500] rounded-full flex items-center justify-center">
                              <i className="ri-check-line text-white text-[10px] font-bold"></i>
                            </span>
                          )}
                          <span className="text-[13px] font-medium">{fabric.name}</span>
                          {fabric.tag && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                                isSelected ? 'bg-[#FF9500]/10 text-[#E08600]' : 'bg-white text-[#8E8E93]'
                              }`}
                            >
                              {fabric.tag}
                            </span>
                          )}
                          {fabric.priceAdd > 0 && (
                            <span className={`text-[11px] ${isSelected ? 'text-[#E08600]/70' : 'text-[#8E8E93]'}`}>
                              +&yen;{fabric.priceAdd}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 选择材质颜色 */}
              {currentColors.length > 0 && (
                <div className="mb-5">
                  <p className="text-[14px] text-[#1C1C1E] font-medium mb-1">
                    材质颜色
                    {selectedColor && (
                      <span className="text-[12px] text-[#8E8E93] font-normal ml-2">
                        已选：{materialColorOptions.find((c) => c.id === selectedColor)?.name}
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {currentColors.map((color) => {
                      const isSelected = selectedColor === color.id;
                      return (
                        <button
                          key={color.id}
                          onClick={() => setSelectedColor(color.id)}
                          className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-90 transition-transform"
                          title={color.name}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl transition-all duration-200 ${
                              isSelected ? 'ring-2 ring-[#FF9500] ring-offset-2' : 'ring-1 ring-[#E5E5EA]'
                            }`}
                            style={{ backgroundColor: color.color }}
                          />
                          <span className={`text-[11px] ${isSelected ? 'text-[#1C1C1E] font-medium' : 'text-[#8E8E93]'}`}>
                            {color.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 库存信息 */}
              <div className="flex items-center justify-between text-[13px] text-[#8E8E93] mb-4">
                <span>库存: {pendingProduct.stock} 件</span>
                <span>已售: {pendingProduct.sold} 件</span>
              </div>

              {/* 已选配置摘要 */}
              {(selectedSpec || selectedFabric || selectedColor) && (
                <div className="p-3 bg-[#F9F9F9] rounded-xl mb-4">
                  <div className="flex items-start gap-2">
                    <i className="ri-checkbox-circle-line text-[16px] text-[#FF9500] mt-0.5"></i>
                    <div className="flex-1">
                      <p className="text-[12px] text-[#8E8E93] mb-1">已选配置</p>
                      <p className="text-[13px] text-[#1C1C1E] font-medium leading-relaxed">
                        {getSelectionSummary()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 确认按钮 */}
            <div className="flex-shrink-0 px-4 pb-4 pt-3 border-t border-[#E5E5EA]" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
              <button
                onClick={handleConfirmSelect}
                className="w-full h-12 bg-white border border-[#D2D2D7] text-[#1D1D1F] rounded-2xl text-[16px] font-semibold cursor-pointer active:bg-[#F5F5F7] transition-colors whitespace-nowrap active:scale-[0.98]"
              >
                确认选择
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
