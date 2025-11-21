# 🔗 前后端集成指南 (修复版)

**版本**: 2.0  
**更新时间**: 2025-11-20 22:30 UTC  
**状态**: 后端问题已修复，准备集成

---

## 📋 后端修复总结

### 已修复的问题

✅ **认证中间件导入不一致**
- 问题: `products.js` 和 `categories.js` 导入了不存在的 `authenticate`
- 修复: 改为导入正确的 `auth` 中间件
- 影响: 路由现在可以正常加载

### 验证结果

✅ 所有 17 个路由文件都已验证
✅ 认证中间件导入一致
✅ 后端已准备好集成

---

## 🚀 前后端集成步骤

### 第 1 步: 启动后端服务

```bash
# 进入后端目录
cd /home/devbox/project/backend

# 安装依赖（如果还没安装）
npm install

# 启动开发服务器
npm run dev

# 预期输出:
# 🚀 服务器运行在端口 8080
# ✅ MongoDB 已连接
# 📝 环境: development
```

### 第 2 步: 验证后端健康检查

```bash
# 测试健康检查端点
curl http://localhost:8080/health

# 预期响应:
# {"status":"ok","timestamp":"2025-11-20T22:30:00.000Z"}
```

### 第 3 步: 测试认证流程

```bash
# 1. 用户登录
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'

# 预期响应:
# {
#   "success": true,
#   "data": {
#     "token": "eyJhbGc...",
#     "user": {
#       "id": "...",
#       "username": "testuser",
#       "nickname": "Test User",
#       "avatar": "...",
#       "userType": "customer"
#     }
#   },
#   "message": "操作成功"
# }

# 2. 使用令牌访问受保护的端点
TOKEN="eyJhbGc..."
curl http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer $TOKEN"

# 预期响应:
# {
#   "success": true,
#   "data": {
#     "id": "...",
#     "username": "testuser",
#     ...
#   },
#   "message": "操作成功"
# }
```

### 第 4 步: 测试公开端点

```bash
# 获取产品列表（无需认证）
curl http://localhost:8080/api/products

# 预期响应:
# {
#   "success": true,
#   "data": [...],
#   "pagination": {
#     "page": 1,
#     "limit": 10,
#     "total": 100,
#     "totalPages": 10
#   }
# }

# 获取分类列表（无需认证）
curl http://localhost:8080/api/categories

# 预期响应:
# {
#   "success": true,
#   "data": [...]
# }
```

---

## 📱 前端配置

### 1. 设置 API 基础 URL

```javascript
// frontend/src/config/api.js
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// 或在 .env 文件中
REACT_APP_API_URL=http://localhost:8080/api
```

### 2. 创建 API 客户端

```javascript
// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加认证令牌
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // 令牌过期，清除并重定向到登录
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 3. 创建认证服务

```javascript
// frontend/src/services/auth.js
import api from './api';

