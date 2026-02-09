import { useState, useEffect } from 'react';
import { furnitureProductsExtended, fabricOptions, materialColorOptions } from '../../../mocks/aiMaterials';

interface UseInProductDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMaterials: string[];
  materialImages: { id: string; image: string }[];
}

export default function UseInProductDrawer({
  isOpen,
  onClose,
  selectedMaterials,
  materialImages
}: UseInProductDrawerProps) {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [selectedFabric, setSelectedFabric] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [usageType, setUsageType] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mainImageIndex, setMainImageIndex] = useState(0);

  const filteredProducts = furnitureProductsExtended.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const usageTypes = [
    { id: 'main', name: 'SKU主图', icon: 'ri-image-line', limit: 1 },
    { id: 'carousel', name: '轮播图', icon: 'ri-gallery-line', limit: 999 },
    { id: 'detail', name: '详情图', icon: 'ri-file-list-line', limit: 999 },
    { id: 'scene', name: 'AI场景图', icon: 'ri-landscape-line', limit: 999 }
  ];

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSearchQuery('');
      setSelectedProduct(null);
      setSelectedSpecs([]);
      setSelectedFabric('');
      setSelectedColor('');
      setUsageType('');
      setMainImageIndex(0);
    }
  }, [isOpen]);

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setSelectedSpecs([]);
    setSelectedFabric('');
    setSelectedColor('');
    setStep(2);
  };

  const handleSpecToggle = (spec: string) => {
    setSelectedSpecs(prev =>
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  const handleNext = () => {
    if (step === 2 && selectedSpecs.length > 0) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedProduct(null);
      setSelectedSpecs([]);
      setSelectedFabric('');
      setSelectedColor('');
    } else if (step === 3) {
      setStep(2);
      setUsageType('');
      setMainImageIndex(0);
    }
  };

  const handleSubmit = async () => {
    if (usageType === 'main' && selectedMaterials.length > 1) {
      return;
    }
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2000);
  };

  const canSubmit = selectedSpecs.length > 0 && usageType !== '';

  // 获取当前商品可用的面料
  const getProductFabrics = () => {
    if (!selectedProduct || !selectedProduct.fabrics || selectedProduct.fabrics.length === 0) return [];
    return fabricOptions.filter(f => selectedProduct.fabrics.includes(f.id));
  };

  // 获取当前商品可用的材质颜色
  const getProductColors = () => {
    if (!selectedProduct || !selectedProduct.colors || selectedProduct.colors.length === 0) return [];
    return materialColorOptions.filter(c => selectedProduct.colors.includes(c.id));
  };

  const productFabrics = selectedProduct ? getProductFabrics() : [];
  const productColors = selectedProduct ? getProductColors() : [];
  const hasFabrics = productFabrics.length > 0;
  const hasColors = productColors.length > 0;

  // 获取选中的摘要文本
  const getSelectionSummary = () => {
    const parts: string[] = [];
    if (selectedSpecs.length > 0) parts.push(selectedSpecs.join('、'));
    if (selectedFabric) {
      const fabric = fabricOptions.find(f => f.id === selectedFabric);
      if (fabric) parts.push(fabric.name);
    }
    if (selectedColor) {
      const color = materialColorOptions.find(c => c.id === selectedColor);
      if (color) parts.push(color.name);
    }
    return parts.join(' · ');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 遮罩 */}
      <div
        className="fixed inset-0 bg-black/40 z-[100] animate-fade-in"
        onClick={onClose}
      />

      {/* 成功提示 */}
      {showSuccess && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[120] bg-black/75 text-white px-6 py-4 rounded-xl text-[14px] animate-scale-in">
          <div className="flex items-center gap-3">
            <i className="ri-checkbox-circle-fill text-[24px] text-green-400"></i>
            <div>
              <div className="font-medium mb-1">已添加到：{selectedProduct?.name}</div>
              <div className="text-[12px] text-white/70">
                {getSelectionSummary()} · {usageTypes.find(t => t.id === usageType)?.name}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 抽屉 */}
      <div className="fixed inset-x-0 bottom-0 z-[110] bg-white rounded-t-[20px] max-h-[85vh] flex flex-col animate-slide-up">
        {/* 顶部拖拽条 */}
        <div className="flex items-center justify-center py-2">
          <div className="w-10 h-1 bg-[#C6C6C8] rounded-full"></div>
        </div>

        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5EA]">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-[15px] text-[#1D1D1F] cursor-pointer whitespace-nowrap"
            >
              <i className="ri-arrow-left-line text-[18px]"></i>
              返回
            </button>
          ) : (
            <div className="w-12"></div>
          )}
          <h3 className="text-[17px] font-semibold text-[#1D1D1F]">
            {step === 1 && '选择商品'}
            {step === 2 && '选择SKU'}
            {step === 3 && '选择用途'}
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center cursor-pointer"
          >
            <i className="ri-close-line text-[22px] text-[#6E6E73]"></i>
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto">
          {/* Step 1: 选择商品 */}
          {step === 1 && (
            <div className="p-4">
              <div className="relative mb-4">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#6E6E73]"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索商品名称/编码"
                  className="w-full h-11 pl-10 pr-4 bg-[#F5F5F7] rounded-xl text-[15px] text-[#1D1D1F] placeholder-[#C6C6C8] border-none outline-none"
                />
              </div>
              <div className="space-y-3">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className="w-full flex items-center gap-3 p-3 bg-white border border-[#E5E5EA] rounded-xl cursor-pointer hover:bg-[#F5F5F7] transition-all active:scale-[0.985]"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-16 h-16 rounded-lg object-cover bg-[#F5F5F7]"
                    />
                    <div className="flex-1 text-left">
                      <h4 className="text-[15px] font-medium text-[#1D1D1F] mb-1 line-clamp-1">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[12px] text-[#6E6E73]">
                        <span>编码: {product.sku}</span>
                        <span className="w-1 h-1 rounded-full bg-[#C6C6C8]"></span>
                        <span className="text-green-600">在售</span>
                      </div>
                    </div>
                    <i className="ri-arrow-right-s-line text-[20px] text-[#C6C6C8]"></i>
                  </button>
                ))}
              </div>
              {filteredProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <i className="ri-search-line text-[48px] text-[#C6C6C8] mb-3"></i>
                  <p className="text-[14px] text-[#6E6E73]">未找到相关商品</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: 选择SKU（规格 + 面料 + 材质颜色） */}
          {step === 2 && selectedProduct && (
            <div className="p-4">
              {/* 商品信息 */}
              <div className="flex items-center gap-3 p-3 bg-[#F5F5F7] rounded-xl mb-5">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-14 h-14 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h4 className="text-[14px] font-medium text-[#1D1D1F] mb-1 line-clamp-1">
                    {selectedProduct.name}
                  </h4>
                  <p className="text-[12px] text-[#6E6E73]">编码: {selectedProduct.sku}</p>
                </div>
              </div>

              {/* 选择规格 */}
              <div className="mb-5">
                <h5 className="text-[14px] font-medium text-[#1D1D1F] mb-3">选择规格（可多选）</h5>
                <div className="space-y-2">
                  {selectedProduct.specs.map((spec: string, idx: number) => {
                    const isSelected = selectedSpecs.includes(spec);
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSpecToggle(spec)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer active:scale-[0.985] ${
                          isSelected
                            ? 'bg-[#F5F5F7] border-[#1D1D1F]'
                            : 'bg-white border-[#E5E5EA] hover:bg-[#F5F5F7]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected ? 'bg-[#1D1D1F] border-[#1D1D1F]' : 'border-[#C6C6C8]'
                          }`}>
                            {isSelected && (
                              <i className="ri-check-line text-white text-[12px]"></i>
                            )}
                          </div>
                          <span className="text-[15px] font-medium text-[#1D1D1F]">
                            {spec}
                          </span>
                        </div>
                        <span className="text-[13px] text-[#6E6E73]">
                          库存 {selectedProduct.stock}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 选择面料 */}
              {hasFabrics && (
                <div className="mb-5">
                  <h5 className="text-[14px] font-medium text-[#1D1D1F] mb-3">选择面料</h5>
                  <div className="flex flex-wrap gap-2">
                    {productFabrics.map((fabric) => {
                      const isSelected = selectedFabric === fabric.id;
                      return (
                        <button
                          key={fabric.id}
                          onClick={() => setSelectedFabric(isSelected ? '' : fabric.id)}
                          className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl border transition-all cursor-pointer active:scale-[0.985] ${
                            isSelected
                              ? 'bg-[#F5F5F7] border-[#1D1D1F] text-[#1D1D1F]'
                              : 'bg-white border-[#E5E5EA] text-[#1D1D1F] hover:bg-[#F5F5F7]'
                          }`}
                        >
                          <span className="text-[14px] font-medium">{fabric.name}</span>
                          {fabric.tag && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                              isSelected
                                ? 'bg-[#1D1D1F] text-white'
                                : 'bg-[#F5F5F7] text-[#8E8E93]'
                            }`}>
                              {fabric.tag}
                            </span>
                          )}
                          {fabric.priceAdd > 0 && (
                            <span className="text-[11px] text-[#8E8E93]">
                              +¥{fabric.priceAdd}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 选择材质颜色 */}
              {hasColors && (
                <div className="mb-5">
                  <h5 className="text-[14px] font-medium text-[#1D1D1F] mb-3">
                    材质颜色
                    {selectedColor && (
                      <span className="text-[12px] text-[#8E8E93] font-normal ml-2">
                        已选：{materialColorOptions.find(c => c.id === selectedColor)?.name}
                      </span>
                    )}
                  </h5>
                  <div className="flex flex-wrap gap-3">
                    {productColors.map((color) => {
                      const isSelected = selectedColor === color.id;
                      return (
                        <button
                          key={color.id}
                          onClick={() => setSelectedColor(isSelected ? '' : color.id)}
                          className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-90 transition-transform"
                          title={color.name}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl transition-all duration-200 ${
                              isSelected
                                ? 'ring-2 ring-[#1D1D1F] ring-offset-2'
                                : 'ring-1 ring-[#E5E5EA]'
                            }`}
                            style={{ backgroundColor: color.color }}
                          />
                          <span className={`text-[11px] ${
                            isSelected ? 'text-[#1D1D1F] font-medium' : 'text-[#8E8E93]'
                          }`}>
                            {color.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 已选摘要 */}
              {(selectedSpecs.length > 0 || selectedFabric || selectedColor) && (
                <div className="p-3 bg-[#F5F5F7] rounded-xl">
                  <div className="flex items-start gap-2">
                    <i className="ri-checkbox-circle-line text-[16px] text-[#1D1D1F] mt-0.5"></i>
                    <div className="flex-1">
                      <p className="text-[12px] text-[#6E6E73] mb-1">已选配置</p>
                      <p className="text-[13px] text-[#1D1D1F] font-medium leading-relaxed">
                        {getSelectionSummary()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: 选择用途 */}
          {step === 3 && (
            <div className="p-4">
              {/* 素材预览 */}
              <div className="mb-4">
                <h5 className="text-[13px] text-[#6E6E73] mb-3">
                  已选择 {selectedMaterials.length} 张素材
                </h5>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {materialImages.map((material, idx) => (
                    <div
                      key={material.id}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden ${
                        usageType === 'main' && idx === mainImageIndex ? 'ring-2 ring-[#1D1D1F]' : ''
                      }`}
                    >
                      <img
                        src={material.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {usageType === 'main' && idx === mainImageIndex && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-[10px] text-white font-medium bg-[#1D1D1F] px-2 py-0.5 rounded-full whitespace-nowrap">
                            主图
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 已选配置摘要 */}
              <div className="mb-4 p-3 bg-[#F5F5F7] rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <img
                    src={selectedProduct?.image}
                    alt=""
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                  <span className="text-[13px] font-medium text-[#1D1D1F] line-clamp-1">{selectedProduct?.name}</span>
                </div>
                <p className="text-[12px] text-[#6E6E73] ml-10">{getSelectionSummary()}</p>
              </div>

              {/* 用途选择 */}
              <div className="mb-4">
                <h5 className="text-[13px] text-[#6E6E73] mb-3">选择用途</h5>
                <div className="space-y-2">
                  {usageTypes.map(type => {
                    const isSelected = usageType === type.id;
                    const isDisabled = type.limit === 1 && selectedMaterials.length > 1;
                    return (
                      <button
                        key={type.id}
                        onClick={() => !isDisabled && setUsageType(type.id)}
                        disabled={isDisabled}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isDisabled
                            ? 'bg-[#F5F5F7] border-[#E5E5EA] opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'bg-[#F5F5F7] border-[#1D1D1F] cursor-pointer active:scale-[0.985]'
                            : 'bg-white border-[#E5E5EA] cursor-pointer hover:bg-[#F5F5F7] active:scale-[0.985]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                            isSelected ? 'bg-[#1D1D1F]' : 'bg-[#F5F5F7]'
                          }`}>
                            <i className={`${type.icon} text-[18px] ${
                              isSelected ? 'text-white' : 'text-[#6E6E73]'
                            }`}></i>
                          </div>
                          <div className="text-left">
                            <div className="text-[15px] font-medium text-[#1D1D1F]">
                              {type.name}
                            </div>
                            {isDisabled && (
                              <div className="text-[11px] text-[#6E6E73] mt-0.5">
                                仅支持1张素材
                              </div>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <i className="ri-check-line text-[20px] text-[#1D1D1F]"></i>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {usageType === 'main' && selectedMaterials.length === 1 && (
                <div className="flex items-start gap-2 p-3 bg-[#FFF8E1] rounded-xl">
                  <i className="ri-information-line text-[16px] text-[#F59E0B] mt-0.5"></i>
                  <p className="text-[12px] text-[#92400E] leading-relaxed">
                    该素材将作为SKU主图显示在商品列表和详情页
                  </p>
                </div>
              )}

              {usageType && usageType !== 'main' && selectedMaterials.length > 1 && (
                <div className="flex items-start gap-2 p-3 bg-[#FFF8E1] rounded-xl">
                  <i className="ri-information-line text-[16px] text-[#F59E0B] mt-0.5"></i>
                  <p className="text-[12px] text-[#92400E] leading-relaxed">
                    素材将按当前顺序添加，第一张为默认展示图
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-[#E5E5EA] bg-white">
          {step === 2 && (
            <button
              onClick={handleNext}
              disabled={selectedSpecs.length === 0}
              className="w-full h-12 bg-white border border-[#D2D2D7] text-[#1D1D1F] rounded-[16px] font-medium hover:bg-[#F5F5F7] active:bg-[#F5F5F7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              下一步
            </button>
          )}
          {step === 3 && (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className={`w-full h-12 rounded-[16px] text-[16px] font-medium transition-all whitespace-nowrap ${
                canSubmit && !isSubmitting
                  ? 'bg-[#1D1D1F] text-white cursor-pointer active:scale-[0.985] active:translate-y-[2px]'
                  : 'bg-[#F5F5F7] text-[#C6C6C8] cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="ri-loader-4-line animate-spin"></i>
                  提交中...
                </span>
              ) : (
                '确认使用'
              )}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </>
  );
}
