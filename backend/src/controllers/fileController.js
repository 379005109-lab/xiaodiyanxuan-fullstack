const FileService = require('../services/fileService');
const { sendResponse, sendError } = require('../utils/response');
const sharp = require('sharp');

// 缩略图缓存（内存缓存，生产环境建议使用 Redis）
const thumbnailCache = new Map();
const THUMBNAIL_CACHE_MAX_SIZE = 1000; // 最多缓存1000个缩略图

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
    let { fileId } = req.params;
    // 移除视频扩展名标记（如果有）
    // 兼容历史数据：可能出现 6976...ab5.mp4.mp4.mp4 这种重复后缀
    fileId = String(fileId).replace(/(\.(mp4|webm|ogg|mov))+$/i, '');
    const { w, h, q, format } = req.query;
    const width = w ? parseInt(w) : null;
    const height = h ? parseInt(h) : null;
    const quality = q ? parseInt(q) : 80;
    const outFormat = (format ? String(format) : 'webp').toLowerCase();

    const fileData = await FileService.getFile(fileId);
    const isImage = fileData.mimeType && fileData.mimeType.startsWith('image/');

    // 如果请求缩略图且是图片文件
    if (isImage && (width || height)) {
      const cacheKey = `${fileId}_${width || 'auto'}_${height || 'auto'}_${quality}_${outFormat}`;
      
      // 检查缓存
      if (thumbnailCache.has(cacheKey)) {
        const cached = thumbnailCache.get(cacheKey);
        const contentType = outFormat === 'jpeg' || outFormat === 'jpg'
          ? 'image/jpeg'
          : outFormat === 'png'
            ? 'image/png'
            : 'image/webp';
        res.setHeader('Content-Type', contentType);
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
        
        let thumbnailBuffer;
        let contentType = 'image/webp';
        if (outFormat === 'jpeg' || outFormat === 'jpg') {
          thumbnailBuffer = await transformer.jpeg({ quality }).toBuffer();
          contentType = 'image/jpeg';
        } else if (outFormat === 'png') {
          thumbnailBuffer = await transformer.png().toBuffer();
          contentType = 'image/png';
        } else {
          thumbnailBuffer = await transformer.webp({ quality }).toBuffer();
          contentType = 'image/webp';
        }

        // 缓存缩略图
        if (thumbnailCache.size >= THUMBNAIL_CACHE_MAX_SIZE) {
          // 删除最早的缓存
          const firstKey = thumbnailCache.keys().next().value;
          thumbnailCache.delete(firstKey);
        }
        thumbnailCache.set(cacheKey, thumbnailBuffer);

        res.setHeader('Content-Type', contentType);
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

    // 支持视频/音频 Range 请求（浏览器播放/拖动/首帧需要）
    const range = req.headers.range;
    const isMedia = fileData.mimeType && (fileData.mimeType.startsWith('video/') || fileData.mimeType.startsWith('audio/'));
    const canRange = !!range && isMedia && !isImage;

    if (canRange) {
      const size = Number(fileData.size || 0);
      if (!Number.isFinite(size) || size <= 0) {
        // 无法确定大小时退化为全量返回
        res.setHeader('Content-Type', fileData.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${fileData.filename}"`);
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.setHeader('Accept-Ranges', 'bytes');
        return fileData.stream.pipe(res);
      }

      const match = String(range).match(/bytes=(\d*)-(\d*)/);
      const startRaw = match?.[1];
      const endRaw = match?.[2];
      const start = startRaw ? parseInt(startRaw, 10) : 0;
      const endInclusive = endRaw ? parseInt(endRaw, 10) : size - 1;

      if (!Number.isFinite(start) || !Number.isFinite(endInclusive) || start < 0 || endInclusive < start || start >= size) {
        // RFC 7233
        res.status(416);
        res.setHeader('Content-Range', `bytes */${size}`);
        return res.end();
      }

      // 关闭全量 stream，使用 Range stream
      try {
        fileData.stream.destroy();
      } catch (_) {}

      const endExclusive = Math.min(endInclusive + 1, size);
      const ranged = await FileService.getFile(fileId, { start, end: endExclusive });
      const chunkSize = endExclusive - start;

      res.status(206);
      res.setHeader('Content-Type', ranged.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${ranged.filename}"`);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Range', `bytes ${start}-${endExclusive - 1}/${size}`);
      res.setHeader('Content-Length', String(chunkSize));

      return ranged.stream.pipe(res);
    }

    // 返回原始文件（非缩略图）
    res.setHeader('Content-Type', fileData.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileData.filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    if (!isImage) {
      res.setHeader('Accept-Ranges', 'bytes');
    }

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
