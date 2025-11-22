# 🔧 GitHub Container Registry 403 错误 - 完整解决方案

## 当前问题

GitHub Actions 无法推送镜像到 `ghcr.io/379005109-lab/xiaodiyanxuan-backend`
错误：`403 Forbidden`

---

## ✅ 解决方案 A：创建个人访问令牌（最可靠）

### 第1步：创建 PAT (Personal Access Token)

1. **访问**：https://github.com/settings/tokens/new

2. **配置令牌**：
   - **Note (备注)**: `GHCR Package Write`
   - **Expiration (过期时间)**: `No expiration` 或 `90 days`
   - **Select scopes (选择权限)**:
     - ✅ `write:packages` - 上传包到 GitHub Package Registry
     - ✅ `read:packages` - 从 GitHub Package Registry 下载包
     - ✅ `delete:packages` - 从 GitHub Package Registry 删除包
     - ✅ `repo` (可选，如果是私有仓库)

3. **点击** `Generate token` 按钮

4. **复制令牌** - ⚠️ 只显示一次！立即复制保存！

---

### 第2步：添加到仓库 Secrets

1. **访问**：https://github.com/379005109-lab/xiaodiyanxuan-fullstack/settings/secrets/actions

2. **点击** `New repository secret` 按钮

3. **填写**：
   - **Name**: `GHCR_TOKEN`
   - **Secret**: 粘贴刚才复制的 PAT
   
4. **点击** `Add secret`

---

### 第3步：更新工作流（我来做）

需要修改 `.github/workflows/backend-build.yml`：

```yaml
- name: Log in to Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.repository_owner }}
    password: ${{ secrets.GHCR_TOKEN }}  # 使用 PAT
```

---

### 第4步：重新运行构建

1. **访问**：https://github.com/379005109-lab/xiaodiyanxuan-fullstack/actions

2. **点击**失败的工作流

3. **点击**右上角 `Re-run all jobs`

---

## ✅ 解决方案 B：修改 Package 可见性（如果 Package 已存在）

### 如果 `xiaodiyanxuan-backend` package 已经存在：

1. **访问你的 Packages**：
   https://github.com/379005109-lab?tab=packages

2. **找到** `xiaodiyanxuan-backend` 并点击

3. **点击** `Package settings`

4. **在 "Manage Actions access" 部分**：
   - 点击 `Add Repository`
   - 搜索并添加 `379005109-lab/xiaodiyanxuan-fullstack`
   - 权限选择 `Write`

5. **保存设置**

6. **重新运行** GitHub Actions

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

### 方案 A（推荐）：使用 PAT

1. ✅ 创建 PAT（5分钟）
2. ✅ 添加到 Secrets（1分钟）
3. ✅ 我修改工作流配置（已完成）
4. ✅ 重新运行构建（2分钟）

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
- ✅ 看到 "pushed to ghcr.io" 的日志

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
