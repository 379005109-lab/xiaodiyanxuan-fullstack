const FileService = require('../services/fileService');
const { sendResponse, sendError } = require('../utils/response');

/**
 * 上传单个文件
 */
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, '未找到上传的文件', 400);
    }

    const storage = req.query.storage || 'gridfs';
    
    const result = await FileService.upload(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      storage
    );
    
    // 确保返回的是GridFS fileId，而不是Base64
    if (!result.fileId || result.fileId.startsWith('data:')) {
      throw new Error('GridFS上传失败，返回了Base64数据');
    }
    
    sendResponse(res, result, '文件上传成功（GridFS）', 201);
  } catch (err) {
    console.error('文件上传错误:', err);
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
 * 下载/访问文件
 */
const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const fileData = await FileService.getFile(fileId);

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
