import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  sceneStyleCards,
  furnitureCategories,
  furnitureProductsExtended,
  userCredits,
  fabricOptions,
  materialColorOptions,
} from '../../../mocks/aiMaterials';

export default function GenerateScenePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 'generating' | 'result'>(1);

  // 步骤1：上传图片
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState(true);

  // 步骤2：选择风格
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [styleFilter, setStyleFilter] = useState<string>('all');
  const [spaceFilter, setSpaceFilter] = useState<string>('all');

  // 步骤3：选择家具
  const [selectedFurniture, setSelectedFurniture] = useState<any[]>([]);
  const [furnitureCategory, setFurnitureCategory] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [showFurnitureDetail, setShowFurnitureDetail] = useState<any>(null);
  const [selectedSpec, setSelectedSpec] = useState<string>('');
  const [selectedFabric, setSelectedFabric] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [uploadedFurnitureImages, setUploadedFurnitureImages] = useState<string[]>([]);

  // 描述和生成
  const [description, setDescription] = useState<string>('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  // 风格筛选
  const styleTypes = [
    'all',
    '现代简约',
    '北欧风格',
    '新中式',
    '轻奢风',
    '工业风',
    '日式',
  ];
  const spaceTypes = ['all', '客厅', '卧室', '餐厅', '书房'];

  const filteredStyles = useMemo(() => {
    return sceneStyleCards.filter((card) => {
      const matchStyle = styleFilter === 'all' || card.style === styleFilter;
      const matchSpace = spaceFilter === 'all' || card.space === spaceFilter;
      return matchStyle && matchSpace;
    });
  }, [styleFilter, spaceFilter]);

  // 家具筛选
  const filteredFurniture = useMemo(() => {
    return furnitureProductsExtended.filter((item) => {
      const matchCategory =
        furnitureCategory === 'all' || item.category === furnitureCategory;
      const matchKeyword =
        !searchKeyword ||
        item.name.includes(searchKeyword) ||
        item.sku.includes(searchKeyword);
      return matchCategory && matchKeyword;
    });
  }, [furnitureCategory, searchKeyword]);

  // 自动生成描述
  useEffect(() => {
    if (step === 3) {
      const styleCard = sceneStyleCards.find((s) => s.id === selectedStyle);
      const furnitureNames = selectedFurniture.map((f) => f.name).join('、');
      const uploadedCount = uploadedFurnitureImages.length;

      let desc = '';
      if (styleCard) {
        desc += `${styleCard.style}风格的${styleCard.space}场景`;
      }
      if (furnitureNames) {
        desc += `，搭配${furnitureNames}`;
      }
      if (uploadedCount > 0) {
        desc += `，以及${uploadedCount}件自定义家具`;
      }
      desc +=
        '，营造温馨舒适的家居氛围，自然光线充足，空间布局合理。';

      setDescription(desc);
    }
  }, [step, selectedStyle, selectedFurniture, uploadedFurnitureImages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFurnitureImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedFurnitureImages((prev) => [
          ...prev,
          event.target?.result as string,
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

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

  const handleSelectFurniture = (product: any) => {
    const exists = selectedFurniture.some((f) => f.id === product.id);
    if (exists) {
      setSelectedFurniture((prev) =>
        prev.filter((f) => f.id !== product.id),
      );
    } else {
      setSelectedFurniture((prev) => [
        ...prev,
        { 
          ...product, 
          selectedSpec: selectedSpec || product.specs[0],
          selectedFabric: selectedFabric,
          selectedColor: selectedColor,
          selectionSummary: getSelectionSummary() || product.specs[0]
        },
      ]);
    }
    setShowFurnitureDetail(null);
    setSelectedSpec('');
    setSelectedFabric('');
    setSelectedColor('');
  };

  const handleOpenFurnitureDetail = (product: any) => {
    setShowFurnitureDetail(product);
    setSelectedSpec(product.specs[0]);
    // 设置默认面料和颜色
    const fabrics = getProductFabrics(product);
    const colors = getProductColors(product);
    if (fabrics.length > 0) setSelectedFabric(fabrics[0].id);
    else setSelectedFabric('');
    if (colors.length > 0) setSelectedColor(colors[0].id);
    else setSelectedColor('');
  };

  const handleNextStep = () => {
    if (step === 1) {
      setShowUploadModal(false);
      setStep(2);
    } else if (step === 2 && selectedStyle) {
      setStep(3);
    } else if (step === 3) {
      startGeneration();
    }
  };

  const handlePrevStep = () => {
    if (step === 2) {
      setStep(1);
      setShowUploadModal(true);
    } else if (step === 3) {
      setStep(2);
    }
  };

  /** -------------------------------------------------------------
   *  生成图片逻辑
   *  -------------------------------------------------------------
   *
   *  原来的实现把一段非常长的 URL 直接写在模板字符串里，
   *  其中包含 `${...}` 进行变量插值。因为 URL 本身已经用了
   *  `${` 的 URL‑encoded 形式（`$%7B`），导致编译器把
   *  真正想要的 `${Date.now()}` 与前面的字符混在一起，产生
   *  “Expected identifier but found '/'” 的语法错误。
   *
   *  为了保持代码可读且避免同类错误，改为：
   *   1. 先把 `Date.now()` 取出来存入 `timestamp`；
   *   2. 使用普通的模板字符串只在需要插值的地方插入
   *      `timestamp` 与可选的 `styleCard` 信息；
   *   3. 对可能为 `undefined` 的 `styleCard` 做空值保护；
   *   4. 为防止意外的异常加入 `try / catch` 并在出错时
   *      设置一个默认的占位图。
   */
  const startGeneration = () => {
    setStep('generating');
    setProgress(0);

    const timestamp = Date.now();

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);

          // 使用 try / catch 捕获可能的运行时错误
          try {
            const styleCard = sceneStyleCards.find(
              (s) => s.id === selectedStyle,
            );

            // 基础的查询关键字（若不存在则使用 fallback）
            const stylePart = encodeURIComponent(
              styleCard?.style ?? 'modern',
            );
            const spacePart = encodeURIComponent(
              styleCard?.space ?? 'living room',
            );

            const baseUrl = 'https://readdy.ai/api/search-image';
            const commonParams = `query=${stylePart}%20${spacePart}%20interior%20design%20with%20elegant%20furniture%20arrangement%2C%20natural%20lighting%20through%20large%20windows%2C%20professional%20architectural%20photography%20with%20warm%20atmosphere&width=800&height=600&orientation=landscape`;

            const images = [
              `${baseUrl}?${commonParams}&seq=generated-${timestamp}-1`,
              `${baseUrl}?${commonParams}&seq=generated-${timestamp}-2`,
            ];

            setGeneratedImages(images);
            setStep('result');
          } catch (e) {
            console.error('生成图片失败:', e);
            // 回退到一组本地占位图，保证 UI 不会崩溃
            setGeneratedImages([
              'https://via.placeholder.com/800x600?text=Result+1',
              'https://via.placeholder.com/800x600?text=Result+2',
            ]);
            setStep('result');
          }

          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  const costCredits =
    (selectedFurniture.length + uploadedFurnitureImages.length) * 5 + 20;

  // 当前商品的面料和颜色
  const currentProductFabrics = showFurnitureDetail ? getProductFabrics(showFurnitureDetail) : [];
  const currentProductColors = showFurnitureDetail ? getProductColors(showFurnitureDetail) : [];
  const hasFabrics = currentProductFabrics.length > 0;
  const hasColors = currentProductColors.length > 0;

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* 顶部导航栏 - iOS风格 */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="h-11 flex items-center justify-between px-4">
          <button
            onClick={() => {
              if (step === 1 || step === 'generating' || step === 'result') {
                navigate(-1);
              } else {
                handlePrevStep();
              }
            }}
            className="flex items-center cursor-pointer"
          >
            <i className="ri-arrow-left-s-line text-[22px] text-[#1D1D1F]"></i>
          </button>
          <h1 className="text-[17px] font-semibold text-[#1D1D1F]">
            生成场景效果图
          </h1>
          <div className="w-8"></div>
        </div>
      </nav>

      {/* 步骤指示器 */}
      {typeof step === 'number' && (
        <div
          className="fixed left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA]"
          style={{ top: 'calc(44px + env(safe-area-inset-top))' }}
        >
          <div className="flex items-center justify-center py-3 px-4">
            <div className="flex items-center space-x-2">
              {[1, 2, 3].map((s, idx) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-medium transition-all ${
                      step > s
                        ? 'bg-[#0071E3] text-white'
                        : step === s
                        ? 'bg-[#F5F5F7] text-[#1D1D1F] border border-[#1D1D1F]'
                        : 'bg-white text-[#6E6E73] border border-[#D2D2D7]'
                    }`}
                  >
                    {step > s ? <i className="ri-check-line text-[16px] font-bold"></i> : s}
                  </div>
                  <span
                    className={`text-[12px] ml-1.5 ${
                      step >= s
                        ? 'text-[#1D1D1F] font-medium'
                        : 'text-[#6E6E73]'
                    }`}
                  >
                    {s === 1
                      ? '上传图片'
                      : s === 2
                      ? '选择风格'
                      : '选择家具'}
                  </span>
                  {idx < 2 && (
                    <div className={`w-6 h-[1px] mx-2 ${step > s + 1 ? 'bg-[#0071E3]' : 'bg-[#E5E5EA]'}`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 步骤1：上传图片弹窗 */}
      {step === 1 && showUploadModal && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[60]"
            onClick={() => navigate(-1)}
          ></div>
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[70] bg-white rounded-2xl overflow-hidden shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[17px] font-semibold text-[#1D1D1F]">
                  上传您的空间照片
                </h3>
                <button
                  onClick={() => navigate(-1)}
                  className="w-8 h-8 bg-[#F5F5F7] rounded-full flex items-center justify-center cursor-pointer"
                >
                  <i className="ri-close-line text-[18px] text-[#8E8E93]"></i>
                </button>
              </div>

              <p className="text-[14px] text-[#6E6E73] mb-5">
                拍摄或上传您家的照片，AI将基于此生成效果图。也可以跳过此步骤。
              </p>

              {/* 上传区域 */}
              <div className="space-y-3 mb-5">
                {/* 拍照 */}
                <label className="flex items-center p-4 bg-[#F5F5F7] rounded-xl cursor-pointer active:bg-[#E5E5EA] transition-colors">
                  <div className="w-12 h-12 bg-[#1D1D1F] rounded-full flex items-center justify-center mr-4">
                    <i className="ri-camera-line text-[24px] text-white"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-medium text-[#1D1D1F]">
                      拍摄照片
                    </p>
                    <p className="text-[13px] text-[#6E6E73]">
                      使用相机拍摄您的空间
                    </p>
                  </div>
                  <i className="ri-arrow-right-s-line text-[20px] text-[#C7C7CC]"></i>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>

                {/* 从相册选择 */}
                <label className="flex items-center p-4 bg-[#F5F5F7] rounded-xl cursor-pointer active:bg-[#E5E5EA] transition-colors">
                  <div className="w-12 h-12 bg-[#6E6E73] rounded-full flex items-center justify-center mr-4">
                    <i className="ri-image-line text-[24px] text-white"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-medium text-[#1D1D1F]">
                      从相册选择
                    </p>
                    <p className="text-[13px] text-[#6E6E73]">
                      选择已有的空间照片
                    </p>
                  </div>
                  <i className="ri-arrow-right-s-line text-[20px] text-[#C7C7CC]"></i>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>

              {/* 已上传的图片预览 */}
              {uploadedImage && (
                <div className="mb-5">
                  <p className="text-[13px] text-[#6E6E73] mb-2">
                    已选择的图片
                  </p>
                  <div className="relative rounded-xl overflow-hidden">
                    <img
                      src={uploadedImage}
                      alt="上传的图片"
                      className="w-full h-48 object-cover"
                    />
                    <button
                      onClick={() => setUploadedImage('')}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center cursor-pointer"
                    >
                      <i className="ri-close-line text-[16px] text-white"></i>
                    </button>
                  </div>
                </div>
              )}

              {/* 按钮 */}
              <div className="flex space-x-3">
                <button
                  onClick={handleNextStep}
                  className="flex-1 h-11 bg-white border border-[#D2D2D7] rounded-[14px] text-[16px] font-medium text-[#1D1D1F] cursor-pointer active:bg-[#F5F5F7] transition-colors whitespace-nowrap"
                >
                  暂不上传
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={!uploadedImage}
                  className={`flex-1 h-11 rounded-[14px] text-[16px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                    uploadedImage
                      ? 'bg-white border border-[#D2D2D7] text-[#1D1D1F] active:bg-[#F5F5F7]'
                      : 'bg-[#E5E5EA] text-[#8E8E93] cursor-not-allowed border border-transparent'
                  }`}
                >
                  下一步
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 步骤2：选择风格 */}
      {step === 2 && (
        <div
          className="px-4 pt-4 pb-[calc(100px+env(safe-area-inset-bottom))]"
          style={{
            marginTop: 'calc(44px + env(safe-area-inset-top))',
          }}
        >
          {/* 筛选器 */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              <span className="text-[13px] text-[#6E6E73] whitespace-nowrap">
                风格:
              </span>
              {styleTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setStyleFilter(type)}
                  className={`px-3 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-all cursor-pointer ${
                    styleFilter === type
                      ? 'bg-[#F5F5F7] text-[#1D1D1F] border border-[#C7C7CC]'
                      : 'bg-white text-[#1D1D1F] border border-[#D2D2D7]'
                  }`}
                >
                  {type === 'all' ? '全部' : type}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-2 overflow-x-auto pt-2 scrollbar-hide">
              <span className="text-[13px] text-[#6E6E73] whitespace-nowrap">
                空间:
              </span>
              {spaceTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSpaceFilter(type)}
                  className={`px-3 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-all cursor-pointer ${
                    spaceFilter === type
                      ? 'bg-[#F5F5F7] text-[#1D1D1F] border border-[#C7C7CC]'
                      : 'bg-white text-[#1D1D1F] border border-[#D2D2D7]'
                  }`}
                >
                  {type === 'all' ? '全部' : type}
                </button>
              ))}
            </div>
          </div>

          {/* 不规则风格卡片网格 */}
          <div className="columns-2 gap-3 space-y-3">
            {filteredStyles.map((card) => (
              <div
                key={card.id}
                onClick={() => setSelectedStyle(card.id)}
                className={`break-inside-avoid bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
                  selectedStyle === card.id ? 'ring-2 ring-[#0071E3]' : 'ring-1 ring-[#E5E5EA]'
                }`}
              >
                <div
                  className={`relative ${
                    card.orientation === 'portrait'
                      ? 'aspect-[3/4]'
                      : 'aspect-[4/3]'
                  }`}
                >
                  <img
                    src={card.image}
                    alt={card.name}
                    className="w-full h-full object-cover"
                  />
                  {card.popular && (
                    <div className="absolute top-2 left-2 bg-[#F5F5F7] border border-[#D2D2D7] px-2 py-0.5 rounded-full">
                      <span className="text-[10px] text-[#6E6E73] font-medium">
                        热门
                      </span>
                    </div>
                  )}
                  {selectedStyle === card.id && (
                    <div className="absolute top-2 right-2 w-7 h-7 bg-[#0071E3] rounded-full flex items-center justify-center shadow-lg">
                      <i className="ri-check-line text-[18px] text-white font-bold"></i>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-[14px] font-medium text-white">
                      {card.name}
                    </p>
                    <p className="text-[11px] text-white/80">
                      {card.style} · {card.space}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredStyles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <i className="ri-landscape-line text-[48px] text-[#C7C7CC] mb-3"></i>
              <p className="text-[14px] text-[#6E6E73]">
                暂无匹配的风格
              </p>
            </div>
          )}

          {/* 底部按钮 */}
          <div
            className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-[#E5E5EA] p-4 z-40"
            style={{
              paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
            }}
          >
            <button
              onClick={handleNextStep}
              disabled={!selectedStyle}
              className={`w-full h-12 rounded-[16px] text-[16px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedStyle
                  ? 'bg-white border border-[#D2D2D7] text-[#1D1D1F] active:bg-[#F5F5F7]'
                  : 'bg-[#E5E5EA] text-[#8E8E93] cursor-not-allowed border border-transparent'
              }`}
            >
              下一步：选择家具
            </button>
          </div>
        </div>
      )}

      {/* 步骤3：选择家具 */}
      {step === 3 && (
        <div
          className="pb-[calc(220px+env(safe-area-inset-bottom))]"
          style={{
            marginTop: 'calc(44px + env(safe-area-inset-top))',
          }}
        >
          {/* 搜索栏 */}
          <div className="px-4 py-3 bg-white border-b border-[#E5E5EA]">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#8E8E93]"></i>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索家具名称或SKU"
                className="w-full h-10 bg-[#F5F5F7] rounded-lg pl-10 pr-4 text-[14px] text-[#1D1D1F] placeholder-[#C7C7CC] focus:outline-none focus:ring-1 focus:ring-[#1D1D1F]"
              />
            </div>
          </div>

          {/* 分类标签 */}
          <div className="px-4 py-3 bg-white border-b border-[#E5E5EA] overflow-x-auto scrollbar-hide">
            <div className="flex space-x-2">
              {furnitureCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFurnitureCategory(cat.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                    furnitureCategory === cat.id
                      ? 'bg-[#F5F5F7] text-[#1D1D1F] border border-[#C7C7CC]'
                      : 'bg-white text-[#1D1D1F] border border-[#D2D2D7]'
                  }`}
                >
                  <i className={`${cat.icon} text-[14px]`}></i>
                  <span className="text-[13px]">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 已选家具 */}
          {(selectedFurniture.length > 0 ||
            uploadedFurnitureImages.length > 0) && (
            <div className="px-4 py-3 bg-[#F5F5F7] border-b border-[#E5E5EA]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-medium text-[#1D1D1F]">
                  已选 {selectedFurniture.length + uploadedFurnitureImages.length}{' '}
                  件家具
                </span>
                <button
                  onClick={() => {
                    setSelectedFurniture([]);
                    setUploadedFurnitureImages([]);
                  }}
                  className="text-[12px] text-[#6E6E73] cursor-pointer"
                >
                  清空
                </button>
              </div>
              <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
                {selectedFurniture.map((item) => (
                  <div key={item.id} className="relative flex-shrink-0">
                    <div className="flex flex-col items-center">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 rounded-lg object-cover border-2 border-[#1D1D1F]"
                      />
                      {item.selectionSummary && (
                        <span className="text-[10px] text-[#6E6E73] mt-1 max-w-[56px] truncate">
                          {item.selectionSummary}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        setSelectedFurniture(
                          selectedFurniture.filter((f) => f.id !== item.id),
                        )
                      }
                      className="absolute -top-1 -right-1 w-5 h-5 bg-[#1D1D1F] rounded-full flex items-center justify-center cursor-pointer"
                    >
                      <i className="ri-close-line text-[10px] text-white"></i>
                    </button>
                  </div>
                ))}
                {uploadedFurnitureImages.map((img, idx) => (
                  <div key={`upload-${idx}`} className="relative flex-shrink-0">
                    <img
                      src={img}
                      alt={`上传 ${idx + 1}`}
                      className="w-14 h-14 rounded-lg object-cover border-2 border-[#6E6E73]"
                    />
                    <button
                      onClick={() =>
                        setUploadedFurnitureImages(
                          uploadedFurnitureImages.filter((_, i) => i !== idx),
                        )
                      }
                      className="absolute -top-1 -right-1 w-5 h-5 bg-[#1D1D1F] rounded-full flex items-center justify-center cursor-pointer"
                    >
                      <i className="ri-close-line text-[10px] text-white"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 上传家具图片 */}
          <div className="px-4 py-3 bg-white border-b border-[#E5E5EA]">
            <label className="flex items-center justify-center p-3 border-2 border-dashed border-[#E5E5EA] rounded-xl cursor-pointer hover:border-[#1D1D1F] hover:bg-[#F5F5F7] transition-all">
              <i className="ri-upload-cloud-line text-[20px] text-[#6E6E73] mr-2"></i>
              <span className="text-[14px] text-[#6E6E73]">
                上传自定义家具图片
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFurnitureImageUpload}
              />
            </label>
          </div>

          {/* 家具列表 */}
          <div className="px-4 py-3">
            <p className="text-[13px] text-[#6E6E73] mb-3">
              从商品库选择（共 {filteredFurniture.length} 件）
            </p>
            <div className="grid grid-cols-2 gap-3">
              {filteredFurniture.map((product) => (
                <div
                  key={product.id}
                  className={`bg-white rounded-xl overflow-hidden transition-all ${
                    selectedFurniture.find((f) => f.id === product.id)
                      ? 'ring-2 ring-[#1D1D1F]'
                      : ''
                  }`}
                >
                  <div
                    className="relative aspect-square cursor-pointer"
                    onClick={() => handleOpenFurnitureDetail(product)}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {selectedFurniture.find((f) => f.id === product.id) && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-[#1D1D1F] rounded-full flex items-center justify-center">
                        <i className="ri-check-line text-[14px] text-white"></i>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/60 px-1.5 py-0.5 rounded">
                      <span className="text-[10px] text-white">
                        {product.sku}
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[13px] text-[#1D1D1F] line-clamp-1 mb-1">
                      {product.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[15px] font-semibold text-[#1D1D1F]">
                          ¥{product.price}
                        </span>
                        <span className="text-[11px] text-[#C7C7CC] line-through ml-1">
                          ¥{product.originalPrice}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#8E8E93]">
                        已售{product.sold}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 底部：描述和积分 */}
          <div
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E5EA] z-40"
            style={{
              paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
            }}
          >
            {/* 描述输入 */}
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-medium text-[#1D1D1F]">
                  场景描述
                </span>
                <span className="text-[11px] text-[#8E8E93]">
                  {description.length}/200
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value.slice(0, 200))
                }
                placeholder="AI已自动生成描述，您可以修改..."
                className="w-full h-16 bg-[#F5F5F7] rounded-lg px-3 py-2 text-[13px] text-[#1D1D1F] placeholder-[#C7C7CC] resize-none focus:outline-none focus:ring-1 focus:ring-[#1D1D1F]"
                maxLength={200}
              />
            </div>

            {/* 积分信息 */}
            <div className="px-4 py-2 flex items-center justify-between border-t border-[#F5F5F7]">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="text-[12px] text-[#6E6E73]">
                    当前积分
                  </span>
                  <span className="text-[14px] font-semibold text-[#1D1D1F] ml-1">
                    {userCredits}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-[12px] text-[#6E6E73]">
                    本次消耗
                  </span>
                  <span className="text-[14px] font-semibold text-[#FF3B30] ml-1">
                    -{costCredits}
                  </span>
                </div>
              </div>
              <button
                onClick={handleNextStep}
                disabled={
                  userCredits < costCredits ||
                  (selectedFurniture.length === 0 &&
                    uploadedFurnitureImages.length === 0)
                }
                className={`px-6 h-11 rounded-[14px] text-[15px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                  userCredits >= costCredits &&
                  (selectedFurniture.length > 0 ||
                    uploadedFurnitureImages.length > 0)
                    ? 'bg-white border border-[#D2D2D7] text-[#1D1D1F] active:bg-[#F5F5F7]'
                    : 'bg-[#E5E5EA] text-[#8E8E93] cursor-not-allowed border border-transparent'
                }`}
              >
                开始生成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 家具详情弹窗 - 完整SKU选择 */}
      {showFurnitureDetail && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[60]"
            onClick={() => {
              setShowFurnitureDetail(null);
              setSelectedSpec('');
              setSelectedFabric('');
              setSelectedColor('');
            }}
          ></div>
          <div className="fixed inset-x-0 bottom-0 z-[70] bg-white rounded-t-[20px] max-h-[85vh] overflow-hidden flex flex-col">
            {/* 顶部拖拽条 */}
            <div className="flex items-center justify-center py-2 flex-shrink-0">
              <div className="w-10 h-1 bg-[#C6C6C8] rounded-full"></div>
            </div>

            {/* 可滚动内容区 */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {/* 商品基本信息 */}
              <div className="flex items-start space-x-4 mb-5">
                <img
                  src={showFurnitureDetail.image}
                  alt={showFurnitureDetail.name}
                  className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-medium text-[#1D1D1F] mb-1 line-clamp-2">
                    {showFurnitureDetail.name}
                  </p>
                  <p className="text-[12px] text-[#6E6E73] mb-2">
                    SKU: {showFurnitureDetail.sku}
                  </p>
                  <div className="flex items-baseline">
                    <span className="text-[20px] font-bold text-[#1D1D1F]">
                      ¥{showFurnitureDetail.price}
                    </span>
                    <span className="text-[13px] text-[#C7C7CC] line-through ml-2">
                      ¥{showFurnitureDetail.originalPrice}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowFurnitureDetail(null);
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
                  {showFurnitureDetail.specs.map((spec: string) => (
                    <button
                      key={spec}
                      onClick={() => setSelectedSpec(spec)}
                      className={`relative px-4 py-2.5 rounded-xl text-[14px] transition-all cursor-pointer active:scale-[0.985] active:translate-y-[2px] ${
                        selectedSpec === spec
                          ? 'bg-[#F5F5F7] text-[#1D1D1F] font-semibold border-2 border-[#0071E3]'
                          : 'bg-white text-[#1D1D1F] border border-[#D2D2D7] hover:bg-[#F5F5F7]'
                      }`}
                    >
                      {selectedSpec === spec && (
                        <i className="ri-check-line text-[12px] text-[#0071E3] mr-1"></i>
                      )}
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
                          className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer active:scale-[0.985] active:translate-y-[2px] ${
                            isSelected
                              ? 'bg-[#F5F5F7] border-2 border-[#0071E3]'
                              : 'bg-white border border-[#D2D2D7] hover:bg-[#F5F5F7]'
                          }`}
                        >
                          {isSelected && (
                            <i className="ri-check-line text-[12px] text-[#0071E3]"></i>
                          )}
                          <span className={`text-[14px] ${isSelected ? 'font-semibold text-[#1D1D1F]' : 'text-[#1D1D1F]'}`}>{fabric.name}</span>
                          {fabric.tag && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap bg-[#F5F5F7] text-[#8E8E93]">
                              {fabric.tag}
                            </span>
                          )}
                          {fabric.priceAdd > 0 && (
                            <span className="text-[11px] text-[#6E6E73]">
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
                <span>库存: {showFurnitureDetail.stock} 件</span>
                <span>已售: {showFurnitureDetail.sold} 件</span>
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
                onClick={() => handleSelectFurniture(showFurnitureDetail)}
                className={`w-full h-12 rounded-[16px] text-[16px] font-medium transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                  selectedFurniture.find(
                    (f) => f.id === showFurnitureDetail.id,
                  )
                    ? 'bg-white border border-[#D2D2D7] text-[#FF3B30]'
                    : 'bg-white border border-[#D2D2D7] text-[#1D1D1F] active:bg-[#F5F5F7]'
                }`}
              >
                {selectedFurniture.find(
                  (f) => f.id === showFurnitureDetail.id,
                )
                  ? '取消选择'
                  : '确认选择'}
              </button>
            </div>
            <div style={{ height: 'env(safe-area-inset-bottom)' }}></div>
          </div>
        </>
      )}

      {/* 生成中 */}
      {step === 'generating' && (
        <div
          className="flex flex-col items-center justify-center px-4"
          style={{
            marginTop: 'calc(44px + env(safe-area-inset-top))',
            minHeight: 'calc(100vh - 44px - env(safe-area-inset-top))',
          }}
        >
          <div className="w-28 h-28 relative mb-6">
            <div className="absolute inset-0 border-4 border-[#E5E5EA] rounded-full"></div>
            <div
              className="absolute inset-0 border-4 border-[#1D1D1F] rounded-full border-t-transparent animate-spin"
              style={{ animationDuration: '1s' }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[22px] font-bold text-[#1D1D1F]">
                {progress}%
              </span>
            </div>
          </div>
          <h3 className="text-[17px] font-semibold text-[#1D1D1F] mb-2">
            AI 正在生成中...
          </h3>
          <p className="text-[14px] text-[#6E6E73] text-center">
            根据您的配置生成场景效果图<br />
            预计需要 30-60 秒
          </p>
        </div>
      )}

      {/* 生成结果 */}
      {step === 'result' && (
        <div
          className="px-4 pt-4 pb-[calc(100px+env(safe-area-inset-bottom))]"
          style={{
            marginTop: 'calc(44px + env(safe-area-inset-top))',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[17px] font-semibold text-[#1D1D1F]">
              生成结果
            </h3>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1.5 bg-[#F5F5F7] rounded-lg text-[13px] text-[#1D1D1F] cursor-pointer active:bg-[#E5E5EA] transition-colors whitespace-nowrap">
                保存到素材库
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {generatedImages.map((img, idx) => (
              <div key={idx} className="bg-white rounded-xl overflow-hidden">
                <img
                  src={img}
                  alt={`结果 ${idx + 1}`}
                  className="w-full aspect-video object-cover"
                />
                <div className="p-4 flex items-center justify-between">
                  <span className="text-[14px] text-[#6E6E73]">
                    效果图 {idx + 1}
                  </span>
                  <div className="flex items-center space-x-3">
                    <button className="w-9 h-9 bg-[#F5F5F7] rounded-full flex items-center justify-center cursor-pointer active:bg-[#E5E5EA] transition-colors">
                      <i className="ri-download-line text-[18px] text-[#1D1D1F]"></i>
                    </button>
                    <button className="w-9 h-9 bg-[#F5F5F7] rounded-full flex items-center justify-center cursor-pointer active:bg-[#E5E5EA] transition-colors">
                      <i className="ri-share-line text-[18px] text-[#1D1D1F]"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 底部按钮 */}
          <div
            className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-[#E5E5EA] p-4 z-40"
            style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
          >
            <button
              onClick={() => {
                // 重置所有状态，回到初始页面
                setStep(1);
                setShowUploadModal(true);
                setUploadedImage('');
                setSelectedStyle('');
                setSelectedFurniture([]);
                setUploadedFurnitureImages([]);
                setDescription('');
                setGeneratedImages([]);
              }}
              className="w-full h-12 bg-white border border-[#D2D2D7] rounded-[16px] text-[16px] font-medium text-[#1D1D1F] cursor-pointer active:bg-[#F5F5F7] transition-colors whitespace-nowrap"
            >
              继续生成
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
