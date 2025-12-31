import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { Search, ShoppingCart, User, Heart, Scale, ClipboardList, LogIn, Globe, LayoutDashboard, LogOut, ChevronDown, MapPin, Grid, ChevronRight, Camera } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuthModalStore } from '@/store/authModalStore'
import { useCartStore } from '@/store/cartStore'
import { useFavoriteStore } from '@/store/favoriteStore'
import { useCompareStore } from '@/store/compareStore'
import { useState, useEffect, useRef } from 'react'
import { getAllCategories } from '@/services/categoryService'
import { getFileUrl } from '@/services/uploadService'
import SearchModal from './SearchModal'
import ImageSearchModal from './ImageSearchModal'

export default function Header() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const { openLogin } = useAuthModalStore()
  const { getTotalItems } = useCartStore()
  const { getFavoriteCount, loadFavorites } = useFavoriteStore()
  const { getCount: getCompareCount, loadCompareItems, openModal: openCompareModal } = useCompareStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showImageSearchModal, setShowImageSearchModal] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const isAdminUser = Boolean(user?.permissions?.canAccessAdmin) ||
    ['admin', 'super_admin', 'platform_admin', 'platform_staff', 'enterprise_admin'].includes(user?.role as any)
  const canEnterAdminPanel = isAdminUser || user?.role === 'designer'

  const hasManufacturerToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('manufacturerToken'))
  const manufacturerEntryPath = hasManufacturerToken ? '/manufacturer/orders' : '/manufacturer/login'
  
  // 分类悬浮窗口状态
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const categoryMenuRef = useRef<HTMLDivElement>(null)
  const categoryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [language, setLanguage] = useState<'CN' | 'EN'>(() => {
    return (localStorage.getItem('language') as 'CN' | 'EN') || 'CN'
  })
  
  // 从URL获取当前选中的分类
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const currentCategory = searchParams.get('category') || ''

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
  
  // 加载分类数据
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getAllCategories()
        setCategories(data || [])
      } catch (error) {
        console.error('加载分类失败:', error)
      }
    }
    loadCategories()
  }, [])
  
  // 处理分类菜单的鼠标事件
  const handleCategoryMouseEnter = () => {
    if (categoryTimeoutRef.current) {
      clearTimeout(categoryTimeoutRef.current)
    }
    setCategoryMenuOpen(true)
  }
  
  const handleCategoryMouseLeave = () => {
    categoryTimeoutRef.current = setTimeout(() => {
      setCategoryMenuOpen(false)
    }, 150)
  }
  
  // 进入分类页面
  const handleCategoryClick = (categorySlug?: string) => {
    setCategoryMenuOpen(false)
    if (categorySlug) {
      navigate(`/products?category=${categorySlug}`)
    } else {
      navigate('/categories')
    }
  }
  
  // 获取当前分类名称
  const getCurrentCategoryName = () => {
    if (!currentCategory) return null
    const cat = categories.find(c => c.slug === currentCategory || c._id === currentCategory || c.name === currentCategory)
    return cat?.name || currentCategory
  }

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
          <div 
            className="relative"
            ref={categoryMenuRef}
            onMouseEnter={handleCategoryMouseEnter}
            onMouseLeave={handleCategoryMouseLeave}
          >
            <span 
              className={`${getLinkClass('/categories')} cursor-pointer flex items-center gap-1`}
            >
              商品分类
              {getCurrentCategoryName() && (
                <span className="text-primary font-medium text-xs bg-primary/10 px-2 py-0.5 rounded-full ml-1">
                  {getCurrentCategoryName()}
                </span>
              )}
              <ChevronDown className={`w-3 h-3 transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`} />
            </span>
            
            {/* 分类悬浮窗口 */}
            {categoryMenuOpen && (
              <div 
                className="absolute left-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-stone-100 z-50 min-w-[600px] p-6"
                onMouseEnter={handleCategoryMouseEnter}
                onMouseLeave={handleCategoryMouseLeave}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif font-bold text-lg text-primary">商品分类</h3>
                  <button
                    onClick={() => handleCategoryClick()}
                    className="text-sm text-primary hover:text-primary-700 flex items-center gap-1"
                  >
                    查看全部 <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                {/* 分类网格 - 显示图片 */}
                <div className="grid grid-cols-4 gap-4">
                  {categories.filter(c => !c.parentId).slice(0, 8).map((category) => (
                    <div
                      key={category._id}
                      onClick={() => handleCategoryClick(category.slug || category._id)}
                      className="group cursor-pointer rounded-xl overflow-hidden border border-stone-100 hover:border-primary/30 hover:shadow-lg transition-all"
                    >
                      {/* 分类图片 - 放大 */}
                      <div className="aspect-square bg-stone-50 overflow-hidden">
                        {category.image ? (
                          <img
                            src={getFileUrl(category.image)}
                            alt={category.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-12 h-12 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg></div>'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Grid className="w-12 h-12 text-stone-300" />
                          </div>
                        )}
                      </div>
                      {/* 分类信息 */}
                      <div className="p-3 bg-white">
                        <h4 className="font-medium text-stone-800 group-hover:text-primary transition-colors text-sm truncate">
                          {category.name}
                        </h4>
                        {/* 显示子分类数量 */}
                        {category.children && category.children.length > 0 && (
                          <p className="text-xs text-stone-400 mt-1">
                            {category.children.length} 个子分类
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* 当前选中提示 */}
                {currentCategory && (
                  <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
                    <p className="text-sm text-stone-500">
                      当前选中：
                      <span className="text-primary font-medium ml-1">
                        {getCurrentCategoryName()}
                      </span>
                    </p>
                    <button
                      onClick={() => navigate('/products')}
                      className="text-xs text-stone-400 hover:text-red-500"
                    >
                      清除筛选
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
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
          

          {/* Search - 点击打开搜索模态框 */}
          <div className="hidden lg:flex items-center gap-1">
            <button 
              onClick={() => setShowSearchModal(true)}
              className="flex items-center bg-stone-100/50 rounded-l-full px-4 py-2 hover:bg-stone-100 transition-all border border-transparent hover:border-primary/20 cursor-pointer"
            >
              <Search className="text-stone-400 w-4 h-4 mr-2" />
              <span className="text-sm text-stone-400">搜索型号/产品...</span>
            </button>
            <button 
              onClick={() => setShowImageSearchModal(true)}
              className="flex items-center bg-stone-100/50 rounded-r-full px-3 py-2 hover:bg-primary/10 transition-all border-l border-stone-200 cursor-pointer group"
              title="以图搜索"
            >
              <Camera className="text-stone-400 w-4 h-4 group-hover:text-primary transition-colors" />
            </button>
          </div>
          
          {/* 移动端搜索图标 */}
          <div className="lg:hidden flex items-center gap-1">
            <button 
              onClick={() => setShowSearchModal(true)}
              className="p-2 text-stone-500 hover:text-primary transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowImageSearchModal(true)}
              className="p-2 text-stone-500 hover:text-primary transition-colors"
              title="以图搜索"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>
          
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
          <button
            onClick={openCompareModal}
            className="relative hover:text-primary transition-colors text-stone-500"
            title="商品对比"
          >
            <Scale className="w-5 h-5" />
            {getCompareCount() > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-full">
                {getCompareCount()}
              </span>
            )}
          </button>
          
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
                    <p className="text-xs text-stone-400">{isAdminUser ? '管理员' : user?.role === 'designer' ? '设计师' : '普通用户'}</p>
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
                  
                  {/* 我的地址 */}
                  <Link
                    to="/addresses"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 hover:text-primary transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    我的地址
                  </Link>

                  <Link
                    to={manufacturerEntryPath}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Factory className="w-4 h-4 mr-2" />
                    厂家中心
                  </Link>
                  
                  {/* 管理后台入口 - 仅管理员可见 */}
                  {canEnterAdminPanel && (
                    <Link
                      to="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
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
            onClick={() => {
              const newLang = language === 'CN' ? 'EN' : 'CN'
              setLanguage(newLang)
              localStorage.setItem('language', newLang)
              // 触发语言变更事件供其他组件监听
              window.dispatchEvent(new CustomEvent('languageChange', { detail: newLang }))
            }}
            className="flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-primary transition-colors ml-2"
            title={language === 'CN' ? '切换到英文' : 'Switch to Chinese'}
          >
            <Globe className="w-4 h-4" />
            {language}
          </button>
        </div>
      </div>
      
      {/* 搜索模态框 */}
      <SearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
      
      {/* 以图搜索模态框 */}
      <ImageSearchModal isOpen={showImageSearchModal} onClose={() => setShowImageSearchModal(false)} />
    </header>
  )
}
