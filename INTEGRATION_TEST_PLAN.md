# 🧪 前后端集成测试计划

**制定时间**: 2025-11-20 22:35 UTC  
**目标**: 验证后端修复后的所有功能  
**预计时间**: 2-3 小时

---

## 📋 测试范围

### 1. 后端服务启动测试 ✅
- [ ] 服务正常启动
- [ ] MongoDB 连接成功
- [ ] 健康检查端点可访问

### 2. 认证流程测试 ✅
- [ ] 用户登录成功
- [ ] JWT 令牌生成正确
- [ ] 令牌验证正常
- [ ] 受保护端点需要令牌

### 3. 公开 API 测试 ✅
- [ ] 产品列表可访问
- [ ] 产品详情可访问
- [ ] 分类列表可访问
- [ ] 样式列表可访问
- [ ] 搜索功能正常

### 4. 受保护 API 测试 ✅
- [ ] 购物车操作正常
- [ ] 订单创建成功
- [ ] 用户资料可访问
- [ ] 收藏功能正常

### 5. 文件上传测试 ✅
- [ ] 文件上传成功
- [ ] 文件下载成功
- [ ] 文件删除成功

### 6. 错误处理测试 ✅
- [ ] 无效令牌返回 401
- [ ] 无效数据返回 400
- [ ] 不存在资源返回 404
- [ ] 服务器错误返回 500

---

## 🚀 测试执行步骤

### 第 1 步: 启动后端服务

```bash
cd /home/devbox/project/backend
npm run dev
```

**验证输出**:
```
✅ 🚀 服务器运行在端口 8080
✅ ✅ MongoDB 已连接
✅ 📝 环境: development
```

### 第 2 步: 健康检查

```bash
curl http://localhost:8080/health
```

**预期响应**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-20T22:35:00.000Z"
}
```

### 第 3 步: 测试认证流程

#### 3.1 用户登录

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

**预期响应**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "...",
      "username": "testuser",
      "nickname": "Test User",
      "avatar": "...",
      "userType": "customer"
    }
  },
  "message": "操作成功"
}
```

**保存令牌**:
```bash
TOKEN="eyJhbGc..."
```

#### 3.2 使用令牌访问受保护端点

```bash
curl http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

**预期响应**:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "username": "testuser",
    ...
  },
  "message": "操作成功"
}
```

### 第 4 步: 测试公开 API

#### 4.1 获取产品列表

```bash
curl http://localhost:8080/api/products
```

**预期响应**:
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

#### 4.2 获取分类

```bash
curl http://localhost:8080/api/categories
```

**预期响应**:
```json
{
  "success": true,
  "data": [...]
}
```

#### 4.3 搜索产品

```bash
curl "http://localhost:8080/api/products/search?keyword=test"
```

**预期响应**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

### 第 5 步: 测试购物车功能

#### 5.1 获取购物车

```bash
curl http://localhost:8080/api/cart \
  -H "Authorization: Bearer $TOKEN"
```

#### 5.2 添加到购物车

```bash
curl -X POST http://localhost:8080/api/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "productId": "product_id_here",
    "quantity": 1,
    "specifications": {}
  }'
```

#### 5.3 更新购物车项

```bash
curl -X PUT http://localhost:8080/api/cart/cart_item_id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"quantity": 2}'
```

#### 5.4 删除购物车项

```bash
curl -X DELETE http://localhost:8080/api/cart/cart_item_id \
  -H "Authorization: Bearer $TOKEN"
```

### 第 6 步: 测试订单功能

#### 6.1 创建订单

```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "items": [
      {
        "productId": "product_id",
        "quantity": 1,
        "subtotal": 100
      }
    ],
    "recipient": {
      "name": "Test User",
      "phone": "13800000000",
      "address": "Test Address"
    }
  }'
```

#### 6.2 获取订单列表

```bash
curl http://localhost:8080/api/orders \
  -H "Authorization: Bearer $TOKEN"
```

#### 6.3 获取订单详情

```bash
curl http://localhost:8080/api/orders/order_id \
  -H "Authorization: Bearer $TOKEN"
```

### 第 7 步: 测试文件上传

```bash
# 创建测试文件
echo "test content" > test.txt

# 上传文件
curl -X POST http://localhost:8080/api/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.txt"
```

