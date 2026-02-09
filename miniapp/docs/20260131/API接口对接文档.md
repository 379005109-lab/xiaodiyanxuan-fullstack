# 小程序与后端 API 接口对接文档

## 📋 基本信息

- **后端地址**：`http://houduanceshi.ns-cxxiwxce:5000`
- **网站后台**：`https://dlzrpxrppejh.sealoshzh.site/admin/orders`
- **小程序前端**：已配置 API 调用

## 🔑 统一响应格式

所有接口统一返回格式：

```json
{
  "code": 0,        // 0 或 200 表示成功，其他表示失败
  "message": "success",
  "data": {
    // 实际数据
  }
}
```

## 📦 数据结构定义

### 1. 商品（Goods）

```json
{
  "id": "g1",                    // 商品ID
  "name": "莫兰迪沙发",          // 商品名称
  "code": "FS-SF3201",          // 商品编码
  "price": 2699,                // 基础价格
  "basePrice": 2699,            // 基础价格（同 price）
  "thumb": "https://...",       // 缩略图
  "images": ["https://..."],    // 商品图片数组
  "detailImages": ["https://..."], // 详情图片数组
  "category": "沙发",           // 分类名称
  "categoryId": "cat1",         // 分类ID
  "style": "现代风",            // 风格
  "styleId": "style1",         // 风格ID
  "description": "商品描述",     // 商品描述
  "stock": 100,                 // 库存
  "sales": 50,                  // 销量
  
  // 规格配置（商品详情页需要）
  "sizes": [
    {
      "id": "size1",
      "name": "双人位",
      "dims": "5000×3000×1000",
      "img": "https://...",
      "extra": 0                 // 额外加价
    }
  ],
  "materialsGroups": [
    {
      "id": "mat1",
      "name": "标准皮革",
      "extra": 0,
      "better": false,          // 是否为高级选项
      "img": "https://...",
      "colors": [
        {
          "id": "color1",
          "name": "经典黑"
        }
      ]
    }
  ],
  "fills": [
    {
      "id": "fill1",
      "name": "高密度海绵",
      "extra": 0,
      "better": false,
      "img": "https://..."
    }
  ],
  "frames": [
    {
      "id": "frame1",
      "name": "实木框架",
      "extra": 0,
      "better": false,
      "img": "https://..."
    }
  ],
  "legs": [
    {
      "id": "leg1",
      "name": "木质脚",
      "extra": 0,
      "better": false,
      "img": "https://..."
    }
  ]
}
```

### 2. 订单（Order）

```json
{
  "id": "order_1234567890",     // 订单ID
  "orderNo": "ORD1234567890",   // 订单号
  "type": "normal",             // 订单类型：normal（普通订单）或 package（套餐订单）
  "status": 1,                   // 订单状态：1-待付款, 2-待发货, 3-待收货, 4-已完成, 5-已取消
  "statusText": "待付款",        // 状态文本
  "totalPrice": 3699,           // 订单总价
  "goods": [                     // 商品列表
    {
      "id": "g1",
      "name": "莫兰迪沙发",
      "code": "FS-SF3201",
      "dims": "5000×3000×1000",
      "categoryName": "沙发",
      "price": 2699,
      "count": 1,
      "thumb": "https://...",
      "specs": {                  // 规格信息
        "size": "双人位",
        "material": "标准皮革",
        "materialColor": "经典黑",
        "fill": "高密度海绵",
        "frame": "实木框架",
        "leg": "木质脚"
      }
    }
  ],
  "name": "张三",                // 收货人姓名
  "phone": "13800138000",       // 收货人电话
  "address": "北京市朝阳区...",   // 收货地址
  "createTime": 1234567890000,  // 创建时间（时间戳）
  "payTime": null,               // 支付时间
  "shipTime": null,              // 发货时间
  "completeTime": null           // 完成时间
}
```

### 3. 分类（Category）

```json
{
  "id": "cat1",
  "name": "沙发",
  "icon": "https://...",
  "sort": 1
}
```

### 4. 风格（Style）

```json
{
  "id": "style1",
  "name": "现代风",
  "img": "https://..."
}
```

### 5. 收藏（Favorite）

```json
{
  "id": "fav1",
  "goodsId": "g1",
  "goodsName": "莫兰迪沙发",
  "price": 2699,
  "thumb": "https://...",
  "createTime": 1234567890000
}
```

### 6. 购物车（Cart）

```json
{
  "id": "cart1",
  "goodsId": "g1",
  "goodsName": "莫兰迪沙发",
  "price": 2699,
  "thumb": "https://...",
  "count": 2,
  "specs": {
    "size": "双人位",
    "material": "标准皮革"
  }
}
```

