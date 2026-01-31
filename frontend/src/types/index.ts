// 用户类型
export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'platform_admin'
  | 'platform_staff'
  | 'enterprise_admin'
  | 'enterprise_staff'
  | 'designer'
  | 'special_guest'
  | 'distributor'
  | 'customer'
  | 'owner'
  | 'professional'
  | 'user'

export interface User {
  _id: string
  username: string
  email?: string
  phone?: string
  nickname?: string
  gender?: 'male' | 'female' | ''
  profileCompleted?: boolean
  role: UserRole
  manufacturerId?: string | null
  manufacturerIds?: string[]
  accountType?: 'auth' | 'sub' | 'designer' | 'normal'
  permissions?: {
    canAccessAdmin?: boolean
    canViewCostPrice?: boolean
    canDownloadMaterial?: boolean
    canManageUsers?: boolean
    canManageProducts?: boolean
    canManageOrders?: boolean
    canViewReports?: boolean
  }
  avatar?: string
  createdAt?: string
  updatedAt?: string
  status?: 'active' | 'inactive' | 'banned' | 'expired'
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
  isCategory?: boolean  // 是否为类别（true=类别，false=SKU）
  status: MaterialStatus
  uploadBy: string
  reviewBy?: string
  reviewAt?: string
  reviewNote?: string
  order?: number  // 排序字段
  createdAt: string
  updatedAt: string
}

// 动态材质选择结构：key为材质类目名称（如面料、填充等），value为该类目下选中的材质名称数组
export type DynamicMaterialSelection = Record<string, string[]>

// 旧版固定材质结构（向后兼容）
export interface LegacyMaterialSelection {
  fabric?: string[] | string
  filling?: string[] | string
  frame?: string[] | string
  leg?: string[] | string
}

export interface ProductSKU {
  _id: string
  color?: string
  // 材质支持动态类目：key为类目名称，value为材质名称数组
  material: string | DynamicMaterialSelection | LegacyMaterialSelection
  // 已配置的材质类目列表（用于确定显示顺序和哪些类目已启用）
  materialCategories?: string[]
  materialId?: string
  materialUpgradePrices?: Record<string, number> // 材质升级价格 { [categoryKey]: price } 例如 { "普通皮": 0, "全青皮": 500 }
  materialImages?: Record<string, string>
  materialDescriptions?: Record<string, string>
  // 面料材质配置
  fabricMaterialId?: string
  fabricName?: string
  fabricImage?: string
  materialDescriptionId?: string
  stock: number
  price: number
  costPrice?: number
  discountPrice?: number
  images: string[]
  code?: string
  spec?: string
  specRemark?: string
  length?: number
  width?: number
  height?: number
  isPro?: boolean
  proFeature?: string
  status?: boolean
  sales?: number
  manufacturerId?: string | null
  manufacturerName?: string | null
}

export interface ProductFile {
  name?: string
  url?: string
  format?: string
  size?: number
  uploadTime?: string
}

export interface TierPricing {
  source?: string
  authorizationId?: string
  roleModuleId?: any
  roleModuleCode?: string
  roleModuleName?: string
  discountRuleId?: any
  discountRuleName?: string
  discountType?: 'rate' | 'minPrice' | string
  discountRate?: number
  minDiscountPrice?: number
  overrideDiscountRate?: number
  retailPrice?: number
  discountedPrice?: number
  commissionRate?: number
  commissionAmount?: number
  netCostPrice?: number
}

export interface Product {
  _id: string
  productCode?: string
  name: string
  description: string
  category: ProductCategory
  style: ProductStyle
  styles?: string[]  // 多个风格标签（现代风、轻奢风等）
  basePrice: number
  takePrice?: number
  labelPrice1?: number
  tierPricing?: TierPricing
  thumbnail?: string
  images: string[]
  skus: ProductSKU[]
  isCombo: boolean
  comboItems?: string[]
  tags: string[]
  specifications: Record<string, string>
  status: 'active' | 'inactive' | 'out_of_stock' | 'deleted'
  views: number
  sales: number
  rating: number
  reviews: number
  order?: number  // 排序字段
  createdAt: string
  updatedAt: string
  videos?: string[]
  files?: ProductFile[]
  manufacturerId?: string  // 厂家ID
  manufacturerName?: string  // 厂家名称
  materialDescriptionOptions?: Array<{ id: string; text: string }>
}

// 套餐相关类型
// 套餐商品材质：支持动态材质类目
export type PackageProductMaterial = Record<string, string[]>

