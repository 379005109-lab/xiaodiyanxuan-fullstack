import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  Image,
  FolderTree,
  Palette,
  TrendingUp,
  RefreshCcw,
  X,
  ChevronDown,
  ChevronRight,
  Scissors,
  Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'

interface AdminSidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

interface MenuItem {
  name: string
  path: string
  icon: any
  children?: { name: string; path: string }[]
}

export default function AdminSidebar({ open, setOpen }: AdminSidebarProps) {
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['订单管理'])
  const { user } = useAuthStore()
  const role = user?.role

  const allMenuItems: MenuItem[] = [
    { name: '首页', path: '/admin', icon: Home },
    { name: '数据看板', path: '/admin/dashboard', icon: TrendingUp },
    { name: '网站图片管理', path: '/admin/images', icon: Image },
    { name: '设计管理', path: '/admin/designs', icon: Pencil },
    { name: '账号管理', path: '/admin/users', icon: Users },
    { name: '材质管理', path: '/admin/materials', icon: Palette },
    { name: '商品管理', path: '/admin/products', icon: Package },
    { name: '分类管理', path: '/admin/categories', icon: FolderTree },
    { name: '套餐管理', path: '/admin/packages', icon: Package },
    {
      name: '砍价管理',
      path: '/admin/bargain',
      icon: Scissors,
      children: role === 'designer' 
        ? [{ name: '砍价列表', path: '/admin/bargain' }]
        : [
            { name: '砍价列表', path: '/admin/bargain' },
            { name: '数据看板', path: '/admin/bargain-dashboard' },
          ]
    },
    { 
      name: '订单管理', 
      path: '/admin/orders', 
      icon: ShoppingCart,
      children: role === 'designer'
        ? [
            { name: '我的订单', path: '/admin/designer-orders' },
            { name: '推荐客户订单', path: '/admin/designer-referred-orders' },
          ]
        : [
            { name: '订单列表', path: '/admin/orders' },
            { name: '订单回收站', path: '/admin/orders/trash' },
            { name: '数据看板', path: '/admin/order-dashboard' },
            { name: '退换货列表', path: '/admin/refunds' },
            { name: '订单分析', path: '/admin/order-analysis' },
            { name: '陪买预约', path: '/admin/buying-service-requests' },
          ]
    },
    { name: '定制需求', path: '/admin/customization', icon: Pencil },
  ]

  const menuItems = role === 'designer'
    ? allMenuItems.filter(item =>
        ['商品管理', '套餐管理', '砍价管理', '订单管理'].includes(item.name)
      )
    : allMenuItems

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuName)
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    )
  }

  return (
    <>
      {/* 遮罩层 (移动端) */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-gray-900 text-white w-64 transform transition-transform duration-300 z-50',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <Link to="/admin" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">管</span>
            </div>
            <span className="text-lg font-bold">后台管理</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden hover:bg-gray-800 p-1 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 菜单 */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isExpanded = expandedMenus.includes(item.name)
            const isActive = location.pathname === item.path
            const hasActiveChild = item.children?.some(child => location.pathname === child.path)

            return (
              <div key={item.path}>
                {/* 主菜单项 */}
                {item.children ? (
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors',
                      hasActiveChild || isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    className={cn(
                      'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )}

                {/* 子菜单项 */}
                {item.children && isExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const isChildActive = location.pathname === child.path

                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={cn(
                            'flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors text-sm',
                            isChildActive
                              ? 'bg-primary-500 text-white'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                          )}
                        >
                          <span>{child.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* 底部信息 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <div className="text-xs text-gray-400 text-center">
            <p>版本 v1.0.0</p>
            <p className="mt-1">© 2024 品质家居</p>
          </div>
        </div>
      </aside>
    </>
  )
}

