#!/bin/bash

# 测试新模块的脚本
# 用法: bash test-new-modules.sh

BASE_URL="http://localhost:8080"

echo "================================"
echo "测试新模块 API"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
PASSED=0
FAILED=0

# 测试函数
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4
  
  echo -e "${YELLOW}测试:${NC} $description"
  echo "  $method $endpoint"
  
  if [ -z "$data" ]; then
    response=$(curl -s -X $method "$BASE_URL$endpoint" \
      -H "Content-Type: application/json")
  else
    response=$(curl -s -X $method "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi
  
  if echo "$response" | grep -q '"success"'; then
    echo -e "${GREEN}✓ 通过${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗ 失败${NC}"
    echo "  响应: $response"
    ((FAILED++))
  fi
  echo ""
}

# 1. 测试首页图片管理
echo "================================"
echo "1. 测试首页图片管理"
echo "================================"
echo ""

test_endpoint "GET" "/api/website-images" "" "获取所有首页图片配置"

test_endpoint "GET" "/api/website-images/supply-chain" "" "获取特定部分的图片配置"

# 2. 测试设计管理
echo "================================"
echo "2. 测试设计管理"
echo "================================"
echo ""

test_endpoint "POST" "/api/design-requests" \
  '{
    "userName": "测试用户",
    "userPhone": "13800138000",
    "userEmail": "test@example.com",
    "description": "测试设计需求",
    "images": []
  }' \
  "提交设计需求"

# 3. 测试健康检查
echo "================================"
echo "3. 其他测试"
echo "================================"
echo ""

test_endpoint "GET" "/health" "" "健康检查"

# 总结
echo "================================"
echo "测试总结"
echo "================================"
echo -e "${GREEN}通过: $PASSED${NC}"
echo -e "${RED}失败: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ 所有测试通过！${NC}"
  exit 0
else
  echo -e "${RED}✗ 有测试失败，请检查日志${NC}"
  exit 1
fi
