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
import apiClient from '@/lib/apiClient'

interface SiteSettings {
  siteName: string
  siteSubtitle: string
  siteLogo: string
}

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
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: 'XIAODI',
    siteSubtitle: 'SUPPLY CHAIN',
    siteLogo: ''
  })

  const isAdminUser = Boolean(user?.permissions?.canAccessAdmin) ||
    ['admin', 'super_admin', 'platform_admin', 'platform_staff', 'enterprise_admin'].includes(user?.role as any)
  const canEnterAdminPanel = isAdminUser || user?.role === 'designer'
  
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
  
  // 加载网站设置
  useEffect(() => {
    const loadSiteSettings = async () => {
      try {
        const response = await apiClient.get('/site-settings/me')
        if (response.data.success && response.data.data) {
          setSiteSettings(response.data.data)
          console.log('✅ 网站设置已加载:', response.data.data)
        }
      } catch (error) {
        console.error('加载网站设置失败:', error)
      }
    }
    
    if (isAuthenticated) {
      loadSiteSettings()
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
      requireAuthNavigate(`/products?category=${categorySlug}`)
    } else {
      requireAuthNavigate('/categories')
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
      requireAuthNavigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const requireAuthNavigate = (to: string) => {
    if (!isAuthenticated) {
      sessionStorage.setItem('post_login_redirect', to)
      openLogin()
    }
    navigate(to)
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
              requireAuthNavigate('/all-products')
            }}
            className={`${getLinkClass('/all-products')} cursor-pointer`}
          >
            所有商品
          </span>
          <span
            onClick={() => requireAuthNavigate('/packages')}
            className={`${getLinkClass('/packages')} cursor-pointer`}
          >
            套餐专区
          </span>
          <Link to="/buying-service" className={getLinkClass('/buying-service')}>
            陪买服务
          </Link>
        </nav>

        {/* Center: Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center cursor-pointer" onClick={() => navigate('/')}>
          <div className="flex flex-col items-center">
            {siteSettings.siteLogo ? (
              <img src={siteSettings.siteLogo} alt={siteSettings.siteName} className="h-10 object-contain" />
            ) : (
              <>
                <div className="text-2xl font-serif font-bold tracking-tighter text-primary leading-none">
                  {siteSettings.siteName}
                </div>
                <span className="text-[10px] font-sans font-normal tracking-[0.3em] text-accent uppercase leading-tight mt-1">
                  {siteSettings.siteSubtitle}
                </span>
              </>
            )}
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
