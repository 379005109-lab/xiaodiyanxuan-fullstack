# 🔗 前后端集成指南

## 📋 概述

本指南说明如何在前端中集成后端 API，以及如何验证集成是否成功。

---

## 🎯 集成步骤

### 第1步：获取认证令牌

前端需要先通过微信登录获取 JWT 令牌。

**登录端点**:
```
POST /api/auth/wxlogin
```

**请求体**:
```json
{
  "code": "微信授权码"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "token": "JWT令牌",
    "user": {
      "id": "用户ID",
      "openId": "微信openId",
      "nickname": "用户昵称",
      "userType": "customer"
    }
  },
  "message": "操作成功"
}
```

### 第2步：在请求头中包含令牌

所有需要认证的请求都必须在请求头中包含令牌：

```
Authorization: Bearer {token}
```

**示例**:
```javascript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### 第3步：调用通知 API

#### 获取通知列表
```javascript
const response = await fetch('http://localhost:8080/api/notifications', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
const data = await response.json()
// 期望: { success: true, data: [...], pagination: {...} }
```

#### 获取未读通知数
```javascript
const response = await fetch('http://localhost:8080/api/notifications/unread/count', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const data = await response.json()
// 期望: { success: true, data: { unreadCount: 5 } }
```

#### 获取通知统计
```javascript
const response = await fetch('http://localhost:8080/api/notifications/stats', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const data = await response.json()
// 期望: { success: true, data: { total: 50, unread: 5, read: 45, byType: {...} } }
```

#### 创建通知
```javascript
const response = await fetch('http://localhost:8080/api/notifications', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'order',
    title: '新订单提醒',
    message: '您收到了一个新订单',
    relatedId: 'order_123',
    actionUrl: '/admin/orders/order_123'
  })
})
const data = await response.json()
// 期望: { success: true, data: {...}, message: '通知已创建' }
```

#### 标记通知为已读
```javascript
const response = await fetch(`http://localhost:8080/api/notifications/${notificationId}/read`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ read: true })
})
const data = await response.json()
// 期望: { success: true, data: {...}, message: '已标记为已读' }
```

#### 标记所有通知为已读
```javascript
const response = await fetch('http://localhost:8080/api/notifications/mark-all-read', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
})
const data = await response.json()
// 期望: { success: true, data: {...}, message: '已标记全部为已读' }
```

#### 删除通知
```javascript
const response = await fetch(`http://localhost:8080/api/notifications/${notificationId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const data = await response.json()
// 期望: { success: true, data: null, message: '已删除' }
```

#### 清空所有通知
```javascript
const response = await fetch('http://localhost:8080/api/notifications/clear-all', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
})
const data = await response.json()
// 期望: { success: true, data: {...}, message: '已清空' }
```

### 第4步：调用对比 API

#### 获取对比列表
```javascript
const response = await fetch('http://localhost:8080/api/compare', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const data = await response.json()
// 期望: { success: true, data: [...], pagination: {...} }
```

#### 获取对比统计
```javascript
const response = await fetch('http://localhost:8080/api/compare/stats', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const data = await response.json()
// 期望: { success: true, data: { total: 2, maxItems: 4, isFull: false, canAddMore: true } }
```

#### 添加到对比
```javascript
const response = await fetch('http://localhost:8080/api/compare', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    productId: 'product_123',
    skuId: 'sku_456',
    selectedMaterials: {
      fabric: '棉麻',
      filling: '羽绒',
      frame: '实木',
      leg: '金属'
    }
  })
})
const data = await response.json()
// 期望: { success: true, data: {...}, message: '已添加到对比列表' }
```

#### 移除对比项
```javascript
const response = await fetch('http://localhost:8080/api/compare/product_123', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ skuId: 'sku_456' })
})
const data = await response.json()
// 期望: { success: true, data: null, message: '已移除' }
```

#### 清空对比列表
```javascript
const response = await fetch('http://localhost:8080/api/compare', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
})
const data = await response.json()
// 期望: { success: true, data: null, message: '已清空' }
```

---

## 🧪 集成测试检查清单

### 通知 API 测试
- [ ] 获取通知列表 - 返回分页数据
- [ ] 获取未读通知数 - 返回正确的计数
- [ ] 获取通知统计 - 返回统计信息
- [ ] 创建通知 - 成功创建并返回通知对象
- [ ] 标记通知为已读 - 成功更新状态
- [ ] 标记所有通知为已读 - 批量更新成功
- [ ] 删除通知 - 成功删除
- [ ] 清空所有通知 - 批量删除成功

### 对比 API 测试
- [ ] 获取对比列表 - 返回分页数据
- [ ] 获取对比统计 - 返回统计信息
- [ ] 添加到对比 - 成功添加
- [ ] 添加到对比（重复）- 返回错误提示
- [ ] 添加到对比（超过限制）- 返回错误提示
- [ ] 移除对比项 - 成功移除
- [ ] 清空对比列表 - 批量删除成功

### 认证测试
- [ ] 无令牌请求 - 返回 401 错误
- [ ] 无效令牌请求 - 返回 401 错误
- [ ] 有效令牌请求 - 成功返回数据

### 错误处理测试
- [ ] 缺少必需字段 - 返回 400 错误
- [ ] 无效的 ID - 返回 404 错误
- [ ] 服务器错误 - 返回 500 错误

---

## 📊 响应格式规范

### 成功响应
```json
{
  "success": true,
  "data": {...},
  "message": "操作成功"
}
```

### 分页响应
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

### 错误响应
```json
{
  "success": false,
  "message": "错误信息",
  "error": {...},
  "code": 400
}
```

---

## 🔐 认证错误处理

当收到 401 错误时，前端应该：
1. 清除本地存储的令牌
2. 重定向到登录页面
3. 提示用户重新登录

```javascript
if (response.status === 401) {
  // 清除令牌
  localStorage.removeItem('token')
  // 重定向到登录
  window.location.href = '/login'
}
```

---

## 🚀 部署配置

### 开发环境
```
后端 URL: http://localhost:8080
```

### 生产环境
```
后端 URL: https://api.example.com
```

### 环境变量配置
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080'
```

---

## 📝 常见问题

### Q1: 如何处理 CORS 错误？
**A**: 后端已配置 CORS，允许跨域请求。如果仍然出现 CORS 错误，检查：
1. 请求头中是否包含 `Content-Type: application/json`
2. 后端 CORS 配置是否正确
3. 浏览器是否阻止了跨域请求

### Q2: 令牌过期后怎么办？
**A**: 当收到 401 错误时，应该：
1. 清除本地令牌
2. 重定向到登录页面
3. 用户重新登录获取新令牌

### Q3: 如何调试 API 请求？
**A**: 使用浏览器开发者工具：
1. 打开 Network 标签
2. 查看请求和响应
3. 检查请求头和响应体

### Q4: 分页如何工作？
**A**: 通过查询参数控制分页：
```
GET /api/notifications?page=1&pageSize=10
```

---

## 🔗 相关资源

- [后端对接完成报告](./BACKEND_INTEGRATION_COMPLETE.md)
- [后端集成指南](./BACKEND_INTEGRATION_GUIDE.md)
- [导出清单](./📦_EXPORT_FOR_BACKEND.md)

---

**集成指南版本**: 1.0.0  
**更新时间**: 2025-11-17  
**状态**: ✅ 完全就绪
