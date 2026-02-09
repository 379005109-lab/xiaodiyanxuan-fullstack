import { lazy } from 'react';
import { RouteObject, Navigate } from 'react-router-dom';

// Router configuration - Updated
const HomePage = lazy(() => import('../pages/home/page'));
const CategoryPage = lazy(() => import('../pages/products/category/page'));
const ProductListPage = lazy(() => import('../pages/products/list/page'));
const ProductDetailPage = lazy(() => import('../pages/products/detail/page'));
const ProductMediaPage = lazy(() => import('../pages/products/media/page'));
const MediaViewerPage = lazy(() => import('../pages/products/media-viewer/page'));
const AIPage = lazy(() => import('../pages/ai/page'));
const GenerateScenePage = lazy(() => import('../pages/ai/generate-scene/page'));
const WhiteBgPage = lazy(() => import('../pages/ai/white-bg/page'));
const FurnitureReplacePage = lazy(() => import('../pages/ai/furniture-replace/page'));
const SoftDecorationPage = lazy(() => import('../pages/ai/soft-decoration/page'));
const PackagesPage = lazy(() => import('../pages/packages/page'));
const PackageDetailPage = lazy(() => import('../pages/packages/detail/page'));
// Force reload package config page
const PackageConfigPage = lazy(() => import('../pages/packages/config/page').then(module => ({ default: module.default })));
const MyPackagesPage = lazy(() => import('../pages/packages/my/page'));
const CartPage = lazy(() => import('../pages/cart/page'));
const CartCheckoutPage = lazy(() => import('../pages/cart/checkout/page'));
const CartCheckoutAddressSelectPage = lazy(() => import('../pages/cart/checkout/address-select/page'));
const CartCheckoutAddressEditPage = lazy(() => import('../pages/cart/checkout/address-edit/page'));
const CartCheckoutResultPage = lazy(() => import('../pages/cart/checkout/result/page'));
const NotFoundPage = lazy(() => import('../pages/NotFound'));
const OrderListPage = lazy(() => import('../pages/orders/list/page'));
const OrderDetailPage = lazy(() => import('../pages/orders/detail/page'));
// 强制重新加载 ProfilePage
const ProfilePage = lazy(() => import('../pages/profile/page').then(module => ({ default: module.default })));
const AddressPage = lazy(() => import('../pages/profile/address/page'));
const ProfileAddressEditPage = lazy(() => import('../pages/profile/address/edit/page')); // renamed to avoid duplicate
const InvoicePage = lazy(() => import('../pages/profile/invoice/page'));
const InvoiceEditPage = lazy(() => import('../pages/profile/invoice/edit/page'));
const PrivacyPage = lazy(() => import('../pages/profile/privacy/page'));
const PointsPage = lazy(() => import('../pages/profile/points/page'));
const ProfileEditPageLazy = lazy(() => import('../pages/profile/edit/page'));
const AvatarPage = lazy(() => import('../pages/profile/avatar/page'));
const SettingsPage = lazy(() => import('../pages/profile/settings/page'));

const Home = lazy(() => import('../pages/home/page'));
const AI = lazy(() => import('../pages/ai/page'));
const AIGenerateScene = lazy(() => import('../pages/ai/generate-scene/page'));
const AIWhiteBg = lazy(() => import('../pages/ai/white-bg/page'));
const AIFurnitureReplace = lazy(() => import('../pages/ai/furniture-replace/page'));
const AIProductReplace = lazy(() => import('../pages/ai/product-replace/page'));
const AISoftDecoration = lazy(() => import('../pages/ai/soft-decoration/page'));
const AITextureReplace = lazy(() => import('../pages/ai/texture-replace/page'));
const AIPublicScene = lazy(() => import('../pages/ai/public-scene/page'));

import ProfilePointsPage from "../pages/profile/points/page";
import ProfilePrivacyPage from "../pages/profile/privacy/page";
import ProfileCouponsPage from "../pages/profile/coupons/page";

const SearchPage = lazy(() => import('../pages/search/page'));
const CustomPage = lazy(() => import('../pages/custom/page'));
const AccompanyServicePage = lazy(() => import('../pages/accompany-service/page'));
const BargainListPage = lazy(() => import('../pages/bargain/list/page'));
const BargainDetailPage = lazy(() => import('../pages/bargain/detail/page'));
const BargainHelpPage = lazy(() => import('../pages/bargain/help/page'));
const BargainMyPage = lazy(() => import('../pages/bargain/my/page'));

const OrdersDetailPage = lazy(() => import('../pages/orders/detail/page'));
const OrdersListPage = lazy(() => import('../pages/orders/list/page'));
const ConfirmOrderPage = lazy(() => import('../pages/orders/confirm/page'));
const AddressSelectPage = lazy(() => import('../pages/orders/address-select/page'));
const OrderAddressEditPage = lazy(() => import('../pages/orders/address-edit/page')); // renamed to avoid duplicate
const CouponSelectPage = lazy(() => import('../pages/orders/coupon-select/page'));

