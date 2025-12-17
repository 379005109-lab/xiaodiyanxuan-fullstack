#!/bin/bash

# 本地开发环境启动脚本
# Local development environment startup script

echo "🚀 启动本地开发环境..."
echo "🚀 Starting local development environment..."
echo ""

# 检查参数
MODE=${1:-frontend}

if [ "$MODE" = "frontend" ] || [ "$MODE" = "all" ]; then
    echo "📦 启动前端开发服务器..."
    echo "📦 Starting frontend dev server..."
    cd /home/devbox/project/1114/client/frontend
    
    # 检查依赖
    if [ ! -d "node_modules" ]; then
        echo "📥 安装前端依赖..."
        npm install
    fi
    
    echo ""
    echo "✅ 前端开发服务器启动中..."
    echo "✅ Frontend dev server starting..."
    echo ""
    echo "📍 访问地址: http://localhost:3000"
    echo "📍 Access at: http://localhost:3000"
    echo ""
    echo "💡 提示: 修改代码后会自动刷新浏览器"
    echo "💡 Tip: Browser will auto-refresh on code changes"
    echo ""
    echo "🛑 按 Ctrl+C 停止服务器"
    echo "🛑 Press Ctrl+C to stop server"
    echo ""
    
    npm run dev
fi

if [ "$MODE" = "backend" ]; then
    echo "📦 启动后端开发服务器..."
    echo "📦 Starting backend dev server..."
    cd /home/devbox/project/1114/client/backend
    
    # 检查依赖
    if [ ! -d "node_modules" ]; then
        echo "📥 安装后端依赖..."
        npm install
    fi
    
    echo ""
    echo "✅ 后端开发服务器启动中..."
    echo "✅ Backend dev server starting..."
    echo ""
    echo "📍 访问地址: http://localhost:8080"
    echo "📍 Access at: http://localhost:8080"
    echo ""
    echo "💡 提示: 修改代码后会自动重启"
    echo "💡 Tip: Server will auto-restart on code changes"
    echo ""
    
    npm run dev
fi
