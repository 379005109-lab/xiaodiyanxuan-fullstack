#!/bin/bash
# 检查部署状态脚本

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  检查后端部署状态${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 检查 GitHub Actions
echo -e "${YELLOW}📊 GitHub Actions 状态：${NC}"
echo "   https://github.com/379005109-lab/xiaodiyanxuan-fullstack/actions"
echo ""

# 检查 Kubernetes Pod
if [ -f "/home/devbox/project/kubeconfig (7).yaml" ]; then
    export KUBECONFIG="/home/devbox/project/kubeconfig (7).yaml"
    
    echo -e "${YELLOW}🔍 Kubernetes Pod 状态：${NC}"
    kubectl get pods -n ns-cxxiwxce -l app=xiaodiyanxuan-api 2>/dev/null || {
        echo -e "${RED}❌ 无法连接到 Kubernetes${NC}"
    }
    echo ""
    
    echo -e "${YELLOW}📦 当前镜像版本：${NC}"
    kubectl get deployment xiaodiyanxuan-api -n ns-cxxiwxce -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || {
        echo -e "${RED}❌ 无法获取镜像信息${NC}"
    }
    echo ""
    echo ""
fi

# 测试接口
echo -e "${YELLOW}🧪 测试后端接口：${NC}"
echo ""

echo -e "1️⃣  测试 ${BLUE}/api/categories/stats${NC}..."
response=$(curl -s -o /dev/null -w "%{http_code}" https://lgpzubdtdxjf.sealoshzh.site/api/categories/stats)
if [ "$response" = "200" ]; then
    echo -e "   ${GREEN}✅ 返回 200 - 接口正常${NC}"
    curl -s https://lgpzubdtdxjf.sealoshzh.site/api/categories/stats | python3 -m json.tool | head -20
else
    echo -e "   ${RED}❌ 返回 $response - 接口异常${NC}"
fi
echo ""

echo -e "2️⃣  测试 ${BLUE}/api/products${NC}..."
response=$(curl -s -o /dev/null -w "%{http_code}" https://lgpzubdtdxjf.sealoshzh.site/api/products)
if [ "$response" = "200" ]; then
    echo -e "   ${GREEN}✅ 返回 200 - 接口正常${NC}"
else
    echo -e "   ${RED}❌ 返回 $response - 接口异常${NC}"
fi
echo ""

echo -e "3️⃣  测试 ${BLUE}/health${NC}..."
response=$(curl -s -o /dev/null -w "%{http_code}" https://lgpzubdtdxjf.sealoshzh.site/health)
if [ "$response" = "200" ]; then
    echo -e "   ${GREEN}✅ 返回 200 - 后端健康${NC}"
else
    echo -e "   ${RED}❌ 返回 $response - 后端异常${NC}"
fi
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}检查完成！${NC}"
echo ""
echo "💡 提示："
echo "  - 如果接口还是报错，等待 2-3 分钟后再次运行此脚本"
echo "  - 查看详细日志：bash check-deployment.sh"
echo "  - 查看 Pod 日志："
echo "    kubectl logs -f deployment/xiaodiyanxuan-api -n ns-cxxiwxce"
