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
const ActivityDashboardPage = lazy(() => import('./pages/admin/ActivityDashboardPage'))
const UserLoginDetailsPage = lazy(() => import('./pages/admin/UserLoginDetailsPage'))
const ManufacturerManagement = lazy(() => import('./pages/admin/ManufacturerManagement'))
const AdminManufacturerCenter = lazy(() => import('./pages/admin/AdminManufacturerCenter'))
const ManufacturerProductAuthorization = lazy(() => import('./pages/admin/ManufacturerProductAuthorization'))
const EliteManufacturerManagement = lazy(() => import('./pages/admin/EliteManufacturerManagement'))
const EliteManufacturerProductAuthorization = lazy(() => import('./pages/admin/EliteManufacturerProductAuthorization'))
const ManufacturerAuthorizationRequests = lazy(() => import('./pages/admin/ManufacturerAuthorizationRequests'))
const ManufacturerBusinessPanel = lazy(() => import('./pages/admin/ManufacturerBusinessPanel'))
const BatchAccountManagement = lazy(() => import('./pages/admin/BatchAccountManagement'))
const ReferralManagement = lazy(() => import('./pages/admin/ReferralManagement'))
const ManufacturerOrderManagement = lazy(() => import('./pages/admin/ManufacturerOrderManagement'))
const ImageSearchStats = lazy(() => import('./pages/admin/ImageSearchStats'))
const AuthorizationManagement = lazy(() => import('./pages/admin/AuthorizationManagement'))
const EnterpriseUserManagement = lazy(() => import('./pages/admin/EnterpriseUserManagement'))
const TierSystemManagement = lazy(() => import('./pages/admin/TierSystemManagement'))

const AuthorizedProductPricing = lazy(() => import('./pages/admin/AuthorizedProductPricing.tsx'))
const AuthorizationPricingPage = lazy(() => import('./pages/admin/AuthorizationPricingPage'))

// 新功能页面 - 懒加载
const TenantListPage = lazy(() => import('./pages/admin/tenant/list/page'))
const TenantFormPage = lazy(() => import('./pages/admin/tenant/form/page'))
const OrgStructurePage = lazy(() => import('./pages/admin/org/structure/page'))
const OrgPositionsPage = lazy(() => import('./pages/admin/org/positions/page'))
const OrgRolesPage = lazy(() => import('./pages/admin/org/roles/page'))
const OrgMenusPage = lazy(() => import('./pages/admin/org/menus/page'))
const OrgPackagesPage = lazy(() => import('./pages/admin/org/packages/page'))
const OrgApplicationsPage = lazy(() => import('./pages/admin/org/applications/page'))

// 厂家端页面
const ManufacturerLogin = lazy(() => import('./pages/manufacturer/ManufacturerLogin'))
const ManufacturerOrders = lazy(() => import('./pages/manufacturer/ManufacturerOrders'))
const ManufacturerSettings = lazy(() => import('./pages/manufacturer/ManufacturerSettings'))
const ManufacturerAuthorizations = lazy(() => import('./pages/manufacturer/ManufacturerAuthorizations'))

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
  const { user, isAuthenticated, token, permissionList } = useAuthStore()
  const { openLogin } = useAuthModalStore()

  const isAdminUser = Boolean((user as any)?.permissions?.canAccessAdmin) ||
    (user ? ADMIN_ACCESS_ROLES.includes(user.role as UserRole) : false)
  
  // 直接检查 localStorage 中的 token，这是最可靠的方式
  const localToken = localStorage.getItem('token')
  const hasToken = token || localToken
  
  // 如果没有 token，打开登录弹窗并重定向到首页
  if (!hasToken) {
    console.log('[ProtectedRoute] 无 token，打开登录弹窗')
    setTimeout(() => openLogin(), 0)
    return <Navigate to="/" replace />
  }
  
  // 如果有 token 但 Zustand 状态还未恢复，显示加载状态
  // 但不要无限等待，给一个合理的超时
  if (!isAuthenticated || !user) {
    // 如果 localStorage 有 token，说明用户已登录，只是状态未恢复
    // 直接渲染子组件，让页面自己处理数据加载
    console.log('[ProtectedRoute] 有 token 但状态未完全恢复，继续渲染', { isAuthenticated, hasUser: !!user })
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
      return <Navigate to={fallbackPath} replace />
    }
  }
  
  if (requireAdmin && !isAdminUser) {
    return <Navigate to={fallbackPath} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={fallbackPath} replace />
  }

  if (disallowedRoles && user && disallowedRoles.includes(user.role)) {
    return <Navigate to={fallbackPath} replace />
  }

  if (requirePermission) {
    const hasPerm =
      user?.role === 'super_admin' ||
      user?.role === 'admin' ||
      (user as any)?.permissions?.[requirePermission] === true ||
      permissionList.includes(requirePermission)
    if (!hasPerm) {
      return <Navigate to={fallbackPath} replace />
    }
  }
  
  return <>{children}</>
}

