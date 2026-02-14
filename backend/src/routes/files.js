const express = require('express');
const multer = require('multer');
const FileController = require('../controllers/fileController');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// 配置 multer - 支持大文件和设计文件
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB - 支持大型设计文件
  },
  fileFilter: (req, file, cb) => {
    console.log(`📁 接收文件上传: ${file.originalname}, MIME: ${file.mimetype}`);
    
    // 允许的文件类型（图片、文档、设计文件）
    const allowedMimes = [
      // 图片
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // 文档
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // 视频
      'video/mp4',
      'video/webm',
      'video/ogg',
      // 设计文件（通常是application/octet-stream）
      'application/octet-stream',
      'application/x-dwg',
      'application/acad',
      'model/vnd.dwf',
    ];
    
    // 检查MIME类型或文件扩展名
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    const designFileExts = ['dwg', 'max', 'fbx', 'obj', '3ds', 'dxf', 'skp', 'blend', 'ma', 'mb', 'c4d'];
    
    if (allowedMimes.includes(file.mimetype) || designFileExts.includes(ext || '')) {
      console.log(`✅ 文件类型允许: ${file.originalname}`);
      cb(null, true);
    } else {
      const error = new Error(`不支持的文件类型: ${file.mimetype} (.${ext})`);
      console.error(`❌ ${error.message}`);
      cb(error);
    }
  },
});

/**
 * 上传单个文件（兼容 /api/upload）
 * POST /api/upload 或 POST /api/files/upload
 * Query: storage=gridfs|oss (默认 gridfs)
 */
// 使用optionalAuth而不是auth，允许未登录用户上传
router.post('/', optionalAuth, upload.single('file'), FileController.uploadFile);
router.post('/upload', optionalAuth, upload.single('file'), FileController.uploadFile);

/**
 * 上传多个文件
 * POST /api/files/upload-multiple
 * Query: storage=gridfs|oss (默认 gridfs)
 */
router.post('/upload-multiple', auth, upload.array('files', 10), FileController.uploadMultiple);

/**
 * 下载/访问文件
 * GET /api/files/:fileId
 * 移除 helmet 的限制性头部，确保小程序 <image> 组件能正常加载
 */
router.get('/:fileId', (req, res, next) => {
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Cross-Origin-Opener-Policy');
  res.removeHeader('Cross-Origin-Resource-Policy');
  res.removeHeader('Origin-Agent-Cluster');
  res.removeHeader('Strict-Transport-Security');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, FileController.downloadFile);

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
