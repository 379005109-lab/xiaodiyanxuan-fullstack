#!/bin/bash
# 一键更新小程序代码到远程仓库

cd /home/devbox/project

echo "=========================================="
echo "       小程序代码更新工具"
echo "=========================================="
echo ""

# 检查是否有变更
if git diff --quiet && git diff --cached --quiet; then
    echo "✓ 没有检测到代码变更"
    echo ""
    read -p "按回车键退出..."
    exit 0
fi

# 显示变更文件
echo "📝 检测到以下文件变更:"
echo ""
git status --short
echo ""

# 自动生成提交信息
TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
MSG="update: 小程序更新 $TIMESTAMP"

# 提交并推送
echo "🚀 正在提交代码..."
git add -A
git commit -m "$MSG"

echo ""
echo "📤 正在推送到远程仓库..."
git push origin main

echo ""
echo "=========================================="
echo "✅ 代码已成功推送!"
echo "=========================================="
echo ""
echo "下一步: 在微信开发者工具中执行 git pull 拉取最新代码"
echo ""
read -p "按回车键退出..."
