const { successResponse, errorResponse, paginatedResponse } = require('../utils/response')
const { getProducts, getProductById, getCategories, getStyles, searchProducts } = require('../services/productService')
const FileService = require('../services/fileService')
const Product = require('../models/Product')

const listProducts = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search, categoryId, styleId, sortBy } = req.query
    
    const result = await getProducts({
      page,
      pageSize,
      search,
      categoryId,
      styleId,
      sortBy
    })
    
    res.json(paginatedResponse(result.products, result.total, result.page, result.pageSize))
  } catch (err) {
    console.error('List products error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

const getProduct = async (req, res) => {
  try {
    const { id } = req.params
    const product = await getProductById(id)
    res.json(successResponse(product))
  } catch (err) {
    console.error('Get product error:', err)
    const status = err.status || 500
    res.status(status).json(errorResponse(err.message, status))
  }
}

const getProductCategories = async (req, res) => {
  try {
    const categories = await getCategories()
    res.json(successResponse(categories))
  } catch (err) {
    console.error('Get categories error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

const getProductStyles = async (req, res) => {
  try {
    const styles = await getStyles()
    res.json(successResponse(styles))
  } catch (err) {
    console.error('Get styles error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

const search = async (req, res) => {
  try {
    const { keyword, page = 1, pageSize = 10 } = req.query
    
    if (!keyword) {
      return res.status(400).json(errorResponse('Keyword is required', 400))
    }
    
    const result = await searchProducts(keyword, page, pageSize)
    res.json(paginatedResponse(result.products, result.total, result.page, result.pageSize))
  } catch (err) {
    console.error('Search error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

/**
 * 上传产品缩略图
 * POST /api/products/:productId/upload-thumbnail
 */
const uploadThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse('未找到上传的文件', 400))
    }

    const { productId } = req.params
    const storage = req.query.storage || 'gridfs'

    // 上传文件
    const fileResult = await FileService.upload(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      storage
    )

    // 更新产品缩略图
    const product = await Product.findByIdAndUpdate(
      productId,
      { thumbnail: fileResult.url },
      { new: true }
    )

    if (!product) {
      return res.status(404).json(errorResponse('产品不存在', 404))
    }

    res.json(successResponse({
      productId: product._id,
      thumbnail: product.thumbnail,
      fileId: fileResult.fileId,
      message: '缩略图上传成功'
    }))
  } catch (err) {
    console.error('Upload thumbnail error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

/**
 * 上传产品图片
 * POST /api/products/:productId/upload-images
 */
const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json(errorResponse('未找到上传的文件', 400))
    }

    const { productId } = req.params
    const storage = req.query.storage || 'gridfs'

    // 上传所有文件
    const fileResults = []
    for (const file of req.files) {
      const fileResult = await FileService.upload(
        file.buffer,
        file.originalname,
        file.mimetype,
        storage
      )
      fileResults.push(fileResult)
    }

    // 获取产品
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json(errorResponse('产品不存在', 404))
    }

    // 添加新图片到现有图片
    const newImages = fileResults.map(f => f.url)
    product.images = [...(product.images || []), ...newImages]
    await product.save()

    res.json(successResponse({
      productId: product._id,
      images: product.images,
      uploadedCount: fileResults.length,
      message: `成功上传 ${fileResults.length} 张图片`
    }))
  } catch (err) {
    console.error('Upload images error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

/**
 * 删除产品图片
 * DELETE /api/products/:productId/images/:imageIndex
 */
const deleteImage = async (req, res) => {
  try {
    const { productId, imageIndex } = req.params

    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json(errorResponse('产品不存在', 404))
    }

    const index = parseInt(imageIndex)
    if (index < 0 || index >= product.images.length) {
      return res.status(400).json(errorResponse('图片索引无效', 400))
    }

    product.images.splice(index, 1)
    await product.save()

    res.json(successResponse({
      productId: product._id,
      images: product.images,
      message: '图片删除成功'
    }))
  } catch (err) {
    console.error('Delete image error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 创建单个商品
const createProduct = async (req, res) => {
  try {
    const productData = req.body

    // 创建商品
    const product = await Product.create(productData)

    res.status(201).json(successResponse(product, '商品创建成功'))
  } catch (err) {
    console.error('Create product error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 更新商品
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params
    const productData = req.body

    const product = await Product.findByIdAndUpdate(
      id,
      { ...productData, updatedAt: Date.now() },
      { new: true }
    )

    if (!product) {
      return res.status(404).json(errorResponse('商品不存在', 404))
    }

    res.json(successResponse(product, '商品更新成功'))
  } catch (err) {
    console.error('Update product error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 删除商品
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params

    const product = await Product.findByIdAndDelete(id)

    if (!product) {
      return res.status(404).json(errorResponse('商品不存在', 404))
    }

    res.json(successResponse(null, '商品删除成功'))
  } catch (err) {
    console.error('Delete product error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 批量导入商品
const bulkImport = async (req, res) => {
  try {
    const products = req.body

    // 验证是否为数组
    if (!Array.isArray(products)) {
      return res.status(400).json(errorResponse('请求体必须是数组', 400))
    }

    if (products.length === 0) {
      return res.status(400).json(errorResponse('商品列表不能为空', 400))
    }

    // 为每个商品添加必要字段
    const productsWithDefaults = products.map(p => ({
      ...p,
      status: p.status || 'active',
      stock: p.stock || 0,
      sales: p.sales || 0,
      views: p.views || 0,
      images: p.images || [],
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    // 批量插入商品
    const result = await Product.insertMany(productsWithDefaults, { ordered: false })

    res.status(201).json(successResponse({
      imported: result.length,
      products: result
    }, '批量导入成功'))
  } catch (err) {
    console.error('Bulk import error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCategories,
  getProductStyles,
  search,
  uploadThumbnail,
  uploadImages,
  deleteImage,
  bulkImport
}
