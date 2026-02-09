import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  furnitureCategories,
  furnitureProductsExtended,
  fabricOptions,
  materialColorOptions,
} from '../../../mocks/aiMaterials';

interface MarkPoint {
  id: string;
  x: number;
  y: number;
  name: string;
  replacementImage?: string;
  replacementSource?: 'upload' | 'product';
  replacementProductName?: string;
  replacementSpec?: string;
  replacementFabric?: string;
  replacementColor?: string;
  replacementDetail?: string;
  replacementParts?: string[];
  customPrompt?: string;
}

export default function FurnitureReplacePage() {
  const navigate = useNavigate();
  const [sceneImage, setSceneImage] = useState<string>('');
  const [whiteBackgroundEnabled, setWhiteBackgroundEnabled] = useState(false);
  const [whiteBackgroundImage, setWhiteBackgroundImage] = useState<string>('');
  const [whiteBackgroundStatus, setWhiteBackgroundStatus] = useState<'idle' | 'generating' | 'success' | 'failed'>('idle');
  const [recognitionStatus, setRecognitionStatus] = useState<'idle' | 'recognizing' | 'success' | 'failed'>('idle');
  const [markPoints, setMarkPoints] = useState<MarkPoint[]>([]);
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]);
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [showWhiteBackgroundCompare, setShowWhiteBackgroundCompare] = useState(false);
  const [compareViewMode, setCompareViewMode] = useState<'original' | 'whitebg'>('original');
  const [generateCount, setGenerateCount] = useState(1);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState<string | null>(null);
  const [editingPointName, setEditingPointName] = useState<string | null>(null);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [showGenerateCountSheet, setShowGenerateCountSheet] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 产品选择器状态（场景图来源）
  const [showSceneProductSelector, setShowSceneProductSelector] = useState(false);
  const [sceneProductStep, setSceneProductStep] = useState<'list' | 'detail'>('list');
  const [sceneSearchText, setSceneSearchText] = useState('');
  const [sceneActiveCategory, setSceneActiveCategory] = useState('all');
  const [scenePendingProduct, setScenePendingProduct] = useState<typeof furnitureProductsExtended[0] | null>(null);
  const [sceneSelectedSpec, setSceneSelectedSpec] = useState('');
  const [sceneSelectedFabric, setSceneSelectedFabric] = useState('');
  const [sceneSelectedColor, setSceneSelectedColor] = useState('');

  // 替换产品选择器状态（标记点用）
  const [replaceProductStep, setReplaceProductStep] = useState<'list' | 'detail'>('list');
  const [replaceSearchText, setReplaceSearchText] = useState('');
  const [replaceActiveCategory, setReplaceActiveCategory] = useState('all');
  const [replacePendingProduct, setReplacePendingProduct] = useState<typeof furnitureProductsExtended[0] | null>(null);
  const [replaceSelectedSpec, setReplaceSelectedSpec] = useState('');
  const [replaceSelectedFabric, setReplaceSelectedFabric] = useState('');
  const [replaceSelectedColor, setReplaceSelectedColor] = useState('');

  // 筛选产品（场景图）
  const filteredSceneProducts = useMemo(() => {
    return furnitureProductsExtended.filter((p) => {
      const matchCategory = sceneActiveCategory === 'all' || p.category === sceneActiveCategory;
      const matchSearch =
        sceneSearchText === '' ||
        p.name.toLowerCase().includes(sceneSearchText.toLowerCase()) ||
        p.sku.toLowerCase().includes(sceneSearchText.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [sceneActiveCategory, sceneSearchText]);

  // 筛选产品（替换用）
  const filteredReplaceProducts = useMemo(() => {
    return furnitureProductsExtended.filter((p) => {
      const matchCategory = replaceActiveCategory === 'all' || p.category === replaceActiveCategory;
      const matchSearch =
        replaceSearchText === '' ||
        p.name.toLowerCase().includes(replaceSearchText.toLowerCase()) ||
        p.sku.toLowerCase().includes(replaceSearchText.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [replaceActiveCategory, replaceSearchText]);

  // 获取面料和颜色
  const getProductFabrics = (product: typeof furnitureProductsExtended[0]) => {
    if (!product?.fabrics?.length) return [];
    return fabricOptions.filter((f) => product.fabrics.includes(f.id));
  };
  const getProductColors = (product: typeof furnitureProductsExtended[0]) => {
    if (!product?.colors?.length) return [];
    return materialColorOptions.filter((c) => product.colors.includes(c.id));
  };
  const getSceneSelectionSummary = () => {
    const parts: string[] = [];
    if (sceneSelectedSpec) parts.push(sceneSelectedSpec);
    if (sceneSelectedFabric) {
      const fabric = fabricOptions.find((f) => f.id === sceneSelectedFabric);
      if (fabric) parts.push(fabric.name);
    }
    if (sceneSelectedColor) {
      const color = materialColorOptions.find((c) => c.id === sceneSelectedColor);
      if (color) parts.push(color.name);
    }
    return parts.join(' · ');
  };

  const getReplaceSelectionSummary = () => {
    const parts: string[] = [];
    if (replaceSelectedSpec) parts.push(replaceSelectedSpec);
    if (replaceSelectedFabric) {
      const fabric = fabricOptions.find((f) => f.id === replaceSelectedFabric);
      if (fabric) parts.push(fabric.name);
    }
    if (replaceSelectedColor) {
      const color = materialColorOptions.find((c) => c.id === replaceSelectedColor);
      if (color) parts.push(color.name);
    }
    return parts.join(' · ');
  };

  const currentSceneFabrics = scenePendingProduct ? getProductFabrics(scenePendingProduct) : [];
  const currentSceneColors = scenePendingProduct ? getProductColors(scenePendingProduct) : [];
  const currentReplaceFabrics = replacePendingProduct ? getProductFabrics(replacePendingProduct) : [];
  const currentReplaceColors = replacePendingProduct ? getProductColors(replacePendingProduct) : [];

  // 打开产品详情（场景图）
  const handleOpenSceneProductDetail = (product: typeof furnitureProductsExtended[0]) => {
    setScenePendingProduct(product);
    setSceneSelectedSpec(product.specs[0] || '');
    const fabrics = getProductFabrics(product);
    const colors = getProductColors(product);
    setSceneSelectedFabric(fabrics.length > 0 ? fabrics[0].id : '');
    setSceneSelectedColor(colors.length > 0 ? colors[0].id : '');
    setSceneProductStep('detail');
  };

  // 打开产品详情（替换用）
  const handleOpenReplaceProductDetail = (product: typeof furnitureProductsExtended[0]) => {
    setReplacePendingProduct(product);
    setReplaceSelectedSpec(product.specs[0] || '');
    const fabrics = getProductFabrics(product);
    const colors = getProductColors(product);
    setReplaceSelectedFabric(fabrics.length > 0 ? fabrics[0].id : '');
    setReplaceSelectedColor(colors.length > 0 ? colors[0].id : '');
    setReplaceProductStep('detail');
  };

  // 确认选择产品作为场景图
  const handleConfirmSceneProduct = () => {
    if (scenePendingProduct) {
      setSceneImage(scenePendingProduct.image);
      setShowSceneProductSelector(false);
      setShowActionSheet(false);
      setSceneProductStep('list');
      setScenePendingProduct(null);
      setSceneSelectedSpec('');
      setSceneSelectedFabric('');
      setSceneSelectedColor('');

      if (whiteBackgroundEnabled) {
        generateWhiteBackground(scenePendingProduct.image);
      } else {
        recognizeFurniture(scenePendingProduct.image);
      }
    }
  };

  // 确认选择产品作为替换图
  const handleConfirmReplaceProduct = () => {
    if (replacePendingProduct && showProductSelector) {
      const fabricName = replaceSelectedFabric ? fabricOptions.find(f => f.id === replaceSelectedFabric)?.name : '';
      const colorName = replaceSelectedColor ? materialColorOptions.find(c => c.id === replaceSelectedColor)?.name : '';
      
      setMarkPoints(
        markPoints.map((p) =>
          p.id === showProductSelector
            ? {
                ...p,
                replacementImage: replacePendingProduct.image,
                replacementSource: 'product',
                replacementProductName: replacePendingProduct.name,
                replacementSpec: replaceSelectedSpec,
                replacementFabric: fabricName,
                replacementColor: colorName,
                replacementParts: p.replacementParts || ['whole'],
              }
            : p
        )
      );
      closeReplaceProductSelector();
    }
  };

  // 关闭场景产品选择器
  const closeSceneProductSelector = () => {
    setShowSceneProductSelector(false);
    setSceneProductStep('list');
    setScenePendingProduct(null);
    setSceneSelectedSpec('');
    setSceneSelectedFabric('');
    setSceneSelectedColor('');
  };

  // 关闭替换产品选择器
  const closeReplaceProductSelector = () => {
    setShowProductSelector(null);
    setReplaceProductStep('list');
    setReplacePendingProduct(null);
    setReplaceSelectedSpec('');
    setReplaceSelectedFabric('');
    setReplaceSelectedColor('');
    setReplaceSearchText('');
    setReplaceActiveCategory('all');
  };

  // 模拟上传图片
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setSceneImage(imageUrl);
        setShowActionSheet(false);

        if (whiteBackgroundEnabled) {
          generateWhiteBackground(imageUrl);
        } else {
          recognizeFurniture(imageUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const generateWhiteBackground = (imageUrl: string) => {
    setWhiteBackgroundStatus('generating');
    setTimeout(() => {
      setWhiteBackgroundImage(imageUrl);
      setWhiteBackgroundStatus('success');
      showToastMessage('已启用白底图');
      recognizeFurniture(imageUrl);
    }, 2000);
  };

  const recognizeFurniture = (imageUrl: string) => {
    setRecognitionStatus('recognizing');
    setTimeout(() => {
      const mockPoints: MarkPoint[] = [
        { id: '1', x: 30, y: 40, name: '沙发', replacementParts: ['whole'] },
        { id: '2', x: 65, y: 35, name: '茶几', replacementParts: ['whole'] },
        { id: '3', x: 80, y: 60, name: '边几', replacementParts: ['whole'] },
      ];
      setMarkPoints(mockPoints);
      setRecognitionStatus('success');
    }, 1500);
  };

  const toggleWhiteBackground = () => {
    const newValue = !whiteBackgroundEnabled;
    setWhiteBackgroundEnabled(newValue);
    if (newValue && sceneImage && !whiteBackgroundImage) {
      generateWhiteBackground(sceneImage);
    }
  };

  const handleReRecognize = () => {
    const imageToUse = whiteBackgroundEnabled && whiteBackgroundImage ? whiteBackgroundImage : sceneImage;
    recognizeFurniture(imageToUse);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (recognitionStatus !== 'success') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const newPoint: MarkPoint = { id: Date.now().toString(), x, y, name: '家具', replacementParts: ['whole'] };
    setMarkPoints([...markPoints, newPoint]);
  };

  const handleDeletePoint = (pointId: string) => {
    setMarkPoints(markPoints.filter((p) => p.id !== pointId));
    setSelectedPoints(selectedPoints.filter((id) => id !== pointId));
  };

  const togglePointSelection = (pointId: string) => {
    if (selectedPoints.includes(pointId)) {
      setSelectedPoints(selectedPoints.filter((id) => id !== pointId));
    } else {
      if (selectedPoints.length < 3) {
        setSelectedPoints([...selectedPoints, pointId]);
      } else {
        showToastMessage('最多选择3个家具进行替换');
      }
    }
  };

  const handleReplacementImageUpload = (pointId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setMarkPoints(
          markPoints.map((p) =>
            p.id === pointId ? { ...p, replacementImage: imageUrl, replacementSource: 'upload' } : p
          )
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectFromProducts = (pointId: string) => {
    setShowProductSelector(pointId);
    setReplaceProductStep('list');
    setReplaceSearchText('');
    setReplaceActiveCategory('all');
  };

  // 获取配置摘要
  const getPointConfigSummary = (point: MarkPoint) => {
    const parts: string[] = [];
    if (point.replacementSpec) parts.push(point.replacementSpec);
    if (point.replacementFabric) parts.push(point.replacementFabric);
    if (point.replacementColor) parts.push(point.replacementColor);
    return parts.join(' · ');
  };

  // 获取默认提示词
  const getDefaultPrompt = (point: MarkPoint) => {
    const productInfo = point.replacementProductName 
      ? `${point.replacementProductName}${point.replacementSpec ? `（${point.replacementSpec}）` : ''}` 
      : '传入的家具';
    return `将图中的${point.name}替换为${productInfo}，保持整体风格协调，光影自然`;
  };

  // 更新自定义提示词
  const handleUpdateCustomPrompt = (pointId: string, prompt: string) => {
    setMarkPoints(
      markPoints.map((p) =>
        p.id === pointId ? { ...p, customPrompt: prompt } : p
      )
    );
  };

  // 重置为默认提示词
  const handleResetPrompt = (pointId: string) => {
    const point = markPoints.find(p => p.id === pointId);
    if (point) {
      setMarkPoints(
        markPoints.map((p) =>
          p.id === pointId ? { ...p, customPrompt: undefined } : p
        )
      );
    }
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const canGenerate = () => {
    if (!sceneImage) return false;
    if (selectedPoints.length === 0) return false;
    const selectedPointsData = markPoints.filter((p) => selectedPoints.includes(p.id));
    return selectedPointsData.every((p) => p.replacementImage);
  };

  const handleGenerate = () => {
    if (!canGenerate()) return;
    showToastMessage('开始生成替换效果...');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24">
      {/* Toast */}
      {showToast && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] bg-[#1D1D1F]/80 backdrop-blur-sm text-white px-6 py-3 rounded-2xl text-[14px] animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* 导航栏 */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="h-11 flex items-center justify-between px-4">
          <button onClick={() => navigate(-1)} className="flex items-center cursor-pointer">
            <i className="ri-arrow-left-s-line text-[22px] text-[#1D1D1F]"></i>
          </button>
          <h1 className="text-[17px] font-semibold text-[#1D1D1F]">家具替换</h1>
          <button className="w-8 h-8 flex items-center justify-center cursor-pointer">
            <i className="ri-more-2-fill text-[22px] text-[#1D1D1F]"></i>
          </button>
        </div>
      </nav>

      <div className="px-4 pt-4 space-y-3" style={{ marginTop: 'calc(44px + env(safe-area-inset-top))' }}>
        {/* 区域A：上传/场景图预览 */}
        <div className="bg-white rounded-2xl overflow-hidden">
          {!sceneImage ? (
            <div className="p-6">
              <div className="border-2 border-dashed border-[#E5E5EA] rounded-xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#F5F5F7] rounded-full flex items-center justify-center">
                  <i className="ri-image-line text-3xl text-[#C7C7CC]"></i>
                </div>
                <p className="text-[14px] text-[#6E6E73] mb-6">上传场景图片，自动识别家具并替换</p>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowActionSheet(true)}
                    className="w-full h-12 bg-white border border-[#D2D2D7] text-[#1D1D1F] rounded-[16px] font-medium cursor-pointer active:bg-[#F5F5F7] transition-colors whitespace-nowrap"
                  >
                    选择照片
                  </button>
                  <button
                    onClick={() => setShowActionSheet(true)}
                    className="w-full h-12 bg-[#F5F5F7] text-[#1D1D1F] rounded-[16px] font-medium cursor-pointer active:bg-[#E5E5EA] transition-colors whitespace-nowrap"
                  >
                    拍照上传
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute top-3 right-3 z-10">
                {recognitionStatus === 'idle' && (
                  <div className="px-3 py-1 bg-[#6E6E73]/90 text-white text-[12px] rounded-full">未识别</div>
                )}
                {recognitionStatus === 'recognizing' && (
                  <div className="px-3 py-1 bg-[#1D1D1F]/90 text-white text-[12px] rounded-full flex items-center gap-1">
                    <i className="ri-loader-4-line animate-spin"></i>识别中
                  </div>
                )}
                {recognitionStatus === 'success' && (
                  <div className="px-3 py-1 bg-[#34C759]/90 text-white text-[12px] rounded-full flex items-center gap-1">
                    <i className="ri-check-line"></i>已识别
                  </div>
                )}
                {recognitionStatus === 'failed' && (
                  <div className="px-3 py-1 bg-[#FF3B30]/90 text-white text-[12px] rounded-full flex items-center gap-1">
                    <i className="ri-close-line"></i>识别失败
                  </div>
                )}
              </div>

              <div className="relative aspect-[4/3] bg-[#F5F5F7] cursor-pointer" onClick={handleImageClick}>
                <img
                  src={whiteBackgroundEnabled && whiteBackgroundImage ? whiteBackgroundImage : sceneImage}
                  alt="场景图"
                  className="w-full h-full object-contain"
                />
                {recognitionStatus === 'recognizing' && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-center text-white">
                      <i className="ri-loader-4-line text-[4xl] animate-spin mb-2"></i>
                      <p className="text-[14px]">正在识别家具...</p>
                    </div>
                  </div>
                )}
                {recognitionStatus === 'success' &&
                  markPoints.map((point) => (
                    <div
                      key={point.id}
                      className="absolute"
                      style={{ left: `${point.x}%`, top: `${point.y}%`, transform: 'translate(-50%, -50%)' }}
                    >
                      <div
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                          selectedPoints.includes(point.id)
                            ? 'bg-[#1D1D1F] border-[#1D1D1F] text-white'
                            : 'bg-white border-[#1D1D1F] text-[#1D1D1F]'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePointSelection(point.id);
                        }}
                      >
                        <i className="ri-focus-3-line text-sm"></i>
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 bg-[#1D1D1F]/80 text-white text-[11px] rounded whitespace-nowrap">
                        {point.name}
                      </div>
                    </div>
                  ))}
              </div>

              <div className="p-3 border-t border-[#E5E5EA] flex items-center gap-2">
                <button
                  onClick={() => setShowActionSheet(true)}
                  className="flex-1 h-10 bg-white border border-[#D2D2D7] text-[#1D1D1F] rounded-[14px] text-[14px] font-medium cursor-pointer active:bg-[#F5F5F7] transition-colors whitespace-nowrap"
                >
                  重新选择
                </button>
                {recognitionStatus === 'success' && (
                  <>
                    <button
                      onClick={handleReRecognize}
                      className="flex-1 h-10 bg-white border border-[#D2D2D7] text-[#1D1D1F] rounded-[14px] text-[14px] font-medium cursor-pointer active:bg-[#F5F5F7] transition-colors whitespace-nowrap"
                    >
                      重新识别
                    </button>
                    <button
                      onClick={() => setIsFullscreenMode(true)}
                      className="h-10 px-4 bg-white border border-[#D2D2D7] text-[#1D1D1F] rounded-[14px] text-[14px] font-medium cursor-pointer active:bg-[#F5F5F7] transition-colors whitespace-nowrap"
                    >
                      全屏选点
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 区域B：白底图开关 */}
        {sceneImage && (
          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[15px] font-medium text-[#1D1D1F]">
                    生成白底图（替换更精准）
                  </span>
                  {whiteBackgroundStatus === 'generating' && (
                    <i className="ri-loader-4-line text-[14px] text-[#1D1D1F] animate-spin"></i>
                  )}
                  {whiteBackgroundStatus === 'success' && (
                    <i className="ri-check-line text-[14px] text-[#34C759]"></i>
                  )}
                  {whiteBackgroundStatus === 'failed' && (
                    <i className="ri-close-line text-[14px] text-[#FF3B30]"></i>
                  )}
                </div>
                <p className="text-[13px] text-[#6E6E73]">
                  开启后将自动生成白底图并用于识别与替换
                </p>
              </div>
              <button
                onClick={toggleWhiteBackground}
                className={`relative w-[51px] h-[31px] rounded-full transition-colors cursor-pointer ${
                  whiteBackgroundEnabled ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'
                }`}
              >
                <div
                  className={`absolute top-[2px] w-[27px] h-[27px] bg-white rounded-full shadow transition-transform ${
                    whiteBackgroundEnabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-[13px] text-[#1D1D1F] cursor-pointer">了解详情</button>
              {whiteBackgroundImage && (
                <button
                  onClick={() => setShowWhiteBackgroundCompare(true)}
                  className="text-[13px] text-[#1D1D1F] cursor-pointer"
                >
                  查看白底图
                </button>
              )}
              {whiteBackgroundStatus === 'failed' && (
                <button
                  onClick={() => generateWhiteBackground(sceneImage)}
                  className="text-[13px] text-[#1D1D1F] cursor-pointer"
                >
                  重试生成白底图
                </button>
              )}
            </div>
          </div>
        )}

        {/* 区域C：识别失败 */}
        {sceneImage && recognitionStatus === 'failed' && (
          <div className="bg-white rounded-2xl p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-[#F5F5F7] rounded-full flex items-center justify-center">
              <i className="ri-error-warning-line text-3xl text-[#C7C7CC]"></i>
            </div>
            <p className="text-[14px] text-[#6E6E73] mb-4">未识别到家具</p>
            <div className="flex gap-2">
              <button
                onClick={handleReRecognize}
                className="flex-1 h-11 bg-white border border-[#D2D2D7] text-[#1D1D1F] rounded-[14px] text-[14px] font-medium cursor-pointer active:bg-[#F5F5F7] transition-colors whitespace-nowrap"
              >
                重新识别
              </button>
              <button
                onClick={() => setShowActionSheet(true)}
                className="flex-1 h-11 bg-white border border-[#D2D2D7] text-[#1D1D1F] rounded-[14px] text-[14px] font-medium cursor-pointer active:bg-[#F5F5F7] transition-colors whitespace-nowrap"
              >
                更换图片
              </button>
            </div>
          </div>
        )}

        {/* 区域D：替换配置 */}
        {recognitionStatus === 'success' && selectedPoints.length > 0 && (
          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-semibold text-[#1D1D1F]">替换配置</h3>
              <span className="text-[13px] text-[#6E6E73]">已选 {selectedPoints.length}/3</span>
            </div>
            <div className="space-y-3">
              {markPoints
                .filter((p) => selectedPoints.includes(p.id))
                .map((point) => (
                  <div key={point.id} className="border border-[#E5E5EA] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-3">
                      {editingPointName === point.id ? (
                        <input
                          type="text"
                          value={point.name}
                          onChange={(e) =>
                            setMarkPoints(
                              markPoints.map((p) =>
                                p.id === point.id ? { ...p, name: e.target.value } : p
                              )
                            )
                          }
                          onBlur={() => setEditingPointName(null)}
                          className="flex-1 text-[14px] font-medium border-b border-[#1D1D1F] outline-none"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-medium text-[#1D1D1F]">{point.name}</span>
                          <button
                            onClick={() => setEditingPointName(point.id)}
                            className="w-5 h-5 flex items-center justify-center cursor-pointer"
                          >
                            <i className="ri-edit-line text-[12px] text-[#8E8E93]"></i>
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => handleDeletePoint(point.id)}
                        className="w-6 h-6 flex items-center justify-center cursor-pointer"
                      >
                        <i className="ri-close-line text-[14px] text-[#8E8E93]"></i>
                      </button>
                    </div>

                    {/* 上传产品区域 */}
                    <div className="mb-4">
                      <p className="text-[13px] text-[#6E6E73] mb-2">上传产品</p>
                      {!point.replacementImage ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleSelectFromProducts(point.id)}
                            className="h-20 bg-[#FBF9F6] border-2 border-[#D4C9B8] rounded-xl flex flex-col items-center justify-center hover:border-[#B8A88A] transition-colors cursor-pointer"
                          >
                            <i className="ri-store-2-line text-xl text-[#8B7355] mb-1"></i>
                            <span className="text-[12px] text-[#6B5B3E] font-medium">从商品库选择</span>
                          </button>
                          <label className="relative h-20 border-2 border-dashed border-[#E5E5EA] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#1D1D1F] transition-colors">
                            <i className="ri-upload-2-line text-xl text-[#8E8E93] mb-1"></i>
                            <span className="text-[12px] text-[#6E6E73]">上传图片</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleReplacementImageUpload(point.id, e)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-[#F5F5F7] rounded-xl overflow-hidden flex-shrink-0">
                            <img src={point.replacementImage} alt="替换图" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {point.replacementSource === 'product' && point.replacementProductName && (
                              <p className="text-[13px] text-[#1D1D1F] font-medium mb-0.5 truncate">{point.replacementProductName}</p>
                            )}
                            {point.replacementSource === 'product' && getPointConfigSummary(point) && (
                              <p className="text-[11px] text-[#8E8E93] mb-1 truncate">{getPointConfigSummary(point)}</p>
                            )}
                            <p className="text-[12px] text-[#6E6E73] mb-1">
                              {point.replacementSource === 'upload' ? '已上传图片' : '从商品库选择'}
                            </p>
                            <button
                              onClick={() =>
                                setMarkPoints(
                                  markPoints.map((p) =>
                                    p.id === point.id
                                      ? { ...p, replacementImage: undefined, replacementSource: undefined, replacementProductName: undefined, replacementSpec: undefined, replacementFabric: undefined, replacementColor: undefined }
                                      : p
                                  )
                                )
                              }
                              className="text-[12px] text-[#1D1D1F] cursor-pointer"
                            >
                              更换
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 替换描述区域 */}
                    <div className="pt-3 border-t border-[#E5E5EA]">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[13px] font-medium text-[#1D1D1F]">替换提示词</p>
                        <div className="flex items-center gap-2">
                          {point.customPrompt && (
                            <button
                              onClick={() => handleResetPrompt(point.id)}
                              className="text-[12px] text-[#8E8E93] cursor-pointer hover:text-[#1D1D1F] transition-colors"
                            >
                              重置
                            </button>
                          )}
                          <button
                            onClick={() => setEditingPromptId(editingPromptId === point.id ? null : point.id)}
                            className="w-6 h-6 flex items-center justify-center cursor-pointer"
                          >
                            <i className="ri-edit-line text-[14px] text-[#8E8E93]"></i>
                          </button>
                        </div>
                      </div>
                      
                      {editingPromptId === point.id ? (
                        <div className="relative">
                          <textarea
                            value={point.customPrompt ?? getDefaultPrompt(point)}
                            onChange={(e) => handleUpdateCustomPrompt(point.id, e.target.value)}
                            placeholder="输入自定义替换提示词..."
                            maxLength={200}
                            className="w-full h-24 p-3 bg-[#F5F5F7] rounded-xl text-[13px] text-[#1D1D1F] placeholder-[#C7C7CC] resize-none focus:outline-none focus:ring-1 focus:ring-[#1D1D1F] transition-all"
                          />
                          <div className="absolute bottom-2 right-3 text-[11px] text-[#8E8E93]">
                            {(point.customPrompt ?? getDefaultPrompt(point)).length}/200
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={() => setEditingPromptId(point.id)}
                          className="p-3 bg-[#F5F5F7] rounded-xl cursor-pointer hover:bg-[#EBEBED] transition-colors group"
                        >
                          <p className="text-[13px] text-[#1D1D1F] leading-relaxed">
                            {point.customPrompt || getDefaultPrompt(point)}
                          </p>
                          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <i className="ri-edit-line text-[12px] text-[#8E8E93]"></i>
                            <span className="text-[11px] text-[#8E8E93]">点击编辑</span>
                          </div>
                        </div>
                      )}
                      
                      {/* 快捷提示词标签 */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {['保持光影自然', '风格协调统一', '保留原有氛围', '突出产品细节'].map((tag) => (
                          <button
                            key={tag}
                            onClick={() => {
                              const currentPrompt = point.customPrompt ?? getDefaultPrompt(point);
                              if (!currentPrompt.includes(tag)) {
                                handleUpdateCustomPrompt(point.id, `${currentPrompt}，${tag}`);
                              }
                            }}
                            className="px-2 py-1 bg-white border border-[#E5E5EA] rounded-full text-[11px] text-[#6E6E73] cursor-pointer hover:border-[#1D1D1F] hover:text-[#1D1D1F] transition-colors whitespace-nowrap"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 提示 */}
        {recognitionStatus === 'success' && selectedPoints.length === 0 && (
          <div className="bg-[#F5F5F7] rounded-2xl p-4 flex items-start gap-3">
            <i className="ri-information-line text-lg text-[#1D1D1F] flex-shrink-0 mt-0.5"></i>
            <p className="text-[13px] text-[#6E6E73]">
              点击图片上的标记点选择要替换的家具（可多选最多3个）
            </p>
          </div>
        )}
      </div>

      {/* 底部吸底栏 */}
      {sceneImage && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-[#E5E5EA] p-4 z-30"
          style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowGenerateCountSheet(true)}
                className="h-11 px-4 bg-[#F5F5F7] rounded-xl flex items-center gap-2 cursor-pointer"
              >
                <span className="text-[14px] text-[#1D1D1F]">{generateCount}张</span>
                <i className="ri-arrow-down-s-line text-[18px] text-[#6E6E73]"></i>
              </button>
              <div className="text-[12px] text-[#6E6E73]">
                <div>当前积分</div>
                <div className="font-semibold text-[#1D1D1F]">1280</div>
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={!canGenerate()}
              className={`flex-1 h-12 rounded-[16px] font-medium whitespace-nowrap cursor-pointer transition-all ${
                canGenerate()
                  ? 'bg-white border border-[#D2D2D7] text-[#1D1D1F] active:bg-[#F5F5F7]'
                  : 'bg-[#E5E5EA] text-[#8E8E93] cursor-not-allowed border border-transparent'
              }`}
            >
              立即替换（消耗积分{generateCount * 20}）
            </button>
          </div>
        </div>
      )}

      {/* ActionSheet：选择照片来源 */}
      {showActionSheet && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowActionSheet(false)}></div>
          <div className="fixed left-0 right-0 bottom-0 z-50 animate-slide-up" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="mx-3 mb-2">
              <div className="bg-white rounded-xl overflow-hidden">
                <label className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E5E5EA] cursor-pointer active:bg-[#F5F5F7] transition-colors">
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F5F5F7]">
                    <i className="ri-camera-line text-[18px] text-[#1D1D1F]"></i>
                  </div>
                  <span className="text-[15px] text-[#1D1D1F]">拍摄</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                </label>
                <label className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E5E5EA] cursor-pointer active:bg-[#F5F5F7] transition-colors">
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F5F5F7]">
                    <i className="ri-image-line text-[18px] text-[#1D1D1F]"></i>
                  </div>
                  <span className="text-[15px] text-[#1D1D1F]">从相册选择</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                <button
                  onClick={() => {
                    setShowActionSheet(false);
                    setShowSceneProductSelector(true);
                    setSceneProductStep('list');
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

      {/* 从产品选择 - 全屏抽屉（场景图） */}
      {showSceneProductSelector && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-[#F5F5F7]">
          {/* 导航栏 */}
          <nav className="bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA] flex-shrink-0" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            <div className="h-11 flex items-center justify-between px-4">
              <button
                onClick={() => {
                  if (sceneProductStep === 'detail') {
                    setSceneProductStep('list');
                    setScenePendingProduct(null);
                  } else {
                    closeSceneProductSelector();
                  }
                }}
                className="flex items-center cursor-pointer"
              >
                <i className="ri-arrow-left-s-line text-[22px] text-[#1D1D1F]"></i>
              </button>
              <h1 className="text-[17px] font-semibold text-[#1D1D1F]">
                {sceneProductStep === 'list' ? '从产品选择' : '选择SKU配置'}
              </h1>
              <button onClick={closeSceneProductSelector} className="w-8 h-8 flex items-center justify-center cursor-pointer">
                <i className="ri-close-line text-[20px] text-[#8E8E93]"></i>
              </button>
            </div>
          </nav>

          {/* 产品列表 */}
          {sceneProductStep === 'list' && (
            <div className="flex-1 overflow-y-auto">
              {/* 搜索栏 */}
              <div className="px-4 py-3 bg-white border-b border-[#E5E5EA]">
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#8E8E93]"></i>
                  <input
                    type="text"
                    value={sceneSearchText}
                    onChange={(e) => setSceneSearchText(e.target.value)}
                    placeholder="搜索商品名称或SKU编号"
                    className="w-full h-10 bg-[#F5F5F7] rounded-lg pl-10 pr-10 text-[14px] text-[#1D1D1F] placeholder-[#C7C7CC] focus:outline-none focus:ring-1 focus:ring-[#1D1D1F]"
                  />
                  {sceneSearchText && (
                    <button onClick={() => setSceneSearchText('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center cursor-pointer">
                      <i className="ri-close-circle-fill text-[#C6C6C8] text-[16px]"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* 分类 */}
              <div className="px-4 py-3 bg-white border-b border-[#E5E5EA] overflow-x-auto scrollbar-hide">
                <div className="flex space-x-2">
                  {furnitureCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSceneActiveCategory(cat.id)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer text-[13px] font-medium ${
                        sceneActiveCategory === cat.id
                          ? 'bg-[#F5F5F7] text-[#1D1D1F] border border-[#C7C7CC]'
                          : 'bg-white text-[#1D1D1F] border border-[#D2D2D7]'
                      }`}
                    >
                      <i className={`${cat.icon} text-[14px]`}></i>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 商品网格 */}
              <div className="px-4 py-3">
                <p className="text-[13px] text-[#6E6E73] mb-3">共 {filteredSceneProducts.length} 件商品</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredSceneProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleOpenSceneProductDetail(product)}
                      className="bg-white rounded-xl overflow-hidden cursor-pointer transition-all active:scale-[0.98] hover:shadow-md"
                    >
                      <div className="relative aspect-square bg-[#F2F2F7]">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        {product.originalPrice > product.price && (
                          <div className="absolute top-2 left-2 bg-[#FF3B30] px-1.5 py-0.5 rounded">
                            <span className="text-[10px] text-white font-medium">
                              {Math.round((1 - product.price / product.originalPrice) * 100)}%OFF
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/60 px-1.5 py-0.5 rounded">
                          <span className="text-[10px] text-white">{product.sku}</span>
                        </div>
                      </div>
                      <div className="p-2.5">
                        <p className="text-[13px] text-[#1D1D1F] font-medium line-clamp-1 mb-1">{product.name}</p>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[15px] text-[#1D1D1F] font-semibold">
                            &yen;{product.price.toLocaleString()}
                          </span>
                          {product.originalPrice > product.price && (
                            <span className="text-[11px] text-[#C7C7CC] line-through">
                              &yen;{product.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-[#8E8E93]">库存 {product.stock}</span>
                          <span className="text-[10px] text-[#8E8E93]">已售 {product.sold}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredSceneProducts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16">
                    <i className="ri-search-line text-[48px] text-[#C6C6C8] mb-3"></i>
                    <p className="text-[14px] text-[#8E8E93]">未找到匹配的商品</p>
                    <button
                      onClick={() => {
                        setSceneSearchText('');
                        setSceneActiveCategory('all');
                      }}
                      className="mt-3 text-[14px] text-[#1D1D1F] cursor-pointer whitespace-nowrap"
                    >
                      清除筛选条件
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 产品SKU详情 */}
          {sceneProductStep === 'detail' && scenePendingProduct && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
                {/* 商品基本信息 */}
                <div className="flex items-start space-x-4 mb-6">
                  <img src={scenePendingProduct.image} alt={scenePendingProduct.name} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-medium text-[#1D1D1F] mb-1 line-clamp-2">{scenePendingProduct.name}</p>
                    <p className="text-[12px] text-[#6E6E73] mb-2">SKU: {scenePendingProduct.sku}</p>
                    <div className="flex items-baseline">
                      <span className="text-[20px] font-bold text-[#1D1D1F]">
                        &yen;{scenePendingProduct.price.toLocaleString()}
                      </span>
                      {scenePendingProduct.originalPrice > scenePendingProduct.price && (
                        <span className="text-[13px] text-[#C7C7CC] line-through ml-2">
                          &yen;{scenePendingProduct.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 选择规格 */}
                <div className="mb-5">
                  <h5 className="text-[14px] font-medium text-[#1D1D1F] mb-3">选择规格</h5>
                  <div className="flex flex-wrap gap-2">
                    {scenePendingProduct.specs.map((spec: string) => {
                      const isSelected = sceneSelectedSpec === spec;
                      return (
                        <button
                          key={spec}
                          onClick={() => setSceneSelectedSpec(spec)}
                          className={`relative flex items-center gap-1.5 h-[34px] px-3.5 rounded-[17px] text-[14px] border transition-all cursor-pointer active:scale-[0.98] ${
                            isSelected
                              ? 'bg-[#F5F5F7] border-[#1D1D1F] text-[#1D1D1F] font-semibold shadow-[0_0_0_2px_rgba(0,113,227,0.15)]'
                              : 'bg-white border-[#D2D2D7] text-[#1D1D1F] hover:bg-[#FAFAFA]'
                          }`}
                        >
                          {isSelected && (
                            <i className="ri-check-line text-[13px] text-[#1D1D1F]"></i>
                          )}
                          <span>{spec}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 选择面料 */}
                {currentSceneFabrics.length > 0 && (
                  <div className="mb-5">
                    <h5 className="text-[14px] font-medium text-[#1D1D1F] mb-3">选择面料</h5>
                    <div className="flex flex-wrap gap-2">
                      {currentSceneFabrics.map((fabric) => {
                        const isSelected = sceneSelectedFabric === fabric.id;
                        return (
                          <button
                            key={fabric.id}
                            onClick={() => setSceneSelectedFabric(fabric.id)}
                            className={`relative flex items-center gap-1.5 h-[34px] px-3.5 rounded-[17px] border transition-all cursor-pointer active:scale-[0.98] ${
                              isSelected
                                ? 'bg-[#F5F5F7] border-[#1D1D1F] text-[#1D1D1F] font-semibold shadow-[0_0_0_2px_rgba(0,113,227,0.15)]'
                                : 'bg-white border-[#D2D2D7] text-[#1D1D1F] hover:bg-[#FAFAFA]'
                            }`}
                          >
                            {isSelected && (
                              <i className="ri-check-line text-[13px] text-[#1D1D1F]"></i>
                            )}
                            <span className="text-[14px]">{fabric.name}</span>
                            {fabric.tag && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                                  isSelected ? 'bg-[#E5E5EA] text-[#6E6E73]' : 'bg-[#F5F5F7] text-[#8E8E93]'
                                }`}
                              >
                                {fabric.tag}
                              </span>
                            )}
                            {fabric.priceAdd > 0 && (
                              <span className="text-[11px] text-[#6E6E73]">
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
                {currentSceneColors.length > 0 && (
                  <div className="mb-5">
                    <h5 className="text-[14px] font-medium text-[#1D1D1F] mb-1">
                      材质颜色
                      {sceneSelectedColor && (
                        <span className="text-[12px] text-[#8E8E93] font-normal ml-2">
                          已选：{materialColorOptions.find((c) => c.id === sceneSelectedColor)?.name}
                        </span>
                      )}
                    </h5>
                    <div className="flex flex-wrap gap-3 mt-3">
                      {currentSceneColors.map((color) => {
                        const isSelected = sceneSelectedColor === color.id;
                        return (
                          <button
                            key={color.id}
                            onClick={() => setSceneSelectedColor(color.id)}
                            className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-90 transition-transform"
                            title={color.name}
                          >
                            <div
                              className={`w-10 h-10 rounded-xl transition-all duration-200 ${
                                isSelected ? 'ring-2 ring-[#1D1D1F] ring-offset-2' : 'ring-1 ring-[#E5E5EA]'
                              }`}
                              style={{ backgroundColor: color.color }}
                            />
                            <span className={`text-[11px] ${isSelected ? 'text-[#1D1D1F] font-semibold' : 'text-[#8E8E93]'}`}>
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
                  <span>库存: {scenePendingProduct.stock} 件</span>
                  <span>已售: {scenePendingProduct.sold} 件</span>
                </div>

                {/* 已选配置摘要 */}
                {(sceneSelectedSpec || sceneSelectedFabric || sceneSelectedColor) && (
                  <div className="p-3 bg-[#F5F5F7] rounded-xl">
                    <div className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-[16px] text-[#0071E3] mt-0.5"></i>
                      <div className="flex-1">
                        <p className="text-[12px] text-[#6E6E73] mb-1">已选配置</p>
                        <p className="text-[13px] text-[#1D1D1F] font-medium leading-relaxed">
                          {getSceneSelectionSummary()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 确认按钮 */}
              <div className="flex-shrink-0 px-4 pb-4 pt-3 border-t border-[#E5E5EA] bg-white" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
                <button
                  onClick={handleConfirmSceneProduct}
                  className="w-full h-12 bg-white border border-[#D2D2D7] text-[#1D1D1F] rounded-[16px] text-[16px] font-semibold cursor-pointer transition-all whitespace-nowrap active:scale-[0.985] active:translate-y-[2px] active:bg-[#F5F5F7]"
                >
                  确认选择
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 替换产品选择器（标记点用）- 完整SKU选择 */}
      {showProductSelector && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-[#F5F5F7]">
          {/* 导航栏 */}
          <nav className="bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA] flex-shrink-0" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            <div className="h-11 flex items-center justify-between px-4">
              <button
                onClick={() => {
                  if (replaceProductStep === 'detail') {
                    setReplaceProductStep('list');
                    setReplacePendingProduct(null);
                  } else {
                    closeReplaceProductSelector();
                  }
                }}
                className="flex items-center cursor-pointer"
              >
                <i className="ri-arrow-left-s-line text-[22px] text-[#1D1D1F]"></i>
              </button>
              <h1 className="text-[17px] font-semibold text-[#1D1D1F]">
                {replaceProductStep === 'list' ? '选择产品' : '选择SKU配置'}
              </h1>
              <button onClick={closeReplaceProductSelector} className="w-8 h-8 flex items-center justify-center cursor-pointer">
                <i className="ri-close-line text-[20px] text-[#8E8E93]"></i>
              </button>
            </div>
          </nav>

          {/* 产品列表 */}
          {replaceProductStep === 'list' && (
            <div className="flex-1 overflow-y-auto">
              {/* 搜索栏 */}
              <div className="px-4 py-3 bg-white border-b border-[#E5E5EA]">
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#8E8E93]"></i>
                  <input
                    type="text"
                    value={replaceSearchText}
                    onChange={(e) => setReplaceSearchText(e.target.value)}
                    placeholder="搜索商品名称或SKU编号"
                    className="w-full h-10 bg-[#F5F5F7] rounded-lg pl-10 pr-10 text-[14px] text-[#1D1D1F] placeholder-[#C7C7CC] focus:outline-none focus:ring-1 focus:ring-[#1D1D1F]"
                  />
                  {replaceSearchText && (
                    <button onClick={() => setReplaceSearchText('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center cursor-pointer">
                      <i className="ri-close-circle-fill text-[#C6C6C8] text-[16px]"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* 分类 */}
              <div className="px-4 py-3 bg-white border-b border-[#E5E5EA] overflow-x-auto scrollbar-hide">
                <div className="flex space-x-2">
                  {furnitureCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setReplaceActiveCategory(cat.id)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer text-[13px] font-medium ${
                        replaceActiveCategory === cat.id
                          ? 'bg-[#F5F5F7] text-[#1D1D1F] border border-[#C7C7CC]'
                          : 'bg-white text-[#1D1D1F] border border-[#D2D2D7]'
                      }`}
                    >
                      <i className={`${cat.icon} text-[14px]`}></i>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 商品网格 */}
              <div className="px-4 py-3">
                <p className="text-[13px] text-[#6E6E73] mb-3">共 {filteredReplaceProducts.length} 件商品</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredReplaceProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleOpenReplaceProductDetail(product)}
                      className="bg-white rounded-xl overflow-hidden cursor-pointer transition-all active:scale-[0.98] hover:shadow-md"
                    >
                      <div className="relative aspect-square bg-[#F2F2F7]">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        {product.originalPrice > product.price && (
                          <div className="absolute top-2 left-2 bg-[#FF3B30] px-1.5 py-0.5 rounded">
                            <span className="text-[10px] text-white font-medium">
                              {Math.round((1 - product.price / product.originalPrice) * 100)}%OFF
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/60 px-1.5 py-0.5 rounded">
                          <span className="text-[10px] text-white">{product.sku}</span>
                        </div>
                      </div>
                      <div className="p-2.5">
                        <p className="text-[13px] text-[#1D1D1F] font-medium line-clamp-1 mb-1">{product.name}</p>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[15px] text-[#1D1D1F] font-semibold">
                            &yen;{product.price.toLocaleString()}
                          </span>
                          {product.originalPrice > product.price && (
                            <span className="text-[11px] text-[#C7C7CC] line-through">
                              &yen;{product.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-[#8E8E93]">库存 {product.stock}</span>
                          <span className="text-[10px] text-[#8E8E93]">已售 {product.sold}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredReplaceProducts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16">
                    <i className="ri-search-line text-[48px] text-[#C6C6C8] mb-3"></i>
                    <p className="text-[14px] text-[#8E8E93]">未找到匹配的商品</p>
                    <button
                      onClick={() => {
                        setReplaceSearchText('');
                        setReplaceActiveCategory('all');
                      }}
                      className="mt-3 text-[14px] text-[#1D1D1F] cursor-pointer whitespace-nowrap"
                    >
                      清除筛选条件
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 产品SKU详情 */}
          {replaceProductStep === 'detail' && replacePendingProduct && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
                {/* 商品基本信息 */}
                <div className="flex items-start space-x-4 mb-6">
                  <img src={replacePendingProduct.image} alt={replacePendingProduct.name} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-medium text-[#1D1D1F] mb-1 line-clamp-2">{replacePendingProduct.name}</p>
                    <p className="text-[12px] text-[#6E6E73] mb-2">SKU: {replacePendingProduct.sku}</p>
                    <div className="flex items-baseline">
                      <span className="text-[20px] font-bold text-[#1D1D1F]">
                        &yen;{replacePendingProduct.price.toLocaleString()}
                      </span>
                      {replacePendingProduct.originalPrice > replacePendingProduct.price && (
                        <span className="text-[13px] text-[#C7C7CC] line-through ml-2">
                          &yen;{replacePendingProduct.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 选择规格 */}
                <div className="mb-5">
                  <h5 className="text-[14px] font-medium text-[#1D1D1F] mb-3">选择规格</h5>
                  <div className="flex flex-wrap gap-2">
                    {replacePendingProduct.specs.map((spec: string) => {
                      const isSelected = replaceSelectedSpec === spec;
                      return (
                        <button
                          key={spec}
                          onClick={() => setReplaceSelectedSpec(spec)}
                          className={`relative flex items-center gap-1.5 h-[34px] px-3.5 rounded-[17px] text-[14px] border transition-all cursor-pointer active:scale-[0.98] ${
                            isSelected
                              ? 'bg-[#F5F5F7] border-[#1D1D1F] text-[#1D1D1F] font-semibold shadow-[0_0_0_2px_rgba(0,113,227,0.15)]'
                              : 'bg-white border-[#D2D2D7] text-[#1D1D1F] hover:bg-[#FAFAFA]'
                          }`}
                        >
                          {isSelected && (
                            <i className="ri-check-line text-[13px] text-[#1D1D1F]"></i>
                          )}
                          <span>{spec}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 选择面料 */}
                {currentReplaceFabrics.length > 0 && (
                  <div className="mb-5">
                    <h5 className="text-[14px] font-medium text-[#1D1D1F] mb-3">选择面料</h5>
                    <div className="flex flex-wrap gap-2">
                      {currentReplaceFabrics.map((fabric) => {
                        const isSelected = replaceSelectedFabric === fabric.id;
                        return (
                          <button
                            key={fabric.id}
                            onClick={() => setReplaceSelectedFabric(fabric.id)}
                            className={`relative flex items-center gap-1.5 h-[34px] px-3.5 rounded-[17px] border transition-all cursor-pointer active:scale-[0.98] ${
                              isSelected
                                ? 'bg-[#F5F5F7] border-[#1D1D1F] text-[#1D1D1F] font-semibold shadow-[0_0_0_2px_rgba(0,113,227,0.15)]'
                                : 'bg-white border-[#D2D2D7] text-[#1D1D1F] hover:bg-[#FAFAFA]'
                            }`}
                          >
                            {isSelected && (
                              <i className="ri-check-line text-[13px] text-[#1D1D1F]"></i>
                            )}
                            <span className="text-[14px]">{fabric.name}</span>
                            {fabric.tag && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                                  isSelected ? 'bg-[#E5E5EA] text-[#6E6E73]' : 'bg-[#F5F5F7] text-[#8E8E93]'
                                }`}
                              >
                                {fabric.tag}
                              </span>
                            )}
                            {fabric.priceAdd > 0 && (
                              <span className="text-[11px] text-[#6E6E73]">
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
                {currentReplaceColors.length > 0 && (
                  <div className="mb-5">
                    <h5 className="text-[14px] font-medium text-[#1D1D1F] mb-1">
                      材质颜色
                      {replaceSelectedColor && (
                        <span className="text-[12px] text-[#8E8E93] font-normal ml-2">
                          已选：{materialColorOptions.find((c) => c.id === replaceSelectedColor)?.name}
                        </span>
                      )}
                    </h5>
                    <div className="flex flex-wrap gap-3 mt-3">
                      {currentReplaceColors.map((color) => {
                        const isSelected = replaceSelectedColor === color.id;
                        return (
                          <button
                            key={color.id}
                            onClick={() => setReplaceSelectedColor(color.id)}
                            className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-90 transition-transform"
                            title={color.name}
                          >
                            <div
                              className={`w-10 h-10 rounded-xl transition-all duration-200 ${
                                isSelected ? 'ring-2 ring-[#1D1D1F] ring-offset-2' : 'ring-1 ring-[#E5E5EA]'
                              }`}
                              style={{ backgroundColor: color.color }}
                            />
                            <span className={`text-[11px] ${isSelected ? 'text-[#1D1D1F] font-semibold' : 'text-[#8E8E93]'}`}>
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
                  <span>库存: {replacePendingProduct.stock} 件</span>
                  <span>已售: {replacePendingProduct.sold} 件</span>
                </div>

                {/* 已选配置摘要 */}
                {(replaceSelectedSpec || replaceSelectedFabric || replaceSelectedColor) && (
                  <div className="p-3 bg-[#F5F5F7] rounded-xl">
                    <div className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-[16px] text-[#0071E3] mt-0.5"></i>
                      <div className="flex-1">
                        <p className="text-[12px] text-[#6E6E73] mb-1">已选配置</p>
                        <p className="text-[13px] text-[#1D1D1F] font-medium leading-relaxed">
                          {getReplaceSelectionSummary()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 确认按钮 */}
              <div className="flex-shrink-0 px-4 pb-4 pt-3 border-t border-[#E5E5EA] bg-white" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
                <button
                  onClick={handleConfirmReplaceProduct}
                  className="w-full h-12 bg-white border border-[#D2D2D7] text-[#1D1D1F] rounded-[16px] text-[16px] font-semibold cursor-pointer transition-all whitespace-nowrap active:scale-[0.985] active:translate-y-[2px] active:bg-[#F5F5F7]"
                >
                  确认选择
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 白底图对比 */}
      {showWhiteBackgroundCompare && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col" onClick={() => setShowWhiteBackgroundCompare(false)}>
          <div className="flex items-center justify-between h-11 px-4" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            <button onClick={() => setShowWhiteBackgroundCompare(false)} className="w-8 h-8 flex items-center justify-center cursor-pointer">
              <i className="ri-close-line text-xl text-white"></i>
            </button>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCompareViewMode('original');
                }}
                className={`px-4 py-1.5 rounded-full text-[14px] cursor-pointer ${compareViewMode === 'original' ? 'bg-white text-[#1D1D1F]' : 'bg-white/20 text-white'}`}
              >
                原图
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCompareViewMode('whitebg');
                }}
                className={`px-4 py-1.5 rounded-full text-[14px] cursor-pointer ${compareViewMode === 'whitebg' ? 'bg-white text-[#1D1D1F]' : 'bg-white/20 text-white'}`}
              >
                白底图
              </button>
            </div>
            <div className="w-8"></div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={compareViewMode === 'original' ? sceneImage : whiteBackgroundImage}
              alt={compareViewMode === 'original' ? '原图' : '白底图'}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* 全屏选点 */}
      {isFullscreenMode && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex items-center justify-between h-11 px-4 bg-black" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            <button onClick={() => setIsFullscreenMode(false)} className="text-white text-[15px] cursor-pointer">
              完成
            </button>
            <span className="text-white text-[15px]">点击图片添加标记点</span>
            <div className="w-12"></div>
          </div>
          <div className="flex-1 relative flex items-center justify-center" onClick={handleImageClick}>
            <img
              src={whiteBackgroundEnabled && whiteBackgroundImage ? whiteBackgroundImage : sceneImage}
              alt="场景图"
              className="max-w-full max-h-full object-contain"
            />
            {markPoints.map((point) => (
              <div key={point.id} className="absolute" style={{ left: `${point.x}%`, top: `${point.y}%`, transform: 'translate(-50%, -50%)' }}>
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                    selectedPoints.includes(point.id) ? 'bg-[#1D1D1F] border-[#1D1D1F] text-white' : 'bg-white border-[#1D1D1F] text-[#1D1D1F]'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePointSelection(point.id);
                  }}
                >
                  <i className="ri-focus-3-line text-lg"></i>
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-white/90 text-[#1D1D1F] text-[12px] rounded whitespace-nowrap">
                  {point.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 生成数量选择 */}
      {showGenerateCountSheet && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowGenerateCountSheet(false)}></div>
          <div className="fixed left-0 right-0 bottom-0 z-50 bg-white rounded-t-2xl animate-slide-up" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="p-4">
              <div className="text-center mb-4">
                <h3 className="text-[17px] font-semibold text-[#1D1D1F]">选择生成数量</h3>
              </div>
              <div className="space-y-2 mb-4">
                {[1, 2, 3].map((count) => (
                  <button
                    key={count}
                    onClick={() => {
                      setGenerateCount(count);
                      setShowGenerateCountSheet(false);
                    }}
                    className={`w-full h-12 rounded-[14px] text-[15px] font-medium cursor-pointer transition-all flex items-center justify-center gap-2 ${
                      generateCount === count 
                        ? 'bg-[#F5F5F7] border-2 border-[#1D1D1F] text-[#1D1D1F]' 
                        : 'bg-white border border-[#D2D2D7] text-[#1D1D1F] active:bg-[#F5F5F7]'
                    }`}
                  >
                    {generateCount === count && (
                      <i className="ri-check-line text-[16px] text-[#1D1D1F]"></i>
                    )}
                    <span>{count}张（消耗积分{count * 20}）</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowGenerateCountSheet(false)} className="w-full h-12 bg-white border border-[#D2D2D7] rounded-[14px] text-[15px] font-medium text-[#6E6E73] cursor-pointer active:bg-[#F5F5F7] transition-colors">
                取消
              </button>
            </div>
          </div>
        </>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
