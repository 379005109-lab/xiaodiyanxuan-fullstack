# 🔧 后端集成计划 - 两个新模块

**时间**: 2024-11-20 15:20 UTC
**前端完成**: ✅ 已完成
**后端需求**: 2 个新模块

---

## 📋 模块清单

### 模块 1️⃣: 首页图片管理 (Website Image Management)

**前端功能** (已完成):
- ✅ 强大供应链体系 - 图片上传 + URL 配置
- ✅ 覆盖全屋品类 - 动态新增/删除分类 + 图片/URL 配置
- ✅ 品质透明、价格公开 - 动态新增/删除款式 + 图片/URL 配置
- ✅ 设计师专属资源库 - URL 配置
- ✅ 微信小程序区 - 预留上传窗口

**后端需要实现**:

#### 数据模型 (MongoDB Schema)
```javascript
// WebsiteImage Schema
{
  _id: ObjectId,
  section: String, // 'supply-chain', 'full-house', 'pricing', 'designer-resources', 'mini-program'
  items: [
    {
      id: String,
      title: String,
      url: String,
      image: String, // 图片 URL 或 GridFS ID
      order: Number,
      createdAt: Date,
      updatedAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date,
  updatedBy: ObjectId // 用户 ID
}
```

#### API 端点

**1. 获取所有首页图片配置**
```
GET /api/website-images
Response:
{
  success: true,
  data: {
    supplyChain: { image: String, url: String },
    fullHouse: [{ id, title, url, image, order }],
    pricing: [{ id, title, url, image, order }],
    designerResources: { url: String },
    miniProgram: { images: [] }
  }
}
```

**2. 获取特定部分的图片配置**
```
GET /api/website-images/:section
Response:
{
  success: true,
  data: { ... }
}
```

**3. 保存首页图片配置** (需要 admin 权限)
```
POST /api/website-images/save
Body:
{
  section: String,
  items: [{ id, title, url, image, order }]
}
Response:
{
  success: true,
  message: "配置已保存",
  data: { ... }
}
```

**4. 更新特定项目**
```
PUT /api/website-images/:section/:itemId
Body:
{
  title: String,
  url: String,
  image: String,
  order: Number
}
Response:
{
  success: true,
  data: { ... }
}
```

**5. 删除特定项目**
```
DELETE /api/website-images/:section/:itemId
Response:
{
  success: true,
  message: "已删除"
}
```

**6. 上传图片** (使用现有的文件上传)
```
POST /api/upload
FormData:
{
  file: File,
  type: 'website-image'
}
Response:
{
  success: true,
  url: String // 图片 URL
}
```

---

### 模块 2️⃣: 设计管理 (Design Management)

**前端功能** (已完成):
- ✅ 查看所有用户提交的设计需求
- ✅ 按状态筛选 (待处理、处理中、已完成、已拒绝)
- ✅ 用户信息展示 (姓名、电话、邮箱)
- ✅ 需求描述和图片预览
- ✅ 状态管理和备注编辑
- ✅ 删除功能

**后端需要实现**:

#### 数据模型 (MongoDB Schema)
```javascript
// DesignRequest Schema
{
  _id: ObjectId,
  userId: ObjectId, // 用户 ID (如果已登录)
  userName: String, // 用户名
  userPhone: String, // 电话
  userEmail: String, // 邮箱
  description: String, // 需求描述
  images: [String], // 图片 URL 或 GridFS ID 数组
  status: String, // 'pending', 'in_progress', 'completed', 'rejected'
  notes: String, // 管理员备注
  assignedTo: ObjectId, // 分配给的设计师 ID
  createdAt: Date,
  updatedAt: Date,
  completedAt: Date // 完成时间
}
```

#### API 端点

**1. 获取所有设计需求** (需要 admin 权限)
```
GET /api/design-requests?status=pending&page=1&limit=10
Query:
  status: String (可选) - 'pending', 'in_progress', 'completed', 'rejected'
  page: Number (默认 1)
  limit: Number (默认 10)
  search: String (可选) - 按用户名或电话搜索

Response:
{
  success: true,
  data: [
    {
      _id: ObjectId,
      userName: String,
      userPhone: String,
      userEmail: String,
      description: String,
      images: [String],
      status: String,
      notes: String,
      createdAt: Date,
      updatedAt: Date
    }
  ],
  pagination: {
    total: Number,
    page: Number,
    limit: Number,
    pages: Number
  }
}
```

**2. 获取单个设计需求详情**
```
GET /api/design-requests/:id
Response:
{
  success: true,
  data: { ... }
}
```

**3. 提交设计需求** (用户提交)
```
POST /api/design-requests
Body:
{
  userName: String,
  userPhone: String,
  userEmail: String (可选),
  description: String,
  images: [String] // 图片 URL 数组
}
Response:
{
  success: true,
  message: "设计需求已提交",
  data: { _id, ... }
}
```