## 🔌 API 接口列表

### 一、用户相关

#### 1.1 微信登录
- **接口**：`POST /api/auth/wxlogin`
- **说明**：微信小程序登录
- **请求参数**：
```json
{
  "code": "wx_login_code"  // 微信登录 code
}
```
- **返回数据**：
```json
{
  "token": "jwt_token_string",
  "userInfo": {
    "id": "user1",
    "nickname": "用户昵称",
    "avatar": "https://..."
  }
}
```

#### 1.2 获取用户信息
- **接口**：`GET /api/user/info`
- **说明**：获取当前登录用户信息
- **请求头**：需要 Authorization token
- **返回数据**：
```json
{
  "id": "user1",
  "nickname": "用户昵称",
  "avatar": "https://...",
  "phone": "13800138000"
}
```

---

### 二、首页相关

#### 2.1 获取首页数据
- **接口**：`GET /api/home`
- **说明**：获取首页展示数据
- **返回数据**：
```json
{
  "fullscreenImage": "https://...",      // 全屏大图
  "newProductsImage": "https://...",     // 新品推进图
  "banners": ["https://..."],            // 轮播图数组
  "styles": [                             // 风格列表
    {
      "id": "style1",
      "name": "北欧风",
      "img": "https://..."
    }
  ],
  "hots": [                               // 本周热门商品
    {
      "id": "g1",
      "name": "北欧沙发",
      "price": 2699,
      "save": 600,                        // 砍价可省金额
      "img": "https://..."
    }
  ]
}
```

---

### 三、商品相关

#### 3.1 获取商品列表
- **接口**：`GET /api/goods/list`
- **说明**：获取商品列表，支持筛选、排序、分页
- **请求参数**：
```
page: 1              // 页码
pageSize: 20         // 每页数量
category: "沙发"     // 分类筛选（可选）
categoryId: "cat1"   // 分类ID（可选）
style: "现代风"      // 风格筛选（可选）
styleId: "style1"    // 风格ID（可选）
keyword: "沙发"      // 搜索关键词（可选）
sort: "comprehensive" // 排序：comprehensive（综合）、sales（销量）、price（价格）
priceAsc: true       // 价格排序方向：true-升序，false-降序
```
- **返回数据**：
```json
{
  "list": [
    {
      "id": "g1",
      "name": "莫兰迪沙发",
      "price": 2699,
      "thumb": "https://...",
      "style": "现代风",
      "category": "沙发"
    }
  ],
  "total": 100,      // 总数量
  "page": 1,
  "pageSize": 20
}
```

#### 3.2 获取商品详情
- **接口**：`GET /api/goods/:id`
- **说明**：获取商品详细信息，包含所有规格配置
- **路径参数**：`id` - 商品ID
- **返回数据**：完整的商品对象（包含 sizes, materialsGroups, fills, frames, legs 等）

#### 3.3 搜索商品
- **接口**：`GET /api/goods/search`
- **说明**：搜索商品
- **请求参数**：
```
keyword: "沙发"      // 搜索关键词
page: 1
pageSize: 20
```
- **返回数据**：同商品列表格式

---

### 四、收藏相关

#### 4.1 获取收藏列表
- **接口**：`GET /api/favorites`
- **说明**：获取当前用户的收藏列表
- **请求头**：需要 Authorization token
- **返回数据**：
```json
{
  "list": [
    {
      "id": "fav1",
      "goodsId": "g1",
      "goodsName": "莫兰迪沙发",
      "price": 2699,
      "thumb": "https://..."
    }
  ]
}
```

#### 4.2 添加收藏
- **接口**：`POST /api/favorites`
- **说明**：添加商品到收藏
- **请求头**：需要 Authorization token
- **请求参数**：
```json
{
  "goodsId": "g1"
}
```

#### 4.3 取消收藏
- **接口**：`DELETE /api/favorites/:goodsId`
- **说明**：取消收藏
- **请求头**：需要 Authorization token
- **路径参数**：`goodsId` - 商品ID

---

### 五、购物车相关

#### 5.1 获取购物车
- **接口**：`GET /api/cart`
- **说明**：获取当前用户的购物车
- **请求头**：需要 Authorization token
- **返回数据**：
```json
{
  "list": [
    {
      "id": "cart1",
      "goodsId": "g1",
      "goodsName": "莫兰迪沙发",
      "price": 2699,
      "thumb": "https://...",
      "count": 2,
      "specs": {
        "size": "双人位",
        "material": "标准皮革"
      }
    }
  ],
  "totalCount": 2,    // 总数量
  "totalPrice": 5398  // 总价格
}
```

