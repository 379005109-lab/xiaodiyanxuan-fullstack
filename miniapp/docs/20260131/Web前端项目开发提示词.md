# Web 前端项目开发提示词 - React + TypeScript 架构

## 📋 项目概述

**项目名称**：小程序商城 Web 前端  
**技术栈**：React 18 + TypeScript + Vite + TailwindCSS + Shadcn/UI  
**主要功能**：提供 Web 版本的商城前端，与小程序共享后端 API  
**开发周期**：完整的前端系统搭建

---

## 🎯 核心需求

### 1. 项目初始化

**框架选择**：React 18 + Vite  
**语言**：TypeScript  
**样式**：TailwindCSS + Shadcn/UI  
**状态管理**：Zustand 或 Redux Toolkit  
**HTTP 客户端**：Axios  
**路由**：React Router v6  
**表单处理**：React Hook Form + Zod  

**必需的依赖包**：
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.14.0",
  "axios": "^1.4.0",
  "zustand": "^4.3.9",
  "react-hook-form": "^7.45.0",
  "zod": "^3.21.4",
  "@hookform/resolvers": "^3.1.1",
  "tailwindcss": "^3.3.0",
  "@shadcn/ui": "latest",
  "lucide-react": "^0.263.1",
  "date-fns": "^2.30.0",
  "clsx": "^2.0.0",
  "class-variance-authority": "^0.7.0"
}
```

### 2. 项目结构

```
web-frontend/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── common/          # 通用组件
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Navigation.tsx
│   │   ├── product/         # 商品相关组件
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductList.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   └── SpecSelector.tsx
│   │   ├── order/           # 订单相关组件
│   │   │   ├── OrderList.tsx
│   │   │   ├── OrderDetail.tsx
│   │   │   └── OrderForm.tsx
│   │   ├── cart/            # 购物车组件
│   │   │   ├── CartItem.tsx
│   │   │   └── CartSummary.tsx
│   │   └── ui/              # Shadcn/UI 组件
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── card.tsx
│   │       └── ...
│   ├── pages/               # 页面
│   │   ├── Home.tsx
│   │   ├── Products.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── Cart.tsx
│   │   ├── Checkout.tsx
│   │   ├── Orders.tsx
│   │   ├── OrderDetail.tsx
│   │   ├── Favorites.tsx
│   │   ├── Addresses.tsx
│   │   ├── Coupons.tsx
│   │   ├── Bargain.tsx
│   │   ├── Packages.tsx
│   │   ├── Profile.tsx
│   │   ├── Login.tsx
│   │   └── NotFound.tsx
│   ├── hooks/               # 自定义 hooks
│   │   ├── useAuth.ts
│   │   ├── useCart.ts
│   │   ├── useFavorites.ts
│   │   ├── useOrders.ts
│   │   └── useProducts.ts
│   ├── stores/              # 状态管理（Zustand）
│   │   ├── authStore.ts
│   │   ├── cartStore.ts
│   │   ├── userStore.ts
│   │   └── appStore.ts
│   ├── services/            # API 服务
│   │   ├── api.ts           # Axios 实例
│   │   ├── authService.ts
│   │   ├── productService.ts
│   │   ├── orderService.ts
│   │   ├── cartService.ts
│   │   ├── favoriteService.ts
│   │   ├── addressService.ts
│   │   ├── couponService.ts
│   │   └── bargainService.ts
│   ├── types/               # TypeScript 类型定义
│   │   ├── index.ts
│   │   ├── product.ts
│   │   ├── order.ts
│   │   ├── user.ts
│   │   ├── cart.ts
│   │   └── api.ts
│   ├── utils/               # 工具函数
│   │   ├── format.ts        # 格式化工具
│   │   ├── validators.ts    # 验证工具
│   │   ├── constants.ts     # 常量
│   │   └── helpers.ts       # 辅助函数
│   ├── styles/              # 全局样式
│   │   ├── globals.css
│   │   └── variables.css
│   ├── layouts/             # 布局组件
│   │   ├── MainLayout.tsx
│   │   └── AuthLayout.tsx
│   ├── App.tsx              # 应用主文件
│   ├── main.tsx             # 入口文件
│   └── vite-env.d.ts
├── public/                  # 静态资源
├── .env.example
├── .env.local
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── README.md
```

---

## 🎨 页面功能清单

### 1. 首页（Home）

**功能**：
- 全屏 Banner 展示
- 轮播图
- 分类导航
- 风格推荐
- 热销商品展示
- 新品推荐

**需要的 API**：
- `GET /api/home` - 获取首页数据

---

### 2. 商品列表页（Products）

**功能**：
- 商品列表展示
- 分类筛选
- 风格筛选
- 搜索功能
- 排序（价格、销量）
- 分页加载
- 商品卡片展示（图片、名称、价格、销量）

**需要的 API**：
- `GET /api/goods/list` - 获取商品列表
- `GET /api/goods/search` - 搜索商品
- `GET /api/categories` - 获取分类列表
- `GET /api/styles` - 获取风格列表

---

### 3. 商品详情页（ProductDetail）

**功能**：
- 商品图片轮播
- 商品基本信息（名称、价格、销量、库存）
- PRO 规格选择器
  - 尺寸选择
  - 材质选择
  - 材质颜色选择
  - 填充物选择
  - 框架选择
  - 脚部选择
- 实时价格计算
- 收藏功能
- 加入购物车
- 立即购买
- 商品详情图展示
- 评价展示（可选）

**需要的 API**：
- `GET /api/goods/:id` - 获取商品详情
- `POST /api/favorites` - 添加收藏
- `DELETE /api/favorites/:goodsId` - 取消收藏
- `GET /api/favorites` - 获取收藏列表
- `POST /api/cart` - 添加到购物车

---

### 4. 购物车页（Cart）

**功能**：
- 购物车商品列表
- 商品数量调整
- 删除商品
- 购物车总价计算
- 结算按钮
- 继续购物按钮
- 空购物车提示

**需要的 API**：
- `GET /api/cart` - 获取购物车
- `PUT /api/cart/:cartId` - 更新商品数量
- `DELETE /api/cart/:cartId` - 删除商品

---

### 5. 订单确认页（Checkout）

**功能**：
- 订单商品列表展示
- 收货地址选择/填写
- 优惠券选择
- 订单总价计算
- 提交订单

**需要的 API**：
- `GET /api/addresses` - 获取地址列表
- `GET /api/coupons` - 获取优惠券列表
- `POST /api/orders` - 创建订单

---

### 6. 订单列表页（Orders）

**功能**：
- 订单列表展示
- 订单状态筛选（待付款、待发货、待收货、已完成、已取消）
- 订单搜索
- 订单操作（取消、确认收货、查看详情）
- 分页

**需要的 API**：
- `GET /api/orders` - 获取订单列表
- `POST /api/orders/:orderId/cancel` - 取消订单
- `POST /api/orders/:orderId/confirm` - 确认收货

---

### 7. 订单详情页（OrderDetail）

**功能**：
- 订单基本信息
- 商品列表
- 收货地址
- 订单时间线
- 操作按钮（取消、确认收货等）

**需要的 API**：
- `GET /api/orders/:orderId` - 获取订单详情

---

### 8. 收藏列表页（Favorites）

**功能**：
- 收藏商品列表
- 删除收藏
- 查看商品详情
- 加入购物车

**需要的 API**：
- `GET /api/favorites` - 获取收藏列表
- `DELETE /api/favorites/:goodsId` - 删除收藏

---

### 9. 地址管理页（Addresses）

**功能**：
- 地址列表展示
- 添加地址
- 编辑地址
- 删除地址
- 设置默认地址

**需要的 API**：
- `GET /api/addresses` - 获取地址列表
- `POST /api/addresses` - 添加地址
- `PUT /api/addresses/:addressId` - 更新地址
- `DELETE /api/addresses/:addressId` - 删除地址

---

### 10. 优惠券页（Coupons）

**功能**：
- 优惠券列表展示
- 优惠券状态筛选（可用、已使用、已过期）
- 优惠券详情展示

**需要的 API**：
- `GET /api/coupons` - 获取优惠券列表

---

### 11. 砍价页（Bargain）

**功能**：
- 砍价商品列表
- 发起砍价
- 我的砍价列表
- 帮好友砍价
- 砍价进度展示

**需要的 API**：
- `GET /api/bargain/goods` - 获取砍价商品列表
- `POST /api/bargain/start` - 发起砍价
- `GET /api/bargain/my` - 获取我的砍价列表
- `POST /api/bargain/:bargainId/help` - 帮砍价

---

### 12. 套餐页（Packages）

**功能**：
- 套餐列表展示
- 套餐详情
- 套餐商品选择
- 一口价展示
- 加入购物车

**需要的 API**：
- `GET /api/packages` - 获取套餐列表
- `GET /api/packages/:packageId` - 获取套餐详情

---

### 13. 个人中心页（Profile）

**功能**：
- 用户信息展示
- 订单统计
- 快捷导航（订单、收藏、地址、优惠券等）
- 退出登录

**需要的 API**：
- `GET /api/user/info` - 获取用户信息

---

### 14. 登录页（Login）

**功能**：
- 账号密码登录（可选）
- 第三方登录（微信、支付宝等）
- 注册链接

**需要的 API**：
- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册（可选）

---

## 🔌 API 集成规范

### 1. Axios 实例配置

```typescript
// services/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // 清除 token 并重定向到登录
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

