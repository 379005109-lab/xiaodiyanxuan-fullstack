#!/bin/bash

# 🚀 完整自动化部署脚本模板
# 使用方式: 填入下面的配置，然后运行此脚本

set -e

# ============================================================================
# 📋 配置信息 - 请填入你的信息
# ============================================================================

# GitHub 配置
GITHUB_USERNAME="${GITHUB_USERNAME:-}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
GITHUB_EMAIL="${GITHUB_EMAIL:-}"
BACKEND_REPO="${BACKEND_REPO:-}"
FRONTEND_REPO="${FRONTEND_REPO:-}"

# Docker Registry 配置
DOCKER_REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
DOCKER_USERNAME="${DOCKER_USERNAME:-}"
DOCKER_PASSWORD="${DOCKER_PASSWORD:-}"
BACKEND_IMAGE="${BACKEND_IMAGE:-xiaodiyanxuan-backend}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-xiaodiyanxuan-frontend}"

# Sealos 配置
SEALOS_USERNAME="${SEALOS_USERNAME:-}"
SEALOS_PASSWORD="${SEALOS_PASSWORD:-}"
SEALOS_NAMESPACE="${SEALOS_NAMESPACE:-ns-cxxiwxce}"

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

check_config() {
    print_header "检查配置"
    
    local missing=0
    
    if [ -z "$GITHUB_USERNAME" ]; then
        print_error "GITHUB_USERNAME 未设置"
        missing=1
    else
        print_success "GITHUB_USERNAME: $GITHUB_USERNAME"
    fi
    
    if [ -z "$GITHUB_TOKEN" ]; then
        print_error "GITHUB_TOKEN 未设置"
        missing=1
    else
        print_success "GITHUB_TOKEN: ****"
    fi
    
    if [ -z "$DOCKER_USERNAME" ]; then
        print_error "DOCKER_USERNAME 未设置"
        missing=1
    else
        print_success "DOCKER_USERNAME: $DOCKER_USERNAME"
    fi
    
    if [ -z "$DOCKER_PASSWORD" ]; then
        print_error "DOCKER_PASSWORD 未设置"
        missing=1
    else
        print_success "DOCKER_PASSWORD: ****"
    fi
    
    if [ $missing -eq 1 ]; then
        print_error "缺少必要配置，请先设置环境变量"
        exit 1
    fi
}

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
    fi
    
    # 添加文件
    print_warning "添加文件到 Git..."
    git add .
    print_success "文件已添加"
    
    # 创建提交
    if ! git diff --cached --quiet; then
        print_warning "创建初始提交..."
        git commit -m "Initial commit: Complete backend and frontend setup"
        print_success "提交已创建"
    fi
    
    # 添加远程仓库
    if ! git remote | grep -q origin; then
        print_warning "添加远程仓库..."
        git remote add origin "$BACKEND_REPO"
        print_success "远程仓库已添加"
    fi
    
    # 推送到 GitHub
    print_warning "推送到 GitHub..."
    git push -u origin main 2>&1 || git push -u origin master 2>&1
    print_success "代码已推送到 GitHub"
}

build_docker_images() {
    print_header "第 2 步: Docker 镜像构建"
    
    cd /home/devbox/project
    
    # 登录 Docker Registry
    print_warning "登录 Docker Registry..."
    echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin "$DOCKER_REGISTRY"
    print_success "已登录 Docker Registry"
    
    # 构建后端镜像
    print_warning "构建后端镜像..."
    docker build -t "$DOCKER_REGISTRY/$DOCKER_USERNAME/$BACKEND_IMAGE:latest" ./backend
    print_success "后端镜像已构建"
    
    # 构建前端镜像
    print_warning "构建前端镜像..."
    docker build -t "$DOCKER_REGISTRY/$DOCKER_USERNAME/$FRONTEND_IMAGE:latest" ./frontend
    print_success "前端镜像已构建"
    
    # 推送镜像
    print_warning "推送后端镜像..."
    docker push "$DOCKER_REGISTRY/$DOCKER_USERNAME/$BACKEND_IMAGE:latest"
    print_success "后端镜像已推送"
    
    print_warning "推送前端镜像..."
    docker push "$DOCKER_REGISTRY/$DOCKER_USERNAME/$FRONTEND_IMAGE:latest"
    print_success "前端镜像已推送"
}

update_sealos() {
    print_header "第 3 步: 更新 Sealos 部署"
    
    print_warning "注意: Sealos 部署需要在控制台手动操作"
    echo ""
    echo "请在 Sealos 控制台执行以下步骤:"
    echo ""
    echo "1. 打开 https://hzh.sealos.run"
    echo "2. 应用管理 → 镜像构建"
    echo "3. 构建后端镜像:"
    echo "   - Dockerfile: /home/devbox/project/backend/Dockerfile"
    echo "   - 构建上下文: /home/devbox/project/backend"
    echo ""
    echo "4. 构建前端镜像:"
    echo "   - Dockerfile: /home/devbox/project/frontend/Dockerfile"
    echo "   - 构建上下文: /home/devbox/project/frontend"
    echo ""
    echo "5. 等待构建完成 (5-10 分钟)"
    echo ""
}

verify_deployment() {
    print_header "第 4 步: 验证部署"
    
    print_warning "验证后端..."
    if curl -s https://pkochbpmcgaa.sealoshzh.site/api/health | grep -q "status"; then
        print_success "后端健康检查通过"
    else
        print_error "后端健康检查失败"
    fi
    
    print_warning "验证前端..."
    if curl -s https://lgpzubdtdxjf.sealoshzh.site | grep -q "html"; then
        print_success "前端页面加载成功"
    else
        print_error "前端页面加载失败"
    fi
}

# ============================================================================
# 🚀 主函数
# ============================================================================

main() {
    print_header "🚀 完整自动化部署"
    
    # 检查配置
    check_config
    
    # 执行步骤
    setup_git
    build_docker_images
    update_sealos
    verify_deployment
    
    print_header "✅ 部署完成"
    echo "下一步: 在 Sealos 控制台完成镜像构建"
}

# ============================================================================
# 执行
# ============================================================================

main "$@"
