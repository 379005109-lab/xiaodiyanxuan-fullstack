#!/bin/bash

echo "====================================================================="
echo "🤖 自动部署脚本 - 等待GitHub Actions完成后自动部署"
echo "====================================================================="
echo ""

GITHUB_REPO="379005109-lab/xiaodiyanxuan-fullstack"
KUBECONFIG_FILE="kubeconfig (7).yaml"
MAX_WAIT_MINUTES=30

echo "📊 当前状态:"
echo "  - 仓库: $GITHUB_REPO"
echo "  - 最大等待时间: $MAX_WAIT_MINUTES 分钟"
echo "  - 当前时间: $(date '+%H:%M')"
echo ""

# 函数：检查GitHub Actions状态（简化版 - 通过API）
check_github_actions() {
    echo "🔍 检查GitHub Actions状态..."
    echo "   请手动访问: https://github.com/$GITHUB_REPO/actions"
    echo "   确认两个workflows都是绿色✅后，输入 'yes' 继续"
    echo ""
    read -p "GitHub Actions完成了吗? (yes/no): " response
    
    if [ "$response" = "yes" ] || [ "$response" = "y" ]; then
        return 0
    else
        return 1
    fi
}

echo "⏰ 等待您确认GitHub Actions完成..."
echo ""

while true; do
    if check_github_actions; then
        echo ""
        echo "✅ 开始部署新版本..."
        break
    else
        echo "⏳ 继续等待..."
        sleep 60
    fi
done

echo ""
echo "🔄 步骤1: 删除后端Pod..."
kubectl delete pod -l app=xiaodiyanxuan-api -n ns-cxxiwxce --kubeconfig="$KUBECONFIG_FILE"

if [ $? -ne 0 ]; then
    echo "❌ 删除后端Pod失败"
    exit 1
fi

echo ""
echo "⏳ 等待5秒..."
sleep 5

echo ""
echo "🔄 步骤2: 删除前端Pod..."
kubectl delete pod -l app=xiaodiyanxuan-frontend -n ns-cxxiwxce --kubeconfig="$KUBECONFIG_FILE"

if [ $? -ne 0 ]; then
    echo "❌ 删除前端Pod失败"
    exit 1
fi

echo ""
echo "⏳ 等待30秒让新Pod启动..."
sleep 30

echo ""
echo "📊 当前Pod状态:"
kubectl get pods -n ns-cxxiwxce --kubeconfig="$KUBECONFIG_FILE" | grep xiaodiyanxuan

echo ""
echo "🔍 检查后端Pod镜像..."
kubectl describe pod -l app=xiaodiyanxuan-api -n ns-cxxiwxce --kubeconfig="$KUBECONFIG_FILE" | grep "Image ID" | head -1

echo ""
echo "🔍 检查后端日志（查找新代码标记）..."
kubectl logs deployment/xiaodiyanxuan-api -n ns-cxxiwxce --kubeconfig="$KUBECONFIG_FILE" --tail=20 | grep -E "Compare|Favorite|======" || echo "未找到新代码日志标记"

echo ""
echo "====================================================================="
echo "✅ 部署完成！"
echo "====================================================================="
echo ""
echo "📋 下一步验证:"
echo ""
echo "1. 打开测试工具:"
echo "   https://lgpzubdtdxjf.sealoshzh.site/quick-test.html"
echo ""
echo "2. 登录主站获取token"
echo ""
echo "3. 点击 '🚀 测试所有问题'"
echo ""
echo "4. 查看结果:"
echo "   - ✅ 绿色 = 成功"
echo "   - ⚠️ 橙色 = 正常警告"  
echo "   - ❌ 红色 = 仍有问题"
echo ""
echo "5. 手动测试:"
echo "   - 对比功能: 添加商品后访问 /compare"
echo "   - 收藏功能: 收藏和取消收藏多个商品"
echo "   - 订单页面: 查看商品规格和材质信息"
echo "   - 购物车: 清除缓存后查看结算按钮"
echo ""
echo "====================================================================="
echo ""
echo "如果仍有问题，请提供:"
echo "  - 测试工具的截图"
echo "  - 浏览器Console的错误信息"
echo "  - Network标签的失败请求详情"
echo ""
echo "我会立即进一步修复！"
echo "====================================================================="
