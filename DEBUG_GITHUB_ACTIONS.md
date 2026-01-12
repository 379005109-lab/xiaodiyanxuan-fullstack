# GitHub Actions 构建失败排查指南

## 🔴 当前状态
两个构建都失败，错误信息：`Process completed with exit code 1`

---

## 🔍 排查步骤

### 第1步：查看详细错误日志

1. **打开 GitHub Actions 页面**：
   ```
   https://github.com/379005109-lab/xiaodiyanxuan-fullstack/actions
   ```

2. **点击失败的工作流**（红色 ❌）

3. **查看具体失败的步骤**：
   - "Build and push Docker image" - Docker 构建问题
   - "Configure Kubernetes" - KUBECONFIG 问题
   - "Update Kubernetes deployment" - 部署问题

4. **常见错误及解决方案**：

#### 错误 A: Registry 凭证/权限问题
```
Error: denied: permission_denied: write_package
```

**解决**：
- 检查 `REGISTRY_USERNAME` / `REGISTRY_PASSWORD` 是否正确
- 确认 registry 账号有推送权限
- 更新 Secret：https://github.com/379005109-lab/xiaodiyanxuan-fullstack/settings/secrets/actions

#### 错误 B: KUBECONFIG 配置问题
```
Error: The connection to the server localhost:8080 was refused
```

**解决**：
- 确认 KUBECONFIG secret 已正确添加
- 内容应该是 base64 编码的 kubeconfig 文件

#### 错误 C: Docker 构建失败
```
Error: failed to solve: failed to build
```

**解决**：
- 检查 Dockerfile 语法
- 检查依赖安装是否有问题

---

## ⚡ 临时解决方案：手动部署

如果 GitHub Actions 一直有问题，可以直接手动重启 Pod：

```bash
# 重启后端 Pod（使用最新代码）
export KUBECONFIG="/home/devbox/project/kubeconfig (7).yaml"
kubectl rollout restart deployment/xiaodiyanxuan-api -n ns-cxxiwxce
kubectl rollout status deployment/xiaodiyanxuan-api -n ns-cxxiwxce --timeout=90s

# 重启前端 Pod
kubectl rollout restart deployment/xiaodiyanxuan-frontend -n ns-cxxiwxce
kubectl rollout status deployment/xiaodiyanxuan-frontend -n ns-cxxiwxce --timeout=90s
```

---

## 🔧 修复 GitHub Actions

### 检查 Secrets 配置

确保这些 Secrets 都已正确配置：

| Secret 名称 | 用途 | 状态 |
|------------|------|------|
| `REGISTRY_USERNAME` | Registry 登录用户名 | ⏳ 检查 |
| `REGISTRY_PASSWORD` | Registry 登录密码 | ⏳ 检查 |
| `KUBECONFIG` | 连接 Kubernetes | ⏳ 检查 |

访问：https://github.com/379005109-lab/xiaodiyanxuan-fullstack/settings/secrets/actions

### 检查工作流文件

1. 检查 `.github/workflows/backend-build.yml`
2. 检查 `.github/workflows/frontend-build.yml`

---

## 📋 下一步

1. **查看 GitHub Actions 日志** 确定具体错误
2. **根据错误类型** 选择对应的解决方案
3. **如果急需部署** 使用手动部署命令

---

## 💡 提示

- GitHub Actions 失败不影响现有服务运行
- 可以先手动重启 Pod 让最新代码生效
- 之后慢慢修复 GitHub Actions 配置
