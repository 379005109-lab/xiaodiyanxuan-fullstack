# 后端部署完整指南

## 🎯 目标

部署包含所有修复的后端Docker镜像，解决前端白屏问题。

---

## ✅ 前置条件

### 必需
1. **Docker环境** - 用于构建镜像
2. **GitHub Personal Access Token** - 用于推送镜像
   - 权限：`write:packages`
   - 创建地址：https://github.com/settings/tokens
3. **kubeconfig文件** - 已有：`kubeconfig (7).yaml`

### 可选
- Docker Hub账号（备用方案）

---

## 🚀 方案1：自动化部署（推荐）

### 使用部署脚本

```bash
cd /home/devbox/project
./deploy-backend.sh
```

脚本会自动完成：
1. ✅ 检查Docker环境
2. ✅ 构建后端镜像
3. ✅ 登录GHCR（需要输入token）
4. ✅ 推送镜像
5. ✅ 更新Kubernetes
6. ✅ 验证部署

**预计时间**：5-10分钟

---

## 🔧 方案2：手动部署

### 步骤1：构建镜像

```bash
cd /home/devbox/project/backend
docker build -t ghcr.io/379005109-lab/xiaodiyanxuan-backend:latest .
```

**预期输出**：
```
Successfully built [image-id]
Successfully tagged ghcr.io/379005109-lab/xiaodiyanxuan-backend:latest
```

### 步骤2：登录GHCR

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u 379005109-lab --password-stdin
```

或交互式登录：
```bash
docker login ghcr.io -u 379005109-lab
# 输入Personal Access Token
```

### 步骤3：推送镜像

```bash
docker push ghcr.io/379005109-lab/xiaodiyanxuan-backend:latest
```

**预期输出**：
```
latest: digest: sha256:... size: ...
```

### 步骤4：更新Kubernetes

```bash
export KUBECONFIG="/home/devbox/project/kubeconfig (7).yaml"

# 更新镜像
kubectl set image deployment/xiaodiyanxuan-api \
  api=ghcr.io/379005109-lab/xiaodiyanxuan-backend:latest \
  -n ns-cxxiwxce

# 重启deployment
kubectl rollout restart deployment/xiaodiyanxuan-api -n ns-cxxiwxce

# 等待完成
kubectl rollout status deployment/xiaodiyanxuan-api -n ns-cxxiwxce
```

### 步骤5：验证部署

```bash
# 测试登录API
curl -X POST http://lgpzubdtdxjf.sealoshzh.site/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**预期响应**：
```json
{
  "success": true,
  "data": {
    "user": {
      "role": "super_admin"  // ✅ 应该是super_admin，不是customer
    }
  }
}
```

---

## 🐛 常见问题

### 问题1：Docker未安装

**错误**：
```
bash: docker: command not found
```

**解决**：
- Linux: `curl -fsSL https://get.docker.com | sh`
- Mac: 下载 Docker Desktop
- Windows: 下载 Docker Desktop

### 问题2：权限不足

**错误**：
```
Got permission denied while trying to connect to the Docker daemon socket
```

**解决**：
```bash
sudo usermod -aG docker $USER
# 然后登出重新登录
```

### 问题3：推送失败（403/401）

**错误**：
```
denied: permission_denied
```

**解决**：
- 检查Token权限是否包含`write:packages`
- 确认Token未过期
- 重新登录GHCR

### 问题4：镜像拉取失败

**错误**：
```
ErrImagePull
```

**解决**：
```bash
# 检查镜像是否公开
# 或配置imagePullSecrets

kubectl create secret docker-registry ghcr-creds \
  --docker-server=ghcr.io \
  --docker-username=379005109-lab \
  --docker-password=$GITHUB_TOKEN \
  -n ns-cxxiwxce
```

### 问题5：Pod启动失败

**排查**：
```bash
# 查看Pod状态
kubectl get pods -n ns-cxxiwxce -l app=xiaodiyanxuan-api

# 查看Pod日志
kubectl logs -n ns-cxxiwxce -l app=xiaodiyanxuan-api --tail=100

# 查看Pod详情
kubectl describe pod -n ns-cxxiwxce [pod-name]
```

---

## 📊 部署后验证清单

### 后端验证

- [ ] Pod状态为Running
- [ ] 登录API返回`role: super_admin`
- [ ] 健康检查通过：`curl http://lgpzubdtdxjf.sealoshzh.site/api/health`
- [ ] 商品列表API返回数据包含skus字段

### 前端验证

- [ ] 访问首页不再白屏
- [ ] Console没有"Cannot read properties of undefined"错误
- [ ] 商品列表正常显示
- [ ] 新建商品功能正常
- [ ] 编辑商品可以加载数据

---

## 🎉 预期效果

部署成功后，以下问题将全部解决：

| 问题 | 解决状态 |
|------|---------|
| 前端商城白屏 | ✅ 解决 |
| 编辑商品数据对不上 | ✅ 解决 |
| 批量导入商品无法编辑 | ✅ 解决 |
| 上传大图片413错误 | ✅ 解决 |
| 登录返回错误角色 | ✅ 解决 |

---

## 💡 备用方案

### 如果无法访问GHCR

使用Docker Hub：

```bash
# 构建镜像
docker build -t [your-dockerhub-username]/xiaodiyanxuan-backend:latest .

# 登录Docker Hub
docker login

# 推送镜像
docker push [your-dockerhub-username]/xiaodiyanxuan-backend:latest

# 更新Kubernetes
kubectl set image deployment/xiaodiyanxuan-api \
  api=[your-dockerhub-username]/xiaodiyanxuan-backend:latest \
  -n ns-cxxiwxce
```

### 如果无法使用脚本

按照"方案2：手动部署"的步骤逐步执行。

---

## 📝 部署记录模板

```
部署时间：____________________
操作人员：____________________
镜像版本：____________________
部署结果：□ 成功  □ 失败
验证状态：□ 通过  □ 未通过

备注：
_________________________________
_________________________________
```

---

## 🔗 相关文档

- Docker安装：https://docs.docker.com/get-docker/
- GitHub Packages：https://docs.github.com/en/packages
- Kubernetes部署：https://kubernetes.io/docs/concepts/workloads/controllers/deployment/

---

**准备好后，执行部署脚本即可！** 🚀

```bash
cd /home/devbox/project
./deploy-backend.sh
```
