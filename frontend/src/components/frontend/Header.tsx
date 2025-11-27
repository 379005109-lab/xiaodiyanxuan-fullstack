import { Link, useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, User, Heart, Scale, ClipboardList, LogIn, Globe, LayoutDashboard, LogOut, ChevronDown, MapPin, Grid } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuthModalStore } from '@/store/authModalStore'
import { useCartStore } from '@/store/cartStore'
import { useFavoriteStore } from '@/store/favoriteStore'
import { useCompareStore } from '@/store/compareStore'
import { useState, useEffect, useRef } from 'react'

export default function Header() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const { openLogin } = useAuthModalStore()
  const { getTotalItems } = useCartStore()
  const { getFavoriteCount, loadFavorites } = useFavoriteStore()
  const { getCount: getCompareCount, loadCompareItems } = useCompareStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
          <span 
            onClick={() => {
              if (!isAuthenticated) {
                openLogin()
                return
              }
              navigate('/products')
            }}
            className={`${getLinkClass('/products')} cursor-pointer`}
          >
            商城
          </span>
          <Link to="/categories" className={getLinkClass('/categories')}>
            商品分类
          </Link>
          <Link to="/packages" className={getLinkClass('/packages')}>
            套餐专区
          </Link>
          <Link to="/buying-service" className={getLinkClass('/buying-service')}>
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
          
          {/* Cart */}
          <Link
            to="/cart"
            className={`hover:text-primary transition-colors relative ${location.pathname === '/cart' ? 'text-primary' : 'text-stone-500'}`}
            title="购物车"
          >
            <ShoppingCart className="w-5 h-5" />
            {getTotalItems() > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-white text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-full">
                {getTotalItems()}
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
          
          <div className="h-4 w-px bg-stone-300 mx-2"></div>

          {/* Login / User Status */}
          {isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* 用户下拉菜单 */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-stone-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-stone-100">
                    <p className="text-sm font-medium text-primary">{(user as any)?.nickname || user?.phone || '用户'}</p>
                    <p className="text-xs text-stone-400">{user?.role === 'admin' || user?.role === 'super_admin' ? '管理员' : '普通用户'}</p>
                  </div>
                  
                  {/* 编辑资料 */}
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 hover:text-primary transition-colors"
                  >
                    <User className="w-4 h-4" />
                    编辑资料
                  </Link>
                  
                  {/* 我的订单 */}
                  <Link
                    to="/orders"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 hover:text-primary transition-colors"
                  >
                    <ClipboardList className="w-4 h-4" />
                    我的订单
                  </Link>
                  
                  {/* 我的地址 */}
                  <Link
                    to="/addresses"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 hover:text-primary transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    我的地址
                  </Link>
                  
                  {/* 管理后台入口 - 仅管理员可见 */}
                  {(user?.role === 'admin' || user?.role === 'super_admin') && (
                    <Link
                      to="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 hover:text-primary transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      管理后台
                    </Link>
                  )}
                  
                  <button
                    onClick={() => {
                      logout()
                      setUserMenuOpen(false)
                      navigate('/')
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 hover:text-red-500 transition-colors w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              )}
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
