const Product = require('../models/Product')
const Category = require('../models/Category')
const Style = require('../models/Style')
const { calculatePagination } = require('../utils/helpers')
const { NotFoundError } = require('../utils/errors')

const getProducts = async (filters = {}) => {
  // 默认按order字段升序排序（order值越小越靠前），其次按创建时间降序
  const { page = 1, pageSize = 100, search, categoryId, styleId, sortBy = 'order -createdAt', status, manufacturerId } = filters
  const { skip, pageSize: size } = calculatePagination(page, pageSize)
  
  // 默认不过滤状态，如果传了status参数才过滤
  const query = {}
  if (manufacturerId) {
    query.manufacturerId = manufacturerId
  }
  if (status) {
    query.status = status
  }
  
  if (search) {
    query.$text = { $search: search }
  }
  
  if (categoryId) {
    query['category.id'] = categoryId
  }
  
  if (styleId) {
    query['style.id'] = styleId
  }
  
  const total = await Product.countDocuments(query)
  const products = await Product.find(query)
    .select('name productCode code subCodes description basePrice manufacturerId authorizedLabelPrices stock thumbnail images videos videoTitles files category style styles specifications skus materialsGroups materialConfigs otherMaterialsText otherMaterialsImage tags isCombo comboItems sales views rating reviews order status createdAt updatedAt __v')
    .populate('category', 'name slug')
    .sort(sortBy)
    .skip(skip)
    .limit(size)
    .lean()
  
  return { products, total, page, pageSize: size }
}

const getProductById = async (id) => {
  // 使用 lean() 加速查询，单独更新浏览量
  const product = await Product.findById(id)
    .select('name productCode code subCodes description basePrice manufacturerId authorizedLabelPrices stock thumbnail images videos videoTitles files category style styles specifications skus materialsGroups materialConfigs otherMaterialsText otherMaterialsImage tags isCombo comboItems sales views rating reviews order status createdAt updatedAt __v')
    .populate('category', 'name slug')
    .lean()
  if (!product) {
    throw new NotFoundError('Product not found')
  }
  
  // 异步更新浏览量，不阻塞响应
  Product.updateOne({ _id: id }, { $inc: { views: 1 } }).exec()
  
  return product
}

const getCategories = async () => {
  return await Category.find({ status: 'active' }).sort('order').lean()
}

const getStyles = async () => {
  return await Style.find({ status: 'active' }).sort('order').lean()
}

const searchProducts = async (keyword, page = 1, pageSize = 100) => {
  let manufacturerId
  // 兼容旧调用：searchProducts(keyword, page, pageSize) / searchProducts(keyword, page, pageSize, manufacturerId)
  if (arguments.length >= 4) {
    manufacturerId = arguments[3]
  }
  const { skip, pageSize: size } = calculatePagination(page, pageSize)
  
  const query = {
    status: 'active',
    $text: { $search: keyword }
  }

  if (manufacturerId) {
    query.manufacturerId = manufacturerId
  }
  
  const total = await Product.countDocuments(query)
  const products = await Product.find(query)
    .sort('order -createdAt')  // 按order字段排序
    .skip(skip)
    .limit(size)
    .lean()
  
  return { products, total, page, pageSize: size }
}

module.exports = {
  getProducts,
  getProductById,
  getCategories,
  getStyles,
  searchProducts
}
