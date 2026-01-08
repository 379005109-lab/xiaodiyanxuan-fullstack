#!/bin/bash

echo "👁️  监控文件变化，自动部署..."
echo "📁 监控目录: $(pwd)"
echo "🔄 按 Ctrl+C 停止"
echo ""

# 记录上次修改时间
LAST_HASH=""

while true; do
    # 计算源文件的 hash
    CURRENT_HASH=$(find . -name "*.tsx" -o -name "*.ts" -o -name "*.html" -o -name "*.css" | xargs cat 2>/dev/null | md5sum | cut -d' ' -f1)
    
    if [ "$CURRENT_HASH" != "$LAST_HASH" ] && [ -n "$LAST_HASH" ]; then
        echo ""
        echo "🔔 检测到文件变化，开始自动部署..."
        echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
        echo ""
        ./auto-deploy.sh "auto: file change detected"
        echo ""
        echo "👁️  继续监控文件变化..."
    fi
    
    LAST_HASH="$CURRENT_HASH"
    sleep 3
done
