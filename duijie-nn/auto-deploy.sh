#!/bin/bash
set -e

echo "🚀 自动部署 duijie-nn..."

# 设置 kubeconfig
export KUBECONFIG="/home/devbox/project/kubeconfig (7).yaml"

# 项目路径
PROJECT_PATH="/home/devbox/project/1114/client"
DUIJIE_PATH="/home/devbox/project/duijie/nn"

# 1. 构建
echo ""
echo "📦 Step 1: 构建项目..."
cd $DUIJIE_PATH
npm run build

# 2. 同步到主仓库
echo ""
echo "📝 Step 2: 同步到 xiaodiyanxuan-fullstack..."
cp -r $DUIJIE_PATH/components $PROJECT_PATH/duijie-nn/
cp -r $DUIJIE_PATH/*.tsx $DUIJIE_PATH/*.ts $DUIJIE_PATH/*.json $PROJECT_PATH/duijie-nn/ 2>/dev/null || true

# 3. 提交代码
echo ""
echo "📝 Step 3: 提交代码到 Git..."
cd $PROJECT_PATH
git add duijie-nn/
if git diff --staged --quiet; then
  echo "No changes to commit"
else
  git commit -m "${1:-feat: update duijie-nn}"
  git push origin main
  echo ""
  echo "⏳ 等待 GitHub Actions 构建..."
  echo "   监控地址: https://github.com/379005109-lab/xiaodiyanxuan-fullstack/actions"
  echo "   请等待构建完成后按 Enter 继续..."
  read -p ""
fi

# 4. 重启 Kubernetes 服务
echo ""
echo "🔄 Step 4: 重启 Kubernetes 服务..."
kubectl rollout restart deployment/duijie-nn -n ns-cxxiwxce 2>/dev/null || {
  echo "Deployment 不存在，正在创建..."
  kubectl apply -f $DUIJIE_PATH/k8s-deploy.yaml
}

# 5. 等待部署完成
echo ""
echo "⏳ Step 5: 等待部署完成..."
kubectl rollout status deployment/duijie-nn -n ns-cxxiwxce --timeout=120s

echo ""
echo "═══════════════════════════════════════════"
echo "✅ 部署完成!"
echo "═══════════════════════════════════════════"
echo ""
echo "🌐 网站地址: https://duijie.xiaodiyanxuan.com"
echo "📊 Pod 状态:"
kubectl get pods -n ns-cxxiwxce -l app=duijie-nn
echo ""
echo "🧪 测试命令: curl -k https://duijie.xiaodiyanxuan.com/"
