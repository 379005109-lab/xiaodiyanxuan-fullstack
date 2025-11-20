# 🔧 后端开发任务 - 两个新模块

**发布时间**: 2024-11-20 15:30 UTC
**前端状态**: ✅ 完成并部署
**后端任务**: 实现两个新模块的 API

---

## 📋 任务概览

### 模块 1: 首页图片管理 (Website Image Management)
- **功能**: 管理首页各部分的图片和 URL 配置
- **前端状态**: ✅ 完成
- **后端需要**: MongoDB 模型 + Controller + Routes + 6 个 API 端点

### 模块 2: 设计管理 (Design Management)
- **功能**: 管理用户提交的设计需求
- **前端状态**: ✅ 完成
- **后端需要**: MongoDB 模型 + Controller + Routes + 9 个 API 端点

---

## 📚 详细文档

### 完整的后端集成计划
**文件**: `/home/devbox/project/duijie/BACKEND_INTEGRATION_PLAN.md`

包含:
- 详细的数据模型设计
- 所有 API 端点的完整说明
- 请求/响应格式
- 权限要求
- 实现步骤
- 代码示例

### 快速实现指南
**文件**: `/home/devbox/project/duijie/QUICK_BACKEND_GUIDE.md`

包含:
- 快速实现步骤
- 核心逻辑代码
- 测试命令
- 检查清单
- 时间估计

---

## 🎯 快速开始

### 第 1 步: 阅读文档
1. 打开 `BACKEND_INTEGRATION_PLAN.md` - 了解完整需求
2. 打开 `QUICK_BACKEND_GUIDE.md` - 快速实现

### 第 2 步: 创建模型
```bash
# 创建两个 MongoDB 模型
src/models/WebsiteImage.js
src/models/DesignRequest.js
```

### 第 3 步: 创建 Controllers
```bash
# 创建两个 Controllers
src/controllers/websiteImageController.js
src/controllers/designRequestController.js
```

### 第 4 步: 创建 Routes
```bash
# 创建两个 Routes
src/routes/websiteImageRoutes.js
src/routes/designRequestRoutes.js
```

### 第 5 步: 集成到主服务器
```bash
# 修改 src/server.js
# 添加两个新路由
```

### 第 6 步: 测试
```bash
# 测试所有 API 端点
# 验证权限
# 验证错误处理
```

---

## 📊 API 端点总览

### 首页图片管理 (6 个端点)
```
GET    /api/website-images              获取所有配置
GET    /api/website-images/:section     获取特定部分
POST   /api/website-images/save         保存配置 (admin)
PUT    /api/website-images/:section/:id 更新项目 (admin)
DELETE /api/website-images/:section/:id 删除项目 (admin)
POST   /api/upload                      上传图片 (已有)
```

### 设计管理 (9 个端点)
```
GET    /api/design-requests                    获取列表 (admin)
GET    /api/design-requests/:id                获取详情 (admin)
POST   /api/design-requests                    提交需求 (公开)
PUT    /api/design-requests/:id/status         更新状态 (admin)
PUT    /api/design-requests/:id/notes          更新备注 (admin)
PUT    /api/design-requests/:id/assign         分配设计师 (admin)
DELETE /api/design-requests/:id                删除需求 (admin)
GET    /api/design-requests/stats/summary      获取统计 (admin)
POST   /api/design-requests/upload             上传图片 (已有)
```

---

## ⏱️ 时间估计

| 任务 | 时间 |
|------|------|
| 创建模型 | 10 分钟 |
| 创建 Controllers | 30 分钟 |
| 创建 Routes | 15 分钟 |
| 集成到主服务器 | 5 分钟 |
| 测试 | 30 分钟 |
| **总计** | **1.5 小时** |

---

## 📁 文件结构

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
└── server.js (修改)
```

---

## 🔐 权限要求

### 公开接口 (无需认证)
- GET /api/website-images
- GET /api/website-images/:section
- POST /api/design-requests (提交设计需求)

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
  -d '{"section":"supply-chain","items":[...]}'
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
    "userName":"张三",
    "userPhone":"13800138000",
    "description":"三室两厅",
    "images":["url1","url2"]
  }'

# 更新状态
curl -X PUT http://localhost:8080/api/design-requests/ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}'
```

---

## ✅ 完成检查清单

### 模型
- [ ] WebsiteImage 模型创建
- [ ] DesignRequest 模型创建

### Controllers
- [ ] websiteImageController 完成
- [ ] designRequestController 完成

### Routes
- [ ] websiteImageRoutes 完成
- [ ] designRequestRoutes 完成

### 集成
- [ ] 主服务器集成完成
- [ ] 路由注册完成

### 测试
- [ ] 所有 API 端点测试通过
- [ ] 权限验证通过
- [ ] 错误处理测试通过

---

## 📞 联系方式

有任何问题，请查看:
- 详细计划: `/home/devbox/project/duijie/BACKEND_INTEGRATION_PLAN.md`
- 快速指南: `/home/devbox/project/duijie/QUICK_BACKEND_GUIDE.md`

---

## 🚀 下一步

1. **阅读详细文档** - 了解完整需求
2. **按照快速指南实现** - 1.5 小时完成
3. **本地测试** - 验证所有端点
4. **提交代码** - 准备部署

---

**准备好了吗? 让我们开始吧!** 🎉

---

**最后更新**: 2024-11-20 15:30 UTC
