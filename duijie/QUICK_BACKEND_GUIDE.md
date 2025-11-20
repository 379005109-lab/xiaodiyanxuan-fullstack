# ⚡ 后端快速实现指南

**两个新模块的快速实现步骤**

---

## 📋 模块 1: 首页图片管理

### 数据库集合
```javascript
// WebsiteImage
{
  section: 'supply-chain' | 'full-house' | 'pricing' | 'designer-resources' | 'mini-program',
  items: [
    { id, title, url, image, order, createdAt, updatedAt }
  ],
  createdAt, updatedAt, updatedBy
}
```

### API 端点 (6 个)
```
GET    /api/website-images              - 获取所有配置
GET    /api/website-images/:section     - 获取特定部分
POST   /api/website-images/save         - 保存配置 (admin)
PUT    /api/website-images/:section/:id - 更新项目 (admin)
DELETE /api/website-images/:section/:id - 删除项目 (admin)
POST   /api/upload                      - 上传图片 (已有)
```

### 核心逻辑
```javascript
// 获取所有配置
async getAllImages() {
  return await WebsiteImage.find();
}

// 保存配置
async saveImages(section, items) {
  return await WebsiteImage.findOneAndUpdate(
    { section },
    { items, updatedAt: new Date() },
    { upsert: true, new: true }
  );
}

// 更新项目
async updateImage(section, itemId, data) {
  return await WebsiteImage.findOneAndUpdate(
    { section, 'items.id': itemId },
    { $set: { 'items.$': { ...data, updatedAt: new Date() } } },
    { new: true }
  );
}

// 删除项目
async deleteImage(section, itemId) {
  return await WebsiteImage.findOneAndUpdate(
    { section },
    { $pull: { items: { id: itemId } } },
    { new: true }
  );
}
```

---

## 📋 模块 2: 设计管理

### 数据库集合
```javascript
// DesignRequest
{
  userId,
  userName,
  userPhone,
  userEmail,
  description,
  images: [String],
  status: 'pending' | 'in_progress' | 'completed' | 'rejected',
  notes,
  assignedTo,
  createdAt, updatedAt, completedAt
}
```

### API 端点 (9 个)
```
GET    /api/design-requests                    - 获取列表 (admin)
GET    /api/design-requests/:id                - 获取详情 (admin)
POST   /api/design-requests                    - 提交需求 (公开)
PUT    /api/design-requests/:id/status         - 更新状态 (admin)
PUT    /api/design-requests/:id/notes          - 更新备注 (admin)
PUT    /api/design-requests/:id/assign         - 分配设计师 (admin)
DELETE /api/design-requests/:id                - 删除需求 (admin)
GET    /api/design-requests/stats/summary      - 获取统计 (admin)
POST   /api/design-requests/upload             - 上传图片 (已有)
```

### 核心逻辑
```javascript
// 获取列表
async getAllRequests(query) {
  const { status, page = 1, limit = 10, search } = query;
  const filter = {};
  if (status) filter.status = status;
  if (search) filter.$or = [
    { userName: { $regex: search, $options: 'i' } },
    { userPhone: { $regex: search, $options: 'i' } }
  ];
  
  const total = await DesignRequest.countDocuments(filter);
  const data = await DesignRequest.find(filter)
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });
  
  return { data, total, page, limit, pages: Math.ceil(total / limit) };
}

// 提交需求
async createRequest(data) {
  return await DesignRequest.create({
    ...data,
    status: 'pending',
    createdAt: new Date()
  });
}

// 更新状态
async updateStatus(id, status) {
  return await DesignRequest.findByIdAndUpdate(
    id,
    { status, updatedAt: new Date() },
    { new: true }
  );
}

// 获取统计
async getStats() {
  return await DesignRequest.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
      }
    }
  ]);
}
```

---

## 🔧 实现步骤

### 第 1 步: 创建模型 (10 分钟)
```bash
# 创建文件
touch src/models/WebsiteImage.js
touch src/models/DesignRequest.js

# 复制上面的 Schema 代码
```

### 第 2 步: 创建 Controllers (30 分钟)
```bash
# 创建文件
touch src/controllers/websiteImageController.js
touch src/controllers/designRequestController.js

# 实现上面的核心逻辑
```

### 第 3 步: 创建 Routes (15 分钟)
```bash
# 创建文件
touch src/routes/websiteImageRoutes.js
touch src/routes/designRequestRoutes.js

# 配置路由
```

### 第 4 步: 集成到主服务器 (5 分钟)
```javascript
// 在 server.js 中添加
import websiteImageRoutes from './routes/websiteImageRoutes.js';
import designRequestRoutes from './routes/designRequestRoutes.js';

app.use('/api/website-images', websiteImageRoutes);
app.use('/api/design-requests', designRequestRoutes);
```

### 第 5 步: 测试 (30 分钟)
```bash
# 启动服务器
npm run dev

# 测试 API (使用 curl 或 Postman)
curl http://localhost:8080/api/website-images
curl http://localhost:8080/api/design-requests
```

---

## 📝 权限中间件

```javascript
// 在 routes 中使用
router.post('/save', authMiddleware, adminMiddleware, saveImages);

// adminMiddleware 应该检查用户角色
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
```

---

## 🧪 测试命令

### 测试首页图片管理
```bash
# 获取所有配置
curl http://localhost:8080/api/website-images

# 获取特定部分
curl http://localhost:8080/api/website-images/supply-chain

# 保存配置 (需要 token)
curl -X POST http://localhost:8080/api/website-images/save \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "section": "supply-chain",
    "items": [
      { "id": "1", "title": "供应链", "url": "/supply-chain", "image": "url", "order": 1 }
    ]
  }'
```

### 测试设计管理
```bash
# 获取列表
curl http://localhost:8080/api/design-requests \
  -H "Authorization: Bearer YOUR_TOKEN"

# 提交需求
curl -X POST http://localhost:8080/api/design-requests \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "张三",
    "userPhone": "13800138000",
    "userEmail": "zhangsan@example.com",
    "description": "三室两厅",
    "images": ["url1", "url2"]
  }'

# 更新状态
curl -X PUT http://localhost:8080/api/design-requests/ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "in_progress" }'
```

---

## 📊 时间表

| 任务 | 时间 |
|------|------|
| 创建模型 | 10 分钟 |
| 创建 Controllers | 30 分钟 |
| 创建 Routes | 15 分钟 |
| 集成到主服务器 | 5 分钟 |
| 测试 | 30 分钟 |
| **总计** | **1.5 小时** |

---

## ✅ 检查清单

### 模型
- [ ] WebsiteImage 模型创建
- [ ] DesignRequest 模型创建
- [ ] 索引配置

### Controllers
- [ ] websiteImageController 完成
- [ ] designRequestController 完成
- [ ] 错误处理完善

### Routes
- [ ] websiteImageRoutes 完成
- [ ] designRequestRoutes 完成
- [ ] 权限验证完成

### 集成
- [ ] 主服务器集成完成
- [ ] 路由注册完成
- [ ] 中间件配置完成

### 测试
- [ ] 所有 API 端点测试通过
- [ ] 权限验证通过
- [ ] 错误处理测试通过
- [ ] 性能测试通过

---

**现在就开始实现吧!** 🚀

---

**最后更新**: 2024-11-20 15:20 UTC
