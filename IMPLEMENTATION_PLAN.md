# 素材管理 + 套餐管理 API实施方案

---

## 🎯 目标

1. **素材管理**：从localStorage改为后端API
2. **套餐管理**：A方案（使用后端API）

---

## 📋 当前状态

### 素材管理
- ❌ 使用localStorage存储
- ❌ 超出配额：`Setting the value of 'materials' exceeded the quota`
- ❌ 没有后端API
- ❌ 图片使用Base64存储

### 套餐管理
- ❌ 使用localStorage存储
- ❌ 使用mock假数据
- ⚠️ 后端API不完整（缺少CREATE/UPDATE/DELETE）

---

## 🔧 实施方案

### 阶段1: 素材管理后端API（1小时）

#### 1.1 创建Material Model
**文件**: `backend/src/models/Material.js`

```javascript
const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['texture', 'color', 'pattern'], default: 'texture' },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'MaterialCategory' },
  image: { type: String }, // GridFS fileId
  tags: [String],
  properties: {
    材质: String,
    工艺: String
  },
  description: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'offline'], default: 'pending' },
  order: { type: Number, default: 0 },
  reviewBy: String,
  reviewAt: Date,
  reviewNote: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Material', MaterialSchema);
```

#### 1.2 创建MaterialCategory Model
**文件**: `backend/src/models/MaterialCategory.js`

```javascript
const mongoose = require('mongoose');

const MaterialCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'MaterialCategory' },
  order: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('MaterialCategory', MaterialCategorySchema);
```

#### 1.3 创建Material Controller
**文件**: `backend/src/controllers/materialController.js`

```javascript
const Material = require('../models/Material');
const MaterialCategory = require('../models/MaterialCategory');

// 获取所有材质
exports.list = async (req, res) => {
  const { categoryId, status } = req.query;
  const query = {};
  if (categoryId) query.categoryId = categoryId;
  if (status) query.status = status;
  
  const materials = await Material.find(query).sort({ order: 1, createdAt: -1 });
  res.json({ success: true, data: materials });
};

// 获取单个材质
exports.get = async (req, res) => {
  const material = await Material.findById(req.params.id);
  if (!material) return res.status(404).json({ success: false, message: '材质不存在' });
  res.json({ success: true, data: material });
};

// 创建材质
exports.create = async (req, res) => {
  const material = await Material.create(req.body);
  res.status(201).json({ success: true, data: material });
};

// 更新材质
exports.update = async (req, res) => {
  const material = await Material.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!material) return res.status(404).json({ success: false, message: '材质不存在' });
  res.json({ success: true, data: material });
};

// 删除材质
exports.delete = async (req, res) => {
  const material = await Material.findByIdAndDelete(req.params.id);
  if (!material) return res.status(404).json({ success: false, message: '材质不存在' });
  res.json({ success: true, message: '材质已删除' });
};

// 批量删除
exports.batchDelete = async (req, res) => {
  const { ids } = req.body;
  await Material.deleteMany({ _id: { $in: ids } });
  res.json({ success: true, message: '批量删除成功' });
};

// 统计
exports.stats = async (req, res) => {
  const total = await Material.countDocuments();
  const pending = await Material.countDocuments({ status: 'pending' });
  const approved = await Material.countDocuments({ status: 'approved' });
  const rejected = await Material.countDocuments({ status: 'rejected' });
  const offline = await Material.countDocuments({ status: 'offline' });
  
  res.json({ success: true, data: { total, pending, approved, rejected, offline } });
};

// 分类相关
exports.listCategories = async (req, res) => {
  const categories = await MaterialCategory.find().sort({ order: 1 });
  res.json({ success: true, data: categories });
};

exports.createCategory = async (req, res) => {
  const category = await MaterialCategory.create(req.body);
  res.status(201).json({ success: true, data: category });
};

exports.updateCategory = async (req, res) => {
  const category = await MaterialCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: category });
};

exports.deleteCategory = async (req, res) => {
  await MaterialCategory.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: '分类已删除' });
};
```

