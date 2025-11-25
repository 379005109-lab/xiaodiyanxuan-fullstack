import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from './store/authStore'
import { UserRole } from './types'
import ErrorBoundary from './components/ErrorBoundary'
import { useEffect, useState, lazy, Suspense } from 'react'
// 导入测试工具
import './utils/testImageSave'

// 首页和布局直接导入（首屏必需）
import HomePage from './pages/frontend/HomePage'
import AdminLayout from './layouts/AdminLayout'

// 前台页面 - 懒加载
const ProductsPage = lazy(() => import('./pages/frontend/ProductsPage'))
const ProductDetailPage = lazy(() => import('./pages/frontend/ProductDetailPage'))
const ProductSharePage = lazy(() => import('./pages/frontend/ProductSharePage'))
const CartPage = lazy(() => import('./pages/frontend/CartPage'))
const CheckoutPage = lazy(() => import('./pages/frontend/CheckoutPage'))
const ComparePage = lazy(() => import('./pages/frontend/ComparePage'))
const FavoritesPage = lazy(() => import('./pages/frontend/FavoritesPage'))
const DesignServicePage = lazy(() => import('./pages/frontend/DesignServicePage'))
const PackagesPage = lazy(() => import('./pages/frontend/PackagesPage'))
const PackageDetailPage = lazy(() => import('./pages/frontend/PackageDetailPage'))
const OrdersPage = lazy(() => import('./pages/frontend/OrdersPage'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const RoleSelectPage = lazy(() => import('@/pages/auth/RoleSelectPage'))
const UserProfilePage = lazy(() => import('./pages/frontend/UserProfilePage'))
const BargainListPage = lazy(() => import('./pages/frontend/BargainListPage'))
const BargainDetailPage = lazy(() => import('./pages/frontend/BargainDetailPage'))

// 后台页面 - 懒加载
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const ProductManagement = lazy(() => import('./pages/admin/ProductManagement'))
const ProductForm = lazy(() => import('./pages/admin/ProductForm'))
const ProductDashboard = lazy(() => import('./pages/admin/ProductDashboard'))
const OrderManagement = lazy(() => import('./pages/admin/OrderManagement'))
const UserManagement = lazy(() => import('./pages/admin/UserManagement'))
const ImageManagement = lazy(() => import('./pages/admin/ImageManagement'))
const SiteImageManagement = lazy(() => import('./pages/admin/SiteImageManagement'))
const CategoryManagement = lazy(() => import('./pages/admin/CategoryManagement'))
const MaterialManagement = lazy(() => import('./pages/admin/MaterialManagement'))
const OrderAnalysis = lazy(() => import('./pages/admin/OrderAnalysis'))
const RefundManagement = lazy(() => import('./pages/admin/RefundManagement'))
const PackageManagementPage = lazy(() => import('./pages/admin/PackageManagementPage'))
const PackageListPage = lazy(() => import('./pages/admin/PackageListPage'))
const AdminBargainListPage = lazy(() => import('./pages/admin/AdminBargainListPage'))
const AdminBargainFormPage = lazy(() => import('./pages/admin/AdminBargainFormPage'))
const BargainDashboardPage = lazy(() => import('./pages/admin/BargainDashboardPage'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const DesignerProductEditPage = lazy(() => import('./pages/admin/DesignerProductEditPage'))
const DesignerPackageEditPage = lazy(() => import('./pages/admin/DesignerPackageEditPage'))
const PackageProfitPage = lazy(() => import('./pages/admin/PackageProfitPage'))
const OrderDashboard = lazy(() => import('./pages/admin/OrderDashboard'))
const DesignerOrdersPage = lazy(() => import('./pages/admin/DesignerOrdersPage'))
const DesignerReferredOrdersPage = lazy(() => import('./pages/admin/DesignerReferredOrdersPage'))
const TestConciergeOrderPage = lazy(() => import('./pages/admin/TestConciergeOrderPage'))
const UserUnbanPage = lazy(() => import('./pages/admin/UserUnbanPage'))
const NotificationTestPage = lazy(() => import('./pages/admin/NotificationTestPage'))
const NotificationManagementPage = lazy(() => import('./pages/admin/NotificationManagementPage'))
const DesignManagement = lazy(() => import('./pages/admin/DesignManagement'))
const CustomizationManagement = lazy(() => import('./pages/admin/CustomizationManagement'))

// 前台布局 - 懒加载
const FrontendLayout = lazy(() => import('./layouts/FrontendLayout'))

// 路由守卫
interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  allowedRoles?: UserRole[]
  fallbackPath?: string
}

const ProtectedRoute = ({ children, requireAdmin = false, allowedRoles, fallbackPath = '/' }: ProtectedRouteProps) => {
  const { user, isAuthenticated, token } = useAuthStore()
  const [isReady, setIsReady] = useState(false)
  
  // 等待 Zustand persist 中间件恢复状态
  useEffect(() => {
    // 检查 localStorage 中是否有认证信息
    const hasAuthData = localStorage.getItem('auth-storage')
    // 延迟一个 tick，确保 Zustand 已经恢复状态
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 0)
    return () => clearTimeout(timer)
  }, [])
  
  // 在初始化完成前显示加载状态
  if (!isReady) {
    return <div className="flex items-center justify-center h-screen bg-gray-50">加载中...</div>
  }
  
  // 如果有 token 但 isAuthenticated 为 false，等待状态恢复
  if (token && !isAuthenticated) {
    return <div className="flex items-center justify-center h-screen bg-gray-50">恢复认证状态中...</div>
  }
  
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] 未认证，重定向到登录页')
    return <Navigate to="/login" replace />
  }
  
  if (requireAdmin && user?.role !== 'admin' && user?.role !== 'super_admin') {
    console.log('[ProtectedRoute] 权限不足，重定向到', fallbackPath)
    return <Navigate to={fallbackPath} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    console.log('[ProtectedRoute] 角色不匹配，重定向到', fallbackPath)
    return <Navigate to={fallbackPath} replace />
  }
  
  return <>{children}</>
}

