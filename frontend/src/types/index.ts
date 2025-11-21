// 用户类型
export type UserRole = 'super_admin' | 'admin' | 'designer' | 'distributor' | 'customer' | 'owner' | 'professional'

export interface User {
  _id: string
  username: string
  email: string
  phone?: string
  role: UserRole
  avatar?: string
  createdAt: string
  updatedAt: string
  status: 'active' | 'inactive' | 'banned'
  balance?: number
  calculatedRole?: string
  tags?: string[]
  metrics?: {
    orderCount?: number
    gmv?: number
    shareRate?: number
    lastOrderDays?: number
  }
}

// 商品类型
export type ProductStyle = 'vintage' | 'modern' | 'cream' | 'minimalist' | 'industrial' | 'scandinavian'
export type ProductCategory = 'sofa' | 'bed' | 'dining' | 'storage' | 'desk' | 'chair' | 'decoration'

// 素材分类
export interface MaterialCategory {
  _id: string
  name: string
  parentId?: string | null
  icon?: string
  order: number
  children?: MaterialCategory[]
  createdAt: string
  updatedAt: string
}

export type CustomerOrderSource = 'self' | 'backend'

export interface CustomerOrderItem {
  id: string
  name: string
  type: 'package' | 'product' | 'custom'
  image?: string
  quantity: number
  price: number
  selections?: Record<string, string>
}

export interface PackageSelectionItem {
  productId: string
  productName: string
  quantity: number
  materials?: Record<string, string>
  materialUpgrade?: number
}

export interface PackageSelectionGroup {
  categoryKey: string
  categoryName: string
  required: number
  items: PackageSelectionItem[]
}

export interface CustomerOrder {
  id: string
  orderNo: string
  title: string
  status: OrderStatus
  source: CustomerOrderSource
  createdAt: string
  updatedAt: string
  totalAmount: number
  items: CustomerOrderItem[]
  note?: string
  address?: string
  phone?: string
  contactName?: string
  packageId?: string
  packageName?: string
  packageSelections?: PackageSelectionGroup[]
  conciergePhone?: string
  conciergePushedAt?: string
}

// 素材类型
export type MaterialType = 'image' | 'texture' | 'model'
export type MaterialStatus = 'pending' | 'approved' | 'rejected' | 'offline'

// 素材
export interface Material {
  _id: string
  name: string
  type: MaterialType
  image: string
  categoryId: string
  categoryName?: string
  tags: string[]
  properties: {
    [key: string]: string  // 如：材质、工艺、纹理等
  }
  description?: string  // 材质介绍
  price?: number
  isPro?: boolean  // 是否为 PRO 材质
  status: MaterialStatus
  uploadBy: string
  reviewBy?: string
  reviewAt?: string
  reviewNote?: string
  order?: number  // 排序字段
  createdAt: string
  updatedAt: string
}

export interface ProductSKU {
  _id: string
  color?: string
  material: string | { fabric: string[] | string; filling: string[] | string; frame: string[] | string; leg: string[] | string }
  materialId?: string
  materialUpgradePrices?: Record<string, number> // 材质升级价格 { [categoryKey]: price } 例如 { "普通皮": 0, "全青皮": 500 }
  materialImages?: Record<string, string>
  materialDescriptions?: Record<string, string>
  stock: number
  price: number
  discountPrice?: number
  images: string[]
  code?: string
  spec?: string
  length?: number
  width?: number
  height?: number
  isPro?: boolean
  proFeature?: string
  status?: boolean
  sales?: number
}

export interface ProductFile {
  name?: string
  url?: string
  format?: string
  size?: number
}

export interface Product {
  _id: string
  productCode?: string
  name: string
  description: string
  category: ProductCategory
  style: ProductStyle
  basePrice: number
  images: string[]
  skus: ProductSKU[]
  isCombo: boolean
  comboItems?: string[]
  tags: string[]
  specifications: Record<string, string>
  status: 'active' | 'inactive' | 'out_of_stock'
  views: number
  sales: number
  rating: number
  reviews: number
  order?: number  // 排序字段
  createdAt: string
  updatedAt: string
  videos?: string[]
  files?: ProductFile[]
}

