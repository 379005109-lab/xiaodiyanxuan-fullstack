#!/bin/bash

# 前端白屏修复 - 快速部署脚本
# Quick deployment script for frontend whitepage fix

set -e  # Exit on error

echo "🚀 开始部署前端修复..."
echo "🚀 Starting frontend fix deployment..."
echo ""

# 1. 构建前端
echo "📦 步骤 1/5: 构建前端..."
echo "📦 Step 1/5: Building frontend..."
cd /home/devbox/project/1114/client/frontend
rm -rf dist
npm run build

# 检查构建结果
if [ ! -d "dist" ]; then
  echo "❌ 构建失败：dist目录不存在"
  echo "❌ Build failed: dist directory not found"
  exit 1
fi

NEW_JS_FILE=$(ls dist/assets/index-*.js 2>/dev/null | head -1 | xargs basename)
echo "✅ 构建成功！新文件: $NEW_JS_FILE"
echo "✅ Build successful! New file: $NEW_JS_FILE"
echo ""

# 2. 打包
echo "📦 步骤 2/5: 打包文件..."
echo "📦 Step 2/5: Packaging files..."
cd dist
tar czf /tmp/frontend-fixed.tar.gz *
echo "✅ 打包完成"
echo "✅ Packaging complete"
echo ""

# 3. 更新ConfigMap
echo "🔧 步骤 3/5: 更新ConfigMap..."
echo "🔧 Step 3/5: Updating ConfigMap..."
export KUBECONFIG="/home/devbox/project/kubeconfig (7).yaml"

kubectl delete configmap xiaodiyanxuan-frontend-html -n ns-cxxiwxce 2>/dev/null || true
kubectl create configmap xiaodiyanxuan-frontend-html \
  --from-file=frontend-dist.tar.gz=/tmp/frontend-fixed.tar.gz \
  -n ns-cxxiwxce

echo "✅ ConfigMap已更新"
echo "✅ ConfigMap updated"
echo ""

# 4. 重启Pod
echo "🔄 步骤 4/5: 重启Pod..."
echo "🔄 Step 4/5: Restarting pods..."
kubectl delete pods -n ns-cxxiwxce -l app=xiaodiyanxuan-frontend
echo "✅ Pod重启中..."
echo "✅ Pods restarting..."
echo ""

# 5. 等待并验证
echo "⏳ 步骤 5/5: 等待Pod就绪..."
echo "⏳ Step 5/5: Waiting for pods..."
sleep 50

echo "🔍 验证部署..."
echo "🔍 Verifying deployment..."
DEPLOYED_FILE=$(curl -s http://lgpzubdtdxjf.sealoshzh.site/ | grep -o 'index-[^.]*\.js' | head -1)

echo ""
echo "======================================"
echo "📊 部署结果 | Deployment Result"
echo "======================================"
echo "本地构建: $NEW_JS_FILE"
echo "Local build: $NEW_JS_FILE"
echo "线上文件: $DEPLOYED_FILE"
echo "Online file: $DEPLOYED_FILE"
echo ""

if [ "$NEW_JS_FILE" = "$DEPLOYED_FILE" ]; then
  echo "✅ 部署成功！"
  echo "✅ Deployment successful!"
  echo ""
  echo "🎉 请在无痕模式下测试："
  echo "🎉 Please test in incognito mode:"
  echo "   http://lgpzubdtdxjf.sealoshzh.site/"
else
  echo "⚠️ 文件名不匹配，可能需要等待更长时间"
  echo "⚠️ File names don't match, may need to wait longer"
  echo ""
  echo "💡 建议："
  echo "💡 Suggestion:"
  echo "   1. 等待1-2分钟"
  echo "   1. Wait 1-2 minutes"
  echo "   2. 无痕模式下按 Ctrl+Shift+R 强制刷新"
  echo "   2. Force refresh with Ctrl+Shift+R in incognito mode"
fi

echo ""
echo "======================================"
echo ""

# 清理
rm -f /tmp/frontend-fixed.tar.gz

echo "✅ 部署流程完成！"
echo "✅ Deployment process complete!"
