const express = require('express')
const multer = require('multer')
const router = express.Router()
const { auth, optionalAuth } = require('../middleware/auth')
const { listCategories, getCategory, createCategory, updateCategory, deleteCategory, getCategoryStats, batchSetDiscount } = require('../controllers/categoryController')

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

// GET /api/categories - List categories
router.get('/', optionalAuth, listCategories)

// GET /api/categories/stats - Get category statistics (must be before /:id route)
router.get('/stats', optionalAuth, getCategoryStats)

// POST /api/categories/discounts/batch - Batch set discount for all categories
router.post('/discounts/batch', auth, batchSetDiscount)

// POST /api/categories - Create category
router.post('/', auth, createCategory)

// 上传功能暂时禁用，待实现
// POST /api/categories/:id/upload-image - Upload image
// router.post('/:id/upload-image', authenticate, upload.single('file'), uploadImage)

// POST /api/categories/:id/upload-icon - Upload icon
// router.post('/:id/upload-icon', authenticate, upload.single('file'), uploadIcon)

// GET /api/categories/:id - Get category
router.get('/:id', optionalAuth, getCategory)

// PUT /api/categories/:id - Update category
router.put('/:id', auth, updateCategory)

// DELETE /api/categories/:id - Delete category
router.delete('/:id', auth, deleteCategory)

module.exports = router
