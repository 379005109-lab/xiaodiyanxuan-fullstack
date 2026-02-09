
import { useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { furnitureProducts, recommendProducts } from '../../../mocks/furnitureProducts';

// 规格配置数据
const specConfigs = [
  { id: 'single', name: '单扶手', size: '1100x1100x600CM', price: 14550 },
  { id: 'single-back', name: '单坐包', size: '900x1100x600CM', price: 11865 },
  { id: 'double-back', name: '双坐包', size: '1800x1120x600CM', price: 23730 },
  { id: 'ottoman', name: '4+4脚踏', size: '1120x1120x600CM', price: 7635 },
  { id: 'corner', name: '6+6边柜', size: '1900x1100x600CM', price: 14250 },
  { id: 'chaise', name: '内转一边柜', size: '2600x900CM', price: 29060 },
  { id: 'combo', name: '多组合', size: '定制尺寸', price: 67340 },
];

// 材质颜色数据
const materialColors = [
  { id: 'black', name: '黑色', color: '#1a1a1a' },
  { id: 'dark-brown', name: '深棕', color: '#3d2b1f' },
  { id: 'brown', name: '棕色', color: '#6b4423' },
  { id: 'camel', name: '驼色', color: '#c19a6b' },
  { id: 'gray', name: '灰色', color: '#808080' },
  { id: 'olive', name: '橄榄绿', color: '#808000' },
  { id: 'cream', name: '米白', color: '#f5f5dc' },
  { id: 'tan', name: '浅棕', color: '#d2b48c' },
  { id: 'charcoal', name: '炭灰', color: '#36454f' },
  { id: 'forest', name: '森林绿', color: '#228b22' },
  { id: 'navy', name: '藏青', color: '#000080' },
  { id: 'burgundy', name: '酒红', color: '#800020' },
  { id: 'beige', name: '米色', color: '#f5f5dc' },
  { id: 'sand', name: '沙色', color: '#c2b280' },
];

// 媒体数据（工艺视频、实拍图、细节图等）
const mediaData = {
  videos: [
    { id: 'v1', title: '开料工艺', duration: '2:15', thumbnail: 'https://readdy.ai/api/search-image?query=furniture%20manufacturing%20cutting%20process%20workshop%20with%20modern%20machinery%20and%20wood%20materials%2C%20professional%20industrial%20setting%20with%20clean%20lighting%2C%20documentary%20style%20photography%20showing%20craftsmanship%20details&width=400&height=300&seq=craft-video-1&orientation=landscape', category: 'craft' },
    { id: 'v2', title: '封边工艺', duration: '1:45', thumbnail: 'https://readdy.ai/api/search-image?query=furniture%20edge%20banding%20process%20in%20modern%20workshop%2C%20precision%20machinery%20working%20on%20wood%20panels%2C%20professional%20industrial%20photography%20with%20clean%20aesthetic%20showing%20quality%20craftsmanship&width=400&height=300&seq=craft-video-2&orientation=landscape', category: 'craft' },
    { id: 'v3', title: '打磨工艺', duration: '2:30', thumbnail: 'https://readdy.ai/api/search-image?query=furniture%20sanding%20and%20polishing%20process%20in%20workshop%2C%20craftsman%20working%20on%20wood%20surface%20with%20professional%20tools%2C%20clean%20industrial%20photography%20showing%20attention%20to%20detail&width=400&height=300&seq=craft-video-3&orientation=landscape', category: 'craft' },
    { id: 'v4', title: '喷涂工艺', duration: '1:50', thumbnail: 'https://readdy.ai/api/search-image?query=furniture%20spray%20painting%20process%20in%20professional%20booth%2C%20modern%20coating%20application%20with%20precision%20equipment%2C%20clean%20industrial%20setting%20with%20quality%20control%20standards&width=400&height=300&seq=craft-video-4&orientation=landscape', category: 'craft' },
    { id: 'v5', title: '缝制工艺', duration: '2:00', thumbnail: 'https://readdy.ai/api/search-image?query=leather%20upholstery%20sewing%20process%20for%20luxury%20furniture%2C%20skilled%20craftsman%20working%20with%20premium%20materials%2C%20professional%20workshop%20photography%20showing%20fine%20stitching%20details&width=400&height=300&seq=craft-video-5&orientation=landscape', category: 'craft' },
    { id: 'v6', title: '质检流程', duration: '1:30', thumbnail: 'https://readdy.ai/api/search-image?query=furniture%20quality%20inspection%20process%20in%20modern%20facility%2C%20professional%20inspector%20checking%20product%20details%2C%20clean%20industrial%20photography%20showing%20quality%20assurance%20standards&width=400&height=300&seq=craft-video-6&orientation=landscape', category: 'craft' },
  ],
  photos: [
    { id: 'p1', url: 'https://readdy.ai/api/search-image?query=luxury%20modern%20sofa%20in%20elegant%20living%20room%20setting%2C%20minimalist%20interior%20design%20with%20natural%20lighting%2C%20professional%20architectural%20photography%20with%20clean%20aesthetic%20and%20premium%20furniture%20showcase&width=800&height=600&seq=scene-photo-1&orientation=landscape', category: 'scene' },
    { id: 'p2', url: 'https://readdy.ai/api/search-image?query=contemporary%20leather%20sofa%20in%20bright%20modern%20apartment%2C%20scandinavian%20interior%20design%20with%20wooden%20floors%2C%20professional%20real%20estate%20photography%20showing%20furniture%20in%20lifestyle%20context&width=800&height=600&seq=scene-photo-2&orientation=landscape', category: 'scene' },
    { id: 'p3', url: 'https://readdy.ai/api/search-image?query=premium%20sofa%20in%20cozy%20living%20space%20with%20warm%20lighting%2C%20modern%20home%20interior%20with%20plants%20and%20decor%2C%20professional%20interior%20photography%20showcasing%20furniture%20in%20comfortable%20setting&width=800&height=600&seq=scene-photo-3&orientation=landscape', category: 'scene' },
    { id: 'p4', url: 'https://readdy.ai/api/search-image?query=luxury%20sofa%20close-up%20showing%20leather%20texture%20and%20stitching%20details%2C%20premium%20material%20quality%20with%20fine%20craftsmanship%2C%20professional%20product%20photography%20with%20macro%20focus%20on%20material%20excellence&width=800&height=600&seq=detail-photo-1&orientation=landscape', category: 'detail' },
    { id: 'p5', url: 'https://readdy.ai/api/search-image?query=sofa%20armrest%20detail%20showing%20wood%20frame%20and%20leather%20upholstery%2C%20high-quality%20construction%20with%20visible%20craftsmanship%2C%20professional%20close-up%20photography%20highlighting%20premium%20materials&width=800&height=600&seq=detail-photo-2&orientation=landscape', category: 'detail' },
    { id: 'p6', url: 'https://readdy.ai/api/search-image?query=sofa%20cushion%20detail%20with%20button%20tufting%20and%20leather%20texture%2C%20luxury%20furniture%20craftsmanship%20close-up%2C%20professional%20macro%20photography%20showing%20fine%20stitching%20and%20material%20quality&width=800&height=600&seq=detail-photo-3&orientation=landscape', category: 'detail' },
    { id: 'p7', url: 'https://readdy.ai/api/search-image?query=sofa%20leg%20and%20base%20construction%20detail%2C%20solid%20wood%20frame%20with%20metal%20hardware%2C%20professional%20product%20photography%20showing%20structural%20quality%20and%20design%20details&width=800&height=600&seq=detail-photo-4&orientation=landscape', category: 'detail' },
    { id: 'p8', url: 'https://readdy.ai/api/search-image?query=modern%20sofa%20full%20view%20on%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20shadows%2C%20minimalist%20aesthetic%20showing%20complete%20furniture%20design%20from%20front%20angle&width=800&height=600&seq=product-photo-1&orientation=landscape', category: 'product' },
    { id: 'p9', url: 'https://readdy.ai/api/search-image?query=luxury%20sofa%20side%20view%20on%20white%20background%2C%20professional%20studio%20photography%20with%20clean%20lighting%2C%20minimalist%20product%20shot%20showing%20furniture%20profile%20and%20proportions&width=800&height=600&seq=product-photo-2&orientation=landscape', category: 'product' },
    { id: 'p10', url: 'https://readdy.ai/api/search-image?query=premium%20sofa%20back%20view%20on%20white%20background%2C%20professional%20product%20photography%20showing%20rear%20design%2C%20clean%20studio%20aesthetic%20with%20soft%20lighting%20and%20minimal%20shadows&width=800&height=600&seq=product-photo-3&orientation=landscape', category: 'product' },
    { id: 'p11', url: 'https://readdy.ai/api/search-image?query=furniture%20dimension%20diagram%20with%20measurements%20and%20specifications%2C%20technical%20drawing%20showing%20sofa%20size%20and%20structure%2C%20professional%20CAD-style%20illustration%20with%20clean%20lines%20and%20annotations&width=800&height=600&seq=size-diagram-1&orientation=landscape', category: 'size' },
    { id: 'p12', url: 'https://readdy.ai/api/search-image?query=sofa%20structure%20exploded%20view%20diagram%2C%20technical%20illustration%20showing%20frame%20construction%20and%20components%2C%20professional%20furniture%20design%20drawing%20with%20labeled%20parts%20and%20assembly%20details&width=800&height=600&seq=structure-diagram-1&orientation=landscape', category: 'size' },
  ]
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = furnitureProducts.find(p => p.id === id);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSpec, setSelectedSpec] = useState(specConfigs[0]);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([specConfigs[0].id]);
  const [selectMode, setSelectMode] = useState<'single' | 'multi'>('single');
  const [selectedColor, setSelectedColor] = useState(materialColors[0]);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [showAddCartSuccess, setShowAddCartSuccess] = useState(false);
  const [specExpanded, setSpecExpanded] = useState(false);
  const [showWechatPreview, setShowWechatPreview] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-center">
          <i className="ri-error-warning-line text-[48px] text-[#8E8E93] mb-3"></i>
          <p className="text-[14px] text-[#8E8E93]">商品不存在</p>
        </div>
      </div>
    );
  }

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    setShowAddCartSuccess(true);
    setTimeout(() => setShowAddCartSuccess(false), 2000);
  };

  const handleBuyNow = () => {
    navigate('/orders/confirm', {
      state: {
        orderItem: {
          id: product.id,
          name: product.name,
          image: product.images[0],
          spec: selectMode === 'single' ? selectedSpec.name : getSelectedSpecSummary(),
          size: selectMode === 'single' ? selectedSpec.size : '多规格组合',
          material: product.specs.material,
          color: selectedColor.name,
          price: selectMode === 'single' ? selectedSpec.price : calculateTotalPrice(),
          quantity: quantity,
          stock: product.stock
        }
      }
    });
  };

  const handleShare = () => setShowShareModal(true);

  const handleCopyLink = async () => {
    const shareUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowCopySuccess(true);
      setTimeout(() => {
        setShowCopySuccess(false);
        setShowShareModal(false);
      }, 1500);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShowCopySuccess(true);
      setTimeout(() => {
        setShowCopySuccess(false);
        setShowShareModal(false);
      }, 1500);
    }
  };

  const handleSystemShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name || '商品分享',
          text: `${product?.name} - ¥${selectedSpec.price.toLocaleString()}`,
          url: window.location.href,
        });
        setShowShareModal(false);
      } catch {
        // 用户取消分享
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWechatShare = () => {
    setShowShareModal(false);
    setShowWechatPreview(true);
  };

  // 切换选择模式
  const handleModeChange = (mode: 'single' | 'multi') => {
    setSelectMode(mode);
    if (mode === 'single') {
      // 保持当前已选的第一个规格
      const firstId = selectedSpecs[0] || specConfigs[0].id;
      setSelectedSpecs([firstId]);
      const firstSelected = specConfigs.find(s => s.id === firstId);
      if (firstSelected) setSelectedSpec(firstSelected);
    }
  };

  // 处理规格选择
  const handleSpecSelect = (spec: typeof specConfigs[0]) => {
    if (selectMode === 'single') {
      setSelectedSpec(spec);
      setSelectedSpecs([spec.id]);
    } else {
      setSelectedSpecs(prev => {
        if (prev.includes(spec.id)) {
          // 至少保留一项
          return prev.length > 1 ? prev.filter(id => id !== spec.id) : prev;
        }
        return [...prev, spec.id];
      });
    }
  };

  // 计算多选模式下的总价
  const calculateTotalPrice = () => {
    return specConfigs
      .filter(spec => selectedSpecs.includes(spec.id))
      .reduce((total, spec) => total + spec.price, 0);
  };

  // 获取已选规格的摘要文本
  const getSelectedSpecSummary = () => {
    if (selectMode === 'single') return selectedSpec.name;
    const names = specConfigs
      .filter(spec => selectedSpecs.includes(spec.id))
      .map(spec => spec.name);
    return names.join('、');
  };

  const displayPrice = selectMode === 'multi' && selectedSpecs.length > 1
    ? calculateTotalPrice()
    : selectedSpec.price;

  const videoCount = mediaData.videos.length;
  const photoCount = mediaData.photos.length;

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-[calc(80px+env(safe-area-inset-bottom))]">
      {/* 顶部导航栏 */}
      <div
        className="fixed top-0 left-0 right-0 z-40 bg-white bg-opacity-80 backdrop-blur-xl border-b border-[#E5E5EA]/50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="h-[44px] flex items-center justify-between px-4">
          <Link to="/products/category" className="w-8 h-8 flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
            <i className="ri-arrow-left-line text-[20px] text-[#1D1D1F]"></i>
          </Link>
          <h1 className="text-[17px] font-semibold text-[#1D1D1F]">商品详情</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-9 h-9 flex items-center justify-center cursor-pointer active:scale-90 transition-transform rounded-full bg-[#07C160]/10"
            >
              <i className="ri-wechat-fill text-[22px] text-[#07C160]"></i>
            </button>
            <button className="w-8 h-8 flex items-center justify-center cursor-pointer active:scale-90 transition-transform">
              <i className="ri-more-line text-[20px] text-[#1D1D1F]"></i>
            </button>
          </div>
        </div>
      </div>

      <div style={{ paddingTop: 'calc(44px + env(safe-area-inset-top))' }}>
        {/* 轮播图区域 */}
        <div className="relative bg-white">
          <div className="relative w-full h-[375px] overflow-hidden">
            <img
              src={product.images[currentImageIndex]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {/* 收藏按钮 */}
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full cursor-pointer active:scale-90 transition-transform"
            >
              <i className={`${isFavorite ? 'ri-heart-fill text-[#1D1D1F]' : 'ri-heart-line text-[#1D1D1F]'} text-[20px]`}></i>
            </button>
            {/* 媒体聚合入口 */}
            <Link
              to={`/products/media/${id}`}
              className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/20 cursor-pointer active:scale-[0.985] transition-transform"
            >
              <div className="flex items-center gap-1">
                <i className="ri-video-line text-[12px] text-white"></i>
                <span className="text-[11px] text-white font-medium">{videoCount}</span>
              </div>
              <div className="w-[1px] h-3 bg-white/30"></div>
              <div className="flex items-center gap-1">
                <i className="ri-image-line text-[12px] text-white"></i>
                <span className="text-[11px] text-white font-medium">{photoCount}</span>
              </div>
            </Link>
          </div>

          {/* 缩略图列表 */}
          <div className="flex items-center gap-2 p-3 overflow-x-auto">
            {product.images.map((img, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-[60px] h-[60px] rounded-[12px] overflow-hidden cursor-pointer border transition-all duration-200 active:scale-95 ${
                  currentImageIndex === index ? 'border-[#1D1D1F] border-[2px]' : 'border-[#E5E5EA]'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* 商品基本信息 */}
        <div className="bg-white mt-[8px] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-[#8E8E93]">产品系列</span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-[12px] text-[#07C160] cursor-pointer active:scale-95 transition-transform"
              >
                <div className="w-6 h-6 flex items-center justify-center bg-[#07C160] rounded-full">
                  <i className="ri-wechat-fill text-[14px] text-white"></i>
                </div>
                <span className="font-medium">分享</span>
              </button>
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="flex items-center gap-1 text-[12px] text-[#8E8E93] cursor-pointer active:scale-95 transition-transform"
              >
                <i className={`${isFavorite ? 'ri-heart-fill text-[#1D1D1F]' : 'ri-heart-line'} text-[14px]`}></i>
                <span>收藏</span>
              </button>
            </div>
          </div>

          <h1 className="text-[22px] font-semibold text-[#1D1D1F] mb-3 leading-[1.3]">
            {product.name}（模块化）
          </h1>

          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-[13px] text-[#8E8E93]">当前价格</span>
            <span className="text-[14px] text-[#1D1D1F]">¥</span>
            <span className="text-[32px] font-bold text-[#1D1D1F]">{displayPrice.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-4 text-[12px] text-[#8E8E93]">
            <span>起订：1</span>
          </div>
        </div>

        {/* 选择规格 - Apple 风格 */}
        <div className="bg-white mt-[8px]">
          {/* 规格头部 - 可点击展开/收起 */}
          <button
            onClick={() => setSpecExpanded(!specExpanded)}
            className="w-full flex items-center justify-between p-4 cursor-pointer active:bg-[#F5F5F7]/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-medium text-[#1D1D1F]">选择规格</h3>
              {!specExpanded && (
                <span className="text-[13px] text-[#8E8E93]">
                  {getSelectedSpecSummary()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!specExpanded && (
                <span className="text-[14px] font-semibold text-[#1D1D1F]">
                  ¥{displayPrice.toLocaleString()}
                </span>
              )}
              <i className={`ri-arrow-down-s-line text-[20px] text-[#8E8E93] transition-transform duration-300 ${specExpanded ? 'rotate-180' : ''}`}></i>
            </div>
          </button>

          {/* 规格内容 - 展开时显示 */}
          <div
            className={`overflow-hidden transition-all duration-400 ease-in-out ${
              specExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-4 pb-4">
              {/* 单选/多选切换 - Apple Segmented Control */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] text-[#8E8E93]">选择方式</span>
                <div className="relative flex items-center bg-[#E8E8ED] rounded-full p-[2px]">
                  <div
                    className="absolute top-[2px] h-[calc(100%-4px)] w-[calc(50%-2px)] bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out"
                    style={{
                      transform: selectMode === 'multi' ? 'translateX(100%)' : 'translateX(0)',
                    }}
                  />
                  <button
                    onClick={() => handleModeChange('single')}
                    className={`relative z-10 px-4 py-1.5 rounded-full text-[13px] cursor-pointer whitespace-nowrap transition-colors duration-200 ${
                      selectMode === 'single' ? 'text-[#1D1D1F] font-semibold' : 'text-[#8E8E93]'
                    }`}
                  >
                    单选
                  </button>
                  <button
                    onClick={() => handleModeChange('multi')}
                    className={`relative z-10 px-4 py-1.5 rounded-full text-[13px] cursor-pointer whitespace-nowrap transition-colors duration-200 ${
                      selectMode === 'multi' ? 'text-[#1D1D1F] font-semibold' : 'text-[#8E8E93]'
                    }`}
                  >
                    多选
                  </button>
                </div>
              </div>

              {/* 多选提示 */}
              {selectMode === 'multi' && (
                <div className="mb-4 px-3 py-2.5 bg-[#F5F5F7] rounded-[12px] flex items-start gap-2">
                  <i className="ri-information-line text-[14px] text-[#8E8E93] mt-0.5"></i>
                  <p className="text-[12px] text-[#6E6E73] leading-[1.5]">
                    多选会合并图片并合计价格，购买会分别加入购物车并一起结算
                  </p>
                </div>
              )}

              {/* Apple 风格规格卡片 */}
              <div className="grid grid-cols-2 gap-3">
                {specConfigs.map((spec) => {
                  const isSelected = selectMode === 'single'
                    ? selectedSpec.id === spec.id
                    : selectedSpecs.includes(spec.id);
                  return (
                    <button
                      key={spec.id}
                      onClick={() => handleSpecSelect(spec)}
                      className={`relative flex flex-col items-center p-4 rounded-[16px] cursor-pointer transition-all duration-250 active:scale-[0.97] border-2 ${
                        isSelected
                          ? 'border-[#1D1D1F] bg-white shadow-[0_0_0_1px_#1D1D1F]'
                          : 'border-[#E5E5EA] bg-white hover:border-[#C7C7CC]'
                      }`}
                    >
                      {/* 多选模式勾选标记 */}
                      {selectMode === 'multi' && isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center bg-[#1D1D1F] rounded-full">
                          <i className="ri-check-line text-[12px] text-white"></i>
                        </div>
                      )}
                      <span className={`text-[15px] mb-1 ${isSelected ? 'text-[#1D1D1F] font-semibold' : 'text-[#1D1D1F] font-medium'}`}>
                        {spec.name}
                      </span>
                      <span className="text-[11px] text-[#8E8E93] mb-2">{spec.size}</span>
                      <div className="flex items-baseline">
                        <span className="text-[11px] text-[#1D1D1F]">¥</span>
                        <span className={`text-[18px] ${isSelected ? 'font-bold' : 'font-semibold'} text-[#1D1D1F]`}>
                          {spec.price.toLocaleString()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 多选模式下显示合计 */}
              {selectMode === 'multi' && selectedSpecs.length > 1 && (
                <div className="mt-4 pt-3 border-t border-[#E5E5EA] flex items-center justify-between">
                  <span className="text-[13px] text-[#8E8E93]">
                    已选 {selectedSpecs.length} 项
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[13px] text-[#8E8E93]">合计：</span>
                    <span className="text-[12px] text-[#1D1D1F]">¥</span>
                    <span className="text-[20px] font-bold text-[#1D1D1F]">
                      {calculateTotalPrice().toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 材质颜色 */}
        <div className="bg-white mt-[8px] p-4">
          <h3 className="text-[15px] font-medium text-[#1D1D1F] mb-3">材质颜色</h3>
          <div className="flex flex-wrap gap-3">
            {materialColors.slice(0, 8).map((color) => (
              <button
                key={color.id}
                onClick={() => setSelectedColor(color)}
                className={`w-10 h-10 rounded-[12px] cursor-pointer transition-all duration-200 active:scale-90 ${
                  selectedColor.id === color.id
                    ? 'ring-2 ring-[#1D1D1F] ring-offset-2'
                    : 'ring-1 ring-[#E5E5EA]'
                }`}
                style={{ backgroundColor: color.color }}
                title={color.name}
              />
            ))}
          </div>
          <p className="text-[12px] text-[#8E8E93] mt-3">
            已选：<span className="text-[#1D1D1F] font-medium">{selectedColor.name}</span>
          </p>
        </div>

        {/* 数量选择 */}
        <div className="bg-white mt-[8px] p-4">
          <h3 className="text-[15px] font-medium text-[#1D1D1F] mb-3">数量</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className={`w-10 h-10 flex items-center justify-center rounded-[12px] cursor-pointer transition-all duration-200 border active:scale-95 ${
                quantity <= 1
                  ? 'bg-[#F5F5F7] text-[#C6C6C8] border-[#E5E5EA]'
                  : 'bg-white text-[#1D1D1F] border-[#E5E5EA]'
              }`}
            >
              <i className="ri-subtract-line text-[18px]"></i>
            </button>
            <div className="w-16 bg-[#F5F5F7] rounded-[12px] px-4 py-2 text-center border border-[#E5E5EA]">
              <span className="text-[15px] font-medium text-[#1D1D1F]">{quantity}</span>
            </div>
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= product.stock}
              className={`w-10 h-10 flex items-center justify-center rounded-[12px] cursor-pointer transition-all duration-200 border active:scale-95 ${
                quantity >= product.stock
                  ? 'bg-[#F5F5F7] text-[#C6C6C8] border-[#E5E5EA]'
                  : 'bg-white text-[#1D1D1F] border-[#E5E5EA]'
              }`}
            >
              <i className="ri-add-line text-[18px]"></i>
            </button>
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div
        className="fixed left-0 right-0 z-40 bg-white bg-opacity-80 backdrop-blur-xl border-t border-[#E5E5EA]/50"
        style={{
          bottom: '0',
          paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
          paddingTop: '8px'
        }}
      >
        <div className="h-[60px] flex items-center px-4 gap-3">
          <button className="w-11 h-11 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform">
            <i className="ri-customer-service-line text-[20px] text-[#1D1D1F] mb-0.5"></i>
            <span className="text-[10px] text-[#8E8E93]">客服</span>
          </button>
          <button
            onClick={() => navigate('/cart')}
            className="w-11 h-11 flex flex-col items-center justify-center cursor-pointer relative active:scale-95 transition-transform"
          >
            <i className="ri-shopping-cart-line text-[20px] text-[#1D1D1F] mb-0.5"></i>
            <span className="text-[10px] text-[#8E8E93]">购物车</span>
            <div className="absolute top-0 right-0 min-w-[16px] h-[16px] flex items-center justify-center bg-[#1D1D1F] rounded-full px-1">
              <span className="text-[10px] text-white font-medium">3</span>
            </div>
          </button>
          <button
            onClick={handleAddToCart}
            className="flex-1 h-[48px] bg-white rounded-[16px] text-[15px] text-[#1D1D1F] font-medium cursor-pointer whitespace-nowrap transition-all duration-200 flex items-center justify-center gap-1.5 border border-[#D2D2D7] active:bg-[#F5F5F7]"
          >
            <i className="ri-shopping-cart-2-line text-[16px]"></i>
            <span>加入购物车</span>
          </button>
          <button
            onClick={handleBuyNow}
            className="flex-1 h-[48px] bg-white rounded-[16px] text-[15px] text-[#1D1D1F] font-medium cursor-pointer whitespace-nowrap transition-all duration-200 border border-[#D2D2D7] active:bg-[#F5F5F7]"
          >
            立即购买
          </button>
        </div>
      </div>

      {/* 分享弹窗 */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="w-full bg-white rounded-t-[20px] overflow-hidden animate-[slideUp_0.3s_ease-out]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#E5E5EA]">
              <h3 className="text-[17px] font-semibold text-[#1D1D1F]">分享商品</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="w-8 h-8 flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
              >
                <i className="ri-close-line text-[20px] text-[#8E8E93]"></i>
              </button>
            </div>

            {/* 商品预览卡片 */}
            <div className="p-4 flex items-center gap-3 bg-[#F5F5F7]/50">
              <div className="w-16 h-16 rounded-[12px] overflow-hidden flex-shrink-0">
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] text-[#1D1D1F] font-medium line-clamp-2">{product.name}</p>
                <p className="text-[14px] text-[#1D1D1F] font-semibold mt-1">¥{displayPrice.toLocaleString()}</p>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-4 gap-6">
                <button onClick={handleWechatShare} className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform">
                  <div className="w-14 h-14 flex items-center justify-center bg-[#07C160] rounded-[16px]">
                    <i className="ri-wechat-fill text-[28px] text-white"></i>
                  </div>
                  <span className="text-[12px] text-[#1D1D1F]">微信</span>
                </button>
                <button onClick={handleWechatShare} className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform">
                  <div className="w-14 h-14 flex items-center justify-center bg-[#07C160] rounded-[16px]">
                    <i className="ri-wechat-2-fill text-[28px] text-white"></i>
                  </div>
                  <span className="text-[12px] text-[#1D1D1F]">朋友圈</span>
                </button>
                <button onClick={handleCopyLink} className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform">
                  <div className="w-14 h-14 flex items-center justify-center bg-[#F5F5F7] rounded-[16px]">
                    <i className="ri-link text-[28px] text-[#1D1D1F]"></i>
                  </div>
                  <span className="text-[12px] text-[#1D1D1F]">复制链接</span>
                </button>
                <button onClick={handleSystemShare} className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform">
                  <div className="w-14 h-14 flex items-center justify-center bg-[#F5F5F7] rounded-[16px]">
                    <i className="ri-more-fill text-[28px] text-[#1D1D1F]"></i>
                  </div>
                  <span className="text-[12px] text-[#1D1D1F]">更多</span>
                </button>
              </div>
            </div>

            <div className="px-4 pb-4">
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full h-12 bg-[#F5F5F7] rounded-[12px] text-[16px] text-[#1D1D1F] font-medium cursor-pointer whitespace-nowrap border border-[#E5E5EA] active:scale-[0.98] transition-transform"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 微信分享预览弹窗 */}
      {showWechatPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowWechatPreview(false)}
        >
          <div
            className="w-[340px] bg-white rounded-[16px] overflow-hidden shadow-2xl animate-[scaleIn_0.25s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 微信聊天模拟头部 */}
            <div className="bg-[#EDEDED] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-arrow-left-s-line text-[18px] text-[#1D1D1F]"></i>
                </div>
                <span className="text-[15px] font-medium text-[#1D1D1F]">好友</span>
              </div>
              <i className="ri-more-fill text-[18px] text-[#1D1D1F]"></i>
            </div>

            {/* 微信聊天背景 */}
            <div className="bg-[#EDEDED] px-4 py-6 min-h-[280px] flex flex-col items-end justify-center">
              {/* 发送者头像和消息 */}
              <div className="flex items-start gap-2 max-w-[85%]">
                {/* 分享卡片 */}
                <div ref={shareCardRef} className="bg-white rounded-[8px] overflow-hidden shadow-sm w-full">
                  <div className="p-3">
                    <p className="text-[14px] text-[#1D1D1F] font-medium leading-[1.4] line-clamp-2 mb-2">
                      {product.name}（模块化）
                    </p>
                    <div className="flex items-start gap-2.5">
                      <div className="w-[48px] h-[48px] rounded-[4px] overflow-hidden flex-shrink-0">
                        <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-[#8E8E93] line-clamp-2 leading-[1.4]">
                          {selectedSpec.name} · {selectedColor.name} · ¥{displayPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="h-[1px] bg-[#E5E5EA]"></div>
                  <div className="px-3 py-1.5 flex items-center gap-1.5">
                    <div className="w-[14px] h-[14px] rounded-[3px] bg-[#1D1D1F] flex items-center justify-center">
                      <i className="ri-home-4-fill text-[9px] text-white"></i>
                    </div>
                    <span className="text-[11px] text-[#8E8E93]">意式轻奢家具</span>
                  </div>
                </div>
                {/* 头像 */}
                <div className="w-[36px] h-[36px] rounded-[6px] bg-[#07C160] flex items-center justify-center flex-shrink-0">
                  <i className="ri-user-fill text-[18px] text-white"></i>
                </div>
              </div>

              {/* 时间标签 */}
              <div className="w-full flex justify-center mt-4">
                <span className="text-[11px] text-[#B2B2B2] bg-[#DADADA] px-2 py-0.5 rounded-[3px]">刚刚</span>
              </div>
            </div>

            {/* 底部操作 */}
            <div className="bg-white px-4 py-4 flex flex-col gap-3">
              <p className="text-[13px] text-[#8E8E93] text-center">分享卡片预览</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWechatPreview(false)}
                  className="flex-1 h-[44px] bg-[#F5F5F7] rounded-[12px] text-[15px] text-[#1D1D1F] font-medium cursor-pointer whitespace-nowrap active:scale-[0.98] transition-transform"
                >
                  关闭
                </button>
                <button
                  onClick={() => {
                    handleCopyLink();
                    setShowWechatPreview(false);
                  }}
                  className="flex-1 h-[44px] bg-[#07C160] rounded-[12px] text-[15px] text-white font-medium cursor-pointer whitespace-nowrap active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
                >
                  <i className="ri-file-copy-line text-[16px]"></i>
                  复制链接分享
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 复制成功提示 */}
      {showCopySuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="bg-black/80 rounded-[20px] px-8 py-6 flex flex-col items-center">
            <div className="w-14 h-14 flex items-center justify-center bg-[#1D1D1F] rounded-full mb-3">
              <i className="ri-check-line text-[28px] text-white"></i>
            </div>
            <p className="text-[15px] text-white font-medium">链接已复制</p>
          </div>
        </div>
      )}

      {/* 加入购物车成功提示 */}
      {showAddCartSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-black/80 rounded-[20px] px-8 py-6 flex flex-col items-center">
            <div className="w-14 h-14 flex items-center justify-center bg-[#1D1D1F] rounded-full mb-3">
              <i className="ri-check-line text-[28px] text-white"></i>
            </div>
            <p className="text-[15px] text-white font-medium">已加入购物车</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
