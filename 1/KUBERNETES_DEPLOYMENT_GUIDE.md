# ☸️ Kubernetes 部署和管理完全指南

**创建时间**: 2025-11-21 01:45 UTC  
**平台**: Sealos (Kubernetes)  
**命名空间**: ns-cxxiwxce  
**状态**: ✅ **已配置和验证**

---

## 🎯 快速开始

### 1️⃣ 验证 Kubernetes 连接

```bash
# 设置 kubeconfig
export KUBECONFIG=~/.kube/config

# 验证连接
kubectl cluster-info

# 查看当前上下文
kubectl config current-context

# 查看当前命名空间
kubectl config view --minify | grep namespace
```

**预期输出**:
```
Kubernetes control plane is running at https://hzh.sealos.run:6443
CoreDNS is running at https://hzh.sealos.run:6443/api/v1/namespaces/kube-system/services/kube-dns/proxy

cxxiwxce@sealos
ns-cxxiwxce
```

### 2️⃣ 查看部署状态

```bash
# 查看所有部署
kubectl get deployments -n ns-cxxiwxce

# 查看所有 Pod
kubectl get pods -n ns-cxxiwxce

# 查看所有服务
kubectl get services -n ns-cxxiwxce

# 查看所有资源
kubectl get all -n ns-cxxiwxce
```

### 3️⃣ 查看应用日志

```bash
# 查看后端应用日志
kubectl logs deployment/xiaodiyanxuan-api -n ns-cxxiwxce

# 实时查看日志
kubectl logs -f deployment/xiaodiyanxuan-api -n ns-cxxiwxce

# 查看最后 50 行
kubectl logs deployment/xiaodiyanxuan-api -n ns-cxxiwxce --tail=50

# 查看特定 Pod 的日志
kubectl logs <pod-name> -n ns-cxxiwxce
```

---

## 📊 部署管理

### 查看部署

```bash
# 列出所有部署
kubectl get deployments -n ns-cxxiwxce

# 查看部署详情
kubectl describe deployment xiaodiyanxuan-api -n ns-cxxiwxce

# 查看部署的 YAML
kubectl get deployment xiaodiyanxuan-api -n ns-cxxiwxce -o yaml

# 查看部署的历史
kubectl rollout history deployment/xiaodiyanxuan-api -n ns-cxxiwxce
```

### 更新部署

```bash
# 更新镜像
kubectl set image deployment/xiaodiyanxuan-api \
  xiaodiyanxuan-api=ghcr.io/379005109-lab/xiaodiyanxuan-backend:latest \
  -n ns-cxxiwxce

# 更新副本数
kubectl scale deployment xiaodiyanxuan-api --replicas=3 -n ns-cxxiwxce

# 更新环境变量
kubectl set env deployment/xiaodiyanxuan-api \
  LOG_LEVEL=debug \
  -n ns-cxxiwxce

# 重启部署
kubectl rollout restart deployment/xiaodiyanxuan-api -n ns-cxxiwxce
```

### 回滚部署

```bash
# 查看部署历史
kubectl rollout history deployment/xiaodiyanxuan-api -n ns-cxxiwxce

# 回滚到上一个版本
kubectl rollout undo deployment/xiaodiyanxuan-api -n ns-cxxiwxce

# 回滚到特定版本
kubectl rollout undo deployment/xiaodiyanxuan-api -n ns-cxxiwxce --to-revision=1

# 查看回滚状态
kubectl rollout status deployment/xiaodiyanxuan-api -n ns-cxxiwxce
```

---

## 🔍 Pod 管理

### 查看 Pod

```bash
# 列出所有 Pod
kubectl get pods -n ns-cxxiwxce

# 查看 Pod 详情
kubectl describe pod <pod-name> -n ns-cxxiwxce

# 查看 Pod 的 YAML
kubectl get pod <pod-name> -n ns-cxxiwxce -o yaml

# 查看 Pod 事件
kubectl describe pod <pod-name> -n ns-cxxiwxce | grep -A 10 Events
```