// AdminIndexRedirect 组件已移除，直接使用 Navigate 组件进行重定向

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

  const isSuperAdmin = user?.role === 'super_admin'
  const isDesigner = user?.role === 'designer'
  const isManufacturerSubAccount = user?.role === 'enterprise_admin' || user?.role === 'enterprise_staff'
  const isAdminButNotSuper = user?.role === 'admin' || user?.role === 'platform_admin' || user?.role === 'platform_staff'

  const hasManufacturerId = Boolean((user as any)?.manufacturerId)

  if (isSuperAdmin) return <AdminManufacturerCenter />
  if (isDesigner) return <EliteManufacturerManagement />
  if (isManufacturerSubAccount || hasManufacturerId || isAdminButNotSuper) return <ManufacturerManagement />
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
      if (!userId) return // 确保有用户ID
      
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
      // 但仅在非后台页面显示，避免在后台管理时弹窗
      const currentPath = window.location.pathname
      if (!currentPath.startsWith('/admin')) {
        const timer = setTimeout(() => {
          setShowProfileModal(true)
        }, 500)
        return () => clearTimeout(timer)
      }
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
            <Route path="frontend" element={<HomePage />} />
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
            <ProtectedRoute fallbackPath="/">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/tenant/list" replace />} />
            <Route path="products" element={<ProductManagementRoute />} />
            <Route path="authorized-products" element={<AuthorizedProductPricing />} />
            <Route path="products/new" element={
              <ProtectedRoute requirePermission="canManageProducts" fallbackPath="/admin/products">
                <ProductForm />
              </ProtectedRoute>
            } />
            <Route path="products/edit/:id" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin', 'platform_admin', 'platform_staff', 'enterprise_admin']} fallbackPath="/admin/products">
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
            <Route path="activity-dashboard" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/products"><ActivityDashboardPage /></ProtectedRoute>} />
            <Route path="user-login-details" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/products"><UserLoginDetailsPage /></ProtectedRoute>} />
            <Route path="manufacturers" element={<ProtectedRoute requireAdminPortal fallbackPath="/admin/products"><ManufacturersRoute /></ProtectedRoute>} />
            <Route path="manufacturers/:manufacturerId/product-authorization" element={<ProtectedRoute requireAdminPortal fallbackPath="/admin/products"><EliteManufacturerProductAuthorization /></ProtectedRoute>} />
            <Route path="manufacturers/:manufacturerId/business-panel" element={<ProtectedRoute requireAdminPortal fallbackPath="/admin/products"><ManufacturerBusinessPanel /></ProtectedRoute>} />
            <Route path="business-panel" element={<ProtectedRoute allowedRoles={['enterprise_admin', 'enterprise_staff']} fallbackPath="/admin/products"><ManufacturerBusinessPanel /></ProtectedRoute>} />
            <Route path="manufacturers/authorization-requests" element={<ProtectedRoute requireAdminPortal fallbackPath="/admin/products"><ManufacturerAuthorizationRequests /></ProtectedRoute>} />
            <Route path="authorizations" element={<ProtectedRoute requireAdminPortal fallbackPath="/admin/products"><AuthorizationManagement /></ProtectedRoute>} />
            <Route path="authorizations/:authorizationId/pricing" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'enterprise_admin', 'enterprise_staff']} fallbackPath="/admin/products"><AuthorizationPricingPage /></ProtectedRoute>} />
            <Route path="referrals" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/products"><ReferralManagement /></ProtectedRoute>} />
            <Route path="manufacturer-orders" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/orders"><ManufacturerOrderManagement /></ProtectedRoute>} />
            <Route path="image-search-stats" element={<ProtectedRoute requireAdmin disallowedRoles={['enterprise_admin']} fallbackPath="/admin/products"><ImageSearchStats /></ProtectedRoute>} />
            <Route path="tier-system" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'enterprise_admin', 'enterprise_staff']} fallbackPath="/admin/products"><TierSystemManagement /></ProtectedRoute>} />
            
            {/* 租户管理 */}
            <Route path="tenant/list" element={<TenantListPage />} />
            <Route path="tenant/form" element={<TenantFormPage />} />
            
            {/* 组织管理 */}
            <Route path="org/structure" element={<OrgStructurePage />} />
            <Route path="org/positions" element={<OrgPositionsPage />} />
            <Route path="org/roles" element={<OrgRolesPage />} />
            <Route path="org/menus" element={<OrgMenusPage />} />
            <Route path="org/packages" element={<OrgPackagesPage />} />
            <Route path="org/applications" element={<OrgApplicationsPage />} />
          </Route>
 
          {/* 厂家端路由 */}
          <Route path="/manufacturer/login" element={<ManufacturerLogin />} />
          <Route path="/manufacturer/orders" element={<ManufacturerOrders />} />
          <Route path="/manufacturer/settings" element={<ManufacturerSettings />} />
          <Route path="/manufacturer/authorizations" element={<ManufacturerAuthorizations />} />
 
          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  )
}

export default App

