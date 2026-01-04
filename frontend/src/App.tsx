import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from './store/authStore'
import { useAuthModalStore } from './store/authModalStore'
import { UserRole } from './types'
import ErrorBoundary from './components/ErrorBoundary'
import AuthModal from './components/auth/AuthModal'
import UserProfileModal from './components/auth/UserProfileModal'
import VersionChecker from './components/VersionChecker'
import { useEffect, useState, lazy, Suspense } from 'react'

// 布局直接导入
import AdminLayout from './layouts/AdminLayout'
import FrontendLayout from './layouts/FrontendLayout'

// 前台页面 - 懒加载
const ProductsPage = lazy(() => import('./pages/frontend/ProductsPage'))
const ProductDetailPage = lazy(() => import('./pages/frontend/ProductDetailPage'))
const ProductSharePage = lazy(() => import('./pages/frontend/ProductSharePage'))
const CartPage = lazy(() => import('./pages/frontend/CartPage'))
const CheckoutPage = lazy(() => import('./pages/frontend/CheckoutPage'))
const ComparePage = lazy(() => import('./pages/frontend/ComparePage'))
const FavoritesPage = lazy(() => import('./pages/frontend/FavoritesPage'))
const DesignServicePage = lazy(() => import('./pages/frontend/DesignServicePage'))
const BuyingServicePage = lazy(() => import('./pages/frontend/BuyingServicePage'))
const PackagesPage = lazy(() => import('./pages/frontend/PackagesPage'))
const PackageDetailPage = lazy(() => import('./pages/frontend/PackageDetailPageNew'))
const CategoriesPage = lazy(() => import('./pages/frontend/CategoriesPage'))
const OrdersPage = lazy(() => import('./pages/frontend/OrdersPageNew'))
const AddressesPage = lazy(() => import('./pages/frontend/AddressesPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const RoleSelectPage = lazy(() => import('@/pages/auth/RoleSelectPage'))
const UserProfilePage = lazy(() => import('./pages/frontend/UserProfilePage'))
const BargainListPage = lazy(() => import('./pages/frontend/BargainListPage'))
const BargainDetailPage = lazy(() => import('./pages/frontend/BargainDetailPage'))
const AboutPage = lazy(() => import('./pages/frontend/AboutPage'))
const HomePage = lazy(() => import('./pages/frontend/HomePage'))

// 后台页面 - 懒加载
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const ProductManagement = lazy(() => import('./pages/admin/ProductManagement'))
const ProductForm = lazy(() => import('./pages/admin/ProductForm'))
const ProductDashboard = lazy(() => import('./pages/admin/ProductDashboard'))
const ProductPricingManagement = lazy(() => import('./pages/admin/ProductPricingManagement'))
const OrderManagement = lazy(() => import('./pages/admin/OrderManagementNew2'))
const UserManagement = lazy(() => import('./pages/admin/UserManagement'))
const AccountManagement = lazy(() => import('./pages/admin/AccountManagement'))
const ImageManagement = lazy(() => import('./pages/admin/ImageManagement'))
const SiteImageManagement = lazy(() => import('./pages/admin/SiteImageManagement'))
const CategoryManagement = lazy(() => import('./pages/admin/CategoryManagement'))
const MaterialManagement = lazy(() => import('./pages/admin/MaterialManagementNew'))
const OrderAnalysis = lazy(() => import('./pages/admin/OrderAnalysis'))
const RefundManagement = lazy(() => import('./pages/admin/RefundManagementNew'))
const CouponManagement = lazy(() => import('./pages/admin/CouponManagement'))
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
const OrderTrashPage = lazy(() => import('./pages/admin/OrderTrashPage'))
const DesignerOrdersPage = lazy(() => import('./pages/admin/DesignerOrdersPage'))
const DesignerReferredOrdersPage = lazy(() => import('./pages/admin/DesignerReferredOrdersPage'))
const TestConciergeOrderPage = lazy(() => import('./pages/admin/TestConciergeOrderPage'))
const UserUnbanPage = lazy(() => import('./pages/admin/UserUnbanPage'))
const NotificationTestPage = lazy(() => import('./pages/admin/NotificationTestPage'))
const NotificationManagementPage = lazy(() => import('./pages/admin/NotificationManagementPage'))
const DesignManagement = lazy(() => import('./pages/admin/DesignManagement'))
const CustomizationManagement = lazy(() => import('./pages/admin/CustomizationManagement'))
const BuyingServiceRequestsPage = lazy(() => import('./pages/admin/BuyingServiceRequestsPage'))
const ActivityDashboard = lazy(() => import('./pages/admin/ActivityDashboard'))
const ManufacturerManagement = lazy(() => import('./pages/admin/ManufacturerManagement'))
const ManufacturerProductAuthorization = lazy(() => import('./pages/admin/ManufacturerProductAuthorization'))
const EliteManufacturerManagement = lazy(() => import('./pages/admin/EliteManufacturerManagement'))
const EliteManufacturerProductAuthorization = lazy(() => import('./pages/admin/EliteManufacturerProductAuthorization'))
const ManufacturerAuthorizationRequests = lazy(() => import('./pages/admin/ManufacturerAuthorizationRequests'))
const BatchAccountManagement = lazy(() => import('./pages/admin/BatchAccountManagement'))
const ReferralManagement = lazy(() => import('./pages/admin/ReferralManagement'))
const ManufacturerOrderManagement = lazy(() => import('./pages/admin/ManufacturerOrderManagement'))
const ImageSearchStats = lazy(() => import('./pages/admin/ImageSearchStats'))
const AuthorizationManagement = lazy(() => import('./pages/admin/AuthorizationManagement'))
const EnterpriseUserManagement = lazy(() => import('./pages/admin/EnterpriseUserManagement'))
const TierSystemManagement = lazy(() => import('./pages/admin/TierSystemManagement'))

const AuthorizedProductPricing = lazy(() => import('./pages/admin/AuthorizedProductPricing.tsx'))

// 厂家端页面

 const ADMIN_ACCESS_ROLES: UserRole[] = [
   'admin',
   'super_admin',
   'platform_admin',
   'platform_staff',
   'enterprise_admin',
 ]
 const ADMIN_AND_DESIGNER_ROLES: UserRole[] = [...ADMIN_ACCESS_ROLES, 'designer']

// 前台布局已在上方直接导入

// 路由守卫
interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireAdminPortal?: boolean
  requirePermission?: string
  allowedRoles?: UserRole[]
  disallowedRoles?: UserRole[]
  fallbackPath?: string
}

const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requireAdminPortal = false,
  requirePermission,
  allowedRoles,
  disallowedRoles,
  fallbackPath = '/',
}: ProtectedRouteProps) => {
  const { user, isAuthenticated, token, logout } = useAuthStore()
  const [isReady, setIsReady] = useState(false)
  const [authRecoveryTimedOut, setAuthRecoveryTimedOut] = useState(false)
  const [userRecoveryTimedOut, setUserRecoveryTimedOut] = useState(false)

  const isAdminUser = Boolean((user as any)?.permissions?.canAccessAdmin) ||
    (user ? ADMIN_ACCESS_ROLES.includes(user.role as UserRole) : false)
  
  // 等待 Zustand persist 中间件恢复状态
  useEffect(() => {
    // 延迟一个 tick，确保 Zustand 已经恢复状态
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  // 避免 token 存在但认证状态无法恢复导致永久卡死
  useEffect(() => {
    if (!isReady) return
    if (token && !isAuthenticated) {
      const timer = setTimeout(() => {
        setAuthRecoveryTimedOut(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
    setAuthRecoveryTimedOut(false)
  }, [isReady, token, isAuthenticated])

  useEffect(() => {
    if (!isReady) return
    if (token && isAuthenticated && !user) {
      const timer = setTimeout(() => {
        setUserRecoveryTimedOut(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
    setUserRecoveryTimedOut(false)
  }, [isReady, token, isAuthenticated, user])

  useEffect(() => {
    if (!authRecoveryTimedOut) return
    try {
      localStorage.removeItem('auth-storage')
      localStorage.removeItem('token')
    } finally {
      logout()
    }
  }, [authRecoveryTimedOut, logout])

  useEffect(() => {
    if (!userRecoveryTimedOut) return
    try {
      localStorage.removeItem('auth-storage')
      localStorage.removeItem('token')
    } finally {
      logout()
    }
  }, [userRecoveryTimedOut, logout])
  
  // 在初始化完成前显示加载状态
  if (!isReady) {
    return <div className="flex items-center justify-center h-screen bg-gray-50">加载中...</div>
  }
  
  // 如果有 token 但 isAuthenticated 为 false，等待状态恢复
  if (token && !isAuthenticated) {
    if (authRecoveryTimedOut) {
      return <Navigate to="/login" replace />
    }
    return <div className="flex items-center justify-center h-screen bg-gray-50">恢复认证状态中...</div>
  }

  if (token && isAuthenticated && !user) {
    if (userRecoveryTimedOut) {
      return <Navigate to="/login" replace />
    }
    return <div className="flex items-center justify-center h-screen bg-gray-50">恢复用户信息中...</div>
  }
  
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] 未认证，重定向到登录页')
    return <Navigate to="/login" replace />
  }

  if (requireAdminPortal) {
    const hasPortalAccess =
      user?.role === 'admin' ||
      user?.role === 'super_admin' ||
      user?.role === 'platform_admin' ||
      user?.role === 'platform_staff' ||
      user?.role === 'enterprise_admin' ||
      user?.role === 'enterprise_staff' ||
      user?.role === 'designer' ||
      (user as any)?.permissions?.canAccessAdmin === true
    if (!hasPortalAccess) {
      console.log('[ProtectedRoute] 无管理后台访问权限，重定向到', fallbackPath)
      return <Navigate to={fallbackPath} replace />
    }
  }
  
  if (requireAdmin && !isAdminUser) {
    console.log('[ProtectedRoute] 权限不足，重定向到', fallbackPath)
    return <Navigate to={fallbackPath} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    console.log('[ProtectedRoute] 角色不匹配，重定向到', fallbackPath)
    return <Navigate to={fallbackPath} replace />
  }

  if (disallowedRoles && user && disallowedRoles.includes(user.role)) {
    console.log('[ProtectedRoute] 角色被限制，重定向到', fallbackPath)
    return <Navigate to={fallbackPath} replace />
  }

  if (requirePermission) {
    const hasPerm =
      user?.role === 'super_admin' ||
      user?.role === 'admin' ||
      (user as any)?.permissions?.[requirePermission] === true
    if (!hasPerm) {
      console.log('[ProtectedRoute] 权限不足，重定向到', fallbackPath)
      return <Navigate to={fallbackPath} replace />
    }
  }
  
  return <>{children}</>
}

const AdminIndexRedirect = () => {
  const { user } = useAuthStore()
  const hasManufacturerId = Boolean((user as any)?.manufacturerId)
  const canManageProducts = (user as any)?.permissions?.canManageProducts === true

  if (hasManufacturerId) {
    return <Navigate to="/admin/manufacturers" replace />
  }

  if (user?.role === 'enterprise_admin') {
    if (canManageProducts) {
      return <Navigate to="/admin/products" replace />
    }
    return <Navigate to="/admin/authorized-products" replace />
  }

  if (user?.role === 'designer') {
    return <Navigate to="/admin/products" replace />
  }

  return <Navigate to="/admin/activity" replace />
}

const ProductManagementRoute = () => {
  const { user } = useAuthStore()
  const hasManufacturerId = Boolean((user as any)?.manufacturerId)
  const canAccess =
    user?.role === 'admin' ||
    user?.role === 'super_admin' ||
    user?.role === 'designer' ||
    (user as any)?.permissions?.canManageProducts === true ||
    hasManufacturerId

  if (!canAccess) {
    return <Navigate to="/admin" replace />
  }

  return <ProductManagement />
}

const ManufacturersRoute = () => {
  const { user } = useAuthStore()
  const isAdmin =
    user?.role === 'admin' ||
    user?.role === 'super_admin' ||
    user?.role === 'platform_admin' ||
    user?.role === 'platform_staff'

  const hasManufacturerId = Boolean((user as any)?.manufacturerId)

  if (isAdmin) return <ManufacturerManagement />
  if (hasManufacturerId) return <ManufacturerManagement />
  return <EliteManufacturerManagement />
}
// 加载组件
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
)

function App() {
  const { isOpen: authModalOpen, mode: authModalMode, close: closeAuthModal } = useAuthModalStore()
  const { user, isAuthenticated } = useAuthStore()
  const [showProfileModal, setShowProfileModal] = useState(false)
  
  // 检查用户是否需要完善信息（仅第一次注册登录时显示）
  useEffect(() => {
    if (isAuthenticated && user) {
      const userId = (user as any)._id || (user as any).id
      const profileCompletedKey = `profile_completed_${userId}`
      
      // 检查是否已经完善过信息
      const hasCompletedBefore = localStorage.getItem(profileCompletedKey) === 'true'
      if (hasCompletedBefore) return

      // 后端已标记完善信息，直接写入本地标记并退出
      if ((user as any).profileCompleted === true) {
        localStorage.setItem(profileCompletedKey, 'true')
        return
      }
      
      // 检查用户是否已完善信息（有nickname和gender）
      const hasNickname = (user as any).nickname && (user as any).nickname.trim() !== ''
      const hasGender = (user as any).gender && ['male', 'female'].includes((user as any).gender)
      
      // 如果已有信息，标记为已完善
      if (hasNickname && hasGender) {
        localStorage.setItem(profileCompletedKey, 'true')
        return
      }
      
      // 如果缺少必要信息且未完善过，显示完善弹窗
      const timer = setTimeout(() => {
        setShowProfileModal(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, user])
  
  // 全局禁止图片右键保存和拖拽
  useEffect(() => {
    // 禁止右键菜单
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'IMG') {
        e.preventDefault()
        return false
      }
    }
    
    // 禁止拖拽
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'IMG') {
        e.preventDefault()
        return false
      }
    }
    
    // 添加全局样式禁止选择和拖拽
    const style = document.createElement('style')
    style.textContent = `
      img {
        user-select: none;
        -webkit-user-drag: none;
        -moz-user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
        pointer-events: auto;
      }
    `
    document.head.appendChild(style)
    
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('dragstart', handleDragStart)
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('dragstart', handleDragStart)
      document.head.removeChild(style)
    }
  }, [])
  
  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <VersionChecker />
        <Toaster position="bottom-right" richColors />
        {/* 全局登录弹窗 */}
        <AuthModal 
          isOpen={authModalOpen} 
          onClose={closeAuthModal} 
          initialMode={authModalMode} 
        />
        {/* 用户信息完善弹窗 */}
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
          {/* 前台路由 */}
          <Route path="/" element={<FrontendLayout />}>
            <Route index element={<HomePage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="packages" element={<PackagesPage />} />
            <Route path="packages/:id" element={<PackageDetailPage />} />
            <Route path="share/product/:id" element={<ProductSharePage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="compare" element={<ComparePage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="addresses" element={<AddressesPage />} />
            <Route path="buying-service" element={<BuyingServicePage />} />
            <Route path="design-service" element={<DesignServicePage />} />
            <Route path="design" element={<DesignServicePage />} />
            <Route path="bargain" element={<BargainListPage />} />
            <Route path="bargain/:id" element={<BargainDetailPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="profile" element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            } />
          </Route>

          {/* 认证路由 */}
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/role-select" element={
            <ProtectedRoute>
              <RoleSelectPage />
            </ProtectedRoute>
          } />

          {/* 后台路由 */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdminPortal>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminIndexRedirect />} />
            <Route path="products" element={<ProductManagementRoute />} />
            <Route path="authorized-products" element={<AuthorizedProductPricing />} />
            <Route path="products/new" element={
              <ProtectedRoute requirePermission="canManageProducts" fallbackPath="/admin">
                <ProductForm />
              </ProtectedRoute>
            } />
            <Route path="products/edit/:id" element={
              <ProtectedRoute requirePermission="canManageProducts" fallbackPath="/admin">
                <ProductForm />
              </ProtectedRoute>
            } />
            <Route path="products/designer-edit/:id" element={
              <ProtectedRoute allowedRoles={['designer']}>
                <DesignerProductEditPage />
              </ProtectedRoute>
            } />
            <Route path="products/dashboard/:productId" element={
              <ProtectedRoute allowedRoles={ADMIN_AND_DESIGNER_ROLES}>
                <ProductDashboard />
              </ProtectedRoute>
            } />
            <Route path="products/pricing/:id" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin', 'designer']}>
                <ProductPricingManagement />
              </ProtectedRoute>
            } />
            <Route path="orders" element={<ProtectedRoute requireAdmin fallbackPath="/admin/products"><OrderManagement /></ProtectedRoute>} />
            <Route path="orders/trash" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/orders"><OrderTrashPage /></ProtectedRoute>} />
            <Route path="order-dashboard" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/orders"><OrderDashboard /></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/products"><AccountManagement /></ProtectedRoute>} />
            <Route path="users/batch" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/products"><BatchAccountManagement /></ProtectedRoute>} />
            <Route path="enterprise-users" element={<ProtectedRoute requireAdmin fallbackPath="/admin/products"><EnterpriseUserManagement /></ProtectedRoute>} />
            <Route path="images" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/products"><SiteImageManagement /></ProtectedRoute>} />
            <Route path="categories" element={<ProtectedRoute requireAdmin fallbackPath="/admin/products"><CategoryManagement /></ProtectedRoute>} />
            <Route path="materials" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/products"><MaterialManagement /></ProtectedRoute>} />
            <Route path="order-analysis" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/orders"><OrderAnalysis /></ProtectedRoute>} />
            <Route path="refunds" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/orders"><RefundManagement /></ProtectedRoute>} />
            <Route path="coupons" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/orders"><CouponManagement /></ProtectedRoute>} />
            <Route path="packages" element={<ProtectedRoute allowedRoles={ADMIN_AND_DESIGNER_ROLES} disallowedRoles={['enterprise_admin']} fallbackPath="/admin/products"><PackageListPage /></ProtectedRoute>} />
            <Route path="packages/new" element={<ProtectedRoute allowedRoles={ADMIN_AND_DESIGNER_ROLES} disallowedRoles={['enterprise_admin']} fallbackPath="/admin/packages"><PackageManagementPage /></ProtectedRoute>} />
            <Route path="packages/edit/:id" element={<ProtectedRoute allowedRoles={ADMIN_AND_DESIGNER_ROLES} disallowedRoles={['enterprise_admin']} fallbackPath="/admin/packages"><PackageManagementPage /></ProtectedRoute>} />
            <Route path="packages/designer-edit/:id" element={<ProtectedRoute allowedRoles={['designer']}><DesignerPackageEditPage /></ProtectedRoute>} />
            <Route path="packages/profit/:id" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/packages"><PackageProfitPage /></ProtectedRoute>} />
            <Route path="bargain" element={<ProtectedRoute allowedRoles={ADMIN_AND_DESIGNER_ROLES}><AdminBargainListPage /></ProtectedRoute>} />
            <Route path="bargain/new" element={<ProtectedRoute allowedRoles={ADMIN_AND_DESIGNER_ROLES}><AdminBargainFormPage /></ProtectedRoute>} />
            <Route path="bargain/edit/:id" element={<ProtectedRoute allowedRoles={ADMIN_AND_DESIGNER_ROLES}><AdminBargainFormPage /></ProtectedRoute>} />
            <Route path="bargain-dashboard" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/bargain"><BargainDashboardPage /></ProtectedRoute>} />
            <Route path="dashboard" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/products"><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="designer-orders" element={<ProtectedRoute allowedRoles={['designer']}><DesignerOrdersPage /></ProtectedRoute>} />
            <Route path="designer-referred-orders" element={<ProtectedRoute allowedRoles={['designer']}><DesignerReferredOrdersPage /></ProtectedRoute>} />
            <Route path="test-concierge" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/products"><TestConciergeOrderPage /></ProtectedRoute>} />
            <Route path="user-unban" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/products"><UserUnbanPage /></ProtectedRoute>} />
            <Route path="notification-test" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/products"><NotificationTestPage /></ProtectedRoute>} />
            <Route path="notifications" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/products"><NotificationManagementPage /></ProtectedRoute>} />
            <Route path="designs" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/products"><DesignManagement /></ProtectedRoute>} />
            <Route path="customization" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/products"><CustomizationManagement /></ProtectedRoute>} />
            <Route path="buying-service-requests" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/products"><BuyingServiceRequestsPage /></ProtectedRoute>} />
            <Route path="activity" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/products"><ActivityDashboard /></ProtectedRoute>} />
            <Route path="manufacturers" element={<ManufacturersRoute />} />
            <Route path="manufacturers/:manufacturerId/product-authorization" element={<EliteManufacturerProductAuthorization />} />
            <Route path="manufacturers/authorization-requests" element={<ManufacturerAuthorizationRequests />} />
            <Route path="authorizations" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/products"><AuthorizationManagement /></ProtectedRoute>} />
            <Route path="referrals" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/products"><ReferralManagement /></ProtectedRoute>} />
            <Route path="manufacturer-orders" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/orders"><ManufacturerOrderManagement /></ProtectedRoute>} />
            <Route path="image-search-stats" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/products"><ImageSearchStats /></ProtectedRoute>} />
            <Route path="tier-system" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'enterprise_admin', 'enterprise_staff']} fallbackPath="/admin/products"><TierSystemManagement /></ProtectedRoute>} />
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