### 执行 Pod 命令

```bash
# 进入 Pod 容器
kubectl exec -it <pod-name> -n ns-cxxiwxce -- /bin/bash

# 执行命令
kubectl exec <pod-name> -n ns-cxxiwxce -- ls -la

# 复制文件到 Pod
kubectl cp <local-file> <pod-name>:/path/to/file -n ns-cxxiwxce

# 从 Pod 复制文件
kubectl cp <pod-name>:/path/to/file <local-file> -n ns-cxxiwxce
```

### 删除 Pod

```bash
# 删除 Pod
kubectl delete pod <pod-name> -n ns-cxxiwxce

# 强制删除 Pod
kubectl delete pod <pod-name> -n ns-cxxiwxce --grace-period=0 --force

# 删除所有 Pod
kubectl delete pods --all -n ns-cxxiwxce
```

---

## 🔐 服务和网络

### 查看服务

```bash
# 列出所有服务
kubectl get services -n ns-cxxiwxce

# 查看服务详情
kubectl describe service xiaodiyanxuan-api -n ns-cxxiwxce

# 查看服务的 YAML
kubectl get service xiaodiyanxuan-api -n ns-cxxiwxce -o yaml

# 查看 Ingress
kubectl get ingress -n ns-cxxiwxce
```

### 端口转发

```bash
# 本地端口转发到服务
kubectl port-forward service/xiaodiyanxuan-api 8080:8080 -n ns-cxxiwxce

# 本地端口转发到 Pod
kubectl port-forward pod/<pod-name> 8080:8080 -n ns-cxxiwxce

# 在后台运行
kubectl port-forward service/xiaodiyanxuan-api 8080:8080 -n ns-cxxiwxce &
```

### 访问服务

```bash
# 通过 DNS 名称访问
curl http://xiaodiyanxuan-api.ns-cxxiwxce.svc.cluster.local:8080

# 通过 Ingress 访问
curl https://pkochbpmcgaa.sealoshzh.site

# 通过端口转发访问
curl http://localhost:8080
```

---

## 📦 资源管理

### 查看资源使用

```bash
# 查看 Pod 资源使用
kubectl top pods -n ns-cxxiwxce

# 查看节点资源使用
kubectl top nodes

# 查看资源配额
kubectl describe resourcequota -n ns-cxxiwxce

# 查看资源限制
kubectl describe limits -n ns-cxxiwxce
```

### 管理资源

```bash
# 查看所有资源
kubectl get all -n ns-cxxiwxce

# 删除资源
kubectl delete deployment xiaodiyanxuan-api -n ns-cxxiwxce

# 应用资源配置
kubectl apply -f deployment.yaml -n ns-cxxiwxce

# 更新资源配置
kubectl patch deployment xiaodiyanxuan-api -p '{"spec":{"replicas":3}}' -n ns-cxxiwxce
```

---

## 🔧 故障排查

### 常见问题

#### 问题 1: Pod 无法启动

**症状**: Pod 状态为 Pending 或 CrashLoopBackOff

**排查步骤**:
```bash
# 查看 Pod 状态
kubectl get pods -n ns-cxxiwxce

# 查看 Pod 事件
kubectl describe pod <pod-name> -n ns-cxxiwxce

# 查看 Pod 日志
kubectl logs <pod-name> -n ns-cxxiwxce

# 查看前一个容器的日志
kubectl logs <pod-name> -n ns-cxxiwxce --previous
```

#### 问题 2: 服务无法访问

**症状**: 无法连接到服务

**排查步骤**:
```bash
# 查看服务
kubectl get services -n ns-cxxiwxce

# 查看 Endpoints
kubectl get endpoints -n ns-cxxiwxce

# 测试 DNS
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup xiaodiyanxuan-api.ns-cxxiwxce.svc.cluster.local

# 测试连接
kubectl run -it --rm debug --image=busybox --restart=Never -- wget -O- http://xiaodiyanxuan-api:8080/health
```

