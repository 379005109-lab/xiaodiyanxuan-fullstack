# 授权系统测试文档

## 系统概述

多厂家授权系统已实现，支持以下功能：

### 核心功能

1. **厂家间授权** - 厂家A可以授权商品给厂家B
2. **厂家授权设计师** - 厂家可以授权商品给设计师
3. **价格体系** - 前端展示价格不变，授权价格仅用于拿货
4. **分级授权** - 支持全部商品、按分类、指定商品三种授权范围
5. **权限隔离** - 厂家只能管理自己的商品，被授权商品只读

## API 端点

### 1. 创建授权
```
POST /api/authorizations
Authorization: Bearer {token}

Body:
{
  "authorizationType": "manufacturer",  // 或 "designer"
  "toManufacturer": "厂家ID",           // 授权给厂家时必填
  "toDesigner": "设计师ID",             // 授权给设计师时必填
  "scope": "all",                       // "all" | "category" | "specific"
  "categories": ["沙发", "床"],         // 当scope=category时
  "products": ["商品ID1", "商品ID2"],   // 当scope=specific时
  "priceSettings": {
    "globalDiscount": 0.85,             // 全局折扣率 (85折)
    "categoryDiscounts": [
      {
        "category": "沙发",
        "discount": 0.9              // 沙发类90折
      }
    ],
    "productPrices": [
      {
        "productId": "商品ID",
        "price": 5000,               // 固定价格
        "discount": 0.8              // 或使用折扣率
      }
    ]
  },
  "validUntil": "2025-12-31",          // 有效期，为空则永久
  "allowSubAuthorization": true,       // 是否允许下级授权
  "notes": "备注说明"
}
```

### 2. 查询我授权给别人的
```
GET /api/authorizations/my-grants
Authorization: Bearer {token}
```

### 3. 查询我收到的授权
```
GET /api/authorizations/received
Authorization: Bearer {token}
```

### 4. 获取授权商品列表
```
GET /api/authorizations/products/authorized?page=1&pageSize=20&category=沙发
Authorization: Bearer {token}

返回:
{
  "success": true,
  "data": [
    {
      ...商品信息,
      "authorizedPrice": 8500,      // 授权价格
      "authorizationInfo": {
        "fromManufacturer": "厂家ID",
        "discount": 0.85,
        "allowSubAuthorization": true
      }
    }
  ]
}
```

### 5. 获取单个商品的授权价格
```
GET /api/authorizations/products/:productId/price
Authorization: Bearer {token}

返回:
{
  "success": true,
  "data": {
    "basePrice": 10000,            // 基础价格
    "authorizedPrice": 8500,       // 授权价格
    "discount": 0.85,              // 折扣率
    "isOwner": false,              // 是否商品所有者
    "allowSubAuthorization": true  // 是否允许再授权
  }
}
```

### 6. 更新授权
```
PUT /api/authorizations/:id
Authorization: Bearer {token}

Body:
{
  "priceSettings": {...},
  "status": "active",            // "active" | "suspended" | "revoked"
  "notes": "更新备注"
}
```

### 7. 撤销授权
```
DELETE /api/authorizations/:id
Authorization: Bearer {token}
```

## 测试步骤

### 步骤1：准备测试数据

1. 创建2个厂家账号（厂家A、厂家B）
2. 创建1个设计师账号
3. 厂家A添加几个商品（沙发、床等不同分类）

### 步骤2：测试厂家间授权

```bash
# 厂家A登录，获取token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"厂家A用户名","password":"密码"}'

# 使用厂家A的token创建授权给厂家B
curl -X POST http://localhost:8080/api/authorizations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {厂家A_TOKEN}" \
  -d '{
    "authorizationType": "manufacturer",
    "toManufacturer": "厂家B_ID",
    "scope": "all",
    "priceSettings": {
      "globalDiscount": 0.85
    },
    "allowSubAuthorization": true
  }'

# 厂家B登录，查询收到的授权
curl -X GET http://localhost:8080/api/authorizations/received \
  -H "Authorization: Bearer {厂家B_TOKEN}"

# 厂家B查询授权商品列表
curl -X GET "http://localhost:8080/api/authorizations/products/authorized?page=1&pageSize=20" \
  -H "Authorization: Bearer {厂家B_TOKEN}"
```