**4. 更新设计需求状态** (需要 admin 权限)
```
PUT /api/design-requests/:id/status
Body:
{
  status: String // 'pending', 'in_progress', 'completed', 'rejected'
}
Response:
{
  success: true,
  data: { ... }
}
```

**5. 更新设计需求备注** (需要 admin 权限)
```
PUT /api/design-requests/:id/notes
Body:
{
  notes: String
}
Response:
{
  success: true,
  data: { ... }
}
```

**6. 分配设计需求给设计师** (需要 admin 权限)
```
PUT /api/design-requests/:id/assign
Body:
{
  designerId: ObjectId
}
Response:
{
  success: true,
  data: { ... }
}
```

**7. 删除设计需求** (需要 admin 权限)
```
DELETE /api/design-requests/:id
Response:
{
  success: true,
  message: "已删除"
}
```

**8. 上传设计需求图片**
```
POST /api/design-requests/upload
FormData:
{
  file: File,
  type: 'design-request'
}
Response:
{
  success: true,
  url: String // 图片 URL
}
```

**9. 获取设计需求统计** (需要 admin 权限)
```
GET /api/design-requests/stats/summary
Response:
{
  success: true,
  data: {
    total: Number,
    pending: Number,
    inProgress: Number,
    completed: Number,
    rejected: Number
  }
}
```

---

## 📁 后端文件结构

```
src/
├── models/
│   ├── WebsiteImage.js (新增)
│   └── DesignRequest.js (新增)
├── controllers/
│   ├── websiteImageController.js (新增)
│   └── designRequestController.js (新增)
├── routes/
│   ├── websiteImageRoutes.js (新增)
│   └── designRequestRoutes.js (新增)
└── server.js (修改 - 添加新路由)
```

---

## 🔧 实现步骤

### 第 1 步: 创建数据模型 (30 分钟)

**WebsiteImage.js**:
```javascript
import mongoose from 'mongoose';

const websiteImageSchema = new mongoose.Schema({
  section: {
    type: String,
    enum: ['supply-chain', 'full-house', 'pricing', 'designer-resources', 'mini-program'],
    required: true,
    unique: true
  },
  items: [{
    id: String,
    title: String,
    url: String,
    image: String,
    order: Number,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: mongoose.Schema.Types.ObjectId
});

export default mongoose.model('WebsiteImage', websiteImageSchema);
```

**DesignRequest.js**:
```javascript
import mongoose from 'mongoose';

const designRequestSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  userName: { type: String, required: true },
  userPhone: { type: String, required: true },
  userEmail: String,
  description: { type: String, required: true },
  images: [String],
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected'],
    default: 'pending'
  },
  notes: String,
  assignedTo: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: Date
});

export default mongoose.model('DesignRequest', designRequestSchema);
```

### 第 2 步: 创建 Controllers (1 小时)

**websiteImageController.js**:
- getAllImages()
- getImagesBySection()
- saveImages()
- updateImage()
- deleteImage()

**designRequestController.js**:
- getAllRequests()
- getRequestById()
- createRequest()
- updateStatus()
- updateNotes()
- assignDesigner()
- deleteRequest()
- getStats()

### 第 3 步: 创建 Routes (30 分钟)

**websiteImageRoutes.js**:
```javascript
router.get('/', getAllImages);
router.get('/:section', getImagesBySection);
router.post('/save', authMiddleware, adminMiddleware, saveImages);
router.put('/:section/:itemId', authMiddleware, adminMiddleware, updateImage);
router.delete('/:section/:itemId', authMiddleware, adminMiddleware, deleteImage);
```

**designRequestRoutes.js**:
```javascript
router.get('/', authMiddleware, adminMiddleware, getAllRequests);
router.get('/stats/summary', authMiddleware, adminMiddleware, getStats);
router.get('/:id', authMiddleware, adminMiddleware, getRequestById);
router.post('/', createRequest);
router.put('/:id/status', authMiddleware, adminMiddleware, updateStatus);
router.put('/:id/notes', authMiddleware, adminMiddleware, updateNotes);
router.put('/:id/assign', authMiddleware, adminMiddleware, assignDesigner);
router.delete('/:id', authMiddleware, adminMiddleware, deleteRequest);
```

### 第 4 步: 集成到主服务器 (15 分钟)

**server.js**:
```javascript
import websiteImageRoutes from './routes/websiteImageRoutes.js';
import designRequestRoutes from './routes/designRequestRoutes.js';

app.use('/api/website-images', websiteImageRoutes);
app.use('/api/design-requests', designRequestRoutes);
```

### 第 5 步: 测试 (1 小时)

