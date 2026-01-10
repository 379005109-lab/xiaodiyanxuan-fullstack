const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const materialController = require('../controllers/materialController');

// 材质路由
router.get('/', materialController.list);
router.get('/stats', materialController.stats);
router.post('/images-by-names', materialController.getImagesByNames); // 批量获取材质图片（无需登录）
router.get('/:id', materialController.get);
router.post('/', auth, materialController.create);
router.put('/:id', auth, materialController.update);
router.delete('/:id', auth, materialController.delete);
router.post('/batch-delete', auth, materialController.batchDelete);
router.post('/approve-all', auth, materialController.approveAll); // 批量审核通过
router.post('/cleanup-orphaned', auth, materialController.cleanupOrphanedMaterials); // 清理孤立材质

// 分类路由
router.get('/categories/list', materialController.listCategories);
router.post('/categories', auth, materialController.createCategory);
router.put('/categories/:id', auth, materialController.updateCategory);
router.delete('/categories/:id', auth, materialController.deleteCategory);

module.exports = router;
