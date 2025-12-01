const FileService = require('../services/fileService');
const { sendResponse, sendError } = require('../utils/response');
const sharp = require('sharp');

// 缩略图缓存（内存缓存，生产环境建议使用 Redis）
const thumbnailCache = new Map();
const THUMBNAIL_CACHE_MAX_SIZE = 500; // 最多缓存500个缩略图

/**
 * 上传单个文件
 */
const uploadFile = async (req, res) => {
  try {
    console.log('📁 [Upload] 开始处理文件上传');
    
    if (!req.file) {
      console.error('❌ [Upload] 未找到上传的文件');
      return sendError(res, '未找到上传的文件', 400);
    }

    console.log(`📁 [Upload] 文件信息: ${req.file.originalname}, 大小: ${(req.file.size / 1024 / 1024).toFixed(2)}MB, MIME: ${req.file.mimetype}`);

    const storage = req.query.storage || 'gridfs';
    console.log(`📁 [Upload] 使用存储方式: ${storage}`);
    
    const result = await FileService.upload(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      storage
    );
    
    console.log(`✅ [Upload] 上传成功: fileId=${result.fileId}`);
    
    // 确保返回的是GridFS fileId，而不是Base64
    if (!result.fileId || result.fileId.startsWith('data:')) {
      throw new Error('GridFS上传失败，返回了Base64数据');
    }
    
    sendResponse(res, result, '文件上传成功（GridFS）', 201);
  } catch (err) {
    console.error('❌ [Upload] 文件上传错误:', err);
    console.error('❌ [Upload] 错误堆栈:', err.stack);
    sendError(res, err.message, 500);
  }
};

/**
 * 上传多个文件
 */
const uploadMultiple = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return sendError(res, '未找到上传的文件', 400);
    }

    const storage = req.query.storage || 'gridfs';
    const results = [];

    for (const file of req.files) {
      const result = await FileService.upload(
        file.buffer,
        file.originalname,
        file.mimetype,
        storage
      );
      results.push(result);
    }

    sendResponse(res, results, `成功上传 ${results.length} 个文件`, 201);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

/**
 * 下载/访问文件（支持缩略图）
 * 查询参数：
 * - w: 缩略图宽度 (如 ?w=200)
 * - h: 缩略图高度 (如 ?h=200)
 * - q: 质量 0-100 (如 ?q=80)
 */
const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { w, h, q } = req.query;
    const width = w ? parseInt(w) : null;
    const height = h ? parseInt(h) : null;
    const quality = q ? parseInt(q) : 80;

    const fileData = await FileService.getFile(fileId);
    const isImage = fileData.mimeType && fileData.mimeType.startsWith('image/');

    // 如果请求缩略图且是图片文件
    if (isImage && (width || height)) {
      const cacheKey = `${fileId}_${width || 'auto'}_${height || 'auto'}_${quality}`;
      
      // 检查缓存
      if (thumbnailCache.has(cacheKey)) {
        const cached = thumbnailCache.get(cacheKey);
        res.setHeader('Content-Type', 'image/webp');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.setHeader('X-Thumbnail-Cache', 'HIT');
        return res.send(cached);
      }

      // 读取原始图片到 Buffer
      const chunks = [];
      for await (const chunk of fileData.stream) {
        chunks.push(chunk);
      }
      const originalBuffer = Buffer.concat(chunks);

      // 使用 sharp 生成缩略图
      try {
        let transformer = sharp(originalBuffer);
        
        // 调整尺寸
        if (width || height) {
          transformer = transformer.resize(width, height, {
            fit: 'inside',
            withoutEnlargement: true
          });
        }
        
        // 转换为 WebP 格式（更小的文件大小）
        const thumbnailBuffer = await transformer
          .webp({ quality })
          .toBuffer();

        // 缓存缩略图
        if (thumbnailCache.size >= THUMBNAIL_CACHE_MAX_SIZE) {
          // 删除最早的缓存
          const firstKey = thumbnailCache.keys().next().value;
          thumbnailCache.delete(firstKey);
        }
        thumbnailCache.set(cacheKey, thumbnailBuffer);

        res.setHeader('Content-Type', 'image/webp');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.setHeader('X-Thumbnail-Cache', 'MISS');
        return res.send(thumbnailBuffer);
      } catch (sharpErr) {
        console.warn('缩略图生成失败，返回原图:', sharpErr.message);
        // 如果缩略图生成失败，返回原图
        res.setHeader('Content-Type', fileData.mimeType);
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        return res.send(originalBuffer);
      }
    }

    // 返回原始文件
    res.setHeader('Content-Type', fileData.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileData.filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    fileData.stream.pipe(res);
  } catch (err) {
    sendError(res, err.message, 404);
  }
};

/**
 * 删除文件
 */
const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    await FileService.deleteFile(fileId);

    sendResponse(res, { fileId }, '文件删除成功');
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

/**
 * 获取文件信息
 */
const getFileInfo = async (req, res) => {
  try {
    const { fileId } = req.params;

    const fileData = await FileService.getFile(fileId);

    sendResponse(res, {
      fileId,
      filename: fileData.filename,
      mimeType: fileData.mimeType,
      size: fileData.size,
    });
  } catch (err) {
    sendError(res, err.message, 404);
  }
};

module.exports = {
  uploadFile,
  uploadMultiple,
  downloadFile,
  deleteFile,
  getFileInfo
};
