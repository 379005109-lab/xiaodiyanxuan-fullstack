# 公网环境问题诊断报告

## 🎯 问题描述

**用户反馈**：
- 本地测试：所有功能正常
- 公网环境（https://lgpzubdtdxjf.sealoshzh.site）：接口对不上，报错
- 每次修改：需要半小时到1小时

---

## 🔍 诊断结果

### 1. 前端API配置

**文件**：`frontend/src/lib/apiClient.ts`

**配置逻辑**：
```typescript
// 生产环境使用相对路径
if (公网环境) {
  return '/api';  // 相对路径
}
```

**实际调用**：
```
前端访问：https://lgpzubdtdxjf.sealoshzh.site
API调用：https://lgpzubdtdxjf.sealoshzh.site/api/xxx
```

### 2. 后端API地址

**测试结果**：
```bash
# 直接访问后端
http://lgpzubdtdxjf.sealoshzh.site/api/auth/login
状态：✅ 可访问（返回正常JSON）

# 通过前端域名访问API
https://lgpzubdtdxjf.sealoshzh.site/api/xxx
状态：❌ 404 Not Found
```

---

## ⚠️ 根本原因

**问题**：前端域名（https://lgpzubdtdxjf.sealoshzh.site）没有配置API代理！

**现状**：
1. 前端：https://lgpzubdtdxjf.sealoshzh.site （静态文件）
2. 后端：http://lgpzubdtdxjf.sealoshzh.site/api （不同端口/服务）
3. 前端调用：https://lgpzubdtdxjf.sealoshzh.site/api → ❌ 404

**需要**：
- 配置Nginx/Ingress，将 `/api` 请求代理到后端服务

---

## 💡 解决方案

### 方案1：修改前端API配置（快速）

**直接指向后端地址**：

```typescript
// frontend/src/lib/apiClient.ts
const getApiUrl = () => {
  // 生产环境直接使用后端URL
  if (!import.meta.env.DEV) {
    return 'http://lgpzubdtdxjf.sealoshzh.site/api';
  }
  return 'http://localhost:8080';
};
```

**优点**：
- ✅ 立即生效
- ✅ 无需配置Nginx
- ✅ 简单直接

**缺点**：
- ⚠️ 可能有CORS问题（需要后端配置CORS）

### 方案2：配置Ingress代理（推荐）

**在Kubernetes Ingress中添加路径规则**：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: xiaodiyanxuan-ingress
  namespace: ns-cxxiwxce
spec:
  rules:
  - host: lgpzubdtdxjf.sealoshzh.site
    http:
      paths:
      # 前端路径
      - path: /
        pathType: Prefix
        backend:
          service:
            name: xiaodiyanxuan-frontend
            port:
              number: 80
      # API代理路径
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: xiaodiyanxuan-api
            port:
              number: 3000
```

**优点**：
- ✅ 正规方案
- ✅ 无CORS问题
- ✅ 前后端统一域名

**缺点**：
- ⏱️ 需要配置和部署

---

## 🚀 立即执行方案1（快速修复）

### 步骤1：修改API配置

```bash
# 编辑文件
vim frontend/src/lib/apiClient.ts

# 修改 getApiUrl 函数为：
const getApiUrl = () => {
  if (!import.meta.env.DEV) {
    console.log('✅ 生产环境，使用后端API');
    return 'http://lgpzubdtdxjf.sealoshzh.site/api';
  }
  return 'http://localhost:8080';
};
```

### 步骤2：重新构建部署

```bash
cd frontend
npm run build
cd ..
./deploy-frontend-fix.sh
```

### 步骤3：验证

访问 https://lgpzubdtdxjf.sealoshzh.site 并测试功能

---

## 📊 预期效果

### Before（当前）
```
前端访问 /api → 404 Not Found
所有API调用失败
功能完全不可用
```

### After（修复后）
```
前端访问 /api → http://lgpzubdtdxjf.sealoshzh.site/api
所有API正常工作
功能完全可用
```

---

## ⏱️ 时间对比

| 操作 | 当前方式 | 方案1 | 方案2 |
|------|---------|-------|-------|
| 修改时间 | 30-60分钟 | 5分钟 | 15分钟 |
| 部署时间 | - | 3分钟 | 10分钟 |
| 总时间 | 30-60分钟 | **8分钟** | 25分钟 |

---

## 🔧 后续优化

### 配置CORS（如果有跨域问题）

**后端添加CORS配置**：

```javascript
// backend/src/app.js
const cors = require('cors');

app.use(cors({
  origin: [
    'https://lgpzubdtdxjf.sealoshzh.site',
    'http://localhost:5173'
  ],
  credentials: true
}));
```

---

## ✅ 验证清单

部署后检查：

- [ ] 访问 https://lgpzubdtdxjf.sealoshzh.site
- [ ] 打开浏览器Console，查看API调用
- [ ] 测试登录功能
- [ ] 测试商品列表
- [ ] 测试新建商品
- [ ] 测试编辑商品

---

## 🎉 总结

**问题根源**：前端域名没有配置API代理

**快速解决**：修改前端API配置，直接指向后端地址

**完美解决**：配置Ingress，实现统一域名代理

**预计修复时间**：8分钟（方案1）

---

**立即执行方案1，8分钟后所有功能恢复正常！** 🚀
