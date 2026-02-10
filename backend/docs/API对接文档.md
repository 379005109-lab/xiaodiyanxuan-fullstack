# 小迪严选商城系统 — API 接口对接文档

> **文档版本**：v1.0.0 | **生成日期**：2026-02-10 | **技术栈**：Node.js / Express + MongoDB

---

## 目录

- [一、全局规范](#一全局规范)
- [二、接口清单总表](#二接口清单总表)
- [三、接口详述 — 认证](#三接口详述--认证)
- [四、接口详述 — 用户](#四接口详述--用户)
- [五、接口详述 — 商品与分类](#五接口详述--商品与分类)
- [六、接口详述 — 订单与支付](#六接口详述--订单与支付)
- [七、接口详述 — 购物车/收藏/地址](#七接口详述--购物车收藏地址)
- [八、接口详述 — 优惠券/发票/砍价/套餐](#八接口详述--优惠券发票砍价套餐)
- [九、接口详述 — Banner/首页/文件/对比/通知](#九接口详述--banner首页文件对比通知)
- [十、接口详述 — 仪表板/配置/定制/代客/浏览/陪买/退款](#十接口详述--仪表板配置定制代客浏览陪买退款)
- [十一、接口详述 — 厂家/厂家订单/授权/推荐/渠道/佣金/阶梯/图搜](#十一接口详述--厂家厂家订单授权推荐渠道佣金阶梯图搜)
- [十二、接口详述 — 小程序专用接口](#十二接口详述--小程序专用接口)
- [十三、典型对接流程](#十三典型对接流程)
- [十四、联调与环境](#十四联调与环境)

---

## 一、全局规范

### 1.1 Base URL

| 环境 | Base URL | 说明 |
|---|---|---|
| 生产 | `https://xiaodiyanxuan.com` | HTTPS，Sealos 容器部署 |
| 开发 | `http://localhost:8080` | 端口由 `PORT` 环境变量控制 |

所有接口以 `/api` 开头。健康检查：`GET /health`（公开）。

### 1.2 通用请求头

| Header | 必填 | 值 |
|---|---|---|
| `Content-Type` | 是 | `application/json`（文件上传用 `multipart/form-data`） |
| `Authorization` | 按接口 | `Bearer <token>` |

### 1.3 通用响应结构

**主 API（`/api/*`）：**

```json
// 成功
{"success": true, "data": {...}, "message": "操作成功"}
// 失败
{"success": false, "message": "错误描述", "code": 400}
// 分页
{"success": true, "data": [...], "pagination": {"page":1,"limit":10,"total":100,"totalPages":10}}
```

**小程序专用（`/api/miniapp/*`）：**

```json
// 成功
{"code": 0, "data": {...}, "message": "success"}
// 失败
{"code": 400, "message": "错误描述"}
```

### 1.4 分页/排序/过滤

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `page` | Number | 1 | 页码 |
| `pageSize`/`limit` | Number | 10 | 每页条数（最大100） |
| `sort` | String | - | 排序（如 `price_asc`/`price_desc`/`sales`/`newest`） |
| `keyword` | String | - | 搜索关键词 |
| `status` | String | - | 状态筛选 |

### 1.5 鉴权机制

**Token 获取方式：**
- 用户名密码：`POST /api/auth/login`（传 `username`+`password`）
- 微信 code：`POST /api/auth/login`（传 `code`）
- 手机号注册：`POST /api/auth/register`（传 `phone`+`verifyCode`）
- 小程序登录：`POST /api/miniapp/auth/wxlogin` / `auth/login` / `auth/phone-login`

**传递方式：** `Authorization: Bearer <token>`

**有效期：** 7天（`JWT_EXPIRES_IN`）。刷新：`POST /api/auth/refresh`。

**鉴权标注：** `-` 无需鉴权 | `○` 可选 | `●` 需登录 | `★` 需管理员/特定角色

**用户角色：** `super_admin` | `platform_admin` | `platform_staff` | `enterprise_admin` | `enterprise_staff` | `designer` | `special_guest` | `customer`

### 1.6 安全与风控

| 机制 | 状态 |
|---|---|
| HTTPS / Helmet / CORS | ✅ 已实现 |
| JWT 签名(HS256) / 账号状态检查 / 厂家效期检查 | ✅ 已实现 |
| 短信验证码限流（60s/次，5min有效） | ✅ 已实现 |
| 下载限流（5min内≥10次自动标记+延迟响应） | ✅ 已实现 |
| 请求签名/时间戳/防重放/幂等键/全局Rate Limiting | ❌ 未实现 |

### 1.7 统一错误码表

| HTTP | 含义 | 可重试 | 处理建议 |
|---|---|---|---|
| 400 | 请求错误/参数校验失败 | 否 | 检查参数 |
| 401 | 未授权（Token缺失/无效/过期） | 否 | 重新登录 |
| 403 | 禁止（账号禁用/无权限/厂家过期） | 否 | 检查权限 |
| 404 | 资源不存在 | 否 | 检查ID |
| 500 | 服务器内部错误 | 是 | 稍后重试 |

常见消息：`No token provided` / `Invalid token` / `User not found` / `账号已被禁用` / `无权限执行此操作`

---

## 二、接口清单总表

### 2.1 认证（Auth）

| 方法 | 路径 | 用途 | 鉴权 | 定位 |
|---|---|---|---|---|
| POST | `/api/auth/login` | 通用登录 | - | routes/auth.js |
| POST | `/api/auth/wxlogin` | 微信登录(别名) | - | routes/auth.js |
| POST | `/api/auth/send-code` | 发送短信验证码 | - | routes/auth.js |
| POST | `/api/auth/register` | 手机号注册 | - | routes/auth.js |
| POST | `/api/auth/refresh` | 刷新Token | ● | routes/auth.js |
| POST | `/api/auth/logout` | 退出登录 | ● | routes/auth.js |

### 2.2 用户（Users / Accounts）

| 方法 | 路径 | 用途 | 鉴权 | 定位 |
|---|---|---|---|---|
| GET | `/api/users` | 获取所有用户 | ● | routes/users.js |
| GET | `/api/users/profile` | 获取当前用户资料 | ● | routes/users.js |
| PUT | `/api/users/profile` | 更新当前用户资料 | ● | routes/users.js |
| GET | `/api/users/:id/profile` | 获取指定用户资料 | ● | routes/users.js |
| PUT | `/api/users/:id` | 更新指定用户 | ● | routes/users.js |
| POST | `/api/users/track-download` | 追踪下载 | ● | routes/users.js |
| GET | `/api/users/:id/tags` | 获取用户标签 | ● | routes/users.js |
| POST | `/api/users/:id/tags` | 添加用户标签 | ● | routes/users.js |
| DELETE | `/api/users/:id/tags/:tag` | 移除用户标签 | ● | routes/users.js |
| POST | `/api/users/batch-update` | 批量更新 | ★ | routes/users-batch.js |
| GET | `/api/accounts/dashboard` | 用户看板统计 | ★ | routes/accounts.js |
| GET | `/api/accounts/organizations` | 组织列表 | ★ | routes/accounts.js |
| POST | `/api/accounts/organizations` | 创建组织 | ★ | routes/accounts.js |
| PUT | `/api/accounts/organizations/:id` | 更新组织 | ★ | routes/accounts.js |
| DELETE | `/api/accounts/organizations/:id` | 删除组织 | ★ | routes/accounts.js |
| PUT | `/api/accounts/organizations/:id/discount` | 设置组织折扣 | ★ | routes/accounts.js |
| GET | `/api/accounts/users` | 获取用户列表 | ★ | routes/accounts.js |
| POST | `/api/accounts/users` | 创建用户 | ★ | routes/accounts.js |
| PUT | `/api/accounts/users/:id` | 更新用户 | ★ | routes/accounts.js |
| POST | `/api/accounts/users/:id/reset-password` | 重置密码 | ★ | routes/accounts.js |
| DELETE | `/api/accounts/users/:id` | 删除用户 | ★ | routes/accounts.js |
| GET | `/api/accounts/special-accounts` | 特殊账号列表 | ★ | routes/accounts.js |
| POST | `/api/accounts/special-accounts` | 创建特殊账号 | ★ | routes/accounts.js |
| POST | `/api/accounts/special-accounts/:id/invalidate` | 作废特殊账号 | ★ | routes/accounts.js |
| GET | `/api/accounts/stats` | 角色统计 | ★ | routes/accounts.js |

### 2.3 商品（Products）

| 方法 | 路径 | 用途 | 鉴权 | 定位 |
|---|---|---|---|---|
| GET | `/api/products` | 商品列表 | ○ | routes/products.js |
| GET | `/api/products/categories` | 商品分类 | - | routes/products.js |
| GET | `/api/products/styles` | 商品风格 | - | routes/products.js |
| GET | `/api/products/search` | 搜索商品 | ○ | routes/products.js |
| POST | `/api/products/bulk-import` | 批量导入 | ● | routes/products.js |
| POST | `/api/products` | 创建商品 | ● | routes/products.js |
| GET | `/api/products/:id` | 商品详情 | ○ | routes/products.js |
| PUT | `/api/products/:id` | 更新商品 | ● | routes/products.js |
| DELETE | `/api/products/:id` | 删除商品 | ● | routes/products.js |
| GET | `/api/products/:id/stats` | 商品统计 | ● | routes/products.js |
| GET | `/api/products/:id/pricing` | 定价配置 | ● | routes/products.js |
| PUT | `/api/products/:id/pricing` | 更新定价 | ● | routes/products.js |
| PATCH | `/api/products/:id/status` | 切换上下架 | ● | routes/products.js |
| GET | `/api/products/:id/reviews` | 商品评价 | - | routes/products.js |
| POST | `/api/products/:id/reviews` | 创建评价 | ● | routes/products.js |

### 2.4 分类（Categories）

| 方法 | 路径 | 用途 | 鉴权 |
|---|---|---|---|
| GET | `/api/categories` | 分类列表 | ○ |
| GET | `/api/categories/stats` | 分类统计 | ○ |
| POST | `/api/categories/discounts/batch` | 批量设置折扣 | ● |
| POST | `/api/categories` | 创建分类 | ● |
| GET | `/api/categories/:id` | 分类详情 | ○ |
| PUT | `/api/categories/:id` | 更新分类 | ● |
| DELETE | `/api/categories/:id` | 删除分类 | ● |

### 2.5 材质（Materials）

| 方法 | 路径 | 用途 | 鉴权 |
|---|---|---|---|
| GET | `/api/materials` | 材质列表 | - |
| GET | `/api/materials/stats` | 统计 | - |
| POST | `/api/materials/images-by-names` | 批量获取材质图片 | - |
| GET | `/api/materials/:id` | 详情 | - |
| POST | `/api/materials` | 创建 | ● |
| PUT | `/api/materials/:id` | 更新 | ● |
| DELETE | `/api/materials/:id` | 删除 | ● |
| POST | `/api/materials/batch-delete` | 批量删除 | ● |
| POST | `/api/materials/approve-all` | 批量审核 | ● |
| POST | `/api/materials/cleanup-orphaned` | 清理孤立材质 | ● |
| GET | `/api/materials/categories/list` | 材质分类列表 | - |
| POST | `/api/materials/categories` | 创建材质分类 | ● |
| PUT | `/api/materials/categories/:id` | 更新材质分类 | ● |
| DELETE | `/api/materials/categories/:id` | 删除材质分类 | ● |

### 2.6 订单（Orders）

| 方法 | 路径 | 用途 | 鉴权 |
|---|---|---|---|
| POST | `/api/orders` | 创建订单 | ● |
| GET | `/api/orders` | 订单列表 | ● |
| GET | `/api/orders/stats` | 订单统计 | ● |
| GET | `/api/orders/commission-stats` | 返佣统计 | ● |
| POST | `/api/orders/package` | 创建套餐订单 | ● |
| GET | `/api/orders/package/:id` | 套餐订单详情 | ● |
| GET | `/api/orders/:id` | 订单详情 | ● |
| POST | `/api/orders/:id/cancel` | 取消订单 | ● |
| POST | `/api/orders/:id/confirm` | 确认收货 | ● |
| PUT | `/api/orders/:id/invoice-status` | 更新开票状态 | ● |
| POST | `/api/orders/:id/pay` | 确认付款 | ● |
| POST | `/api/orders/:id/verify-payment` | 厂家确认收款 | ● |
| POST | `/api/orders/:id/pay-deposit` | 支付定金 | ● |
| POST | `/api/orders/:id/verify-deposit` | 核销定金 | ● |
| POST | `/api/orders/:id/request-final-payment` | 发起尾款请求 | ● |
| POST | `/api/orders/:id/pay-final` | 支付尾款 | ● |
| POST | `/api/orders/:id/verify-final-payment` | 核销尾款 | ● |
| POST | `/api/orders/:id/manufacturer-confirm` | 厂家确认订单 | ● |
| POST | `/api/orders/:id/settlement-mode` | 设置结算模式 | ● |

### 2.7 购物车 / 收藏 / 地址

| 方法 | 路径 | 用途 | 鉴权 |
|---|---|---|---|
| GET | `/api/cart` | 获取购物车 | ● |
| POST | `/api/cart` | 添加到购物车 | ● |
| PUT | `/api/cart/:id` | 更新购物车项 | ● |
| DELETE | `/api/cart/:id` | 删除购物车项 | ● |
| DELETE | `/api/cart/clear` | 清空购物车 | ● |
| GET | `/api/favorites` | 收藏列表 | ● |
| GET | `/api/favorites/check/:productId` | 检查是否收藏 | ● |
| POST | `/api/favorites` | 添加收藏 | ● |
| DELETE | `/api/favorites/:id` | 删除收藏 | ● |
| GET | `/api/addresses` | 地址列表 | ● |
| POST | `/api/addresses` | 创建地址 | ● |
| PUT | `/api/addresses/:id` | 更新地址 | ● |
| PUT | `/api/addresses/:id/default` | 设为默认 | ● |
| DELETE | `/api/addresses/:id` | 删除地址 | ● |

### 2.8 优惠券 / 发票 / 砍价 / 套餐

| 方法 | 路径 | 用途 | 鉴权 |
|---|---|---|---|
| GET | `/api/coupons` | 优惠券列表 | ○ |
| GET | `/api/coupons/admin` | 后台优惠券列表 | ● |
| POST | `/api/coupons` | 创建优惠券 | ● |
| PUT | `/api/coupons/:id` | 更新优惠券 | ● |
| DELETE | `/api/coupons/:id` | 删除优惠券 | ● |
| POST | `/api/coupons/:id/claim` | 领取优惠券 | ● |
| POST | `/api/coupons/shopping-service` | 陪买发券 | ● |
| GET | `/api/invoice-info` | 开票信息列表 | ● |
| GET | `/api/invoice-info/:id` | 开票信息详情 | ● |
| POST | `/api/invoice-info` | 新增开票信息 | ● |
| PUT | `/api/invoice-info/:id` | 更新开票信息 | ● |
| DELETE | `/api/invoice-info/:id` | 删除开票信息 | ● |
| PUT | `/api/invoice-info/:id/default` | 设为默认 | ● |
| GET | `/api/bargains` | 可砍价商品列表 | ○ |
| GET | `/api/bargains/products` | 后台砍价商品 | ● |
| POST | `/api/bargains/products` | 创建砍价商品 | ● |
| PUT | `/api/bargains/products/:id` | 更新砍价商品 | ● |
| DELETE | `/api/bargains/products/:id` | 删除砍价商品 | ● |
| POST | `/api/bargains` | 发起砍价 | ● |
| GET | `/api/bargains/:id` | 砍价详情 | ○ |
| DELETE | `/api/bargains/:id` | 取消砍价 | ● |
| POST | `/api/bargains/:id/help` | 帮好友砍价 | ● |
| GET | `/api/packages` | 套餐列表 | ○ |
| POST | `/api/packages` | 创建套餐 | ● |
| PUT | `/api/packages/:id` | 更新套餐 | ● |
| DELETE | `/api/packages/:id` | 删除套餐 | ● |
| GET | `/api/packages/:id` | 套餐详情 | ○ |

### 2.9 Banner / 首页 / 文件 / 对比 / 通知 / 仪表板

| 方法 | 路径 | 用途 | 鉴权 |
|---|---|---|---|
| GET | `/api/banners` | Banner列表 | - |
| GET | `/api/banners/:id` | Banner详情 | - |
| POST | `/api/banners` | 创建Banner | ● |
| PUT | `/api/banners/:id` | 更新Banner | ● |
| DELETE | `/api/banners/:id` | 删除Banner | ● |
| GET | `/api/home` | 首页数据 | ○ |
| POST | `/api/files` | 上传文件 | ○ |
| POST | `/api/files/upload` | 上传文件(别名) | ○ |
| POST | `/api/files/upload-multiple` | 多文件上传 | ● |
| GET | `/api/files/:fileId` | 下载文件 | - |
| GET | `/api/files/:fileId/info` | 文件信息 | - |
| DELETE | `/api/files/:fileId` | 删除文件 | ● |
| GET | `/api/compare` | 对比列表 | ● |
| GET | `/api/compare/stats` | 对比统计 | ● |
| POST | `/api/compare` | 添加对比 | ● |
| DELETE | `/api/compare/:productId` | 移除对比 | ● |
| DELETE | `/api/compare` | 清空对比 | ● |
| GET | `/api/notifications` | 通知列表 | ● |
| GET | `/api/notifications/unread/count` | 未读数 | ● |
| GET | `/api/notifications/stats` | 通知统计 | ● |
| POST | `/api/notifications` | 创建通知 | ● |
| PATCH | `/api/notifications/:id/read` | 标记已读 | ● |
| PATCH | `/api/notifications/mark-all-read` | 全部已读 | ● |
| DELETE | `/api/notifications/:id` | 删除通知 | ● |
| DELETE | `/api/notifications/clear-all` | 清空通知 | ● |
| GET | `/api/dashboard` | 仪表板数据 | ● |
| GET | `/api/dashboard/activity` | 用户活跃度 | ● |
| GET | `/api/dashboard/user-logins` | 登录详情 | ● |

### 2.10 配置 / 定制 / 代客 / 浏览 / 陪买 / 退款

| 方法 | 路径 | 用途 | 鉴权 |
|---|---|---|---|
| GET | `/api/site-config` | 所有配置 | - |
| GET | `/api/site-config/:key` | 单个配置 | - |
| PUT | `/api/site-config/:key` | 更新配置 | ● |
| POST | `/api/site-config/batch` | 批量更新 | ● |
| GET | `/api/site-settings/me` | 我的站点设置 | ● |
| PUT | `/api/site-settings/me` | 更新站点设置 | ● |
| POST | `/api/customization` | 创建定制需求 | - |
| GET | `/api/customization` | 定制列表 | ● |
| GET | `/api/customization/:id` | 定制详情 | ● |
| PUT | `/api/customization/:id` | 更新定制 | ● |
| DELETE | `/api/customization/:id` | 删除定制 | ● |
| POST | `/api/concierge/session` | 创建代客会话 | ● |
| GET | `/api/concierge/session/:token` | 获取代客会话 | - |
| POST | `/api/browse-history` | 记录浏览 | ○ |
| GET | `/api/browse-history/my` | 我的浏览 | ● |
| GET | `/api/browse-history/my/path` | 浏览路径 | ● |
| GET | `/api/browse-history/my/stats` | 浏览统计 | ● |
| GET | `/api/browse-history/all` | 全部浏览(管理员) | ● |
| GET | `/api/browse-history/user/:userId` | 用户浏览(管理员) | ● |
| POST | `/api/buying-service-requests` | 创建陪买预约 | ● |
| GET | `/api/buying-service-requests` | 预约列表 | ● |
| PUT | `/api/buying-service-requests/:id/status` | 更新预约状态 | ● |
| DELETE | `/api/buying-service-requests/:id` | 删除预约 | ● |
| GET | `/api/refunds` | 退款列表 | ● |
| GET | `/api/refunds/:id` | 退款详情 | ● |
| POST | `/api/refunds` | 创建退款 | ● |
| PUT | `/api/refunds/:id/handle` | 处理退款 | ● |
| PUT | `/api/refunds/:id/complete` | 完成退款 | ● |
| DELETE | `/api/refunds/:id` | 删除退款 | ● |

### 2.11 厂家 / 厂家订单 / 授权 / 推荐 / 渠道 / 佣金 / 阶梯 / 图搜

| 方法 | 路径 | 用途 | 鉴权 |
|---|---|---|---|
| GET | `/api/manufacturers/:mId/product-categories` | 厂家商品分类 | - |
| GET | `/api/manufacturers` | 厂家列表 | ● |
| GET | `/api/manufacturers/all` | 全部厂家 | ● |
| POST | `/api/manufacturers` | 创建厂家 | ● |
| GET | `/api/manufacturers/:id` | 厂家详情 | ● |
| PUT | `/api/manufacturers/:id` | 更新厂家 | ● |
| DELETE | `/api/manufacturers/:id` | 删除厂家 | ● |
| POST | `/api/manufacturer-orders/dispatch/:orderId` | 分发订单 | ★ |
| GET | `/api/manufacturer-orders` | 厂家订单列表 | ● |
| PUT | `/api/manufacturer-orders/:id/status` | 更新厂家订单状态 | ● |
| POST | `/api/authorizations` | 创建授权 | ● |
| GET | `/api/authorizations` | 授权列表 | ● |
| GET | `/api/authorizations/pending-requests` | 待审批 | ● |
| GET | `/api/authorizations/summary` | 授权摘要 | ● |
| GET | `/api/authorizations/my-grants` | 我授出的 | ● |
| GET | `/api/authorizations/stats` | 授权统计 | ● |
| GET | `/api/authorizations/tier-hierarchy` | 层级结构 | ● |
| GET | `/api/authorizations/received` | 收到的授权 | ● |
| GET | `/api/authorizations/:id` | 授权详情 | ● |
| PUT | `/api/authorizations/:id` | 更新授权 | ● |
| POST | `/api/authorizations/designer-requests` | 设计师申请 | ● |
| PUT | `/api/authorizations/designer-requests/:id/approve` | 审批通过 | ● |
| PUT | `/api/authorizations/designer-requests/:id/reject` | 驳回 | ● |
| POST | `/api/authorizations/manufacturer-requests` | 厂家授权申请 | ● |
| PUT | `/api/authorizations/manufacturer-requests/:id/approve` | 审批通过 | ● |
| PUT | `/api/authorizations/manufacturer-requests/:id/reject` | 驳回 | ● |
| POST | `/api/referrals` | 创建推荐 | - |
| GET | `/api/referrals/my/:userId` | 我的推荐 | - |
| GET | `/api/referrals` | 推荐列表(管理端) | - |
| GET | `/api/referrals/:id` | 推荐详情 | - |
| PUT | `/api/referrals/:id` | 更新推荐 | - |
| DELETE | `/api/referrals/:id` | 删除推荐 | - |
| GET | `/api/channel-partners` | 渠道商列表 | ● |
| POST | `/api/channel-partners` | 创建渠道商 | ● |
| PUT | `/api/channel-partners/:id` | 更新渠道商 | ● |
| DELETE | `/api/channel-partners/:id` | 删除渠道商 | ● |
| GET | `/api/commission-system` | 分成体系 | ● |
| POST | `/api/commission-system/manufacturer/:mId` | 创建分成体系 | ● |
| PUT | `/api/commission-system/manufacturer/:mId` | 更新分成体系 | ● |
| GET | `/api/tier-system` | 阶梯体系 | ● |
| PUT | `/api/tier-system` | 更新阶梯体系 | ● |
| GET | `/api/tier-system/effective` | 生效规则 | ● |
| GET | `/api/tier-system/reconciliation` | 对账 | ● |
| POST | `/api/image-search` | 以图搜图 | ○ |

### 2.12 小程序专用（Miniapp）

| 方法 | 路径 | 用途 | 鉴权 |
|---|---|---|---|
| POST | `/api/miniapp/auth/wxlogin` | 微信登录 | - |
| POST | `/api/miniapp/auth/login` | 账号登录 | - |
| POST | `/api/miniapp/auth/send-code` | 发送验证码 | - |
| POST | `/api/miniapp/auth/phone-login` | 手机号登录 | - |
| GET | `/api/miniapp/user/info` | 用户信息 | ● |
| PUT | `/api/miniapp/user/update` | 更新用户 | ● |
| GET | `/api/miniapp/styles` | 风格列表 | - |
| GET | `/api/miniapp/categories` | 分类列表 | - |
| GET | `/api/miniapp/home` | 首页数据 | - |
| GET | `/api/miniapp/goods/list` | 商品列表 | - |
| GET | `/api/miniapp/goods/search` | 搜索商品 | - |
| GET | `/api/miniapp/goods/:id` | 商品详情 | - |
| GET | `/api/miniapp/recommendations` | 推荐商品 | - |
| GET | `/api/miniapp/orders` | 订单列表 | ● |
| POST | `/api/miniapp/orders` | 创建订单 | ● |
| GET | `/api/miniapp/orders/:orderId` | 订单详情 | ● |
| POST | `/api/miniapp/orders/:orderId/cancel` | 取消订单 | ● |
| POST | `/api/miniapp/orders/:orderId/confirm` | 确认收货 | ● |
| GET | `/api/miniapp/packages` | 套餐列表 | - |
| GET | `/api/miniapp/packages/:id` | 套餐详情 | - |

---

## 三、接口详述 — 认证

### 3.1 通用登录

```
POST /api/auth/login
鉴权：无
```

**请求参数（Body）：**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `username` | String | 否* | 用户名（与 password 配合） |
| `password` | String | 否* | 密码 |
| `code` | String | 否* | 微信登录 code |

> *须提供 `username`+`password` 或 `code` 之一。

**curl 示例：**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123456"}'
```

**成功响应：**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "_id": "60a1b2c3d4e5f6...",
      "username": "testuser",
      "nickname": "测试用户",
      "role": "designer",
      "avatar": "https://..."
    }
  },
  "message": "操作成功"
}
```

**业务规则：**
- 支持用户名密码和微信 code 两种方式
- 微信登录用户不存在时自动创建
- 密码使用 bcryptjs 加密比对
- Token 有效期 7 天

---

### 3.2 发送短信验证码

```
POST /api/auth/send-code
鉴权：无
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `phone` | String | 是 | 11位手机号 |

**业务规则：**
- 同号 60 秒内只能发一次
- 验证码 5 分钟有效
- 阿里云短信服务
- 开发环境响应可能直接包含 `code` 字段

---

### 3.3 手机号注册

```
POST /api/auth/register
鉴权：无
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `phone` | String | 是 | 手机号 |
| `verifyCode` | String | 是 | 短信验证码 |

**成功响应：** 返回 `token` + `user` 对象。注册成功后自动登录，默认角色 `customer`。

---

### 3.4 刷新 Token

```
POST /api/auth/refresh
鉴权：● 需登录
```

返回新 `token`。当前 token 必须仍在有效期内。

---

### 3.5 退出登录

```
POST /api/auth/logout
鉴权：● 需登录
```

服务端未维护 token 黑名单，客户端清除本地 token 即可。

---

## 四、接口详述 — 用户

### 4.1 获取当前用户资料

```
GET /api/users/profile
鉴权：● 需登录
```

**成功响应：**
```json
{
  "success": true,
  "data": {
    "_id": "60a1b2c3...",
    "username": "testuser",
    "nickname": "测试用户",
    "phone": "138****8888",
    "email": "test@example.com",
    "avatar": "https://...",
    "role": "designer",
    "status": "active",
    "manufacturerId": "...",
    "organizationId": "...",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### 4.2 更新当前用户资料

```
PUT /api/users/profile
鉴权：● 需登录
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `nickname` | String | 否 | 昵称 |
| `avatar` | String | 否 | 头像URL |
| `phone` | String | 否 | 手机号 |
| `email` | String | 否 | 邮箱 |

---

### 4.3 获取所有用户

```
GET /api/users
鉴权：● 需登录
```

支持 `page`、`pageSize`、`keyword`、`role`、`status` 等查询参数。

---

### 4.4 追踪图片下载

```
POST /api/users/track-download
鉴权：● 需登录
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `productId` | String | 是 | 商品ID |
| `imageUrl` | String | 是 | 下载的图片URL |

**业务规则：**
- 5 分钟内连续下载 ≥10 次自动标记用户为"高频下载"
- 被标记后下载响应延迟 3 秒

---

### 4.5 管理用户标签

```
GET    /api/users/:id/tags        获取用户标签
POST   /api/users/:id/tags        添加标签（Body: {tag: "VIP"}）
DELETE /api/users/:id/tags/:tag   移除标签
鉴权：● 需登录
```

---

### 4.6 批量更新用户

```
POST /api/users/batch-update
鉴权：★ 需 admin / super_admin
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `userIds` | Array | 是 | 用户ID列表 |
| `updates` | Object | 是 | 要更新的字段（role / permissions / status） |

---

### 4.7 账号管理（管理端）

以下接口均需要 `★ 管理员角色`（ADMIN_ROLES 或 PLATFORM_ONLY_ROLES）：

| 接口 | 说明 |
|---|---|
| `GET /api/accounts/dashboard` | 用户看板统计（角色分布、注册趋势等） |
| `GET /api/accounts/organizations` | 组织列表 |
| `POST /api/accounts/organizations` | 创建组织（传 name / type / contactPerson 等） |
| `PUT /api/accounts/organizations/:id` | 更新组织 |
| `DELETE /api/accounts/organizations/:id` | 删除组织 |
| `PUT /api/accounts/organizations/:id/discount` | 设置组织折扣 |
| `GET /api/accounts/users` | 用户列表（支持角色/状态/关键词过滤） |
| `POST /api/accounts/users` | 创建用户（传 username / password / role / organizationId 等） |
| `PUT /api/accounts/users/:id` | 更新用户 |
| `POST /api/accounts/users/:id/reset-password` | 重置密码（传 newPassword） |
| `DELETE /api/accounts/users/:id` | 删除用户 |
| `GET /api/accounts/special-accounts` | 特殊账号（special_guest）列表 |
| `POST /api/accounts/special-accounts` | 创建特殊账号（传 accessCode / expiresAt / maxUses 等） |
| `POST /api/accounts/special-accounts/:id/invalidate` | 作废特殊账号 |
| `GET /api/accounts/stats` | 角色统计 |

---

## 五、接口详述 — 商品与分类

### 5.1 获取商品列表

```
GET /api/products
鉴权：○ 可选
```

**Query 参数：**

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `page` | Number | 1 | 页码 |
| `pageSize` | Number | 10 | 每页条数 |
| `category` | String | - | 分类ID或名称 |
| `style` | String | - | 风格 |
| `sort` | String | - | 排序: `price_asc`/`price_desc`/`sales`/`newest` |
| `keyword` | String | - | 搜索关键词 |
| `status` | String | - | 状态: `active`/`inactive`/`draft` |
| `manufacturerId` | String | - | 厂家ID |

**成功响应：**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60a1b2c3...",
      "name": "北欧简约沙发",
      "category": "沙发",
      "price": 5999,
      "originalPrice": 8999,
      "thumbnail": "https://...",
      "status": "active",
      "sales": 128,
      "manufacturerName": "XX家具"
    }
  ],
  "pagination": {"page":1,"limit":10,"total":256,"totalPages":26}
}
```

**注意：** 登录用户（设计师）可能看到带折扣的价格。数据隔离中间件根据用户角色过滤可见商品。

---

### 5.2 获取商品详情

```
GET /api/products/:id
鉴权：○ 可选
```

**成功响应：**
```json
{
  "success": true,
  "data": {
    "_id": "60a1b2c3...",
    "name": "北欧简约沙发",
    "category": "沙发",
    "price": 5999,
    "originalPrice": 8999,
    "description": "...",
    "thumbnail": "https://...",
    "images": ["https://..."],
    "specifications": {},
    "skus": [{"_id":"...","name":"三人位","price":5999,"stock":50}],
    "materialsGroups": [],
    "manufacturerId": "...",
    "manufacturerName": "XX家具",
    "status": "active"
  }
}
```

---

### 5.3 搜索商品

```
GET /api/products/search
鉴权：○ 可选
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `keyword` | String | 是 | 搜索关键词 |
| `page` | Number | 否 | 页码 |
| `pageSize` | Number | 否 | 每页条数 |

---

### 5.4 创建商品

```
POST /api/products
鉴权：● 需登录
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `name` | String | 是 | 商品名称 |
| `category` | String | 是 | 分类 |
| `price` | Number | 是 | 售价 |
| `originalPrice` | Number | 否 | 原价 |
| `description` | String | 否 | 描述 |
| `thumbnail` | String | 否 | 缩略图URL |
| `images` | Array | 否 | 图片URL列表 |
| `skus` | Array | 否 | SKU列表 |
| `manufacturerId` | String | 否 | 厂家ID |
| `status` | String | 否 | 状态，默认 `draft` |

---

### 5.5 批量导入商品

```
POST /api/products/bulk-import
鉴权：● 需登录
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `products` | Array | 是 | 商品数据数组 |

---

### 5.6 更新/删除商品

```
PUT    /api/products/:id          更新商品（Body同创建）
DELETE /api/products/:id          删除商品
PATCH  /api/products/:id/status   切换上下架（Body: {status:"active"/"inactive"}）
鉴权：● 需登录
```

---

### 5.7 商品统计

```
GET /api/products/:id/stats
鉴权：● 需登录
```

返回浏览量、收藏数、销量趋势等数据。

---

### 5.8 商品评价

```
GET  /api/products/:id/reviews   获取评价列表（公开）
POST /api/products/:id/reviews   创建评价（● 需登录）
```

创建评价 Body：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `rating` | Number | 是 | 评分（1-5） |
| `content` | String | 否 | 评价内容 |
| `images` | Array | 否 | 评价图片 |

---

### 5.9 分类管理

```
GET    /api/categories             分类列表（○ 可选鉴权）
GET    /api/categories/stats       分类统计（○ 可选鉴权）
GET    /api/categories/:id         分类详情（○ 可选鉴权）
POST   /api/categories             创建分类（● 需登录）
PUT    /api/categories/:id         更新分类（● 需登录）
DELETE /api/categories/:id         删除分类（● 需登录）
POST   /api/categories/discounts/batch  批量设置折扣（● 需登录）
```

分类字段：`name` / `image` / `icon` / `parentId` / `level` / `order` / `status`

---

### 5.10 材质管理

```
GET    /api/materials              材质列表（公开）
GET    /api/materials/stats        材质统计（公开）
POST   /api/materials/images-by-names  批量获取材质图片（公开，Body: {names:[...]})
GET    /api/materials/:id          材质详情（公开）
POST   /api/materials              创建材质（● 需登录）
PUT    /api/materials/:id          更新材质（● 需登录）
DELETE /api/materials/:id          删除材质（● 需登录）
POST   /api/materials/batch-delete 批量删除（● 需登录，Body: {ids:[...]})
POST   /api/materials/approve-all  批量审核通过（● 需登录）
POST   /api/materials/cleanup-orphaned 清理孤立材质（● 需登录）
```

材质分类管理：

```
GET    /api/materials/categories/list   材质分类列表（公开）
POST   /api/materials/categories        创建材质分类（● 需登录）
PUT    /api/materials/categories/:id    更新材质分类（● 需登录）
DELETE /api/materials/categories/:id    删除材质分类（● 需登录）
```

---

## 六、接口详述 — 订单与支付

### 6.1 创建订单

```
POST /api/orders
鉴权：● 需登录
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `items` | Array | 是 | 商品列表 |
| `items[].productId` | String | 是 | 商品ID |
| `items[].skuId` | String | 否 | SKU ID |
| `items[].quantity` | Number | 是 | 数量 |
| `items[].price` | Number | 是 | 单价 |
| `addressId` | String | 是 | 收货地址ID |
| `remark` | String | 否 | 备注 |
| `couponId` | String | 否 | 优惠券ID |

**成功响应：**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "orderNo": "XD20260210001",
    "status": 0,
    "totalAmount": 5999,
    "items": [],
    "createdAt": "2026-02-10T01:00:00.000Z"
  },
  "message": "订单创建成功"
}
```

---

### 6.2 订单状态流转

```
全款路径：
0(待确认) → 1(待付款) → 9(待确认收款) → 2(待发货) → 3(待收货) → 4(已完成)
                                                                    ↘ 6(退款中) → 7(已退款)
                      ↘ 5(已取消)

分期路径：
1(待付款) → 10(定金已付) → 11(生产中) → 12(待付尾款) → 13(尾款已付) → 2(待发货)
```

| 状态码 | 含义 | 触发接口 |
|---|---|---|
| 0 | 待厂家确认 | 创建订单默认 |
| 1 | 待付款 | `POST /:id/manufacturer-confirm` |
| 9 | 待确认收款 | `POST /:id/pay` |
| 2 | 待发货 | `POST /:id/verify-payment` |
| 3 | 待收货 | 厂家发货 |
| 4 | 已完成 | `POST /:id/confirm` |
| 5 | 已取消 | `POST /:id/cancel` |
| 6 | 退款中 | 退款申请 |
| 7 | 已退款 | 退款完成 |
| 10 | 定金已付 | `POST /:id/pay-deposit` |
| 11 | 生产中 | `POST /:id/verify-deposit` |
| 12 | 待付尾款 | `POST /:id/request-final-payment` |
| 13 | 尾款已付 | `POST /:id/pay-final` |

---

### 6.3 获取订单列表

```
GET /api/orders
鉴权：● 需登录
```

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `page` | Number | 1 | 页码 |
| `pageSize` | Number | 10 | 每页条数 |
| `status` | Number | - | 状态筛选 |

---

### 6.4 获取订单详情

```
GET /api/orders/:id
鉴权：● 需登录
```

---

### 6.5 取消订单

```
POST /api/orders/:id/cancel
鉴权：● 需登录
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `reason` | String | 否 | 取消原因 |

**规则：** 已发货/已完成不可取消。

---

### 6.6 确认收货

```
POST /api/orders/:id/confirm
鉴权：● 需登录
```

仅待收货(3)状态可操作，确认后变为已完成(4)。

---

### 6.7 确认付款（客户端）

```
POST /api/orders/:id/pay
鉴权：● 需登录
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `paymentMethod` | String | 否 | `wechat`/`alipay`/`bank`，默认 `wechat` |

**规则：**
- 待付款(1)和待付尾款(12)可调用
- 自动判断全款/定金/尾款
- 付款后进入待确认收款(9)或尾款已付(13)

---

### 6.8 厂家确认收款

```
POST /api/orders/:id/verify-payment
鉴权：● 需登录
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `paymentMethod` | String | 否 | 确认收款方式 |
| `verifyNote` | String | 否 | 备注 |

确认后订单进入待发货(2)。

---

### 6.9 分期付款系列

| 接口 | 说明 | 前置状态 | 后置状态 |
|---|---|---|---|
| `POST /:id/pay-deposit` | 客户支付定金 | 1(待付款) | 10(定金已付) |
| `POST /:id/verify-deposit` | 厂家核销定金 | 10(定金已付) | 11(生产中) |
| `POST /:id/request-final-payment` | 厂家发起尾款请求 | 11(生产中) | 12(待付尾款) |
| `POST /:id/pay-final` | 客户支付尾款 | 12(待付尾款) | 13(尾款已付) |
| `POST /:id/verify-final-payment` | 厂家核销尾款 | 13(尾款已付) | 2(待发货) |

`verify-deposit` 额外参数：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `estimatedProductionDays` | Number | 是 | 预计生产天数（≥1） |
| `paymentMethod` | String | 否 | 确认收款方式 |

---

### 6.10 厂家确认订单

```
POST /api/orders/:id/manufacturer-confirm
鉴权：● 需登录
```

仅待确认(0)可操作，确认后变为待付款(1)。

---

### 6.11 设置结算模式

```
POST /api/orders/:id/settlement-mode
鉴权：● 需登录
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `settlementMode` | String | 是 | 结算模式 |
| `minDiscountRate` | Number | 否 | 最低折扣率 |
| `commissionRate` | Number | 否 | 佣金比例 |
| `paymentRatio` | Number | 否 | 分期付款比例 |
| `estimatedProductionDays` | Number | 否 | 预计生产天数 |

---

### 6.12 订单统计

```
GET /api/orders/stats
鉴权：● 需登录
```

返回：总订单数、日/周/月订单数、各状态分布、金额统计。

---

### 6.13 返佣统计

```
GET /api/orders/commission-stats
鉴权：● 需登录
```

返回：待申请/已申请/待发放/已结算佣金金额及对应订单数。

---

### 6.14 开票状态更新

```
PUT /api/orders/:id/invoice-status
鉴权：● 需登录
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `invoiceStatus` | String | 是 | `pending`/`processing`/`issued`/`sent` |

---

## 七、接口详述 — 购物车/收藏/地址

### 7.1 购物车

```
GET    /api/cart          获取购物车
POST   /api/cart          添加到购物车
PUT    /api/cart/:id      更新购物车项
DELETE /api/cart/:id      删除购物车项
DELETE /api/cart/clear    清空购物车
鉴权：● 需登录
```

添加到购物车 Body：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `productId` | String | 是 | 商品ID |
| `skuId` | String | 否 | SKU ID |
| `quantity` | Number | 是 | 数量 |
| `specifications` | Object | 否 | 规格选择 |

更新购物车项 Body：`{quantity: 3}`

---

### 7.2 收藏

```
GET    /api/favorites                    收藏列表
GET    /api/favorites/check/:productId   检查是否已收藏
POST   /api/favorites                    添加收藏（Body: {productId:"..."})
DELETE /api/favorites/:id                删除收藏
鉴权：● 需登录
```

---

### 7.3 地址

```
GET    /api/addresses             地址列表
POST   /api/addresses             创建地址
PUT    /api/addresses/:id         更新地址
PUT    /api/addresses/:id/default 设为默认
DELETE /api/addresses/:id         删除地址
鉴权：● 需登录
```

创建/更新地址 Body：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `name` | String | 是 | 收件人姓名 |
| `phone` | String | 是 | 手机号 |
| `province` | String | 是 | 省 |
| `city` | String | 是 | 市 |
| `district` | String | 是 | 区 |
| `detail` | String | 是 | 详细地址 |
| `isDefault` | Boolean | 否 | 是否默认 |

---

## 八、接口详述 — 优惠券/发票/砍价/套餐

### 8.1 优惠券

```
GET    /api/coupons              前端优惠券列表（○ 可选鉴权）
GET    /api/coupons/admin        后台优惠券列表（● 需登录）
POST   /api/coupons              创建优惠券（● 需登录）
PUT    /api/coupons/:id          更新优惠券（● 需登录）
DELETE /api/coupons/:id          删除优惠券（● 需登录）
POST   /api/coupons/:id/claim    领取优惠券（● 需登录）
POST   /api/coupons/shopping-service  陪买服务自动发券（● 需登录）
```

---

### 8.2 发票信息

```
GET    /api/invoice-info         开票信息列表
GET    /api/invoice-info/:id     开票信息详情
POST   /api/invoice-info         新增开票信息
PUT    /api/invoice-info/:id     更新开票信息
DELETE /api/invoice-info/:id     删除开票信息
PUT    /api/invoice-info/:id/default  设为默认
鉴权：● 需登录
```

新增/更新 Body：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `invoiceType` | String | 否 | `company`/`personal`，默认 `company` |
| `title` | String | 是 | 发票抬头 |
| `taxNumber` | String | 条件 | 企业发票必填 |
| `bankName` | String | 否 | 开户银行 |
| `bankAccount` | String | 否 | 银行账号 |
| `companyAddress` | String | 否 | 公司地址 |
| `companyPhone` | String | 否 | 公司电话 |
| `email` | String | 否 | 接收邮箱 |
| `isDefault` | Boolean | 否 | 是否默认 |

---

### 8.3 砍价

```
GET    /api/bargains              可砍价商品列表（○ 可选鉴权）
GET    /api/bargains/products     后台砍价商品列表（● 需登录）
POST   /api/bargains/products     创建砍价商品（● 需登录）
PUT    /api/bargains/products/:id 更新砍价商品（● 需登录）
DELETE /api/bargains/products/:id 删除砍价商品（● 需登录）
GET    /api/bargains/my           我的砍价列表（● 需登录）
GET    /api/bargains/:id          砍价详情（○ 可选鉴权）
POST   /api/bargains              发起砍价（● 需登录）
DELETE /api/bargains/:id          取消砍价（● 需登录）
POST   /api/bargains/:id/help    帮好友砍价（● 需登录）
```

发起砍价 Body：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `productId` | String | 是 | 砍价商品ID |
| `productName` | String | 是 | 商品名称 |
| `originalPrice` | Number | 是 | 原价 |
| `targetPrice` | Number | 是 | 目标价 |
| `coverImage` | String | 否 | 封面图 |

**业务规则：**
- 同一用户对同一商品只能有一个进行中的砍价
- 活动 **24 小时**有效
- 发起人最多自砍 3 次，好友只能帮砍 1 次
- 砍价金额在 `minCutAmount` ~ `maxCutAmount` 间随机
- 当前价 ≤ 目标价时砍价成功

---

### 8.4 套餐

```
GET    /api/packages             套餐列表（○ 可选鉴权）
POST   /api/packages             创建套餐（● 需登录）
PUT    /api/packages/:id         更新套餐（● 需登录）
DELETE /api/packages/:id         删除套餐（● 需登录）
GET    /api/packages/:id         套餐详情（○ 可选鉴权）
POST   /api/packages/:id/upload-thumbnail  上传缩略图（● 需登录，multipart/form-data）
POST   /api/packages/:id/upload-images     上传图片（● 需登录，multipart/form-data）
```

---

## 九、接口详述 — Banner/首页/文件/对比/通知

### 9.1 Banner

```
GET    /api/banners       Banner列表（公开，支持 type/platform/status 过滤）
GET    /api/banners/:id   Banner详情（公开）
POST   /api/banners       创建Banner（● 需登录）
PUT    /api/banners/:id   更新Banner（● 需登录）
DELETE /api/banners/:id   删除Banner（● 需登录）
```

Banner 列表 Query 参数：

| 字段 | 类型 | 说明 |
|---|---|---|
| `type` | String | 类型筛选（如 `hero`/`promo`） |
| `platform` | String | 平台筛选（如 `miniapp`/`web`） |
| `status` | String | 状态筛选（`active`/`inactive`） |

---

### 9.2 首页数据

```
GET /api/home
鉴权：○ 可选
```

返回 Banner、热门分类、热门商品、新品推荐等聚合数据。

---

### 9.3 文件上传

```
POST   /api/files/upload          上传单个文件（○ 可选鉴权，multipart/form-data）
POST   /api/files/upload-multiple 上传多个文件（● 需登录，multipart/form-data）
GET    /api/files/:fileId         下载/访问文件（公开）
GET    /api/files/:fileId/info    文件信息（公开）
DELETE /api/files/:fileId         删除文件（● 需登录）
```

**支持文件类型：** jpeg / png / gif / webp / svg / pdf / doc(x) / xls(x) / mp4 / webm / dwg / max / fbx / obj / 3ds / dxf / skp / blend 等

**文件大小限制：** 最大 **2GB**

**上传参数（form-data）：**

| 字段 | 类型 | 说明 |
|---|---|---|
| `file` | File | 文件 |

**Query 参数：**

| 字段 | 类型 | 说明 |
|---|---|---|
| `storage` | String | 存储方式：`gridfs`(默认) / `oss` |

**成功响应：**
```json
{
  "success": true,
  "data": {
    "fileId": "60a...",
    "url": "/api/files/60a...",
    "filename": "image.png",
    "mimetype": "image/png",
    "size": 102400
  }
}
```

---

### 9.4 商品对比

```
GET    /api/compare              对比列表（● 需登录）
GET    /api/compare/stats        对比统计（● 需登录）
POST   /api/compare              添加对比（● 需登录，Body: {productId:"..."})
DELETE /api/compare/:productId   移除对比（● 需登录）
DELETE /api/compare              清空对比（● 需登录）
```

---

### 9.5 通知

```
GET    /api/notifications              通知列表（● 需登录）
GET    /api/notifications/unread/count 未读数（● 需登录）
GET    /api/notifications/stats        通知统计（● 需登录）
POST   /api/notifications              创建通知（● 需登录）
PATCH  /api/notifications/:id/read     标记已读（● 需登录）
PATCH  /api/notifications/mark-all-read 全部已读（● 需登录）
DELETE /api/notifications/:id          删除通知（● 需登录）
DELETE /api/notifications/clear-all    清空通知（● 需登录）
```

---

## 十、接口详述 — 仪表板/配置/定制/代客/浏览/陪买/退款

### 10.1 仪表板

```
GET /api/dashboard               仪表板数据（● 需登录）
GET /api/dashboard/activity      用户活跃度看板（● 需登录）
GET /api/dashboard/user-logins   用户登录详情（● 需登录）
```

---

### 10.2 站点配置

```
GET  /api/site-config            所有配置（公开）
GET  /api/site-config/:key       单个配置（公开）
PUT  /api/site-config/:key       更新配置（● 需登录）
POST /api/site-config/batch      批量更新（● 需登录）
GET  /api/site-settings/me       我的站点设置（● 需登录）
PUT  /api/site-settings/me       更新站点设置（● 需登录）
```

站点设置 Body：

| 字段 | 类型 | 说明 |
|---|---|---|
| `siteName` | String | 站点名称 |
| `subtitle` | String | 副标题 |
| `logo` | String | Logo URL |

---

### 10.3 定制需求

```
POST   /api/customization        创建定制需求（公开，无需登录）
GET    /api/customization        定制列表（● 需登录）
GET    /api/customization/:id    定制详情（● 需登录）
PUT    /api/customization/:id    更新定制（● 需登录）
DELETE /api/customization/:id    删除定制（● 需登录）
```

---

### 10.4 代客下单

```
POST /api/concierge/session         创建代客会话（● 需登录，管理员操作）
GET  /api/concierge/session/:token  获取代客会话（公开，通过token访问）
```

**流程：** 管理员创建会话 → 获得带 token 的链接 → 客户通过链接进入前端购物。

---

### 10.5 浏览历史

```
POST /api/browse-history                    记录浏览（○ 可选鉴权）
GET  /api/browse-history/my                 我的浏览记录（● 需登录）
GET  /api/browse-history/my/path            我的浏览路径（● 需登录）
GET  /api/browse-history/my/stats           我的浏览统计（● 需登录）
GET  /api/browse-history/all                全部浏览历史（● 管理员）
GET  /api/browse-history/user/:userId       用户浏览记录（● 管理员）
GET  /api/browse-history/user/:userId/path  用户浏览路径（● 管理员）
GET  /api/browse-history/user/:userId/stats 用户浏览统计（● 管理员）
```

---

### 10.6 陪买服务

```
POST   /api/buying-service-requests            创建预约（● 需登录）
GET    /api/buying-service-requests            预约列表（● 需登录）
PUT    /api/buying-service-requests/:id/status 更新预约状态（● 需登录）
DELETE /api/buying-service-requests/:id        删除预约（● 需登录）
```

创建预约 Body：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `serviceType` | String | 是 | 服务类型 |
| `scheduledDate` | String | 是 | 预约日期（ISO格式） |
| `notes` | String | 否 | 备注 |

---

### 10.7 退款

```
GET    /api/refunds              退款列表（● 需登录）
GET    /api/refunds/:id          退款详情（● 需登录）
POST   /api/refunds              创建退款（● 需登录）
PUT    /api/refunds/:id/handle   处理退款（● 需登录）
PUT    /api/refunds/:id/complete 完成退款（● 需登录）
DELETE /api/refunds/:id          删除退款记录（● 需登录）
```

创建退款 Body：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `orderId` | String | 是 | 订单ID |
| `reason` | String | 是 | 退款原因 |
| `totalAmount` | Number | 是 | 退款金额 |
| `products` | Array | 否 | 退款商品 |

处理退款 Body：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `action` | String | 是 | `approve` / `reject` |
| `handleRemark` | String | 否 | 处理备注 |

**退款状态流转：** `pending` → `approved` → `completed` 或 `pending` → `rejected`

**业务规则：**
- 同一订单不能有多个待处理退款
- 申请后订单状态变为退款中(6)
- 只能删除已完成或已拒绝的记录

---

## 十一、接口详述 — 厂家/厂家订单/授权/推荐/渠道/佣金/阶梯/图搜

### 11.1 厂家管理

```
GET    /api/manufacturers/:mId/product-categories  厂家商品分类（公开）
GET    /api/manufacturers        厂家列表（● 需登录）
GET    /api/manufacturers/all    全部厂家（● 需登录）
POST   /api/manufacturers        创建厂家（● 需登录）
GET    /api/manufacturers/:id    厂家详情（● 需登录）
PUT    /api/manufacturers/:id    更新厂家（● 需登录）
DELETE /api/manufacturers/:id    删除厂家（● 需登录）
```

**厂家商品分类**接口为公开接口，返回指定厂家下的活跃商品按分类汇总。

---

### 11.2 厂家订单

```
POST /api/manufacturer-orders/dispatch/:orderId  分发订单到厂家（★ 管理员）
GET  /api/manufacturer-orders                     厂家订单列表（● 需登录）
PUT  /api/manufacturer-orders/:id/status          更新厂家订单状态（● 需登录）
```

**分发规则：**
- 已取消订单不能分发
- 不能重复分发
- 按商品厂家归属自动分组
- 若订单有 `ownerManufacturerId`，优先使用

---

### 11.3 授权体系

授权模块支持三种类型：**设计师授权** / **厂家间授权** / **层级授权**

#### 核心接口（用户端 Token）

```
POST /api/authorizations                           创建授权（● 需登录）
GET  /api/authorizations                           授权列表（● 需登录）
GET  /api/authorizations/pending-requests          待审批授权（● 需登录）
GET  /api/authorizations/summary                   授权摘要（● 需登录）
GET  /api/authorizations/my-grants                 我授出的授权（● 需登录）
GET  /api/authorizations/received                  收到的授权（● 需登录）
GET  /api/authorizations/stats                     授权统计（● 需登录）
GET  /api/authorizations/tier-hierarchy            层级结构（● 需登录）
GET  /api/authorizations/:id                       授权详情（● 需登录）
PUT  /api/authorizations/:id                       更新授权（● 需登录）
PUT  /api/authorizations/:id/select-folder         选择文件夹（● 需登录）
PUT  /api/authorizations/:id/designer-product-discount/:productId  设置设计师商品折扣（● 需登录）
```

#### 设计师授权申请

```
POST /api/authorizations/designer-requests             发起设计师授权申请
GET  /api/authorizations/designer-requests/my          我的申请
GET  /api/authorizations/designer-requests/pending     待审批（管理员/企业管理员可见）
PUT  /api/authorizations/designer-requests/:id/approve 审批通过
PUT  /api/authorizations/designer-requests/:id/reject  驳回
```

#### 厂家间授权申请

```
POST /api/authorizations/manufacturer-requests             发起厂家授权申请
GET  /api/authorizations/manufacturer-requests/my          我的申请
GET  /api/authorizations/manufacturer-requests/pending     待审批
PUT  /api/authorizations/manufacturer-requests/:id/approve 审批通过
PUT  /api/authorizations/manufacturer-requests/:id/reject  驳回
```

#### 厂家端独立接口（使用 `verifyManufacturerToken`）

```
GET /api/authorizations/manufacturer/summary                          厂家端授权摘要
GET /api/authorizations/manufacturer/my-grants                        厂家端授出授权
GET /api/authorizations/manufacturer/received                         厂家端收到授权
GET /api/authorizations/manufacturer/designer-requests/pending        待审设计师请求
GET /api/authorizations/manufacturer/manufacturer-requests/pending    待审厂家请求
PUT /api/authorizations/manufacturer/designer-requests/:id/approve    审批设计师
PUT /api/authorizations/manufacturer/designer-requests/:id/reject     驳回设计师
PUT /api/authorizations/manufacturer/manufacturer-requests/:id/reject 驳回厂家
PUT /api/authorizations/manufacturer/:id/select-folder                选择文件夹
```

---

### 11.4 推荐（转介绍）

```
POST   /api/referrals            创建推荐（公开）
GET    /api/referrals/my/:userId 我的推荐列表（公开）
GET    /api/referrals            推荐列表（公开，管理端）
GET    /api/referrals/:id        推荐详情（公开）
PUT    /api/referrals/:id        更新推荐（公开）
DELETE /api/referrals/:id        删除推荐（公开）
```

创建推荐 Body：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `orderId` | String | 是 | 关联订单ID |
| `refereeName` | String | 是 | 被推荐人姓名 |
| `refereePhone` | String | 是 | 被推荐人电话 |
| `userId` | String | 是 | 推荐人用户ID |
| `refereeRemark` | String | 否 | 备注 |

**规则：** 只有已完成订单可推荐；同一订单不能重复推荐同一手机号；默认奖励 5%。

---

### 11.5 渠道商

```
GET    /api/channel-partners              列表（● 需登录）
GET    /api/channel-partners/:id          详情（● 需登录）
POST   /api/channel-partners              创建（● 需登录）
PUT    /api/channel-partners/:id          更新（● 需登录）
DELETE /api/channel-partners/:id          删除（● 需登录）
PUT    /api/channel-partners/:id/status   更新合作状态（● 需登录）
POST   /api/channel-partners/batch-import 批量导入（● 需登录）
```

---

### 11.6 佣金体系

**佣金规则（Commission Rules）：**

```
GET    /api/commission-rules                              规则列表
GET    /api/commission-rules/manufacturer/:mId            厂家规则
POST   /api/commission-rules/manufacturer/:mId            保存规则
DELETE /api/commission-rules/manufacturer/:mId            删除规则
POST   /api/commission-rules/manufacturer/:mId/channels            添加渠道
PUT    /api/commission-rules/manufacturer/:mId/channels/:cId       更新渠道
DELETE /api/commission-rules/manufacturer/:mId/channels/:cId       删除渠道
POST   /api/commission-rules/manufacturer/:mId/channels/:cId/sub-rules 添加子规则
鉴权：● 需登录
```

**佣金体系（Commission System）：**

```
GET  /api/commission-system                              体系列表
GET  /api/commission-system/manufacturer/:mId            厂家体系
POST /api/commission-system/manufacturer/:mId            创建体系
PUT  /api/commission-system/manufacturer/:mId            更新体系
POST /api/commission-system/manufacturer/:mId/channels   创建渠道
GET  /api/commission-system/channels/:channelId          渠道详情
PUT  /api/commission-system/channels/:channelId          更新渠道
DELETE /api/commission-system/channels/:channelId        删除渠道
鉴权：● 需登录
```

---

### 11.7 阶梯体系

```
GET /api/tier-system               阶梯体系配置（● 需登录）
PUT /api/tier-system               更新阶梯体系（● 需登录）
GET /api/tier-system/effective     获取生效的阶梯规则（● 需登录）
GET /api/tier-system/reconciliation 对账数据（● 需登录）
```

---

### 11.8 以图搜图

```
POST /api/image-search
鉴权：○ 可选
Content-Type: multipart/form-data
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `image` | File | 是 | 图片文件 |

**技术实现：** 阿里云通义千问 VL（Qwen-VL）分析图片 → DashVector 向量检索 → 返回匹配商品列表。

---

## 十二、接口详述 — 小程序专用接口

> 小程序接口响应格式：`{code: 0, data, message}`。所有路径前缀为 `/api/miniapp`。

### 12.1 微信登录

```
POST /api/miniapp/auth/wxlogin
鉴权：无
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `code` | String | 是 | `wx.login()` 返回的 code |

**成功响应：**
```json
{
  "code": 0,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "userId": "60a1b2c3...",
    "isNew": false
  },
  "message": "success"
}
```

**规则：** 使用 `WX_APPID` + `WX_SECRET` 调用 `jscode2session`。用户不存在时自动创建（`isNew: true`）。

---

### 12.2 账号密码登录

```
POST /api/miniapp/auth/login
鉴权：无
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `account` | String | 是 | 用户名或手机号 |
| `password` | String | 是 | 密码 |

---

### 12.3 发送验证码

```
POST /api/miniapp/auth/send-code
鉴权：无
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `phone` | String | 是 | 手机号 |

---

### 12.4 手机号登录

```
POST /api/miniapp/auth/phone-login
鉴权：无
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `phone` | String | 是 | 手机号 |
| `code` | String | 是 | 6位验证码 |

---

### 12.5 获取用户信息

```
GET /api/miniapp/user/info
鉴权：● 需登录
```

---

### 12.6 更新用户信息

```
PUT /api/miniapp/user/update
鉴权：● 需登录
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `nickname` | String | 否 | 昵称 |
| `avatar` | String | 否 | 头像 |
| `phone` | String | 否 | 手机号 |
| `gender` | Number | 否 | 性别 |
| `birthday` | String | 否 | 生日 |

---

### 12.7 首页数据

```
GET /api/miniapp/home
鉴权：无
```

返回 Hero 轮播图（miniapp 平台）、分类列表、推荐商品等。

---

### 12.8 风格/分类列表

```
GET /api/miniapp/styles      风格列表（公开）
GET /api/miniapp/categories  分类列表（公开）
```

---

### 12.9 商品列表

```
GET /api/miniapp/goods/list
鉴权：无
```

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `page` | Number | 1 | 页码 |
| `pageSize` | Number | 10 | 每页条数 |
| `category` | String | - | 分类筛选 |
| `style` | String | - | 风格筛选 |
| `sort` | String | - | 排序: `price_asc`/`price_desc`/`sales`/`newest` |

---

### 12.10 商品详情

```
GET /api/miniapp/goods/:id
鉴权：无
```

返回商品完整信息，含 SKU 列表、材质组、图片等。商品详情包含丰富的价格计算逻辑：根据用户角色（设计师/企业）自动应用折扣。

---

### 12.11 搜索商品

```
GET /api/miniapp/goods/search
鉴权：无
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `keyword` | String | 是 | 搜索关键词 |
| `page` | Number | 否 | 页码 |
| `pageSize` | Number | 否 | 每页条数 |

---

### 12.12 推荐商品

```
GET /api/miniapp/recommendations
鉴权：无
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `productId` | String | 当前商品ID |
| `categoryId` | String | 分类ID |
| `categoryName` | String | 分类名 |
| `limit` | Number | 数量（默认6） |

---

### 12.13 小程序订单

```
GET  /api/miniapp/orders                    订单列表（● 需登录，支持 status 过滤）
POST /api/miniapp/orders                    创建订单（● 需登录）
GET  /api/miniapp/orders/:orderId           订单详情（● 需登录，仅返回自己的订单）
POST /api/miniapp/orders/:orderId/cancel    取消订单（● 需登录）
POST /api/miniapp/orders/:orderId/confirm   确认收货（● 需登录）
```

创建订单 Body：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `type` | String | 否 | 订单类型，默认 `normal` |
| `goods` | Array | 是 | `[{id, name, price, image, quantity, specs}]` |
| `totalPrice` | Number | 是 | 总金额 |
| `receiver` | Object | 是 | `{name, phone, address}` |
| `remark` | String | 否 | 备注 |

---

### 12.14 小程序套餐

```
GET /api/miniapp/packages      套餐列表（公开）
GET /api/miniapp/packages/:id  套餐详情（公开）
```

---

## 十三、典型对接流程

### 流程 1：登录 → 浏览 → 下单

```
1. POST /api/auth/login             → 获取 token
2. GET  /api/categories             → 获取分类
3. GET  /api/products?category=沙发  → 浏览商品
4. GET  /api/products/:id           → 查看详情
5. POST /api/cart                   → 加入购物车
6. GET  /api/cart                   → 确认购物车
7. GET  /api/addresses              → 选择地址
8. POST /api/orders                 → 创建订单
```

### 流程 2：全款订单状态流转

```
1. POST /api/orders                          → status=0(待确认)
2. POST /api/orders/:id/manufacturer-confirm → status=1(待付款)
3. POST /api/orders/:id/pay                  → status=9(待确认收款)
4. POST /api/orders/:id/verify-payment       → status=2(待发货)
5. (厂家发货)                                 → status=3(待收货)
6. POST /api/orders/:id/confirm              → status=4(已完成)
```

### 流程 3：分期订单状态流转

```
1. POST /api/orders                             → status=0
2. POST /api/orders/:id/manufacturer-confirm    → status=1
3. POST /api/orders/:id/pay-deposit             → status=10(定金已付)
4. POST /api/orders/:id/verify-deposit          → status=11(生产中，需传estimatedProductionDays)
5. POST /api/orders/:id/request-final-payment   → status=12(待付尾款)
6. POST /api/orders/:id/pay-final               → status=13(尾款已付)
7. POST /api/orders/:id/verify-final-payment    → status=2(待发货)
8. (厂家发货)                                    → status=3
9. POST /api/orders/:id/confirm                 → status=4
```

### 流程 4：退款流程

```
1. POST /api/refunds                    → 创建退款申请，订单变为退款中(6)
2. PUT  /api/refunds/:id/handle         → approve/reject
3. PUT  /api/refunds/:id/complete       → 完成退款，订单变为已退款(7)
```

### 流程 5：小程序对接

```
1. POST /api/miniapp/auth/wxlogin       → 微信登录获取 token
2. GET  /api/miniapp/home               → 首页数据
3. GET  /api/miniapp/goods/list         → 商品列表
4. GET  /api/miniapp/goods/:id          → 商品详情
5. POST /api/miniapp/orders             → 创建订单
6. GET  /api/miniapp/orders             → 查看订单列表
```

### 流程 6：砍价流程

```
1. GET  /api/bargains                   → 获取可砍价商品
2. POST /api/bargains                   → 发起砍价（24小时有效）
3. POST /api/bargains/:id/help          → 好友帮砍
4. (重复帮砍直到达到目标价)
5. 砍价成功后可使用砍价价格下单
```

---

## 十四、联调与环境

### 14.1 开发环境启动

```bash
# 安装依赖
cd backend && npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 设置 MONGODB_URI / JWT_SECRET 等

# 启动服务
npm run dev
# 或使用 PM2
./start.sh
```

### 14.2 关键环境变量

| 变量 | 说明 |
|---|---|
| `PORT` | 服务端口（默认 8080） |
| `MONGODB_URI` | MongoDB 连接串 |
| `JWT_SECRET` | JWT 签名密钥 |
| `JWT_EXPIRES_IN` | Token 有效期（默认 `7d`） |
| `WX_APPID` | 微信小程序 AppID |
| `WX_SECRET` | 微信小程序 Secret |
| `ALI_SMS_ACCESS_KEY_ID` | 阿里云短信 AccessKey |
| `ALI_SMS_ACCESS_KEY_SECRET` | 阿里云短信 Secret |
| `ALI_SMS_SIGN_NAME` | 短信签名 |
| `ALI_SMS_TEMPLATE_CODE` | 短信模板 |
| `DASHSCOPE_API_KEY` | 阿里云通义千问 API Key（图搜） |
| `DASHVECTOR_API_KEY` | DashVector API Key（图搜） |

### 14.3 健康检查

```bash
curl http://localhost:8080/health
# {"status":"ok","timestamp":"2026-02-10T01:00:00.000Z","gitSha":"..."}
```

### 14.4 调试建议

- 所有接口错误均返回 `message` 字段描述具体原因
- 开发环境下短信验证码可能直接在响应中返回
- 文件上传使用 GridFS 存储，通过 `/api/files/:fileId` 访问
- 订单创建后默认 status=0，需厂家确认后才进入付款流程
- 登录用户信息通过中间件注入 `req.userId`，部分接口通过 `req.user` 获取完整用户对象

---

> **文档结束** — 本文档基于代码分析自动生成，以实际代码为准。
