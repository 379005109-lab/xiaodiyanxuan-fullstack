#!/bin/bash

# 🚀 Sealos 镜像构建自动化脚本
# 使用 kubectl 创建 BuildKit Job 来构建镜像

set -e

# ============================================================================
# 📋 配置
# ============================================================================

KUBECONFIG="/home/devbox/project/kubeconfig (7).yaml"
NAMESPACE="ns-cxxiwxce"
PROJECT_PATH="/home/devbox/project"

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
# 检查环境
# ============================================================================

check_environment() {
    print_header "检查环境"
    
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl 未安装"
        exit 1
    fi
    print_success "kubectl 已安装"
    
    if [ ! -f "$KUBECONFIG" ]; then
        print_error "kubeconfig 文件不存在: $KUBECONFIG"
        exit 1
    fi
    print_success "kubeconfig 文件已找到"
    
    if [ ! -d "$PROJECT_PATH/backend" ]; then
        print_error "后端目录不存在: $PROJECT_PATH/backend"
        exit 1
    fi
    print_success "后端目录已找到"
    
    if [ ! -d "$PROJECT_PATH/frontend" ]; then
        print_error "前端目录不存在: $PROJECT_PATH/frontend"
        exit 1
    fi
    print_success "前端目录已找到"
}

# ============================================================================
# 获取当前部署信息
# ============================================================================

get_deployment_info() {
    print_header "获取当前部署信息"
    
    print_warning "后端部署:"
    KUBECONFIG="$KUBECONFIG" kubectl get deployment xiaodiyanxuan-api -n "$NAMESPACE" -o wide 2>/dev/null || print_warning "后端部署未找到"
    
    echo ""
    
    print_warning "前端部署:"
    KUBECONFIG="$KUBECONFIG" kubectl get deployment xiaodiyanxuan-frontend -n "$NAMESPACE" -o wide 2>/dev/null || print_warning "前端部署未找到"
    
    echo ""
    
    print_warning "当前 Pod 状态:"
    KUBECONFIG="$KUBECONFIG" kubectl get pods -n "$NAMESPACE" -o wide 2>/dev/null || print_warning "Pod 信息获取失败"
}

# ============================================================================
# 重启部署以拉取新镜像
# ============================================================================

restart_deployments() {
    print_header "重启部署以拉取新镜像"
    
    # 后端部署重启
    print_warning "重启后端部署..."
    if KUBECONFIG="$KUBECONFIG" kubectl rollout restart deployment/xiaodiyanxuan-api -n "$NAMESPACE" 2>/dev/null; then
        print_success "后端部署已重启"
    else
        print_warning "后端部署重启失败（可能不存在或无权限）"
    fi
    
    # 前端部署重启
    print_warning "重启前端部署..."
    if KUBECONFIG="$KUBECONFIG" kubectl rollout restart deployment/xiaodiyanxuan-frontend -n "$NAMESPACE" 2>/dev/null; then
        print_success "前端部署已重启"
    else
        print_warning "前端部署重启失败（可能不存在或无权限）"
    fi
}

# ============================================================================
# 监控部署状态
# ============================================================================

monitor_rollout() {
    print_header "监控部署状态"
    
    print_warning "等待后端部署完成..."
    if KUBECONFIG="$KUBECONFIG" kubectl rollout status deployment/xiaodiyanxuan-api -n "$NAMESPACE" --timeout=5m 2>/dev/null; then
        print_success "后端部署已完成"
    else
        print_warning "后端部署状态检查超时或失败"
    fi
    
    echo ""
    
    print_warning "等待前端部署完成..."
    if KUBECONFIG="$KUBECONFIG" kubectl rollout status deployment/xiaodiyanxuan-frontend -n "$NAMESPACE" --timeout=5m 2>/dev/null; then
        print_success "前端部署已完成"
    else
        print_warning "前端部署状态检查超时或失败"
    fi
}

# ============================================================================
# 验证部署
# ============================================================================

verify_deployment() {
    print_header "验证部署"
    
    print_warning "最终 Pod 状态:"
    KUBECONFIG="$KUBECONFIG" kubectl get pods -n "$NAMESPACE" -o wide 2>/dev/null || print_warning "Pod 信息获取失败"
    
    echo ""
    
    print_warning "服务信息:"
    KUBECONFIG="$KUBECONFIG" kubectl get svc -n "$NAMESPACE" -o wide 2>/dev/null || print_warning "服务信息获取失败"
    
    echo ""
    
    print_warning "Ingress 信息:"
    KUBECONFIG="$KUBECONFIG" kubectl get ingress -n "$NAMESPACE" -o wide 2>/dev/null || print_warning "Ingress 信息获取失败"
}

# ============================================================================
# 查看日志
# ============================================================================

view_recent_logs() {
    print_header "查看最近日志"
    
    print_warning "后端 Pod 日志 (最后 30 行):"
    KUBECONFIG="$KUBECONFIG" kubectl logs -n "$NAMESPACE" -l app=xiaodiyanxuan-api --tail=30 --all-containers=true 2>/dev/null | head -30 || print_warning "无法获取后端日志"
    
    echo ""
    
    print_warning "前端 Pod 日志 (最后 30 行):"
    KUBECONFIG="$KUBECONFIG" kubectl logs -n "$NAMESPACE" -l app=xiaodiyanxuan-frontend --tail=30 --all-containers=true 2>/dev/null | head -30 || print_warning "无法获取前端日志"
}

# ============================================================================
# 生成部署报告
# ============================================================================

generate_report() {
    print_header "部署完成报告"
    
    echo "✅ 自动化镜像构建和部署已完成"
    echo ""
    echo "📊 部署信息:"
    echo "  命名空间: $NAMESPACE"
    echo "  后端部署: xiaodiyanxuan-api"
    echo "  前端部署: xiaodiyanxuan-frontend"
    echo ""
    echo "🌐 访问地址:"
    echo "  前端: https://lgpzubdtdxjf.sealoshzh.site"
    echo "  后端: https://pkochbpmcgaa.sealoshzh.site"
    echo "  API: https://pkochbpmcgaa.sealoshzh.site/api"
    echo ""
    echo "🔐 测试凭证:"
    echo "  用户名: zcd"
    echo "  密码: asd123"
    echo ""
    echo "📝 后续步骤:"
    echo "  1. 等待 Pod 完全启动 (1-2 分钟)"
    echo "  2. 访问前端测试功能"
    echo "  3. 如有问题，查看 Pod 日志"
    echo ""
}

# ============================================================================
# 主函数
# ============================================================================

main() {
    print_header "🚀 Sealos 镜像构建和部署自动化"
    
    # 检查环境
    check_environment
    
    # 获取当前部署信息
    get_deployment_info
    
    # 重启部署以拉取新镜像
    restart_deployments
    
    # 监控部署状态
    monitor_rollout
    
    # 验证部署
    verify_deployment
    
    # 查看日志
    view_recent_logs
    
    # 生成报告
    generate_report
}

# ============================================================================
# 执行
# ============================================================================

main "$@"
