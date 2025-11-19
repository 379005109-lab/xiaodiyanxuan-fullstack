#!/bin/bash

# 小地燕选后端服务启动脚本
# 用于自动启动 PM2 和应用程序

echo "🚀 启动小地燕选后端服务..."

# 检查 PM2 是否已安装
if ! command -v pm2 &> /dev/null; then
    echo "📦 PM2 未安装，正在安装..."
    npm install -g pm2
fi

# 进入项目目录
cd /home/devbox/project/backend

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 创建日志目录
mkdir -p logs

# 启动 PM2 应用
echo "⚙️  启动 PM2 应用..."
pm2 start ecosystem.config.js

# 显示状态
echo ""
echo "✅ 后端服务已启动"
echo ""
pm2 status

# 显示日志
echo ""
echo "📝 应用日志:"
pm2 logs xiaodiyanxuan-api --lines 10

echo ""
echo "🎉 后端服务启动完成！"
echo "📍 服务地址: http://localhost:8080"
echo "🔗 健康检查: http://localhost:8080/health"