### 2. 服务层示例

```typescript
// services/productService.ts
import api from './api'
import { Product, ProductListResponse } from '../types'

export const productService = {
  getList: (params: {
    page?: number
    pageSize?: number
    category?: string
    style?: string
    sort?: string
  }) => api.get<ProductListResponse>('/api/goods/list', { params }),

  getDetail: (id: string) => api.get<Product>(`/api/goods/${id}`),

  search: (keyword: string, params?: any) =>
    api.get('/api/goods/search', { params: { keyword, ...params } })
}
```

### 3. 类型定义

```typescript
// types/product.ts
export interface Product {
  id: string
  name: string
  code: string
  price: number
  thumb: string
  images: string[]
  detailImages: string[]
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

export interface Size {
  id: string
  name: string
  dims: string
  img: string
  extra: number
}

// ... 其他类型定义
```

---

## 🎯 状态管理（Zustand）

### 1. 购物车 Store

```typescript
// stores/cartStore.ts
import { create } from 'zustand'

interface CartItem {
  _id: string
  goodsId: string
  goodsName: string
  price: number
  count: number
  specs: any
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateItem: (id: string, count: number) => void
  clearCart: () => void
  getTotalPrice: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),
  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item._id !== id)
  })),
  updateItem: (id, count) => set((state) => ({
    items: state.items.map((item) =>
      item._id === id ? { ...item, count } : item
    )
  })),
  clearCart: () => set({ items: [] }),
  getTotalPrice: () => {
    const items = get().items
    return items.reduce((total, item) => total + item.price * item.count, 0)
  }
}))
```

