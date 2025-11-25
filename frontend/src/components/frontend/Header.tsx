import { Link, useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, User, Heart, Scale, ClipboardList, LogIn, Globe, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuthModalStore } from '@/store/authModalStore'
import { useCartStore } from '@/store/cartStore'
import { useFavoriteStore } from '@/store/favoriteStore'
import { useCompareStore } from '@/store/compareStore'
import { useState, useEffect } from 'react'

export default function Header() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const { openLogin } = useAuthModalStore()
  const { getTotalItems } = useCartStore()
  const { getFavoriteCount, loadFavorites } = useFavoriteStore()
  const { getCount: getCompareCount, loadCompareItems } = useCompareStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      loadFavorites()
      loadCompareItems()
    }
  }, [isAuthenticated])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const getLinkClass = (path: string) => {
    const base = "cursor-pointer transition-colors relative "
    const isActive = location.pathname === path
    
    if (isActive) {
      return base + "text-primary font-bold after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-primary"
    }
    return base + "hover:text-primary"
  }

  return (
    <header className="sticky top-0 z-50 glass border-b border-primary/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Left: Nav */}
        <nav className="hidden md:flex items-center space-x-8 text-stone-500 text-sm tracking-wide font-medium">
          <Link to="/" className={getLinkClass('/')}>
            首页
          </Link>
          <Link to="/products" className={getLinkClass('/products')}>
            商城
          </Link>
          <Link to="/packages" className={getLinkClass('/packages')}>
            套餐专区
          </Link>
          <Link to="/design-service" className={getLinkClass('/design-service')}>
            陪买服务
          </Link>
        </nav>

        {/* Center: Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center cursor-pointer" onClick={() => navigate('/')}>
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
          
          {/* Admin Entry - Only for admin users */}
          {user?.role === 'admin' || user?.role === 'super_admin' ? (
            <Link
              to="/admin"
              className="flex items-center gap-1 bg-stone-900 text-white text-[10px] font-bold px-3 py-1.5 rounded hover:bg-stone-700 transition-colors shadow-sm"
              title="进入管理后台"
            >
              <LayoutDashboard className="w-3 h-3" />
              <span className="hidden md:inline">管理后台</span>
            </Link>
          ) : null}

          <div className="h-4 w-px bg-stone-300 mx-1"></div>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden lg:flex items-center bg-stone-100/50 rounded-full px-4 py-1.5 focus-within:ring-1 focus-within:ring-primary/30 transition-all border border-transparent focus-within:border-primary/20">
            <Search className="text-stone-400 w-4 h-4 mr-2" />
            <input 
              type="text" 
              placeholder="搜索型号/产品..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-20 md:w-28 placeholder:text-stone-400 text-primary"
            />
          </form>
          
          {/* Compare */}
          <Link
            to="/compare"
            className={`hover:text-primary transition-colors flex items-center gap-1 ${location.pathname === '/compare' ? 'text-primary' : 'text-stone-500'}`}
            title="商品对比"
          >
            <Scale className="w-5 h-5" />
            {getCompareCount() > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-white text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-full">
                {getCompareCount()}
              </span>
            )}
          </Link>

          {/* Orders */}
          <Link
            to="/orders"
            className={`hover:text-primary transition-colors flex items-center gap-1 ${location.pathname === '/orders' ? 'text-primary' : 'text-stone-500'}`}
            title="订单管理"
          >
            <ClipboardList className="w-5 h-5" />
          </Link>

          {/* Favorites */}
          <Link
            to="/favorites"
            className={`relative hover:text-primary transition-colors group ${location.pathname === '/favorites' ? 'text-primary' : 'text-stone-500'}`}
            title="收藏夹"
          >
            <Heart className="w-5 h-5" />
            {getFavoriteCount() > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-white text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-full">
                {getFavoriteCount()}
              </span>
            )}
          </Link>
          
          {/* Cart */}
          <Link
            to="/cart"
            className={`hover:text-primary transition-colors relative ${location.pathname === '/cart' ? 'text-primary' : 'text-stone-500'}`}
          >
            <ShoppingBag className="w-5 h-5" />
            {getTotalItems() > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-white text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-full">
                {getTotalItems()}
              </span>
            )}
          </Link>
          
          <div className="h-4 w-px bg-stone-300 mx-2"></div>

          {/* Login / User Status */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 cursor-pointer">
                <User className="w-4 h-4 text-primary" />
              </div>
            </div>
          ) : (
            <button 
              onClick={openLogin}
              className="text-xs font-bold border border-stone-300 rounded px-2 py-1 hover:border-primary flex items-center gap-1 text-stone-500"
            >
              <LogIn className="w-3 h-3" /> 登录
            </button>
          )}

          {/* Language Toggle */}
          <button 
            className="flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-primary transition-colors ml-2"
          >
            <Globe className="w-4 h-4" />
            CN
          </button>
        </div>
      </div>
    </header>
  )
}
