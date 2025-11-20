const express = require('express')
const multer = require('multer')
const router = express.Router()
const { optionalAuth, auth } = require('../middleware/auth')
const { list, getPackage, uploadThumbnail, uploadImages } = require('../controllers/packageController')

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

// GET /api/packages - 获取套餐列表
router.get('/', optionalAuth, list)

// POST /api/packages/:id/upload-thumbnail - 上传缩略图
router.post('/:id/upload-thumbnail', auth, upload.single('file'), uploadThumbnail)

// POST /api/packages/:id/upload-images - 上传图片
router.post('/:id/upload-images', auth, upload.array('files', 10), uploadImages)

// GET /api/packages/:id - 获取套餐详情
router.get('/:id', optionalAuth, getPackage)

module.exports = router
