# 微信小程序对接文档

## 一、获取 AppID 和 AppSecret

### 查看位置
1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 使用管理员微信扫码登录
3. 左侧菜单：**开发管理** → **开发设置**
4. 在「开发者ID」区域可以看到：
   - **AppID(小程序ID)**：直接显示
   - **AppSecret(小程序密钥)**：点击「重置」生成（只显示一次，请妥善保存）

![AppID位置示意](https://res.wx.qq.com/wxdoc/dist/assets/img/bindmp.bindmp.bindmp.png)

---

## 二、服务器域名配置

### 配置位置
**开发管理** → **开发设置** → **服务器域名**

### 需要配置的域名
| 类型 | 域名 |
|------|------|
| request 合法域名 | `https://pkochbpmcgaa.sealoshzh.site` |
| uploadFile 合法域名 | `https://pkochbpmcgaa.sealoshzh.site` |
| downloadFile 合法域名 | `https://pkochbpmcgaa.sealoshzh.site` |

> ⚠️ 注意：域名必须是 HTTPS，且已备案（海外服务器可能需要额外处理）

---

## 三、需要您提供的信息

请将以下信息发给我（可私信或加密发送）：

```
AppID: wx________________
AppSecret: ________________________________
```

---

## 四、后端将新增的接口

### 4.1 微信登录接口
```
POST /api/wechat/login
```

**请求参数：**
```json
{
  "code": "小程序 wx.login() 返回的 code"
}
```

**返回结果：**
```json
{
  "success": true,
  "data": {
    "token": "JWT令牌",
    "user": {
      "id": "用户ID",
      "openid": "微信openid",
      "nickname": "昵称",
      "avatar": "头像URL"
    },
    "isNewUser": true
  }
}
```

### 4.2 更新用户信息接口
```
POST /api/wechat/update-profile
```

**请求参数：**
```json
{
  "nickname": "用户昵称",
  "avatar": "头像URL",
  "phone": "手机号（可选）"
}
```

### 4.3 获取手机号接口
```
POST /api/wechat/get-phone
```

**请求参数：**
```json
{
  "code": "button 获取的 code"
}
```

---

## 五、微信支付（预留接口）

> 暂未开通，后续需要时配置

### 5.1 需要额外提供的信息
```
商户号(mch_id): __________________
API密钥(API Key): ________________________________
API证书: apiclient_cert.pem, apiclient_key.pem
```

### 5.2 支付接口（预留）
```
POST /api/wechat/pay/create    # 创建支付订单
POST /api/wechat/pay/notify    # 支付回调通知
GET  /api/wechat/pay/query     # 查询支付状态
```

---

## 六、小程序端代码示例

### 6.1 登录示例
```javascript
// app.js 或 登录页面
async function wechatLogin() {
  try {
    // 1. 获取微信登录 code
    const { code } = await wx.login();
    
    // 2. 发送到后端换取 token
    const res = await wx.request({
      url: 'https://pkochbpmcgaa.sealoshzh.site/api/wechat/login',
      method: 'POST',
      data: { code },
      header: { 'Content-Type': 'application/json' }
    });
    
    // 3. 保存 token
    if (res.data.success) {
      wx.setStorageSync('token', res.data.data.token);
      wx.setStorageSync('userInfo', res.data.data.user);
    }
  } catch (error) {
    console.error('登录失败:', error);
  }
}
```

### 6.2 请求封装示例
```javascript
// utils/request.js
const BASE_URL = 'https://pkochbpmcgaa.sealoshzh.site/api';

function request(options) {
  const token = wx.getStorageSync('token');
  
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        if (res.statusCode === 401) {
          // token 过期，重新登录
          wx.removeStorageSync('token');
          wx.navigateTo({ url: '/pages/login/login' });
          reject(new Error('登录已过期'));
        } else {
          resolve(res.data);
        }
      },
      fail: reject
    });
  });
}

module.exports = { request, BASE_URL };
```

### 6.3 调用商品接口示例
```javascript
const { request } = require('../../utils/request');

// 获取商品列表
async function getProducts(page = 1, pageSize = 10) {
  return await request({
    url: `/products?page=${page}&pageSize=${pageSize}`,
    method: 'GET'
  });
}

// 获取商品详情
async function getProductDetail(id) {
  return await request({
    url: `/products/${id}`,
    method: 'GET'
  });
}

// 添加到购物车
async function addToCart(productId, skuId, quantity, selectedMaterials) {
  return await request({
    url: '/cart/add',
    method: 'POST',
    data: { productId, skuId, quantity, selectedMaterials }
  });
}

// 创建订单
async function createOrder(orderData) {
  return await request({
    url: '/orders',
    method: 'POST',
    data: orderData
  });
}
```

---

## 七、现有可用的 API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/products` | GET | 商品列表 |
| `/api/products/:id` | GET | 商品详情 |
| `/api/categories` | GET | 分类列表 |
| `/api/orders` | POST | 创建订单 |
| `/api/orders` | GET | 我的订单列表 |
| `/api/orders/:id` | GET | 订单详情 |
| `/api/files/:id` | GET | 获取图片 |

---

## 八、对接步骤清单

- [ ] 1. 您提供 AppID 和 AppSecret
- [ ] 2. 您配置服务器域名白名单
- [ ] 3. 我开发微信登录接口
- [ ] 4. 您修改小程序登录逻辑
- [ ] 5. 联调测试
- [ ] 6. （后续）开通微信支付

---

## 九、常见问题

### Q: 开发时域名校验失败怎么办？
在微信开发者工具中：**设置** → **项目设置** → 勾选「不校验合法域名」

### Q: 真机调试时请求失败？
确保服务器域名已在微信后台配置，且证书有效

### Q: 图片无法显示？
使用 `https://pkochbpmcgaa.sealoshzh.site/api/files/{fileId}` 格式

---

**文档版本：** v1.0  
**更新时间：** 2025-12-03
