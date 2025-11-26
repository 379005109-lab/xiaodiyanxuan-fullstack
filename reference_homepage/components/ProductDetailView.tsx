
import React, { useState, useEffect, useMemo } from 'react';
import { ProductDetail, ProductMaterial, Page, CartItem } from '../types';
import { ChevronRight, Minus, Plus, Share2, Heart, PlayCircle, Lock, Download, Maximize2, ShoppingBag, ArrowLeftRight, PenTool, ChevronDown, ChevronUp, Layers, Component, Footprints, ShoppingCart, Info, Check, FileText, Box, Ruler, Play, Star, Truck } from 'lucide-react';

interface ProductDetailViewProps {
  product: ProductDetail;
  onBack: () => void;
  setCurrentPage: (page: Page) => void;
  onAddToCompare?: (product: ProductDetail) => void;
  onCheckout: (items: CartItem[], total: number) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onRequestCustomization: (productName: string) => void;
  isLoggedIn: boolean;
  onRequireLogin: () => void;
}

// --- RICH CONFIG DATA (Internal UI assets) ---
const FILLING_OPTIONS = [
    { 
        id: 'f1', name: '55D高回弹海绵', price: 0, desc: '支撑型', 
        image: 'https://images.unsplash.com/photo-1589139223706-b39b567d1217?auto=format&fit=crop&q=80&w=200',
        detailImage: 'https://images.unsplash.com/photo-1517260739337-6799d239ce83?auto=format&fit=crop&q=80&w=800',
        longDesc: '采用出口级55D高密度聚氨酯海绵，回弹率>55%，经过72小时疲劳测试，十年坐感如初，提供恰到好处的支撑力，保护脊椎健康。适合喜欢偏硬坐感的用户。'
    },
    { 
        id: 'f2', name: '70%羽绒 + 乳胶', price: 800, desc: '云端包裹感', 
        image: 'https://images.unsplash.com/photo-1616627561950-9f84a1c6a7a9?auto=format&fit=crop&q=80&w=200',
        detailImage: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=800',
        longDesc: '奢华级配置。顶层填充70%精选白鹅绒，带来“陷进去”的包裹感；中层采用2cm泰国天然乳胶，Q弹透气；底层搭配高回弹海绵作为基座。坐感软硬适中，透气防螨。'
    }
];

const FRAME_OPTIONS = [
    { 
        id: 'fr1', name: '俄罗斯落叶松', price: 0, desc: '进口实木', 
        image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&q=80&w=200',
        detailImage: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&q=80&w=800',
        longDesc: '精选俄罗斯高寒地带落叶松，生长周期长，木质坚硬。含水率严格控制在12%以下，经过高温蒸汽烘干处理，结构致密，纹理直，耐腐蚀性强，是制作高端家具内架的首选良材。'
    },
    { 
        id: 'fr2', name: '碳素钢内架', price: 1200, desc: '终身质保', 
        image: 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&q=80&w=200',
        detailImage: 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&q=80&w=800',
        longDesc: '航空级高强度碳素钢，采用一体成型焊接工艺。承重力是普通实木框架的3倍，永无异响，不发霉，不生锈。不仅环保，更承诺内架终身质保，稳固如初。'
    }
];

