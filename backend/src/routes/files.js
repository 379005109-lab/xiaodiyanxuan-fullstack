const express = require('express');
const multer = require('multer');
const FileController = require('../controllers/fileController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// 配置 multer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}`));
    }
  },
});

/**
 * 上传单个文件（兼容 /api/upload）
 * POST /api/upload 或 POST /api/files/upload
 * Query: storage=gridfs|oss (默认 gridfs)
 */
router.post('/', auth, upload.single('file'), FileController.uploadFile);
router.post('/upload', auth, upload.single('file'), FileController.uploadFile);

/**
 * 上传多个文件
 * POST /api/files/upload-multiple
 * Query: storage=gridfs|oss (默认 gridfs)
 */
router.post('/upload-multiple', auth, upload.array('files', 10), FileController.uploadMultiple);

/**
 * 下载/访问文件
 * GET /api/files/:fileId
 */
router.get('/:fileId', FileController.downloadFile);

/**
 * 获取文件信息
 * GET /api/files/:fileId/info
 */
router.get('/:fileId/info', FileController.getFileInfo);

/**
 * 删除文件
 * DELETE /api/files/:fileId
 */
router.delete('/:fileId', auth, FileController.deleteFile);

module.exports = router;
