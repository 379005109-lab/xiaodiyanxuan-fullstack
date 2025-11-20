# 🚀 前后端集成部署指南

**文档版本**: 1.0  
**更新时间**: 2025-11-20  
**状态**: ✅ 生产就绪

---

## 📋 快速概览

### 系统架构
```
前端应用                          后端 API                        数据库
(React + Vite)                  (Node.js + Express)            (MongoDB)
https://lgpzubdtdxjf.sealoshzh.site  →  https://pkochbpmcgaa.sealoshzh.site/api  →  MongoDB
```

### 关键信息
- **前端地址**: https://lgpzubdtdxjf.sealoshzh.site
- **后端地址**: https://pkochbpmcgaa.sealoshzh.site
- **API 前缀**: `/api`
- **测试账号**: zcd / asd123
- **部署环境**: Sealos Kubernetes

---

## 🔧 后端当前状态

### ✅ 已完成
- ✅ 31 个 API 接口全部实现
- ✅ 11 个数据模型已创建
- ✅ MongoDB 数据库已连接
- ✅ JWT 认证系统已完成
- ✅ 文件上传功能已实现
- ✅ CORS 已配置
- ✅ 本地服务运行正常 (http://localhost:8080)
- ✅ Kubernetes 部署已完成

### 📊 API 端点总数

| 模块 | 端点数 | 状态 |
|------|--------|------|
| 认证 (Auth) | 2 | ✅ |
| 用户 (Users) | 3 | ✅ |
| 产品 (Products) | 5 | ✅ |
| 分类 (Categories) | 7 | ✅ |
| 购物车 (Cart) | 4 | ✅ |
| 订单 (Orders) | 3 | ✅ |
| 套餐 (Packages) | 2 | ✅ |
| 砍价 (Bargains) | 2 | ✅ |
| 收藏 (Favorites) | 2 | ✅ |
| 通知 (Notifications) | 8 | ✅ |
| 对比 (Compare) | 5 | ✅ |
| 文件 (Files) | 5 | ✅ |
| **总计** | **31** | **✅** |

---

## 🌐 前端 API 配置指南

### 1️⃣ 环境变量配置

在前端项目中创建 `.env.production` 文件：

```env
# 生产环境 API 配置
VITE_API_URL=https://pkochbpmcgaa.sealoshzh.site/api
VITE_PUBLIC_URL=https://lgpzubdtdxjf.sealoshzh.site

# 本地开发环境（可选）
# VITE_API_URL=http://localhost:8080/api
```

### 2️⃣ API 客户端配置

在 `src/lib/apiClient.ts` 中配置：

```typescript
import axios from 'axios'

// 自动检测环境
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:8080/api' : '/api')

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加 Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器 - 处理错误
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期，清除并重定向到登录
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

### 3️⃣ Vite 代理配置（本地开发）

在 `vite.config.ts` 中配置：

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})
```

---

## 📡 API 端点完整列表

### 🔐 认证 API

#### 1. 用户名/密码登录
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "zcd",
  "password": "asd123"
}

响应:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "...",
      "username": "zcd",
      "role": "admin"
    }
  }
}
```

#### 2. 微信登录
```
POST /api/auth/wxlogin
Content-Type: application/json

{
  "code": "微信授权码"
}

响应:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { ... }
  }
}
```

### 👤 用户 API

#### 1. 获取当前用户信息
```
GET /api/users/me
Authorization: Bearer {token}

响应:
{
  "success": true,
  "data": {
    "id": "...",
    "username": "zcd",
    "email": "zcd@example.com",
    "role": "admin",
    "profile": { ... }
  }
}
```

#### 2. 更新用户信息
```
PATCH /api/users/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "new@example.com",
  "phone": "13800138000"
}
```

#### 3. 获取用户列表
```
GET /api/users?page=1&limit=10
Authorization: Bearer {token}

响应:
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

### 📦 产品 API

#### 1. 获取产品列表
```
GET /api/products?page=1&limit=20&category=xxx
Authorization: Bearer {token}

响应:
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "产品名称",
      "price": 99.99,
      "category": "...",
      "images": ["url1", "url2"],
      "specs": { ... }
    }
  ],
  "pagination": { ... }
}
```

#### 2. 获取产品详情
```
GET /api/products/:id
Authorization: Bearer {token}

响应:
{
  "success": true,
  "data": {
    "id": "...",
    "name": "产品名称",
    "description": "...",
    "price": 99.99,
    "images": [...],
    "specs": { ... },
    "reviews": [...]
  }
}
```

#### 3. 创建产品
```
POST /api/products
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "产品名称",
  "description": "描述",
  "price": 99.99,
  "category": "分类ID",
  "specs": { ... }
}
```

#### 4. 更新产品
```
PATCH /api/products/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "新名称",
  "price": 199.99
}
```