// 套餐相关类型
export interface PackageProductMaterial {
  fabric?: string[]
  filling?: string[]
  frame?: string[]
  leg?: string[]
}

export interface PackageProductOption {
  id: string
  name: string
  price: number
  image: string
  specs?: string
  description?: string
  materials?: PackageProductMaterial
  materialImages?: Record<string, string>
}

export interface PackageCategoryOption {
  key: string
  name: string
  required: number
  products: PackageProductOption[]
}

export interface PackagePlan {
  id: string
  name: string
  price: number
  banner: string
  gallery: string[]
  tags: string[]
  description?: string
  categories: PackageCategoryOption[]
  status?: 'active' | 'inactive'
}

// 购物车类型
export interface CartItem {
  product: Product
  sku: ProductSKU
  quantity: number
  price: number  // 保存添加时的最终价格（包括材质升级价格）
  selectedMaterials?: {  // 保存材质选择信息
    fabric?: string
    filling?: string
    frame?: string
    leg?: string
  }
}

// 订单类型
export type OrderStatus = 'pending' | 'processing' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'refunding' | 'refunded'

export interface OrderItem {
  product: Product | string
  productName?: string
  productImage?: string
  sku: {
    color?: string
    material?: string
  }
  quantity: number
  price: number
}

export interface Order {
  _id: string
  orderNo: string
  user: User | string
  items: OrderItem[]
  totalAmount: number
  status: OrderStatus
  shippingAddress: {
    name: string
    phone: string
    address?: string  // 新格式：直接填写地址
    // 旧格式：保留以支持向后兼容
    province?: string
    city?: string
    district?: string
    detail?: string
  }
  paymentMethod: 'alipay' | 'wechat' | 'card'
  paidAt?: string
  shippedAt?: string
  completedAt?: string
  notes?: string
  trackingNumber?: string
  createdAt: string
  updatedAt: string
  flatPriceAmount?: number
  isFlatPrice?: boolean
}

// 退换货类型
export interface Refund {
  _id: string
  order: Order | string
  user: User | string
  reason: string
  description: string
  images: string[]
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  processedBy?: User | string
  processedAt?: string
  rejectReason?: string
  createdAt: string
  updatedAt: string
}

// 图片类型
export type ImageType = 'banner' | 'style' | 'series' | 'featured' | 'product'

export interface Image {
  _id: string
  url: string
  type: ImageType
  title?: string
  description?: string
  link?: string
  status: 'active' | 'inactive'
  usageCount: number
  order: number
  createdAt: string
  updatedAt: string
}

// 分类类型
export interface CategoryDiscount {
  role: UserRole // 角色类型
  roleName: string // 角色显示名称
  discount: number // 折扣百分比，如 70 表示7折
}

export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
  parentId?: string | null
  status: 'active' | 'inactive'
  order: number
  level: number // 层级：1为顶级，2为二级
  productCount: number
  hasDiscount: boolean // 是否设置了折扣
  discounts: CategoryDiscount[] // 角色折扣列表
  children?: Category[] // 子分类
  createdAt: string
  updatedAt: string
}

// 设计需求类型
export interface DesignRequest {
  _id: string
  user: User | string
  roomType: string
  style: ProductStyle
  selectedProducts: string[]
  budget: number
  requirements: string
  contactInfo: {
    name: string
    phone: string
    address: string
  }
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  designImages?: string[]
  designer?: User | string
  completedAt?: string
  createdAt: string
  updatedAt: string
}


// 认证相关类型
export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  phone?: string;
  shareToken?: string; // For referral system
  role?: UserRole; // 用户身份：业主、设计师、从业者
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
  };
  errors?: any[];
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 分页类型
export interface PaginationParams {
  page: number
  limit: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

