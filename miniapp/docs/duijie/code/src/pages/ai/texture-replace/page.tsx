import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  furnitureCategories,
  furnitureProductsExtended,
  fabricOptions,
  materialColorOptions,
} from '../../../mocks/aiMaterials';

interface MarkedProduct {
  id: number;
  name: string;
  x: number;
  y: number;
}

interface TextureImage {
  id: number;
  url: string;
}

export default function TextureReplacePage() {
  const navigate = useNavigate();
  const [productImage, setProductImage] = useState<string | null>(null);
  const [textureImage, setTextureImage] = useState<TextureImage | null>(null);
  const [markedProducts, setMarkedProducts] = useState<MarkedProduct[]>([]);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showTextureActionSheet, setShowTextureActionSheet] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showTextureGallery, setShowTextureGallery] = useState(false);
  const [showTextureLibrary, setShowTextureLibrary] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateSuccess, setGenerateSuccess] = useState(false);
  const [generateFailed, setGenerateFailed] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [detailInput, setDetailInput] = useState('');
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);
  const [useOriginal, setUseOriginal] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [hasRecognized, setHasRecognized] = useState(false);

  // 产品选择器状态
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [productStep, setProductStep] = useState<'list' | 'detail'>('list');
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [pendingProduct, setPendingProduct] = useState<typeof furnitureProductsExtended[0] | null>(null);
  const [selectedSpec, setSelectedSpec] = useState('');
  const [selectedFabric, setSelectedFabric] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  // 自定义标签状态
  const [detailKeywords, setDetailKeywords] = useState(['整体', '坐垫', '扶手', '靠背', '椅腿', '边框']);
  const [newKeyword, setNewKeyword] = useState('');
  const [showAddKeyword, setShowAddKeyword] = useState(false);

  const userCredits = 1280;
  const costPerGenerate = 20;

  // 模拟相册图片
  const galleryImages = [
    'https://readdy.ai/api/search-image?query=modern%20minimalist%20armchair%20in%20beige%20fabric%20on%20pure%20white%20background%2C%20clean%20product%20photography%2C%20professional%20furniture%20catalog%20style&width=400&height=400&seq=gallery-chair-1&orientation=squarish',
    'https://readdy.ai/api/search-image?query=elegant%20dining%20chair%20with%20wooden%20legs%20on%20pure%20white%20background%2C%20clean%20product%20photography%2C%20professional%20furniture%20catalog%20style&width=400&height=400&seq=gallery-chair-2&orientation=squarish',
    'https://readdy.ai/api/search-image?query=modern%20office%20chair%20in%20black%20leather%20on%20pure%20white%20background%2C%20clean%20product%20photography%2C%20professional%20furniture%20catalog%20style&width=400&height=400&seq=gallery-chair-3&orientation=squarish',
    'https://readdy.ai/api/search-image?query=scandinavian%20style%20lounge%20chair%20in%20gray%20fabric%20on%20pure%20white%20background%2C%20clean%20product%20photography%2C%20professional%20furniture%20catalog%20style&width=400&height=400&seq=gallery-chair-4&orientation=squarish',
    'https://readdy.ai/api/search-image?query=vintage%20wooden%20rocking%20chair%20on%20pure%20white%20background%2C%20clean%20product%20photography%2C%20professional%20furniture%20catalog%20style&width=400&height=400&seq=gallery-chair-5&orientation=squarish',
    'https://readdy.ai/api/search-image?query=modern%20bar%20stool%20with%20metal%20frame%20on%20pure%20white%20background%2C%20clean%20product%20photography%2C%20professional%20furniture%20catalog%20style&width=400&height=400&seq=gallery-chair-6&orientation=squarish'
  ];

  // 模拟面料图片
  const textureImages = [
    'https://readdy.ai/api/search-image?query=high%20quality%20velvet%20fabric%20texture%20close-up%20in%20deep%20blue%20color%2C%20soft%20material%20with%20visible%20texture%20pattern%2C%20professional%20material%20photography&width=400&height=400&seq=texture-velvet-1&orientation=squarish',
    'https://readdy.ai/api/search-image?query=premium%20leather%20texture%20close-up%20in%20brown%20color%2C%20genuine%20leather%20material%20with%20natural%20grain%20pattern%2C%20professional%20material%20photography&width=400&height=400&seq=texture-leather-1&orientation=squarish',
    'https://readdy.ai/api/search-image?query=soft%20linen%20fabric%20texture%20close-up%20in%20natural%20beige%20color%2C%20woven%20material%20with%20visible%20weave%20pattern%2C%20professional%20material%20photography&width=400&height=400&seq=texture-linen-1&orientation=squarish',
    'https://readdy.ai/api/search-image?query=luxurious%20silk%20fabric%20texture%20close-up%20in%20champagne%20gold%20color%2C%20smooth%20shiny%20material%2C%20professional%20material%20photography&width=400&height=400&seq=texture-silk-1&orientation=squarish',
    'https://readdy.ai/api/search-image?query=cozy%20wool%20fabric%20texture%20close-up%20in%20gray%20color%2C%20soft%20knitted%20material%20with%20visible%20fiber%20pattern%2C%20professional%20material%20photography&width=400&height=400&seq=texture-wool-1&orientation=squarish',
    'https://readdy.ai/api/search-image?query=modern%20microfiber%20fabric%20texture%20close-up%20in%20olive%20green%20color%2C%20soft%20suede-like%20material%20and%20professional%20material%20photography&width=400&height=400&seq=texture-micro-1&orientation=squarish'
  ];

  // SKU产品列表
  const skuProducts = [
    { id: 'sku-001', name: '北欧风单人椅', image: 'https://readdy.ai/api/search-image?query=scandinavian%20style%20single%20armchair%20in%20light%20gray%20fabric%20on%20pure%20white%20background%2C%20clean%20product%20photography&width=200&height=200&seq=sku-arm-1&orientation=squarish' },
    { id: 'sku-002', name: '现代餐椅', image: 'https://readdy.ai/api/search-image?query=modern%20dining%20chair%20with%20wooden%20legs%20on%20pure%20white%20background%2C%20clean%20product%20photography&width=200&height=200&seq=sku-din-1&orientation=squarish' },
    { id: 'sku-003', name: '休闲躺椅', image: 'https://readdy.ai/api/search-image?query=modern%20lounge%20chair%20in%20navy%20blue%20on%20pure%20white%20background%2C%20clean%20product%20photography&width=200&height=200&seq=sku-lou-1&orientation=squarish' },
    { id: 'sku-004', name: '办公转椅', image: 'https://readdy.ai/api/search-image?query=ergonomic%20office%20chair%20in%20black%20on%20pure%20white%20background%2C%20clean%20product%20photography&width=200&height=200&seq=sku-off-1&orientation=squarish' }
  ];

  // 面料库
  const textureLibraryItems = [
    { id: 'tex-001', name: '天鹅绒-深蓝', image: textureImages[0] },
    { id: 'tex-002', name: '真皮-棕色', image: textureImages[1] },
    { id: 'tex-003', name: '亚麻-米色', image: textureImages[2] },
    { id: 'tex-004', name: '丝绸-香槟金', image: textureImages[3] },
    { id: 'tex-005', name: '羊毛-灰色', image: textureImages[4] },
    { id: 'tex-006', name: '超纤-橄榄绿', image: textureImages[5] }
  ];

  // 处理关闭
  const handleClose = () => {
    navigate('/ai');
  };

  // 删除标记点
  const removeMarkedProduct = (id: number) => {
    setMarkedProducts(markedProducts.filter(p => p.id !== id));
    setHasRecognized(false);
  };

  // 生成操作
  const handleGenerate = () => {
    if (!productImage || !textureImage || markedProducts.length === 0) return;
    setShowConfirmModal(true);
  };

  const confirmGenerate = () => {
    setShowConfirmModal(false);
    setIsGenerating(true);
    setGenerateSuccess(false);
    setGenerateFailed(false);

    setTimeout(() => {
      setIsGenerating(false);
      const success = Math.random() > 0.2;
      if (success) {
        setGenerateSuccess(true);
        setGeneratedImage('https://readdy.ai/api/search-image?query=modern%20armchair%20with%20new%20blue%20velvet%20fabric%20upholstery%2C%20professional%20furniture%20photography%20on%20pure%20white%20background%2C%20high%20quality%20product%20image&width=600&height=600&seq=generated-texture-1&orientation=squarish');
      } else {
        setGenerateFailed(true);
      }
    }, 3000);
  };

  // 关键字点击
  const handleKeywordClick = (keyword: string) => {
    setDetailInput(keyword);
  };

  // 添加新标签
  const handleAddKeyword = () => {
    if (newKeyword.trim() && !detailKeywords.includes(newKeyword.trim())) {
      setDetailKeywords([...detailKeywords, newKeyword.trim()]);
      setNewKeyword('');
      setShowAddKeyword(false);
    }
  };

  // 删除标签
  const handleRemoveKeyword = (keyword: string) => {
    setDetailKeywords(detailKeywords.filter(k => k !== keyword));
  };

  // 上传产品图片
  const handleUploadProduct = () => {
    setShowActionSheet(true);
  };

  // 上传面料图片
  const handleUploadTexture = () => {
    setShowTextureActionSheet(true);
  };

  // 从相册选择产品图片
  const selectFromGallery = () => {
    setShowActionSheet(false);
    setShowGallery(true);
  };

  // 从SKU选择
  const selectFromSKU = () => {
    setShowActionSheet(false);
    setShowProductSelector(true);
    setProductStep('list');
  };

  // 拍照
  const takePhoto = () => {
    setShowActionSheet(false);
    const demoImage = galleryImages[0];
    setProductImage(demoImage);
  };

  // 从相册选择面料图片
  const selectTextureFromGallery = () => {
    setShowTextureActionSheet(false);
    setShowTextureGallery(true);
  };

  // 从面料库选择
  const selectFromTextureLibrary = () => {
    setShowTextureActionSheet(false);
    setShowTextureLibrary(true);
  };

  // 拍照面料
  const takeTexturePhoto = () => {
    setShowTextureActionSheet(false);
    const demoTexture = textureImages[0];
    setTextureImage({ id: Date.now(), url: demoTexture });
  };

  // 确认相册选择
  const confirmGallerySelection = () => {
    if (selectedGalleryImage) {
      setProductImage(selectedGalleryImage);
      setShowGallery(false);
      setSelectedGalleryImage(null);
    }
  };

  // 确认面料库选择
  const confirmTextureLibrarySelection = (item: typeof textureLibraryItems[0]) => {
    setTextureImage({ id: Date.now(), url: item.image });
    setShowTextureLibrary(false);
  };

  // 确认面料相册选择
  const confirmTextureGallerySelection = () => {
    if (selectedGalleryImage) {
      setTextureImage({ id: Date.now(), url: selectedGalleryImage });
      setShowTextureGallery(false);
      setSelectedGalleryImage(null);
    }
  };

  // 标记产品
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!productImage || hasRecognized) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newProduct: MarkedProduct = {
      id: Date.now(),
      name: `产品${markedProducts.length + 1}`,
      x,
      y
    };
    
    setMarkedProducts([...markedProducts, newProduct]);
  };

  // 智能识别
  const handleSmartRecognize = () => {
    if (!productImage) return;
    
    setIsRecognizing(true);
    
    setTimeout(() => {
      const recognizedProducts: MarkedProduct[] = [
        { id: Date.now(), name: '坐垫', x: 50, y: 45 },
        { id: Date.now() + 1, name: '靠背', x: 50, y: 25 },
        { id: Date.now() + 2, name: '扶手', x: 30, y: 40 }
      ];
      
      setMarkedProducts(recognizedProducts);
      setIsRecognizing(false);
      setHasRecognized(true);
    }, 2000);
  };

  // 产品选择器相关
  const filteredProducts = furnitureProductsExtended.filter(product => {
    const matchCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchSearch = product.name.toLowerCase().includes(searchText.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleProductSelect = (product: typeof furnitureProductsExtended[0]) => {
    setPendingProduct(product);
    setProductStep('detail');
    setSelectedSpec('');
    setSelectedFabric('');
    setSelectedColor('');
  };

  const handleConfirmProduct = () => {
    if (pendingProduct && selectedSpec && selectedFabric) {
      setProductImage(pendingProduct.image);
      setShowProductSelector(false);
      setPendingProduct(null);
      setProductStep('list');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center cursor-pointer">
            <i className="ri-arrow-left-line text-xl text-gray-700"></i>
          </button>
          <h1 className="text-base font-medium text-gray-900">更换材质面料</h1>
          <button 
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="w-8 h-8 flex items-center justify-center cursor-pointer relative"
          >
            <i className="ri-more-line text-xl text-gray-700"></i>
            {showMoreMenu && (
              <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 cursor-pointer whitespace-nowrap">
                  查看教程
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 cursor-pointer whitespace-nowrap">
                  历史记录
                </button>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 space-y-4">
          {/* 产品图片上传 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-900">产品图片</h2>
              {productImage && (
                <button 
                  onClick={() => setShowFullscreen(true)}
                  className="text-xs text-blue-600 cursor-pointer whitespace-nowrap"
                >
                  查看大图
                </button>
              )}
            </div>
            
            {!productImage ? (
              <div 
                onClick={handleUploadProduct}
                className="w-full aspect-square bg-white rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
              >
                <i className="ri-upload-cloud-line text-4xl text-gray-400 mb-2"></i>
                <p className="text-sm text-gray-500">上传产品图片</p>
                <p className="text-xs text-gray-400 mt-1">支持JPG、PNG格式</p>
              </div>
            ) : (
              <div className="relative">
                <div 
                  className="w-full aspect-square bg-white rounded-xl overflow-hidden relative cursor-crosshair"
                  onClick={handleImageClick}
                >
                  <img 
                    src={productImage} 
                    alt="Product" 
                    className="w-full h-full object-contain"
                  />
                  
                  {/* 标记点 */}
                  {markedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="absolute w-8 h-8 -ml-4 -mt-4 cursor-pointer group"
                      style={{ left: `${product.x}%`, top: `${product.y}%` }}
                    >
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <i className="ri-focus-3-line text-white text-sm"></i>
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {product.name}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMarkedProduct(product.id);
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <i className="ri-close-line text-white text-xs"></i>
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* 操作按钮 */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button 
                    onClick={handleSmartRecognize}
                    disabled={isRecognizing || hasRecognized}
                    className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-gray-700 shadow-sm border border-gray-200 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRecognizing ? (
                      <>
                        <i className="ri-loader-4-line animate-spin mr-1"></i>
                        识别中...
                      </>
                    ) : hasRecognized ? (
                      <>
                        <i className="ri-check-line mr-1"></i>
                        已识别
                      </>
                    ) : (
                      <>
                        <i className="ri-sparkling-line mr-1"></i>
                        智能识别
                      </>
                    )}
                  </button>
                  <button 
                    onClick={handleUploadProduct}
                    className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-gray-700 shadow-sm border border-gray-200 cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-refresh-line mr-1"></i>
                    重新上传
                  </button>
                </div>
                
                {/* 标记提示 */}
                {markedProducts.length === 0 && !hasRecognized && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-900/80 backdrop-blur-sm text-white text-xs rounded-lg">
                    点击图片标记需要更换材质的部位
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 面料图片上传 */}
          <div>
            <h2 className="text-sm font-medium text-gray-900 mb-3">面料图片</h2>
            
            {!textureImage ? (
              <div 
                onClick={handleUploadTexture}
                className="w-full h-32 bg-white rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
              >
                <i className="ri-image-add-line text-3xl text-gray-400 mb-2"></i>
                <p className="text-sm text-gray-500">上传面料图片</p>
              </div>
            ) : (
              <div className="relative">
                <div className="w-full h-32 bg-white rounded-xl overflow-hidden">
                  <img 
                    src={textureImage.url} 
                    alt="Texture" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <button 
                  onClick={handleUploadTexture}
                  className="absolute top-2 right-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-gray-700 shadow-sm border border-gray-200 cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-refresh-line mr-1"></i>
                  重新上传
                </button>
              </div>
            )}
          </div>

          {/* 替换描述 */}
          <div>
            <h2 className="text-sm font-medium text-gray-900 mb-3">替换描述（选填）</h2>
            <textarea
              value={detailInput}
              onChange={(e) => setDetailInput(e.target.value)}
              placeholder="描述需要更换的具体部位和效果，如：将坐垫和靠背更换为深蓝色天鹅绒材质"
              className="w-full h-24 px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex flex-wrap gap-2">
                {detailKeywords.map((keyword) => (
                  <div
                    key={keyword}
                    className="group relative px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
                  >
                    <span onClick={() => handleKeywordClick(keyword)}>{keyword}</span>
                    <button
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <i className="ri-close-line text-white text-xs"></i>
                    </button>
                  </div>
                ))}
                {showAddKeyword ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddKeyword();
                        if (e.key === 'Escape') {
                          setShowAddKeyword(false);
                          setNewKeyword('');
                        }
                      }}
                      placeholder="输入标签"
                      className="w-20 px-2 py-1 text-xs border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={handleAddKeyword}
                      className="w-5 h-5 flex items-center justify-center bg-blue-600 text-white rounded-full cursor-pointer"
                    >
                      <i className="ri-check-line text-xs"></i>
                    </button>
                    <button
                      onClick={() => {
                        setShowAddKeyword(false);
                        setNewKeyword('');
                      }}
                      className="w-5 h-5 flex items-center justify-center bg-gray-400 text-white rounded-full cursor-pointer"
                    >
                      <i className="ri-close-line text-xs"></i>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddKeyword(true)}
                    className="px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full cursor-pointer hover:bg-blue-100 transition-colors whitespace-nowrap"
                  >
                    + 添加
                  </button>
                )}
              </div>
              <span className="text-xs text-gray-400">{detailInput.length}/500</span>
            </div>
          </div>

          {/* 保留原图选项 */}
          <div className="flex items-center justify-between p-4 bg-white rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-900">保留原图背景</p>
              <p className="text-xs text-gray-500 mt-0.5">生成时保持原图背景不变</p>
            </div>
            <button
              onClick={() => setUseOriginal(!useOriginal)}
              className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer ${
                useOriginal ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  useOriginal ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-bottom">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <i className="ri-copper-coin-line text-yellow-500 text-lg"></i>
            <span className="text-sm text-gray-600">
              剩余积分: <span className="font-medium text-gray-900">{userCredits}</span>
            </span>
          </div>
          <span className="text-xs text-gray-500">
            本次消耗: {costPerGenerate} 积分
          </span>
        </div>
        <button
          onClick={handleGenerate}
          disabled={!productImage || !textureImage || markedProducts.length === 0}
          className={`w-full h-[50px] rounded-2xl font-semibold text-[16px] transition-all whitespace-nowrap ${
            productImage && textureImage && markedProducts.length > 0
              ? 'bg-white border border-[#D2D2D7] text-[#1D1D1F] cursor-pointer active:bg-[#F5F5F7]'
              : 'bg-[#E5E5EA] text-[#8E8E93] cursor-not-allowed'
          }`}
        >
          {!productImage || !textureImage ? '请上传图片' : markedProducts.length === 0 ? '请标记替换部位' : '开始生成'}
        </button>
      </div>

      {/* 产品图片上传选项 */}
      {showActionSheet && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowActionSheet(false)}>
          <div className="w-full bg-white rounded-t-2xl p-4 safe-area-bottom" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <div className="space-y-2">
              <button
                onClick={selectFromGallery}
                className="w-full py-3 text-center text-base text-gray-900 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 whitespace-nowrap"
              >
                从相册选择
              </button>
              <button
                onClick={selectFromSKU}
                className="w-full py-3 text-center text-base text-gray-900 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 whitespace-nowrap"
              >
                从SKU选择
              </button>
              <button
                onClick={takePhoto}
                className="w-full py-3 text-center text-base text-gray-900 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 whitespace-nowrap"
              >
                拍照
              </button>
              <button
                onClick={() => setShowActionSheet(false)}
                className="w-full py-3 text-center text-base text-gray-500 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 whitespace-nowrap"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 面料图片上传选项 */}
      {showTextureActionSheet && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowTextureActionSheet(false)}>
          <div className="w-full bg-white rounded-t-2xl p-4 safe-area-bottom" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <div className="space-y-2">
              <button
                onClick={selectTextureFromGallery}
                className="w-full py-3 text-center text-base text-gray-900 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 whitespace-nowrap"
              >
                从相册选择
              </button>
              <button
                onClick={selectFromTextureLibrary}
                className="w-full py-3 text-center text-base text-gray-900 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 whitespace-nowrap"
              >
                从面料库选择
              </button>
              <button
                onClick={takeTexturePhoto}
                className="w-full py-3 text-center text-base text-gray-900 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 whitespace-nowrap"
              >
                拍照
              </button>
              <button
                onClick={() => setShowTextureActionSheet(false)}
                className="w-full py-3 text-center text-base text-gray-500 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 whitespace-nowrap"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 相册选择器 */}
      {showGallery && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="bg-white border-b border-gray-200">
            <div className="flex items-center justify-between px-4 h-14">
              <button onClick={() => setShowGallery(false)} className="text-base text-gray-600 cursor-pointer whitespace-nowrap">
                取消
              </button>
              <h2 className="text-base font-medium text-gray-900">选择图片</h2>
              <button 
                onClick={confirmGallerySelection}
                disabled={!selectedGalleryImage}
                className="text-base text-blue-600 disabled:text-gray-400 cursor-pointer whitespace-nowrap disabled:cursor-not-allowed"
              >
                确定
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-3 gap-2">
              {galleryImages.map((img, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedGalleryImage(img)}
                  className={`aspect-square rounded-lg overflow-hidden cursor-pointer relative ${
                    selectedGalleryImage === img ? 'ring-2 ring-blue-600' : ''
                  }`}
                >
                  <img src={img} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                  {selectedGalleryImage === img && (
                    <div className="absolute top-1 right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <i className="ri-check-line text-white text-sm"></i>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 面料相册选择器 */}
      {showTextureGallery && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="bg-white border-b border-gray-200">
            <div className="flex items-center justify-between px-4 h-14">
              <button onClick={() => setShowTextureGallery(false)} className="text-base text-gray-600 cursor-pointer whitespace-nowrap">
                取消
              </button>
              <h2 className="text-base font-medium text-gray-900">选择面料</h2>
              <button 
                onClick={confirmTextureGallerySelection}
                disabled={!selectedGalleryImage}
                className="text-base text-blue-600 disabled:text-gray-400 cursor-pointer whitespace-nowrap disabled:cursor-not-allowed"
              >
                确定
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-3 gap-2">
              {textureImages.map((img, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedGalleryImage(img)}
                  className={`aspect-square rounded-lg overflow-hidden cursor-pointer relative ${
                    selectedGalleryImage === img ? 'ring-2 ring-blue-600' : ''
                  }`}
                >
                  <img src={img} alt={`Texture ${index + 1}`} className="w-full h-full object-cover" />
                  {selectedGalleryImage === img && (
                    <div className="absolute top-1 right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <i className="ri-check-line text-white text-sm"></i>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 面料库选择器 */}
      {showTextureLibrary && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="bg-white border-b border-gray-200">
            <div className="flex items-center justify-between px-4 h-14">
              <button onClick={() => setShowTextureLibrary(false)} className="text-base text-gray-600 cursor-pointer whitespace-nowrap">
                取消
              </button>
              <h2 className="text-base font-medium text-gray-900">面料库</h2>
              <div className="w-12"></div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-3">
              {textureLibraryItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => confirmTextureLibrarySelection(item)}
                  className="bg-white rounded-xl overflow-hidden border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SKU产品选择器 */}
      {showProductSelector && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {productStep === 'list' ? (
            <>
              <div className="bg-white border-b border-gray-200">
                <div className="flex items-center justify-between px-4 h-14">
                  <button onClick={() => setShowProductSelector(false)} className="text-base text-gray-600 cursor-pointer whitespace-nowrap">
                    取消
                  </button>
                  <h2 className="text-base font-medium text-gray-900">选择产品</h2>
                  <div className="w-12"></div>
                </div>
                
                {/* 搜索栏 */}
                <div className="px-4 pb-3">
                  <div className="relative">
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="搜索产品"
                      className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* 分类标签 */}
                <div className="px-4 pb-3">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    <button
                      onClick={() => setActiveCategory('all')}
                      className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap cursor-pointer ${
                        activeCategory === 'all'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      全部
                    </button>
                    {furnitureCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap cursor-pointer ${
                          activeCategory === cat.id
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-3">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductSelect(product)}
                      className="bg-white rounded-xl overflow-hidden border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-square">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-900 mb-1">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.specs.length} 个规格</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white border-b border-gray-200">
                <div className="flex items-center justify-between px-4 h-14">
                  <button onClick={() => setProductStep('list')} className="w-8 h-8 flex items-center justify-center cursor-pointer">
                    <i className="ri-arrow-left-line text-xl text-gray-700"></i>
                  </button>
                  <h2 className="text-base font-medium text-gray-900">选择规格</h2>
                  <button
                    onClick={handleConfirmProduct}
                    disabled={!selectedSpec || !selectedFabric}
                    className="text-base text-blue-600 disabled:text-gray-400 cursor-pointer whitespace-nowrap disabled:cursor-not-allowed"
                  >
                    确定
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {pendingProduct && (
                  <div className="p-4 space-y-6">
                    {/* 产品图片 */}
                    <div className="aspect-square bg-white rounded-xl overflow-hidden">
                      <img src={pendingProduct.image} alt={pendingProduct.name} className="w-full h-full object-cover" />
                    </div>

                    {/* 产品信息 */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">{pendingProduct.name}</h3>
                      <p className="text-sm text-gray-500">{pendingProduct.description}</p>
                    </div>

                    {/* 选择规格 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">选择规格</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {pendingProduct.specs.map((spec) => (
                          <button
                            key={spec}
                            onClick={() => setSelectedSpec(spec)}
                            className={`py-2 px-3 rounded-lg text-sm border cursor-pointer whitespace-nowrap transition-colors ${
                              selectedSpec === spec
                                ? 'bg-gray-100 border-gray-900 text-gray-900'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1">
                              {selectedSpec === spec && (
                                <div className="w-4 h-4 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                                  <i className="ri-check-line text-white text-xs"></i>
                                </div>
                              )}
                              <span>{spec}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 选择面料 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">选择面料</h4>
                      <div className="space-y-2">
                        {fabricOptions.map((fabric) => (
                          <button
                            key={fabric.id}
                            onClick={() => setSelectedFabric(fabric.id)}
                            className={`w-full p-3 rounded-lg border cursor-pointer text-left transition-colors ${
                              selectedFabric === fabric.id
                                ? 'bg-gray-100 border-gray-900'
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-gray-900">{fabric.name}</span>
                                  {fabric.tag && (
                                    <span className={`px-2 py-0.5 text-xs rounded ${
                                      selectedFabric === fabric.id
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {fabric.tag}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">{fabric.description}</p>
                                <p className="text-sm font-medium text-gray-700 mt-1">{fabric.price}</p>
                              </div>
                              {selectedFabric === fabric.id && (
                                <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 ml-3">
                                  <i className="ri-check-line text-white text-sm"></i>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 选择颜色（可选） */}
                    {selectedFabric && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">选择颜色（可选）</h4>
                        <div className="grid grid-cols-4 gap-2">
                          {materialColorOptions.map((color) => (
                            <button
                              key={color.id}
                              onClick={() => setSelectedColor(color.id)}
                              className={`aspect-square rounded-lg border-2 cursor-pointer transition-all ${
                                selectedColor === color.id
                                  ? 'border-gray-900 scale-95'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              style={{ backgroundColor: color.hex }}
                            >
                              {selectedColor === color.id && (
                                <div className="w-full h-full flex items-center justify-center">
                                  <i className="ri-check-line text-white text-lg drop-shadow"></i>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* 确认生成弹窗 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowConfirmModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#F5F5F7] rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-sparkling-line text-3xl text-[#1D1D1F]"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">确认生成</h3>
              <p className="text-sm text-gray-500">
                本次生成将消耗 <span className="font-medium text-gray-900">{costPerGenerate}</span> 积分
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-[#F5F5F7] text-[#1D1D1F] text-base font-medium rounded-xl cursor-pointer hover:bg-[#E5E5EA] whitespace-nowrap"
              >
                取消
              </button>
              <button
                onClick={confirmGenerate}
                className="flex-1 py-3 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-base font-medium rounded-xl cursor-pointer active:bg-[#F5F5F7] whitespace-nowrap"
              >
                确认生成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 生成中弹窗 */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">AI 生成中...</h3>
            <p className="text-sm text-gray-500">请稍候，预计需要 30 秒</p>
          </div>
        </div>
      )}

      {/* 生成成功弹窗 */}
      {generateSuccess && generatedImage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setGenerateSuccess(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-check-line text-3xl text-green-600"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">生成成功！</h3>
            </div>
            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
              <img src={generatedImage} alt="Generated" className="w-full h-full object-contain" />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setGenerateSuccess(false)}
                className="flex-1 py-3 bg-[#F5F5F7] text-[#1D1D1F] text-base font-medium rounded-xl cursor-pointer hover:bg-[#E5E5EA] whitespace-nowrap"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  setGenerateSuccess(false);
                  // 这里可以添加下载或保存逻辑
                }}
                className="flex-1 py-3 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-base font-medium rounded-xl cursor-pointer active:bg-[#F5F5F7] whitespace-nowrap"
              >
                保存图片
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 生成失败弹窗 */}
      {generateFailed && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setGenerateFailed(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-close-line text-3xl text-red-600"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">生成失败</h3>
              <p className="text-sm text-gray-500">请检查图片质量后重试</p>
            </div>
            <button
              onClick={() => setGenerateFailed(false)}
              className="w-full py-3 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-base font-medium rounded-xl cursor-pointer active:bg-[#F5F5F7] whitespace-nowrap"
            >
              我知道了
            </button>
          </div>
        </div>
      )}

      {/* 全屏查看 */}
      {showFullscreen && productImage && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center" onClick={() => setShowFullscreen(false)}>
          <button
            onClick={() => setShowFullscreen(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer z-10"
          >
            <i className="ri-close-line text-2xl text-white"></i>
          </button>
          <img src={productImage} alt="Fullscreen" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}