#!/bin/bash

echo "====================================================================="
echo "🚀 立即部署新版本"
echo "====================================================================="
echo ""

KUBECONFIG_FILE="kubeconfig (7).yaml"

echo "步骤1: 检查GitHub Actions状态"
echo "请访问: https://github.com/379005109-lab/xiaodiyanxuan-fullstack/actions"
echo ""
read -p "GitHub Actions是否已完成? (y/n): " ready

if [ "$ready" != "y" ]; then
    echo "⏳ 请等待GitHub Actions完成后再运行此脚本"
    exit 0
fi

echo ""
echo "步骤2: 删除后端Pod（强制拉取新镜像）"
kubectl delete pod -l app=xiaodiyanxuan-api -n ns-cxxiwxce --kubeconfig="$KUBECONFIG_FILE"

echo ""
echo "步骤3: 删除前端Pod（强制拉取新镜像）"
kubectl delete pod -l app=xiaodiyanxuan-frontend -n ns-cxxiwxce --kubeconfig="$KUBECONFIG_FILE"

echo ""
echo "⏳ 等待35秒让Pod重启..."
sleep 35

echo ""
echo "步骤4: 检查Pod状态"
kubectl get pods -n ns-cxxiwxce --kubeconfig="$KUBECONFIG_FILE" | grep xiaodiyanxuan

echo ""
echo "步骤5: 检查镜像是否已更新"
echo "后端镜像:"
kubectl describe pod -l app=xiaodiyanxuan-api -n ns-cxxiwxce --kubeconfig="$KUBECONFIG_FILE" | grep "Image ID" | head -1

echo ""
echo "前端镜像:"
kubectl describe pod -l app=xiaodiyanxuan-frontend -n ns-cxxiwxce --kubeconfig="$KUBECONFIG_FILE" | grep "Image ID" | head -1

echo ""
echo "步骤6: 运行MongoDB索引修复脚本"
echo ""
read -p "是否需要运行索引修复脚本（修复收藏功能）? (y/n): " run_script

if [ "$run_script" = "y" ]; then
    POD=$(kubectl get pods -n ns-cxxiwxce --kubeconfig="$KUBECONFIG_FILE" | grep xiaodiyanxuan-api | awk '{print $1}' | head -1)
    echo "在Pod $POD 中运行索引修复脚本..."
    kubectl exec -it $POD -n ns-cxxiwxce --kubeconfig="$KUBECONFIG_FILE" -- node scripts/fix-favorite-index.js
fi

echo ""
echo "====================================================================="
echo "✅ 部署完成！"
echo "====================================================================="
echo ""
echo "📋 现在请测试所有功能:"
echo ""
echo "1. 收藏功能"
echo "   - 收藏多个商品"
echo "   - 应该不再报400错误"
echo ""
echo "2. 按钮布局"
echo "   - 访问商品详情页"
echo "   - 布局: [加入购物车|加入对比] [立即购买]"
echo ""
echo "3. 对比数字"
echo "   - 添加商品到对比"
echo "   - 数字只在Header右上角显示"
echo ""
echo "4. 购物车结算栏"
echo "   - 添加多个商品"
echo "   - 删除部分商品"
echo "   - 结算栏应该保持显示"
echo ""
echo "5. 规格材质信息"
echo "   - 查看购物车"
echo "   - 查看我的订单"
echo "   - 应该能看到规格、面料、填充、框架、脚架及加价"
echo ""
echo "====================================================================="
echo ""
echo "如果仍有问题，请查看 FIXES_SUMMARY.md 了解详情"
echo ""
