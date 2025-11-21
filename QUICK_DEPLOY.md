# ⚡ 快速部署指南

**当前状态**: ✅ 代码已推送到 Git  
**下一步**: 构建镜像并部署

---

## 🎯 三种部署方式

### 方式 1️⃣：GitHub Actions 自动部署（推荐）

**最简单，无需本地操作**

#### 步骤 1：配置 GitHub Secrets

进入 GitHub 仓库 → Settings → Secrets and variables → Actions

添加以下 Secrets：

| Secret 名称 | 值 | 获取方式 |
|-----------|-----|--------|
| `KUBECONFIG` | kubeconfig 内容（Base64） | `cat kubeconfig.yaml \| base64 -w 0` |
| `REGISTRY_USERNAME` | Registry 用户名 | 联系管理员 |
| `REGISTRY_PASSWORD` | Registry 密码 | 联系管理员 |

#### 步骤 2：启用 GitHub Actions

1. 进入 GitHub 仓库
2. 点击 "Actions" 标签
3. 启用 Actions

#### 步骤 3：自动部署

只需 push 代码到 main 分支，GitHub Actions 会自动：
- 构建镜像
- 推送到 Registry
- 更新 Kubernetes 部署

```bash
# 任何 push 都会触发自动部署
git push origin main
```

**查看部署进度**：
- GitHub → Actions → 查看最新的 workflow 运行

---

### 方式 2️⃣：本地脚本部署

**需要本地 Docker，但完全可控**

#### 前置条件

```bash
# 1. 安装 Docker
sudo apt-get install docker.io

# 2. 启动 Docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# 3. 登录 Docker Registry
docker login registry.sealoshzh.site
```

#### 一键部署

```bash
# 完整部署（构建 → 推送 → 部署 → 验证）
bash /home/devbox/project/1114/deploy.sh full
```

#### 分步部署

```bash
# 仅构建镜像
bash /home/devbox/project/1114/deploy.sh build

# 仅推送镜像
bash /home/devbox/project/1114/deploy.sh push

# 仅更新部署
bash /home/devbox/project/1114/deploy.sh deploy

# 验证部署
bash /home/devbox/project/1114/deploy.sh verify

# 查看日志
bash /home/devbox/project/1114/deploy.sh logs

# 查看状态
bash /home/devbox/project/1114/deploy.sh status
```

---

### 方式 3️⃣：手动 kubectl 部署

**最灵活，适合高级用户**

#### 前置条件

```bash
# 配置 kubeconfig
export KUBECONFIG=/home/devbox/project/kubeconfig\ \(7\).yaml

# 验证连接
kubectl get nodes
```

#### 手动部署步骤

```bash
# 1. 构建镜像
cd /home/devbox/project/1114/client
docker build -t registry.sealoshzh.site/xiaodiyanxuan-frontend:latest .

# 2. 推送镜像
docker push registry.sealoshzh.site/xiaodiyanxuan-frontend:latest

# 3. 更新部署
kubectl set image deployment/xiaodiyanxuan-frontend \
  frontend=registry.sealoshzh.site/xiaodiyanxuan-frontend:latest \
  -n ns-cxxiwxce

# 4. 查看部署状态
kubectl rollout status deployment/xiaodiyanxuan-frontend -n ns-cxxiwxce

# 5. 验证
kubectl get pods -n ns-cxxiwxce | grep xiaodiyanxuan-frontend
```

---

## 📊 部署方式对比

| 特性 | 方式 1 | 方式 2 | 方式 3 |
|------|-------|-------|-------|
| 自动化 | ✅ | ✅ | ❌ |
| 需要 Docker | ❌ | ✅ | ✅ |
| 学习成本 | 低 | 中 | 高 |
| 灵活性 | 低 | 中 | 高 |
| 推荐指数 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🔍 部署后验证

### 查看部署状态

```bash
# 查看 Pod
kubectl get pods -n ns-cxxiwxce | grep xiaodiyanxuan-frontend

# 查看部署
kubectl get deployment xiaodiyanxuan-frontend -n ns-cxxiwxce -o wide

# 查看服务
kubectl get svc -n ns-cxxiwxce | grep xiaodiyanxuan-frontend

# 查看 Ingress
kubectl get ingress -n ns-cxxiwxce | grep xiaodiyanxuan-frontend
```

