const { successResponse, errorResponse, paginatedResponse } = require('../utils/response')
const { getProducts, getProductById, getCategories, getStyles, searchProducts } = require('../services/productService')
const browseHistoryService = require('../services/browseHistoryService')
const FileService = require('../services/fileService')
const Product = require('../models/Product')
const Style = require('../models/Style')

const listProducts = async (req, res) => {
  try {
    const { page = 1, pageSize = 100, search, categoryId, styleId, sortBy } = req.query
    
    const result = await getProducts({
      page,
      pageSize,
      search,
      categoryId,
      styleId,
      sortBy
    })
    
    // 调试日志：检查返回的商品styles
    const productsWithStyles = result.products.filter(p => p.styles && p.styles.length > 0)
    console.log('🔥 [商品列表] 总商品数:', result.total)
    console.log('🔥 [商品列表] 有styles的商品数:', productsWithStyles.length)
    if (productsWithStyles.length > 0) {
      console.log('🔥 [商品列表] 示例:', productsWithStyles.slice(0, 2).map(p => ({
        name: p.name,
        styles: p.styles
      })))
    }
    
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
    
    // 异步记录浏览历史（如果用户已登录）
    const userId = req.user?._id || req.user?.id
    if (userId) {
      browseHistoryService.recordBrowse(userId, id, {
        source: req.headers['x-platform'] || 'web',
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection?.remoteAddress
      }).catch(err => console.error('记录浏览历史失败:', err))
    }
    
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
    
    // 调试日志：检查category字段
    console.log('🔥 [创建商品] 商品名称:', productData.name)
    console.log('🔥 [创建商品] 接收到的category:', productData.category)

    // 处理 SKU 数据，确保 materialCategories 正确保存
    if (productData.skus && Array.isArray(productData.skus)) {
      productData.skus = productData.skus.map(sku => ({
        ...sku,
        materialCategories: sku.materialCategories || [],
        material: sku.material || {},
        materialUpgradePrices: sku.materialUpgradePrices || {},
      }))
    }

    // 创建商品
    const product = await Product.create(productData)
    
    // 调试日志：确认保存后的category
    console.log('🔥 [创建商品] 保存后的category:', product.category)

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
    
    // 调试日志：检查更新数据
    console.log('🔥 [更新商品] ID:', id)
    console.log('🔥 [更新商品] 商品名称:', productData.name)
    console.log('🔥 [更新商品] 接收到的category:', productData.category)
    console.log('🔥 [更新商品] 接收到的categories:', productData.categories)
    console.log('🔥 [更新商品] 接收到的styles:', productData.styles)
    if (productData.skus) {
      console.log('🔥 [更新商品] 接收到的SKU数量:', productData.skus.length)
      productData.skus.forEach((sku, idx) => {
        console.log(`🔥 [更新商品] SKU${idx + 1}: code="${sku.code}", images数量=${sku.images?.length || 0}`)
      })
    }

    // 处理 SKU 数据，确保 materialCategories 正确保存
    if (productData.skus && Array.isArray(productData.skus)) {
      productData.skus = productData.skus.map(sku => ({
        ...sku,
        materialCategories: sku.materialCategories || [],
        material: sku.material || {},
        materialUpgradePrices: sku.materialUpgradePrices || {},
      }))
      console.log('🔥 [更新商品] 处理后的SKU materialCategories:', productData.skus.map(s => s.materialCategories))
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { ...productData, updatedAt: Date.now() },
      { new: true, runValidators: false }
    )

    if (!product) {
      return res.status(404).json(errorResponse('商品不存在', 404))
    }
    
    // 调试日志：确认保存后的数据
    console.log('🔥 [更新商品] 保存后的category:', product.category)
    console.log('🔥 [更新商品] 保存后的categories:', product.categories)
    console.log('🔥 [更新商品] 保存后的styles:', product.styles)
    if (product.skus) {
      console.log('🔥 [更新商品] 保存后的SKU数量:', product.skus.length)
      product.skus.forEach((sku, idx) => {
        console.log(`🔥 [更新商品] 保存后SKU${idx + 1}: code="${sku.code}", images数量=${sku.images?.length || 0}`)
        if (sku.images && sku.images.length > 0) {
          console.log(`🔥 [更新商品] SKU${idx + 1}图片: [${sku.images.slice(0, 2).join(', ')}...]`)
        }
      })
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

    // 收集所有商品中的风格标签
    const allStyles = new Set()
    products.forEach(p => {
      if (p.styles && Array.isArray(p.styles)) {
        p.styles.forEach(s => {
          if (s && s.trim()) allStyles.add(s.trim())
        })
      }
      // 兼容单个 style 字段
      if (p.style && typeof p.style === 'string' && p.style.trim()) {
        allStyles.add(p.style.trim())
      }
    })

    // 查询已存在的风格
    const existingStyles = await Style.find({ name: { $in: Array.from(allStyles) } }).lean()
    const existingStyleNames = new Set(existingStyles.map(s => s.name))

    // 创建不存在的风格
    const newStyles = Array.from(allStyles).filter(s => !existingStyleNames.has(s))
    if (newStyles.length > 0) {
      const stylesToCreate = newStyles.map(name => ({
        name,
        status: 'active',
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
      await Style.insertMany(stylesToCreate, { ordered: false })
      console.log(`自动创建了 ${newStyles.length} 个新风格标签:`, newStyles)
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
      products: result,
      newStyles: newStyles
    }, `批量导入成功${newStyles.length > 0 ? `，自动创建了 ${newStyles.length} 个新风格标签` : ''}`))
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
