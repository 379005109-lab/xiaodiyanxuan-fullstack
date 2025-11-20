#!/bin/bash

# 生产环境状态检查脚本

echo "=========================================="
echo "生产环境状态检查"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_endpoint() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -n "检查 $name ... "
    
    response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "$expected" ]; then
        echo -e "${GREEN}✓ 成功${NC} (HTTP $http_code)"
        return 0
    else
        echo -e "${RED}✗ 失败${NC} (HTTP $http_code, 期望 $expected)"
        if [ ! -z "$body" ]; then
            echo "  响应: $body" | head -c 100
            echo ""
        fi
        return 1
    fi
}

# 测试后端
echo "=== 后端检查 ==="
echo ""

check_endpoint "后端健康检查" "https://pkochbpmcgaa.sealoshzh.site/health" "200"
BACKEND_HEALTH=$?

check_endpoint "后端登录端点" "https://pkochbpmcgaa.sealoshzh.site/api/auth/login" "404"
BACKEND_LOGIN=$?

check_endpoint "后端产品列表" "https://pkochbpmcgaa.sealoshzh.site/api/products" "200"
BACKEND_PRODUCTS=$?

echo ""
echo "=== 前端检查 ==="
echo ""

check_endpoint "前端首页" "https://lgpzubdtdxjf.sealoshzh.site" "200"
FRONTEND=$?

echo ""
echo "=== 本地后端检查 ==="
echo ""

check_endpoint "本地后端健康检查" "http://localhost:8080/health" "200"
LOCAL_BACKEND=$?

echo ""
echo "=========================================="
echo "检查结果汇总"
echo "=========================================="
echo ""

if [ $BACKEND_HEALTH -eq 0 ]; then
    echo -e "${GREEN}✓ 后端健康检查通过${NC}"
else
    echo -e "${RED}✗ 后端健康检查失败${NC}"
fi

if [ $BACKEND_PRODUCTS -eq 0 ]; then
    echo -e "${GREEN}✓ 后端 API 正常${NC}"
else
    echo -e "${RED}✗ 后端 API 异常${NC}"
fi

if [ $FRONTEND -eq 0 ]; then
    echo -e "${GREEN}✓ 前端正常${NC}"
else
    echo -e "${RED}✗ 前端异常${NC}"
fi

if [ $LOCAL_BACKEND -eq 0 ]; then
    echo -e "${GREEN}✓ 本地后端正常${NC}"
else
    echo -e "${YELLOW}⚠ 本地后端未运行${NC}"
fi

echo ""
echo "=========================================="
echo "建议"
echo "=========================================="
echo ""

if [ $BACKEND_HEALTH -ne 0 ] || [ $BACKEND_PRODUCTS -ne 0 ]; then
    echo -e "${YELLOW}后端有问题，需要重新构建 Docker 镜像:${NC}"
    echo "1. 登录 https://hzh.sealos.run"
    echo "2. 进入应用管理 → 镜像构建"
    echo "3. 构建 xiaodiyanxuan-backend:latest"
    echo "4. 等待 5-10 分钟"
    echo ""
fi

if [ $FRONTEND -ne 0 ]; then
    echo -e "${YELLOW}前端有问题，需要重新构建 Docker 镜像:${NC}"
    echo "1. 登录 https://hzh.sealos.run"
    echo "2. 进入应用管理 → 镜像构建"
    echo "3. 构建 xiaodiyanxuan-frontend:latest"
    echo "4. 等待 5-10 分钟"
    echo ""
fi

echo "详见: PRODUCTION_FIX_PLAN.md"
