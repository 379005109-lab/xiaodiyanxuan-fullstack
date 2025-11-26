
export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: StyleCategory;
  specsCount: number;
  isNew?: boolean;
  // B2B Fields
  modelNo?: string;
  moq?: number;
  stockStatus?: 'in_stock' | 'made_to_order';
  leadTime?: string;
  dimensions?: string; // Added for Quick View
}

export interface ProductSpec {
    id: string;
    name: string;
    price: number;
    originalPrice: number;
    dimensions: string;
}

export interface ProductMaterial {
    id: string;
    name: string;
    group: string;
    type: string;
    thumbnail: string;
    priceModifier?: number;
    isHot?: boolean;
    description?: string;
    detailImage?: string;
}

export interface ProductDetail extends Product {
    description?: string;
    images: string[];
    specs: ProductSpec[];
    materials: ProductMaterial[];
}

export enum StyleCategory {
  ALL = '全部风格',
  MODERN = '现代简约',
  VINTAGE = '复古风',
  LUXURY = '轻奢风',
  MINIMALIST = '极简主义',
}

export interface FilterState {
  category: StyleCategory;
  minPrice: number;
  maxPrice: number;
  sortBy: 'newest' | 'price-asc' | 'price-desc';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export type Page = 'home' | 'shop' | 'collections' | 'design' | 'product-detail' | 'orders' | 'cart' | 'collection-detail' | 'comparison' | 'order-success' | 'wishlist' | 'admin';
export type Language = 'zh' | 'en';

export type OrderStatus = 'pending_payment' | 'paid' | 'shipped' | 'completed' | 'cancelled';

export interface OrderItem {
    productId: string;
    productName: string;
    imageUrl: string;
    quantity: number;
    price: number;
    specName: string;
    material?: string;
    dimensions?: string;
}

export interface CartItem {
    id: string;
    productId: string;
    name: string;
    price: number;
    image: string;
    spec: string;
    material: string;
    quantity: number;
    selected: boolean;
}

export interface OrderLog {
    id: string;
    action: string;
    operator: string;
    timestamp: string;
    type: 'status_change' | 'sensitive_view' | 'export' | 'system';
}

export interface OrderNote {
    id: string;
    content: string;
    author: string;
    timestamp: string;
    time?: string;
}

export interface LogisticsInfo {
    company: string;
    trackingNo: string;
    shippedAt: string;
}

export interface Order {
    id: string;
    status: OrderStatus;
    createdAt: string;
    totalAmount: number;
    items: OrderItem[];
    customer: {
        name: string;
        phone: string;
        address: string;
    };
    note?: string; 
    logistics?: LogisticsInfo;
    logs: OrderLog[];
    internalNotes: OrderNote[];
}

// Collection Configurator Types
export interface CollectionOption {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    specs: string[]; 
    materials: string[]; 
}

export interface CollectionSlot {
    id: string;
    name: string;
    requiredQuantity: number;
    options: CollectionOption[];
}

export interface CollectionConfig {
    id: string;
    name: string;
    basePrice: number;
    description: string;
    heroImage: string;
    slots: CollectionSlot[];
}

export interface AdminUser {
    id: number;
    name: string;
    email: string;
    role: string;
    phone: string;
    balance: number;
    status: string;
    lastLogin: string;
}

export interface DesignRequest {
    id: string;
    userName: string;
    userPhone: string;
    description: string;
    status: string;
    submittedAt: string;
}

export interface Category {
    id: string;
    name: string;
    level: number;
    productCount: number;
    updatedAt: string;
}

export interface MaterialAsset {
    id: number;
    name: string;
    category: string;
    subCategory: string;
    colors: number;
    stock: number;
    status: string;
    image: string;
}
