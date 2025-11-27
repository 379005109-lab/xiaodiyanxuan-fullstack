#!/bin/bash

echo "====================================================================="
echo "🚀 立即部署（不等待GitHub Actions）"
echo "====================================================================="
echo ""
echo "说明：直接删除Pod强制拉取最新代码镜像"
echo ""

KUBECONFIG_FILE="kubeconfig (7).yaml"

echo "🔄 步骤1: 删除后端Pod"
kubectl delete pod -l app=xiaodiyanxuan-api -n ns-cxxiwxce --kubeconfig="$KUBECONFIG_FILE"

if [ $? -eq 0 ]; then
    echo "✅ 后端Pod已删除"
else
    echo "❌ 删除后端Pod失败"
    exit 1
fi

echo ""
echo "🔄 步骤2: 删除前端Pod"
kubectl delete pod -l app=xiaodiyanxuan-frontend -n ns-cxxiwxce --kubeconfig="$KUBECONFIG_FILE"

if [ $? -eq 0 ]; then
    echo "✅ 前端Pod已删除"
else
    echo "❌ 删除前端Pod失败"
    exit 1
fi

echo ""
echo "⏳ 等待40秒让新Pod启动并拉取镜像..."
sleep 40

echo ""
echo "📊 步骤3: 检查Pod状态"
kubectl get pods -n ns-cxxiwxce --kubeconfig="$KUBECONFIG_FILE" 2>/dev/null | grep xiaodiyanxuan

echo ""
echo "🔍 步骤4: 检查镜像SHA（验证是否更新）"
echo ""
echo "后端镜像ID:"
kubectl describe pod -l app=xiaodiyanxuan-api -n ns-cxxiwxce --kubeconfig="$KUBECONFIG_FILE" 2>/dev/null | grep "Image ID" | head -1

echo ""
echo "前端镜像ID:"
kubectl describe pod -l app=xiaodiyanxuan-frontend -n ns-cxxiwxce --kubeconfig="$KUBECONFIG_FILE" 2>/dev/null | grep "Image ID" | head -1

echo ""
echo "🛠️ 步骤5: 修复收藏功能的MongoDB索引"
echo ""
read -p "是否运行索引修复脚本？这将允许收藏多个商品 (y/n): " fix_index

if [ "$fix_index" = "y" ]; then
    echo ""
    echo "获取后端Pod名称..."
    POD=$(kubectl get pods -n ns-cxxiwxce --kubeconfig="$KUBECONFIG_FILE" 2>/dev/null | grep xiaodiyanxuan-api | grep Running | awk '{print $1}' | head -1)
    
    if [ -z "$POD" ]; then
        echo "❌ 未找到运行中的后端Pod"
        echo "请等待Pod完全启动后手动运行："
        echo "kubectl exec -it <pod-name> -n ns-cxxiwxce --kubeconfig='kubeconfig (7).yaml' -- node scripts/fix-favorite-index.js"
    else
        echo "在Pod $POD 中运行索引修复..."
        kubectl exec -it $POD -n ns-cxxiwxce --kubeconfig="$KUBECONFIG_FILE" -- node scripts/fix-favorite-index.js
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ 索引修复成功！现在可以收藏多个商品了"
        else
            echo ""
            echo "❌ 索引修复失败，请检查错误信息"
        fi
    fi
else
    echo "⏭️  跳过索引修复"
    echo ""
    echo "注意：如果收藏功能仍然只能收藏一个商品，稍后运行："
    POD_EXAMPLE=$(kubectl get pods -n ns-cxxiwxce --kubeconfig="$KUBECONFIG_FILE" 2>/dev/null | grep xiaodiyanxuan-api | awk '{print $1}' | head -1)
    echo "kubectl exec -it $POD_EXAMPLE -n ns-cxxiwxce --kubeconfig='kubeconfig (7).yaml' -- node scripts/fix-favorite-index.js"
fi

echo ""
echo "====================================================================="
echo "✅ 部署完成！"
echo "====================================================================="
echo ""
echo "📋 现在请测试所有功能："
echo ""
echo "1️⃣ 收藏功能"
echo "   - 尝试收藏多个不同商品"
echo "   - 应该不再报400错误"
echo "   - 注意：如果仍然失败，请运行上面的索引修复命令"
echo ""
echo "2️⃣ 按钮布局"
echo "   - 访问任意商品详情页"
echo "   - 查看按钮排列："
echo "     第一行: [加入购物车] [加入对比]"
echo "     第二行: [立即购买]"
echo ""
echo "3️⃣ 对比数字位置"
echo "   - 添加商品到对比"
echo "   - 对比数字应该只在网页右上角Header的对比图标显示"
echo "   - 商品详情页的'加入对比'按钮上不应该有数字"
echo ""
echo "4️⃣ 购物车结算栏"
echo "   - 添加多个商品到购物车"
echo "   - 删除其中部分商品"
echo "   - 底部结算栏应该保持显示"
echo ""
echo "5️⃣ 规格材质信息"
echo "   - 打开购物车页面"
echo "   - 打开我的订单页面"
echo "   - 应该能看到每个商品的："
echo "     • 规格"
echo "     • 面料 (+加价)"
echo "     • 填充 (+加价)"
echo "     • 框架 (+加价)"
echo "     • 脚架 (+加价)"
echo ""
echo "====================================================================="
echo ""
echo "❓ 如果仍有问题，请告诉我："
echo "   - 具体哪个功能还有问题？"
echo "   - 浏览器Console的错误信息（F12 -> Console）"
echo "   - Network请求的失败详情（F12 -> Network）"
echo ""
echo "我会继续修复！"
echo "====================================================================="
