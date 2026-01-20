import { useLocation } from 'react-router-dom'
import { useState, Suspense, lazy, useEffect } from 'react'
import { RouteCacheContainer } from '@/components/admin/RouteCache'
const Breadcrumb = lazy(() => import('@/components/admin/Breadcrumb'))
const RouteErrorBoundary = lazy(() => import('@/components/admin/RouteErrorBoundary'))

const AdminSidebar = lazy(() => import('@/components/admin/AdminSidebar'))
const AdminHeader = lazy(() => import('@/components/admin/AdminHeader'))

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const location = useLocation()

  // 监听路由变化，显示加载状态
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Suspense fallback={<div className="w-64 bg-white"></div>}>
        <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      </Suspense>
      <div className="flex-1 flex flex-col lg:ml-64">
        <Suspense fallback={<div className="h-16 bg-white border-b"></div>}>
          <AdminHeader toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        </Suspense>
        <main className="flex-1 p-6 overflow-auto bg-gray-50">
          <Suspense fallback={<div className="text-center py-8">加载中...</div>}>
            {isLoading && (
              <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
                <div className="text-center">
                  <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600">加载中...</p>
                </div>
              </div>
            )}
            <Breadcrumb />
            <RouteErrorBoundary>
              <RouteCacheContainer />
            </RouteErrorBoundary>
          </Suspense>
        </main>
      </div>
    </div>
  )
}

