import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { Search, ShoppingCart, User, Heart, ClipboardList, LogIn, Globe, LayoutDashboard, LogOut, ChevronDown, MapPin, Grid, ChevronRight, Camera } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuthModalStore } from '@/store/authModalStore'
import { useCartStore } from '@/store/cartStore'
import { useFavoriteStore } from '@/store/favoriteStore'
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
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null)
  const [hoveredSubCategoryId, setHoveredSubCategoryId] = useState<string | null>(null)
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      requireAuthNavigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-stone-200">
      {/* 上层：Logo + 搜索框 + 图标 */}
      <div className="max-w-[1800px] mx-auto px-4 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Left: Logo */}
          <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
            {siteSettings.siteLogo ? (
              <img src={siteSettings.siteLogo} alt={siteSettings.siteName} className="h-10 object-contain" />
            ) : (
              <div className="flex flex-col">
                <div className="text-xl font-serif font-bold tracking-tighter text-primary leading-none">
                  {siteSettings.siteName}
                </div>
                <span className="text-[9px] font-sans font-normal tracking-[0.2em] text-stone-400 uppercase leading-tight">
                  {siteSettings.siteSubtitle}
                </span>
              </div>
            )}
          </div>

          {/* Center: 搜索框（内联输入） */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4 hidden md:flex">
            <div className="relative w-full flex">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Search className="w-5 h-5 text-stone-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索型号、产品名称..."
                className="w-full pl-12 pr-28 py-2.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowImageSearchModal(true)}
                className="absolute right-[72px] top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-primary transition-colors"
                title="以图搜索"
              >
                <Camera className="w-5 h-5" />
              </button>
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-primary text-white text-sm rounded-md hover:bg-primary/90 transition-colors"
              >
                搜索
              </button>
            </div>
          </form>

          {/* Right: Icons */}
          <div className="flex items-center space-x-5">
            {/* 移动端搜索 */}
            <button 
              onClick={() => setShowSearchModal(true)}
              className="md:hidden p-2 text-stone-500 hover:text-primary transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          
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
      </div>
      
      {/* 下层：导航链接 */}
      <div className="max-w-[1800px] mx-auto px-4 lg:px-8">
        <nav className="hidden md:flex items-center space-x-8 h-12 text-stone-700 text-sm font-semibold">
          <Link to="/" className={getLinkClass('/')}>
            首页
          </Link>
          <div 
            className="relative h-full flex items-center"
            ref={categoryMenuRef}
            onMouseEnter={handleCategoryMouseEnter}
            onMouseLeave={handleCategoryMouseLeave}
          >
            <span 
              onClick={() => navigate('/products')}
              className={`${getLinkClass('/products')} cursor-pointer flex items-center gap-1`}
            >
              所有商品
              <ChevronDown className={`w-3 h-3 transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`} />
            </span>
            
            {/* Mega Menu 下拉面板 */}
            {categoryMenuOpen && (
              <div className="absolute left-0 top-full pt-2 z-50">
                <div className="bg-white rounded-xl shadow-2xl border border-stone-200 flex min-w-[700px] max-w-[900px]">
                  {/* 左侧：一级分类列表 */}
                  <div className="w-48 border-r border-stone-100 py-3 flex-shrink-0">
                    <div className="px-4 py-2 text-xs font-bold text-stone-400 uppercase tracking-wider">商品分类</div>
                    {categories.filter(c => c.level === 1 || c.parentId === null || c.parentId === undefined || c.parentId === '').map((cat) => (
                      <div
                        key={cat._id}
                        onMouseEnter={() => {
                          setHoveredCategoryId(cat._id)
                          setHoveredSubCategoryId(null)
                        }}
                        onClick={() => {
                          setCategoryMenuOpen(false)
                          requireAuthNavigate(`/products?category=${cat.slug || cat._id}`)
                        }}
                        className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                          hoveredCategoryId === cat._id
                            ? 'bg-primary/5 text-primary font-medium'
                            : 'text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <span>{cat.name}</span>
                        <ChevronRight className="w-4 h-4 text-stone-300" />
                      </div>
                    ))}
                    <div className="border-t border-stone-100 mt-2 pt-2 px-4">
                      <button
                        onClick={() => {
                          setCategoryMenuOpen(false)
                          requireAuthNavigate('/all-products')
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        查看全部分类 →
                      </button>
                    </div>
                  </div>
                  
                  {/* 中间：二级分类列表 */}
                  <div className="w-40 border-r border-stone-100 py-3 flex-shrink-0">
                    {(() => {
                      const parentCat = categories.find(c => c._id === hoveredCategoryId)
                      // 使用嵌套的children数组而不是过滤parentId
                      const childCats = parentCat?.children || []
                      
                      if (!hoveredCategoryId) {
                        return (
                          <div className="px-4 py-8 text-stone-400 text-xs text-center">
                            请将鼠标移到左侧分类
                          </div>
                        )
                      }
                      
                      return (
                        <>
                          <div className="px-4 py-2 text-xs font-bold text-stone-400 uppercase tracking-wider">{parentCat?.name}</div>
                          {childCats.map((child: any, index: number) => {
                            const hasGrandchildren = child.children && child.children.length > 0
                            return (
                              <div
                                key={child._id}
                                onMouseEnter={() => setHoveredSubCategoryId(child._id)}
                                onClick={() => {
                                  setCategoryMenuOpen(false)
                                  requireAuthNavigate(`/products?category=${child.slug || child._id}`)
                                }}
                                className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                                  hoveredSubCategoryId === child._id || (!hoveredSubCategoryId && index === 0)
                                    ? 'bg-primary/5 text-primary font-medium'
                                    : 'text-stone-600 hover:bg-stone-50'
                                }`}
                              >
                                <span>{child.name}</span>
                                {hasGrandchildren && <ChevronRight className="w-3 h-3 text-stone-300" />}
                              </div>
                            )
                          })}
                        </>
                      )
                    })()}
                  </div>
                  
                  {/* 右侧：三级分类列表 */}
                  <div className="flex-1 p-6 min-h-[300px]">
                    {(() => {
                      const parentCat = categories.find(c => c._id === hoveredCategoryId)
                      const childCats = parentCat?.children || []
                      // 默认选中第一个二级分类
                      const activeSubCatId = hoveredSubCategoryId || (childCats.length > 0 ? childCats[0]._id : null)
                      const subCat = childCats.find((c: any) => c._id === activeSubCatId)
                      const grandchildCats = subCat?.children || []
                      
                      if (!hoveredCategoryId) {
                        return (
                          <div className="flex items-center justify-center h-full text-stone-400 text-sm">
                            请将鼠标移到左侧分类上查看子分类
                          </div>
                        )
                      }
                      
                      // 没有二级分类
                      if (childCats.length === 0) {
                        return (
                          <div className="h-full">
                            <div className="text-lg font-bold text-primary mb-4">{parentCat?.name}</div>
                            <div className="text-sm text-stone-500">点击左侧分类查看商品</div>
                          </div>
                        )
                      }
                      
                      // 显示当前二级分类的三级分类 - 简洁文字列表
                      return (
                        <div>
                          <div className="text-lg font-bold text-primary mb-4">{subCat?.name}</div>
                          {grandchildCats.length > 0 ? (
                            <div className="flex flex-wrap gap-3">
                              {grandchildCats.map((grandchild: any) => (
                                <span
                                  key={grandchild._id}
                                  onClick={() => {
                                    setCategoryMenuOpen(false)
                                    requireAuthNavigate(`/products?category=${grandchild.slug || grandchild._id}`)
                                  }}
                                  className="px-4 py-2 bg-stone-50 hover:bg-primary/10 text-stone-600 hover:text-primary rounded-full cursor-pointer transition-all text-sm border border-stone-200 hover:border-primary/30"
                                >
                                  {grandchild.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-stone-500">点击左侧分类查看商品</div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
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
      </div>
      
      {/* 搜索模态框 */}
      <SearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
      
      {/* 以图搜索模态框 */}
      <ImageSearchModal isOpen={showImageSearchModal} onClose={() => setShowImageSearchModal(false)} />
    </header>
  )
}
