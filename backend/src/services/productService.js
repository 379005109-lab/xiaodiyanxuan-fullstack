const Product = require('../models/Product')
const Category = require('../models/Category')
const Style = require('../models/Style')
const { calculatePagination } = require('../utils/helpers')
const { NotFoundError } = require('../utils/errors')

const getProducts = async (filters = {}) => {
  const { page = 1, pageSize = 10, search, categoryId, styleId, sortBy = '-createdAt', status } = filters
  const { skip, pageSize: size } = calculatePagination(page, pageSize)
  
  // 默认不过滤状态，如果传了status参数才过滤
  const query = {}
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
    .sort(sortBy)
    .skip(skip)
    .limit(size)
    .lean()
  
  return { products, total, page, pageSize: size }
}

const getProductById = async (id) => {
  const product = await Product.findById(id)
  if (!product) {
    throw new NotFoundError('Product not found')
  }
  
  // Increment views
  product.views = (product.views || 0) + 1
  await product.save()
  
  return product
}

const getCategories = async () => {
  return await Category.find({ status: 'active' }).sort('order').lean()
}

const getStyles = async () => {
  return await Style.find({ status: 'active' }).sort('order').lean()
}

const searchProducts = async (keyword, page = 1, pageSize = 10) => {
  const { skip, pageSize: size } = calculatePagination(page, pageSize)
  
  const query = {
    status: 'active',
    $text: { $search: keyword }
  }
  
  const total = await Product.countDocuments(query)
  const products = await Product.find(query)
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
