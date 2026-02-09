import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { furnitureProducts, userCredits } from '../../../mocks/aiMaterials';

interface UploadedItem {
  id: string;
  image: string;
}

export default function SoftDecorationPage() {
  const navigate = useNavigate();
  
  // 状态管理
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [showSkuPicker, setShowSkuPicker] = useState(false);
  const [showPublicLibrary, setShowPublicLibrary] = useState(false);
  const [showFullscreenSelect, setShowFullscreenSelect] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showCountDropdown, setShowCountDropdown] = useState(false);
  
  // 场景图
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const [clearScene, setClearScene] = useState(false);
  
  // 下拉选项
  const [houseStatus, setHouseStatus] = useState<string | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  
  const [showHouseDropdown, setShowHouseDropdown] = useState(false);
  const [showSpaceDropdown, setShowSpaceDropdown] = useState(false);
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  
  // 单品上传
  const [uploadedItems, setUploadedItems] = useState<UploadedItem[]>([]);
  const [currentUploadType, setCurrentUploadType] = useState<'scene' | 'item'>('scene');
  
  // 细节输入
  const [detailNote, setDetailNote] = useState('');
  
  // 张数选择
  const [selectedCount, setSelectedCount] = useState(1);
  
  // 生成状态
  const [generateStatus, setGenerateStatus] = useState<'idle' | 'generating' | 'success' | 'failed'>('idle');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  // 选项数据
  const houseStatusOptions = [
    { id: 'decorated', name: '精装' },
    { id: 'rough', name: '毛胚' }
  ];

  const spaceOptions = [
    { id: 'living', name: '客厅' },
    { id: 'dining', name: '餐厅' },
    { id: 'master', name: '主卧' },
    { id: 'second', name: '次卧' },
    { id: 'study', name: '书房' },
    { id: 'elder', name: '老人房' }
  ];

  const styleOptions = [
    { id: 'italian-minimal', name: '意式极简' },
    { id: 'italian-luxury', name: '意式轻奢' },
    { id: 'cream', name: '奶油' },
    { id: 'vintage', name: '中古' },
    { id: 'nordic', name: '北欧' },
    { id: 'old-money', name: '老钱' }
  ];

  // 模拟相册图片
  const albumImages = [
    'https://readdy.ai/api/search-image?query=empty%20modern%20living%20room%20interior%20with%20large%20windows%20and%20wooden%20floor%2C%20bright%20natural%20light%2C%20minimalist%20space%20ready%20for%20decoration%2C%20professional%20interior%20photography&width=400&height=400&seq=soft-album-room-1&orientation=squarish',
    'https://readdy.ai/api/search-image?query=modern%20beige%20linen%20sofa%20front%20view%20isolated%20on%20pure%20white%20background%2C%20clean%20product%20photography%2C%20soft%20cushions%2C%20minimalist%20design&width=400&height=400&seq=soft-album-sofa-1&orientation=squarish',
    'https://readdy.ai/api/search-image?query=round%20wooden%20coffee%20table%20front%20view%20isolated%20on%20pure%20white%20background%2C%20clean%20product%20photography%2C%20natural%20oak%20finish%2C%20scandinavian%20style&width=400&height=400&seq=soft-album-table-1&orientation=squarish',
    'https://readdy.ai/api/search-image?query=comfortable%20velvet%20armchair%20in%20sage%20green%20isolated%20on%20pure%20white%20background%2C%20clean%20product%20photography%2C%20modern%20design&width=400&height=400&seq=soft-album-chair-1&orientation=squarish',
    'https://readdy.ai/api/search-image?query=modern%20brass%20floor%20lamp%20isolated%20on%20pure%20white%20background%2C%20clean%20product%20photography%2C%20minimalist%20design%2C%20warm%20light&width=400&height=400&seq=soft-album-lamp-1&orientation=squarish',
    'https://readdy.ai/api/search-image?query=elegant%20marble%20side%20table%20isolated%20on%20pure%20white%20background%2C%20clean%20product%20photography%2C%20gold%20legs%2C%20luxury%20design&width=400&height=400&seq=soft-album-side-1&orientation=squarish',
  ];

  // 公库图片
  const publicLibraryImages = [
    'https://readdy.ai/api/search-image?query=scandinavian%20style%20gray%20fabric%20sofa%20isolated%20on%20pure%20white%20background%2C%20clean%20product%20shot%2C%20comfortable%20cushions%2C%20wooden%20legs&width=400&height=400&seq=soft-public-sofa-1&orientation=squarish',
    'https://readdy.ai/api/search-image?query=modern%20dining%20chair%20in%20natural%20oak%20wood%20isolated%20on%20pure%20white%20background%2C%20clean%20product%20shot%2C%20ergonomic%20design&width=400&height=400&seq=soft-public-chair-1&orientation=squarish',
    'https://readdy.ai/api/search-image?query=elegant%20glass%20top%20coffee%20table%20with%20black%20metal%20frame%20isolated%20on%20pure%20white%20background%2C%20clean%20product%20shot&width=400&height=400&seq=soft-public-table-1&orientation=squarish',
    'https://readdy.ai/api/search-image?query=minimalist%20floor%20lamp%20with%20white%20shade%20isolated%20on%20pure%20white%20background%2C%20clean%20product%20shot%2C%20adjustable%20height&width=400&height=400&seq=soft-public-lamp-1&orientation=squarish',
    'https://readdy.ai/api/search-image?query=comfortable%20velvet%20ottoman%20in%20dusty%20pink%20isolated%20on%20pure%20white%20background%2C%20clean%20product%20shot%2C%20round%20shape&width=400&height=400&seq=soft-public-ottoman-1&orientation=squarish',
    'https://readdy.ai/api/search-image?query=modern%20TV%20stand%20in%20white%20matte%20finish%20isolated%20on%20pure%20white%20background%2C%20clean%20product%20shot%2C%20storage%20drawers&width=400&height=400&seq=soft-public-tv-1&orientation=squarish',
  ];

  // 场景图库
  const sceneLibraryImages = [
    'https://readdy.ai/api/search-image?query=empty%20modern%20living%20room%20with%20large%20windows%2C%20wooden%20floor%2C%20white%20walls%2C%20natural%20light%2C%20ready%20for%20furniture%20placement%2C%20professional%20interior%20photography&width=400&height=400&seq=soft-scene-living-1&orientation=squarish',
    'https://readdy.ai/api/search-image?query=empty%20modern%20bedroom%20with%20large%20window%2C%20wooden%20floor%2C%20neutral%20walls%2C%20natural%20light%2C%20ready%20for%20decoration%2C%20professional%20interior%20photography&width=400&height=400&seq=soft-scene-bedroom-1&orientation=squarish',
    'https://readdy.ai/api/search-image?query=empty%20modern%20dining%20room%20with%20pendant%20light%20fixture%2C%20wooden%20floor%2C%20white%20walls%2C%20ready%20for%20furniture%2C%20professional%20interior%20photography&width=400&height=400&seq=soft-scene-dining-1&orientation=squarish',
    'https://readdy.ai/api/search-image?query=empty%20modern%20study%20room%20with%20built-in%20shelves%2C%20wooden%20floor%2C%20large%20window%2C%20ready%20for%20desk%20and%20furniture%2C%20professional%20interior%20photography&width=400&height=400&seq=soft-scene-study-1&orientation=squarish',
  ];

  const [selectedAlbumImage, setSelectedAlbumImage] = useState<string | null>(null);
  const [selectBoxPosition, setSelectBoxPosition] = useState({ x: 20, y: 20, width: 60, height: 60 });

  // 打开上传
  const handleOpenUpload = (type: 'scene' | 'item') => {
    setCurrentUploadType(type);
    setShowActionSheet(true);
  };

  // 处理Action Sheet选项
  const handleActionSheetOption = (option: string) => {
    setShowActionSheet(false);
    switch (option) {
      case 'camera':
        setTimeout(() => {
          if (currentUploadType === 'scene') {
            setSceneImage('https://readdy.ai/api/search-image?query=modern%20empty%20living%20room%20interior%20with%20large%20windows%20and%20wooden%20floor%2C%20bright%20natural%20light%2C%20minimalist%20space%20ready%20for%20soft%20decoration%2C%20professional%20interior%20photography&width=800&height=600&seq=soft-camera-scene-' + Date.now() + '&orientation=landscape');
          } else {
            if (uploadedItems.length < 3) {
              setUploadedItems([...uploadedItems, {
                id: `item-${Date.now()}`,
                image: 'https://readdy.ai/api/search-image?query=modern%20furniture%20piece%20isolated%20on%20pure%20white%20background%2C%20clean%20product%20photography%2C%20professional%20studio%20lighting&width=400&height=400&seq=soft-camera-item-' + Date.now() + '&orientation=squarish'
              }]);
            }
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
    if (selectedAlbumImage) {
      if (currentUploadType === 'scene') {
        setSceneImage(selectedAlbumImage);
      } else {
        if (uploadedItems.length < 3) {
          setUploadedItems([...uploadedItems, {
            id: `item-${Date.now()}`,
            image: selectedAlbumImage
          }]);
        }
      }
      setShowAlbumPicker(false);
      setSelectedAlbumImage(null);
    }
  };

  // 从SKU选择
  const handleSkuSelect = (product: typeof furnitureProducts[0]) => {
    if (currentUploadType === 'scene') {
      setSceneImage(product.image);
    } else {
      if (uploadedItems.length < 3) {
        setUploadedItems([...uploadedItems, {
          id: `item-${Date.now()}`,
          image: product.image
        }]);
      }
    }
    setShowSkuPicker(false);
  };

  // 从公库选择
  const handlePublicSelect = (imageUrl: string) => {
    if (currentUploadType === 'scene') {
      setSceneImage(imageUrl);
    } else {
      if (uploadedItems.length < 3) {
        setUploadedItems([...uploadedItems, {
          id: `item-${Date.now()}`,
          image: imageUrl
        }]);
      }
    }
    setShowPublicLibrary(false);
  };

  // 删除单品
  const handleRemoveItem = (id: string) => {
    setUploadedItems(uploadedItems.filter(item => item.id !== id));
  };

  // 删除选中的chips
  const handleRemoveHouseStatus = () => setHouseStatus(null);
  const handleRemoveSpace = () => setSelectedSpace(null);
  const handleRemoveStyle = () => setSelectedStyle(null);

  // 开始搭配
  const handleStartMatch = () => {
    if (!sceneImage) return;
    setShowConfirmModal(true);
  };

  // 确认搭配
  const handleConfirmMatch = () => {
    setShowConfirmModal(false);
    setGenerateStatus('generating');

    setTimeout(() => {
      const success = Math.random() > 0.2;
      if (success) {
        const generated: string[] = [];
        for (let i = 0; i < selectedCount; i++) {
          generated.push(`https://readdy.ai/api/search-image?query=beautifully%20decorated%20modern%20living%20room%20with%20elegant%20furniture%20arrangement%2C%20professional%20interior%20design%2C%20harmonious%20color%20scheme%2C%20natural%20lighting%2C%20high%20quality%20render%2C%20$%7BselectedStyle%20%7C%7C%20minimalist%7D%20style&width=800&height=600&seq=soft-result-${Date.now()}-${i}&orientation=landscape`);
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

  // 获取选项名称
  const getHouseStatusName = () => houseStatusOptions.find(o => o.id === houseStatus)?.name || '';
  const getSpaceName = () => spaceOptions.find(o => o.id === selectedSpace)?.name || '';
  const getStyleName = () => styleOptions.find(o => o.id === selectedStyle)?.name || '';

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
          <h1 className="font-semibold text-[17px] text-[#1C1C1E]">软装搭配方案</h1>
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
        className="px-4 pt-4 pb-[calc(140px+env(safe-area-inset-bottom))]"
        style={{ marginTop: 'calc(44px + env(safe-area-inset-top))' }}
      >
        {/* 生成状态显示 */}
        {generateStatus !== 'idle' && (
          <div className="mb-4">
            {generateStatus === 'generating' && (
              <div className="bg-white rounded-[16px] p-6 text-center shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="absolute inset-0 border-4 border-[#E5E5EA] rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-[#FF9500] rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-[15px] text-[#1C1C1E] font-medium mb-1">正在生成搭配方案...</p>
                <p className="text-[13px] text-[#8E8E93] mb-4">预计需要 20-60 秒</p>
              </div>
            )}

            {generateStatus === 'success' && (
              <div className="bg-white rounded-[16px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-[#34C759] rounded-full flex items-center justify-center">
                    <i className="ri-check-line text-white text-sm"></i>
                  </div>
                  <span className="text-[15px] text-[#1C1C1E] font-medium">搭配成功</span>
                </div>
                <div className="space-y-2 mb-4">
                  {generatedImages.map((img, idx) => (
                    <div key={idx} className="aspect-[4/3] rounded-[12px] overflow-hidden bg-[#F2F2F7]">
                      <img src={img} alt={`搭配结果${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleRetry}
                    className="flex-1 h-11 bg-white border border-[#D2D2D7] text-[#1D1D1F] rounded-[14px] text-[14px] font-medium cursor-pointer hover:bg-[#F5F5F7] active:bg-[#F5F5F7] transition-colors whitespace-nowrap"
                  >
                    重新搭配
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
              <div className="bg-white rounded-[16px] p-6 text-center shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#FF3B30]/10 rounded-full flex items-center justify-center">
                  <i className="ri-close-circle-line text-[32px] text-[#FF3B30]"></i>
                </div>
                <p className="text-[15px] text-[#1C1C1E] font-medium mb-1">搭配失败</p>
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

        {/* 主要内容 */}
        {generateStatus === 'idle' && (
          <>
            {/* 场景上传卡片 */}
            <div className="bg-white rounded-[16px] overflow-hidden mb-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              {sceneImage ? (
                <div className="relative">
                  <div className="aspect-[4/3]">
                    <img 
                      src={sceneImage} 
                      alt="场景图" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* 删除按钮 */}
                  <button 
                    onClick={() => setSceneImage(null)}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors"
                  >
                    <i className="ri-delete-bin-line text-white text-base"></i>
                  </button>
                  {/* 全屏选框按钮 */}
                  <button 
                    onClick={() => setShowFullscreenSelect(true)}
                    className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full flex items-center gap-1.5 cursor-pointer hover:bg-black/70 transition-colors"
                  >
                    <i className="ri-focus-3-line text-white text-sm"></i>
                    <span className="text-[12px] text-white font-medium">全屏选框</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => handleOpenUpload('scene')}
                  className="w-full aspect-[4/3] flex flex-col items-center justify-center cursor-pointer hover:bg-[#F2F2F7] transition-colors"
                >
                  <div className="w-16 h-16 bg-[#F2F2F7] rounded-full flex items-center justify-center mb-3">
                    <i className="ri-add-line text-[32px] text-[#8E8E93]"></i>
                  </div>
                  <p className="text-[15px] text-[#1C1C1E] font-medium mb-1">请上传场景</p>
                  <p className="text-[13px] text-[#8E8E93]">上传后可"全屏选框"</p>
                </button>
              )}
            </div>

            {/* 是否清空场景开关 */}
            <div className="bg-white rounded-[12px] p-4 mb-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#1C1C1E] font-medium">是否清空场景</span>
                <button 
                  onClick={() => setClearScene(!clearScene)}
                  className={`w-[51px] h-[31px] rounded-full transition-all cursor-pointer ${
                    clearScene ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'
                  }`}
                >
                  <div className={`w-[27px] h-[27px] bg-white rounded-full shadow-sm transition-transform ${
                    clearScene ? 'translate-x-[22px]' : 'translate-x-[2px]'
                  }`}></div>
                </button>
              </div>
            </div>

            {/* 三项下拉胶囊 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {/* 房屋现状 */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowHouseDropdown(!showHouseDropdown);
                    setShowSpaceDropdown(false);
                    setShowStyleDropdown(false);
                  }}
                  className={`h-9 px-4 rounded-full flex items-center gap-1.5 cursor-pointer transition-colors ${
                    houseStatus 
                      ? 'bg-[#F5F5F7] text-[#FF9500] border border-[#FF9500]/30' 
                      : 'bg-white border border-[#D2D2D7] text-[#1D1D1F] hover:bg-[#F5F5F7]'
                  }`}
                >
                  <span className="text-[14px]">{houseStatus ? getHouseStatusName() : '房屋现状'}</span>
                  <i className={`ri-arrow-${showHouseDropdown ? 'up' : 'down'}-s-line text-sm`}></i>
                </button>
                {showHouseDropdown && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowHouseDropdown(false)}></div>
                    <div className="absolute top-full left-0 mt-1 bg-white rounded-[12px] shadow-lg overflow-hidden z-40 w-28">
                      {houseStatusOptions.map(option => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setHouseStatus(option.id);
                            setShowHouseDropdown(false);
                          }}
                          className={`w-full h-11 text-[14px] text-left px-4 cursor-pointer transition-colors ${
                            houseStatus === option.id 
                              ? 'bg-[#F5F5F7] text-[#FF9500]' 
                              : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'
                          }`}
                        >
                          {option.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* 选择空间 */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowSpaceDropdown(!showSpaceDropdown);
                    setShowHouseDropdown(false);
                    setShowStyleDropdown(false);
                  }}
                  className={`h-9 px-4 rounded-full flex items-center gap-1.5 cursor-pointer transition-colors ${
                    selectedSpace 
                      ? 'bg-[#F5F5F7] text-[#FF9500] border border-[#FF9500]/30' 
                      : 'bg-white border border-[#D2D2D7] text-[#1D1D1F] hover:bg-[#F5F5F7]'
                  }`}
                >
                  <span className="text-[14px]">{selectedSpace ? getSpaceName() : '选择空间'}</span>
                  <i className={`ri-arrow-${showSpaceDropdown ? 'up' : 'down'}-s-line text-sm`}></i>
                </button>
                {showSpaceDropdown && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowSpaceDropdown(false)}></div>
                    <div className="absolute top-full left-0 mt-1 bg-white rounded-[12px] shadow-lg overflow-hidden z-40 w-28">
                      {spaceOptions.map(option => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setSelectedSpace(option.id);
                            setShowSpaceDropdown(false);
                          }}
                          className={`w-full h-11 text-[14px] text-left px-4 cursor-pointer transition-colors ${
                            selectedSpace === option.id 
                              ? 'bg-[#F5F5F7] text-[#FF9500]' 
                              : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'
                          }`}
                        >
                          {option.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* 选择风格 */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowStyleDropdown(!showStyleDropdown);
                    setShowHouseDropdown(false);
                    setShowSpaceDropdown(false);
                  }}
                  className={`h-9 px-4 rounded-full flex items-center gap-1.5 cursor-pointer transition-colors ${
                    selectedStyle 
                      ? 'bg-[#F5F5F7] text-[#FF9500] border border-[#FF9500]/30' 
                      : 'bg-white border border-[#D2D2D7] text-[#1D1D1F] hover:bg-[#F5F5F7]'
                  }`}
                >
                  <span className="text-[14px]">{selectedStyle ? getStyleName() : '选择风格'}</span>
                  <i className={`ri-arrow-${showStyleDropdown ? 'up' : 'down'}-s-line text-sm`}></i>
                </button>
                {showStyleDropdown && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowStyleDropdown(false)}></div>
                    <div className="absolute top-full left-0 mt-1 bg-white rounded-[12px] shadow-lg overflow-hidden z-40 w-28">
                      {styleOptions.map(option => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setSelectedStyle(option.id);
                            setShowStyleDropdown(false);
                          }}
                          className={`w-full h-11 text-[14px] text-left px-4 cursor-pointer transition-colors ${
                            selectedStyle === option.id 
                              ? 'bg-[#F5F5F7] text-[#FF9500]' 
                              : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'
                          }`}
                        >
                          {option.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 已选择的Chips */}
            {(houseStatus || selectedSpace || selectedStyle) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {houseStatus && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF9500]/10 rounded-full">
                    <span className="text-[13px] text-[#FF9500] font-medium">{getHouseStatusName()}</span>
                    <button 
                      onClick={handleRemoveHouseStatus}
                      className="w-4 h-4 flex items-center justify-center cursor-pointer hover:opacity-70"
                    >
                      <i className="ri-close-line text-[#FF9500] text-sm"></i>
                    </button>
                  </div>
                )}
                {selectedSpace && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF9500]/10 rounded-full">
                    <span className="text-[13px] text-[#FF9500] font-medium">{getSpaceName()}</span>
                    <button 
                      onClick={handleRemoveSpace}
                      className="w-4 h-4 flex items-center justify-center cursor-pointer hover:opacity-70"
                    >
                      <i className="ri-close-line text-[#FF9500] text-sm"></i>
                    </button>
                  </div>
                )}
                {selectedStyle && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF9500]/10 rounded-full">
                    <span className="text-[13px] text-[#FF9500] font-medium">{getStyleName()}</span>
                    <button 
                      onClick={handleRemoveStyle}
                      className="w-4 h-4 flex items-center justify-center cursor-pointer hover:opacity-70"
                    >
                      <i className="ri-close-line text-[#FF9500] text-sm"></i>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 单品上传区域 */}
            <div className="bg-white rounded-[12px] p-4 mb-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[14px] text-[#1C1C1E] font-medium">上传单品</span>
                <span className="text-[12px] text-[#8E8E93]">最多3个</span>
              </div>
              <div className="flex gap-3">
                {/* 已上传的单品 */}
                {uploadedItems.map(item => (
                  <div key={item.id} className="relative w-20 h-20 rounded-[8px] overflow-hidden bg-[#F2F2F7]">
                    <img src={item.image} alt="单品" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => handleRemoveItem(item.id)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/70"
                    >
                      <i className="ri-close-line text-white text-xs"></i>
                    </button>
                  </div>
                ))}
                {/* 添加按钮 */}
                {uploadedItems.length < 3 && (
                  <button 
                    onClick={() => handleOpenUpload('item')}
                    className="w-20 h-20 border-2 border-dashed border-[#C6C6C8] rounded-[8px] flex flex-col items-center justify-center cursor-pointer hover:border-[#FF9500] hover:bg-[#FF9500]/5 transition-all"
                  >
                    <i className="ri-add-line text-[20px] text-[#8E8E93] mb-0.5"></i>
                    <span className="text-[10px] text-[#8E8E93]">请上传单品</span>
                  </button>
                )}
              </div>
            </div>

            {/* 细节输入框 */}
            <div className="bg-white rounded-[12px] p-4 mb-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <textarea
                    value={detailNote}
                    onChange={(e) => setDetailNote(e.target.value.slice(0, 500))}
                    placeholder="请输入需要注意的细节..."
                    className="w-full h-20 text-[14px] text-[#1C1C1E] placeholder-[#C6C6C8] resize-none outline-none"
                  />
                  <div className="flex justify-end">
                    <span className="text-[11px] text-[#8E8E93]">{detailNote.length}/500</span>
                  </div>
                </div>
                <div className="w-8 h-8 flex items-center justify-center">
                  <i className="ri-pencil-line text-[#8E8E93] text-lg"></i>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 底部固定操作栏 */}
      {generateStatus === 'idle' && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#E5E5EA]"
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
                        className={`w-full h-11 text-[14px] cursor-pointer transition-colors ${
                          selectedCount === num 
                            ? 'bg-[#FF9500]/10 text-[#FF9500]' 
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
            {/* 立即搭配按钮 */}
            <button
              onClick={handleStartMatch}
              disabled={!sceneImage}
              className={`flex-1 h-12 rounded-[16px] text-[16px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                sceneImage
                  ? 'bg-white border border-[#D2D2D7] text-[#1D1D1F] hover:bg-[#F5F5F7] active:bg-[#F5F5F7]'
                  : 'bg-[#E5E5EA] text-[#8E8E93] cursor-not-allowed border border-transparent'
              }`}
            >
              立即搭配（消耗积分 {creditCost}）
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
                className="w-full h-14 text-[17px] text-[#FF9500] border-b border-[#E5E5EA] cursor-pointer hover:bg-[#F2F2F7] transition-colors"
              >
                拍摄
              </button>
              <button 
                onClick={() => handleActionSheetOption('album')}
                className="w-full h-14 text-[17px] text-[#FF9500] border-b border-[#E5E5EA] cursor-pointer hover:bg-[#F2F2F7] transition-colors"
              >
                从相册选择
              </button>
              <button 
                onClick={() => handleActionSheetOption('sku')}
                className="w-full h-14 text-[17px] text-[#FF9500] border-b border-[#E5E5EA] cursor-pointer hover:bg-[#F2F2F7] transition-colors"
              >
                从产品选择SKU
              </button>
              <button 
                onClick={() => handleActionSheetOption('public')}
                className="w-full h-14 text-[17px] text-[#FF9500] cursor-pointer hover:bg-[#F2F2F7] transition-colors"
              >
                从公库选择
              </button>
            </div>
            <button 
              onClick={() => setShowActionSheet(false)}
              className="w-full h-14 bg-white/95 backdrop-blur-xl rounded-[14px] text-[17px] text-[#FF9500] font-semibold cursor-pointer hover:bg-[#F2F2F7] transition-colors"
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
                className="text-[17px] text-[#FF9500] cursor-pointer"
              >
                取消
              </button>
              <h1 className="font-semibold text-[17px] text-[#1C1C1E]">
                {currentUploadType === 'scene' ? '选择场景图' : '选择单品图'}
              </h1>
              <button 
                onClick={handleAlbumSelect}
                disabled={!selectedAlbumImage}
                className={`text-[17px] font-semibold cursor-pointer ${
                  selectedAlbumImage ? 'text-[#FF9500]' : 'text-[#C6C6C8]'
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
            <div className="px-3 mb-3">
              <p className="text-[13px] text-[#8E8E93]">最近项目</p>
            </div>
            <div className="grid grid-cols-3 gap-0.5">
              {(currentUploadType === 'scene' ? sceneLibraryImages : albumImages).map((img, idx) => (
                <div 
                  key={idx}
                  onClick={() => setSelectedAlbumImage(img)}
                  className={`relative aspect-square cursor-pointer ${
                    selectedAlbumImage === img ? 'ring-2 ring-[#FF9500] ring-inset' : ''
                  }`}
                >
                  <img src={img} alt={`相册${idx + 1}`} className="w-full h-full object-cover" />
                  {selectedAlbumImage === img && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-[#FF9500] rounded-full flex items-center justify-center">
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
                  <p className="text-[12px] text-[#8E8E93] mt-0.5">
                    {currentUploadType === 'scene' ? '建议上传空间清晰的场景图' : '建议上传白底图效果更佳'}
                  </p>
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
                className="text-[17px] text-[#FF9500] cursor-pointer"
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
                className="text-[17px] text-[#FF9500] cursor-pointer"
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
              {(currentUploadType === 'scene' ? sceneLibraryImages : publicLibraryImages).map((img, idx) => (
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

      {/* 全屏选框模式 */}
      {showFullscreenSelect && sceneImage && (
        <div className="fixed inset-0 z-50 bg-black">
          <nav 
            className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <div className="h-11 px-4 flex items-center justify-between">
              <button 
                onClick={() => setShowFullscreenSelect(false)}
                className="text-[17px] text-white cursor-pointer"
              >
                取消
              </button>
              <h1 className="font-semibold text-[17px] text-white">选择搭配区域</h1>
              <button 
                onClick={() => setShowFullscreenSelect(false)}
                className="text-[17px] text-[#FF9500] font-semibold cursor-pointer"
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
            <div className="relative w-full aspect-[4/3] mx-4">
              <img 
                src={sceneImage} 
                alt="场景" 
                className="w-full h-full object-contain"
              />
              {/* 选框 */}
              <div 
                className="absolute border-2 border-[#FF3B30] bg-[#FF3B30]/10"
                style={{
                  left: `${selectBoxPosition.x}%`,
                  top: `${selectBoxPosition.y}%`,
                  width: `${selectBoxPosition.width}%`,
                  height: `${selectBoxPosition.height}%`
                }}
              >
                {/* 四角标记 */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-[#FF3B30] rounded-sm"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF3B30] rounded-sm"></div>
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-[#FF3B30] rounded-sm"></div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#FF3B30] rounded-sm"></div>
                {/* 序号标记 */}
                <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#FF3B30] rounded-full flex items-center justify-center">
                  <span className="text-[12px] text-white font-bold">1</span>
                </div>
              </div>
            </div>
          </div>

          <div 
            className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl px-4 py-4"
            style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
          >
            <p className="text-center text-[14px] text-white/80">
              拖动红框选择需要搭配的区域
            </p>
          </div>
        </div>
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
              <h3 className="text-[17px] font-semibold text-[#1C1C1E] mb-2">确认搭配</h3>
              <p className="text-[13px] text-[#8E8E93]">
                本次搭配将消耗 <span className="text-[#FF9500] font-medium">{creditCost}</span> 积分
              </p>
              <p className="text-[13px] text-[#8E8E93] mt-1">
                当前积分余额：{userCredits}
              </p>
            </div>
            <div className="flex border-t border-[#E5E5EA]">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 h-11 text-[17px] text-[#FF9500] border-r border-[#E5E5EA] cursor-pointer hover:bg-[#F2F2F7] transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleConfirmMatch}
                className="flex-1 h-11 text-[17px] text-[#FF9500] font-semibold cursor-pointer hover:bg-[#F2F2F7] transition-colors"
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