// 加载组件
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
)

function App() {
  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="bottom-right" richColors />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
          {/* 前台路由 */}
          <Route path="/" element={<FrontendLayout />}>
            <Route index element={<HomePage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="packages" element={<PackagesPage />} />
            <Route path="packages/:id" element={<PackageDetailPage />} />
            <Route path="share/product/:id" element={<ProductSharePage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="compare" element={<ComparePage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="design-service" element={<DesignServicePage />} />
            <Route path="design" element={<DesignServicePage />} />
            <Route path="bargain" element={<BargainListPage />} />
            <Route path="bargain/:id" element={<BargainDetailPage />} />
            <Route path="profile" element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            } />
          </Route>

          {/* 认证路由 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/role-select" element={
            <ProtectedRoute>
              <RoleSelectPage />
            </ProtectedRoute>
          } />

          {/* 后台路由 */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={[ 'admin', 'super_admin', 'designer' ]}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/products" replace />} />
            <Route path="products" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin', 'designer']}>
                <ProductManagement />
              </ProtectedRoute>
            } />
            <Route path="products/new" element={
              <ProtectedRoute requireAdmin fallbackPath="/admin/products">
                <ProductForm />
              </ProtectedRoute>
            } />
            <Route path="products/edit/:id" element={
              <ProtectedRoute requireAdmin fallbackPath="/admin/products">
                <ProductForm />
              </ProtectedRoute>
            } />
            <Route path="products/designer-edit/:id" element={
              <ProtectedRoute allowedRoles={['designer']}>
                <DesignerProductEditPage />
              </ProtectedRoute>
            } />
            <Route path="products/dashboard/:productId" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin', 'designer']}>
                <ProductDashboard />
              </ProtectedRoute>
            } />
            <Route path="orders" element={<ProtectedRoute requireAdmin fallbackPath="/admin/products"><OrderManagement /></ProtectedRoute>} />
            <Route path="order-dashboard" element={<ProtectedRoute requireAdmin fallbackPath="/admin/products"><OrderDashboard /></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute requireAdmin fallbackPath="/admin/products"><UserManagement /></ProtectedRoute>} />
            <Route path="images" element={<ProtectedRoute requireAdmin fallbackPath="/admin/products"><SiteImageManagement /></ProtectedRoute>} />
            <Route path="categories" element={<ProtectedRoute requireAdmin fallbackPath="/admin/products"><CategoryManagement /></ProtectedRoute>} />
            <Route path="materials" element={<ProtectedRoute requireAdmin fallbackPath="/admin/products"><MaterialManagement /></ProtectedRoute>} />
            <Route path="order-analysis" element={<ProtectedRoute requireAdmin fallbackPath="/admin/products"><OrderAnalysis /></ProtectedRoute>} />
            <Route path="refunds" element={<ProtectedRoute requireAdmin fallbackPath="/admin/products"><RefundManagement /></ProtectedRoute>} />
            <Route path="packages" element={<ProtectedRoute allowedRoles={['admin','super_admin','designer']}><PackageListPage /></ProtectedRoute>} />
            <Route path="packages/new" element={<ProtectedRoute allowedRoles={['admin','super_admin','designer']}><PackageManagementPage /></ProtectedRoute>} />
            <Route path="packages/edit/:id" element={<ProtectedRoute allowedRoles={['admin','super_admin','designer']}><PackageManagementPage /></ProtectedRoute>} />
            <Route path="packages/designer-edit/:id" element={<ProtectedRoute allowedRoles={['designer']}><DesignerPackageEditPage /></ProtectedRoute>} />
            <Route path="packages/profit/:id" element={<ProtectedRoute requireAdmin fallbackPath="/admin/packages"><PackageProfitPage /></ProtectedRoute>} />
            <Route path="bargain" element={<ProtectedRoute allowedRoles={['admin','super_admin','designer']}><AdminBargainListPage /></ProtectedRoute>} />
            <Route path="bargain/new" element={<ProtectedRoute allowedRoles={['admin','super_admin','designer']}><AdminBargainFormPage /></ProtectedRoute>} />
            <Route path="bargain/edit/:id" element={<ProtectedRoute allowedRoles={['admin','super_admin','designer']}><AdminBargainFormPage /></ProtectedRoute>} />
            <Route path="bargain-dashboard" element={<ProtectedRoute requireAdmin fallbackPath="/admin/bargain"><BargainDashboardPage /></ProtectedRoute>} />
            <Route path="dashboard" element={<ProtectedRoute requireAdmin fallbackPath="/admin/products"><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="designer-orders" element={<ProtectedRoute allowedRoles={['designer']}><DesignerOrdersPage /></ProtectedRoute>} />
            <Route path="designer-referred-orders" element={<ProtectedRoute allowedRoles={['designer']}><DesignerReferredOrdersPage /></ProtectedRoute>} />
            <Route path="test-concierge" element={<ProtectedRoute requireAdmin fallbackPath="/admin/products"><TestConciergeOrderPage /></ProtectedRoute>} />
            <Route path="user-unban" element={<ProtectedRoute requireAdmin fallbackPath="/admin/products"><UserUnbanPage /></ProtectedRoute>} />
            <Route path="notification-test" element={<ProtectedRoute requireAdmin fallbackPath="/admin/products"><NotificationTestPage /></ProtectedRoute>} />
            <Route path="notification-management" element={<ProtectedRoute requireAdmin fallbackPath="/admin/products"><NotificationManagementPage /></ProtectedRoute>} />
            <Route path="designs" element={<ProtectedRoute requireAdmin fallbackPath="/admin/products"><DesignManagement /></ProtectedRoute>} />
            <Route path="customization" element={<ProtectedRoute requireAdmin fallbackPath="/admin/products"><CustomizationManagement /></ProtectedRoute>} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  )
}

export default App