const SpaceCategoryPage = lazy(() => import('../pages/space-category/page'));
const CategoryListPage = lazy(() => import('../pages/products/category-list/page'));
const ShopInfoPage = lazy(() => import('../pages/shop/info/page'));
// 强制重新加载店铺海报页面
const ShopPosterPage = lazy(() => import('../pages/shop/poster/page').then(module => ({ default: module.default })));

const LoginPage = lazy(() => import('../pages/login/page'));

const routes: RouteObject[] = [
  {
    path: '/',
    Component: Home
  },
  {
    path: '/login',
    Component: LoginPage
  },
  {
    path: '/products',
    element: <Navigate to="/products/category" replace />
  },
  {
    path: '/products/category',
    Component: CategoryPage
  },
  {
    path: '/products/list',
    Component: ProductListPage
  },
  {
    path: '/products/detail/:id',
    Component: ProductDetailPage
  },
  {
    path: '/products/media/:id',
    Component: ProductMediaPage
  },
  {
    path: '/products/media/:id/viewer',
    Component: MediaViewerPage
  },
  {
    path: '/products/category-list',
    Component: CategoryListPage
  },
  {
    path: '/space-category',
    Component: SpaceCategoryPage
  },
  {
    path: '/shop/info',
    Component: ShopInfoPage
  },
  {
    path: '/shop/poster',
    Component: ShopPosterPage
  },
  {
    path: '/ai',
    Component: AI
  },
  {
    path: '/ai/generate-scene',
    Component: AIGenerateScene
  },
  {
    path: '/ai/white-bg',
    Component: AIWhiteBg
  },
  {
    path: '/ai/furniture-replace',
    Component: AIFurnitureReplace
  },
  {
    path: '/ai/product-replace',
    Component: AIProductReplace
  },
  {
    path: '/ai/soft-decoration',
    Component: AISoftDecoration
  },
  {
    path: '/ai/texture-replace',
    Component: AITextureReplace
  },
  {
    path: '/ai/public-scene',
    Component: AIPublicScene
  },
  {
    path: '/packages',
    Component: PackagesPage
  },
  {
    path: '/packages/detail/:id',
    Component: PackageDetailPage
  },
  {
    path: '/packages/config/:id',
    Component: PackageConfigPage
  },
  {
    path: '/packages/my',
    Component: MyPackagesPage
  },
  {
    path: '/cart',
    Component: CartPage
  },
  {
    path: '/cart/checkout',
    Component: CartCheckoutPage
  },
  {
    path: '/cart/checkout/address-select',
    Component: CartCheckoutAddressSelectPage
  },
  {
    path: '/cart/checkout/address-edit',
    Component: CartCheckoutAddressEditPage
  },
  {
    path: '/cart/checkout/result',
    Component: CartCheckoutResultPage
  },
  {
    path: '/orders',
    element: <Navigate to="/orders/list" replace />
  },
  {
    path: '/orders/list',
    Component: OrderListPage
  },
  {
    path: '/orders/detail/:id',
    Component: OrderDetailPage
  },
  {
    path: '/orders/confirm',
    Component: ConfirmOrderPage
  },
  {
    path: '/orders/address-select',
    Component: AddressSelectPage
  },
  {
    path: '/orders/address-edit',
    Component: OrderAddressEditPage
  },
  {
    path: '/orders/coupon-select',
    Component: CouponSelectPage
  },
  {
    path: '/profile',
    Component: ProfilePage
  },
  {
    path: '/profile/edit',
    Component: ProfileEditPageLazy
  },
  {
    path: '/profile/avatar',
    Component: AvatarPage
  },
  {
    path: '/profile/settings',
    Component: SettingsPage
  },
  {
    path: '/profile/orders',
    element: <Navigate to="/orders/list" replace />
  },
  {
    path: '/profile/address',
    Component: AddressPage
  },
  {
    path: '/profile/address/add',
    Component: ProfileAddressEditPage
  },
  {
    path: '/profile/address/edit/:id',
    Component: ProfileAddressEditPage
  },
  {
    path: '/profile/invoice',
    Component: InvoicePage
  },
  {
    path: '/profile/invoice/add',
    Component: InvoiceEditPage
  },
  {
    path: '/profile/invoice/edit/:id',
    Component: InvoiceEditPage
  },
  {
    path: '/profile/privacy',
    Component: ProfilePrivacyPage
  },
  {
    path: '/profile/coupons',
    Component: ProfileCouponsPage
  },
  {
    path: '/profile/points',
    Component: PointsPage
  },
  {
    path: '/search',
    Component: SearchPage
  },
  {
    path: '/custom',
    Component: CustomPage
  },
  {
    path: '/accompany-service',
    Component: AccompanyServicePage
  },
  {
    path: '/bargain/list',
    Component: BargainListPage
  },
  {
    path: '/bargain/detail/:id',
    Component: BargainDetailPage
  },
  {
    path: '/bargain/help/:activityId',
    Component: BargainHelpPage
  },
  {
    path: '/bargain/my',
    Component: BargainMyPage
  },
  {
    path: '*',
    Component: NotFoundPage
  }
];

export default routes;
