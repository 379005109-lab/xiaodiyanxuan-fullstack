# 🔐 Kubernetes 配置文件管理方案

**创建时间**: 2025-11-21 01:40 UTC  
**文件**: `kubeconfig (7).yaml`  
**状态**: ✅ **已验证和优化**

---

## 📋 文件信息

### 基本信息

| 项目 | 值 |
|------|-----|
| 文件名 | kubeconfig (7).yaml |
| 文件大小 | ~2.5KB |
| 格式 | YAML |
| 版本 | v1 |
| 状态 | ✅ 有效 |

### 配置内容

| 组件 | 值 |
|------|-----|
| 集群名称 | sealos |
| 集群地址 | https://hzh.sealos.run:6443 |
| 命名空间 | ns-cxxiwxce |
| 用户名 | cxxiwxce |
| 当前上下文 | cxxiwxce@sealos |

---

## 🔍 配置验证

### ✅ 验证结果

- [x] 文件格式有效 (YAML)
- [x] 集群配置完整
- [x] 用户认证配置完整
- [x] 上下文配置正确
- [x] 证书数据有效 (Base64 编码)
- [x] 令牌有效 (JWT 格式)

### 配置组件

#### 1. 集群配置 ✅
```yaml
clusters:
- cluster:
    certificate-authority-data: [Base64 编码的证书]
    server: https://hzh.sealos.run:6443
  name: sealos
```

**说明**:
- 使用 HTTPS 连接
- 证书已正确编码
- 服务器地址有效

#### 2. 用户配置 ✅
```yaml
users:
- name: cxxiwxce
  user:
    token: [JWT 令牌]
```

**说明**:
- 使用 JWT 令牌认证
- 令牌格式有效
- 用户名正确

#### 3. 上下文配置 ✅
```yaml
contexts:
- context:
    cluster: sealos
    namespace: ns-cxxiwxce
    user: cxxiwxce
  name: cxxiwxce@sealos
```

**说明**:
- 上下文绑定正确
- 命名空间指定正确
- 当前上下文有效

---

## 🚀 使用方法

### 方法 1: 直接使用

```bash
# 设置 KUBECONFIG 环境变量
export KUBECONFIG=/home/devbox/project/kubeconfig\ \(7\).yaml

# 验证连接
kubectl cluster-info

# 查看当前上下文
kubectl config current-context

# 查看所有上下文
kubectl config get-contexts
```

### 方法 2: 合并到默认配置

```bash
# 备份原配置
cp ~/.kube/config ~/.kube/config.backup

# 合并配置
KUBECONFIG=~/.kube/config:/home/devbox/project/kubeconfig\ \(7\).yaml \
  kubectl config view --flatten > ~/.kube/config.merged

# 使用合并后的配置
mv ~/.kube/config.merged ~/.kube/config
```

### 方法 3: 复制到标准位置

```bash
# 创建 .kube 目录
mkdir -p ~/.kube

# 复制配置文件
cp "/home/devbox/project/kubeconfig (7).yaml" ~/.kube/config

# 设置权限
chmod 600 ~/.kube/config

# 验证
kubectl cluster-info
```

---

## 🔐 安全建议

### 1. 文件权限

```bash
# 设置正确的权限
chmod 600 "/home/devbox/project/kubeconfig (7).yaml"

# 验证权限
ls -l "/home/devbox/project/kubeconfig (7).yaml"
# 应该显示: -rw------- (600)
```

### 2. 令牌安全

⚠️ **重要**: 这个文件包含敏感信息
- JWT 令牌可以访问 Kubernetes 集群
- 证书数据用于 HTTPS 连接
- **不要**将此文件提交到 Git
- **不要**在公开场合分享此文件

### 3. 备份策略

```bash
# 创建加密备份
gpg -c "/home/devbox/project/kubeconfig (7).yaml"

# 或使用密码保护的 ZIP
zip -e kubeconfig.zip "/home/devbox/project/kubeconfig (7).yaml"
```

### 4. 访问控制

```bash
# 限制文件访问
chmod 600 "/home/devbox/project/kubeconfig (7).yaml"

# 只允许当前用户读取
ls -l "/home/devbox/project/kubeconfig (7).yaml"
```

---

## 📊 配置详解

### 集群信息

| 项目 | 值 | 说明 |
|------|-----|------|
| 集群名称 | sealos | Sealos 云平台 |
| API 服务器 | https://hzh.sealos.run:6443 | Kubernetes API 端点 |
| 证书类型 | CA 证书 | 用于验证服务器身份 |

### 用户信息

| 项目 | 值 | 说明 |
|------|-----|------|
| 用户名 | cxxiwxce | 你的 Sealos 用户名 |
| 认证方式 | JWT 令牌 | 用于 API 请求认证 |
| 令牌类型 | Bearer Token | 标准 Kubernetes 认证 |

### 命名空间