#### 5.2 添加到购物车
- **接口**：`POST /api/cart`
- **说明**：添加商品到购物车
- **请求头**：需要 Authorization token
- **请求参数**：
```json
{
  "goodsId": "g1",
  "count": 1,
  "specs": {
    "size": "双人位",
    "material": "标准皮革",
    "materialColor": "经典黑",
    "fill": "高密度海绵",
    "frame": "实木框架",
    "leg": "木质脚"
  }
}
```

#### 5.3 更新购物车商品数量
- **接口**：`PUT /api/cart/:cartId`
- **说明**：更新购物车商品数量
- **请求头**：需要 Authorization token
- **路径参数**：`cartId` - 购物车项ID
- **请求参数**：
```json
{
  "count": 3
}
```

#### 5.4 删除购物车商品
- **接口**：`DELETE /api/cart/:cartId`
- **说明**：删除购物车商品
- **请求头**：需要 Authorization token
- **路径参数**：`cartId` - 购物车项ID

---

### 六、订单相关

#### 6.1 创建订单
- **接口**：`POST /api/orders`
- **说明**：创建订单
- **请求头**：需要 Authorization token
- **请求参数**：
```json
{
  "type": "normal",              // normal 或 package
  "totalPrice": 3699,
  "goods": [
    {
      "id": "g1",
      "name": "莫兰迪沙发",
      "code": "FS-SF3201",
      "dims": "5000×3000×1000",
      "categoryName": "沙发",
      "price": 2699,
      "count": 1,
      "thumb": "https://...",
      "specs": {
        "size": "双人位",
        "material": "标准皮革",
        "materialColor": "经典黑",
        "fill": "高密度海绵",
        "frame": "实木框架",
        "leg": "木质脚"
      }
    }
  ],
  "name": "张三",
  "phone": "13800138000",
  "address": "北京市朝阳区..."
}
```
- **返回数据**：订单对象

#### 6.2 获取订单列表
- **接口**：`GET /api/orders`
- **说明**：获取当前用户的订单列表
- **请求头**：需要 Authorization token
- **请求参数**：
```
status: 1          // 订单状态筛选（可选）：1-待付款, 2-待发货, 3-待收货, 4-已完成
page: 1
pageSize: 20
```
- **返回数据**：
```json
{
  "list": [
    // 订单对象数组
  ],
  "total": 10
}
```

#### 6.3 获取订单详情
- **接口**：`GET /api/orders/:orderId`
- **说明**：获取订单详情
- **请求头**：需要 Authorization token
- **路径参数**：`orderId` - 订单ID
- **返回数据**：订单对象

#### 6.4 取消订单
- **接口**：`POST /api/orders/:orderId/cancel`
- **说明**：取消订单
- **请求头**：需要 Authorization token
- **路径参数**：`orderId` - 订单ID

#### 6.5 确认收货
- **接口**：`POST /api/orders/:orderId/confirm`
- **说明**：确认收货
- **请求头**：需要 Authorization token
- **路径参数**：`orderId` - 订单ID

---

### 七、砍价相关

#### 7.1 获取砍价商品列表
- **接口**：`GET /api/bargain/goods`
- **说明**：获取可砍价的商品列表
- **返回数据**：
```json
{
  "list": [
    {
      "id": "b1",
      "goodsId": "g1",
      "name": "质感沙发 · 莫兰迪灰",
      "cover": "https://...",
      "origin": 3999,           // 原价
      "price": 2199,            // 目标价
      "cut": 200,               // 已砍金额
      "cutCount": 12            // 砍价次数
    }
  ]
}
```

#### 7.2 发起砍价
- **接口**：`POST /api/bargain/start`
- **说明**：发起砍价活动
- **请求头**：需要 Authorization token
- **请求参数**：
```json
{
  "goodsId": "g1"
}
```
- **返回数据**：
```json
{
  "bargainId": "bargain1",
  "goodsId": "g1",
  "origin": 3999,
  "price": 2199,
  "cut": 0,
  "remain": 1800               // 还需砍价金额
}
```

#### 7.3 获取我的砍价列表
- **接口**：`GET /api/bargain/my`
- **说明**：获取当前用户的砍价列表
- **请求头**：需要 Authorization token
- **返回数据**：
```json
{
  "list": [
    {
      "bargainId": "bargain1",
      "goodsId": "g1",
      "name": "质感沙发",
      "origin": 3999,
      "price": 2199,
      "cut": 200,
      "remain": 1800,
      "progress": 0.1           // 进度 0-1
    }
  ]
}
```

