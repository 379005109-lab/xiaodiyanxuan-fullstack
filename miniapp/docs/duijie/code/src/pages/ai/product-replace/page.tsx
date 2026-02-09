import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { furnitureProducts, userCredits } from '../../../mocks/aiMaterials';

interface MarkedProduct {
  id: string;
  name: string;
  position: { x: number; y: number };
  replacementImage?: string;
}

export default function ProductReplacePage() {
  const navigate = useNavigate();
  
  // 状态管理
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [showSkuPicker, setShowSkuPicker] = useState(false);
  const [showPublicLibrary, setShowPublicLibrary] = useState(false);
  const [showFullscreenMarking, setShowFullscreenMarking] = useState(false);
  const [showWhiteBgGuide, setShowWhiteBgGuide] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showCountDropdown, setShowCountDropdown] = useState(false);
  
  const [markedProducts, setMarkedProducts] = useState<MarkedProduct[]>([]);
  const [currentReplacingId, setCurrentReplacingId] = useState<string | null>(null);
  const [selectedCount, setSelectedCount] = useState(1);
  const [enableWhiteBg, setEnableWhiteBg] = useState(false);
  
  // 生成状态
  const [generateStatus, setGenerateStatus] = useState<'idle' | 'generating' | 'success' | 'failed'>('idle');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  // 场景图（模拟已有场景）
  const sceneImage = 'https://readdy.ai/api/search-image?query=modern%20living%20room%20interior%20with%20beige%20sofa%2C%20wooden%20coffee%20table%20and%20armchair%2C%20natural%20lighting%20through%20large%20windows%2C%20scandinavian%20style%20furniture%20arrangement%2C%20professional%20interior%20photography&width=800&height=600&seq=scene-replace-1&orientation=landscape';

  // 预设的可点击位置（模拟场景中的家具位置）
  const presetPositions = [
    { id: 'pos-1', x: 35, y: 55, name: '沙发' },
    { id: 'pos-2', x: 65, y: 70, name: '茶几' },
    { id: 'pos-3', x: 85, y: 50, name: '单椅' },
    { id: 'pos-4', x: 15, y: 45, name: '落地灯' },
    { id: 'pos-5', x: 50, y: 30, name: '挂画' },
  ];

  // 模拟相册图片
  const albumImages = [
    'https://readdy.ai/api/search-image?query=modern%20beige%20fabric%20sofa%20front%20view%20on%20white%20background%2C%20clean%20product%20photography&width=400&height=400&seq=replace-album-1&orientation=squarish',
    'https://readdy.ai/api/search-image?query=wooden%20coffee%20table%20front%20view%20on%20white%20background%2C%20clean%20product%20photography&width=400&height=400&seq=replace-album-2&orientation=squarish',
    'https://readdy.ai/api/search-image?query=comfortable%20armchair%20in%20gray%20velvet%20on%20white%20background%2C%20clean%20product%20photography&width=400&height=400&seq=replace-album-3&orientation=squarish',
    'https://readdy.ai/api/search-image?query=modern%20floor%20lamp%20in%20brass%20finish%20on%20white%20background%2C%20clean%20product%20photography&width=400&height=400&seq=replace-album-4&orientation=squarish',
    'https://readdy.ai/api/search-image?query=elegant%20side%20table%20in%20marble%20top%20on%20white%20background%2C%20clean%20product%20photography&width=400&height=400&seq=replace-album-5&orientation=squarish',
    'https://readdy.ai/api/search-image?query=modern%20bookshelf%20in%20walnut%20wood%20on%20white%20background%2C%20clean%20product%20photography&width=400&height=400&seq=replace-album-6&orientation=squarish',
  ];

  // 公库图片
  const publicLibraryImages = [
    'https://readdy.ai/api/search-image?query=scandinavian%20style%20sofa%20in%20light%20gray%20on%20pure%20white%20background%2C%20clean%20product%20shot&width=400&height=400&seq=replace-public-1&orientation=squarish',
    'https://readdy.ai/api/search-image?query=modern%20dining%20chair%20in%20oak%20wood%20on%20pure%20white%20background%2C%20clean%20product%20shot&width=400&height=400&seq=replace-public-2&orientation=squarish',
    'https://readdy.ai/api/search-image?query=elegant%20coffee%20table%20with%20glass%20top%20on%20pure%20white%20background%2C%20clean%20product%20shot&width=400&height=400&seq=replace-public-3&orientation=squarish',
    'https://readdy.ai/api/search-image?query=modern%20floor%20lamp%20minimalist%20design%20on%20pure%20white%20background%2C%20clean%20product%20shot&width=400&height=400&seq=replace-public-4&orientation=squarish',
    'https://readdy.ai/api/search-image?query=comfortable%20ottoman%20in%20velvet%20fabric%20on%20pure%20white%20background%2C%20clean%20product%20shot&width=400&height=400&seq=replace-public-5&orientation=squarish',
    'https://readdy.ai/api/search-image?query=modern%20TV%20stand%20in%20white%20finish%20on%20pure%20white%20background%2C%20clean%20product%20shot&width=400&height=400&seq=replace-public-6&orientation=squarish',
  ];

  const [selectedAlbumImage, setSelectedAlbumImage] = useState<string | null>(null);

  // 点击场景中的标记点
  const handlePositionClick = (pos: typeof presetPositions[0]) => {
    const existing = markedProducts.find(p => p.id === pos.id);
    if (existing) {
      // 已标记，移除
      setMarkedProducts(markedProducts.filter(p => p.id !== pos.id));
    } else {
      // 未标记，添加（最多3个）
      if (markedProducts.length >= 3) {
        return;
      }
      setMarkedProducts([...markedProducts, {
        id: pos.id,
        name: pos.name,
        position: { x: pos.x, y: pos.y }
      }]);
    }
  };

  // 全屏模式下点击添加标记
  const handleFullscreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (markedProducts.length >= 3) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newProduct: MarkedProduct = {
      id: `custom-${Date.now()}`,
      name: `产品${markedProducts.length + 1}`,
      position: { x, y }
    };
    setMarkedProducts([...markedProducts, newProduct]);
  };

  // 删除标记的产品
  const handleRemoveProduct = (id: string) => {
    setMarkedProducts(markedProducts.filter(p => p.id !== id));
  };

  // 打开上传替换品
  const handleOpenUpload = (productId: string) => {
    setCurrentReplacingId(productId);
    setShowActionSheet(true);
  };

  // 处理Action Sheet选项
  const handleActionSheetOption = (option: string) => {
    setShowActionSheet(false);
    switch (option) {
      case 'camera':
        // 模拟拍摄
        setTimeout(() => {
          if (currentReplacingId) {
            const newProducts = markedProducts.map(p => 
              p.id === currentReplacingId 
                ? { ...p, replacementImage: 'https://readdy.ai/api/search-image?query=modern%20furniture%20piece%20on%20white%20background%2C%20clean%20product%20photography&width=400&height=400&seq=camera-replace-' + Date.now() + '&orientation=squarish' }
                : p
            );
            setMarkedProducts(newProducts);
          }
        }, 500);
        break;
      case 'album':
        setShowAlbumPicker(true);
        break;
      case 'sku':
        setShowSkuPicker(true);
        break;
      case 'public':
        setShowPublicLibrary(true);
        break;
    }
  };

  // 从相册选择
  const handleAlbumSelect = () => {
    if (selectedAlbumImage && currentReplacingId) {
      const newProducts = markedProducts.map(p => 
        p.id === currentReplacingId 
          ? { ...p, replacementImage: selectedAlbumImage }
          : p
      );
      setMarkedProducts(newProducts);
      setShowAlbumPicker(false);
      setSelectedAlbumImage(null);
    }
  };

  // 从SKU选择
  const handleSkuSelect = (product: typeof furnitureProducts[0]) => {
    if (currentReplacingId) {
      const newProducts = markedProducts.map(p => 
        p.id === currentReplacingId 
          ? { ...p, replacementImage: product.image }
          : p
      );
      setMarkedProducts(newProducts);
    }
    setShowSkuPicker(false);
  };

  // 从公库选择
  const handlePublicSelect = (imageUrl: string) => {
    if (currentReplacingId) {
      const newProducts = markedProducts.map(p => 
        p.id === currentReplacingId 
          ? { ...p, replacementImage: imageUrl }
          : p
      );
      setMarkedProducts(newProducts);
    }
    setShowPublicLibrary(false);
  };

  // 开始替换
  const handleStartReplace = () => {
    const hasReplacement = markedProducts.some(p => p.replacementImage);
    if (!hasReplacement) return;
    setShowConfirmModal(true);
  };

  // 确认替换
  const handleConfirmReplace = () => {
    setShowConfirmModal(false);
    setGenerateStatus('generating');

    // 模拟生成过程
    setTimeout(() => {
      const success = Math.random() > 0.2;
      if (success) {
        const generated: string[] = [];
        for (let i = 0; i < selectedCount; i++) {
          generated.push(`https://readdy.ai/api/search-image?query=modern%20living%20room%20interior%20with%20replaced%20furniture%2C%20professional%20interior%20photography%2C%20natural%20lighting%2C%20scandinavian%20style&width=800&height=600&seq=replaced-${Date.now()}-${i}&orientation=landscape`);
        }
        setGeneratedImages(generated);
        setGenerateStatus('success');
      } else {
        setGenerateStatus('failed');
      }
    }, 3000);
  };

  // 重新生成
  const handleRetry = () => {
    setGenerateStatus('idle');
    setGeneratedImages([]);
  };

  // 计算积分消耗
  const creditCost = selectedCount * 20;

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* 顶部导航栏 */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="h-11 px-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/ai')}
            className="w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
          >
            <i className="ri-close-line text-[22px] text-[#1C1C1E]"></i>
          </button>
          <h1 className="font-semibold text-[17px] text-[#1C1C1E]">产品替换</h1>
          <button 
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity relative"
          >
            <i className="ri-more-fill text-[22px] text-[#1C1C1E]"></i>
          </button>
        </div>
      </nav>

      {/* 更多菜单 */}
      {showMoreMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)}></div>
          <div 
            className="fixed right-4 z-50 bg-white rounded-[12px] shadow-lg overflow-hidden"
            style={{ top: 'calc(44px + env(safe-area-inset-top) + 8px)', width: '140px' }}
          >
            <button className="w-full px-4 py-3 text-left text-[14px] text-[#1C1C1E] hover:bg-[#F2F2F7] border-b border-[#E5E5EA] cursor-pointer">
              使用说明
            </button>
            <button className="w-full px-4 py-3 text-left text-[14px] text-[#1C1C1E] hover:bg-[#F2F2F7] border-b border-[#E5E5EA] cursor-pointer">
              历史记录
            </button>
            <button className="w-full px-4 py-3 text-left text-[14px] text-[#1C1C1E] hover:bg-[#F2F2F7] cursor-pointer">
              联系客服
            </button>
          </div>
        </>
      )}

      {/* 主内容区域 */}
      <div 
        className="px-4 pt-4 pb-[calc(100px+env(safe-area-inset-bottom))]"
        style={{ marginTop: 'calc(44px + env(safe-area-inset-top))' }}
      >
        {/* 生成状态显示 */}
        {generateStatus !== 'idle' && (
          <div className="mb-4">
            {generateStatus === 'generating' && (
              <div className="bg-white rounded-[16px] p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="absolute inset-0 border-4 border-[#E5E5EA] rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-[#0A84FF] rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-[15px] text-[#1C1C1E] font-medium mb-1">正在替换产品...</p>
                <p className="text-[13px] text-[#8E8E93] mb-4">预计需要 15-45 秒</p>
                <button 
                  onClick={handleRetry}
                  className="px-6 h-11 bg-white border border-[#D2D2D7] text-[#1D1D1F] rounded-[14px] text-[14px] font-medium cursor-pointer hover:bg-[#F5F5F7] active:bg-[#F5F5F7] transition-colors whitespace-nowrap"
                >
                  重新替换
                </button>
              </div>
            )}

            {generateStatus === 'success' && (
              <div className="bg-white rounded-[16px] p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-[#34C759] rounded-full flex items-center justify-center">
                    <i className="ri-check-line text-white text-sm"></i>
                  </div>
                  <span className="text-[15px] text-[#1C1C1E] font-medium">替换成功</span>
                </div>
                <div className="space-y-2 mb-4">
                  {generatedImages.map((img, idx) => (
                    <div key={idx} className="aspect-[4/3] rounded-[12px] overflow-hidden bg-[#F2F2F7]">
                      <img src={img} alt={`替换结果${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleRetry}
                    className="flex-1 h-11 bg-white border border-[#D2D2D7] text-[#1D1D1F] rounded-[14px] text-[14px] font-medium cursor-pointer hover:bg-[#F5F5F7] active:bg-[#F5F5F7] transition-colors whitespace-nowrap"
                  >
                    重新替换
                  </button>
                  <button 
                    onClick={() => navigate('/ai')}
                    className="flex-1 h-11 bg-white border border-[#D2D2D7] text-[#1D1D1F] rounded-[14px] text-[14px] font-medium cursor-pointer hover:bg-[#F5F5F7] active:bg-[#F5F5F7] transition-colors whitespace-nowrap"
                  >
                    保存到素材库
                  </button>
                </div>
              </div>
            )}

            {generateStatus === 'failed' && (
              <div className="bg-white rounded-[16px] p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#FF3B30]/10 rounded-full flex items-center justify-center">
                  <i className="ri-close-circle-line text-[32px] text-[#FF3B30]"></i>
                </div>
                <p className="text-[15px] text-[#1C1C1E] font-medium mb-1">替换失败</p>
                <p className="text-[13px] text-[#8E8E93] mb-4">请检查图片质量后重试</p>
                <button 
                  onClick={handleRetry}
                  className="px-6 h-11 bg-white border border-[#D2D2D7] text-[#1D1D1F] rounded-[14px] text-[14px] font-medium cursor-pointer hover:bg-[#F5F5F7] active:bg-[#F5F5F7] transition-colors whitespace-nowrap"
                >
                  重新尝试
                </button>
              </div>
            )}
          </div>
        )}

        {/* 场景预览区域 */}
        {generateStatus === 'idle' && (
          <>
            <div className="bg-white rounded-[16px] overflow-hidden mb-4">
              <div className="relative aspect-[4/3]">
                <img 
                  src={sceneImage} 
                  alt="场景图" 
                  className="w-full h-full object-cover"
                />
                {/* 可点击的标记点 */}
                {presetPositions.map(pos => {
                  const isMarked = markedProducts.some(p => p.id === pos.id);
                  return (
                    <button
                      key={pos.id}
                      onClick={() => handlePositionClick(pos)}
                      className={`absolute w-6 h-6 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer ${
                        isMarked 
                          ? 'bg-[#0A84FF] border-2 border-white shadow-lg scale-110' 
                          : 'bg-white/80 border-2 border-[#0A84FF] hover:scale-110'
                      }`}
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    >
                      {isMarked && (
                        <i className="ri-check-line text-white text-xs"></i>
                      )}
                    </button>
                  );
                })}
                {/* 自定义标记点 */}
                {markedProducts.filter(p => p.id.startsWith('custom-')).map(product => (
                  <div
                    key={product.id}
                    className="absolute w-6 h-6 bg-[#0A84FF] rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                    style={{ left: `${product.position.x}%`, top: `${product.position.y}%` }}
                  >
                    <i className="ri-check-line text-white text-xs"></i>
                  </div>
                ))}
                {/* 全屏选点按钮 */}
                <button 
                  onClick={() => setShowFullscreenMarking(true)}
                  className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/50 rounded-full flex items-center gap-1.5 cursor-pointer hover:bg-black/70 transition-colors"
                >
                  <i className="ri-focus-3-line text-white text-sm"></i>
                  <span className="text-[12px] text-white">全屏选点</span>
                </button>
              </div>
            </div>

            {/* 标记提示 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[14px] text-[#1C1C1E] font-medium">标记替换产品</span>
                <span className="text-[12px] text-[#8E8E93]">(可多选)</span>
              </div>
              <span className="text-[12px] text-[#8E8E93]">最多3个</span>
            </div>

            {/* 已标记的产品Chips */}
            {markedProducts.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {markedProducts.map((product, idx) => (
                  <div 
                    key={product.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A84FF]/10 rounded-full"
                  >
                    <span className="text-[13px] text-[#0A84FF] font-medium">
                      {idx + 1} {product.name}
                    </span>
                    <button 
                      onClick={() => handleRemoveProduct(product.id)}
                      className="w-4 h-4 flex items-center justify-center cursor-pointer hover:opacity-70"
                    >
                      <i className="ri-close-line text-[#0A84FF] text-sm"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 替换品上传区域 */}
            {markedProducts.length > 0 && (
              <div className="space-y-3 mb-4">
                {markedProducts.map((product, idx) => (
                  <div key={product.id} className="bg-white rounded-[12px] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[14px] text-[#1C1C1E] font-medium">
                        {idx + 1}. {product.name} 替换为
                      </span>
                    </div>
                    {product.replacementImage ? (
                      <div className="relative">
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-20 rounded-[8px] overflow-hidden bg-[#F2F2F7]">
                            <img 
                              src={product.replacementImage} 
                              alt="替换品" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-[13px] text-[#1C1C1E] mb-2">已选择替换图片</p>
                            <button 
                              onClick={() => handleOpenUpload(product.id)}
                              className="text-[13px] text-[#0A84FF] cursor-pointer"
                            >
                              重新选择
                            </button>
                          </div>
                          <button 
                            onClick={() => {
                              const newProducts = markedProducts.map(p => 
                                p.id === product.id ? { ...p, replacementImage: undefined } : p
                              );
                              setMarkedProducts(newProducts);
                            }}
                            className="w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-70"
                          >
                            <i className="ri-delete-bin-line text-[#FF3B30] text-lg"></i>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleOpenUpload(product.id)}
                        className="w-full h-20 border-2 border-dashed border-[#C6C6C8] rounded-[8px] flex flex-col items-center justify-center cursor-pointer hover:border-[#0A84FF] hover:bg-[#0A84FF]/5 transition-all"
                      >
                        <i className="ri-add-line text-[24px] text-[#8E8E93] mb-1"></i>
                        <span className="text-[12px] text-[#8E8E93]">上传替换产品图</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 空状态提示 */}
            {markedProducts.length === 0 && (
              <div className="bg-white rounded-[12px] p-6 text-center mb-4">
                <i className="ri-cursor-line text-[40px] text-[#C6C6C8] mb-2"></i>
                <p className="text-[14px] text-[#8E8E93]">点击场景图中的标记点选择要替换的产品</p>
              </div>
            )}

            {/* 生成白底图开关 */}
            <div className="bg-white rounded-[12px] p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] text-[#1C1C1E] font-medium">生成白底图</span>
                  <span className="text-[11px] text-[#FF9500] bg-[#FF9500]/10 px-1.5 py-0.5 rounded">替换更精准</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowWhiteBgGuide(true)}
                    className="text-[12px] text-[#0A84FF] cursor-pointer"
                  >
                    了解详情
                  </button>
                  <button 
                    onClick={() => setEnableWhiteBg(!enableWhiteBg)}
                    className={`w-[51px] h-[31px] rounded-full transition-all cursor-pointer ${
                      enableWhiteBg ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'
                    }`}
                  >
                    <div className={`w-[27px] h-[27px] bg-white rounded-full shadow-sm transition-transform ${
                      enableWhiteBg ? 'translate-x-[22px]' : 'translate-x-[2px]'
                    }`}></div>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 底部固定操作栏 */}
      {generateStatus === 'idle' && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#E5E5EA] px-4 py-3"
          style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center gap-3">
            {/* 张数下拉 */}
            <div className="relative">
              <button 
                onClick={() => setShowCountDropdown(!showCountDropdown)}
                className="h-12 px-4 bg-[#F2F2F7] rounded-full flex items-center gap-2 cursor-pointer hover:bg-[#E5E5EA] transition-colors"
              >
                <span className="text-[14px] text-[#1C1C1E]">{selectedCount}张</span>
                <i className={`ri-arrow-${showCountDropdown ? 'up' : 'down'}-s-line text-[#8E8E93]`}></i>
              </button>
              {showCountDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowCountDropdown(false)}></div>
                  <div className="absolute bottom-full left-0 mb-2 bg-white rounded-[12px] shadow-lg overflow-hidden z-40 w-24">
                    {[1, 2, 3, 4].map(num => (
                      <button
                        key={num}
                        onClick={() => {
                          setSelectedCount(num);
                          setShowCountDropdown(false);
                        }}
                        className={`w-full h-10 text-[14px] cursor-pointer transition-colors ${
                          selectedCount === num 
                            ? 'bg-[#0A84FF]/10 text-[#0A84FF]' 
                            : 'text-[#1C1C1E] hover:bg-[#F2F2F7]'
                        }`}
                      >
                        {num}张
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* 立即替换按钮 */}
            <button
              onClick={handleStartReplace}
              disabled={!markedProducts.some(p => p.replacementImage)}
              className={`flex-1 h-12 rounded-[16px] text-[16px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                markedProducts.some(p => p.replacementImage)
                  ? 'bg-white border border-[#D2D2D7] text-[#1D1D1F] hover:bg-[#F5F5F7] active:bg-[#F5F5F7]'
                  : 'bg-[#E5E5EA] text-[#8E8E93] cursor-not-allowed border border-transparent'
              }`}
            >
              立即替换（消耗积分 {creditCost}）
            </button>
          </div>
          <p className="text-center text-[12px] text-[#8E8E93] mt-2">
            当前积分：{userCredits}
          </p>
        </div>
      )}

      {/* iOS Action Sheet */}
      {showActionSheet && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setShowActionSheet(false)}
          ></div>
          <div 
            className="fixed left-4 right-4 z-50 animate-slide-up"
            style={{ bottom: 'calc(12px + env(safe-area-inset-bottom))' }}
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-[14px] overflow-hidden mb-2">
              <button 
                onClick={() => handleActionSheetOption('camera')}
                className="w-full h-14 text-[17px] text-[#0A84FF] border-b border-[#E5E5EA] cursor-pointer hover:bg-[#F2F2F7] transition-colors"
              >
                拍摄
              </button>
              <button 
                onClick={() => handleActionSheetOption('album')}
                className="w-full h-14 text-[17px] text-[#0A84FF] border-b border-[#E5E5EA] cursor-pointer hover:bg-[#F2F2F7] transition-colors"
              >
                从相册选择
              </button>
              <button 
                onClick={() => handleActionSheetOption('sku')}
                className="w-full h-14 text-[17px] text-[#0A84FF] border-b border-[#E5E5EA] cursor-pointer hover:bg-[#F2F2F7] transition-colors"
              >
                从产品选择SKU
              </button>
              <button 
                onClick={() => handleActionSheetOption('public')}
                className="w-full h-14 text-[17px] text-[#0A84FF] cursor-pointer hover:bg-[#F2F2F7] transition-colors"
              >
                从公库选择
              </button>
            </div>
            <button 
              onClick={() => setShowActionSheet(false)}
              className="w-full h-14 bg-white/95 backdrop-blur-xl rounded-[14px] text-[17px] text-[#0A84FF] font-semibold cursor-pointer hover:bg-[#F2F2F7] transition-colors"
            >
              取消
            </button>
          </div>
        </>
      )}

      {/* 相册选择器 */}
      {showAlbumPicker && (
        <div className="fixed inset-0 z-50 bg-[#F2F2F7]">
          <nav 
            className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA]"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <div className="h-11 px-4 flex items-center justify-between">
              <button 
                onClick={() => {
                  setShowAlbumPicker(false);
                  setSelectedAlbumImage(null);
                }}
                className="text-[17px] text-[#0A84FF] cursor-pointer"
              >
                取消
              </button>
              <h1 className="font-semibold text-[17px] text-[#1C1C1E]">选择替换图片</h1>
              <button 
                onClick={handleAlbumSelect}
                disabled={!selectedAlbumImage}
                className={`text-[17px] font-semibold cursor-pointer ${
                  selectedAlbumImage ? 'text-[#0A84FF]' : 'text-[#C6C6C8]'
                }`}
              >
                完成
              </button>
            </div>
          </nav>

          <div 
            className="px-1 pt-2 pb-24"
            style={{ marginTop: 'calc(44px + env(safe-area-inset-top))' }}
          >
            <div className="grid grid-cols-3 gap-0.5">
              {albumImages.map((img, idx) => (
                <div 
                  key={idx}
                  onClick={() => setSelectedAlbumImage(img)}
                  className={`relative aspect-square cursor-pointer ${
                    selectedAlbumImage === img ? 'ring-2 ring-[#0A84FF] ring-inset' : ''
                  }`}
                >
                  <img src={img} alt={`相册${idx + 1}`} className="w-full h-full object-cover" />
                  {selectedAlbumImage === img && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-[#0A84FF] rounded-full flex items-center justify-center">
                      <i className="ri-check-line text-white text-sm"></i>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 预览区域 */}
          {selectedAlbumImage && (
            <div 
              className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E5EA] p-4"
              style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[8px] overflow-hidden">
                  <img src={selectedAlbumImage} alt="预览" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] text-[#1C1C1E]">已选择 1 张</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SKU选择器 */}
      {showSkuPicker && (
        <div className="fixed inset-0 z-50 bg-[#F2F2F7]">
          <nav 
            className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA]"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <div className="h-11 px-4 flex items-center justify-between">
              <button 
                onClick={() => setShowSkuPicker(false)}
                className="text-[17px] text-[#0A84FF] cursor-pointer"
              >
                取消
              </button>
              <h1 className="font-semibold text-[17px] text-[#1C1C1E]">选择产品SKU</h1>
              <div className="w-12"></div>
            </div>
          </nav>

          <div 
            className="px-4 pt-4 pb-8"
            style={{ marginTop: 'calc(44px + env(safe-area-inset-top))' }}
          >
            <div className="grid grid-cols-2 gap-3">
              {furnitureProducts.map(product => (
                <div 
                  key={product.id}
                  onClick={() => handleSkuSelect(product)}
                  className="bg-white rounded-[12px] overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-[#F2F2F7]">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-[14px] text-[#1C1C1E] font-medium line-clamp-1">{product.name}</p>
                    <p className="text-[12px] text-[#8E8E93] mt-1">SKU: {product.id}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 公库选择器 */}
      {showPublicLibrary && (
        <div className="fixed inset-0 z-50 bg-[#F2F2F7]">
          <nav 
            className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA]"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <div className="h-11 px-4 flex items-center justify-between">
              <button 
                onClick={() => setShowPublicLibrary(false)}
                className="text-[17px] text-[#0A84FF] cursor-pointer"
              >
                取消
              </button>
              <h1 className="font-semibold text-[17px] text-[#1C1C1E]">公共素材库</h1>
              <div className="w-12"></div>
            </div>
          </nav>

          <div 
            className="px-4 pt-4 pb-8"
            style={{ marginTop: 'calc(44px + env(safe-area-inset-top))' }}
          >
            <div className="grid grid-cols-3 gap-2">
              {publicLibraryImages.map((img, idx) => (
                <div 
                  key={idx}
                  onClick={() => handlePublicSelect(img)}
                  className="aspect-square rounded-[8px] overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <img src={img} alt={`公库${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 全屏标记模式 */}
      {showFullscreenMarking && (
        <div className="fixed inset-0 z-50 bg-black">
          <nav 
            className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <div className="h-11 px-4 flex items-center justify-between">
              <button 
                onClick={() => setShowFullscreenMarking(false)}
                className="text-[17px] text-white cursor-pointer"
              >
                取消
              </button>
              <h1 className="font-semibold text-[17px] text-white">标记替换产品</h1>
              <button 
                onClick={() => setShowFullscreenMarking(false)}
                className="text-[17px] text-[#0A84FF] font-semibold cursor-pointer"
              >
                完成
              </button>
            </div>
          </nav>

          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ 
              top: 'calc(44px + env(safe-area-inset-top))',
              bottom: 'calc(80px + env(safe-area-inset-bottom))'
            }}
          >
            <div 
              className="relative w-full aspect-[4/3] mx-4"
              onClick={handleFullscreenClick}
            >
              <img 
                src={sceneImage} 
                alt="场景" 
                className="w-full h-full object-contain"
              />
              {/* 显示所有标记点 */}
              {markedProducts.map((product, idx) => (
                <div
                  key={product.id}
                  className="absolute w-8 h-8 bg-[#0A84FF] rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                  style={{ left: `${product.position.x}%`, top: `${product.position.y}%` }}
                >
                  <span className="text-[12px] text-white font-bold">{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div 
            className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl px-4 py-4"
            style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
          >
            <p className="text-center text-[14px] text-white/80">
              点击图片标记要替换的产品位置（最多3个，已标记 {markedProducts.length} 个）
            </p>
          </div>
        </div>
      )}

      {/* 白底图引导页 */}
      {showWhiteBgGuide && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setShowWhiteBgGuide(false)}
          ></div>
          <div className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-[16px] overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[17px] font-semibold text-[#1C1C1E]">生成白底图</h3>
                <button 
                  onClick={() => setShowWhiteBgGuide(false)}
                  className="w-8 h-8 flex items-center justify-center cursor-pointer"
                >
                  <i className="ri-close-line text-[#8E8E93] text-xl"></i>
                </button>
              </div>
              
              <div className="bg-[#F2F2F7] rounded-[12px] p-4 mb-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-6 h-6 bg-[#0A84FF] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="ri-lightbulb-line text-white text-sm"></i>
                  </div>
                  <div>
                    <p className="text-[14px] text-[#1C1C1E] font-medium mb-1">为什么需要白底图？</p>
                    <p className="text-[13px] text-[#8E8E93]">白底图能让AI更精准识别产品边界，替换效果更自然</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-6 h-6 bg-[#34C759] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="ri-check-line text-white text-sm"></i>
                  </div>
                  <div>
                    <p className="text-[14px] text-[#1C1C1E] font-medium mb-1">提示要点</p>
                    <p className="text-[13px] text-[#8E8E93]">上传清晰的产品正面照，确保主体完整无遮挡</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#FF9500] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="ri-time-line text-white text-sm"></i>
                  </div>
                  <div>
                    <p className="text-[14px] text-[#1C1C1E] font-medium mb-1">处理时间</p>
                    <p className="text-[13px] text-[#8E8E93]">白底图生成约需10-30秒</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setEnableWhiteBg(false);
                    setShowWhiteBgGuide(false);
                  }}
                  className="flex-1 h-11 bg-[#F2F2F7] text-[#1C1C1E] rounded-[14px] text-[14px] font-medium cursor-pointer hover:bg-[#E5E5EA] transition-colors whitespace-nowrap"
                >
                  关闭并保存
                </button>
                <button 
                  onClick={() => {
                    setShowWhiteBgGuide(false);
                    navigate('/ai/white-bg');
                  }}
                  className="flex-1 h-11 bg-white border border-[#D2D2D7] text-[#1D1D1F] rounded-[14px] text-[14px] font-medium cursor-pointer hover:bg-[#F5F5F7] active:bg-[#F5F5F7] transition-colors whitespace-nowrap"
                >
                  制作白底图
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 积分确认弹窗 */}
      {showConfirmModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setShowConfirmModal(false)}
          ></div>
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[280px] bg-white rounded-[14px] overflow-hidden">
            <div className="p-5 text-center">
              <h3 className="text-[17px] font-semibold text-[#1C1C1E] mb-2">确认替换</h3>
              <p className="text-[13px] text-[#8E8E93]">
                本次替换将消耗 <span className="text-[#FF9500] font-medium">{creditCost}</span> 积分
              </p>
              <p className="text-[13px] text-[#8E8E93] mt-1">
                当前积分余额：{userCredits}
              </p>
            </div>
            <div className="flex border-t border-[#E5E5EA]">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 h-11 text-[17px] text-[#0A84FF] border-r border-[#E5E5EA] cursor-pointer hover:bg-[#F2F2F7] transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleConfirmReplace}
                className="flex-1 h-11 text-[17px] text-[#0A84FF] font-semibold cursor-pointer hover:bg-[#F2F2F7] transition-colors"
              >
                确认
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
