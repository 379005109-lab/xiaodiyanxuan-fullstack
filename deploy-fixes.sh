#!/bin/bash

echo "====================================================================="
echo "🚀 部署Bug修复 - 强制更新Kubernetes Pod"
echo "====================================================================="
echo ""

KUBECONFIG_FILE="kubeconfig (7).yaml"

echo "⏰ 步骤1: 等待GitHub Actions完成构建..."
echo "请访问: https://github.com/379005109-lab/xiaodiyanxuan-fullstack/actions"
echo "确认两个workflow都显示绿色✅后，按Enter继续..."
read

echo ""
echo "🔄 步骤2: 删除旧的后端Pod，强制拉取新镜像..."
kubectl delete pod -l app=xiaodiyanxuan-api -n ns-cxxiwxce --kubeconfig="$KUBECONFIG_FILE"

echo ""
echo "⏳ 等待后端Pod重启..."
sleep 5

echo ""
echo "🔄 步骤3: 删除旧的前端Pod，强制拉取新镜像..."
kubectl delete pod -l app=xiaodiyanxuan-frontend -n ns-cxxiwxce --kubeconfig="$KUBECONFIG_FILE"

echo ""
echo "⏳ 等待所有Pod就绪..."
sleep 10

echo ""
echo "📊 当前Pod状态:"
kubectl get pods -n ns-cxxiwxce --kubeconfig="$KUBECONFIG_FILE" | grep xiaodiyanxuan

echo ""
echo "⏳ 等待30秒让服务完全启动..."
sleep 30

echo ""
echo "====================================================================="
echo "✅ 部署完成！"
echo "====================================================================="
echo ""
echo "📋 下一步:"
echo "1. 打开测试工具: https://lgpzubdtdxjf.sealoshzh.site/quick-test.html"
echo "2. 先登录主站"
echo "3. 点击'从LocalStorage获取Token'"
echo "4. 点击'🚀 测试所有问题'"
echo "5. 查看测试结果"
echo ""
echo "如果问题仍存在，请查看:"
echo "- 后端日志: kubectl logs -f deployment/xiaodiyanxuan-api -n ns-cxxiwxce --kubeconfig='$KUBECONFIG_FILE'"
echo "- 前端日志: kubectl logs -f deployment/xiaodiyanxuan-frontend -n ns-cxxiwxce --kubeconfig='$KUBECONFIG_FILE'"
echo ""
echo "详细报告: 查看 BUGS_FIX_REPORT.md"
echo "====================================================================="
