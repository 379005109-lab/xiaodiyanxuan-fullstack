#!/bin/bash

# Nginx 启动脚本

set -e

# 默认值 - 使用内部 Kubernetes Service
BACKEND_URL=${BACKEND_URL:-"http://xiaodiyanxuan-api:80"}

echo "🔧 配置 Nginx..."
echo "   后端地址: $BACKEND_URL"

# 替换 nginx.conf 中的环境变量
sed -i "s|http://xiaodiyanxuan-api:80|$BACKEND_URL|g" /etc/nginx/conf.d/default.conf

echo "✅ Nginx 配置完成"
echo "✅ 前端应用已启动"

# 启动 Nginx
exec nginx -g "daemon off;"
