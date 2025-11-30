const MaterialCategory = require('../models/MaterialCategory')
const Organization = require('../models/Organization')
const { USER_ROLES, DEFAULT_DESIGNER_DISCOUNT } = require('../config/constants')

/**
 * 价格计算服务
 * 根据用户角色和商品分类计算最终价格
 */

/**
 * 获取用户看到的价格
 * @param {Object} user - 用户对象
 * @param {Object} product - 商品对象（需包含 costPrice, retailPrice, categoryId）
 * @param {Object} category - 分类对象（可选，如不传则自动查询）
 * @returns {Object} { price, originalPrice, discount, showCost, costPrice }
 */
const getUserPrice = async (user, product, category = null) => {
  const { costPrice = 0, retailPrice = 0, categoryId } = product
  
  // 如果没有传入分类，则查询
  if (!category && categoryId) {
    category = await MaterialCategory.findById(categoryId)
  }
  
  const result = {
    price: retailPrice,           // 用户看到的价格
    originalPrice: retailPrice,   // 原价（用于显示划线价）
    discount: null,               // 折扣率
    discountText: null,           // 折扣文字（如"4.5折"）
    showCost: false,              // 是否显示成本价
    costPrice: null,              // 成本价（如果有权限看）
  }
  
  if (!user || !user.role) {
    return result
  }
  
  switch (user.role) {
    // 1. 超级管理员 → 看成本价
    case USER_ROLES.SUPER_ADMIN:
      result.price = costPrice
      result.showCost = true
      result.costPrice = costPrice
      result.discountText = '成本价'
      break
    
    // 2. 设计师 → 按分类折扣
    case USER_ROLES.DESIGNER:
      const designerRate = category?.designerDiscount?.enabled 
        ? (category.designerDiscount.rate || DEFAULT_DESIGNER_DISCOUNT)
        : DEFAULT_DESIGNER_DISCOUNT
      result.price = Math.round(retailPrice * designerRate)
      result.discount = designerRate
      result.discountText = `${Math.round(designerRate * 10)}折`
      result.showCost = true
      result.costPrice = costPrice
      // 最低价保护
      if (category?.designerDiscount?.minPrice && result.price < category.designerDiscount.minPrice) {
        result.price = category.designerDiscount.minPrice
      }
      break
    
    // 3. 特殊账号 → 取所有分类最低折扣
    case USER_ROLES.SPECIAL_GUEST:
      const minRate = await getMinDesignerDiscount()
      result.price = Math.round(retailPrice * minRate)
      result.discount = minRate
      result.discountText = `${Math.round(minRate * 10)}折`
      result.showCost = true
      result.costPrice = costPrice
      break
    
    // 4. 平台/企业账号 → 按组织自定义折扣
    case USER_ROLES.PLATFORM_ADMIN:
    case USER_ROLES.PLATFORM_STAFF:
    case USER_ROLES.ENTERPRISE_ADMIN:
    case USER_ROLES.ENTERPRISE_STAFF:
      if (user.organizationId) {
        const org = await Organization.findById(user.organizationId)
        if (org) {
          // 先查找分类特定折扣
          const categoryDiscount = org.discountConfig?.categoryDiscounts?.find(
            d => d.categoryId?.toString() === categoryId?.toString()
          )
          const rate = categoryDiscount?.discountRate || org.discountConfig?.defaultDiscount || 1
          result.price = Math.round(retailPrice * rate)
          result.discount = rate
          if (rate < 1) {
            result.discountText = `${Math.round(rate * 10)}折`
          }
          result.showCost = org.discountConfig?.canViewCostPrice || false
          if (result.showCost) {
            result.costPrice = costPrice
          }
        }
      }
      break
    
    // 5. 普通客户 → 零售价
    default:
      // 保持默认值
      break
  }
  
  return result
}

/**
 * 获取所有分类中的最低设计师折扣
 * 用于特殊账号
 */
const getMinDesignerDiscount = async () => {
  const categories = await MaterialCategory.find({ 
    'designerDiscount.enabled': true 
  }).select('designerDiscount.rate')
  
  if (categories.length === 0) {
    return DEFAULT_DESIGNER_DISCOUNT
  }
  
  const rates = categories
    .map(c => c.designerDiscount?.rate)
    .filter(r => r !== undefined && r !== null)
  
  return rates.length > 0 ? Math.min(...rates) : DEFAULT_DESIGNER_DISCOUNT
}

/**
 * 批量计算价格
 * @param {Object} user - 用户对象
 * @param {Array} products - 商品数组
 * @returns {Array} 带价格信息的商品数组
 */
const batchCalculatePrices = async (user, products) => {
  // 预加载所有分类
  const categoryIds = [...new Set(products.map(p => p.categoryId).filter(Boolean))]
  const categories = await MaterialCategory.find({ _id: { $in: categoryIds } })
  const categoryMap = new Map(categories.map(c => [c._id.toString(), c]))
  
  // 对于特殊账号，预先计算最低折扣
  let minDiscount = null
  if (user?.role === USER_ROLES.SPECIAL_GUEST) {
    minDiscount = await getMinDesignerDiscount()
  }
  
  // 对于平台/企业账号，预加载组织信息
  let organization = null
  if (user?.organizationId && [
    USER_ROLES.PLATFORM_ADMIN, USER_ROLES.PLATFORM_STAFF,
    USER_ROLES.ENTERPRISE_ADMIN, USER_ROLES.ENTERPRISE_STAFF
  ].includes(user.role)) {
    organization = await Organization.findById(user.organizationId)
  }
  
  return Promise.all(products.map(async (product) => {
    const category = categoryMap.get(product.categoryId?.toString())
    const priceInfo = await getUserPrice(user, product, category)
    return {
      ...product.toObject ? product.toObject() : product,
      priceInfo
    }
  }))
}

/**
 * 检查用户是否有权限查看成本价
 */
const canViewCostPrice = (user) => {
  if (!user) return false
  return [
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.DESIGNER,
    USER_ROLES.SPECIAL_GUEST,
  ].includes(user.role) || user.permissions?.canViewCostPrice
}

module.exports = {
  getUserPrice,
  getMinDesignerDiscount,
  batchCalculatePrices,
  canViewCostPrice,
}
