#\!/bin/bash
# 快速检查后端状态

echo "🔍 检查..."
echo ""

# 1. 检查 Pod
echo "📦 Pod 状态："
export KUBECONFIG="/home/devbox/project/kubeconfig (7).yaml"
kubectl get pods -n ns-cxxiwxce -l app=xiaodiyanxuan-api 2>/dev/null || echo "无法连接到"
echo ""

# 2. 测试接口
echo "🧪 测试接口："
echo ""

echo "1. /health:"
curl -s https://lgpzubdtdxjf.sealoshzh.site/health | python3 -m json.tool 2>/dev/null || echo "❌ 失败"
echo ""

echo "2. /api/categories/stats:"
response=$(curl -s -w "\n%{http_code}" https://lgpzubdtdxjf.sealoshzh.site/api/categories/stats)
code=$(echo "$response" | tail -1)
body=$(echo "$response" | head -n -1)

if [ "$code" = "200" ]; then
    echo "✅ 返回 200"
    echo "$body" | python3 -m json.tool 2>/dev/null | head -15
else
    echo "❌ 返回 $code"
fi
echo ""

echo "3. /api/products:"
code=$(curl -s -o /dev/null -w "%{http_code}" https://lgpzubdtdxjf.sealoshzh.site/api/products)
if [ "$code" = "200" ]; then
    echo "✅ 返回 $code"
else
    echo "❌ 返回 $code"
fi
echo ""

echo "完成！"
