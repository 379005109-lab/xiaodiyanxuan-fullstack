import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from './store/authStore'
import { UserRole } from './types'
import ErrorBoundary from './components/ErrorBoundary'
// 导入测试工具
import './utils/testImageSave'

// 前台页面
import HomePage from './pages/frontend/HomePage'
import ProductsPage from './pages/frontend/ProductsPage'
import ProductDetailPage from './pages/frontend/ProductDetailPage'
import ProductSharePage from './pages/frontend/ProductSharePage'
import CartPage from './pages/frontend/CartPage'
import CheckoutPage from './pages/frontend/CheckoutPage'
import ComparePage from './pages/frontend/ComparePage'
import FavoritesPage from './pages/frontend/FavoritesPage'
import DesignServicePage from './pages/frontend/DesignServicePage'
import PackagesPage from './pages/frontend/PackagesPage'
import PackageDetailPage from './pages/frontend/PackageDetailPage'
import OrdersPage from './pages/frontend/OrdersPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import RoleSelectPage from '@/pages/auth/RoleSelectPage'
import UserProfilePage from './pages/frontend/UserProfilePage'
import BargainListPage from './pages/frontend/BargainListPage'
import BargainDetailPage from './pages/frontend/BargainDetailPage'

// 后台页面
import AdminLayout from './layouts/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import ProductManagement from './pages/admin/ProductManagement'
import ProductForm from './pages/admin/ProductForm'
import ProductDashboard from './pages/admin/ProductDashboard'
import OrderManagement from './pages/admin/OrderManagement'
import UserManagement from './pages/admin/UserManagement'
import ImageManagement from './pages/admin/ImageManagement'
import CategoryManagement from './pages/admin/CategoryManagement'
import MaterialManagement from './pages/admin/MaterialManagement'
import OrderAnalysis from './pages/admin/OrderAnalysis'
import RefundManagement from './pages/admin/RefundManagement'
import PackageManagementPage from './pages/admin/PackageManagementPage'
import PackageListPage from './pages/admin/PackageListPage';
import AdminBargainListPage from './pages/admin/AdminBargainListPage';
import AdminBargainFormPage from './pages/admin/AdminBargainFormPage';
import BargainDashboardPage from './pages/admin/BargainDashboardPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import DesignerProductEditPage from './pages/admin/DesignerProductEditPage';
import DesignerPackageEditPage from './pages/admin/DesignerPackageEditPage';
import PackageProfitPage from './pages/admin/PackageProfitPage';
import OrderDashboard from './pages/admin/OrderDashboard';
import DesignerOrdersPage from './pages/admin/DesignerOrdersPage';
import DesignerReferredOrdersPage from './pages/admin/DesignerReferredOrdersPage';
import TestConciergeOrderPage from './pages/admin/TestConciergeOrderPage';
import UserUnbanPage from './pages/admin/UserUnbanPage';
import NotificationTestPage from './pages/admin/NotificationTestPage';
import NotificationManagementPage from './pages/admin/NotificationManagementPage';
import DesignManagement from './pages/admin/DesignManagement';

// 前台布局
import FrontendLayout from './layouts/FrontendLayout'

// 路由守卫
interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  allowedRoles?: UserRole[]
  fallbackPath?: string
}

const ProtectedRoute = ({ children, requireAdmin = false, allowedRoles, fallbackPath = '/' }: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (requireAdmin && user?.role !== 'admin' && user?.role !== 'super_admin') {
    return <Navigate to={fallbackPath} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={fallbackPath} replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="top-right" richColors />
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
            <ProtectedRoute allowedRoles={[ 'admin', 'super_admin', 'designer' ]} fallbackPath="/admin/products">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={
              <ProtectedRoute requireAdmin fallbackPath="/admin/products">
                <Dashboard />
              </ProtectedRoute>
            } />
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
            <Route path="images" element={<ProtectedRoute requireAdmin fallbackPath="/admin/products"><ImageManagement /></ProtectedRoute>} />
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
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}

export default App

