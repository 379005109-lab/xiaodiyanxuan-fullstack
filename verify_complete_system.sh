#!/bin/bash

# 完整系统验证脚本

echo "=========================================="
echo "完整系统验证"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 计数器
PASS=0
FAIL=0

# 测试函数
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local expected_code=$5
    
    echo -n "测试: $name ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" -H "Content-Type: application/json" -d "$data" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ 通过${NC} (HTTP $http_code)"
        ((PASS++))
        return 0
    else
        echo -e "${RED}✗ 失败${NC} (HTTP $http_code, 期望 $expected_code)"
        if [ ! -z "$body" ] && [ ${#body} -lt 200 ]; then
            echo "  响应: $body"
        fi
        ((FAIL++))
        return 1
    fi
}

# ========== 后端测试 ==========
echo -e "${BLUE}=== 后端 API 测试 ===${NC}"
echo ""

test_endpoint "后端健康检查" "GET" "https://pkochbpmcgaa.sealoshzh.site/health" "" "200"
test_endpoint "后端产品列表" "GET" "https://pkochbpmcgaa.sealoshzh.site/api/products" "" "200"
test_endpoint "后端分类列表" "GET" "https://pkochbpmcgaa.sealoshzh.site/api/categories" "" "200"
test_endpoint "后端登录 (错误密码)" "POST" "https://pkochbpmcgaa.sealoshzh.site/api/auth/login" '{"username":"zcd","password":"wrong"}' "401"
test_endpoint "后端登录 (正确密码)" "POST" "https://pkochbpmcgaa.sealoshzh.site/api/auth/login" '{"username":"zcd","password":"asd123"}' "200"

echo ""
echo -e "${BLUE}=== 前端测试 ===${NC}"
echo ""

test_endpoint "前端首页" "GET" "https://lgpzubdtdxjf.sealoshzh.site" "" "200"

echo ""
echo -e "${BLUE}=== 本地后端测试 ===${NC}"
echo ""

test_endpoint "本地后端健康检查" "GET" "http://localhost:8080/health" "" "200"
test_endpoint "本地后端产品列表" "GET" "http://localhost:8080/api/products" "" "200"

echo ""
echo "=========================================="
echo "测试结果"
echo "=========================================="
echo ""

echo -e "通过: ${GREEN}$PASS${NC}"
echo -e "失败: ${RED}$FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试通过！系统正常运行${NC}"
    exit 0
else
    echo -e "${RED}✗ 有 $FAIL 个测试失败${NC}"
    echo ""
    echo "可能的原因:"
    echo "1. 后端 Docker 镜像过旧 - 需要重新构建"
    echo "2. 前端 API 配置不正确 - 需要修改前端代码"
    echo "3. CORS 配置问题 - 需要检查后端 CORS 设置"
    echo "4. 网络连接问题 - 检查网络"
    echo ""
    echo "详见: COMPLETE_FIX_GUIDE.md"
    exit 1
fi
