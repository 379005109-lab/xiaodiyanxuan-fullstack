#!/bin/bash
# 重新构建并部署前端

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  重新构建前端${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 1. 构建前端
echo -e "${YELLOW}[1/4] 构建前端代码...${NC}"
cd /home/devbox/project/1114/client/frontend
npm run build

# 2. 打包dist目录
echo -e "${YELLOW}[2/4] 打包构建文件...${NC}"
cd dist
tar czf ../frontend-dist.tar.gz *
cd ..

# 3. 更新 ConfigMap
echo -e "${YELLOW}[3/4] 更新 Kubernetes ConfigMap...${NC}"
export KUBECONFIG="/home/devbox/project/kubeconfig (7).yaml"

# 删除旧的 ConfigMap
kubectl delete configmap xiaodiyanxuan-frontend-config -n ns-cxxiwxce 2>/dev/null || true

# 创建新的 ConfigMap
kubectl create configmap xiaodiyanxuan-frontend-config \
  --from-file=frontend-dist.tar.gz=frontend-dist.tar.gz \
  -n ns-cxxiwxce

# 4. 重启 Pod
echo -e "${YELLOW}[4/4] 重启前端 Pod...${NC}"
kubectl delete pods -n ns-cxxiwxce -l app=xiaodiyanxuan-frontend

# 等待就绪
kubectl rollout status deployment/xiaodiyanxuan-frontend -n ns-cxxiwxce --timeout=120s

echo ""
echo -e "${GREEN}✅ 前端更新完成！${NC}"
echo ""
echo "清理临时文件..."
rm -f frontend-dist.tar.gz

echo ""
echo -e "${GREEN}现在可以刷新浏览器测试了！${NC}"
