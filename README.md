# 小店烟轩 API (xiaodiyanxuan-api)

完整的家具电商平台后端 API，基于 Node.js + Express + MongoDB。

## 📋 项目概述

- **31 个 API 接口**
- **11 个数据模型**
- **完整的认证系统**
- **商品规格系统（5维度）**
- **订单、购物车、收藏等完整功能**

## 🚀 快速开始

### 本地开发

```bash
cd /home/devbox/project/backend
npm install
npm run dev
```

### 部署到 Sealos

```bash
python3 /home/devbox/project/deploy_optimized.py
```

详见 [部署指南](./DEPLOYMENT.md)

## 📁 项目结构

```
backend/
├── src/
│   ├── models/          # 数据模型 (11 个)
│   ├── routes/          # API 路由 (11 个)
│   ├── controllers/      # 业务逻辑
│   ├── services/        # 服务层
│   ├── middleware/      # 中间件
│   ├── utils/           # 工具函数
│   ├── config/          # 配置文件
│   └── app.js           # Express 应用
├── server.js            # 启动文件
├── package.json         # 依赖配置
├── Dockerfile           # Docker 镜像
└── ecosystem.config.js  # PM2 配置
```

## 🔧 主要技术栈

- **框架**: Express.js 4.18
- **数据库**: MongoDB 7.0
- **认证**: JWT (jsonwebtoken)
- **加密**: bcryptjs
- **验证**: joi, express-validator
- **其他**: cors, helmet, morgan, multer, axios

## 📊 数据模型

1. User - 用户
2. Product - 商品
3. Category - 分类
4. Style - 风格
5. Order - 订单
6. Cart - 购物车
7. Favorite - 收藏
8. Address - 地址
9. Coupon - 优惠券
10. Bargain - 砍价
11. Package - 包裹

## 🌐 API 端点

- **健康检查**: `/health`
- **用户**: `/users`, `/auth`
- **商品**: `/products`, `/categories`, `/styles`
- **订单**: `/orders`
- **购物车**: `/cart`
- **收藏**: `/favorites`
- **其他**: `/addresses`, `/coupons`, `/bargains`, `/packages`

## 📚 文档

- [部署指南](./DEPLOYMENT.md) - 完整的部署说明
- [快速开始](./QUICK_START.md) - 快速开始指南
- [构建说明](./BUILD_INSTRUCTIONS.md) - 镜像构建步骤
- [部署报告](./DEPLOYMENT_COMPLETE.md) - 详细的部署信息

## 🛠️ 开发工具

| 脚本 | 用途 |
|------|------|
| `deploy_optimized.py` | 自动化部署 |
| `monitor_deployment.py` | 监控部署进度 |
| `check_api_pods.py` | 检查 Pod 状态 |
| `check_services.py` | 检查服务配置 |

## 🌍 部署信息

- **公网地址**: https://pkochbpmcgaa.sealoshzh.site/api/
- **Kubernetes 集群**: Sealos
- **命名空间**: ns-cxxiwxce
- **数据库**: MongoDB (ns-cxxiwxce)

## 📝 环境变量

```
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb://root:g7d6ckdq@jianron-mongodb.ns-cxxiwxce.svc:27017/xiaodiyanxuan?authSource=admin
JWT_SECRET=your-secret-key
```

## 🔍 监控和验证

```bash
# 检查 Pod 状态
python3 check_api_pods.py

# 监控部署进度
python3 monitor_deployment.py

# 检查服务
python3 check_services.py
```

## 📖 更多信息

详见 [部署指南](./DEPLOYMENT.md) 获取完整的部署、监控和故障排查说明。 