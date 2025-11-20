# 🚀 Git 和镜像自动化 - 快速开始

## 📋 你需要提供的信息

### 1. GitHub 信息
```
GitHub 用户名: ?
GitHub Token: ?
GitHub 邮箱: ?
后端仓库 URL: ?
前端仓库 URL: ?
```

### 2. Docker Registry 信息
```
Registry 地址: ghcr.io (推荐) 或 docker.io
用户名: ?
密码/Token: ?
```

### 3. Sealos 信息
```
Sealos 用户名: ?
Sealos 密码: ?
```

---

## 🔧 三种方式提供信息

### 方式 1: 直接告诉我 (最简单)

在聊天中告诉我：
```
GitHub 用户名: xxx
GitHub Token: ghp_xxxxx
GitHub 邮箱: xxx@example.com
后端仓库: https://github.com/xxx/backend.git
前端仓库: https://github.com/xxx/frontend.git
Docker Registry: ghcr.io
Docker 用户名: xxx
Docker 密码: ghp_xxxxx
Sealos 用户名: xxx
Sealos 密码: xxx
```

### 方式 2: 创建配置文件

1. 复制 `deployment.config.example.json`
2. 改名为 `deployment.config.json`
3. 填入你的信息
4. 告诉我已准备好

### 方式 3: 设置环境变量

```bash
export GITHUB_USERNAME=xxx
export GITHUB_TOKEN=ghp_xxxxx
export GITHUB_EMAIL=xxx@example.com
export BACKEND_REPO=https://github.com/xxx/backend.git
export FRONTEND_REPO=https://github.com/xxx/frontend.git
export DOCKER_REGISTRY=ghcr.io
export DOCKER_USERNAME=xxx
export DOCKER_PASSWORD=ghp_xxxxx
export SEALOS_USERNAME=xxx
export SEALOS_PASSWORD=xxx
```

---

## 📚 如何获取这些信息

### GitHub Token

1. 打开 https://github.com/settings/tokens
2. 点击 "Generate new token"
3. 选择 "Personal access tokens (classic)"
4. 勾选权限:
   - ✅ repo
   - ✅ write:packages
   - ✅ read:packages
5. 生成并复制 Token

### GitHub 仓库 URL

1. 在 GitHub 创建两个仓库:
   - xiaodiyanxuan-backend
   - xiaodiyanxuan-frontend
2. 复制 HTTPS URL:
   - https://github.com/your-username/xiaodiyanxuan-backend.git
   - https://github.com/your-username/xiaodiyanxuan-frontend.git

### Docker Registry

**推荐使用 GitHub Container Registry (ghcr.io)**:
- 用户名: 你的 GitHub 用户名
- 密码: 你的 GitHub Token (同上)

---

## 🚀 完整流程

一旦你提供了信息，我会自动完成：

### 第 1 步: Git 初始化和推送
- ✅ 初始化 Git 仓库
- ✅ 配置用户名和邮箱
- ✅ 添加所有文件
- ✅ 创建初始提交
- ✅ 推送到 GitHub

### 第 2 步: Docker 镜像构建和推送
- ✅ 登录 Docker Registry
- ✅ 构建后端镜像
- ✅ 构建前端镜像
- ✅ 推送镜像到 Registry

### 第 3 步: Sealos 部署更新
- ✅ 在 Sealos 控制台重新构建镜像
- ✅ 自动重启 Pod
- ✅ 验证部署

### 第 4 步: 最终验证
- ✅ 检查后端健康状态
- ✅ 检查前端页面
- ✅ 验证 API 连接

---

## ⏱️ 预计完成时间

- Git 初始化和推送: 2-3 分钟
- Docker 镜像构建: 10-15 分钟
- Sealos 部署更新: 5-10 分钟
- 最终验证: 2-3 分钟
- **总计: 20-30 分钟**

---

## ✅ 准备好了吗？

请提供上述信息，我会立即为你自动完成所有操作！

### 信息检查清单

- [ ] GitHub 用户名
- [ ] GitHub Token
- [ ] GitHub 邮箱
- [ ] 后端仓库 URL
- [ ] 前端仓库 URL
- [ ] Docker Registry (默认 ghcr.io)
- [ ] Docker 用户名
- [ ] Docker 密码/Token
- [ ] Sealos 用户名
- [ ] Sealos 密码

---

## 🔐 安全提示

- ✅ 使用环境变量或配置文件
- ✅ 配置文件加入 .gitignore
- ✅ 不要在代码中硬编码敏感信息
- ✅ Token 只在需要时使用

---

## 📞 需要帮助？

如果你不确定如何获取某些信息，告诉我：

- "我不知道怎么生成 GitHub Token"
- "我不知道怎么创建 GitHub 仓库"
- "我不知道怎么配置 Docker Registry"

我会详细指导你！

---

## 🎯 下一步

1. 准备好上述信息
2. 告诉我你已准备好
3. 我会立即开始自动化部署
4. 坐等完成！

**让我们开始吧！** 🚀