---

## 🛠️ 自定义 Hooks

### 1. useAuth Hook

```typescript
// hooks/useAuth.ts
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export const useAuth = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user, login, logout } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  return { isAuthenticated, user, login, logout }
}
```

### 2. useProducts Hook

```typescript
// hooks/useProducts.ts
import { useState, useEffect } from 'react'
import { productService } from '../services/productService'
import { Product } from '../types'

export const useProducts = (params?: any) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const response = await productService.getList(params)
        setProducts(response.data.list)
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [params])

  return { products, loading, error }
}
```

---

## 📝 环境变量配置

创建 `.env.local` 文件：

```
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=小程序商城
VITE_APP_VERSION=1.0.0
```

---

## 🚀 启动和构建

### 1. 本地开发

```bash
npm install
npm run dev
```

### 2. 生产构建

```bash
npm run build
npm run preview
```

### 3. 部署

```bash
# 构建
npm run build

# 部署到服务器
# 将 dist 目录上传到服务器
```

---

## ✅ 开发检查清单

- [ ] 项目初始化和依赖安装
- [ ] 路由配置
- [ ] 认证系统（登录、退出、token 管理）
- [ ] 首页开发
- [ ] 商品列表页开发
- [ ] 商品详情页开发（含 PRO 规格选择）
- [ ] 购物车页开发
- [ ] 订单确认页开发
- [ ] 订单列表页开发
- [ ] 订单详情页开发
- [ ] 收藏列表页开发
- [ ] 地址管理页开发
- [ ] 优惠券页开发
- [ ] 砍价页开发
- [ ] 套餐页开发
- [ ] 个人中心页开发
- [ ] 响应式设计
- [ ] 错误处理和加载状态
- [ ] 表单验证
- [ ] 单元测试
- [ ] 集成测试
- [ ] 性能优化
- [ ] SEO 优化（可选）

---

## 📚 参考资源

- React 官方文档：https://react.dev/
- TypeScript 官方文档：https://www.typescriptlang.org/
- Vite 官方文档：https://vitejs.dev/
- TailwindCSS 官方文档：https://tailwindcss.com/
- Shadcn/UI 文档：https://ui.shadcn.com/
- React Router 文档：https://reactrouter.com/

---

## ⚠️ 重要提示

1. **API 地址配置**：确保 `VITE_API_URL` 指向正确的后端地址
2. **HTTPS 要求**：生产环境必须使用 HTTPS
3. **CORS 配置**：后端需要配置 CORS 允许前端跨域请求
4. **Token 管理**：安全存储 token，避免 XSS 攻击
5. **性能优化**：使用代码分割、懒加载等优化技术

---

如有问题，请参考相关文档或联系开发团队。
