
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  furnitureProductsExtended, 
  furnitureCategories,
  fabricOptions,
  materialColorOptions 
} from '../../../mocks/aiMaterials';

interface UploadedImage {
  id: string;
  url: string;
  name: string;
}

export default function WhiteBgPage() {
  const navigate = useNavigate();
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearchText, setProductSearchText] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // 新增：产品详情弹窗相关状态
  const [showProductDetail, setShowProductDetail] = useState<any>(null);
  const [selectedSpec, setSelectedSpec] = useState<string>('');
  const [selectedFabric, setSelectedFabric] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  const productCategories = [
    { id: 'all', name: '全部' },
    { id: 'sofa', name: '沙发' },
    { id: 'bed', name: '床具' },
    { id: 'table', name: '桌子' },
    { id: 'chair', name: '椅子' },
    { id: 'cabinet', name: '柜子' },
    { id: 'lamp', name: '灯具' },
  ];

  const filteredProducts = furnitureProductsExtended.filter((p) => {
    const matchCategory = selectedCategoryId === 'all' || p.category === selectedCategoryId;
    const matchSearch = !productSearchText || p.name.includes(productSearchText) || p.sku.includes(productSearchText);
    return matchCategory && matchSearch;
  });

  // 获取当前商品可用的面料
  const getProductFabrics = (product: any) => {
    if (!product || !product.fabrics || product.fabrics.length === 0) return [];
    return fabricOptions.filter(f => product.fabrics.includes(f.id));
  };

  // 获取当前商品可用的材质颜色
  const getProductColors = (product: any) => {
    if (!product || !product.colors || product.colors.length === 0) return [];
    return materialColorOptions.filter(c => product.colors.includes(c.id));
  };

  // 获取选中的摘要文本
  const getSelectionSummary = () => {
    const parts: string[] = [];
    if (selectedSpec) parts.push(selectedSpec);
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

  const handleUploadClick = () => {
    setShowActionSheet(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const timestamp = Date.now();
      const newImages: UploadedImage[] = Array.from(files).map((file, idx) => ({
        id: `${timestamp}-${idx}`,
        url: URL.createObjectURL(file),
        name: file.name,
      }));
      setUploadedImages((prev) => [...prev, ...newImages]);
      setShowActionSheet(false);
    }
    // Reset input
    e.target.value = '';
  };

  const handleSelectProduct = (product: typeof furnitureProductsExtended[0]) => {
    const newImage: UploadedImage = {
      id: Date.now().toString(),
      url: product.image,
      name: product.name,
    };
    setUploadedImages((prev) => [...prev, newImage]);
    setShowProductPicker(false);
    setShowActionSheet(false);
    setProductSearchText('');
    setSelectedCategoryId('all');
  };

  const handleDeleteImage = (id: string) => {
    setUploadedImages(uploadedImages.filter(img => img.id !== id));
  };

  const canGenerate = () => {
    return uploadedImages.length > 0;
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleGenerate = () => {
    if (!canGenerate()) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      showToastMessage('生成成功！');
    }, 2000);
  };

  const handleOpenProductDetail = (product: any) => {
    setShowProductDetail(product);
    setSelectedSpec(product.specs[0]);
    // 设置默认面料和颜色
    const fabrics = getProductFabrics(product);
    const colors = getProductColors(product);
    if (fabrics.length > 0) setSelectedFabric(fabrics[0].id);
    else setSelectedFabric('');
    if (colors.length > 0) setSelectedColor(colors[0].id);
    else setSelectedColor('');
  };

  const handleConfirmProductSelect = () => {
    if (!showProductDetail) return;
    const newImage: UploadedImage = {
      id: Date.now().toString(),
      url: showProductDetail.image,
      name: showProductDetail.name,
    };
    setUploadedImages((prev) => [...prev, newImage]);
    setShowProductDetail(null);
    setShowProductPicker(false);
    setShowActionSheet(false);
    setProductSearchText('');
    setSelectedCategoryId('all');
    setSelectedSpec('');
    setSelectedFabric('');
    setSelectedColor('');
  };

  // 当前商品的面料和颜色
  const currentProductFabrics = showProductDetail ? getProductFabrics(showProductDetail) : [];
  const currentProductColors = showProductDetail ? getProductColors(showProductDetail) : [];
  const hasFabrics = currentProductFabrics.length > 0;
  const hasColors = currentProductColors.length > 0;

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24">
      {/* Toast 提示 */}
      {showToast && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] bg-[#1D1D1F]/80 backdrop-blur-sm text-white px-6 py-3 rounded-2xl text-[14px] animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* 顶部导航栏 - iOS风格 */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="h-11 px-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center cursor-pointer"
          >
            <i className="ri-arrow-left-s-line text-[22px] text-[#1D1D1F]"></i>
          </button>
          <h1 className="text-[17px] font-semibold text-[#1D1D1F]">白底图</h1>
          <div className="w-8"></div>
        </div>
      </nav>

      <div 
        className="px-4 py-4 space-y-3"
        style={{ marginTop: 'calc(44px + env(safe-area-inset-top))' }}
      >
        {/* 上传区 */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold text-[#1D1D1F]">上传照片</h2>
            <span className="text-[12px] text-[#6E6E73]">支持多张上传</span>
          </div>
          
          {/* 已上传图片列表 */}
          {uploadedImages.length > 0 ? (
            <div className="mb-3">
              <div className="grid grid-cols-3 gap-2.5">
                {uploadedImages.map((img) => (
                  <div
                    key={img.id}
                    className="relative aspect-square rounded-xl overflow-hidden bg-[#F5F5F7] group"
                  >
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#1D1D1F]/60 rounded-full flex items-center justify-center text-white cursor-pointer"
                    >
                      <i className="ri-close-line text-[12px]"></i>
                    </button>
                    <button 
                      onClick={() => setPreviewImage(img.url)}
                      className="absolute bottom-1.5 right-1.5 w-6 h-6 bg-[#1D1D1F]/60 rounded-md flex items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <i className="ri-eye-line text-[12px]"></i>
                    </button>
                  </div>
                ))}

                {/* 添加更多按钮 */}
                <button
                  onClick={handleUploadClick}
                  className="aspect-square border-2 border-dashed border-[#D2D2D7] rounded-xl flex flex-col items-center justify-center gap-1.5 bg-[#F5F5F7] active:bg-[#E5E5EA] cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 bg-[#1D1D1F]/10 rounded-full flex items-center justify-center">
                    <i className="ri-add-line text-[18px] text-[#1D1D1F]"></i>
                  </div>
                  <span className="text-[11px] text-[#6E6E73]">继续添加</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleUploadClick}
              className="w-full h-[120px] border-2 border-dashed border-[#D2D2D7] rounded-xl flex flex-col items-center justify-center gap-2 bg-[#F5F5F7] active:bg-[#E5E5EA] cursor-pointer transition-colors mb-3"
            >
              <div className="w-12 h-12 bg-[#1D1D1F]/10 rounded-full flex items-center justify-center">
                <i className="ri-add-line text-[24px] text-[#1D1D1F]"></i>
              </div>
              <span className="text-[13px] text-[#6E6E73]">请上传</span>
            </button>
          )}

          {/* 拍摄建议 */}
          <div className="flex items-start gap-2 bg-[#F5F5F7] rounded-xl p-3">
            <i className="ri-lightbulb-line text-[#1D1D1F] text-[14px] mt-0.5"></i>
            <p className="text-[12px] text-[#6E6E73] leading-relaxed">
              拍摄建议：光线充足、主体完整、避免遮挡
            </p>
          </div>
        </div>

        {/* 数量选择 */}
        <div className="bg-white rounded-2xl p-4">
          <h2 className="text-[15px] font-semibold text-[#1D1D1F] mb-3">生成数量</h2>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <button
                key={num}
                onClick={() => setQuantity(num)}
                className={`h-10 rounded-lg text-[14px] font-medium transition-all cursor-pointer ${
                  quantity === num
                    ? 'bg-[#F5F5F7] text-[#1D1D1F] font-semibold border-2 border-[#0071E3]'
                    : 'bg-white text-[#1D1D1F] border border-[#D2D2D7] active:bg-[#F5F5F7]'
                }`}
              >
                {num}张
              </button>
            ))}
          </div>
        </div>

        {/* 补充描述 */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <i className="ri-edit-line text-[#6E6E73] text-[14px]"></i>
            <h2 className="text-[15px] font-semibold text-[#1D1D1F]">补充描述</h2>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="例如：纯白#FFFFFF / 保留自然阴影 / 颜色保持不变 / 去除背景杂物"
            className="w-full h-24 px-3 py-3 bg-[#F5F5F7] border-none rounded-xl text-[14px] text-[#1D1D1F] placeholder-[#C7C7CC] focus:outline-none focus:ring-1 focus:ring-[#1D1D1F] resize-none"
            maxLength={500}
          />
          <div className="flex justify-end mt-2">
            <span className="text-[12px] text-[#6E6E73]">{description.length}/500</span>
          </div>
        </div>
      </div>

      {/* 底部按钮 */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-[#E5E5EA] p-4"
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={handleGenerate}
          disabled={!canGenerate() || isGenerating}
          className={`w-full h-[50px] rounded-2xl font-semibold text-[16px] transition-all whitespace-nowrap ${
            canGenerate() && !isGenerating
              ? 'bg-white border border-[#D2D2D7] text-[#1D1D1F] cursor-pointer active:bg-[#F5F5F7]'
              : 'bg-[#E5E5EA] text-[#8E8E93] cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <i className="ri-loader-4-line animate-spin"></i>
              生成中...
            </span>
          ) : (
            `立即制作（消耗积分${20 * quantity * Math.max(uploadedImages.length, 1)}）`
          )}
        </button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* ActionSheet - iOS风格 */}
      {showActionSheet && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setShowActionSheet(false)}
          ></div>
          <div 
            className="fixed left-0 right-0 bottom-0 z-50 animate-slide-up"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="mx-3 mb-2">
              <div className="bg-white rounded-xl overflow-hidden">
                <button
                  onClick={() => {
                    cameraInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-[#E5E5EA] cursor-pointer active:bg-[#F5F5F7] transition-colors"
                >
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F5F5F7]">
                    <i className="ri-camera-line text-[18px] text-[#1D1D1F]"></i>
                  </div>
                  <span className="text-[15px] text-[#1D1D1F]">拍摄</span>
                </button>
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-[#E5E5EA] cursor-pointer active:bg-[#F5F5F7] transition-colors"
                >
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F5F5F7]">
                    <i className="ri-image-line text-[18px] text-[#1D1D1F]"></i>
                  </div>
                  <span className="text-[15px] text-[#1D1D1F]">从相册选择</span>
                </button>
                <button
                  onClick={() => {
                    setShowProductPicker(true);
                    setShowActionSheet(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer active:bg-[#F5F5F7] transition-colors"
                >
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F5F5F7]">
                    <i className="ri-store-2-line text-[18px] text-[#1D1D1F]"></i>
                  </div>
                  <span className="text-[15px] text-[#1D1D1F]">从产品选择</span>
                  <i className="ri-arrow-right-s-line text-[18px] text-[#C7C7CC] ml-auto"></i>
                </button>
              </div>
            </div>
            <div className="mx-3 mb-3">
              <button
                onClick={() => setShowActionSheet(false)}
                className="w-full py-3.5 text-center text-[15px] text-[#1D1D1F] font-medium bg-white rounded-xl cursor-pointer active:bg-[#F5F5F7] transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </>
      )}

      {/* 产品选择页面 - 全屏 */}
      {showProductPicker && (
        <div className="fixed inset-0 z-[60] bg-[#F5F5F7] animate-slide-up-full flex flex-col">
          {/* 产品选择导航栏 */}
          <nav 
            className="bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA] flex-shrink-0"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <div className="h-11 px-4 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowProductPicker(false);
                  setProductSearchText('');
                  setSelectedCategoryId('all');
                }}
                className="text-[17px] text-[#1D1D1F] cursor-pointer"
              >
                取消
              </button>
              <h2 className="text-[17px] font-semibold text-[#1D1D1F]">选择产品</h2>
              <div className="w-10"></div>
            </div>
          </nav>

          {/* 搜索栏 */}
          <div className="px-4 pt-3 pb-2 flex-shrink-0">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] text-[16px]"></i>
              <input
                type="text"
                value={productSearchText}
                onChange={(e) => setProductSearchText(e.target.value)}
                placeholder="搜索产品名称或SKU"
                className="w-full h-9 pl-9 pr-3 bg-white rounded-lg text-[14px] text-[#1D1D1F] placeholder-[#C7C7CC] focus:outline-none focus:ring-1 focus:ring-[#1D1D1F] border border-[#E5E5EA]"
              />
              {productSearchText && (
                <button
                  onClick={() => setProductSearchText('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#C7C7CC] rounded-full flex items-center justify-center cursor-pointer"
                >
                  <i className="ri-close-line text-white text-[10px]"></i>
                </button>
              )}
            </div>
          </div>

          {/* 分类筛选 */}
          <div className="px-4 pb-3 flex-shrink-0">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {productCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategoryId === cat.id
                      ? 'bg-[#F5F5F7] text-[#1D1D1F] border border-[#C7C7CC]'
                      : 'bg-white text-[#1D1D1F] border border-[#D2D2D7]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* 产品列表 */}
          <div className="flex-1 overflow-y-auto px-4 pb-8">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <i className="ri-inbox-line text-[48px] text-[#C7C7CC] mb-3"></i>
                <p className="text-[15px] text-[#6E6E73]">暂无匹配产品</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleOpenProductDetail(product)}
                    className="bg-white rounded-xl overflow-hidden text-left cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <div className="w-full aspect-square bg-[#F5F5F7] relative overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover object-top"
                      />
                      <div className="absolute bottom-2 left-2 bg-black/60 px-1.5 py-0.5 rounded">
                        <span className="text-[10px] text-white">{product.sku}</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-[13px] text-[#1D1D1F] font-medium leading-tight line-clamp-2 mb-1.5">
                        {product.name}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[14px] text-[#1D1D1F] font-semibold">
                            ¥{product.price.toLocaleString()}
                          </span>
                          <span className="text-[11px] text-[#C7C7CC] line-through ml-1">
                            ¥{product.originalPrice.toLocaleString()}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#8E8E93]">已售{product.sold}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 产品详情弹窗 - 完整SKU选择 */}
      {showProductDetail && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[70]"
            onClick={() => {
              setShowProductDetail(null);
              setSelectedSpec('');
              setSelectedFabric('');
              setSelectedColor('');
            }}
          ></div>
          <div className="fixed inset-x-0 bottom-0 z-[80] bg-white rounded-t-[20px] max-h-[85vh] overflow-hidden flex flex-col">
            {/* 顶部拖拽条 */}
            <div className="flex items-center justify-center py-2 flex-shrink-0">
              <div className="w-10 h-1 bg-[#C6C6C8] rounded-full"></div>
            </div>

            {/* 可滚动内容区 */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {/* 商品基本信息 */}
              <div className="flex items-start space-x-4 mb-5">
                <img
                  src={showProductDetail.image}
                  alt={showProductDetail.name}
                  className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-medium text-[#1D1D1F] mb-1 line-clamp-2">
                    {showProductDetail.name}
                  </p>
                  <p className="text-[12px] text-[#6E6E73] mb-2">
                    SKU: {showProductDetail.sku}
                  </p>
                  <div className="flex items-baseline">
                    <span className="text-[20px] font-bold text-[#1D1D1F]">
                      ¥{showProductDetail.price.toLocaleString()}
                    </span>
                    <span className="text-[13px] text-[#C7C7CC] line-through ml-2">
                      ¥{showProductDetail.originalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowProductDetail(null);
                    setSelectedSpec('');
                    setSelectedFabric('');
                    setSelectedColor('');
                  }}
                  className="w-8 h-8 bg-[#F5F5F7] rounded-full flex items-center justify-center cursor-pointer flex-shrink-0"
                >
                  <i className="ri-close-line text-[18px] text-[#8E8E93]"></i>
                </button>
              </div>

              {/* 选择规格 */}
              <div className="mb-5">
                <h5 className="text-[14px] font-medium text-[#1D1D1F] mb-3">选择规格</h5>
                <div className="flex flex-wrap gap-2">
                  {showProductDetail.specs.map((spec: string) => (
                    <button
                      key={spec}
                      onClick={() => setSelectedSpec(spec)}
                      className={`px-4 py-2.5 rounded-xl text-[14px] transition-all cursor-pointer active:scale-[0.98] ${
                        selectedSpec === spec
                          ? 'bg-[#1D1D1F] border-[#1D1D1F] text-white'
                          : 'bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5EA]'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              {/* 选择面料 */}
              {hasFabrics && (
                <div className="mb-5">
                  <h5 className="text-[14px] font-medium text-[#1D1D1F] mb-3">选择面料</h5>
                  <div className="flex flex-wrap gap-2">
                    {currentProductFabrics.map((fabric) => {
                      const isSelected = selectedFabric === fabric.id;
                      return (
                        <button
                          key={fabric.id}
                          onClick={() => setSelectedFabric(fabric.id)}
                          className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl border transition-all cursor-pointer active:scale-[0.98] ${
                            isSelected
                              ? 'bg-[#1D1D1F] border-[#1D1D1F] text-white'
                              : 'bg-[#F5F5F7] border-[#E5E5EA] text-[#1D1D1F] hover:bg-[#E5E5EA]'
                          }`}
                        >
                          <span className="text-[14px] font-medium">{fabric.name}</span>
                          {fabric.tag && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-[#F5F5F7] text-[#8E8E93]'
                            }`}>
                              {fabric.tag}
                            </span>
                          )}
                          {fabric.priceAdd > 0 && (
                            <span className={`text-[11px] ${
                              isSelected ? 'text-white/60' : 'text-[#8E8E93]'
                            }`}>
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
                  <h5 className="text-[14px] font-medium text-[#1D1D1F] mb-1">
                    材质颜色
                    {selectedColor && (
                      <span className="text-[12px] text-[#8E8E93] font-normal ml-2">
                        已选：{materialColorOptions.find(c => c.id === selectedColor)?.name}
                      </span>
                    )}
                  </h5>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {currentProductColors.map((color) => {
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

              {/* 库存信息 */}
              <div className="flex items-center justify-between text-[13px] text-[#6E6E73] mb-4">
                <span>库存: {showProductDetail.stock} 件</span>
                <span>已售: {showProductDetail.sold} 件</span>
              </div>

              {/* 已选配置摘要 */}
              {(selectedSpec || selectedFabric || selectedColor) && (
                <div className="p-3 bg-[#F5F5F7] rounded-xl mb-4">
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

            {/* 确认按钮 - 固定在底部 */}
            <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-[#E5E5EA] bg-white">
              <button
                onClick={handleConfirmProductSelect}
                className="w-full py-3.5 rounded-2xl text-[16px] font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] bg-white border border-[#D2D2D7] text-[#1D1D1F] active:bg-[#F5F5F7]"
              >
                确认选择
              </button>
            </div>
            <div style={{ height: 'env(safe-area-inset-bottom)' }}></div>
          </div>
        </>
      )}

      {/* 图片预览弹窗 */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[70] bg-black flex items-center justify-center animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          {/* 关闭按钮 */}
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white cursor-pointer z-10 active:bg-white/30 transition-colors"
            style={{ marginTop: 'env(safe-area-inset-top)' }}
          >
            <i className="ri-close-line text-[24px]"></i>
          </button>
          
          {/* 图片 */}
          <img
            src={previewImage}
            alt="预览图片"
            className="max-w-full max-h-full object-contain p-4"
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* 底部提示 */}
          <div 
            className="absolute bottom-8 left-0 right-0 text-center"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <span className="text-white/60 text-[14px]">点击任意位置关闭</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes slide-up-full {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .animate-slide-up-full {
          animation: slide-up-full 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        }
      `}</style>
    </div>
  );
}
