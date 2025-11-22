# 使用Mock数据的管理页面清单

## 📊 需要实现真实API的页面

### 高优先级

#### 1. 订单管理 (OrderManagement.tsx)
- **当前状态**: 使用localStorage存储订单
- **需要的API**:
  - `GET /api/orders` - 获取订单列表
  - `GET /api/orders/:id` - 获取订单详情
  - `PUT /api/orders/:id` - 更新订单状态
  - `DELETE /api/orders/:id` - 删除订单
- **优先级**: 高（业务核心功能）

#### 2. 退款管理 (RefundManagement.tsx)
- **当前状态**: 使用localStorage
- **需要的API**:
  - `GET /api/refunds` - 获取退款列表
  - `PUT /api/refunds/:id` - 处理退款申请
- **优先级**: 高

---

### 中优先级

#### 3. 套餐管理 (PackageManagementPage.tsx)
- **当前状态**: 使用localStorage
- **需要的API**:
  - `GET /api/packages` - 获取套餐列表
  - `POST /api/packages` - 创建套餐
  - `PUT /api/packages/:id` - 更新套餐
  - `DELETE /api/packages/:id` - 删除套餐
- **优先级**: 中

#### 4. 套餐列表 (PackageListPage.tsx)
- **当前状态**: 使用localStorage
- **需要的API**: 同上
- **优先级**: 中

#### 5. 套餐利润分析 (PackageProfitPage.tsx)
- **当前状态**: 使用localStorage
- **需要的API**:
  - `GET /api/packages/:id/profit` - 获取套餐利润数据
- **优先级**: 中

#### 6. 套餐编辑 (DesignerPackageEditPage.tsx)
- **当前状态**: 使用localStorage
- **需要的API**: 同套餐管理
- **优先级**: 中

---

### 低优先级

#### 7. 特价商品管理 (AdminBargainFormPage.tsx)
- **当前状态**: 使用productService（已是真实API）+ localStorage存储特价设置
- **需要的API**:
  - `GET /api/bargains` - 获取特价商品列表
  - `POST /api/bargains` - 创建特价活动
  - `PUT /api/bargains/:id` - 更新特价活动
  - `DELETE /api/bargains/:id` - 删除特价活动
- **优先级**: 低

#### 8. 特价商品列表 (AdminBargainListPage.tsx)
- **当前状态**: 使用localStorage
- **需要的API**: 同上
- **优先级**: 低

---

### 统计分析页面

#### 9. 订单分析 (OrderDashboard.tsx)
- **当前状态**: 使用localStorage获取订单数据
- **需要的API**:
  - `GET /api/analytics/orders` - 获取订单统计数据
- **优先级**: 低（统计功能）

#### 10. 设计师订单 (DesignerOrdersPage.tsx)
- **当前状态**: 使用localStorage
- **需要的API**:
  - `GET /api/designers/:id/orders` - 获取设计师订单
- **优先级**: 低

#### 11. 设计师推荐订单 (DesignerReferredOrdersPage.tsx)
- **当前状态**: 使用localStorage
- **需要的API**:
  - `GET /api/designers/:id/referred-orders` - 获取推荐订单
- **优先级**: 低

---

## 🎯 实现计划

### 阶段1：核心业务功能（高优先级）

**预计时间**: 2-3天

1. ✅ 商品管理API（已完成）
2. ⏳ 订单管理API
3. ⏳ 退款管理API

### 阶段2：扩展功能（中优先级）

**预计时间**: 3-4天

1. ⏳ 套餐管理API
2. ⏳ 套餐编辑API
3. ⏳ 套餐利润分析API

### 阶段3：营销功能（低优先级）

**预计时间**: 2-3天

1. ⏳ 特价商品API
2. ⏳ 统计分析API
3. ⏳ 设计师功能API

---

## 📝 API设计示例

### 订单管理API

#### 获取订单列表
```
GET /api/orders?page=1&pageSize=20&status=pending
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "orderNo": "ORD20250101001",
      "userId": "...",
      "items": [...],
      "totalAmount": 5000,
      "status": "pending",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

#### 更新订单状态
```
PUT /api/orders/:id/status
```

**请求体**:
```json
{
  "status": "confirmed",
  "note": "订单已确认"
}
```

---

## 🚀 快速开始

### 1. 创建后端模型

```javascript
// backend/src/models/Order.js
const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
  orderNo: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    price: Number,
    skuId: String
  }],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'paid', 'shipped', 'completed', 'cancelled'],
    default: 'pending'
  },
  shippingAddress: mongoose.Schema.Types.Mixed,
  paymentInfo: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Order', orderSchema)
```

### 2. 创建控制器

```javascript
// backend/src/controllers/orderController.js
const Order = require('../models/Order')

exports.getOrders = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query
    const query = status ? { status } : {}
    
    const orders = await Order.find(query)
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip((page - 1) * pageSize)
    
    const total = await Order.countDocuments(query)
    
    res.json({
      success: true,
      data: orders,
      pagination: { page: Number(page), pageSize: Number(pageSize), total }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
```

### 3. 创建路由

```javascript
// backend/src/routes/orders.js
const express = require('express')
const router = express.Router()
const { getOrders, updateOrderStatus } = require('../controllers/orderController')
const { authenticate } = require('../middleware/auth')

router.get('/', authenticate, getOrders)
router.put('/:id/status', authenticate, updateOrderStatus)

module.exports = router
```

### 4. 注册路由

```javascript
// backend/src/app.js
app.use('/api/orders', require('./routes/orders'))
```

### 5. 更新前端Service

```typescript
// frontend/src/services/orderService.ts
import apiClient from '@/lib/apiClient'

export const getOrders = async (params) => {
  const response = await apiClient.get('/orders', { params })
  return response.data
}

export const updateOrderStatus = async (id, status, note) => {
  const response = await apiClient.put(`/orders/${id}/status`, { status, note })
  return response.data
}
```

### 6. 更新前端页面

```tsx
// frontend/src/pages/admin/OrderManagement.tsx
import { getOrders, updateOrderStatus } from '@/services/orderService'

// 替换 localStorage 操作为 API 调用
const loadOrders = async () => {
  const response = await getOrders({ page: 1, pageSize: 20 })
  setOrders(response.data)
}
```

---

## ✅ 当前状态

### 已完成
- ✅ 商品管理（ProductManagement）
- ✅ 商品表单（ProductForm）
- ✅ 分类管理（CategoryManagement）
- ✅ 素材管理（MaterialManagement）
- ✅ 用户管理（UserManagement - 使用真实API）

### 待实现
- ⏳ 订单管理（13个页面）
- ⏳ 套餐管理（6个页面）
- ⏳ 特价商品（2个页面）
- ⏳ 统计分析（3个页面）

---

## 📌 注意事项

1. **数据迁移**: 如果已有localStorage数据，需要考虑迁移策略
2. **权限控制**: API需要实现角色权限验证
3. **错误处理**: 统一的错误处理和用户提示
4. **性能优化**: 大数据量时考虑分页和缓存
5. **测试验证**: 每个API都需要充分测试

---

**下一步**: 建议从订单管理API开始实现，因为这是核心业务功能。
