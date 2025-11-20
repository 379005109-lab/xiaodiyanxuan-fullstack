const express = require('express')
const multer = require('multer')
const router = express.Router()
const { auth, optionalAuth } = require('../middleware/auth')
const { list, start, getMyBargains, help, uploadThumbnail } = require('../controllers/bargainController')

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

// GET /api/bargains - 获取砍价列表（可选认证）
router.get('/', optionalAuth, list)

// GET /api/bargains/my - 获取我的砍价（需要认证）
router.get('/my', auth, getMyBargains)

// POST /api/bargains - 发起砍价（需要认证）
router.post('/', auth, start)

// POST /api/bargains/:id/upload-thumbnail - 上传缩略图
router.post('/:id/upload-thumbnail', auth, upload.single('file'), uploadThumbnail)

// POST /api/bargains/:id/help - 帮助砍价（需要认证）
router.post('/:id/help', auth, help)

module.exports = router
