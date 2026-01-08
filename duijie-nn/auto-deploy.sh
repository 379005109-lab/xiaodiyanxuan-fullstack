#!/bin/bash
set -e

echo "🚀 自动部署 duijie-nn 到 Sealos..."
echo ""

# 设置 kubeconfig
export KUBECONFIG="/home/devbox/project/kubeconfig (7).yaml"

# 1. 构建项目
echo "📦 Step 1: 构建项目..."
npm run build

# 2. 提交代码到 Git
echo "📝 Step 2: 提交代码到 Git..."
git add .
git commit -m "${1:-feat: update}" 2>/dev/null || echo "No changes to commit"
git push origin main 2>/dev/null || echo "Push skipped"

# 3. 获取 Pod 名称
echo "🔍 Step 3: 获取运行中的 Pod..."
POD_NAME=$(kubectl get pods -n ns-cxxiwxce -l app=duijie-nn --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

if [ -z "$POD_NAME" ]; then
    echo "❌ 没有运行中的 Pod，正在创建部署..."
    kubectl apply -f k8s-deploy.yaml
    echo "⏳ 等待 Pod 启动..."
    sleep 15
    POD_NAME=$(kubectl get pods -n ns-cxxiwxce -l app=duijie-nn --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}')
fi

echo "✅ 找到 Pod: $POD_NAME"

# 4. 复制构建文件到 Pod
echo "📤 Step 4: 复制文件到 Pod..."
kubectl cp dist/. ns-cxxiwxce/$POD_NAME:/usr/share/nginx/html/

# 5. 验证部署
echo ""
echo "════════════════════════════════════════════"
echo "✅ 部署完成!"
echo "════════════════════════════════════════════"
echo ""
echo "🌐 网站地址: https://duijie-nn-cxxiwxce.sealoshzh.site"
echo ""
echo "📊 Pod 状态:"
kubectl get pods -n ns-cxxiwxce -l app=duijie-nn
echo ""
echo "🧪 测试命令: curl -k https://duijie-nn-cxxiwxce.sealoshzh.site/"
