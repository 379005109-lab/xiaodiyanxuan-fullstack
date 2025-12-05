import React, { useState } from 'react';
import { 
  Home, 
  Search, 
  User, 
  ShoppingCart, 
  Menu,
  Heart,
  Sparkles,
  ShoppingBag,
  Ticket,
  Package,
  ChevronRight,
  MoreHorizontal,
  Clock,
  Zap,
  Filter,
  Bell,
  LayoutGrid,
  List,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Wallet,
  FileText
} from 'lucide-react';
import { CATEGORIES, PRODUCTS, MOCK_APPOINTMENTS, MOCK_COUPONS, MOCK_ORDERS } from './constants';
import { Product, ViewState, CartItem } from './types';
import { ProductDetail } from './components/ProductDetail';
import { GeminiChat } from './components/GeminiChat';

// --- Global Styles Constants ---
const GRADIENT_BTN = "bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-glow text-white hover:scale-105 active:scale-95 transition-all duration-300";
const GLASS_NAV = "glass rounded-full px-2 py-3 flex justify-between items-center shadow-float backdrop-blur-xl";
const PAGE_TRANSITION = "animate-fade-in";

// --- Sub-components ---

const ProductGridItem: React.FC<{ product: Product; onClick: () => void }> = ({ product, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white p-3 rounded-3xl flex flex-col gap-3 shadow-card hover:shadow-soft hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
  >
    <div className="aspect-[4/3] bg-sky-50 rounded-2xl overflow-hidden relative">
        <img src={product.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
        <button className="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110">
            <Heart className="w-4 h-4 text-gray-400 hover:text-red-500 hover:fill-red-500 transition-colors" />
        </button>
    </div>
    <div className="px-1 flex-1 flex flex-col justify-between">
        <div>
            <h3 className="text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-primary-600 transition-colors">{product.name}</h3>
            <p className="text-xs text-gray-400 mt-1">{product.subtitle || product.category}</p>
        </div>
        <div className="flex justify-between items-center mt-3">
            <p className="text-gold-600 font-bold text-lg">¥ {product.price}</p>
            <button className={`w-8 h-8 rounded-full flex items-center justify-center ${GRADIENT_BTN}`}>
                <ShoppingCart className="w-4 h-4" />
            </button>
        </div>
    </div>
  </div>
);

const ProductBigPictureItem: React.FC<{ product: Product; onClick: () => void; isEven: boolean }> = ({ product, onClick, isEven }) => (
    <div onClick={onClick} className="relative w-full h-[400px] mb-8 group cursor-pointer">
         {/* Organic Blob Background with Animation */}
         <div className={`absolute inset-0 rounded-[40px] opacity-20 transition-all duration-500 group-hover:opacity-30 ${isEven ? 'bg-orange-300' : 'bg-primary-300'}`}>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/30 rounded-full blur-3xl"></div>
         </div>
         <div className={`absolute w-64 h-64 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob ${isEven ? 'bg-orange-200 top-0 -left-4' : 'bg-blue-200 bottom-0 -right-4'}`}></div>
         <div className={`absolute w-64 h-64 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000 ${isEven ? 'bg-yellow-200 top-0 -right-4' : 'bg-green-200 bottom-0 -left-4'}`}></div>

         {/* Content */}
         <div className="relative z-10 h-full flex flex-col p-8">
             <div className="flex justify-between items-start">
                 <div>
                     <h3 className="text-3xl font-bold text-gray-800 leading-tight drop-shadow-sm">{product.name}</h3>
                     <p className="text-gray-600 mt-2 font-medium">{product.subtitle}</p>
                 </div>
                 <button className="w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                     <Heart className="w-6 h-6 text-gray-400 group-hover:text-red-400 transition-colors" />
                 </button>
             </div>

             <div className="flex-1 flex items-center justify-center">
                 <img src={product.image} className="max-w-[120%] max-h-[220px] object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-2" />
             </div>

             <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 flex justify-between items-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all border border-white/50">
                 <div>
                     <p className="text-xs text-gray-500 font-medium tracking-wide">PRICE</p>
                     <p className="text-xl font-bold text-gold-600">¥ {product.price}</p>
                 </div>
                 <button className={`pl-2 pr-6 py-2.5 rounded-full text-white font-bold text-sm flex items-center gap-2 ${GRADIENT_BTN}`}>
                     <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center">
                        <ShoppingCart className="w-3 h-3" />
                     </div>
                     加入购物车
                 </button>
             </div>
         </div>
    </div>
);

const BargainRowItem: React.FC<{ product: Product; onClick: () => void }> = ({ product, onClick }) => (
  <div onClick={onClick} className="bg-white rounded-3xl p-4 shadow-card hover:shadow-soft hover:-translate-y-1 transition-all duration-300 flex gap-4 h-36 cursor-pointer border border-gray-50">
     <div className="w-32 h-full shrink-0 relative rounded-2xl overflow-hidden bg-gray-50">
         <img src={product.image} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
         <div className="absolute top-2 left-2 glass text-gray-800 text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium z-10 border-0 bg-white/90">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            {product.bargainInfo?.participants}人助力
         </div>
     </div>
     <div className="flex-1 flex flex-col justify-between py-1">
         <div>
            <h3 className="font-bold text-gray-800 line-clamp-1 mb-1">{product.name}</h3>
            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{product.description}</p>
         </div>
         <div className="flex justify-between items-end">
             <div>
                 <span className="text-xs text-gray-400 line-through mr-2">¥{product.originalPrice}</span>
                 <span className="text-lg font-bold text-gold-600">¥ {product.price}</span>
             </div>
             <button className={`px-5 py-2 rounded-full font-bold text-xs ${GRADIENT_BTN}`}>
                 砍一刀
             </button>
         </div>
     </div>
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Product | null>(null);
  const [packageStep, setPackageStep] = useState(0); // For package category tabs
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isBigPictureMode, setIsBigPictureMode] = useState(false);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setView(ViewState.DETAIL);
  };

  const handlePackageClick = (product: Product) => {
      setSelectedPackage(product);
      setPackageStep(0);
      setView(ViewState.PACKAGE_DETAIL);
  }

  const handleAddToCart = (product: Product, quantity: number) => {
    setCart(prev => [...prev, { ...product, quantity }]);
    if (view === ViewState.DETAIL && selectedPackage) {
        setView(ViewState.PACKAGE_DETAIL);
    } else {
        setView(ViewState.MALL);
    }
  };

  // --- Views ---

  const commonBackground = "bg-gradient-to-b from-sky-100 via-sky-50 to-primary-100";
  const navActiveGradient = "bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-glow"; 

  const renderHome = () => (
    <div className={`min-h-screen ${commonBackground} pb-32 ${PAGE_TRANSITION}`}>
        {/* Full Screen Hero Section */}
        <div className="relative h-[90vh] w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-400 via-primary-300 to-primary-200">
                <div className="absolute top-0 left-0 w-full h-full opacity-30 mix-blend-overlay">
                    <div className="absolute top-[20%] right-[10%] w-64 h-64 border-[40px] border-white rounded-full blur-[80px] animate-pulse"></div>
                    <div className="absolute bottom-[20%] left-[10%] w-80 h-80 bg-white rounded-full blur-[100px]"></div>
                    <div className="absolute top-[40%] left-[30%] w-40 h-40 bg-sky-200 rounded-full blur-[60px]"></div>
                </div>
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 z-10 text-white">
                {/* Logo D with Float Animation */}
                <div className="animate-float hover:scale-105 transition-transform duration-500 cursor-default">
                    <h1 className="text-[200px] font-bold leading-none select-none drop-shadow-2xl opacity-95 font-sans">D</h1>
                </div>
                
                {/* Tagline Layout - Organic & White */}
                <div className="flex flex-col items-center gap-2 mt-6">
                     <h2 className="text-5xl font-black tracking-widest text-white drop-shadow-xl -rotate-2 origin-bottom-right transition-transform hover:rotate-0">
                        线上选款
                     </h2>
                     <h2 className="text-5xl font-black tracking-widest text-white drop-shadow-xl rotate-1 origin-bottom-left ml-8 transition-transform hover:rotate-0">
                        展厅体验
                     </h2>
                     
                     {/* "One Price" - White, Bolder, Slightly Rotated/Irregular */}
                     <div className="mt-8 relative hover:scale-110 transition-transform duration-300">
                        <span className="text-6xl font-black text-white tracking-widest drop-shadow-2xl block -rotate-6">
                            一口价
                        </span>
                     </div>
                </div>
                
                <div className="absolute bottom-32 animate-bounce">
                    <ArrowDown className="w-8 h-8 text-white/80" />
                </div>
            </div>
            
             <header className="absolute top-0 left-0 right-0 p-6 pt-12 flex justify-between items-center z-20 text-white">
                <div></div>
                <button onClick={() => setView(ViewState.PROFILE)} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 transition-colors shadow-lg">
                    <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200" className="w-full h-full rounded-full object-cover p-0.5" />
                </button>
            </header>
        </div>

        {/* Accompanied Buying Service */}
        <div className="px-6 -mt-8 relative z-20">
             <div className="bg-white rounded-[32px] p-6 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden relative group cursor-pointer border border-white/50" onClick={() => setView(ViewState.AI_CHAT)}>
                 <div className="absolute inset-0 bg-white/80 transition-colors group-hover:bg-white/90"></div>
                 <img 
                    src="https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=1200" 
                    className="absolute inset-0 w-full h-full object-cover -z-10 opacity-30 transition-transform duration-700 group-hover:scale-110"
                    alt="Showroom"
                />
                 
                 <div className="relative z-10 py-4">
                     <h3 className="text-3xl font-bold mb-2 text-black">陪买服务</h3>
                     <p className="text-gray-900 mb-6 max-w-[70%] text-sm font-bold opacity-80">专业顾问一对一陪同选购，为您甄选最适合的家居方案。</p>
                     
                     <div className="flex items-center gap-2">
                        <span className="bg-black text-white px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg group-hover:scale-105 transition-transform">
                            预约服务 <ChevronRight className="w-4 h-4" />
                        </span>
                     </div>
                 </div>
             </div>
        </div>

        {/* Stats/Quick Actions */}
        <div className="px-6 mt-8 mb-8">
            <div className="flex gap-4">
                <div className="flex-1 bg-white p-5 rounded-3xl shadow-card hover:shadow-soft flex flex-col justify-between h-32 relative overflow-hidden group cursor-pointer transition-all" onClick={() => setView(ViewState.BARGAIN)}>
                    <div className="absolute right-[-10px] top-[-10px] w-16 h-16 bg-primary-50 rounded-full transition-transform duration-500 group-hover:scale-[3]"></div>
                    <Ticket className="w-6 h-6 text-primary-500 relative z-10" />
                    <div className="relative z-10">
                        <p className="text-2xl font-bold text-gray-800">50%</p>
                        <p className="text-xs text-gray-400 font-medium">限时折扣</p>
                    </div>
                </div>
                <div className="flex-1 bg-white p-5 rounded-3xl shadow-card hover:shadow-soft flex flex-col justify-between h-32 relative overflow-hidden group cursor-pointer transition-all" onClick={() => setView(ViewState.PACKAGES)}>
                     <div className="absolute right-[-10px] top-[-10px] w-16 h-16 bg-sky-50 rounded-full transition-transform duration-500 group-hover:scale-[3]"></div>
                    <Package className="w-6 h-6 text-sky-500 relative z-10" />
                    <div className="relative z-10">
                        <p className="text-2xl font-bold text-gray-800">套餐</p>
                        <p className="text-xs text-gray-400 font-medium">一站式购齐</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );

  const renderMall = () => (
    <div className={`min-h-screen ${commonBackground} pb-32 ${PAGE_TRANSITION}`}>
        {/* Mall Header */}
        <div className="bg-white/70 backdrop-blur-xl sticky top-0 z-20 px-6 py-4 shadow-sm rounded-b-[32px] border-b border-white/50">
            <div className="flex items-center justify-between mb-4">
                <h1 className="font-bold text-2xl text-gray-800">商城</h1>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsBigPictureMode(!isBigPictureMode)}
                        className="w-10 h-10 rounded-full bg-white/50 border border-white flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                    >
                        {isBigPictureMode ? <List className="w-5 h-5 text-gray-600" /> : <LayoutGrid className="w-5 h-5 text-gray-600" />}
                    </button>
                    <button className="w-10 h-10 rounded-full bg-white/50 border border-white flex items-center justify-center shadow-sm">
                        <Filter className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>
            
            <div className="relative mb-6 group">
                <input 
                    type="text" 
                    placeholder="搜索沙发、桌椅..." 
                    className="w-full bg-white/60 h-12 rounded-2xl px-6 pl-12 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:bg-white transition-all shadow-inner"
                />
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
            </div>

            {/* Mall Tabs */}
            <div className="flex justify-between items-center text-sm overflow-x-auto no-scrollbar gap-6 px-2">
                {CATEGORIES.map(cat => (
                    <button 
                        key={cat.id} 
                        className={`whitespace-nowrap flex flex-col items-center gap-1 transition-all ${cat.id === 'all' ? 'text-primary-600 font-bold scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        {cat.name}
                        <div className={`w-1 h-1 rounded-full transition-all ${cat.id === 'all' ? 'bg-primary-600 w-4' : 'bg-transparent'}`}></div>
                    </button>
                ))}
            </div>
        </div>

        {/* Mall Grid / List */}
        <div className="p-6">
             {isBigPictureMode ? (
                 <div className="flex flex-col">
                    {PRODUCTS.filter(p => !p.isBargain && p.category !== '套餐').map((product, idx) => (
                         <ProductBigPictureItem 
                            key={product.id} 
                            product={product} 
                            onClick={() => handleProductClick(product)}
                            isEven={idx % 2 === 0}
                         />
                     ))}
                 </div>
             ) : (
                 <div className="grid grid-cols-2 gap-4">
                    {PRODUCTS.filter(p => !p.isBargain && p.category !== '套餐').map(product => (
                         <ProductGridItem key={product.id} product={product} onClick={() => handleProductClick(product)} />
                     ))}
                 </div>
             )}
        </div>
    </div>
  );

  const renderBargain = () => (
    <div className={`min-h-screen ${commonBackground} pb-32 ${PAGE_TRANSITION}`}>
         <div className="bg-white/70 backdrop-blur-xl sticky top-0 z-20 px-6 py-4 flex justify-between items-center rounded-b-[32px] shadow-sm mb-6 border-b border-white/50">
             <h1 className="font-bold text-xl text-gray-800">砍价专区</h1>
             <div className="bg-white/80 text-primary-600 border border-primary-100 text-xs px-4 py-1.5 rounded-full font-bold shadow-sm">
                 我的砍价
             </div>
         </div>

         <div className="px-6 flex flex-col gap-4">
             {PRODUCTS.filter(p => p.isBargain).map(product => (
                 <BargainRowItem key={product.id} product={product} onClick={() => handleProductClick(product)} />
             ))}
         </div>
    </div>
  );

  const renderPackages = () => (
    <div className={`min-h-screen ${commonBackground} pb-32 ${PAGE_TRANSITION}`}>
         <div className="bg-white/70 backdrop-blur-xl sticky top-0 z-20 px-6 py-4 flex justify-between items-center rounded-b-[32px] shadow-sm mb-6 border-b border-white/50">
             <h1 className="font-bold text-xl text-gray-800">精选套餐</h1>
         </div>

         <div className="px-6 flex flex-col gap-6">
             {PRODUCTS.filter(p => p.category === '套餐').map(product => (
                 <div key={product.id} onClick={() => handlePackageClick(product)} className="bg-white rounded-[32px] overflow-hidden shadow-card hover:shadow-soft transition-all duration-300 group cursor-pointer border border-white/50">
                     <div className="relative h-48 overflow-hidden">
                         <img src={product.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                         <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-medium tracking-wide">
                            全屋定制
                         </div>
                     </div>
                     <div className="p-6">
                         <h3 className="text-xl font-bold text-gray-800 mb-1">{product.name}</h3>
                         <p className="text-sm text-gray-500 mb-4">{product.subtitle}</p>
                         <div className="flex justify-between items-center">
                             <div>
                                 <p className="text-xs text-gray-400">套餐价</p>
                                 <p className="text-2xl font-bold text-gold-600">¥ {product.price}</p>
                             </div>
                             <button className={`px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 ${GRADIENT_BTN}`}>
                                 查看详情
                             </button>
                         </div>
                     </div>
                 </div>
             ))}
         </div>
    </div>
  );
  
  const renderPackageDetail = () => {
    if (!selectedPackage || !selectedPackage.packageItems) return null;
    
    const currentCategory = selectedPackage.packageItems[packageStep];
    
    return (
        <div className={`min-h-screen ${commonBackground} pb-32 ${PAGE_TRANSITION}`}>
            {/* Package Hero */}
            <div className="relative h-64 w-full">
                <img src={selectedPackage.image} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <button 
                    onClick={() => setView(ViewState.PACKAGES)}
                    className="absolute top-12 left-6 w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <h1 className="text-3xl font-bold mb-1">{selectedPackage.name}</h1>
                    <p className="text-sm opacity-90 font-medium">{selectedPackage.subtitle}</p>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="px-6 py-6 sticky top-0 z-20 bg-white/80 backdrop-blur-md rounded-b-3xl shadow-sm border-b border-white/50">
                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                    {selectedPackage.packageItems.map((step, idx) => (
                        <button
                            key={idx}
                            onClick={() => setPackageStep(idx)}
                            className={`relative px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm flex items-center gap-2 border border-transparent ${
                                idx === packageStep 
                                ? 'bg-gray-800 text-white shadow-lg scale-105' 
                                : 'bg-white text-gray-500 hover:border-gray-200'
                            }`}
                        >
                            {step.category}
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${idx === packageStep ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-500'}`}>
                                {step.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 3-Column Item Grid */}
            <div className="px-6 grid grid-cols-3 gap-3 mt-4">
                {currentCategory?.items.map(product => (
                    <div 
                        key={product.id} 
                        onClick={() => handleProductClick(product)}
                        className="bg-white rounded-2xl p-2 shadow-sm flex flex-col gap-2 cursor-pointer hover:shadow-md transition-all hover:-translate-y-1"
                    >
                        <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden">
                            <img src={product.image} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold text-gray-800 line-clamp-1">{product.name}</h4>
                            <p className="text-[10px] text-gold-600 font-bold">¥{product.price}</p>
                        </div>
                        <button className={`w-full text-[10px] py-1.5 rounded-lg font-bold ${GRADIENT_BTN}`}>
                            选规格
                        </button>
                    </div>
                ))}
            </div>

            {/* Bottom Floating Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl p-6 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex justify-between items-center max-w-md mx-auto z-40 border-t border-white/50">
                 <div>
                     <p className="text-xs text-gray-400 font-medium">套餐一口价</p>
                     <p className="text-2xl font-bold text-gold-600">¥ {selectedPackage.price}</p>
                 </div>
                 <button className={`px-8 py-3 rounded-full font-bold flex items-center gap-2 ${GRADIENT_BTN}`}>
                     下一步: {selectedPackage.packageItems[(packageStep + 1) % selectedPackage.packageItems.length].category} <ArrowRight className="w-4 h-4"/>
                 </button>
            </div>
        </div>
    );
  }

  // Generic List View Renderer
  const renderList = (title: string, content: React.ReactNode) => (
      <div className={`min-h-screen ${commonBackground} flex flex-col ${PAGE_TRANSITION}`}>
          <div className="p-6 sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-white/50 flex items-center gap-2">
              <button onClick={() => setView(ViewState.PROFILE)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight className="rotate-180 text-gray-600" /></button>
              <h1 className="font-bold text-xl text-gray-800">{title}</h1>
          </div>
          <div className="flex-1 p-6 overflow-y-auto pb-32">
              {content}
          </div>
      </div>
  );

  const renderMy = () => (
      <div className={`min-h-screen ${commonBackground} pb-32 ${PAGE_TRANSITION}`}>
          {/* Profile Header */}
          <div className="relative h-64 bg-sky-50 rounded-b-[40px] overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-b from-primary-50/50 to-white/0"></div>
               <div className="absolute top-0 right-0 p-6">
                   <button className="p-2 bg-white/50 backdrop-blur rounded-full hover:bg-white/80 transition-colors">
                       <MoreHorizontal className="w-5 h-5 text-gray-600" />
                   </button>
               </div>
               <div className="flex flex-col items-center justify-center h-full pt-8 relative z-10">
                    <div className="w-24 h-24 rounded-full p-1 bg-white shadow-float mb-3">
                        <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200" className="w-full h-full rounded-full object-cover" />
                    </div>
                    <h2 className="font-bold text-xl text-gray-800">Sarah Wilson</h2>
                    <p className="text-primary-600 text-sm font-bold bg-white/80 backdrop-blur border border-primary-100 px-4 py-1 rounded-full mt-2 shadow-sm">钻石会员</p>
               </div>
          </div>
         
         <div className="px-6 -mt-8 relative z-10">
             {/* Quick Stats (Clickable) */}
             <div className="bg-white rounded-3xl p-6 shadow-card flex justify-between mb-8 items-center">
                 <div onClick={() => setView(ViewState.FAVORITES)} className="text-center cursor-pointer hover:opacity-70 transition-opacity flex-1">
                     <p className="text-xl font-bold text-gray-800">12</p>
                     <p className="text-xs text-gray-400 font-medium">收藏</p>
                 </div>
                 <div onClick={() => setView(ViewState.ORDERS)} className="text-center border-l border-r border-gray-100 px-8 cursor-pointer hover:opacity-70 transition-opacity flex-1">
                     <p className="text-xl font-bold text-gray-800">3</p>
                     <p className="text-xs text-gray-400 font-medium">订单</p>
                 </div>
                 <div onClick={() => setView(ViewState.COUPONS)} className="text-center cursor-pointer hover:opacity-70 transition-opacity flex-1">
                     <p className="text-xl font-bold text-gold-600">¥200</p>
                     <p className="text-xs text-gray-400 font-medium">优惠券</p>
                 </div>
             </div>

             {/* New Action Buttons: Appointments & Cart */}
             <div className="grid grid-cols-2 gap-4 mb-8">
                 <button onClick={() => setView(ViewState.APPOINTMENTS)} className="bg-white p-4 rounded-3xl shadow-sm flex items-center gap-3 hover:shadow-lg hover:-translate-y-1 transition-all border border-transparent hover:border-cyan-100">
                     <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600">
                         <Calendar className="w-6 h-6" />
                     </div>
                     <span className="font-bold text-gray-800">我的预约</span>
                 </button>
                 <button onClick={() => setView(ViewState.CART)} className="bg-white p-4 rounded-3xl shadow-sm flex items-center gap-3 hover:shadow-lg hover:-translate-y-1 transition-all border border-transparent hover:border-emerald-100">
                     <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                         <ShoppingBag className="w-6 h-6" />
                     </div>
                     <span className="font-bold text-gray-800">我的购物车</span>
                 </button>
             </div>

             <h2 className="font-bold text-lg text-gray-800 mb-4 px-2 flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400"/> 最近浏览</h2>
             
             {/* Recently Viewed (Mock) */}
             <div className="space-y-4">
                 <div className="bg-white p-4 rounded-3xl shadow-card hover:shadow-soft transition-all flex gap-4 border border-gray-50 items-center">
                      <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden shrink-0">
                          <img src="https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 py-1 flex flex-col justify-between h-full">
                          <div>
                            <h3 className="font-bold text-gray-800 text-sm">法拉利A级</h3>
                            <p className="text-xs text-gray-400 mt-1">灵感搭配推荐</p>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                              <span className="text-gold-600 font-bold">¥ 24260</span>
                              <button className={`text-xs px-5 py-2 rounded-full font-bold ${GRADIENT_BTN}`}>购买</button>
                          </div>
                      </div>
                 </div>
             </div>
         </div>
      </div>
  );

  // --- View Rendering Logic ---

  if (view === ViewState.DETAIL && selectedProduct) {
      return (
          <div className="max-w-md mx-auto bg-white min-h-screen relative shadow-2xl overflow-hidden">
             <ProductDetail 
                product={selectedProduct} 
                onBack={() => selectedPackage ? setView(ViewState.PACKAGE_DETAIL) : setView(ViewState.MALL)}
                onAddToCart={handleAddToCart}
             />
          </div>
      )
  }
  
  if (view === ViewState.PACKAGE_DETAIL && selectedPackage) {
      return (
          <div className="max-w-md mx-auto bg-white min-h-screen relative shadow-2xl overflow-hidden">
              {renderPackageDetail()}
          </div>
      )
  }

  if (view === ViewState.AI_CHAT) {
      return (
          <div className={`max-w-md mx-auto bg-white min-h-screen relative shadow-2xl overflow-hidden flex flex-col ${PAGE_TRANSITION}`}>
              <div className="p-4 flex items-center gap-2 sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-gray-50">
                  <button onClick={() => setView(ViewState.HOME)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight className="rotate-180 text-gray-600" /></button>
                  <span className="font-bold text-gray-800">AI 顾问</span>
              </div>
              <div className="flex-1 overflow-hidden">
                 <GeminiChat />
              </div>
          </div>
      )
  }

  // Sub-views for Profile
  if (view === ViewState.APPOINTMENTS) {
      return (
          <div className="max-w-md mx-auto bg-white min-h-screen relative shadow-2xl overflow-hidden">
            {renderList("我的预约", (
                <div className="space-y-4">
                    {MOCK_APPOINTMENTS.map(apt => (
                        <div key={apt.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow">
                            <div>
                                <h3 className="font-bold text-gray-800">{apt.type}</h3>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/> {apt.date} {apt.time}</p>
                            </div>
                            <span className="text-xs bg-cyan-50 text-cyan-600 px-3 py-1 rounded-full font-bold">{apt.status}</span>
                        </div>
                    ))}
                </div>
            ))}
          </div>
      );
  }

  if (view === ViewState.CART) {
     return (
        <div className="max-w-md mx-auto bg-white min-h-screen relative shadow-2xl overflow-hidden">
            {renderList("购物车", (
                <div className="space-y-4">
                    {cart.length > 0 ? cart.map((item, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-shadow">
                            <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                                <img src={item.image} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <h3 className="font-bold text-gray-800 line-clamp-1">{item.name}</h3>
                                <div className="flex justify-between items-end">
                                    <p className="text-gray-500 text-xs bg-gray-50 px-2 py-1 rounded-md">数量: {item.quantity}</p>
                                    <p className="font-bold text-gold-600 text-lg">¥ {item.price * item.quantity}</p>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                <ShoppingBag className="w-8 h-8"/>
                            </div>
                            购物车空空如也
                        </div>
                    )}
                </div>
            ))}
        </div>
     );
  }
  
  if (view === ViewState.ORDERS) {
      return (
          <div className="max-w-md mx-auto bg-white min-h-screen relative shadow-2xl overflow-hidden">
              {renderList("我的订单", (
                  <div className="space-y-4">
                      {MOCK_ORDERS.map(order => (
                          <div key={order.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-3">
                                  <span className="text-xs text-gray-400 font-medium">订单号: {order.id.toUpperCase()}</span>
                                  <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-md">{order.status}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                  <div>
                                      <p className="text-xs text-gray-400 mb-1">{order.date}</p>
                                      <p className="text-sm font-bold text-gray-800">共 {order.items} 件商品</p>
                                  </div>
                                  <p className="font-bold text-gold-600 text-xl">¥ {order.total}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              ))}
          </div>
      );
  }

  if (view === ViewState.FAVORITES) {
      return (
          <div className="max-w-md mx-auto bg-white min-h-screen relative shadow-2xl overflow-hidden">
             {renderList("我的收藏", (
                 <div className="grid grid-cols-2 gap-4">
                     {PRODUCTS.slice(0, 2).map(p => (
                         <div key={p.id} onClick={() => handleProductClick(p)} className="bg-white p-3 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group">
                             <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-3 relative">
                                 <img src={p.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                 <div className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full shadow-sm">
                                     <Heart className="w-3 h-3 text-red-500 fill-red-500"/>
                                 </div>
                             </div>
                             <h3 className="font-bold text-gray-800 text-sm line-clamp-1 mb-1">{p.name}</h3>
                             <p className="text-gold-600 font-bold text-lg">¥ {p.price}</p>
                         </div>
                     ))}
                 </div>
             ))}
          </div>
      );
  }

  if (view === ViewState.COUPONS) {
      return (
          <div className="max-w-md mx-auto bg-white min-h-screen relative shadow-2xl overflow-hidden">
              {renderList("优惠券", (
                  <div className="space-y-4">
                      {MOCK_COUPONS.map(c => (
                          <div key={c.id} className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 p-5 rounded-3xl flex justify-between items-center relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-r border-orange-200"></div>
                              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-l border-orange-200"></div>
                              <div className="pl-2">
                                  <h3 className="font-bold text-orange-800 text-lg">{c.title}</h3>
                                  <p className="text-xs text-orange-600 mt-1 font-medium bg-white/50 px-2 py-0.5 rounded-md inline-block">满 {c.min} 可用</p>
                                  <p className="text-[10px] text-orange-400 mt-2">有效期至 {c.expire}</p>
                              </div>
                              <div className="text-4xl font-bold text-orange-500 pr-2 flex items-baseline">
                                  <span className="text-sm mr-1">¥</span>{c.value}
                              </div>
                          </div>
                      ))}
                  </div>
              ))}
          </div>
      );
  }

  return (
    <div className="font-sans text-slate-800 bg-gray-50 min-h-screen relative max-w-md mx-auto shadow-2xl overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {view === ViewState.HOME && renderHome()}
        {view === ViewState.MALL && renderMall()}
        {view === ViewState.BARGAIN && renderBargain()}
        {view === ViewState.PACKAGES && renderPackages()}
        {view === ViewState.PROFILE && renderMy()}
      </div>

      {/* Floating Navigation */}
      <div className="fixed bottom-6 left-6 right-6 z-50">
          <nav className={GLASS_NAV}>
            <button 
                onClick={() => setView(ViewState.HOME)}
                className={`flex-1 flex flex-col items-center gap-1 transition-all duration-300 group`}
            >
                <div className={`p-2 rounded-full transition-all ${view === ViewState.HOME ? navActiveGradient + ' text-white scale-110' : 'text-gray-400 group-hover:text-primary-500'}`}>
                    <Home className="w-5 h-5" strokeWidth={view === ViewState.HOME ? 2.5 : 2} />
                </div>
            </button>
            <button 
                onClick={() => setView(ViewState.BARGAIN)}
                className={`flex-1 flex flex-col items-center gap-1 transition-all duration-300 group`}
            >
                <div className={`p-2 rounded-full transition-all ${view === ViewState.BARGAIN ? navActiveGradient + ' text-white scale-110' : 'text-gray-400 group-hover:text-primary-500'}`}>
                    <Ticket className="w-5 h-5" strokeWidth={view === ViewState.BARGAIN ? 2.5 : 2} />
                </div>
            </button>
            
            <div className="relative -mt-12 group">
                 <button 
                    onClick={() => setView(ViewState.MALL)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-float transition-all duration-300 group-hover:scale-110 ${view === ViewState.MALL ? 'bg-gray-800 text-white' : `${navActiveGradient} text-white`}`}
                >
                    <ShoppingCart className="w-6 h-6" />
                </button>
            </div>

            <button 
                onClick={() => setView(ViewState.PACKAGES)}
                className={`flex-1 flex flex-col items-center gap-1 transition-all duration-300 group`}
            >
                <div className={`p-2 rounded-full transition-all ${view === ViewState.PACKAGES ? navActiveGradient + ' text-white scale-110' : 'text-gray-400 group-hover:text-primary-500'}`}>
                    <Package className="w-5 h-5" strokeWidth={view === ViewState.PACKAGES ? 2.5 : 2} />
                </div>
            </button>
            
            <button 
                onClick={() => setView(ViewState.PROFILE)}
                className={`flex-1 flex flex-col items-center gap-1 transition-all duration-300 group`}
            >
                <div className={`p-2 rounded-full transition-all ${view === ViewState.PROFILE ? navActiveGradient + ' text-white scale-110' : 'text-gray-400 group-hover:text-primary-500'}`}>
                    <User className="w-5 h-5" strokeWidth={view === ViewState.PROFILE ? 2.5 : 2} />
                </div>
            </button>
          </nav>
      </div>
    </div>
  );
};

export default App;