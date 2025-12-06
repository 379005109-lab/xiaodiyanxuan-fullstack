import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Heart, Share2, ShoppingCart, ArrowUpDown, ArrowLeftRight, Maximize, Minus, Plus, MoreHorizontal, Check, X, ChevronRight, ShoppingBag } from 'lucide-react';
import { Product, Variant } from '../types';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

const GRADIENT_BTN = "bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-glow text-white hover:scale-105 active:scale-95 transition-all duration-300";

export const ProductDetail: React.FC<ProductDetailProps> = ({ product, onBack, onAddToCart }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSpecs, setShowSpecs] = useState(false);
  const [showColorSheet, setShowColorSheet] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || '');
  
  // Gallery Logic
  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Variant Logic
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(product.variants && product.variants.length > 0 ? product.variants[0] : null);

  const displayImage = selectedVariant ? selectedVariant.image : images[currentImageIndex];
  const displayPrice = selectedVariant && selectedVariant.price ? selectedVariant.price : product.price;

  // Handle image swipe
  const nextImage = () => {
      setSelectedVariant(null); 
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };
  const prevImage = () => {
      setSelectedVariant(null);
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] relative flex flex-col animate-fade-in">
      
      {/* Header Bar */}
      <div className="flex justify-between items-center px-6 py-6 z-50">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center hover:bg-white transition-colors shadow-sm">
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>
        <div className="flex items-center gap-4">
            <h1 className="text-sm font-bold text-gray-800/80 drop-shadow-md truncate max-w-[150px]">{product.name}</h1>
            <button 
                onClick={() => setIsFavorite(!isFavorite)}
                className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center hover:bg-white transition-colors shadow-sm group"
            >
                <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'text-red-500 fill-red-500 scale-110' : 'text-gray-800 group-hover:text-red-400'}`} />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center hover:bg-white transition-colors shadow-sm">
                <MoreHorizontal className="w-5 h-5 text-gray-800" />
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
          
          {/* Left Side Dimensions Sidebar (Interactive) */}
          <div className="absolute left-6 top-12 flex flex-col gap-4 z-20">
              {/* Height */}
              <button onClick={() => setShowSpecs(true)} className="w-14 h-14 rounded-2xl bg-white/40 backdrop-blur-md flex flex-col items-center justify-center shadow-sm text-gray-700 border border-white/50 hover:bg-white/60 transition-colors">
                  <div className="text-emerald-500">
                      <ArrowUpDown className="w-5 h-5 mb-1" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-600">高</span>
              </button>
              {/* Width */}
              <button onClick={() => setShowSpecs(true)} className="w-14 h-14 rounded-2xl bg-white/40 backdrop-blur-md flex flex-col items-center justify-center shadow-sm text-gray-700 border border-white/50 hover:bg-white/60 transition-colors">
                   <div className="text-emerald-500">
                      <ArrowLeftRight className="w-5 h-5 mb-1" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-600">宽</span>
              </button>
              {/* Length */}
              <button onClick={() => setShowSpecs(true)} className="w-14 h-14 rounded-2xl bg-white/40 backdrop-blur-md flex flex-col items-center justify-center shadow-sm text-gray-700 border border-white/50 hover:bg-white/60 transition-colors">
                   <div className="text-emerald-500">
                      <Maximize className="w-5 h-5 mb-1" />
                   </div>
                  <span className="text-[10px] font-bold text-gray-600">长</span>
              </button>
               {/* Specs Button */}
               <button onClick={() => setShowSpecs(true)} className="w-14 h-14 rounded-2xl bg-white/80 backdrop-blur-md flex flex-col items-center justify-center shadow-lg text-gray-900 border border-white/50 hover:bg-white transition-colors active:scale-95">
                  <span className="text-xs font-bold">选规格</span>
              </button>
          </div>

          {/* Product Image Area with Gallery Logic */}
          <div className="flex-1 flex items-center justify-center -mt-10 relative z-10 pb-20 overflow-hidden group">
               {/* Shadow blob */}
               <div className="absolute bottom-20 w-40 h-10 bg-black/20 blur-2xl rounded-[100%] transition-transform duration-500 group-hover:scale-110"></div>
               
               {/* Swipe Area */}
               <div className="relative w-full max-h-[450px] flex items-center justify-center">
                   <img 
                    src={displayImage} 
                    alt={product.name} 
                    className="w-full h-full object-contain drop-shadow-xl z-10 transition-all duration-500 ease-in-out px-4 select-none animate-float"
                    key={displayImage} 
                   />
                   
                   {/* Navigation Arrows */}
                   {images.length > 1 && !selectedVariant && (
                       <>
                           <button onClick={(e) => {e.stopPropagation(); prevImage();}} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/30 backdrop-blur hover:bg-white/50 z-20 transition-all hover:scale-110">
                               <ChevronRight className="rotate-180 w-6 h-6 text-gray-600" />
                           </button>
                           <button onClick={(e) => {e.stopPropagation(); nextImage();}} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/30 backdrop-blur hover:bg-white/50 z-20 transition-all hover:scale-110">
                               <ChevronRight className="w-6 h-6 text-gray-600" />
                           </button>
                           {/* Dots */}
                           <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                               {images.map((_, idx) => (
                                   <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'bg-gray-800 w-4 scale-110' : 'bg-gray-400'}`}></div>
                               ))}
                           </div>
                       </>
                   )}
               </div>
               
               {/* Floating Cart (Window Style) */}
               <div className="absolute bottom-24 right-6 z-40 animate-bounce" style={{ animationDuration: '3s' }}>
                   <div className="w-14 h-14 rounded-full bg-gray-900/90 backdrop-blur text-white flex items-center justify-center shadow-float cursor-pointer relative hover:scale-110 transition-transform" onClick={() => onAddToCart(product, 1)}>
                       <ShoppingBag className="w-6 h-6" />
                       <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                   </div>
               </div>
          </div>

          {/* Bottom Card - White Rounded Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-t-[40px] p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] relative z-30 animate-in slide-in-from-bottom duration-500 border-t border-white/50">
              
              {/* Color Picker Row (Square Shapes) */}
              <div className="flex items-center gap-4 mb-6">
                 {product.colors && product.colors.slice(0, 5).map((color, idx) => (
                    <button 
                        key={idx}
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-lg border-2 transition-all overflow-hidden relative group ${selectedColor === color ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent'}`}
                    >
                        <div className="w-full h-full shadow-inner" style={{ backgroundColor: color }}></div>
                        {selectedColor === color && <div className="absolute inset-0 ring-1 ring-white/50"></div>}
                    </button>
                 ))}
                 {/* Expand Button */}
                 <button 
                    onClick={() => setShowColorSheet(true)}
                    className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors border border-gray-100"
                 >
                     <Plus className="w-4 h-4" />
                 </button>
              </div>

              {/* Title & Quantity */}
              <div className="flex justify-between items-start mb-2">
                  <h1 className="text-2xl font-bold text-gray-900 leading-tight w-2/3">{product.name}</h1>
                  
                  {/* Stepper */}
                  <div className="bg-gray-50 border border-gray-100 rounded-full p-1 flex items-center gap-3 px-3">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
                      >
                          <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-sm min-w-[1.5rem] text-center">{quantity.toString().padStart(2, '0')}</span>
                      <button 
                         onClick={() => setQuantity(quantity + 1)}
                         className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
                      >
                          <Plus className="w-3 h-3" />
                      </button>
                  </div>
              </div>

              {/* Selected Configuration Display */}
              <div className="mb-8">
                  <p className="text-xs text-gray-400 mb-1 font-medium ml-1">已选配置</p>
                  <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl inline-flex shadow-sm">
                      <span className="font-bold">{selectedVariant ? selectedVariant.name : '默认规格'}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span>{selectedColor ? '选定颜色' : '默认颜色'}</span>
                  </div>
              </div>

              {/* Footer: Price & Add to Cart */}
              <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                      <span className="text-2xl font-bold text-gold-600 tracking-tight">¥{displayPrice}</span>
                      <span className="text-xs text-gray-400 font-medium">Total Payable</span>
                  </div>
                  
                  {/* Updated to Cyan-Green Gradient Button */}
                  <button 
                    onClick={() => onAddToCart(product, quantity)}
                    className={`px-8 py-4 rounded-[20px] font-bold flex items-center gap-2 ${GRADIENT_BTN}`}
                  >
                      <ShoppingCart className="w-5 h-5" />
                      加入购物车
                  </button>
              </div>
          </div>
      </div>

       {/* Variant/Specs Selection Modal */}
       {showSpecs && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={() => setShowSpecs(false)} />
            <div className="bg-white w-full rounded-t-[40px] p-8 relative animate-in slide-in-from-bottom duration-300 shadow-2xl max-h-[80vh] overflow-y-auto">
                 <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
                <h3 className="font-bold text-xl mb-6 text-gray-800">规格 (含图片)</h3>
                
                {/* Variant List */}
                {product.variants ? (
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {product.variants.map((variant) => (
                            <div 
                                key={variant.id}
                                onClick={() => setSelectedVariant(variant)}
                                className={`border rounded-3xl p-3 relative cursor-pointer transition-all ${selectedVariant?.id === variant.id ? 'border-primary-500 ring-2 ring-primary-100 bg-primary-50/50' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <div className="aspect-video bg-gray-100 rounded-2xl mb-3 overflow-hidden">
                                    <img src={variant.image} className="w-full h-full object-cover" />
                                </div>
                                <h4 className="text-xs font-bold text-gray-800 line-clamp-2 min-h-[2.5em]">{variant.name}</h4>
                                <p className="text-[10px] text-gray-500 mt-1">{variant.dimensions}</p>
                                {selectedVariant?.id === variant.id && (
                                    <div className="absolute top-3 right-3 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-md">
                                        <Check className="w-3.5 h-3.5" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 mb-8">暂无详细变体数据</p>
                )}

                 <button 
                    onClick={() => setShowSpecs(false)}
                    className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-black transition-colors"
                >
                    确认配置
                </button>
            </div>
        </div>
      )}

      {/* Color/Material Sheet Modal */}
      {showColorSheet && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={() => setShowColorSheet(false)} />
            <div className="bg-white w-full rounded-t-[40px] p-8 relative animate-in slide-in-from-bottom duration-300 shadow-2xl h-[60vh] flex flex-col">
                 <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 shrink-0"></div>
                 <div className="flex justify-between items-center mb-6 shrink-0">
                    <h3 className="font-bold text-xl text-gray-800">所有材质与颜色</h3>
                    <button onClick={() => setShowColorSheet(false)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500"/></button>
                 </div>
                
                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="mb-8">
                        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><div className="w-1 h-4 bg-primary-500 rounded-full"></div> A类头层真皮 (荔枝纹)</h4>
                        <div className="grid grid-cols-4 gap-4">
                             {product.colors?.map((color, idx) => (
                                 <button 
                                    key={idx}
                                    onClick={() => setSelectedColor(color)}
                                    className="flex flex-col items-center gap-2 group"
                                 >
                                     <div className={`w-14 h-14 rounded-2xl shadow-sm transition-all ${selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-800 scale-105' : 'group-hover:scale-105'}`} style={{ backgroundColor: color }}></div>
                                     <span className={`text-[10px] font-medium ${selectedColor === color ? 'text-gray-800' : 'text-gray-500'}`}>色号{idx+1}</span>
                                 </button>
                             ))}
                        </div>
                    </div>
                    {/* Mock Material Categories */}
                    <div className="mb-6">
                        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><div className="w-1 h-4 bg-gray-300 rounded-full"></div> B类纳米科技布</h4>
                        <div className="grid grid-cols-4 gap-4">
                             {['#B0C4DE', '#778899', '#D2B48C', '#DEB887'].map((color, idx) => (
                                 <button 
                                    key={`tech-${idx}`}
                                    onClick={() => setSelectedColor(color)}
                                    className="flex flex-col items-center gap-2 group"
                                 >
                                     <div className={`w-14 h-14 rounded-2xl shadow-sm transition-all ${selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-800 scale-105' : 'group-hover:scale-105'}`} style={{ backgroundColor: color }}></div>
                                     <span className={`text-[10px] font-medium ${selectedColor === color ? 'text-gray-800' : 'text-gray-500'}`}>科技{idx+1}</span>
                                 </button>
                             ))}
                        </div>
                    </div>
                </div>

                 <button 
                    onClick={() => setShowColorSheet(false)}
                    className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-lg mt-4 shrink-0 hover:bg-black transition-colors"
                >
                    确认选择
                </button>
            </div>
        </div>
      )}
    </div>
  );
};