import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Outlet, Navigate } from 'react-router-dom'

/**
 * 动态路由组件
 * 根据后端返回的菜单列表生成路由
 */
export const DynamicRoutes = () => {
  const { menuList, user, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [routes, setRoutes] = useState<any[]>([])

  useEffect(() => {
    if (isAuthenticated && menuList) {
      // 处理菜单列表生成路由配置
      const generateRoutes = (menuItems: any[]) => {
        return menuItems.map(item => {
          const routePath = item.type === '0' ? `/${item.permission}` : `/${item.path}`
          
          if (item.hasChildren && item.children && item.children.length > 0) {
            return {
              path: routePath,
              element: <Outlet />,
              children: generateRoutes(item.children)
            }
          }
          
          return {
            path: routePath,
            element: <DynamicRouteComponent path={routePath} />
          }
        })
      }
      
      setRoutes(generateRoutes(menuList))
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, menuList])

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-gray-50">加载中...</div>
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

/**
 * 动态路由组件
 * 根据路径匹配对应的页面组件
 */
const DynamicRouteComponent = ({ path }: { path: string }) => {
  const [Component, setComponent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 根据路径动态加载组件
    const loadComponent = async () => {
      try {
        // 这里需要根据实际的路径映射关系加载对应的组件
        // 目前使用默认的页面组件，实际项目中需要根据路径映射到具体组件
        setComponent(() => () => <div className="p-6">页面内容：{path}</div>)
      } catch (error) {
        console.error('加载组件失败:', error)
        setComponent(() => () => <div className="p-6 text-red-500">页面加载失败</div>)
      } finally {
        setLoading(false)
      }
    }

    loadComponent()
  }, [path])

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-gray-50">加载中...</div>
  }

  if (!Component) {
    return <div className="p-6 text-red-500">页面不存在</div>
  }

  return <Component />
}
