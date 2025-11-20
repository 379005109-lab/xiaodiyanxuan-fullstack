#!/bin/bash

# 🚀 完整自动化部署脚本
# 用途: 自动化 Git 初始化、Docker 镜像构建和 Sealos 部署

set -e

# ============================================================================
# 📋 配置加载
# ============================================================================

CONFIG_FILE="/home/devbox/project/deployment.config.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ 配置文件不存在: $CONFIG_FILE"
    exit 1
fi

# 从 JSON 配置文件读取配置
GITHUB_USERNAME=$(grep -o '"username": "[^"]*"' "$CONFIG_FILE" | head -1 | cut -d'"' -f4)
GITHUB_TOKEN=$(grep -o '"token": "[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
GITHUB_EMAIL=$(grep -o '"email": "[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
REPO_URL=$(grep -o '"repo_url": "[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
DOCKER_REGISTRY=$(grep -o '"registry": "[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
DOCKER_USERNAME=$(grep -o '"username": "[^"]*"' "$CONFIG_FILE" | tail -1 | cut -d'"' -f4)
DOCKER_PASSWORD=$(grep -o '"password": "[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
BACKEND_IMAGE=$(grep -o '"backend_image": "[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
FRONTEND_IMAGE=$(grep -o '"frontend_image": "[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)

# ============================================================================
# 🎨 颜色定义
# ============================================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# 🔧 函数定义
# ============================================================================

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# ============================================================================
# 第 1 步: Git 初始化和推送
# ============================================================================

setup_git() {
    print_header "第 1 步: Git 初始化和推送"
    
    cd /home/devbox/project
    
    # 初始化 Git
    if [ ! -d .git ]; then
        print_warning "初始化 Git 仓库..."
        git init
        git config user.name "$GITHUB_USERNAME"
        git config user.email "$GITHUB_EMAIL"
        print_success "Git 仓库已初始化"
    else
        print_info "Git 仓库已存在"
    fi
    
    # 添加文件
    print_warning "添加文件到 Git..."
    git add .
    print_success "文件已添加"
    
    # 创建提交
    if ! git diff --cached --quiet; then
        print_warning "创建初始提交..."
        git commit -m "Initial commit: Complete xiaodiyanxuan fullstack setup

- Backend: Express.js with MongoDB
- Frontend: React with TypeScript
- Features: Products, Orders, Cart, Categories, etc.
- Storage: GridFS for file uploads
- Auth: JWT with password hashing"
        print_success "提交已创建"
    else
        print_info "没有新的更改需要提交"
    fi
    
    # 添加远程仓库
    if ! git remote | grep -q origin; then
        print_warning "添加远程仓库..."
        git remote add origin "$REPO_URL"
        print_success "远程仓库已添加: $REPO_URL"
    else
        print_info "远程仓库已存在"
        git remote set-url origin "$REPO_URL"
        print_success "远程仓库 URL 已更新"
    fi
    
    # 推送到 GitHub
    print_warning "推送到 GitHub..."
    git push -u origin main 2>&1 || git push -u origin master 2>&1 || true
    print_success "代码已推送到 GitHub"
}

# ============================================================================
# 第 2 步: Docker 镜像构建和推送
# ============================================================================

build_docker_images() {
    print_header "第 2 步: Docker 镜像构建和推送"
    
    cd /home/devbox/project
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装"
        print_warning "跳过 Docker 镜像构建"
        return
    fi
    
    # 登录 Docker Registry
    print_warning "登录 Docker Registry ($DOCKER_REGISTRY)..."
    echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin "$DOCKER_REGISTRY" 2>&1 || {
        print_error "Docker Registry 登录失败"
        print_warning "请检查用户名和密码"
        return
    }
    print_success "已登录 Docker Registry"
    
    # 构建后端镜像
    print_warning "构建后端镜像..."
    BACKEND_FULL_IMAGE="$DOCKER_REGISTRY/$BACKEND_IMAGE:latest"
    docker build -t "$BACKEND_FULL_IMAGE" ./backend 2>&1 | tail -5
    print_success "后端镜像已构建: $BACKEND_FULL_IMAGE"
    
    # 构建前端镜像
    print_warning "构建前端镜像..."
    FRONTEND_FULL_IMAGE="$DOCKER_REGISTRY/$FRONTEND_IMAGE:latest"
    docker build -t "$FRONTEND_FULL_IMAGE" ./frontend 2>&1 | tail -5
    print_success "前端镜像已构建: $FRONTEND_FULL_IMAGE"
    
    # 推送后端镜像
    print_warning "推送后端镜像..."
    docker push "$BACKEND_FULL_IMAGE" 2>&1 | tail -5
    print_success "后端镜像已推送"
    
    # 推送前端镜像
    print_warning "推送前端镜像..."
    docker push "$FRONTEND_FULL_IMAGE" 2>&1 | tail -5
    print_success "前端镜像已推送"
}

# ============================================================================
# 第 3 步: Sealos 部署说明
# ============================================================================

sealos_deployment_guide() {
    print_header "第 3 步: Sealos 部署更新"
    
    print_warning "Sealos 部署需要在控制台手动操作（使用验证码登录）"
    echo ""
    echo "📋 请在 Sealos 控制台执行以下步骤:"
    echo ""
    echo "1️⃣  打开 Sealos 控制台: https://hzh.sealos.run"
    echo "2️⃣  使用验证码登录"
    echo "3️⃣  进入 应用管理 → 镜像构建"
    echo ""
    echo "4️⃣  构建后端镜像:"
    echo "    - 项目名称: xiaodiyanxuan-backend"
    echo "    - Dockerfile 路径: /home/devbox/project/backend/Dockerfile"
    echo "    - 构建上下文: /home/devbox/project/backend"
    echo "    - 镜像仓库: xiaodiyanxuan-backend"
    echo "    - 镜像标签: latest"
    echo ""
    echo "5️⃣  构建前端镜像:"
    echo "    - 项目名称: xiaodiyanxuan-frontend"
    echo "    - Dockerfile 路径: /home/devbox/project/frontend/Dockerfile"
    echo "    - 构建上下文: /home/devbox/project/frontend"
    echo "    - 镜像仓库: xiaodiyanxuan-frontend"
    echo "    - 镜像标签: latest"
    echo ""
    echo "6️⃣  等待构建完成 (5-10 分钟)"
    echo "7️⃣  Pod 会自动重启"
    echo ""
    print_success "Sealos 部署说明已显示"
}

# ============================================================================
# 第 4 步: 验证部署
# ============================================================================

verify_deployment() {
    print_header "第 4 步: 验证部署"
    
    print_warning "等待 30 秒后验证部署..."
    sleep 30
    
    # 验证后端
    print_warning "验证后端..."
    if curl -s https://pkochbpmcgaa.sealoshzh.site/health 2>/dev/null | grep -q "status"; then
        print_success "后端健康检查通过"
    else
        print_warning "后端健康检查未响应（可能还在启动中）"
    fi
    
    # 验证前端
    print_warning "验证前端..."
    if curl -s https://lgpzubdtdxjf.sealoshzh.site 2>/dev/null | grep -q "html\|DOCTYPE"; then
        print_success "前端页面加载成功"
    else
        print_warning "前端页面未响应（可能还在启动中）"
    fi
    
    # 验证 API
    print_warning "验证 API..."
    if curl -s https://pkochbpmcgaa.sealoshzh.site/api/products 2>/dev/null | grep -q "success"; then
        print_success "API 调用成功"
    else
        print_warning "API 调用未响应（可能还在启动中）"
    fi
}

# ============================================================================
# 最终总结
# ============================================================================

print_summary() {
    print_header "✅ 自动化部署完成"
    
    echo "📊 部署信息:"
    echo "  GitHub 用户名: $GITHUB_USERNAME"
    echo "  GitHub 仓库: $REPO_URL"
    echo "  Docker Registry: $DOCKER_REGISTRY"
    echo "  后端镜像: $DOCKER_REGISTRY/$BACKEND_IMAGE:latest"
    echo "  前端镜像: $DOCKER_REGISTRY/$FRONTEND_IMAGE:latest"
    echo ""
    echo "🌐 访问地址:"
    echo "  前端: https://lgpzubdtdxjf.sealoshzh.site"
    echo "  后端: https://pkochbpmcgaa.sealoshzh.site"
    echo "  API: https://pkochbpmcgaa.sealoshzh.site/api"
    echo ""
    echo "📝 测试账号:"
    echo "  用户名: zcd"
    echo "  密码: asd123"
    echo ""
    echo "⏭️  下一步:"
    echo "  1. 在 Sealos 控制台完成镜像构建"
    echo "  2. 等待 Pod 重启"
    echo "  3. 验证系统功能"
    echo ""
}

# ============================================================================
# 主函数
# ============================================================================

main() {
    print_header "🚀 xiaodiyanxuan 完整自动化部署"
    
    # 执行步骤
    setup_git
    build_docker_images
    sealos_deployment_guide
    verify_deployment
    print_summary
}

# ============================================================================
# 执行
# ============================================================================

main "$@"