const BASE_OPTIONS = [
    { id: 'b1', name: '黑钛不锈钢', price: 0, image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=200', longDesc: '304不锈钢电镀黑钛工艺，表面采用纳米拉丝处理，质感细腻冷峻。具有极强的耐氧化和耐腐蚀性，稳固防滑，适合现代极简风格空间。' },
    { id: 'b2', name: '北美黑胡桃木', price: 400, image: 'https://images.unsplash.com/photo-1611486212557-88be5ff6f941?auto=format&fit=crop&q=80&w=200', longDesc: 'FAS级北美黑胡桃木，纯手工打磨，保留天然木纹。色泽温润，随着时间推移会呈现出独特的包浆光泽，为空间增添一份自然与温情，体现不凡品味。' }
];

const ProductDetailView: React.FC<ProductDetailViewProps> = ({ 
    product, onBack, setCurrentPage, onAddToCompare, onCheckout, isWishlisted, onToggleWishlist, onRequestCustomization, isLoggedIn, onRequireLogin
}) => {
  const [selectedSpecId, setSelectedSpecId] = useState<string>(product.specs[0]?.id);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(product.materials[0]?.id);
  
  // Config States
  const [selectedFilling, setSelectedFilling] = useState(FILLING_OPTIONS[0].id);
  const [selectedFrame, setSelectedFrame] = useState(FRAME_OPTIONS[0].id);
  const [selectedBase, setSelectedBase] = useState(BASE_OPTIONS[0].id);

  // UI States
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(product.images[0] || product.imageUrl);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [expandedMaterialGroups, setExpandedMaterialGroups] = useState<Record<string, boolean>>({'进口棉麻': true});

  // Calculations
  const selectedSpec = product.specs.find(s => s.id === selectedSpecId);
  const selectedMaterial = product.materials.find(m => m.id === selectedMaterialId);
  const fillingOption = FILLING_OPTIONS.find(f => f.id === selectedFilling);
  const frameOption = FRAME_OPTIONS.find(f => f.id === selectedFrame);
  const baseOption = BASE_OPTIONS.find(b => b.id === selectedBase);
  
  const extraPrice = (selectedMaterial?.priceModifier || 0) + (fillingOption?.price || 0) + (frameOption?.price || 0) + (baseOption?.price || 0);
  const currentPrice = (selectedSpec?.price || product.price) + extraPrice;
  const originalPrice = (selectedSpec?.originalPrice || product.price * 1.2);

  // Group Materials
  const materialGroups = useMemo(() => {
    const groups: Record<string, ProductMaterial[]> = {};
    product.materials.forEach(mat => {
        const groupName = mat.group || 'Classic';
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(mat);
    });
    return groups;
  }, [product.materials]);

  const toggleMaterialGroup = (groupName: string) => {
      setExpandedMaterialGroups(prev => ({
          ...prev,
          [groupName]: !prev[groupName]
      }));
  };

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleAction = (type: 'cart' | 'buy') => {
      if (!isLoggedIn) { onRequireLogin(); return; }
      if (!selectedSpec || !selectedMaterial) return;
      
      if (type === 'cart') {
          alert(`已加入购物车: ${product.name} x${quantity}\n配置: ${selectedSpec.name} | ${selectedMaterial.name}`);
      } else {
          const item: CartItem = {
              id: `temp_${Date.now()}`, productId: product.id, name: product.name, price: currentPrice,
              image: product.imageUrl, spec: selectedSpec.name, material: selectedMaterial.name, quantity, selected: true
          };
          onCheckout([item], currentPrice * quantity);
      }
  };

  const handleMediaAccess = () => {
      if (!isLoggedIn) onRequireLogin();
  };

  const handleDownload = (type: string) => {
    if (!isLoggedIn) { onRequireLogin(); return; }
    alert(`开始下载 ${type} ...`);
  };

  const visibleSpecs = showAllSpecs ? product.specs : product.specs.slice(0, 2);

  // Reusable Insight Panel Component
  const InsightPanel = ({ option }: { option: any }) => (
      <div className="mt-3 bg-stone-50 rounded-xl p-5 border border-stone-200 animate-fade-in-up flex flex-col sm:flex-row gap-5 relative overflow-hidden group">
          <div className="w-full sm:w-32 aspect-video rounded-lg overflow-hidden border border-stone-200 flex-shrink-0 shadow-sm">
              <img src={option.detailImage} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          </div>
          <div className="flex-1 relative z-10">
              <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-stone-800 text-sm">{option.name}</h4>
                  <span className="text-[10px] bg-stone-200 text-stone-500 px-1.5 py-0.5 rounded">工艺详解</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed text-justify">{option.longDesc}</p>
              {option.price > 0 && (
                  <div className="mt-2 text-xs font-bold text-[#C04E39]">升级费用: +¥{option.price}</div>
              )}
          </div>
      </div>
  );

  // Specialized Material Insight Panel
  const MaterialInsightPanel = ({ material }: { material: ProductMaterial }) => (
      <div className="mt-3 p-4 bg-white rounded-xl border-l-4 border-primary shadow-sm animate-fade-in-up flex gap-4 ring-1 ring-stone-100">
          <div className="w-20 h-20 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden flex-shrink-0 relative group cursor-zoom-in">
              <img src={material.thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-125" />
          </div>
          <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-stone-900 text-sm">{material.name}</h4>
                  {material.isHot && <span className="text-[9px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-bold border border-red-100">HOT</span>}
                  {material.priceModifier && material.priceModifier > 0 && <span className="text-[9px] text-[#C04E39] bg-red-50 px-1.5 py-0.5 rounded border border-red-100">+¥{material.priceModifier}</span>}
              </div>
              <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                  {(material as any).description || "精选面料，质感细腻，耐磨透气。"}
              </p>
              {(material as any).detailImage && (
                  <button onClick={() => setActiveImage((material as any).detailImage)} className="mt-2 text-[10px] text-primary hover:underline flex items-center gap-1">
                      <Maximize2 className="w-3 h-3" /> 查看大图
                  </button>
              )}
          </div>
      </div>
  );

  return (
    <div className="animate-fade-in-up pb-32 bg-white font-sans text-stone-800">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-stone-100 shadow-sm transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center text-xs text-stone-500 gap-1.5">
                <span onClick={() => setCurrentPage('home')} className="cursor-pointer hover:text-primary">首页</span> <ChevronRight className="w-3 h-3"/>
                <span onClick={onBack} className="cursor-pointer hover:text-primary">商城</span> <ChevronRight className="w-3 h-3"/>
                <span className="text-stone-900 font-medium truncate max-w-[150px]">{product.name}</span>
            </div>
            <div className="flex gap-2">
                <button onClick={() => onToggleWishlist(product.id)} className={`p-2 rounded-full hover:bg-stone-50 transition-colors ${isWishlisted ? 'text-red-500 bg-red-50' : 'text-stone-400'}`} title="收藏"><Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} /></button>
                <button onClick={() => onAddToCompare?.(product)} className="p-2 rounded-full hover:bg-stone-50 text-stone-400 transition-colors" title="加入对比"><ArrowLeftRight className="w-4 h-4" /></button>
                <button className="p-2 rounded-full hover:bg-stone-50 text-stone-400 transition-colors" title="分享"><Share2 className="w-4 h-4" /></button>
            </div>
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* LEFT: Visuals (Sticky 7 cols) */}
        <div className="lg:col-span-7 h-fit lg:sticky lg:top-20 transition-all space-y-8">
            {/* Main Image */}
            <div className="space-y-4">
                <div className="aspect-[4/3] bg-stone-100 rounded-2xl overflow-hidden shadow-sm relative group cursor-zoom-in border border-stone-100" onClick={() => !isLoggedIn && onRequireLogin()}>
                    <img src={activeImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={product.name} />
                    <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-white transition-colors text-stone-700"><Maximize2 className="w-3 h-3"/> 查看原图</span>
                    </div>
                </div>
                <div className="grid grid-cols-5 gap-3">
                    {product.images.map((img, i) => (
                        <div key={i} onClick={() => setActiveImage(img)} className={`aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${activeImage === img ? 'border-primary ring-1 ring-primary ring-offset-1' : 'border-transparent hover:border-stone-200'}`}>
                            <img src={img} className="w-full h-full object-cover" alt="" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Design Concept */}
            <section className="bg-stone-50 p-8 rounded-2xl border border-stone-100">
                <h3 className="font-serif font-bold text-lg text-primary mb-4 flex items-center gap-2"><Info className="w-4 h-4"/> 设计理念 Design Concept</h3>
                <p className="text-sm text-stone-600 leading-relaxed text-justify mb-6">{product.description}</p>
                <div className="flex items-center justify-between pt-6 border-t border-stone-200">
                    <div className="text-center"><div className="text-[10px] text-stone-400 uppercase mb-1">Series</div><div className="font-bold text-sm text-stone-800">Minimalist 2025</div></div>
                    <div className="w-px h-8 bg-stone-200"></div>
                    <div className="text-center"><div className="text-[10px] text-stone-400 uppercase mb-1">Warranty</div><div className="font-bold text-sm text-stone-800">10 Years</div></div>
                    <div className="w-px h-8 bg-stone-200"></div>
                    <div className="text-center"><div className="text-[10px] text-stone-400 uppercase mb-1">Delivery</div><div className="font-bold text-sm text-stone-800">White Glove</div></div>
                </div>
            </section>

            {/* Cinematic Video */}
            <section className="relative aspect-video bg-black rounded-2xl overflow-hidden group cursor-pointer shadow-lg ring-1 ring-stone-900/5" onClick={handleMediaAccess}>
                <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover opacity-70 group-hover:opacity-50 transition-opacity" alt="Video" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 text-white fill-white ml-1" />
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                    <h4 className="font-bold text-lg">沉浸式产品体验</h4>
                    <p className="text-xs opacity-80 font-mono mt-1">4K HDR | 03:45</p>
                </div>
                {!isLoggedIn && <div className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1"><Lock className="w-3 h-3" /> Login Required</div>}
            </section>

            {/* Downloads */}
            <section className="p-6 bg-white rounded-2xl border border-stone-200">
                <h3 className="font-bold text-sm text-stone-800 mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-primary"/> 设计资源下载</h3>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleDownload('3D Model')} className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 hover:border-primary/50 hover:bg-primary/5 transition-all group text-left">
                        <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center text-stone-500 group-hover:bg-primary group-hover:text-white transition-colors"><Box className="w-5 h-5"/></div>
                        <div><div className="text-sm font-bold text-stone-700">3D 模型</div><div className="text-xs text-stone-400">.MAX / .OBJ</div></div>
                        <Download className="w-4 h-4 text-stone-300 ml-auto group-hover:text-primary"/>
                    </button>
                    <button onClick={() => handleDownload('CAD')} className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 hover:border-primary/50 hover:bg-primary/5 transition-all group text-left">
                        <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center text-stone-500 group-hover:bg-primary group-hover:text-white transition-colors"><Ruler className="w-5 h-5"/></div>
                        <div><div className="text-sm font-bold text-stone-700">CAD 节点</div><div className="text-xs text-stone-400">.DWG</div></div>
                        <Download className="w-4 h-4 text-stone-300 ml-auto group-hover:text-primary"/>
                    </button>
                </div>
            </section>
        </div>

        {/* RIGHT: Configuration (5 cols) */}
        <div className="lg:col-span-5 space-y-8">
            
            {/* Header Info */}
            <div>
                <h1 className="text-3xl font-serif font-bold text-primary leading-tight mb-2">{product.name}</h1>
                <div className="flex items-center gap-3 mb-6">
                    <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded font-mono">{product.modelNo}</span>
                    <span className="flex items-center gap-1 text-xs text-stone-500"><Star className="w-3 h-3 text-yellow-400 fill-current"/> 4.9</span>
                    <span className="flex items-center gap-1 text-xs text-stone-500"><Truck className="w-3 h-3"/> {product.leadTime || '7-15 days'}</span>
                </div>
                <div className="flex items-end gap-3 pb-6 border-b border-stone-100">
                    <span className="text-4xl font-serif font-bold text-[#C04E39]">¥{currentPrice.toLocaleString()}</span>
                    <span className="text-sm text-stone-400 line-through mb-1">¥{originalPrice.toFixed(0)}</span>
                    {extraPrice > 0 && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded mb-2">+¥{extraPrice} 选配费</span>}
                </div>
            </div>

            {/* 1. Specs */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2"><Ruler className="w-4 h-4 text-primary"/> 规格尺寸</h3>
                </div>
                <div className="space-y-2">
                    {visibleSpecs.map(spec => (
                        <div 
                            key={spec.id}
                            onClick={() => setSelectedSpecId(spec.id)}
                            className={`flex justify-between items-center p-3.5 rounded-xl border cursor-pointer transition-all group ${selectedSpecId === spec.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-stone-200 hover:border-stone-300'}`}
                        >
                            <div>
                                <div className="font-bold text-sm text-stone-800">{spec.name}</div>
                                <div className="text-xs text-stone-500 mt-0.5 font-mono">{spec.dimensions}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-sm text-primary">¥{spec.price.toLocaleString()}</div>
                                {selectedSpecId === spec.id && <Check className="w-4 h-4 text-primary ml-auto mt-1" />}
                            </div>
                        </div>
                    ))}
                    {product.specs.length > 2 && (
                        <button onClick={() => setShowAllSpecs(!showAllSpecs)} className="w-full py-2 text-xs text-stone-400 hover:text-primary flex items-center justify-center gap-1 border border-dashed border-stone-200 rounded-lg transition-colors">
                            {showAllSpecs ? <>收起 <ChevronUp className="w-3 h-3"/></> : <>查看全部规格 <ChevronDown className="w-3 h-3"/></>}
                        </button>
                    )}
                </div>
            </div>

            {/* 2. Materials (High Density Grid) */}
            <div>
                <h3 className="text-sm font-bold text-stone-900 mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-primary"/> 材质面料</h3>
                <div className="space-y-6">
                    {Object.entries(materialGroups).map(([groupName, mats]) => {
                        const typedMats = mats as ProductMaterial[];
                        const isExpanded = expandedMaterialGroups[groupName] || false;
                        // Show more items if expanded, but always show at least 12 for grid density demo
                        const visibleMats = (typedMats.length > 12 && !isExpanded) ? typedMats.slice(0, 12) : typedMats;
                        
                        return (
                        <div key={groupName} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-stone-600 uppercase">{groupName}</span>
                                    <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-500">{typedMats.length}</span>
                                </div>
                                {typedMats.length > 12 && (
                                    <button onClick={() => toggleMaterialGroup(groupName)} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                                        {isExpanded ? '收起' : '展开全部'}
                                    </button>
                                )}
                            </div>
                            
                            {/* Swatch Grid - High Density */}
                            <div className="grid grid-cols-6 gap-2">
                                {visibleMats.map(mat => (
                                    <button
                                        key={mat.id}
                                        onClick={() => setSelectedMaterialId(mat.id)}
                                        className={`relative aspect-square rounded-md overflow-hidden border transition-all group ${selectedMaterialId === mat.id ? 'border-primary ring-2 ring-primary ring-offset-1 z-10 scale-110' : 'border-stone-200 hover:border-stone-300 hover:scale-105'}`}
                                        title={mat.name}
                                    >
                                        <img src={mat.thumbnail} className="w-full h-full object-cover" alt={mat.name} />
                                        {selectedMaterialId === mat.id && (
                                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[1px]">
                                                <Check className="w-4 h-4 text-white drop-shadow-md" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Dynamic Insight Panel */}
                            {typedMats.some(m => m.id === selectedMaterialId) && selectedMaterial && (
                                <MaterialInsightPanel material={selectedMaterial} />
                            )}
                        </div>
                        );
                    })}
                </div>
            </div>

            {/* 3. Structure (Visual Cards) */}
            <div className="space-y-6 pt-6 border-t border-stone-100">
                {/* Filling */}
                <div>
                    <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2"><Component className="w-4 h-4 text-primary"/> 填充配置</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {FILLING_OPTIONS.map(opt => (
                            <button 
                                key={opt.id}
                                onClick={() => setSelectedFilling(opt.id)}
                                className={`p-2.5 rounded-xl border flex items-center gap-3 text-left transition-all ${selectedFilling === opt.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-stone-200 hover:border-stone-300'}`}
                            >
                                <img src={opt.image} className="w-10 h-10 rounded-lg object-cover bg-stone-200" alt=""/>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold text-stone-800 truncate">{opt.name}</div>
                                    <div className="text-[10px] text-stone-500 truncate">{opt.desc}</div>
                                </div>
                                {opt.price > 0 && <div className="text-[9px] font-bold text-[#C04E39] bg-white px-1.5 py-0.5 rounded border border-red-100">+{opt.price}</div>}
                            </button>
                        ))}
                    </div>
                    {fillingOption && <InsightPanel option={fillingOption} />}
                </div>

                {/* Frame & Base */}
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2"><Box className="w-4 h-4 text-primary"/> 骨架</h3>
                        <div className="space-y-2">
                            {FRAME_OPTIONS.map(opt => (
                                <button key={opt.id} onClick={() => setSelectedFrame(opt.id)} className={`w-full text-left px-3 py-2.5 rounded-lg text-xs border transition-all ${selectedFrame === opt.id ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}>
                                    {opt.name} {opt.price > 0 && `(+¥${opt.price})`}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2"><Footprints className="w-4 h-4 text-primary"/> 脚架</h3>
                        <div className="space-y-2">
                            {BASE_OPTIONS.map(opt => (
                                <button key={opt.id} onClick={() => setSelectedBase(opt.id)} className={`w-full text-left px-3 py-2.5 rounded-lg text-xs border transition-all ${selectedBase === opt.id ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}>
                                    {opt.name} {opt.price > 0 && `(+¥${opt.price})`}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Customization */}
            <div className="bg-gradient-to-r from-accent/10 to-transparent p-4 rounded-xl border border-accent/20 flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-primary text-sm mb-0.5">需要特殊定制？</h4>
                    <p className="text-[10px] text-stone-600">支持尺寸修改 / 颜色定制 / 材质更换</p>
                </div>
                <button onClick={() => onRequestCustomization(product.name)} className="bg-white text-primary px-4 py-2 rounded-lg text-xs font-bold shadow-sm border border-stone-200 hover:border-primary hover:text-accent transition-colors flex items-center gap-2">
                    <PenTool className="w-3 h-3" /> 申请定制
                </button>
            </div>

        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur border-t border-stone-200 p-4 z-50 shadow-2xl">
         <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <div className="hidden md:flex flex-col">
                <span className="text-[10px] text-stone-400 uppercase tracking-widest">Estimated Total</span>
                <div className="flex items-baseline gap-2">
                    <span className="font-serif font-bold text-3xl text-[#C04E39]">¥{(currentPrice * quantity).toLocaleString()}</span>
                    <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded">含税出厂价</span>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center border border-stone-200 rounded-xl h-12 bg-white px-1">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-full flex items-center justify-center hover:bg-stone-50 text-stone-500 rounded-l-lg transition-colors"><Minus className="w-4 h-4" /></button>
                    <span className="w-8 text-center font-bold text-stone-800 text-sm">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-full flex items-center justify-center hover:bg-stone-50 text-stone-500 rounded-r-lg transition-colors"><Plus className="w-4 h-4" /></button>
                </div>

                <button onClick={() => handleAction('cart')} className="flex-1 md:flex-none md:w-40 h-12 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                    <ShoppingCart className="w-4 h-4" /> 加入购物车
                </button>

                <button onClick={() => handleAction('buy')} className="flex-1 md:flex-none md:w-48 h-12 bg-primary text-white font-bold rounded-xl hover:bg-green-900 shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5">
                    <ShoppingBag className="w-4 h-4" /> 立即购买
                </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ProductDetailView;
