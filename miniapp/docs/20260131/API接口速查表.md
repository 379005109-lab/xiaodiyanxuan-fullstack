# API 接口速查表

## 快速参考

### 基础信息

| 项目 | 值 |
|------|-----|
| 基础 URL | `http://localhost:5000` |
| 超时时间 | 10000ms |
| 认证方式 | Bearer Token |
| 响应格式 | JSON |

---

## 认证接口

### 微信登录
```
POST /api/auth/wxlogin
请求体：{ code: string }
响应：{ token: string, userInfo: object }
认证：否
```

### 获取用户信息
```
GET /api/user/info
响应：{ id, openId, nickname, avatar, phone, email }
认证：是
```

---

## 首页接口

### 获取首页数据
```
GET /api/home
响应：{ fullscreenImage, newProductsImage, banners, styles, hots }
认证：否
```

---

## 商品接口

### 商品列表
```
GET /api/goods/list?page=1&pageSize=10&category=&style=&sort=
响应：{ list: [], total: 0, page: 1, pageSize: 10 }
认证：否
```

### 搜索商品
```
GET /api/goods/search?keyword=&page=1&pageSize=10
响应：{ list: [], total: 0 }
认证：否
```

### 商品详情
```
GET /api/goods/:id
响应：{ 完整商品对象 }
认证：否
```

### 分类列表
```
GET /api/categories
响应：[{ id, name, icon, sort }]
认证：否
```

### 风格列表
```
GET /api/styles
响应：[{ id, name, icon, sort }]
认证：否
```

---

## 购物车接口

### 获取购物车
```
GET /api/cart
响应：[{ _id, goodsId, goodsName, price, count, specs }]
认证：是
```

### 添加到购物车
```
POST /api/cart
请求体：{ goodsId, count, specs }
响应：{ _id, message }
认证：是
```

### 更新购物车
```
PUT /api/cart/:cartId
请求体：{ count }
响应：{ message }
认证：是
```

### 删除购物车商品
```
DELETE /api/cart/:cartId
响应：{ message }
认证：是
```

---

## 收藏接口

### 收藏列表
```
GET /api/favorites?page=1&pageSize=10
响应：{ list: [], total: 0 }
认证：是
```

### 添加收藏
```
POST /api/favorites
请求体：{ goodsId }
响应：{ message }
认证：是
```

### 取消收藏
```
DELETE /api/favorites/:goodsId
响应：{ message }
认证：是
```

---

## 订单接口

### 创建订单
```
POST /api/orders
请求体：{
  type: "normal",
  totalPrice: 0,
  goods: [],
  name: "",
  phone: "",
  address: ""
}
响应：{ orderId, orderNo }
认证：是
```

### 订单列表
```
GET /api/orders?status=&page=1&pageSize=10
响应：{ list: [], total: 0 }
认证：是
```

### 订单详情
```
GET /api/orders/:orderId
响应：{ 完整订单对象 }
认证：是
```

### 取消订单
```
POST /api/orders/:orderId/cancel
响应：{ message }
认证：是
```

### 确认收货
```
POST /api/orders/:orderId/confirm
响应：{ message }
认证：是
```

---

## 地址接口

### 地址列表
```
GET /api/addresses
响应：[{ _id, name, phone, province, city, district, address, isDefault }]
认证：是
```

### 添加地址
```
POST /api/addresses
请求体：{ name, phone, province, city, district, address, isDefault }
响应：{ _id, message }
认证：是
```

### 更新地址
```
PUT /api/addresses/:addressId
请求体：{ name, phone, province, city, district, address, isDefault }
响应：{ message }
认证：是
```

### 删除地址
```
DELETE /api/addresses/:addressId
响应：{ message }
认证：是
```

---

## 优惠券接口

### 优惠券列表
```
GET /api/coupons?status=available
响应：[{ _id, code, type, value, minAmount, maxAmount, validFrom, validTo }]
认证：是
```

---

## 砍价接口

### 砍价商品列表
```
GET /api/bargain/goods?page=1&pageSize=10
响应：{ list: [], total: 0 }
认证：否
```

