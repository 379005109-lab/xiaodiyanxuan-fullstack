// Order status
const ORDER_STATUS = {
  PENDING_PAYMENT: 1,
  PENDING_SHIPMENT: 2,
  PENDING_RECEIPT: 3,
  COMPLETED: 4,
  CANCELLED: 5
}

const ORDER_STATUS_TEXT = {
  1: '待付',
  2: '待发货',
  3: '待收货',
  4: '已完成',
  5: '已取消'
}

// User types
const USER_TYPES = {
  CUSTOMER: 'customer',
  DESIGNER: 'designer',
  ADMIN: 'admin'
}

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
  PRODUCT_STATUS,
  COUPON_TYPES,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE
}
