#!/bin/bash
# 最终完整部署脚本

set -e

echo "🚀 开始完整部署..."
echo ""

# 1. 提交所有修改
echo "[1/3] 提交代码..."
cd /home/devbox/project
git add -A
git commit -m "fix: 完整修复后端三个接口

✅ /api/categories/stats - 添加 totalProducts 和 withDiscount
✅ /api/products - 添加 bulkImport 功能  
✅ /api/files - 添加 sendResponse/sendError 工具函数
✅ 修复中间件导入问题" || echo "没有新变更"

# 2. 推送到 GitHub
echo ""
echo "[2/3] 推送到 GitHub..."
git push origin main

# 3. 等待并测试
echo ""
echo "[3/3] 等待 GitHub Actions 构建（10分钟）..."
echo ""
echo "⏱️  时间线："
NOW=$(date +"%H:%M")
T10=$(date -d "+10 minutes" +"%H:%M")
echo "   $NOW - 代码已推送 ✅"
echo "   $T10 - 预计部署完成"
echo ""
echo "🔗 查看构建进度："
echo "   https://github.com/379005109-lab/xiaodiyanxuan-fullstack/actions"
echo ""

# 倒计时
for i in {600..1}; do
    mins=$((i / 60))
    secs=$((i % 60))
    printf "\r⏱️  剩余时间: %02d:%02d  " $mins $secs
    sleep 1
done

echo ""
echo ""
echo "✅ 时间到！测试接口..."
echo ""

# 测试接口
bash check-deployment.sh

echo ""
echo "🎉 部署完成！"
