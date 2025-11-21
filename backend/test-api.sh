#!/bin/bash

# 🧪 后端 API 自动化测试脚本
# 用途: 快速验证所有 API 端点
# 使用: bash test-api.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
API_URL="http://localhost:8080/api"
HEALTH_URL="http://localhost:8080/health"
TEST_USERNAME="testuser"
TEST_PASSWORD="password123"

# 计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 日志函数
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1"
  ((PASSED_TESTS++))
}

log_error() {
  echo -e "${RED}[✗]${NC} $1"
  ((FAILED_TESTS++))
}

log_warning() {
  echo -e "${YELLOW}[!]${NC} $1"
}

# 测试函数
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local expected_status=$4
  local description=$5
  
  ((TOTAL_TESTS++))
  
  log_info "测试: $description"
  
  if [ -z "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN")
  else
    response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "$data")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$http_code" = "$expected_status" ]; then
    log_success "$description (HTTP $http_code)"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  else
    log_error "$description (期望 HTTP $expected_status, 实际 HTTP $http_code)"
    echo "$body"
  fi
  
  echo ""
}

# 测试不需要认证的端点
test_public_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local expected_status=$4
  local description=$5
  
  ((TOTAL_TESTS++))
  
  log_info "测试: $description"
  
  if [ -z "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
      -H "Content-Type: application/json")
  else
    response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$http_code" = "$expected_status" ]; then
    log_success "$description (HTTP $http_code)"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  else
    log_error "$description (期望 HTTP $expected_status, 实际 HTTP $http_code)"
    echo "$body"
  fi
  
  echo ""
}

# ============================================
# 开始测试
# ============================================

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  后端 API 自动化测试${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 第 1 步: 健康检查
log_info "第 1 步: 健康检查"
response=$(curl -s -w "\n%{http_code}" "$HEALTH_URL")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
  log_success "健康检查通过"
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
  log_error "健康检查失败 (HTTP $http_code)"
  echo "错误: 服务可能未启动"
  exit 1
fi
echo ""

# 第 2 步: 认证测试
log_info "第 2 步: 认证测试"
login_response=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$TEST_USERNAME\",\"password\":\"$TEST_PASSWORD\"}")

TOKEN=$(echo "$login_response" | jq -r '.data.token' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  log_warning "用户登录失败，使用演示令牌"
  TOKEN="demo_token"
else
  log_success "用户登录成功"
  echo "令牌: $TOKEN"
fi
echo ""

# 第 3 步: 公开 API 测试
log_info "第 3 步: 公开 API 测试"
test_public_endpoint "GET" "/products" "" "200" "获取产品列表"
test_public_endpoint "GET" "/categories" "" "200" "获取分类列表"
test_public_endpoint "GET" "/products/styles" "" "200" "获取样式列表"

# 第 4 步: 受保护 API 测试
log_info "第 4 步: 受保护 API 测试"
test_endpoint "GET" "/users/profile" "" "200" "获取用户资料"
test_endpoint "GET" "/cart" "" "200" "获取购物车"
test_endpoint "GET" "/orders" "" "200" "获取订单列表"
test_endpoint "GET" "/favorites" "" "200" "获取收藏列表"

# 第 5 步: 错误处理测试
log_info "第 5 步: 错误处理测试"
test_endpoint "GET" "/products/invalid_id" "" "404" "获取不存在的产品"
test_endpoint "GET" "/orders/invalid_id" "" "404" "获取不存在的订单"

# ============================================
# 测试总结
# ============================================

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  测试总结${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo "总测试数: $TOTAL_TESTS"
echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
echo -e "${RED}失败: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✓ 所有测试通过!${NC}"
  exit 0
else
  echo -e "${RED}✗ 有 $FAILED_TESTS 个测试失败${NC}"
  exit 1
fi
