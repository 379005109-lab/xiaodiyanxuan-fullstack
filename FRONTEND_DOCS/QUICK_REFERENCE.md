# 🚀 快速参考卡片

## 📌 后端服务

### 启动/重启
```bash
# 启动
pm2 start ecosystem.config.js

# 重启
pm2 restart xiaodiyanxuan-api

# 查看状态
pm2 status

# 查看日志
pm2 logs xiaodiyanxuan-api
```

### 健康检查
```bash
curl http://localhost:8080/health
```

---

## 🔐 认证

### 获取令牌
```bash
curl -X POST http://localhost:8080/api/auth/wxlogin \
  -H "Content-Type: application/json" \
  -d '{"code":"test_code_123"}'
```

### 使用令牌
```bash
curl -X GET http://localhost:8080/api/notifications \
  -H "Authorization: Bearer {token}"
```

---

## 📢 通知 API

### 获取列表
```bash
GET /api/notifications?page=1&pageSize=10
```

### 获取未读数
```bash
GET /api/notifications/unread/count
```

### 获取统计
```bash
GET /api/notifications/stats
```

### 创建通知
```bash
POST /api/notifications
{
  "type": "order",
  "title": "标题",
  "message": "内容"
}
```

### 标记已读
```bash
PATCH /api/notifications/{id}/read
{ "read": true }
```

### 标记全部已读
```bash
PATCH /api/notifications/mark-all-read
```

### 删除通知
```bash
DELETE /api/notifications/{id}
```

### 清空所有
```bash
DELETE /api/notifications/clear-all
```

---

## 🔄 对比 API

### 获取列表
```bash
GET /api/compare?page=1&pageSize=10
```

### 获取统计
```bash
GET /api/compare/stats
```

### 添加到对比
```bash
POST /api/compare
{
  "productId": "product_123",
  "skuId": "sku_456",
  "selectedMaterials": {
    "fabric": "棉麻",
    "filling": "羽绒",
    "frame": "实木",
    "leg": "金属"
  }
}
```

### 移除对比
```bash
DELETE /api/compare/{productId}
{ "skuId": "sku_456" }
```

### 清空对比
```bash
DELETE /api/compare
```

---

## 📊 响应格式

### 成功
```json
{
  "success": true,
  "data": {...},
  "message": "操作成功"
}
```

### 分页
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### 错误
```json
{
  "success": false,
  "message": "错误信息",
  "error": {...},
  "code": 400
}
```

---

## 🧪 测试

### 运行验证
```bash
node /home/devbox/project/backend/verify-apis.js
```

### 简单测试
```bash
bash /home/devbox/project/backend/test-api-simple.sh
```

---

## 📁 关键文件

| 文件 | 说明 |
|------|------|
| `/backend/src/routes/notifications.js` | 通知路由 |
| `/backend/src/routes/compare.js` | 对比路由 |
| `/backend/src/controllers/notificationController.js` | 通知控制器 |
| `/backend/src/controllers/compareController.js` | 对比控制器 |
| `/backend/src/utils/response.js` | 响应工具 |
| `/backend/src/middleware/auth.js` | 认证中间件 |

---

## 🔗 文档

| 文档 | 说明 |
|------|------|
| `BACKEND_INTEGRATION_COMPLETE.md` | 完整报告 |
| `FRONTEND_BACKEND_INTEGRATION_GUIDE.md` | 集成指南 |
| `INTEGRATION_SUMMARY.md` | 总结 |
| `QUICK_REFERENCE.md` | 本文档 |

---

## ✅ 检查清单

- [x] 通知 API (8个端点)
- [x] 对比 API (5个端点)
- [x] 路由顺序修复
- [x] 响应格式标准化
- [x] 认证中间件
- [x] 错误处理
- [x] 数据库连接
- [x] 测试脚本
- [x] 文档完成

---

**状态**: ✅ 完全就绪  
**时间**: 2025-11-17