- 单元测试
- 集成测试
- API 测试 (Postman/curl)

---

## 📊 开发时间估计

| 任务 | 时间 |
|------|------|
| 创建数据模型 | 30 分钟 |
| 创建 Controllers | 1 小时 |
| 创建 Routes | 30 分钟 |
| 集成到主服务器 | 15 分钟 |
| 测试 | 1 小时 |
| **总计** | **3 小时 15 分钟** |

---

## 🔐 权限要求

### 公开接口 (无需认证)
- GET /api/website-images
- GET /api/website-images/:section
- POST /api/design-requests (提交设计需求)

### 需要认证 (登录用户)
- 无

### 需要 Admin 权限
- POST /api/website-images/save
- PUT /api/website-images/:section/:itemId
- DELETE /api/website-images/:section/:itemId
- GET /api/design-requests
- GET /api/design-requests/:id
- PUT /api/design-requests/:id/status
- PUT /api/design-requests/:id/notes
- PUT /api/design-requests/:id/assign
- DELETE /api/design-requests/:id
- GET /api/design-requests/stats/summary

---

## 📝 前端集成计划

### 前端需要创建的 Services

**websiteImageService.ts**:
```typescript
export const websiteImageService = {
  getAllImages: () => apiClient.get('/website-images'),
  getImagesBySection: (section: string) => apiClient.get(`/website-images/${section}`),
  saveImages: (section: string, items: any[]) => apiClient.post('/website-images/save', { section, items }),
  updateImage: (section: string, itemId: string, data: any) => apiClient.put(`/website-images/${section}/${itemId}`, data),
  deleteImage: (section: string, itemId: string) => apiClient.delete(`/website-images/${section}/${itemId}`)
}
```

**designRequestService.ts**:
```typescript
export const designRequestService = {
  getAllRequests: (params?: any) => apiClient.get('/design-requests', { params }),
  getRequestById: (id: string) => apiClient.get(`/design-requests/${id}`),
  createRequest: (data: any) => apiClient.post('/design-requests', data),
  updateStatus: (id: string, status: string) => apiClient.put(`/design-requests/${id}/status`, { status }),
  updateNotes: (id: string, notes: string) => apiClient.put(`/design-requests/${id}/notes`, { notes }),
  assignDesigner: (id: string, designerId: string) => apiClient.put(`/design-requests/${id}/assign`, { designerId }),
  deleteRequest: (id: string) => apiClient.delete(`/design-requests/${id}`),
  getStats: () => apiClient.get('/design-requests/stats/summary')
}
```

---

## ✅ 验证清单

### 后端验证
- [ ] 数据模型创建完成
- [ ] Controllers 实现完成
- [ ] Routes 配置完成
- [ ] 主服务器集成完成
- [ ] 所有 API 端点测试通过
- [ ] 权限验证通过
- [ ] 错误处理完善
- [ ] 日志记录完善

### 前端验证
- [ ] Services 创建完成
- [ ] 组件集成完成
- [ ] 本地测试通过
- [ ] 公网测试通过
- [ ] 性能测试通过

### 整体验证
- [ ] 端到端测试通过
- [ ] 用户场景测试通过
- [ ] 安全测试通过
- [ ] 性能测试通过

---

## 🚀 部署流程

### 第 1 步: 后端部署
```bash
# 1. 提交代码
git add .
git commit -m "feat: add website image and design request modules"

# 2. 构建镜像
docker build -t furniture-server:v2 .

# 3. 推送镜像
docker push furniture-server:v2

# 4. 更新部署
kubectl set image deployment/furniture-server furniture-server=furniture-server:v2

# 5. 验证
kubectl rollout status deployment/furniture-server
```

### 第 2 步: 前端部署
```bash
# 1. 构建前端
npm run build

# 2. 构建镜像
docker build -t furniture-client:v2 .

# 3. 推送镜像
docker push furniture-client:v2

# 4. 更新部署
kubectl set image deployment/furniture-client furniture-client=furniture-client:v2

# 5. 验证
kubectl rollout status deployment/furniture-client
```

---

## 📞 沟通计划

### 每日进度同步
- 时间: 每天 10:00 AM
- 内容: 开发进度、遇到的问题、需要的支持

### 代码审查
- 时间: 开发完成后
- 参与: 前端、后端、技术负责人
- 内容: 代码质量、API 设计、安全性

### 集成测试
- 时间: 后端完成后
- 参与: 前端、后端、测试
- 内容: 端到端测试、性能测试

### 部署前会议
- 时间: 部署前 1 小时
- 参与: 全体
- 内容: 最后检查、应急预案

---

**下一步**: 后端团队开始实现这两个模块

**预计完成时间**: 3-4 小时 (包括测试)

---

**最后更新**: 2024-11-20 15:20 UTC
