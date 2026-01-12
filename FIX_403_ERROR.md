# 🔧 修复 GitHub Actions 403 错误

## 问题

```
ERROR: failed to push registry.sealoshzh.site/xiaodiyanxuan-backend:latest
unexpected status from HEAD request: 403 Forbidden
```

## 原因

GitHub Actions 没有权限推送镜像到 Docker Registry (registry.sealoshzh.site)。

---

## ✅ 解决方案（3选1）

### 方案 1：修改仓库 Actions 权限（最简单）⭐

1. 打开仓库设置：
   ```
   https://github.com/379005109-lab/xiaodiyanxuan-fullstack/settings/actions
   ```

2. 滚动到 **Workflow permissions** 部分

3. 选择：
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**

4. 点击 **Save**

5. 重新运行失败的工作流：
   ```
   https://github.com/379005109-lab/xiaodiyanxuan-fullstack/actions
   ```
   点击失败的工作流 → 点击右上角 **Re-run all jobs**

---

### 方案 2：使用个人访问令牌（如果方案1不行）

1. 添加 Registry 凭证到仓库 Secrets：
   - 访问：https://github.com/379005109-lab/xiaodiyanxuan-fullstack/settings/secrets/actions
   - 添加：
     - `REGISTRY_USERNAME`
     - `REGISTRY_PASSWORD`

2. 确认工作流使用 Registry Secrets：
   ```yaml
   - name: Login to Registry
     uses: docker/login-action@v3
     with:
       registry: ${{ env.REGISTRY }}
       username: ${{ secrets.REGISTRY_USERNAME }}
       password: ${{ secrets.REGISTRY_PASSWORD }}
   ```

---

### 方案 3：检查 Package 权限设置

如果 package 已经存在，可能需要修改其权限：

1. 访问你的 Packages：
   ```
   https://github.com/379005109-lab?tab=packages
   ```

2. 找到 `xiaodiyanxuan-backend`

3. 点击 **Package settings**

4. 在 **Manage Actions access** 部分：
   - 确保仓库 `xiaodiyanxuan-fullstack` 有 **Write** 权限

5. 保存设置

---

## 🎯 推荐步骤

**按顺序尝试：**

1. ✅ 先试方案 1（最简单，90%有效）
2. 如果不行，试方案 3（检查 Package 权限）
3. 最后才用方案 2（创建 PAT）

---

## 🔄 重新运行构建

修复权限后：

1. 访问 Actions 页面：
   ```
   https://github.com/379005109-lab/xiaodiyanxuan-fullstack/actions
   ```

2. 点击失败的工作流

3. 点击右上角 **Re-run all jobs**

---

## ✅ 验证成功

构建成功后，你会看到：
- ✅ "Build and push Docker image" 步骤通过
- ✅ "Update Kubernetes deployment" 步骤执行
- ✅ 镜像已推送到 `registry.sealoshzh.site/xiaodiyanxuan-backend:latest`

---

## 💡 提示

我已经修改了工作流配置，使用 `REGISTRY_USERNAME` / `REGISTRY_PASSWORD` 作为登录凭证。

现在你只需要按照上面的方案 1 修改权限设置即可！