#### 7.4 帮好友砍价
- **接口**：`POST /api/bargain/:bargainId/help`
- **说明**：帮好友砍价
- **请求头**：需要 Authorization token
- **路径参数**：`bargainId` - 砍价活动ID
- **返回数据**：
```json
{
  "cut": 20,                   // 本次砍价金额
  "remain": 1780,              // 剩余需砍金额
  "progress": 0.11
}
```

---

### 八、地址相关

#### 8.1 获取地址列表
- **接口**：`GET /api/addresses`
- **说明**：获取当前用户的地址列表
- **请求头**：需要 Authorization token
- **返回数据**：
```json
{
  "list": [
    {
      "id": "addr1",
      "name": "张三",
      "phone": "13800138000",
      "address": "北京市朝阳区...",
      "isDefault": true
    }
  ]
}
```

#### 8.2 添加地址
- **接口**：`POST /api/addresses`
- **说明**：添加收货地址
- **请求头**：需要 Authorization token
- **请求参数**：
```json
{
  "name": "张三",
  "phone": "13800138000",
  "address": "北京市朝阳区...",
  "isDefault": false
}
```

#### 8.3 更新地址
- **接口**：`PUT /api/addresses/:addressId`
- **说明**：更新收货地址
- **请求头**：需要 Authorization token
- **路径参数**：`addressId` - 地址ID
- **请求参数**：同添加地址

#### 8.4 删除地址
- **接口**：`DELETE /api/addresses/:addressId`
- **说明**：删除收货地址
- **请求头**：需要 Authorization token
- **路径参数**：`addressId` - 地址ID

---

### 九、优惠券相关

#### 9.1 获取优惠券列表
- **接口**：`GET /api/coupons`
- **说明**：获取当前用户的优惠券列表
- **请求头**：需要 Authorization token
- **请求参数**：
```
status: "available"  // available-可用, used-已用, expired-已过期
```
- **返回数据**：
```json
{
  "list": [
    {
      "id": "coupon1",
      "name": "满1000减100",
      "amount": 100,
      "minAmount": 1000,
      "expireTime": 1234567890000,
      "status": "available"
    }
  ]
}
```

---

## 🔧 分类和材质数据

### 分类列表
- **接口**：`GET /api/categories`
- **说明**：获取所有商品分类
- **返回数据**：
```json
{
  "list": [
    {
      "id": "cat1",
      "name": "沙发",
      "icon": "https://...",
      "sort": 1
    },
    {
      "id": "cat2",
      "name": "床具",
      "icon": "https://...",
      "sort": 2
    }
  ]
}
```

### 风格列表
- **接口**：`GET /api/styles`
- **说明**：获取所有风格
- **返回数据**：
```json
{
  "list": [
    {
      "id": "style1",
      "name": "现代风",
      "img": "https://..."
    },
    {
      "id": "style2",
      "name": "极简风",
      "img": "https://..."
    }
  ]
}
```

### 材质配置
材质、填充物、框架、脚等配置信息通常包含在商品详情中，如果需要单独获取：

- **接口**：`GET /api/materials` - 获取材质列表
- **接口**：`GET /api/fills` - 获取填充物列表
- **接口**：`GET /api/frames` - 获取框架列表
- **接口**：`GET /api/legs` - 获取脚部列表

---

## 📝 注意事项

1. **认证方式**：需要认证的接口，请求头需包含 `Authorization: Bearer {token}`
2. **错误处理**：所有接口统一返回格式，code 不为 0 或 200 时表示失败
3. **分页**：列表接口支持分页，默认 page=1, pageSize=20
4. **图片地址**：所有图片地址需为完整的 HTTPS URL
5. **时间格式**：时间统一使用时间戳（毫秒）
6. **价格单位**：所有价格单位为"分"或"元"（需统一，建议使用"分"）

---

## 🚀 对接步骤

1. **后端实现接口**：根据本文档实现所有接口
2. **配置 API 地址**：在小程序 `config/api.js` 中配置后端地址
3. **测试接口**：使用 Postman 或类似工具测试接口
4. **小程序测试**：在小程序中测试各个功能
5. **调整优化**：根据实际情况调整数据格式和接口

---

## 📞 对接问题

如有问题，请检查：
- 接口路径是否正确
- 请求参数格式是否正确
- 返回数据格式是否符合规范
- Token 是否正确传递
- 网络请求是否成功

