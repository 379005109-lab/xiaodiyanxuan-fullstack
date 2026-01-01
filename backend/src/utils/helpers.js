const crypto = require('crypto')

// Generate unique order number
const generateOrderNo = () => {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2, 8)
  return `ORD${timestamp}${random}`.toUpperCase()
}

// Generate unique coupon code
const generateCouponCode = () => {
  return crypto.randomBytes(6).toString('hex').toUpperCase()
}

// Calculate pagination
const calculatePagination = (page = 1, pageSize = 100) => {
  const pageNum = Math.max(1, parseInt(page) || 1)
  const size = Math.max(1, Math.min(50000, parseInt(pageSize) || 100))
  const skip = (pageNum - 1) * size
  return { page: pageNum, pageSize: size, skip }
}

// Format price
const formatPrice = (price) => {
  return Math.round(price * 100) / 100
}

// Calculate total price with specifications
const calculatePrice = (basePrice, specifications = {}) => {
  let total = basePrice
  if (specifications.sizeExtra) total += specifications.sizeExtra
  if (specifications.materialExtra) total += specifications.materialExtra
  if (specifications.fillExtra) total += specifications.fillExtra
  if (specifications.frameExtra) total += specifications.frameExtra
  if (specifications.legExtra) total += specifications.legExtra
  return formatPrice(total)
}

module.exports = {
  generateOrderNo,
  generateCouponCode,
  calculatePagination,
  formatPrice,
  calculatePrice
}