export interface PackageProductOption {
  id: string
  name: string
  category?: string
  basePrice: number
  packagePrice?: number
  price?: number  // 为了兼容旧代码
  image: string
  images?: string[]
  specs?: string
  description?: string
  materials?: PackageProductMaterial
  materialImages?: Record<string, string>
  // 完整的SKU数据
  skus?: ProductSKU[]
  specifications?: any
  videos?: any[]
  stock?: number
  sales?: number
  status?: string
  isDeleted?: boolean  // 商品是否已从商品库删除
  // 套餐订单相关字段
  quantity?: number  // 选择的数量
  materialUpgrade?: number  // 材质升级费用
  productId?: string  // 兼容字段
  productName?: string  // 兼容字段
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
// 用户选中的材质：key为类目名称，value为选中的材质名称
export type SelectedMaterials = Record<string, string>

export interface CartItem {
  product: Product
  sku: ProductSKU
  quantity: number
  price: number
  // 选中的材质：支持动态类目
  selectedMaterials?: SelectedMaterials
  materialUpgradePrices?: Record<string, number> // 材质升级价格表
}

// 订单类型
export type OrderStatus = 'pending' | 'processing' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'refunding' | 'refunded' | 'exchanging'

export type InvoiceStatus = 'pending' | 'processing' | 'issued' | 'sent'

export interface InvoiceInfo {
  invoiceType?: 'personal' | 'company'
  title?: string
  taxNumber?: string
  bankName?: string
  bankAccount?: string
  companyAddress?: string
  companyPhone?: string
  email?: string
  phone?: string
  mailingAddress?: string
}

export interface OrderItem {
  product: Product | string
  productName?: string
  productImage?: string
  image?: string
  productId?: string
  sku: {
    color?: string
    material?: string
  }
  specifications?: {
    size?: string
    dimensions?: string
    material?: string
    color?: string
    fill?: string
    frame?: string
    leg?: string
  }
  skuDimensions?: {
    length?: number
    width?: number
    height?: number
  }
  selectedMaterials?: SelectedMaterials
  materialUpgradePrices?: Record<string, number>
  materialSnapshots?: Array<{
    categoryKey?: string
    name?: string
    image?: string
    description?: string
  }>
  quantity: number
  price: number
}

export interface Order {
  _id: string
  orderNo: string
  user: User | string
  userId?: string
  items: OrderItem[]
  totalAmount: number
  subtotal?: number
  discountAmount?: number
  status: OrderStatus | number
  // 开票信息
  needInvoice?: boolean
  invoiceInfo?: InvoiceInfo
  invoiceMarkupPercent?: number
  invoiceMarkupAmount?: number
  invoiceStatus?: InvoiceStatus
  invoiceIssuedAt?: string
  // 结算模式/分期/返佣
  settlementMode?: 'supplier_transfer' | 'commission_mode' | null
  originalPrice?: number
  minDiscountRate?: number
  commissionRate?: number
  minDiscountPrice?: number
  commissionAmount?: number
  supplierPrice?: number
  commissionStatus?: 'pending' | 'applied' | 'approved' | 'paid' | null
  paymentRatioEnabled?: boolean
  paymentRatio?: number
  firstPaymentAmount?: number
  remainingPaymentAmount?: number
  remainingPaymentStatus?: 'pending' | 'paid' | null
  remainingPaymentRemindedAt?: string
  depositAmount?: number
  depositPaidAt?: string
  depositVerified?: boolean
  depositVerifiedAt?: string
  finalPaymentAmount?: number
  finalPaymentRequested?: boolean
  finalPaymentRequestedAt?: string
  finalPaymentPaidAt?: string
  finalPaymentVerified?: boolean
  finalPaymentVerifiedAt?: string
  // 收货人信息（新格式）
  recipient?: {
    name: string
    phone: string
    address: string
  }
  // 收货地址（旧格式）
  shippingAddress?: {
    name: string
    phone: string
    address?: string
    province?: string
    city?: string
    district?: string
    detail?: string
  }
  // 套餐订单相关
  orderType?: 'normal' | 'package'
  packageInfo?: {
    packageId: string
    packageName: string
    packagePrice: number
    selections?: Array<{
      categoryKey: string
      categoryName: string
      required: number
      products: Array<{
        productId: string
        productName: string
        quantity: number
        materials?: Record<string, string>
        materialUpgrade?: number
        image?: string
      }>
    }>
  }
  paymentMethod?: 'alipay' | 'wechat' | 'card'
  paidAt?: string
  shippedAt?: string
  completedAt?: string
  notes?: string
  trackingNumber?: string
  createdAt: string
  updatedAt: string
  flatPriceAmount?: number
  isFlatPrice?: boolean
  cancelRequest?: boolean
  cancelRequestedAt?: string
}

// 退换货类型
export interface Refund {
  _id: string
  order: Order | string
  orderId?: string  // 订单ID（冗余字段，兼容用）
  user: User | string
  type: 'return' | 'exchange'  // 退货或换货
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
  manufacturerId?: string | { _id: string; name?: string } | null
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