export const authService = {
  // 用户名/密码登录
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  // 微信登录
  wxLogin: async (code) => {
    const response = await api.post('/auth/login', { code });
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  // 刷新令牌
  refreshToken: async () => {
    const response = await api.post('/auth/refresh');
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response;
  },

  // 登出
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // 获取当前用户
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // 检查是否已登录
  isLoggedIn: () => {
    return !!localStorage.getItem('token');
  }
};
```

### 4. 创建产品服务

```javascript
// frontend/src/services/product.js
import api from './api';

export const productService = {
  // 获取产品列表
  getProducts: async (page = 1, pageSize = 10, filters = {}) => {
    const params = new URLSearchParams({
      page,
      pageSize,
      ...filters
    });
    return api.get(`/products?${params}`);
  },

  // 获取产品详情
  getProduct: async (productId) => {
    return api.get(`/products/${productId}`);
  },

  // 搜索产品
  searchProducts: async (keyword, page = 1, pageSize = 10) => {
    return api.get(`/products/search?keyword=${keyword}&page=${page}&pageSize=${pageSize}`);
  },

  // 获取分类
  getCategories: async () => {
    return api.get('/products/categories');
  },

  // 获取样式
  getStyles: async () => {
    return api.get('/products/styles');
  }
};
```

### 5. 创建购物车服务

```javascript
// frontend/src/services/cart.js
import api from './api';

export const cartService = {
  // 获取购物车
  getCart: async () => {
    return api.get('/cart');
  },

  // 添加到购物车
  addToCart: async (productId, quantity, specifications = {}) => {
    return api.post('/cart', {
      productId,
      quantity,
      specifications
    });
  },

  // 更新购物车项
  updateCartItem: async (cartItemId, quantity) => {
    return api.put(`/cart/${cartItemId}`, { quantity });
  },

  // 删除购物车项
  removeFromCart: async (cartItemId) => {
    return api.delete(`/cart/${cartItemId}`);
  },

  // 清空购物车
  clearCart: async () => {
    return api.delete('/cart/clear');
  }
};
```

### 6. 创建订单服务

```javascript
// frontend/src/services/order.js
import api from './api';

export const orderService = {
  // 创建订单
  createOrder: async (items, recipient, couponCode = null) => {
    return api.post('/orders', {
      items,
      recipient,
      couponCode
    });
  },

  // 获取订单列表
  getOrders: async (page = 1, pageSize = 10, status = null) => {
    const params = new URLSearchParams({ page, pageSize });
    if (status) params.append('status', status);
    return api.get(`/orders?${params}`);
  },

  // 获取订单详情
  getOrder: async (orderId) => {
    return api.get(`/orders/${orderId}`);
  },

  // 取消订单
  cancelOrder: async (orderId) => {
    return api.post(`/orders/${orderId}/cancel`);
  },

  // 确认收货
  confirmReceipt: async (orderId) => {
    return api.post(`/orders/${orderId}/confirm`);
  }
};
```

---

## 🔄 API 响应格式

### 成功响应

```json
{
  "success": true,
  "data": {
    // 实际数据
  },
  "message": "操作成功"
}
```

### 分页响应

```json
{
  "success": true,
  "data": [
    // 数据列表
  ],
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
  "error": "详细错误信息",
  "code": 400
}
```

---

## 🔐 认证流程

### 登录流程

```
用户输入用户名/密码
    ↓
POST /api/auth/login
    ↓
后端验证凭证
    ↓
生成 JWT 令牌
    ↓
返回令牌和用户信息
    ↓
前端保存令牌到 localStorage
    ↓
后续请求在 Authorization 头中使用令牌
```

### 令牌验证流程

```
前端发送请求
    ↓
添加 Authorization: Bearer <token> 头
    ↓
后端验证令牌
    ├─ 有效 → 继续处理
    └─ 无效 → 返回 401
    ↓
前端收到 401 → 清除令牌 → 重定向到登录
```

---

## 📝 常见问题

### Q: 跨域问题 (CORS)

**问题**: 前端请求被浏览器拦截

**解决方案**:
- 后端已配置 CORS 中间件
- 确保前端请求的 Origin 在 `CORS_ORIGIN` 环境变量中
- 或设置 `CORS_ORIGIN=*` 允许所有来源

### Q: 认证令牌过期

**问题**: 用户长时间未操作，令牌过期

**解决方案**:
- 实现令牌刷新机制
- 在响应拦截器中检测 401 错误
- 自动调用 `/api/auth/refresh` 获取新令牌

### Q: 文件上传

**问题**: 如何上传文件？

**解决方案**:
```javascript
const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response;
};
```

---

## ✅ 集成检查清单

- [ ] 后端服务正常运行
- [ ] 健康检查端点可访问
- [ ] 认证流程正常
- [ ] 公开端点可访问
- [ ] 受保护端点需要令牌
- [ ] 前端 API 客户端已配置
- [ ] 认证服务已实现
- [ ] 产品服务已实现
- [ ] 购物车服务已实现
- [ ] 订单服务已实现
- [ ] 错误处理已实现
- [ ] 令牌刷新已实现

---

## 🚀 下一步

1. **启动后端**: `npm run dev`
2. **验证 API**: 使用 curl 或 Postman 测试
3. **配置前端**: 设置 API 基础 URL
4. **实现服务**: 创建 API 服务层
5. **集成组件**: 在 React 组件中使用服务
6. **测试流程**: 完整的用户流程测试

---

**版本**: 2.0  
**最后更新**: 2025-11-20 22:30 UTC  
**状态**: ✅ 准备集成

