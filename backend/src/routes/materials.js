const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const materialController = require('../controllers/materialController');

// 材质路由
router.get('/', materialController.list);
router.get('/stats', materialController.stats);
router.get('/:id', materialController.get);
router.post('/', auth, materialController.create);
router.put('/:id', auth, materialController.update);
router.delete('/:id', auth, materialController.delete);
router.post('/batch-delete', auth, materialController.batchDelete);

// 分类路由
router.get('/categories/list', materialController.listCategories);
router.post('/categories', auth, materialController.createCategory);
router.put('/categories/:id', auth, materialController.updateCategory);
router.delete('/categories/:id', auth, materialController.deleteCategory);

module.exports = router;
