# 🔧 Docker Registry 403 错误 - 完整解决方案

## 当前问题

GitHub Actions 无法推送镜像到 `registry.sealoshzh.site/xiaodiyanxuan-backend`
错误：`403 Forbidden` / `denied`

---

## ✅ 解决方案 A：配置 Registry 凭证（推荐）

### 第1步：准备 Registry 用户名/密码

请使用 `registry.sealoshzh.site` 的账号（用户名/密码）。

---

### 第2步：添加到仓库 Secrets

1. **访问**：https://github.com/379005109-lab/xiaodiyanxuan-fullstack/settings/secrets/actions

2. **点击** `New repository secret` 按钮

3. **填写**：
   - **Name**: `REGISTRY_USERNAME`
   - **Secret**: Registry 用户名
4. **再添加一个**：
   - **Name**: `REGISTRY_PASSWORD`
   - **Secret**: Registry 密码
   
4. **点击** `Add secret`

---

### 第3步：更新工作流（已更新）

需要修改 `.github/workflows/build-backend.yml` / `.github/workflows/build-frontend.yml`：

```yaml
- name: Log in to Container Registry
  uses: docker/login-action@v3
  with:
    registry: registry.sealoshzh.site
    username: ${{ secrets.REGISTRY_USERNAME }}
    password: ${{ secrets.REGISTRY_PASSWORD }}
```

---

### 第4步：重新运行构建

1. **访问**：https://github.com/379005109-lab/xiaodiyanxuan-fullstack/actions

2. **点击**失败的工作流

3. **点击**右上角 `Re-run all jobs`

---

## ✅ 解决方案 B：确认 Registry 权限

如果仍然出现 403/denied：

1. 确认 `REGISTRY_USERNAME` / `REGISTRY_PASSWORD` 正确
2. 确认该账号对 `registry.sealoshzh.site/xiaodiyanxuan-backend` / `.../xiaodiyanxuan-frontend` 有推送权限

---

## 🚨 临时解决方案：手动部署（立即可用）

如果上面的方法需要时间，可以先手动部署：

```bash
bash manual-deploy.sh
```

这个脚本会：
1. 强制重启当前的 Kubernetes Pod
2. Kubernetes 会自动拉取最新的代码
3. 新 Pod 会使用最新的后端代码

**注意**：这只是临时方案，长期还是要修复 GitHub Actions。

---

## 📋 推荐执行顺序

### 方案 A（推荐）：配置 Registry Secrets

1. ✅ 配置 `REGISTRY_USERNAME` / `REGISTRY_PASSWORD`（1分钟）
2. ✅ 重新运行构建（2分钟）

**总耗时：10 分钟**

### 方案 B（如果很急）：手动部署

```bash
# 立即部署，1分钟搞定
bash manual-deploy.sh
```

然后有空再修复 GitHub Actions。

---

## 🔍 验证成功

### 检查 GitHub Actions：
- ✅ "Build and push Docker image" 步骤通过
- ✅ 看到 "pushed" 的日志

### 检查接口：
```bash
# 应该返回 200 和数据
curl https://lgpzubdtdxjf.sealoshzh.site/api/categories/stats
```

---

## 💡 为什么会出现 403？

**原因 1**：首次推送到新的 Package 命名空间需要认证
**原因 2**：`GITHUB_TOKEN` 的默认权限不足
**原因 3**：Package 的权限设置限制了仓库访问

**解决**：使用 PAT 提供足够的权限

---

## 下一步

**你现在有两个选择：**

1. **立即修复接口**（1分钟）：
   ```bash
   bash manual-deploy.sh
   ```

2. **设置 PAT 永久解决**（10分钟）：
   - 创建 PAT
   - 添加到 Secrets
   - 我会更新工作流
   - 重新运行构建

**建议：先执行方案1立即修复，再慢慢设置方案2！**
