const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// GridFS 初始化
let gfs;
const conn = mongoose.connection;

// 延迟初始化 GridFS
const initGridFS = () => {
  try {
    const Grid = require('gridfs-stream');
    if (!gfs && conn.db) {
      gfs = Grid(conn.db, mongoose.mongo);
    }
  } catch (err) {
    console.warn('GridFS 初始化失败:', err.message);
  }
};

conn.once('open', () => {
  initGridFS();
});

// 确保 GridFS 已初始化
const ensureGridFS = () => {
  if (!gfs) {
    initGridFS();
  }
  return gfs;
};

/**
 * 文件上传服务
 * 支持 GridFS（默认）和阿里云 OSS（可选）
 */
class FileService {
  /**
   * 上传文件到 GridFS
   * @param {Buffer} fileBuffer - 文件内容
   * @param {String} originalName - 原始文件名
   * @param {String} mimeType - 文件类型
   * @returns {Promise<Object>} - { fileId, filename, url }
   */
  static async uploadToGridFS(fileBuffer, originalName, mimeType) {
    return new Promise((resolve, reject) => {
      const gridfs = ensureGridFS();
      if (!gridfs) {
        return reject(new Error('GridFS 未初始化，请确保 MongoDB 已连接'));
      }

      // 生成唯一的文件名
      const ext = path.extname(originalName);
      const filename = `${uuidv4()}${ext}`;

      const writeStream = gridfs.createWriteStream({
        filename: filename,
        metadata: {
          originalName: originalName,
          uploadedAt: new Date(),
          mimeType: mimeType,
        },
      });

      writeStream.on('close', (file) => {
        resolve({
          fileId: file._id,
          filename: filename,
          originalName: originalName,
          url: `/api/files/${file._id}`,
          size: file.length,
          mimeType: mimeType,
          uploadedAt: new Date(),
        });
      });

      writeStream.on('error', (err) => {
        reject(err);
      });

      writeStream.end(fileBuffer);
    });
  }

  /**
   * 从 GridFS 下载文件
   * @param {String} fileId - 文件 ID
   * @returns {Promise<Object>} - { stream, filename, mimeType }
   */
  static async downloadFromGridFS(fileId) {
    return new Promise((resolve, reject) => {
      if (!gfs) {
        return reject(new Error('GridFS 未初始化'));
      }

      try {
        const objectId = mongoose.Types.ObjectId(fileId);
        const readStream = gfs.createReadStream({ _id: objectId });

        // 获取文件信息
        gfs.files.findOne({ _id: objectId }, (err, file) => {
          if (err) {
            return reject(err);
          }
          if (!file) {
            return reject(new Error('文件不存在'));
          }

          resolve({
            stream: readStream,
            filename: file.filename,
            mimeType: file.metadata?.mimeType || 'application/octet-stream',
            size: file.length,
          });
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * 删除 GridFS 中的文件
   * @param {String} fileId - 文件 ID
   * @returns {Promise<Boolean>}
   */
  static async deleteFromGridFS(fileId) {
    return new Promise((resolve, reject) => {
      if (!gfs) {
        return reject(new Error('GridFS 未初始化'));
      }

      try {
        const objectId = mongoose.Types.ObjectId(fileId);
        gfs.remove({ _id: objectId }, (err) => {
          if (err) {
            return reject(err);
          }
          resolve(true);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * 上传文件到阿里云 OSS（可选）
   * @param {Buffer} fileBuffer - 文件内容
   * @param {String} originalName - 原始文件名
   * @param {String} mimeType - 文件类型
   * @returns {Promise<Object>} - { url, filename }
   */
  static async uploadToOSS(fileBuffer, originalName, mimeType) {
    try {
      const OSS = require('ali-oss');

      // 从环境变量获取 OSS 配置
      if (!process.env.OSS_REGION || !process.env.OSS_ACCESS_KEY_ID || !process.env.OSS_ACCESS_KEY_SECRET || !process.env.OSS_BUCKET) {
        throw new Error('OSS 配置不完整');
      }

      const client = new OSS({
        region: process.env.OSS_REGION,
        accessKeyId: process.env.OSS_ACCESS_KEY_ID,
        accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
        bucket: process.env.OSS_BUCKET,
      });

      // 生成唯一的文件名
      const ext = path.extname(originalName);
      const filename = `uploads/${uuidv4()}${ext}`;

      // 上传文件
      const result = await client.put(filename, fileBuffer, {
        headers: {
          'Content-Type': mimeType,
        },
      });

      return {
        url: result.url,
        filename: filename,
        originalName: originalName,
        size: fileBuffer.length,
        mimeType: mimeType,
        uploadedAt: new Date(),
      };
    } catch (err) {
      throw new Error(`OSS 上传失败: ${err.message}`);
    }
  }

  /**
   * 上传文件（自动选择存储方式）
   * @param {Buffer} fileBuffer - 文件内容
   * @param {String} originalName - 原始文件名
   * @param {String} mimeType - 文件类型
   * @param {String} storage - 存储方式 ('gridfs' 或 'oss')
   * @returns {Promise<Object>}
   */
  static async upload(fileBuffer, originalName, mimeType, storage = 'gridfs') {
    try {
      // 验证文件大小（最大 50MB）
      const maxSize = 50 * 1024 * 1024;
      if (fileBuffer.length > maxSize) {
        throw new Error('文件过大，最大允许 50MB');
      }

      // 验证文件类型
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

      if (!allowedMimes.includes(mimeType)) {
        throw new Error(`不支持的文件类型: ${mimeType}`);
      }

      // 选择存储方式
      if (storage === 'oss' && process.env.OSS_REGION) {
        return await this.uploadToOSS(fileBuffer, originalName, mimeType);
      } else {
        return await this.uploadToGridFS(fileBuffer, originalName, mimeType);
      }
    } catch (err) {
      throw err;
    }
  }

  /**
   * 获取文件
   * @param {String} fileId - 文件 ID
   * @returns {Promise<Object>}
   */
  static async getFile(fileId) {
    try {
      return await this.downloadFromGridFS(fileId);
    } catch (err) {
      throw err;
    }
  }

  /**
   * 删除文件
   * @param {String} fileId - 文件 ID
   * @returns {Promise<Boolean>}
   */
  static async deleteFile(fileId) {
    try {
      return await this.deleteFromGridFS(fileId);
    } catch (err) {
      throw err;
    }
  }
}

module.exports = FileService;
