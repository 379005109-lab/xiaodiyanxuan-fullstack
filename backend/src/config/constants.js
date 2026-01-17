// Order status
const ORDER_STATUS = {
  PENDING_CONFIRMATION: 0,  // 待厂家确认
  PENDING_PAYMENT: 1,       // 待付款（全款或定金）
  PENDING_PAYMENT_VERIFY: 9, // 待确认收款（客户已付款/定金，厂家待核销）
  PENDING_SHIPMENT: 2,      // 待发货
  PENDING_RECEIPT: 3,       // 待收货
  COMPLETED: 4,             // 已完成
  CANCELLED: 5,             // 已取消
  REFUNDING: 6,             // 退款中
  REFUNDED: 7,              // 已退款
  EXCHANGING: 8,            // 换货中
  
  // 分期付款状态
  DEPOSIT_PAID: 10,         // 定金已付（待核销定金）
  IN_PRODUCTION: 11,        // 生产中（定金已核销，等待生产完成）
  AWAITING_FINAL_PAYMENT: 12, // 待付尾款（厂家已发起尾款请求）
  FINAL_PAYMENT_PAID: 13    // 尾款已付（待核销尾款）
}

const ORDER_STATUS_TEXT = {
  0: '待确认',
  1: '待付款',
  2: '待发货',
  3: '待收货',
  4: '已完成',
  5: '已取消',
  6: '退款中',
  7: '已退款',
  8: '换货中',
  9: '待确认收款',
  10: '定金已付',
  11: '生产中',
  12: '待付尾款',
  13: '尾款已付'
}

// User types
const USER_TYPES = {
  CUSTOMER: 'customer',
  DESIGNER: 'designer',
  ADMIN: 'admin'
}

// User roles (账号角色)
const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',           // 超级管理员
  PLATFORM_ADMIN: 'platform_admin',     // 平台管理员
  PLATFORM_STAFF: 'platform_staff',     // 平台子账号
  ENTERPRISE_ADMIN: 'enterprise_admin', // 企业管理员
  ENTERPRISE_STAFF: 'enterprise_staff', // 企业子账号
  DESIGNER: 'designer',                 // 设计师
  SPECIAL_GUEST: 'special_guest',       // 特殊账号（一次性）
  CUSTOMER: 'customer',                 // 普通客户
}

// Organization types (组织类型)
const ORGANIZATION_TYPES = {
  PLATFORM: 'platform',     // 供应链平台
  ENTERPRISE: 'enterprise', // 企业
}

// 默认设计师折扣
const DEFAULT_DESIGNER_DISCOUNT = 0.45  // 4.5折

// Product status
const PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DELETED: 'deleted'
}

// Coupon types
const COUPON_TYPES = {
  FIXED: 'fixed',
  PERCENTAGE: 'percentage'
}

// Pagination defaults
const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 100

module.exports = {
  ORDER_STATUS,
  ORDER_STATUS_TEXT,
  USER_TYPES,
  USER_ROLES,
  ORGANIZATION_TYPES,
  DEFAULT_DESIGNER_DISCOUNT,
  PRODUCT_STATUS,
  COUPON_TYPES,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE
}
