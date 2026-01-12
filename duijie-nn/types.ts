
export enum AuthMode {
  CATEGORY = 'CATEGORY',
  SPECIFIC_PRODUCT = 'SPECIFIC_PRODUCT'
}

export enum ProductOrigin {
  SELF = 'SELF',
  AUTHORIZED = 'AUTHORIZED'
}

export interface SKU {
  id: string;
  code: string;
  name: string;
  listPrice: number;
  discountPrice: number;
  commission: number;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
  count: number;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  priceRange: string;
  minPrice: number;
  rebatePrice: number;
  category: string;
  image: string;
  origin: ProductOrigin; 
  isPreviouslyAuthorized?: boolean;
  skus: SKU[];
  isXiaoDiYanXuan?: boolean;
}

export interface CategoryOverride {
  categoryId: string;
  distribution: number;
  minDiscount: number;
}

export interface ProductOverride {
  productId: string;
  distribution: number;
  minDiscount: number;
}

// 账号组织树节点
export interface AccountTreeNode {
  id: string;
  name: string;
  type: 'org' | 'account';
  role?: string;
  children?: AccountTreeNode[];
}

export interface OrgAccount {
  id: string;
  name: string;
  phone: string;
  role: string; 
  avatar?: string;
}

export interface RoleConfig {
  id: string;
  name: string;
  minDiscount: number;
  commissionRatio: number;
  status: 'active' | 'inactive';
}

export interface ReconciliationRecord {
  id: string;
  orderNo: string;
  orgName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  voucherImage?: string;
  designerName: string;
  details?: string;
}

export enum DistributionMode {
  STRICT = 'STRICT',
  FLEXIBLE = 'FLEXIBLE'
}

export interface HierarchyNode {
  id: string;
  name: string;
  phone: string;
  role: string;
  distribution: number;
  minDiscount: number; 
  authorized: number;
  productCount: number;
  status: 'normal' | 'disabled';
  isExpanded: boolean;
  mode?: DistributionMode;
  isSelfCreated?: boolean;
  linkedAccounts?: OrgAccount[]; // 扁平化存储选中的账号ID
  selectedProductIds: string[]; 
  categoryOverrides?: CategoryOverride[]; 
  productOverrides?: ProductOverride[]; 
  children: HierarchyNode[];
}

export interface AdminAccount {
  id: string;
  username: string;
  type: 'normal' | 'sub' | 'designer';
  status: 'normal' | 'frozen';
  expiry: string;
  lastActive: string;
  authorizedProductsCount: number;
  income: number;
  isSelfCreated: boolean;
  parentId?: string;
}

export interface PaymentAccount {
  id: string;
  type: 'bank' | 'wechat' | 'alipay';
  bankName: string;
  name: string;
  accountNumber: string;
}

export interface Manufacturer {
  id: string;
  name: string;
  code: string;
  logo: string;
  description: string;
  productIntro: string;
  contact: string;
  phone: string;
  address: string;
  styleTags: string[];
  defaultDiscount: number;
  defaultCommission: number;
  status: 'enabled' | 'disabled';
  fullName?: string;
  isPreferred?: boolean;
  expiryDate?: string;
  masterAccount?: string;
  quotas?: {
    authAccounts: { current: number; max: number };
    subAccounts: { current: number; max: number };
    designers: { current: number; max: number };
  };
  businessLicense?: string;
  paymentAccounts?: PaymentAccount[];
}

export interface PackageItem {
  productId: string;
  quantity: number;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  mainImage: string;
  detailImages: string[];
  tags: string[];
  status: 'on_shelf' | 'off_shelf';
  items: PackageItem[];
  itemCount: number;
  profit: number;
}

export interface BargainProduct {
  id: string;
  name: string;
  code: string;
  image: string;
  originalPrice: number;
  targetPrice: number;
  styleTags: string[];
  minPerBargain: number;
  maxPerBargain: number;
  maxHelpers: number;
  weight: number;
  status: 'active' | 'inactive';
  initiateCount: number;
  successCount: number;
}

export interface PartnerInfo {
  id: string;
  name: string;
  type: 'merchant' | 'designer';
  authDate: string;
  productCount: number;
  salesVolume: number;
  status: 'active' | 'inactive';
  avatar: string;
}

export interface FactoryStats {
  totalSales: number;
  activeMerchants: number;
  activeDesigners: number;
  productCount: number;
  monthlyGrowth: number;
}

export type AppView = 'designer-dashboard' | 'designer-auth' | 'admin-manufacturers' | 'admin-hierarchy' | 'admin-products' | 'factory-portal' | 'factory-manage-products' | 'package-management' | 'bargain-management' | 'factory-inventory';
