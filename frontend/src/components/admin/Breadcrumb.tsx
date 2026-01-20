import React, { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

// 路由路径映射
const routeMap: Record<string, string> = {
  '/admin': '后台管理',
  '/admin/products': '商品管理',
  '/admin/orders': '订单管理',
  '/admin/users': '账号管理',
  '/admin/materials': '材质管理',
  '/admin/manufacturers': '厂家管理',
  '/admin/tenant/list': '租户管理',
  '/admin/org/structure': '组织架构',
  '/admin/org/positions': '职位管理',
  '/admin/org/roles': '角色管理',
  '/admin/org/menus': '应用菜单管理',
  '/admin/org/packages': '应用套餐',
  '/admin/categories': '商品分类',
  '/admin/packages': '套餐管理',
  '/admin/bargain': '砍价管理',
  '/admin/designer-orders': '我的订单',
  '/admin/designer-referred-orders': '推荐客户订单',
  '/admin/orders/trash': '订单回收站',
  '/admin/order-dashboard': '订单数据看板',
  '/admin/refunds': '退换货列表',
  '/admin/order-analysis': '订单分析',
  '/admin/buying-service-requests': '陪买预约',
  '/admin/coupons': '优惠券管理',
  '/admin/customization': '定制需求',
  '/admin/dashboard': '数据看板',
  '/admin/bargain-dashboard': '砍价数据看板',
  '/admin/authorizations': '授权管理',
}

export default function Breadcrumb() {
  const location = useLocation()
  
  // 生成面包屑路径
  const breadcrumbs = useMemo(() => {
    const pathParts = location.pathname.split('/').filter(Boolean)
    const breadcrumbItems = []
    
    let currentPath = ''
    
    for (const part of pathParts) {
      currentPath += `/${part}`
      const displayName = routeMap[currentPath] || part
      
      breadcrumbItems.push({
        path: currentPath,
        name: displayName
      })
    }
    
    return breadcrumbItems
  }, [location.pathname])
  
  return (
    <div className="flex items-center space-x-2 mb-6 text-sm">
      {breadcrumbs.map((breadcrumb, index) => (
        <React.Fragment key={breadcrumb.path}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
          {index === breadcrumbs.length - 1 ? (
            <span className="text-gray-700 font-medium">{breadcrumb.name}</span>
          ) : (
            <Link 
              to={breadcrumb.path} 
              className="text-gray-500 hover:text-primary-600 transition-colors"
            >
              {breadcrumb.name}
            </Link>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
