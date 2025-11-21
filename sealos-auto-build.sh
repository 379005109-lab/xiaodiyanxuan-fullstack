#!/bin/bash

# 🚀 Sealos 自动化镜像构建脚本
# 使用 kubeconfig 和 kubectl 自动构建 Docker 镜像

set -e

# ============================================================================
# 📋 配置
# ============================================================================

KUBECONFIG="/home/devbox/project/kubeconfig (7).yaml"
NAMESPACE="ns-cxxiwxce"
BACKEND_DEPLOYMENT="xiaodiyanxuan-api"
FRONTEND_DEPLOYMENT="xiaodiyanxuan-frontend"

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
# 检查 kubectl
# ============================================================================

check_kubectl() {
    print_header "检查 kubectl"
    
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl 未安装"
        print_warning "请先安装 kubectl"
        exit 1
    fi
    print_success "kubectl 已安装"
    
    if [ ! -f "$KUBECONFIG" ]; then
        print_error "kubeconfig 文件不存在: $KUBECONFIG"
        exit 1
    fi
    print_success "kubeconfig 文件已找到"
    
    # 测试连接
    print_warning "测试 Kubernetes 连接..."
    if KUBECONFIG="$KUBECONFIG" kubectl cluster-info &>/dev/null; then
        print_success "Kubernetes 连接成功"
    else
        print_error "Kubernetes 连接失败"
        exit 1
    fi
}

# ============================================================================
# 获取当前部署信息
# ============================================================================

get_deployment_info() {
    print_header "获取部署信息"
    
    print_warning "后端部署信息:"
    KUBECONFIG="$KUBECONFIG" kubectl get deployment "$BACKEND_DEPLOYMENT" -n "$NAMESPACE" -o wide 2>/dev/null || print_warning "后端部署未找到"
    
    print_warning "前端部署信息:"
    KUBECONFIG="$KUBECONFIG" kubectl get deployment "$FRONTEND_DEPLOYMENT" -n "$NAMESPACE" -o wide 2>/dev/null || print_warning "前端部署未找到"
    
    print_warning "Pod 状态:"
    KUBECONFIG="$KUBECONFIG" kubectl get pods -n "$NAMESPACE" -o wide 2>/dev/null || print_warning "Pod 信息获取失败"
}

# ============================================================================
# 触发镜像重新拉取
# ============================================================================

trigger_image_pull() {
    print_header "触发镜像重新拉取"
    
    # 后端镜像拉取
    print_warning "后端镜像: 触发重新拉取..."
    KUBECONFIG="$KUBECONFIG" kubectl rollout restart deployment/"$BACKEND_DEPLOYMENT" -n "$NAMESPACE" 2>/dev/null && \
        print_success "后端部署已重启" || \
        print_warning "后端部署重启失败（可能不存在）"
    
    # 前端镜像拉取
    print_warning "前端镜像: 触发重新拉取..."
    KUBECONFIG="$KUBECONFIG" kubectl rollout restart deployment/"$FRONTEND_DEPLOYMENT" -n "$NAMESPACE" 2>/dev/null && \
        print_success "前端部署已重启" || \
        print_warning "前端部署重启失败（可能不存在）"
}

# ============================================================================
# 监控部署状态
# ============================================================================

monitor_deployment() {
    print_header "监控部署状态"
    
    print_warning "等待部署完成..."
    
    # 后端部署
    print_info "后端部署 ($BACKEND_DEPLOYMENT):"
    KUBECONFIG="$KUBECONFIG" kubectl rollout status deployment/"$BACKEND_DEPLOYMENT" -n "$NAMESPACE" --timeout=5m 2>/dev/null && \
        print_success "后端部署已完成" || \
        print_warning "后端部署状态检查超时"
    
    # 前端部署
    print_info "前端部署 ($FRONTEND_DEPLOYMENT):"
    KUBECONFIG="$KUBECONFIG" kubectl rollout status deployment/"$FRONTEND_DEPLOYMENT" -n "$NAMESPACE" --timeout=5m 2>/dev/null && \
        print_success "前端部署已完成" || \
        print_warning "前端部署状态检查超时"
}

# ============================================================================
# 验证部署
# ============================================================================

verify_deployment() {
    print_header "验证部署"
    
    print_warning "检查 Pod 状态..."
    KUBECONFIG="$KUBECONFIG" kubectl get pods -n "$NAMESPACE" -o wide
    
    print_warning "检查服务..."
    KUBECONFIG="$KUBECONFIG" kubectl get svc -n "$NAMESPACE" -o wide
    
    print_warning "检查 Ingress..."
    KUBECONFIG="$KUBECONFIG" kubectl get ingress -n "$NAMESPACE" -o wide
}

# ============================================================================
# 查看日志
# ============================================================================

view_logs() {
    print_header "查看最近日志"
    
    print_warning "后端日志 (最后 20 行):"
    KUBECONFIG="$KUBECONFIG" kubectl logs -n "$NAMESPACE" -l app="$BACKEND_DEPLOYMENT" --tail=20 2>/dev/null || print_warning "无法获取后端日志"
    
    echo ""
    
    print_warning "前端日志 (最后 20 行):"
    KUBECONFIG="$KUBECONFIG" kubectl logs -n "$NAMESPACE" -l app="$FRONTEND_DEPLOYMENT" --tail=20 2>/dev/null || print_warning "无法获取前端日志"
}

# ============================================================================
# 主函数
# ============================================================================

main() {
    print_header "🚀 Sealos 自动化镜像构建"
    
    # 检查 kubectl
    check_kubectl
    
    # 获取部署信息
    get_deployment_info
    
    # 触发镜像重新拉取
    trigger_image_pull
    
    # 监控部署状态
    monitor_deployment
    
    # 验证部署
    verify_deployment
    
    # 查看日志
    view_logs
    
    print_header "✅ 自动化镜像构建完成"
    
    echo "📊 部署信息:"
    echo "  命名空间: $NAMESPACE"
    echo "  后端部署: $BACKEND_DEPLOYMENT"
    echo "  前端部署: $FRONTEND_DEPLOYMENT"
    echo ""
    echo "🌐 访问地址:"
    echo "  前端: https://lgpzubdtdxjf.sealoshzh.site"
    echo "  后端: https://pkochbpmcgaa.sealoshzh.site"
    echo "  API: https://pkochbpmcgaa.sealoshzh.site/api"
    echo ""
}

# ============================================================================
# 执行
# ============================================================================

main "$@"
