const express = require('express');
const {
  getAllImages,
  getImagesBySection,
  saveImages,
  updateImage,
  deleteImage
} = require('../controllers/websiteImageController');
const { auth: authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 公开接口
router.get('/', getAllImages);
router.get('/:section', getImagesBySection);

// 需要认证和 admin 权限的接口
router.post('/save', authMiddleware, saveImages);
router.put('/:section/:itemId', authMiddleware, updateImage);
router.delete('/:section/:itemId', authMiddleware, deleteImage);

module.exports = router;
