# 小迪严选 — Apple 风格 UI 重构记录

> 更新日期：2025-02  
> 范围：小程序前端全页面 UI 重构

---

## 一、设计规范

### 1.1 配色体系

| 用途 | 色值 | 说明 |
|-----|------|------|
| 主文字 | `#1D1D1F` | 标题、正文 |
| 次文字 | `#86868B` | 辅助信息、标签 |
| 页面背景 | `#F5F5F7` | 所有页面统一 |
| 卡片背景 | `#FFFFFF` | 白色卡片 |
| 分割线 | `#F5F5F7` | 轻量分割 |
| 边框/禁用 | `#D2D2D7` | 输入框边框等 |
| 强调红 | `#FF3B30` | 删除、徽标 |
| 按钮/标签 | `#1D1D1F` | 主按钮、标签 |

### 1.2 圆角规范

| 组件 | 圆角 |
|-----|------|
| 卡片 | `24rpx` |
| 按钮（全宽） | `999rpx` |
| 图片缩略图 | `16rpx` |
| 输入框 | `16rpx` |
| 标签/徽标 | `8rpx` 或 `999rpx` |
| 弹窗 | `28rpx` |

### 1.3 间距

- 页面水平内边距：`32rpx`
- 卡片内边距：`28rpx`
- 卡片间距：`20rpx`

### 1.4 底部栏

所有固定底部栏统一使用毛玻璃效果：
```css
background: rgba(255, 255, 255, 0.92);
backdrop-filter: saturate(180%) blur(20px);
-webkit-backdrop-filter: saturate(180%) blur(20px);
border-top: 1rpx solid rgba(0, 0, 0, 0.06);
```

---

## 二、重构页面清单

### Step 1 — API 架构修复
- `config/api.js` — baseURL 配置
- `utils/api.js` — 请求封装

### Step 2 — 全局样式
- `app.wxss` — CSS 变量、全局样式
- `custom-tab-bar/` — 底部导航栏
- `app.json` — 页面路由、窗口配置

### Step 3 — 首页 (`pages/index/`)
- 搜索栏、轮播图、分类网格、热销推荐
- Apple 风格卡片与圆角

### Step 4 — 商品列表 (`pages/mall/`)
- 筛选标签横向滚动
- 商品卡片网格布局

### Step 5 — 商品详情 (`pages/mall/detail/`)
- 图片轮播、规格选择器
- 固定底部操作栏

### Step 6 — 购物车 (`pages/profile/cart/`)
- 商品行布局、数量控制
- 全选/结算底部栏

### Step 7 — 订单页面
- **订单列表** (`pages/profile/orders/`) — 横向滚动标签、订单卡片、取消弹窗
- **订单确认** (`pages/order/confirm/`) — 商品清单、套餐推荐、地址表单、提交栏

### Step 8 — 个人中心 (`pages/profile/`)
- 用户头部、统计卡片网格
- 分组菜单列表

### Step 9 — 地址管理 (`pages/profile/address/`)
- 地址卡片列表、操作按钮
- 新增/编辑弹窗

---

## 三、CSS 类名规范

| 类名模式 | 用途 |
|---------|------|
| `.section-card` | 白色圆角卡片容器 |
| `.section-title` | 卡片标题 |
| `.goods-row` | 商品横向行 |
| `.goods-thumb` | 商品缩略图 |
| `.goods-info` | 商品信息区 |
| `.goods-name` | 商品名称 |
| `.goods-price` | 商品价格 |
| `.goods-tag` | 灰色标签 |
| `.submit-bar` | 固定底部提交栏 |
| `.submit-btn` | 主操作按钮 |
| `.modal-mask` | 弹窗遮罩 |
| `.modal-box` | 弹窗容器 |
| `.form-input` | 表单输入框 |
| `.menu-card` | 菜单分组卡片 |
| `.menu-item` | 菜单行 |

---

## 四、注意事项

1. 所有页面 `page` 背景统一为 `#F5F5F7`
2. 不再使用 `var(--color-*)` CSS 变量，直接使用硬编码色值以保证一致性
3. `scroll-view` 统一添加 `enhanced show-scrollbar="{{false}}"` 隐藏滚动条
4. 按钮统一添加 `::after { display: none; }` 移除微信默认边框
5. 底部固定栏需添加 `env(safe-area-inset-bottom)` 安全区适配
