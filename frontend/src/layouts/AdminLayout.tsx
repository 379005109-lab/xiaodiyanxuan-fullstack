import { Outlet } from 'react-router-dom'
import { useState, Suspense, lazy } from 'react'

const AdminSidebar = lazy(() => import('@/components/admin/AdminSidebar'))
const AdminHeader = lazy(() => import('@/components/admin/AdminHeader'))

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Suspense fallback={<div className="w-64 bg-white"></div>}>
        <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      </Suspense>
      <div className="flex-1 flex flex-col">
        <Suspense fallback={<div className="h-16 bg-white border-b"></div>}>
          <AdminHeader toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        </Suspense>
        <main className="flex-1 p-6 overflow-auto bg-gray-50">
          <Suspense fallback={<div className="text-center py-8">加载中...</div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