### 发起砍价
```
POST /api/bargain/start
请求体：{ goodsId }
响应：{ bargainId }
认证：是
```

### 我的砍价
```
GET /api/bargain/my
响应：[{ 砍价对象 }]
认证：是
```

### 帮砍价
```
POST /api/bargain/:bargainId/help
响应：{ message, currentPrice }
认证：是
```

---

## 套餐接口

### 套餐列表
```
GET /api/packages?page=1&pageSize=10
响应：{ list: [], total: 0 }
认证：否
```

### 套餐详情
```
GET /api/packages/:packageId
响应：{ 完整套餐对象 }
认证：否
```

---

## 响应格式

### 成功响应
```json
{
  "code": 0,
  "message": "success",
  "data": {
    // 实际数据
  }
}
```

### 失败响应
```json
{
  "code": 400,
  "message": "错误信息",
  "data": null
}
```

---

## HTTP 状态码

| 状态码 | 含义 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（需要登录） |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

---

## 查询参数

### 分页参数
- `page`：页码（默认 1）
- `pageSize`：每页数量（默认 10）

### 排序参数
- `sort`：排序方式
  - `price_asc`：价格升序
  - `price_desc`：价格降序
  - `sales_desc`：销量降序

### 筛选参数
- `category`：分类 ID
- `style`：风格 ID
- `status`：状态（订单、优惠券等）

---

## 常见错误

| 错误码 | 错误信息 | 解决方案 |
|--------|---------|---------|
| 400 | 参数错误 | 检查请求参数 |
| 401 | 未授权 | 检查 token 是否正确 |
| 403 | 禁止访问 | 检查权限 |
| 404 | 资源不存在 | 检查资源 ID |
| 500 | 服务器错误 | 联系后端开发 |

---

## 前端集成示例

### JavaScript/TypeScript
```javascript
// 获取商品列表
const response = await fetch('http://localhost:5000/api/goods/list?page=1&pageSize=10', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
})
const data = await response.json()
```

### Axios
```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000'
})

// 添加 token 到请求头
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 获取商品列表
const { data } = await api.get('/api/goods/list', {
  params: { page: 1, pageSize: 10 }
})
```

### 小程序
```javascript
const api = require('../../utils/api.js')

// 获取商品列表
api.getGoodsList({ page: 1, pageSize: 10 })
  .then((data) => {
    console.log(data)
  })
  .catch((err) => {
    console.error(err)
  })
```

---

## 数据类型定义

### 商品对象
```typescript
interface Product {
  id: string
  name: string
  code: string
  price: number
  thumb: string
  images: string[]
  category: string
  categoryId: string
  style: string
  styleId: string
  description: string
  stock: number
  sales: number
  sizes: Size[]
  materialsGroups: MaterialGroup[]
  fills: Fill[]
  frames: Frame[]
  legs: Leg[]
}
```

### 订单对象
```typescript
interface Order {
  id: string
  orderNo: string
  type: 'normal' | 'package'
  status: 1 | 2 | 3 | 4 | 5
  statusText: string
  totalPrice: number
  goods: OrderGoods[]
  name: string
  phone: string
  address: string
  createTime: number
  payTime?: number
  shipTime?: number
  completeTime?: number
}
```

### 购物车项
```typescript
interface CartItem {
  _id: string
  userId: string
  goodsId: string
  goodsName: string
  price: number
  count: number
  specs: {
    size: string
    material: string
    materialColor: string
    fill: string
    frame: string
    leg: string
  }
}
```

---

## 快速命令

### 使用 curl 测试

```bash
# 获取商品列表
curl -X GET http://localhost:5000/api/goods/list

# 创建订单
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{"type":"normal","totalPrice":2699,"goods":[],"name":"张三","phone":"13800138000","address":"北京市朝阳区"}'

# 添加到购物车
curl -X POST http://localhost:5000/api/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{"goodsId":"g1","count":1,"specs":{}}'
```

---

**最后更新**：2024年11月17日