#### 1.4 创建Material Routes
**文件**: `backend/src/routes/materials.js`

```javascript
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const materialController = require('../controllers/materialController');

// 材质
router.get('/', materialController.list);
router.get('/stats', auth, materialController.stats);
router.get('/:id', materialController.get);
router.post('/', auth, materialController.create);
router.put('/:id', auth, materialController.update);
router.delete('/:id', auth, materialController.delete);
router.post('/batch-delete', auth, materialController.batchDelete);

// 分类
router.get('/categories/list', materialController.listCategories);
router.post('/categories', auth, materialController.createCategory);
router.put('/categories/:id', auth, materialController.updateCategory);
router.delete('/categories/:id', auth, materialController.deleteCategory);

module.exports = router;
```

#### 1.5 注册路由
**文件**: `backend/src/app.js`

```javascript
// 添加
app.use('/api/materials', require('./routes/materials'))
```

---

### 阶段2: 素材管理前端改造（30分钟）

#### 2.1 修改materialService.ts
改用API调用，移除localStorage：

```typescript
// Before
export const getAllMaterials = (): Material[] => {
  const data = localStorage.getItem(MATERIALS_KEY);
  return data ? JSON.parse(data) : [];
};

// After
export const getAllMaterials = async (): Promise<Material[]> => {
  const response = await apiClient.get('/materials');
  return response.data.data;
};
```

#### 2.2 图片改用GridFS
材质图片上传使用uploadFile()，保存fileId而不是Base64

---

### 阶段3: 套餐管理后端API（30分钟）

#### 3.1 创建Package Model
**文件**: `backend/src/models/Package.js`

```javascript
const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  channelPrice: Number,
  designerPrice: Number,
  image: String, // GridFS fileId
  images: [String], // GridFS fileIds
  tags: [String],
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    optional: Boolean
  }],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Package', PackageSchema);
```

#### 3.2 补全Package Controller
**文件**: `backend/src/controllers/packageController.js`

添加缺失的CREATE/UPDATE/DELETE方法

---

### 阶段4: 套餐管理前端改造（30分钟）

移除localStorage，改用API调用

---

## ⏱️ 时间估算

| 任务 | 时间 | 优先级 |
|------|------|--------|
| 素材管理后端API | 1小时 | 高 |
| 素材管理前端改造 | 30分钟 | 高 |
| 套餐管理后端API | 30分钟 | 中 |
| 套餐管理前端改造 | 30分钟 | 中 |
| **总计** | **2.5小时** | |

---

## 🚀 实施顺序

### 优先级1: 素材管理（紧急）
原因：localStorage超出配额，功能不可用

### 优先级2: 套餐管理
原因：当前可用，但需要改进

---

## 📝 用户需求

### 素材管理需求

1. **新建材质一定是要单独建一栏出来的**
   - 修改前端分组逻辑
   - 不自动归类到other

2. **SKU列表添加SKU**
   - 在材质的SKU列表中添加SKU
   - 继承父材质的分类

3. **图片改用GridFS**
   - 不用localStorage存储Base64
   - 使用uploadFile()上传到GridFS

---

## 🎯 立即开始

我可以立即开始实施：

**选项A**: 先做素材管理（1.5小时）
- 创建后端API
- 修改前端
- 图片改用GridFS
- 修复分组逻辑

**选项B**: 两个一起做（2.5小时）
- 素材管理 + 套餐管理
- 一次性解决所有问题

**你想选择哪个？**

---

## 📋 注意事项

### 数据迁移

**localStorage → MongoDB**：
- 现有素材数据需要手动迁移
- 或提供迁移脚本
- 或重新创建

### 图片迁移

**Base64 → GridFS**：
- 旧Base64图片需要重新上传
- 显示为占位图
- 必须重新上传

---

**准备好开始了吗？请选择方案A或B！** 🚀
