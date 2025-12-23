#!/bin/bash
# 自动部署脚本 - 提交代码并推送到GitHub，触发自动构建和部署

set -e

COMMIT_MSG="${1:-feat: update features}"

echo "🚀 开始自动部署流程..."
echo ""

# 1. 检查是否有更改
if [[ -z $(git status -s) ]]; then
    echo "⚠️  没有检测到代码更改"
    exit 0
fi

# 2. 显示更改
echo "📝 检测到以下更改:"
git status -s
echo ""

# 3. 提交并推送
echo "📤 提交并推送到GitHub..."
git add .
git commit -m "$COMMIT_MSG"
git push origin test

echo ""
echo "✅ 代码已推送到GitHub！"
echo ""
echo "⏳ GitHub Actions正在构建Docker镜像..."
echo "   监控地址: https://github.com/379005109-lab/xiaodiyanxuan-fullstack/actions"
echo ""
echo "   预计完成时间: 5-10分钟"
echo ""
echo "📝 构建完成后，运行以下命令重启服务:"
echo ""
echo "   export KUBECONFIG=\"/home/devbox/project/kubeconfig (7).yaml\""
echo "   kubectl rollout restart deployment/xiaodiyanxuan-frontend -n ns-cxxiwxce"
echo "   kubectl rollout restart deployment/xiaodiyanxuan-api -n ns-cxxiwxce"
echo ""