### 步骤3：测试授权给设计师

```bash
# 厂家A授权给设计师
curl -X POST http://localhost:8080/api/authorizations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {厂家A_TOKEN}" \
  -d '{
    "authorizationType": "designer",
    "toDesigner": "设计师_ID",
    "scope": "category",
    "categories": ["沙发", "床"],
    "priceSettings": {
      "categoryDiscounts": [
        {"category": "沙发", "discount": 0.9},
        {"category": "床", "discount": 0.88}
      ]
    }
  }'

# 设计师查询授权商品
curl -X GET http://localhost:8080/api/authorizations/received \
  -H "Authorization: Bearer {设计师_TOKEN}"
```

### 步骤4：测试价格查询

```bash
# 查询商品的授权价格
curl -X GET "http://localhost:8080/api/authorizations/products/{商品ID}/price" \
  -H "Authorization: Bearer {厂家B_TOKEN}"

# 应返回:
# {
#   "success": true,
#   "data": {
#     "basePrice": 10000,
#     "authorizedPrice": 8500,  // 10000 * 0.85
#     "discount": 0.85,
#     "isOwner": false,
#     "allowSubAuthorization": true
#   }
# }
```

### 步骤5：测试权限控制

```bash
# 厂家B尝试修改厂家A的商品（应该失败）
curl -X PUT "http://localhost:8080/api/products/{厂家A的商品ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {厂家B_TOKEN}" \
  -d '{"name":"修改后的名称"}'

# 应返回 403 Forbidden
```

## 数据模型说明

### Authorization Schema

```javascript
{
  fromManufacturer: ObjectId,      // 授权方厂家
  toManufacturer: ObjectId,        // 被授权厂家
  toDesigner: ObjectId,            // 被授权设计师
  authorizationType: String,       // 'manufacturer' | 'designer'
  scope: String,                   // 'all' | 'category' | 'specific'
  categories: [String],            // 授权的分类
  products: [ObjectId],            // 授权的商品
  priceSettings: {
    globalDiscount: Number,        // 全局折扣
    categoryDiscounts: [{
      category: String,
      discount: Number
    }],
    productPrices: [{
      productId: ObjectId,
      price: Number,
      discount: Number
    }]
  },
  status: String,                  // 'active' | 'suspended' | 'revoked'
  validFrom: Date,
  validUntil: Date,
  allowSubAuthorization: Boolean,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 重要说明

1. **前端价格不变** - 前端网站显示的价格始终是商品的 `basePrice`，不受授权影响
2. **授权价格仅后台** - 授权价格仅在厂家/设计师后台可见，用于拿货定价
3. **权限严格控制** - 厂家只能修改自己的商品，授权商品仅可读
4. **多重授权** - 设计师可以收到多个厂家的授权
5. **下级授权** - 如果允许，被授权方可以继续授权给他人

## 本地测试清单

- [ ] 启动本地后端服务器 (localhost:8080)
- [ ] 创建测试厂家账号
- [ ] 创建测试设计师账号
- [ ] 测试厂家间授权
- [ ] 测试授权给设计师
- [ ] 测试授权商品查询
- [ ] 测试授权价格计算
- [ ] 测试权限控制
- [ ] 测试授权更新/撤销
- [ ] 前端页面集成测试

## 下一步计划

1. ✅ 创建授权数据模型
2. ✅ 实现授权管理API
3. ✅ 注册路由并启动本地服务器
4. ⏳ 创建前端授权管理界面
5. ⏳ 修改厂家商品管理页面，区分自有和授权商品
6. ⏳ 添加授权价格显示
7. ⏳ 完整测试后部署到生产环境
