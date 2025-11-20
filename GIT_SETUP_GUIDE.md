# 🔧 Git 和镜像自动化方案

## 📋 需要你提供的信息

为了完成自动化操作，请提供以下信息：

### 1. GitHub 仓库信息
```
GitHub 用户名: ?
GitHub Token (Personal Access Token): ?
后端仓库 URL: ?
前端仓库 URL: ?
```

### 2. Docker Registry 信息
```
Registry 地址: ?
Registry 用户名: ?
Registry 密码/Token: ?
后端镜像名称: ?
前端镜像名称: ?
```

### 3. Sealos 信息
```
Sealos 用户名: ?
Sealos 密码: ?
Sealos 命名空间: ?
```

---

## 🚀 自动化流程

一旦你提供了上述信息，我可以为你自动完成：

### 第 1 步: Git 初始化和推送
```bash
# 1. 初始化 Git 仓库
git init
git config user.name "你的名字"
git config user.email "你的邮箱"

# 2. 添加所有文件
git add .

# 3. 创建初始提交
git commit -m "Initial commit"

# 4. 添加远程仓库
git remote add origin <GitHub仓库URL>

# 5. 推送到 GitHub
git push -u origin main
```

### 第 2 步: Docker 镜像构建和推送
```bash
# 1. 构建后端镜像
docker build -t <registry>/<后端镜像>:latest ./backend

# 2. 构建前端镜像
docker build -t <registry>/<前端镜像>:latest ./frontend

# 3. 推送到 Registry
docker push <registry>/<后端镜像>:latest
docker push <registry>/<前端镜像>:latest
```

### 第 3 步: Sealos 镜像更新
```bash
# 1. 登录 Sealos
sealos login -u <用户名> -p <密码>

# 2. 更新后端镜像
sealos image pull <registry>/<后端镜像>:latest

# 3. 更新前端镜像
sealos image pull <registry>/<前端镜像>:latest

# 4. 重启 Pod
kubectl rollout restart deployment/xiaodiyanxuan-api
kubectl rollout restart deployment/xiaodiyanxuan-frontend
```

---

## 📝 提供信息的方式

你可以通过以下方式提供信息：

### 方式 1: 直接告诉我
```
GitHub 用户名: xxx
GitHub Token: ghp_xxxxx
后端仓库: https://github.com/xxx/backend.git
前端仓库: https://github.com/xxx/frontend.git
...
```

### 方式 2: 创建配置文件
在项目根目录创建 `deployment.config.json`:
```json
{
  "github": {
    "username": "xxx",
    "token": "ghp_xxxxx",
    "backend_repo": "https://github.com/xxx/backend.git",
    "frontend_repo": "https://github.com/xxx/frontend.git"
  },
  "docker": {
    "registry": "ghcr.io",
    "username": "xxx",
    "password": "xxx",
    "backend_image": "xxx/xiaodiyanxuan-backend",
    "frontend_image": "xxx/xiaodiyanxuan-frontend"
  },
  "sealos": {
    "username": "xxx",
    "password": "xxx",
    "namespace": "ns-cxxiwxce"
  }
}
```

### 方式 3: 环境变量
```bash
export GITHUB_USERNAME=xxx
export GITHUB_TOKEN=ghp_xxxxx
export DOCKER_REGISTRY=ghcr.io
export DOCKER_USERNAME=xxx
export DOCKER_PASSWORD=xxx
export SEALOS_USERNAME=xxx
export SEALOS_PASSWORD=xxx
```

---

## ⚠️ 安全提示

**重要**: 不要在代码中硬编码敏感信息！

- ✅ 使用环境变量
- ✅ 使用配置文件 (加入 .gitignore)
- ✅ 使用 GitHub Secrets
- ❌ 不要在代码中直接写 Token

---

## 🔐 GitHub Token 生成

1. 打开 https://github.com/settings/tokens
2. 点击 "Generate new token"
3. 选择 "Personal access tokens (classic)"
4. 勾选权限:
   - `repo` (完整仓库访问)
   - `write:packages` (写入包)
   - `read:packages` (读取包)
5. 生成 Token 并保存

---

## 🐳 Docker Registry 选项

### 选项 1: GitHub Container Registry (推荐)
```
Registry: ghcr.io
用户名: <GitHub用户名>
密码: <GitHub Token>
镜像: ghcr.io/<用户名>/<镜像名>
```

### 选项 2: Docker Hub
```
Registry: docker.io
用户名: <Docker Hub用户名>
密码: <Docker Hub密码>
镜像: <用户名>/<镜像名>
```

### 选项 3: 阿里云 Registry
```
Registry: registry.cn-hangzhou.aliyuncs.com
用户名: <阿里云账号>
密码: <阿里云密码>
镜像: registry.cn-hangzhou.aliyuncs.com/<命名空间>/<镜像名>
```

---

## 📋 完整的自动化脚本

一旦你提供了信息，我会为你创建以下脚本：

1. **git-setup.sh** - Git 初始化和推送
2. **docker-build.sh** - Docker 镜像构建和推送
3. **sealos-deploy.sh** - Sealos 部署和更新
4. **full-deploy.sh** - 完整的自动化部署流程

---

## 🚀 完整流程

```
你提供信息
    ↓
我创建自动化脚本
    ↓
执行 git-setup.sh (初始化 Git 并推送)
    ↓
执行 docker-build.sh (构建镜像并推送)
    ↓
执行 sealos-deploy.sh (更新 Sealos 部署)
    ↓
完成！系统已更新
```

---

## ✅ 准备好了吗？

请提供上述信息，我会立即为你：

1. ✅ 初始化 Git 仓库
2. ✅ 推送代码到 GitHub
3. ✅ 构建 Docker 镜像
4. ✅ 推送镜像到 Registry
5. ✅ 更新 Sealos 部署
6. ✅ 重启 Pod 并验证

**预计完成时间**: 20-30 分钟

---

## 📞 需要帮助？

如果你不确定如何获取某些信息，我可以帮你：

- 生成 GitHub Token
- 配置 Docker Registry
- 设置 Sealos 访问
- 创建配置文件

只需告诉我你需要什么！