### 查看日志

```bash
# 查看最新日志
kubectl logs -f deployment/xiaodiyanxuan-frontend -n ns-cxxiwxce

# 查看特定 Pod 日志
kubectl logs -f pod/xiaodiyanxuan-frontend-xxx -n ns-cxxiwxce
```

### 进入容器

```bash
# 进入容器 shell
kubectl exec -it deployment/xiaodiyanxuan-frontend -n ns-cxxiwxce -- /bin/sh

# 执行命令
kubectl exec deployment/xiaodiyanxuan-frontend -n ns-cxxiwxce -- ls -la /usr/share/nginx/html
```

---

## 🚨 常见问题

### Q1: 部署失败，如何排查？

```bash
# 1. 查看 Pod 事件
kubectl describe pod xiaodiyanxuan-frontend-xxx -n ns-cxxiwxce

# 2. 查看 Pod 日志
kubectl logs -f pod/xiaodiyanxuan-frontend-xxx -n ns-cxxiwxce

# 3. 查看部署事件
kubectl describe deployment xiaodiyanxuan-frontend -n ns-cxxiwxce

# 4. 查看最近事件
kubectl get events -n ns-cxxiwxce --sort-by='.lastTimestamp'
```

### Q2: 如何回滚到上一个版本？

```bash
# 查看部署历史
kubectl rollout history deployment/xiaodiyanxuan-frontend -n ns-cxxiwxce

# 回滚到上一个版本
kubectl rollout undo deployment/xiaodiyanxuan-frontend -n ns-cxxiwxce

# 回滚到特定版本
kubectl rollout undo deployment/xiaodiyanxuan-frontend --to-revision=2 -n ns-cxxiwxce
```

### Q3: 如何重启部署？

```bash
# 重启部署
kubectl rollout restart deployment/xiaodiyanxuan-frontend -n ns-cxxiwxce

# 查看重启进度
kubectl rollout status deployment/xiaodiyanxuan-frontend -n ns-cxxiwxce
```

### Q4: 如何查看应用访问地址？

```bash
# 查看 Ingress
kubectl get ingress -n ns-cxxiwxce

# 查看 Service
kubectl get svc -n ns-cxxiwxce -o wide

# 查看 Pod IP
kubectl get pods -n ns-cxxiwxce -o wide
```

---

## 📋 部署检查清单

部署前：
- [ ] 代码已推送到 Git
- [ ] Dockerfile 存在
- [ ] package.json 完整

部署中：
- [ ] 镜像成功构建
- [ ] 镜像成功推送
- [ ] Kubernetes 部署已更新

部署后：
- [ ] Pod 状态为 Running
- [ ] 应用可以访问
- [ ] 日志无错误

---

## 🎯 推荐流程

### 第一次部署

1. **配置 GitHub Secrets**（5 分钟）
   - 获取 kubeconfig
   - 获取 Registry 凭证
   - 添加到 GitHub

2. **启用 GitHub Actions**（2 分钟）
   - 进入 GitHub Actions
   - 启用 workflow

3. **触发部署**（1 分钟）
   - 任何 push 都会自动部署

4. **验证部署**（5 分钟）
   - 查看 GitHub Actions 日志
   - 验证应用可访问

### 后续部署

只需 push 代码，自动部署！

```bash
git push origin main
```

---

## 💡 最佳实践

1. **使用 GitHub Actions**
   - 完全自动化
   - 无需本地操作
   - 适合团队协作

2. **定期备份**
   ```bash
   kubectl get deployment xiaodiyanxuan-frontend -n ns-cxxiwxce -o yaml > backup.yaml
   ```

3. **监控部署**
   ```bash
   kubectl logs -f deployment/xiaodiyanxuan-frontend -n ns-cxxiwxce
   ```

4. **版本管理**
   - 使用 git tag 标记版本
   - 保留部署历史

---

**准备好部署了吗？选择方式 1 开始吧！** 🚀
