
export interface Variant {
  id: string;
  name: string;
  image: string;
  price?: number;
  dimensions?: string;
}

export interface Product {
  id: string;
  name: string;
  subtitle?: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  images?: string[]; // Multiple images for slider
  description: string;
  features: string[];
  featuresList?: { icon: any; label: string }[]; // For the icon list in Product Detail
  specs: {
    label: string;
    value: string;
  }[];
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  colors?: string[];
  variants?: Variant[]; // Detailed variants with images
  isBargain?: boolean;
  bargainInfo?: {
    participants: number; // e.g., 12人助力
    minPrice: number;
    discount: number; // Amount saved
  };
  // For Package types
  packageItems?: {
    category: string; // "Sofa", "Bed"
    count: number;
    items: Product[]; // The products in this category
  }[];
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariant?: Variant;
  selectedColor?: string;
}

export enum ViewState {
  HOME = 'HOME',
  MALL = 'MALL', // 商城
  BARGAIN = 'BARGAIN', // 砍价
  PACKAGES = 'PACKAGES', // 套餐列表
  PACKAGE_DETAIL = 'PACKAGE_DETAIL', // 套餐详情 (Step Configurator)
  PROFILE = 'PROFILE', // 我的
  DETAIL = 'DETAIL',
  AI_CHAT = 'AI_CHAT',
  // New Profile Sub-views
  CART = 'CART',
  APPOINTMENTS = 'APPOINTMENTS',
  FAVORITES = 'FAVORITES',
  ORDERS = 'ORDERS',
  COUPONS = 'COUPONS'
}

export interface Category {
  id: string;
  name: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}