**预期响应**:
```json
{
  "success": true,
  "data": {
    "fileId": "...",
    "url": "/api/files/...",
    "size": 12,
    "mimeType": "text/plain"
  }
}
```

### 第 8 步: 测试错误处理

#### 8.1 无效令牌

```bash
curl http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer invalid_token"
```

**预期响应**: 401 Unauthorized

#### 8.2 无效数据

```bash
curl -X POST http://localhost:8080/api/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"invalid": "data"}'
```

**预期响应**: 400 Bad Request

#### 8.3 不存在资源

```bash
curl http://localhost:8080/api/products/invalid_id \
  -H "Authorization: Bearer $TOKEN"
```

**预期响应**: 404 Not Found

---

## 📊 测试检查清单

### 基础功能

- [ ] 服务启动正常
- [ ] MongoDB 连接成功
- [ ] 健康检查通过

### 认证功能

- [ ] 用户登录成功
- [ ] 令牌生成正确
- [ ] 令牌验证正常
- [ ] 无令牌访问受保护端点返回 401

### 产品功能

- [ ] 产品列表可访问
- [ ] 产品详情可访问
- [ ] 分类列表可访问
- [ ] 样式列表可访问
- [ ] 搜索功能正常

### 购物车功能

- [ ] 获取购物车成功
- [ ] 添加到购物车成功
- [ ] 更新购物车项成功
- [ ] 删除购物车项成功
- [ ] 清空购物车成功

### 订单功能

- [ ] 创建订单成功
- [ ] 获取订单列表成功
- [ ] 获取订单详情成功
- [ ] 取消订单成功
- [ ] 确认收货成功

### 用户功能

- [ ] 获取个人资料成功
- [ ] 更新个人资料成功

### 文件功能

- [ ] 文件上传成功
- [ ] 文件下载成功
- [ ] 文件删除成功

### 错误处理

- [ ] 无效令牌返回 401
- [ ] 无效数据返回 400
- [ ] 不存在资源返回 404
- [ ] 服务器错误返回 500

---

## 🔍 常见问题排查

### 问题 1: 服务启动失败

**症状**: `npm run dev` 失败

**排查步骤**:
1. 检查 MongoDB 连接: `echo $MONGODB_URI`
2. 检查依赖: `npm install`
3. 检查端口占用: `lsof -i :8080`

### 问题 2: 健康检查失败

**症状**: `curl http://localhost:8080/health` 返回错误

**排查步骤**:
1. 检查服务是否运行: `ps aux | grep node`
2. 检查端口: `netstat -tlnp | grep 8080`
3. 查看服务日志

### 问题 3: API 返回 401

**症状**: 即使提供了令牌，仍返回 401

**排查步骤**:
1. 检查令牌格式: `Authorization: Bearer <token>`
2. 检查令牌是否过期
3. 检查 JWT_SECRET 环境变量

### 问题 4: MongoDB 连接失败

**症状**: "MongoDB 连接失败"

**排查步骤**:
1. 检查 MONGODB_URI: `echo $MONGODB_URI`
2. 测试连接: `mongosh "$MONGODB_URI"`
3. 检查网络连接

---

## 📈 测试报告模板

```
测试日期: 2025-11-20
测试人员: [名字]
测试环境: [环境描述]

测试结果:
- 基础功能: ✅ 通过 / ❌ 失败
- 认证功能: ✅ 通过 / ❌ 失败
- 产品功能: ✅ 通过 / ❌ 失败
- 购物车功能: ✅ 通过 / ❌ 失败
- 订单功能: ✅ 通过 / ❌ 失败
- 用户功能: ✅ 通过 / ❌ 失败
- 文件功能: ✅ 通过 / ❌ 失败
- 错误处理: ✅ 通过 / ❌ 失败

总体结果: ✅ 通过 / ❌ 失败

问题描述:
[如有失败，详细描述问题]

建议:
[改进建议]
```

---

## ✅ 测试完成标准

所有以下条件都满足时，测试完成:

- [x] 所有基础功能测试通过
- [x] 所有认证功能测试通过
- [x] 所有 API 端点都可访问
- [x] 所有错误处理正确
- [x] 没有未预期的错误

---

**测试计划完成时间**: 2025-11-20 22:35 UTC  
**预计完成时间**: 2025-11-20 23:35 UTC  
**状态**: 准备执行

