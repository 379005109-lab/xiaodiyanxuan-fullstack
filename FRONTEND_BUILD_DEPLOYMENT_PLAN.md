# 🚀 前端构建和部署计划

**计划时间**: 2025-11-21 18:25 UTC  
**状态**: ⏳ **准备构建**  
**前端代码**: ✅ 已在 Git 上 (main 分支)

---

## 📊 **当前状态**

### ✅ 已完成

- [x] 前端源代码已找到 (GitHub main 分支)
- [x] 前端代码已下载到本地
- [x] package.json 完整
- [x] Dockerfile 完整
- [x] Nginx 配置完整
- [x] 后端代码已修复并提交

### ⏳ 待完成

- [ ] 构建 Docker 镜像
- [ ] 推送镜像到 Registry
- [ ] 更新 Kubernetes 部署
- [ ] 验证前端应用

---

## 🔧 **构建环境检查**

### Docker 状态

```
✅ Docker 已安装: 20.10.24+dfsg1
❌ Docker daemon: 无法启动 (systemd 不可用)
```

### 解决方案

由于 Docker daemon 无法在本地启动，我们有以下选项：

#### 选项 1: 使用 GitHub Actions 构建 (推荐)

GitHub 仓库已有 CI/CD 配置，可以自动构建镜像。

**步骤**:
1. 推送代码到 GitHub
2. GitHub Actions 自动构建镜像
3. 镜像自动推送到 Registry

#### 选项 2: 使用 Sealos 构建功能

Sealos 提供了内置的镜像构建功能。

#### 选项 3: 手动构建 (需要 Docker daemon)

```bash
docker build -t ghcr.io/379005109-lab/xiaodiyanxuan-frontend:latest .
docker push ghcr.io/379005109-lab/xiaodiyanxuan-frontend:latest
```

---

## 📝 **前端项目信息**

### 项目配置

```
名称: furniture-ecommerce-client
版本: 1.0.0
框架: React 18.2.0 + TypeScript
构建工具: Vite 5.0.8
```

### 构建命令

```bash
npm install      # 安装依赖
npm run build    # 构建应用
npm run preview  # 预览构建结果
```

### 构建输出

```
输入: frontend/src/
输出: frontend/dist/
```

---

## 🐳 **Docker 镜像配置**

### Dockerfile 信息

```
基础镜像: node:18-alpine (构建阶段)
运行镜像: nginx:alpine
构建步骤:
  1. 安装依赖 (npm ci)
  2. 构建应用 (npm run build)
  3. 复制 dist 到 nginx
  4. 配置 nginx
```

### 镜像标签

```
镜像: ghcr.io/379005109-lab/xiaodiyanxuan-frontend:latest
Registry: GitHub Container Registry (GHCR)
```

---

## 🚀 **推荐部署方案**

### 方案 A: 使用 GitHub Actions (最简单)

**优点**:
- 自动化构建
- 无需本地 Docker
- 集成版本控制
- 自动推送到 Registry

**步骤**:
1. 确保代码已推送到 GitHub
2. GitHub Actions 自动触发
3. 镜像自动构建和推送
4. 手动更新 Kubernetes 部署

**预计时间**: 10-15 分钟

### 方案 B: 使用 Sealos 构建

**优点**:
- 在 Kubernetes 集群内构建
- 无需外部 CI/CD
- 直接部署

**步骤**:
1. 在 Sealos 中创建构建任务
2. 指定 Git 仓库和分支
3. 自动构建和部署

**预计时间**: 15-20 分钟

### 方案 C: 本地构建 (需要 Docker)

**前提条件**:
- Docker daemon 必须运行
- 需要 Registry 权限

**步骤**:
1. 启动 Docker daemon
2. 构建镜像
3. 推送到 Registry
4. 更新 Kubernetes 部署

**预计时间**: 20-30 分钟

---

## 📋 **立即可执行的步骤**

### 步骤 1: 确保代码已提交到 Git

```bash
cd /home/devbox/project
git status
# 应该显示: On branch main, Your branch is up to date with 'origin/main'
```

**状态**: ✅ 已完成

### 步骤 2: 查看 GitHub Actions 配置

```bash
cat .github/workflows/ci.yml
```

