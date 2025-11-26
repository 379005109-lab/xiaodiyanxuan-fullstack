
import React from 'react';
import { Search, Heart, ShoppingBag, User, ClipboardList, Scale, Globe, LogIn, LayoutDashboard } from 'lucide-react';
import { Page, Language } from '../types';

interface HeaderProps {
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
    currentLang: Language;
    setLang: (lang: Language) => void;
    isLoggedIn: boolean;
    onLoginClick: () => void;
    wishlistCount: number;
}

const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage, currentLang, setLang, isLoggedIn, onLoginClick, wishlistCount }) => {
  const getLinkClass = (page: Page) => {
    const base = "cursor-pointer transition-colors relative ";
    const isActive = currentPage === page || (page === 'shop' && currentPage === 'product-detail');
    
    if (isActive) {
        return base + "text-primary font-bold after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-primary";
    }
    return base + "hover:text-primary";
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-primary/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Left: Nav */}
        <nav className="hidden md:flex items-center space-x-8 text-stone-500 text-sm tracking-wide font-medium">
          <a onClick={() => setCurrentPage('home')} className={getLinkClass('home')}>
             {currentLang === 'zh' ? '首页' : 'Home'}
          </a>
          <a onClick={() => setCurrentPage('shop')} className={getLinkClass('shop')}>
             {currentLang === 'zh' ? '商城' : 'Shop'}
          </a>
          <a onClick={() => setCurrentPage('collections')} className={getLinkClass('collections')}>
             {currentLang === 'zh' ? '套餐专区' : 'Packages'}
          </a>
          <a onClick={() => setCurrentPage('design')} className={getLinkClass('design')}>
             {currentLang === 'zh' ? '陪买服务' : 'Guide Service'}
          </a>
        </nav>

        {/* Center: Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center cursor-pointer" onClick={() => setCurrentPage('home')}>
          <div className="flex flex-col items-center">
            <div className="text-2xl font-serif font-bold tracking-tighter text-primary leading-none">
                XIAODI
            </div>
            <span className="text-[10px] font-sans font-normal tracking-[0.3em] text-accent uppercase leading-tight mt-1">
                SUPPLY CHAIN
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-3 md:space-x-5">
          
          {/* Admin Entry - Always Visible for Demo */}
          <button 
            onClick={() => setCurrentPage('admin')} 
            className="flex items-center gap-1 bg-stone-900 text-white text-[10px] font-bold px-3 py-1.5 rounded hover:bg-stone-700 transition-colors shadow-sm"
            title="进入管理后台"
          >
            <LayoutDashboard className="w-3 h-3" />
            <span className="hidden md:inline">管理后台</span>
          </button>

          <div className="h-4 w-px bg-stone-300 mx-1"></div>

          <div className="hidden lg:flex items-center bg-stone-100/50 rounded-full px-4 py-1.5 focus-within:ring-1 focus-within:ring-primary/30 transition-all border border-transparent focus-within:border-primary/20">
            <Search className="text-stone-400 w-4 h-4 mr-2" />
            <input 
              type="text" 
              placeholder={currentLang === 'zh' ? "搜索型号/产品..." : "Search..."} 
              className="bg-transparent border-none outline-none text-sm w-20 md:w-28 placeholder:text-stone-400 text-primary"
            />
          </div>
          
          <button 
            onClick={() => setCurrentPage('comparison')}
            className={`hover:text-primary transition-colors flex items-center gap-1 ${currentPage === 'comparison' ? 'text-primary' : 'text-stone-500'}`}
            title="商品对比"
          >
            <Scale className="w-5 h-5" />
          </button>

          <button 
            onClick={() => setCurrentPage('orders')}
            className={`hover:text-primary transition-colors flex items-center gap-1 ${currentPage === 'orders' ? 'text-primary' : 'text-stone-500'}`}
            title="订单管理"
          >
            <ClipboardList className="w-5 h-5" />
          </button>

          <button 
            onClick={() => setCurrentPage('wishlist')}
            className={`relative hover:text-primary transition-colors group ${currentPage === 'wishlist' ? 'text-primary' : 'text-stone-500'}`}
            title="收藏夹"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-full">
                    {wishlistCount}
                </span>
            )}
          </button>
          
          <button 
            className={`hover:text-primary transition-colors relative ${currentPage === 'cart' ? 'text-primary' : 'text-stone-500'}`}
            onClick={() => setCurrentPage('cart')}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-accent text-white text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-full">2</span>
          </button>
          
          <div className="h-4 w-px bg-stone-300 mx-2"></div>

          {/* Login / User Status */}
          {isLoggedIn ? (
             <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 cursor-pointer">
                    <User className="w-4 h-4 text-primary" />
                 </div>
             </div>
          ) : (
             <button 
                onClick={onLoginClick}
                className="text-xs font-bold border border-stone-300 rounded px-2 py-1 hover:border-primary flex items-center gap-1 text-stone-500"
             >
                <LogIn className="w-3 h-3" /> 登录
             </button>
          )}

          <button 
            onClick={() => setLang(currentLang === 'zh' ? 'en' : 'zh')}
            className="flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-primary transition-colors ml-2"
          >
             <Globe className="w-4 h-4" />
             {currentLang === 'zh' ? 'CN' : 'EN'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