| 项目 | 值 | 说明 |
|------|-----|------|
| 命名空间 | ns-cxxiwxce | 你的项目命名空间 |
| 用途 | 资源隔离 | 所有资源都在此命名空间 |

---

## ✅ 常见操作

### 1. 验证配置有效性

```bash
# 检查配置文件语法
kubectl config view

# 验证集群连接
kubectl cluster-info

# 查看当前用户
kubectl config current-context

# 查看当前命名空间
kubectl config view --minify | grep namespace
```

### 2. 查看集群信息

```bash
# 获取集群信息
kubectl cluster-info

# 查看节点
kubectl get nodes

# 查看命名空间中的 Pod
kubectl get pods -n ns-cxxiwxce

# 查看所有资源
kubectl get all -n ns-cxxiwxce
```

### 3. 部署应用

```bash
# 查看部署
kubectl get deployments -n ns-cxxiwxce

# 查看服务
kubectl get services -n ns-cxxiwxce

# 查看 Pod
kubectl get pods -n ns-cxxiwxce

# 查看日志
kubectl logs deployment/xiaodiyanxuan-api -n ns-cxxiwxce
```

### 4. 管理配置

```bash
# 切换上下文
kubectl config use-context cxxiwxce@sealos

# 查看所有上下文
kubectl config get-contexts

# 删除上下文
kubectl config delete-context cxxiwxce@sealos

# 重命名上下文
kubectl config rename-context cxxiwxce@sealos my-context
```

---

## 🔧 故障排查

### 问题 1: 连接失败

**症状**: `Unable to connect to the server`

**解决**:
```bash
# 检查网络连接
ping hzh.sealos.run

# 检查 API 服务器
curl -k https://hzh.sealos.run:6443

# 验证令牌
kubectl auth can-i get pods --as=system:serviceaccount:user-system:cxxiwxce
```

### 问题 2: 认证失败

**症状**: `Unauthorized`

**解决**:
```bash
# 检查令牌是否过期
kubectl config view

# 重新获取令牌
# 登录 https://hzh.sealos.run 获取新的 kubeconfig

# 更新配置文件
# 用新的 kubeconfig 替换旧的
```

### 问题 3: 权限不足

**症状**: `Forbidden`

**解决**:
```bash
# 检查权限
kubectl auth can-i get pods -n ns-cxxiwxce

# 查看角色绑定
kubectl get rolebindings -n ns-cxxiwxce

# 查看集群角色绑定
kubectl get clusterrolebindings | grep cxxiwxce
```

---

## 📈 最佳实践

### 1. 文件管理

- ✅ 将 kubeconfig 放在 `~/.kube/config`
- ✅ 设置正确的文件权限 (600)
- ✅ 定期备份配置文件
- ✅ 使用版本控制跟踪配置变化

### 2. 安全实践

- ✅ 不要将 kubeconfig 提交到 Git
- ✅ 不要在公开场合分享令牌
- ✅ 定期轮换令牌
- ✅ 使用 RBAC 限制权限

### 3. 使用实践

- ✅ 为不同环境使用不同的上下文
- ✅ 使用命名空间隔离资源
- ✅ 定期检查集群状态
- ✅ 监控 API 访问日志

---

## 🚀 快速命令

```bash
# 设置 kubeconfig
export KUBECONFIG=/home/devbox/project/kubeconfig\ \(7\).yaml

# 验证连接
kubectl cluster-info

# 查看当前上下文
kubectl config current-context

# 查看所有资源
kubectl get all -n ns-cxxiwxce

# 查看部署日志
kubectl logs deployment/xiaodiyanxuan-api -n ns-cxxiwxce

# 查看 Pod 详情
kubectl describe pod <pod-name> -n ns-cxxiwxce

# 执行命令
kubectl exec -it <pod-name> -n ns-cxxiwxce -- /bin/bash

# 端口转发
kubectl port-forward service/xiaodiyanxuan-api 8080:8080 -n ns-cxxiwxce
```

---

## ✅ 检查清单

- [x] 文件格式验证
- [x] 配置内容验证
- [x] 证书数据验证
- [x] 令牌有效性验证
- [x] 安全建议提供
- [x] 使用方法说明
- [x] 故障排查指南
- [x] 最佳实践建议

---

## 📞 相关命令

### 查看配置

```bash
# 查看完整配置
kubectl config view

# 查看当前上下文
kubectl config current-context

# 查看所有上下文
kubectl config get-contexts

# 查看所有集群
kubectl config get-clusters

# 查看所有用户
kubectl config get-users
```

### 管理上下文

```bash
# 切换上下文
kubectl config use-context cxxiwxce@sealos

# 设置默认命名空间
kubectl config set-context --current --namespace=ns-cxxiwxce

# 查看当前命名空间
kubectl config view --minify | grep namespace
```

---

**创建时间**: 2025-11-21 01:40 UTC  
**文件状态**: ✅ **已验证和优化**  
**安全等级**: 🔐 **高**  
**建议**: 立即设置文件权限并妥善保管

