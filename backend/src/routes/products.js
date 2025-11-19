const express = require('express')
const multer = require('multer')
const router = express.Router()
const { optionalAuth, authenticate } = require('../middleware/auth')
const { listProducts, getProduct, getProductCategories, getProductStyles, search } = require('../controllers/productController')

// 配置 multer
const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}`))
    }
  }
})

// 特定路由必须在参数路由之前
// GET /api/products/categories - Get categories
router.get('/categories', getProductCategories)

// GET /api/products/styles - Get styles
router.get('/styles', getProductStyles)

// GET /api/products/search - Search products
router.get('/search', optionalAuth, search)

// GET /api/products - List products
router.get('/', optionalAuth, listProducts)

// 上传功能暂时禁用，待实现
// POST /api/products/:productId/upload-thumbnail - Upload thumbnail
// router.post('/:productId/upload-thumbnail', authenticate, upload.single('file'), uploadThumbnail)

// POST /api/products/:productId/upload-images - Upload images
// router.post('/:productId/upload-images', authenticate, upload.array('files', 10), uploadImages)

// DELETE /api/products/:productId/images/:imageIndex - Delete image
// router.delete('/:productId/images/:imageIndex', authenticate, deleteImage)

// GET /api/products/:id - Get product details
router.get('/:id', optionalAuth, getProduct)

module.exports = router
