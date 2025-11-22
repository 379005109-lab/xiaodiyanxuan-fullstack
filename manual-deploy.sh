#!/bin/bash
# 手动构建并部署后端（绕过 GitHub Actions）

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  手动构建和部署后端${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 检查是否在 Sealos 环境
if [ ! -f "/home/devbox/project/kubeconfig (7).yaml" ]; then
    echo -e "${RED}❌ kubeconfig 文件不存在${NC}"
    exit 1
fi

export KUBECONFIG="/home/devbox/project/kubeconfig (7).yaml"

# 方案：使用 kubectl set image 强制重启 Pod
echo -e "${YELLOW}[1/2] 获取当前镜像...${NC}"
CURRENT_IMAGE=$(kubectl get deployment xiaodiyanxuan-api -n ns-cxxiwxce -o jsonpath='{.spec.template.spec.containers[0].image}')
echo "   当前镜像: $CURRENT_IMAGE"
echo ""

echo -e "${YELLOW}[2/2] 强制重启 Pod（拉取最新镜像）...${NC}"
kubectl rollout restart deployment/xiaodiyanxuan-api -n ns-cxxiwxce

echo ""
echo -e "${GREEN}✓ 重启命令已发送${NC}"
echo ""

# 等待新 Pod 就绪
echo -e "${YELLOW}等待新 Pod 启动...${NC}"
kubectl rollout status deployment/xiaodiyanxuan-api -n ns-cxxiwxce --timeout=180s

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 部署完成！${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 显示 Pod 状态
echo "📊 Pod 状态："
kubectl get pods -n ns-cxxiwxce -l app=xiaodiyanxuan-api

echo ""
echo "🧪 测试接口："
echo ""

# 测试接口
sleep 5
curl -s https://lgpzubdtdxjf.sealoshzh.site/health | python3 -m json.tool 2>/dev/null || echo "Health check..."
echo ""

echo "测试 /api/categories/stats:"
curl -s https://lgpzubdtdxjf.sealoshzh.site/api/categories/stats | python3 -m json.tool 2>/dev/null | head -20

echo ""
echo -e "${GREEN}✓ 完成！${NC}"
