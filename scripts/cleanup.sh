#!/bin/bash
# 清理脚本 - 删除多余的文件和优化项目

echo "🧹 开始清理项目..."

# 1. 清理前端
echo "📦 清理前端 node_modules..."
cd /home/devbox/project/frontend
rm -rf node_modules package-lock.json
npm install

# 2. 清理后端
echo "📦 清理后端 node_modules..."
cd /home/devbox/project/backend
rm -rf node_modules package-lock.json
npm install

# 3. 清理构建文件
echo "🗑️  清理构建文件..."
cd /home/devbox/project/frontend
rm -rf dist

# 4. 清理临时文件
echo "🗑️  清理临时文件..."
find /home/devbox/project -name "*.backup" -type f -delete
find /home/devbox/project -name "*.bak" -type f -delete
find /home/devbox/project -name "*.old" -type f -delete
find /home/devbox/project -name ".DS_Store" -type f -delete

# 5. Git清理
echo "🗑️  清理Git..."
cd /home/devbox/project
git gc --aggressive --prune=now

echo "✅ 清理完成！"
echo ""
echo "📊 统计信息："
echo "前端大小: $(du -sh /home/devbox/project/frontend | cut -f1)"
echo "后端大小: $(du -sh /home/devbox/project/backend | cut -f1)"
echo "Git大小: $(du -sh /home/devbox/project/.git | cut -f1)"
