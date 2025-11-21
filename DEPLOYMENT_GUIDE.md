# 🚀 前端部署指南 - 完整流程

**最后更新**: 2025-11-21  
**状态**: ✅ 代码已推送到 Git

---

## 📋 当前进度

| 步骤 | 状态 | 完成时间 |
|------|------|---------|
| 1️⃣ 上传前端源代码到 Git | ✅ | 2025-11-21 |
| 2️⃣ 构建 Docker 镜像 | ⏳ | 进行中 |
| 3️⃣ 更新 Kubernetes 部署 | ⏳ | 待进行 |
| 4️⃣ 验证部署 | ⏳ | 待进行 |

---

## 🔧 部署方案选择

### 方案 A：自动化部署（推荐）✅

**优点**：
- 完全自动化
- 无需本地 Docker
- 每次 Git push 自动部署
- 适合团队协作

**步骤**：
1. 在 GitHub 仓库设置 Secrets
2. 启用 GitHub Actions
3. 后续每次 push 自动部署

---

### 方案 B：本地构建部署

**优点**：
- 完全控制
- 快速反馈
- 适合本地开发测试

**缺点**：
- 需要安装 Docker
- 需要手动操作

---

## 🎯 推荐方案：自动化部署（方案 A）

### 第一步：配置 GitHub Secrets

在 GitHub 仓库中添加以下 Secrets：

**1. KUBECONFIG** - Kubernetes 配置文件
```bash
# 获取 kubeconfig 内容（Base64 编码）
cat /home/devbox/project/kubeconfig\ \(7\).yaml | base64 -w 0
```

**2. REGISTRY_PASSWORD** - Docker Registry 密码
```
registry.sealoshzh.site 的登录密码
```

**3. REGISTRY_USERNAME** - Docker Registry 用户名
```
registry.sealoshzh.site 的用户名
```

### 第二步：验证部署

部署完成后，验证应用是否正常运行：

```bash
# 查看 Pod 状态
kubectl get pods -n ns-cxxiwxce | grep xiaodiyanxuan-frontend

# 查看部署状态
kubectl get deployment xiaodiyanxuan-frontend -n ns-cxxiwxce

# 查看服务
kubectl get svc -n ns-cxxiwxce | grep xiaodiyanxuan-frontend

# 查看日志
kubectl logs -f deployment/xiaodiyanxuan-frontend -n ns-cxxiwxce
```

---

## 📦 本地构建方案（方案 B）

如果需要本地构建和测试，按以下步骤操作：

### 前置条件

1. **安装 Docker**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io

# 启动 Docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

2. **登录 Docker Registry**
```bash
docker login registry.sealoshzh.site
```

### 构建步骤

**第一步：构建镜像**
```bash
cd /home/devbox/project/1114/client

docker build \
  -t registry.sealoshzh.site/xiaodiyanxuan-frontend:latest \
  -t registry.sealoshzh.site/xiaodiyanxuan-frontend:$(date +%Y%m%d-%H%M%S) \
  .
```

**第二步：推送镜像**
```bash
docker push registry.sealoshzh.site/xiaodiyanxuan-frontend:latest
docker push registry.sealoshzh.site/xiaodiyanxuan-frontend:$(date +%Y%m%d-%H%M%S)
```

**第三步：更新 Kubernetes 部署**
```bash
kubectl set image deployment/xiaodiyanxuan-frontend \
  frontend=registry.sealoshzh.site/xiaodiyanxuan-frontend:latest \
  -n ns-cxxiwxce

kubectl rollout status deployment/xiaodiyanxuan-frontend -n ns-cxxiwxce
```

---

## 🔍 故障排查

### 问题 1：GitHub Actions 失败

**症状**：Actions 显示红色 ❌

**解决方案**：
1. 检查 Secrets 是否正确配置
2. 查看 Actions 日志
3. 验证 kubeconfig 是否有效

### 问题 2：镜像推送失败

**症状**：`docker push` 失败

**解决方案**：
```bash
# 检查 Docker 登录状态
docker info

# 重新登录
docker logout registry.sealoshzh.site
docker login registry.sealoshzh.site

# 检查镜像标签
docker images | grep xiaodiyanxuan
```

### 问题 3：Pod 无法启动

**症状**：Pod 状态为 CrashLoopBackOff

**解决方案**：
```bash
# 查看 Pod 日志
kubectl logs -f pod/xiaodiyanxuan-frontend-xxx -n ns-cxxiwxce

# 查看 Pod 事件
kubectl describe pod xiaodiyanxuan-frontend-xxx -n ns-cxxiwxce

# 检查资源限制
kubectl get deployment xiaodiyanxuan-frontend -n ns-cxxiwxce -o yaml
```

---

## 📊 部署检查清单

部署前检查：
- [ ] 代码已推送到 Git
- [ ] Dockerfile 存在且有效
- [ ] nginx.conf 配置正确
- [ ] package.json 依赖完整

部署中检查：
- [ ] GitHub Actions 运行成功
- [ ] 镜像成功推送到 Registry
- [ ] Kubernetes 部署已更新

部署后检查：
- [ ] Pod 状态为 Running
- [ ] 应用可以访问
- [ ] 日志无错误信息
- [ ] 功能测试通过

---

## 🚀 快速命令参考

```bash
# 查看部署状态
kubectl get deployment xiaodiyanxuan-frontend -n ns-cxxiwxce -o wide

# 查看 Pod 日志
kubectl logs -f deployment/xiaodiyanxuan-frontend -n ns-cxxiwxce

# 重启部署
kubectl rollout restart deployment/xiaodiyanxuan-frontend -n ns-cxxiwxce

# 查看部署历史
kubectl rollout history deployment/xiaodiyanxuan-frontend -n ns-cxxiwxce

# 回滚到上一个版本
kubectl rollout undo deployment/xiaodiyanxuan-frontend -n ns-cxxiwxce

# 查看资源使用情况
kubectl top pod -n ns-cxxiwxce | grep xiaodiyanxuan-frontend

# 进入 Pod 容器
kubectl exec -it deployment/xiaodiyanxuan-frontend -n ns-cxxiwxce -- /bin/sh
```

---

**准备好部署了吗？选择方案 A 或 B 开始吧！** 🎉