#### 5. 删除产品
```
DELETE /api/products/:id
Authorization: Bearer {token}
```

### 🛒 购物车 API

#### 1. 获取购物车
```
GET /api/cart
Authorization: Bearer {token}

响应:
{
  "success": true,
  "data": {
    "items": [
      {
        "productId": "...",
        "quantity": 2,
        "price": 99.99
      }
    ],
    "total": 199.98
  }
}
```

#### 2. 添加到购物车
```
POST /api/cart
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "...",
  "quantity": 1,
  "specs": { ... }
}
```

#### 3. 更新购物车项
```
PATCH /api/cart/:itemId
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity": 3
}
```

#### 4. 删除购物车项
```
DELETE /api/cart/:itemId
Authorization: Bearer {token}
```

### 📋 订单 API

#### 1. 获取订单列表
```
GET /api/orders?page=1&limit=10&status=pending
Authorization: Bearer {token}

响应:
{
  "success": true,
  "data": [
    {
      "id": "...",
      "orderNumber": "ORD-2025-001",
      "status": "pending",
      "total": 299.97,
      "items": [...],
      "createdAt": "2025-11-20T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

#### 2. 获取订单详情
```
GET /api/orders/:id
Authorization: Bearer {token}
```

#### 3. 创建订单
```
POST /api/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [
    {
      "productId": "...",
      "quantity": 2,
      "price": 99.99
    }
  ],
  "shippingAddress": "...",
  "paymentMethod": "wechat"
}
```

### 🏷️ 分类 API

#### 1. 获取分类列表
```
GET /api/categories
Authorization: Bearer {token}

响应:
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "沙发",
      "icon": "url",
      "description": "..."
    }
  ]
}
```

#### 2. 创建分类
```
POST /api/categories
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "新分类",
  "description": "描述"
}
```

#### 3. 更新分类
```
PATCH /api/categories/:id
Authorization: Bearer {token}
```

#### 4. 删除分类
```
DELETE /api/categories/:id
Authorization: Bearer {token}
```

#### 5. 上传分类图片
```
POST /api/categories/:id/upload-image
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: <image file>
```

#### 6. 上传分类图标
```
POST /api/categories/:id/upload-icon
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: <icon file>
```

#### 7. 获取分类统计
```
GET /api/categories/stats
Authorization: Bearer {token}
```

### 📦 套餐 API

#### 1. 获取套餐列表
```
GET /api/packages
Authorization: Bearer {token}
```

#### 2. 创建套餐
```
POST /api/packages
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "套餐名称",
  "description": "描述",
  "products": ["productId1", "productId2"],
  "price": 299.99
}
```

### 💰 砍价 API

#### 1. 获取砍价列表
```
GET /api/bargains
Authorization: Bearer {token}
```

#### 2. 创建砍价
```
POST /api/bargains
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "...",
  "targetPrice": 79.99,
  "currentPrice": 99.99
}
```

### ❤️ 收藏 API

#### 1. 获取收藏列表
```
GET /api/favorites
Authorization: Bearer {token}
```

#### 2. 添加收藏
```
POST /api/favorites
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "..."
}
```

### 🔔 通知 API

#### 1. 获取通知列表
```
GET /api/notifications
Authorization: Bearer {token}
```

#### 2. 标记通知为已读
```
PATCH /api/notifications/:id/read
Authorization: Bearer {token}
```

#### 3. 获取未读通知数
```
GET /api/notifications/unread/count
Authorization: Bearer {token}
```

### 📁 文件 API

#### 1. 上传文件
```
POST /api/files/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: <file>

响应:
{
  "success": true,
  "data": {
    "fileId": "...",
    "url": "https://pkochbpmcgaa.sealoshzh.site/api/files/...",
    "filename": "...",
    "size": 12345
  }
}
```

#### 2. 获取文件
```
GET /api/files/:fileId
Authorization: Bearer {token}
```

#### 3. 删除文件
```
DELETE /api/files/:fileId
Authorization: Bearer {token}
```

---

## 🧪 测试步骤

### 1️⃣ 本地开发测试

```bash
# 前端项目目录
cd /path/to/frontend

# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 打开浏览器
# http://localhost:5173 (或 3000)

# 4. 测试登录
# 用户名: zcd
# 密码: asd123
```

### 2️⃣ 后端本地测试

```bash
# 后端项目目录
cd /home/devbox/project/backend

# 1. 启动后端服务
pm2 start ecosystem.config.js

# 2. 检查服务状态
pm2 status

# 3. 查看日志
pm2 logs xiaodiyanxuan-api

# 4. 测试 API
curl http://localhost:8080/health
```

### 3️⃣ 集成测试

```bash
# 测试登录
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"zcd","password":"asd123"}'

