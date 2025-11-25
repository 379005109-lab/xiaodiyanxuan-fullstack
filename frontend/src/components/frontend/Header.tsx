import { Link, useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, User, Menu, Heart, Home, Scale, ChevronDown, ClipboardList } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { useFavoriteStore } from '@/store/favoriteStore'
import { useCompareStore } from '@/store/compareStore'
import { useMemo } from 'react'
import { getAllCategories, getCategoryTree } from '@/services/categoryService'
import { getCustomerOrders } from '@/services/customerOrderService'
import { Category, CustomerOrder } from '@/types'
import { useState, useEffect, useRef } from 'react'
import { mapCustomerOrderToCartItems } from '@/utils/conciergeHelper'
import { toast } from 'sonner'

export default function Header() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const { getTotalItems, items } = useCartStore()
  const { getFavoriteCount, loadFavorites } = useFavoriteStore()
  const { getCount: getCompareCount, loadCompareItems } = useCompareStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [ordersMenuOpen, setOrdersMenuOpen] = useState(false)
  const categoryMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ordersMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const enterConciergeMode = useCartStore((state) => state.enterConciergeMode)

  // 计算购物车中有升级材质的商品数量
  const upgradeItemsCount = useMemo(() => {
    return items.filter(item => {
      if (!item.selectedMaterials) return false
      const materialUpgradePrices = (item.sku as any).materialUpgradePrices || {}
      const selectedMaterialList: string[] = []
      if (item.selectedMaterials.fabric) selectedMaterialList.push(item.selectedMaterials.fabric)
      if (item.selectedMaterials.filling) selectedMaterialList.push(item.selectedMaterials.filling)
      if (item.selectedMaterials.frame) selectedMaterialList.push(item.selectedMaterials.frame)
      if (item.selectedMaterials.leg) selectedMaterialList.push(item.selectedMaterials.leg)
      
      return selectedMaterialList.some(matName => materialUpgradePrices[matName] > 0)
    }).length
  }, [items])

  useEffect(() => {
    loadFavorites()
    loadCompareItems()
    loadCategories()
    if (isAuthenticated) {
      loadOrders()
    }
    
    // 清理定时器
    return () => {
      if (categoryMenuTimeoutRef.current) {
        clearTimeout(categoryMenuTimeoutRef.current)
      }
      if (ordersMenuTimeoutRef.current) {
        clearTimeout(ordersMenuTimeoutRef.current)
      }
    }
  }, [isAuthenticated])

  const loadCategories = async () => {
    try {
      const categoryTree = await getCategoryTree();
      // 只显示激活状态的分类
      const activeCategories = categoryTree.filter(cat => cat.status === 'active');
      setCategories(activeCategories);
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const list = await getCustomerOrders();
      // 只显示最近的5个订单
      setOrders(list.slice(0, 5));
    } catch (error) {
      console.error('加载订单失败:', error);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/products?category=${categoryId}`)
    setCategoryMenuOpen(false)
  }

  const handleConciergeOrder = (order: CustomerOrder) => {
    // 获取客户电话
    const customerPhone = order.phone || '13800138000'
    
    // 将订单商品转换为简化格式
    const simpleItems = mapCustomerOrderToCartItems(order)
    if (!simpleItems.length) {
      toast.error('该订单暂无可编辑的商品')
      return
    }

    // 进入代客下单模式，传递订单来源
    enterConciergeMode(order.id, order.title || '订单', customerPhone, simpleItems, order.source)
    
    toast.success(`已进入代客下单模式，订单：${order.title}`)
    
    // 关闭菜单并打开购物车页面
    setOrdersMenuOpen(false)
    navigate('/cart')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navLinks = [
    { name: '首页', path: '/', icon: Home },
    { name: '商城', path: '/products' },
    { name: '套餐专区', path: '/packages' },
    { name: '设计服务', path: '/design-service' },
  ]

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* 主导航 */}
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 cursor-pointer mr-8">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">家</span>
            </div>
            <span className="text-xl font-bold text-gray-900">小迪严选</span>
          </Link>

          {/* 桌面端导航 */}
          <nav className="hidden md:flex items-center space-x-12">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
              >
                {link.name}
              </Link>
            ))}
            {/* 分类下拉菜单 */}
            <div 
              className="relative"
              onMouseEnter={() => {
                // 清除关闭定时器
                if (categoryMenuTimeoutRef.current) {
                  clearTimeout(categoryMenuTimeoutRef.current)
                  categoryMenuTimeoutRef.current = null
                }
                setCategoryMenuOpen(true)
              }}
              onMouseLeave={() => {
                // 延迟关闭，给用户时间移动到下拉菜单
                categoryMenuTimeoutRef.current = setTimeout(() => {
                  setCategoryMenuOpen(false)
                }, 200)
              }}
            >
              <button className="flex items-center text-gray-700 hover:text-primary-600 transition-colors font-medium">
                分类
                <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {categoryMenuOpen && categories.length > 0 && (
                <div 
                  className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-[600px] overflow-y-auto"
                  onMouseEnter={() => {
                    // 清除关闭定时器
                    if (categoryMenuTimeoutRef.current) {
                      clearTimeout(categoryMenuTimeoutRef.current)
                      categoryMenuTimeoutRef.current = null
                    }
                    setCategoryMenuOpen(true)
                  }}
                  onMouseLeave={() => {
                    // 延迟关闭
                    categoryMenuTimeoutRef.current = setTimeout(() => {
                      setCategoryMenuOpen(false)
                    }, 200)
                  }}
                >
                  {categories.map((parentCategory) => (
                    <div key={parentCategory._id} className="mb-2">
                      <div className="px-4 py-2 text-sm font-semibold text-gray-900 border-b border-gray-100">
                        {parentCategory.name}
                      </div>
                      {parentCategory.children && parentCategory.children.length > 0 && (
                        <div className="py-1">
                          {parentCategory.children
                            .filter(child => child.status === 'active')
                            .map((childCategory) => (
                            <button
                              key={childCategory._id}
                              onClick={() => handleCategoryClick(childCategory._id)}
                              className="w-full text-left px-6 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                            >
                              {childCategory.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-12">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索商品..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </form>

          {/* 右侧功能 */}
          <div className="flex items-center space-x-4">
            {/* 收藏 */}
            <Link
              to="/favorites"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative hidden md:block"
            >
              <Heart className="h-6 w-6 text-gray-700" />
              {getFavoriteCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getFavoriteCount()}
                </span>
              )}
            </Link>

            {/* 对比 */}
            <Link
              to="/compare"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative hidden md:block"
            >
              <Scale className="h-6 w-6 text-gray-700" />
              {getCompareCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getCompareCount()}
                </span>
              )}
            </Link>

            {/* 订单图标 - 直接跳转到订单中心 */}
            {isAuthenticated && (
              <Link 
                to="/orders"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative hidden md:block"
              >
                <ClipboardList className="h-6 w-6 text-gray-700" />
              </Link>
            )}
            
            {/* 旧的悬浮订单菜单 - 已禁用 */}
            {false && isAuthenticated && (
              <div 
                className="relative hidden md:block"
                onMouseEnter={() => {
                  if (ordersMenuTimeoutRef.current) {
                    clearTimeout(ordersMenuTimeoutRef.current)
                  }
                  setOrdersMenuOpen(true)
                }}
                onMouseLeave={() => {
                  ordersMenuTimeoutRef.current = setTimeout(() => {
                    setOrdersMenuOpen(false)
                  }, 200)
                }}
              >
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                  <ClipboardList className="h-6 w-6 text-gray-700" />
                </button>
                
                {/* 订单下拉菜单 */}
                {ordersMenuOpen && orders.length > 0 && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
                    <div className="p-3 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-600 uppercase">最近订单</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {orders.map((order) => (
                        <div key={order.id} className="px-3 py-2 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{order.title}</p>
                            <button
                              onClick={() => handleConciergeOrder(order)}
                              className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded hover:bg-primary-100 whitespace-nowrap ml-2"
                            >
                              代客下单
                            </button>
                          </div>
                          <p className="text-xs text-gray-500">{order.orderNo}</p>
                          <p className="text-xs text-gray-600 mt-1">¥{order.totalAmount}</p>
                        </div>
                      ))}
                    </div>
                    <Link
                      to="/orders"
                      className="block px-3 py-2 text-sm text-primary-600 hover:bg-gray-50 border-t border-gray-100 text-center font-medium"
                    >
                      查看全部订单
                    </Link>
                  </div>
                )}
              </div>
            )}
            
            {/* 订单链接（未登录时） */}
            {!isAuthenticated && (
              <Link
                to="/orders"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative hidden md:block"
              >
                <ClipboardList className="h-6 w-6 text-gray-700" />
              </Link>
            )}

            {/* 购物车 */}
            <Link
              to="/cart"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative group"
            >
              <ShoppingCart className="h-6 w-6 text-gray-700" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
              
              {/* 升级产品提示 */}
              {upgradeItemsCount > 0 && (
                <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                  {upgradeItemsCount} 件升级产品
                </div>
              )}
            </Link>

            {/* 用户菜单 */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <User className="h-6 w-6 text-gray-700" />
                  <span className="text-sm font-medium text-gray-700 hidden lg:block">
                    {user?.username}
                  </span>
                </button>
                
                {/* 下拉菜单 */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    个人中心
                  </Link>
                  {user?.role !== 'customer' && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {user?.role === 'designer' ? '设计师工作台' : '后台管理'}
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    退出登录
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                登录
              </Link>
            )}

            {/* 移动端菜单按钮 */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-6 w-6 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* 移动端菜单 */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="container-custom py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                {link.name}
              </Link>
            ))}
            {/* 移动端分类 */}
            {categories.length > 0 && (
              <div className="px-4 py-2">
                <div className="text-sm font-semibold text-gray-900 mb-2">分类</div>
                <div className="space-y-1">
                  {categories.map((parentCategory) => (
                    <div key={parentCategory._id} className="ml-2">
                      <div className="text-xs font-medium text-gray-600 mb-1">
                        {parentCategory.name}
                      </div>
                      {parentCategory.children && parentCategory.children.length > 0 && (
                        <div className="ml-2 space-y-1">
                          {parentCategory.children
                            .filter(child => child.status === 'active')
                            .map((childCategory) => (
                            <Link
                              key={childCategory._id}
                              to={`/products?category=${childCategory._id}`}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded"
                            >
                              {childCategory.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