**预期**: 应该有自动构建前端镜像的配置

### 步骤 3: 触发 GitHub Actions 构建

**方式 1**: 推送代码到 GitHub
```bash
git push origin main
```

**方式 2**: 手动触发 (在 GitHub 网页上)
- 进入 Actions 标签
- 选择 CI 工作流
- 点击 "Run workflow"

### 步骤 4: 等待镜像构建完成

- 预计时间: 10-15 分钟
- 可在 GitHub Actions 中查看进度

### 步骤 5: 更新 Kubernetes 部署

```bash
kubectl set image deployment/xiaodiyanxuan-frontend \
  frontend=ghcr.io/379005109-lab/xiaodiyanxuan-frontend:latest \
  -n ns-cxxiwxce

kubectl rollout restart deployment/xiaodiyanxuan-frontend -n ns-cxxiwxce
```

### 步骤 6: 验证部署

```bash
# 检查 Pod 状态
kubectl get pods -n ns-cxxiwxce -l app=xiaodiyanxuan-frontend

# 测试前端应用
curl -s https://lgpzubdtdxjf.sealoshzh.site/ | head -20
```

---

## 🔍 **GitHub Actions 配置**

### 预期的 CI/CD 流程

```yaml
触发条件: 代码推送到 main 分支
步骤:
  1. 检出代码
  2. 登录 GHCR Registry
  3. 构建前端镜像
  4. 推送镜像到 GHCR
  5. (可选) 自动部署到 Kubernetes
```

### 所需的 Secrets

```
KUBECONFIG          # Kubernetes 配置文件
REGISTRY_USERNAME   # Registry 用户名
REGISTRY_PASSWORD   # Registry 密码
```

---

## ⏱️ **预计时间表**

| 步骤 | 时间 | 状态 |
|------|------|------|
| 代码提交 | 1 分钟 | ✅ 已完成 |
| GitHub Actions 构建 | 10-15 分钟 | ⏳ 待执行 |
| Kubernetes 更新 | 2-3 分钟 | ⏳ 待执行 |
| 部署验证 | 2-3 分钟 | ⏳ 待执行 |
| **总计** | **15-25 分钟** | ⏳ |

---

## 📊 **部署检查清单**

### 前端代码

- [x] 源代码在 Git 上
- [x] package.json 完整
- [x] Dockerfile 完整
- [x] Nginx 配置完整
- [x] 所有依赖已列出

### 构建配置

- [x] GitHub Actions 配置存在
- [x] Docker Registry 配置
- [x] Kubernetes 部署配置

### 部署准备

- [x] Kubernetes 集群可用
- [x] Namespace 存在
- [x] Ingress 配置完整
- [x] Service 配置完整

---

## 🎯 **下一步**

### 立即执行

**选项 1: 使用 GitHub Actions (推荐)**

```bash
# 1. 确保代码已推送
git push origin main

# 2. 在 GitHub 上查看 Actions 进度
# https://github.com/379005109-lab/xiaodiyanxuan-fullstack/actions

# 3. 等待镜像构建完成 (10-15 分钟)

# 4. 更新 Kubernetes 部署
kubectl set image deployment/xiaodiyanxuan-frontend \
  frontend=ghcr.io/379005109-lab/xiaodiyanxuan-frontend:latest \
  -n ns-cxxiwxce
```

**选项 2: 使用 Sealos 构建**

- 在 Sealos 控制面板中创建构建任务
- 指定 GitHub 仓库和分支
- 自动构建和部署

---

## 💡 **关键信息**

### 前端镜像

```
镜像: ghcr.io/379005109-lab/xiaodiyanxuan-frontend:latest
Registry: GitHub Container Registry
```

### Kubernetes 部署

```
部署: xiaodiyanxuan-frontend
命名空间: ns-cxxiwxce
副本: 2
```

### 应用地址

```
前端: https://lgpzubdtdxjf.sealoshzh.site
后端: https://pkochbpmcgaa.sealoshzh.site/api
```

---

**计划时间**: 2025-11-21 18:25 UTC  
**前端代码**: ✅ **已准备**  
**构建方案**: ⏳ **等待执行**

**建议**: 使用 GitHub Actions 自动构建，无需本地 Docker！