# 测试获取产品列表（需要 token）
curl -X GET http://localhost:8080/api/products \
  -H "Authorization: Bearer YOUR_TOKEN"

# 测试获取当前用户
curl -X GET http://localhost:8080/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🚀 部署步骤

### 1️⃣ 前端部署

```bash
# 1. 构建前端
npm run build

# 2. 构建 Docker 镜像
docker build -t xiaodiyanxuan-frontend:latest .

# 3. 推送到镜像仓库（可选）
docker push your-registry/xiaodiyanxuan-frontend:latest

# 4. 部署到 Kubernetes
kubectl apply -f sealos-deploy.yaml -n ns-cxxiwxce

# 5. 验证部署
kubectl get pods -n ns-cxxiwxce -l app=xiaodiyanxuan-frontend
```

### 2️⃣ 后端部署

后端已部署完成，无需重复部署。如需更新代码：

```bash
# 1. 更新代码
cd /home/devbox/project/backend
git pull origin main

# 2. 重启服务
pm2 restart xiaodiyanxuan-api --update-env

# 3. 验证
curl https://pkochbpmcgaa.sealoshzh.site/health
```

---

## 🔐 认证流程

### Token 管理

```typescript
// 1. 登录获取 Token
const response = await apiClient.post('/auth/login', {
  username: 'zcd',
  password: 'asd123'
})

const token = response.data.token
localStorage.setItem('auth_token', token)

// 2. 后续请求自动添加 Token
// apiClient 拦截器会自动在 Authorization 头中添加 token

// 3. Token 过期处理
// 响应拦截器会自动检测 401 状态码
// 清除 token 并重定向到登录页
```

### CORS 配置

后端已配置 CORS，支持以下源：
- `http://localhost:3000`
- `http://localhost:5173`
- `http://localhost:8080`
- `https://lgpzubdtdxjf.sealoshzh.site`
- `https://pkochbpmcgaa.sealoshzh.site`

---

## 📊 响应格式标准

### 成功响应

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

### 分页响应

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

### 错误响应

```json
{
  "success": false,
  "message": "错误信息",
  "error": { ... },
  "code": 400
}
```

---

## 🐛 常见问题

### Q1: 登录返回 401

**原因**: 用户名或密码错误

**解决**:
```bash
# 确认测试账号
用户名: zcd
密码: asd123

# 如果不存在，创建新用户
node /home/devbox/project/backend/create_test_user.js
```

### Q2: 商品列表为空

**原因**: 数据库中没有商品数据

**解决**:
```bash
# 检查数据库连接
curl http://localhost:8080/health

# 创建测试数据
node /home/devbox/project/backend/seed-data.js
```

### Q3: CORS 错误

**原因**: 前端地址不在 CORS 白名单中

**解决**:
```bash
# 检查后端 CORS 配置
echo $CORS_ORIGIN

# 更新 .env 文件
CORS_ORIGIN=https://lgpzubdtdxjf.sealoshzh.site,https://pkochbpmcgaa.sealoshzh.site

# 重启服务
pm2 restart xiaodiyanxuan-api --update-env
```

### Q4: 文件上传失败

**原因**: 文件大小超过限制或格式不支持

**解决**:
- 最大文件大小: 50MB
- 支持格式: jpg, png, gif, pdf, doc, docx, xls, xlsx
- 检查后端日志: `pm2 logs xiaodiyanxuan-api`

---

## 📞 联系方式

如有问题，请检查：

1. **后端日志**
   ```bash
   pm2 logs xiaodiyanxuan-api
   ```

2. **前端控制台**
   - 打开浏览器 F12
   - 查看 Console 和 Network 标签

3. **系统状态**
   ```bash
   # 检查后端服务
   pm2 status
   
   # 检查数据库连接
   curl http://localhost:8080/health
   
   # 检查 Kubernetes 部署
   kubectl get pods -n ns-cxxiwxce
   ```

---

## ✅ 检查清单

部署前请确认：

- [ ] 后端服务运行正常 (`pm2 status`)
- [ ] 数据库连接成功 (`curl /health`)
- [ ] 测试账号可登录 (zcd / asd123)
- [ ] 前端 API 配置正确 (VITE_API_URL)
- [ ] CORS 白名单包含前端地址
- [ ] 文件上传功能正常
- [ ] 所有 API 端点可访问

---

## 🎯 下一步

1. **前端配置 API 客户端** - 按照第 🌐 部分配置
2. **本地测试** - 按照 🧪 部分测试
3. **构建和部署** - 按照 🚀 部分部署
4. **验证功能** - 测试登录、商品、购物车等功能

---

**文档完成！** 🎉

将此文档发送给前端团队，他们可以按照指南快速完成 API 对接和部署。

有任何问题，随时联系！