#### 问题 3: 镜像拉取失败

**症状**: ImagePullBackOff 错误

**排查步骤**:
```bash
# 查看 Pod 事件
kubectl describe pod <pod-name> -n ns-cxxiwxce

# 检查镜像是否存在
docker pull ghcr.io/379005109-lab/xiaodiyanxuan-backend:latest

# 检查镜像拉取密钥
kubectl get secrets -n ns-cxxiwxce

# 创建镜像拉取密钥
kubectl create secret docker-registry regcred \
  --docker-server=ghcr.io \
  --docker-username=<username> \
  --docker-password=<token> \
  -n ns-cxxiwxce
```

---

## 📈 监控和告警

### 查看监控指标

```bash
# 查看 Pod 资源使用
kubectl top pods -n ns-cxxiwxce

# 查看节点资源使用
kubectl top nodes

# 查看资源使用趋势
kubectl get hpa -n ns-cxxiwxce
```

### 配置自动扩展

```bash
# 创建 HPA
kubectl autoscale deployment xiaodiyanxuan-api \
  --min=1 --max=3 \
  --cpu-percent=80 \
  -n ns-cxxiwxce

# 查看 HPA
kubectl get hpa -n ns-cxxiwxce

# 查看 HPA 详情
kubectl describe hpa xiaodiyanxuan-api -n ns-cxxiwxce
```

---

## 🚀 部署最佳实践

### 1. 资源配置

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### 2. 健康检查

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
```

### 3. 环境变量

```yaml
env:
- name: LOG_LEVEL
  value: "info"
- name: MONGODB_URI
  valueFrom:
    secretKeyRef:
      name: app-secrets
      key: mongodb-uri
```

### 4. 卷挂载

```yaml
volumeMounts:
- name: config
  mountPath: /etc/config
- name: data
  mountPath: /data

volumes:
- name: config
  configMap:
    name: app-config
- name: data
  persistentVolumeClaim:
    claimName: app-data
```

---

## 📊 常用命令速查

```bash
# 集群信息
kubectl cluster-info
kubectl get nodes
kubectl describe node <node-name>

# 命名空间
kubectl get namespaces
kubectl create namespace <name>
kubectl delete namespace <name>

# 部署
kubectl get deployments -n ns-cxxiwxce
kubectl create deployment <name> --image=<image> -n ns-cxxiwxce
kubectl delete deployment <name> -n ns-cxxiwxce

# Pod
kubectl get pods -n ns-cxxiwxce
kubectl describe pod <pod-name> -n ns-cxxiwxce
kubectl logs <pod-name> -n ns-cxxiwxce
kubectl exec -it <pod-name> -n ns-cxxiwxce -- /bin/bash

# 服务
kubectl get services -n ns-cxxiwxce
kubectl expose deployment <name> --port=8080 -n ns-cxxiwxce
kubectl delete service <name> -n ns-cxxiwxce

# 配置
kubectl get configmaps -n ns-cxxiwxce
kubectl create configmap <name> --from-file=<file> -n ns-cxxiwxce
kubectl delete configmap <name> -n ns-cxxiwxce

# 密钥
kubectl get secrets -n ns-cxxiwxce
kubectl create secret generic <name> --from-literal=key=value -n ns-cxxiwxce
kubectl delete secret <name> -n ns-cxxiwxce
```

---

## ✅ 检查清单

- [x] Kubernetes 配置已设置
- [x] 连接已验证
- [x] 部署已查看
- [x] Pod 已检查
- [x] 服务已验证
- [x] 日志已查看
- [x] 故障排查指南已提供

---

**创建时间**: 2025-11-21 01:45 UTC  
**平台**: Sealos Kubernetes  
**命名空间**: ns-cxxiwxce  
**状态**: ✅ **已配置和验证**

