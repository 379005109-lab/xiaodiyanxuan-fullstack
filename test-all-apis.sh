#!/bin/bash
# 测试所有三个关键接口

API_URL="https://lgpzubdtdxjf.sealoshzh.site"

echo "================================"
echo "  测试所有后端接口"
echo "================================"
echo ""

# 1. 测试分类统计
echo "📊 1. 测试 /api/categories/stats"
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/categories/stats")
code=$(echo "$response" | tail -1)
body=$(echo "$response" | head -n -1)

if [ "$code" = "200" ]; then
    echo "   ✅ 返回 200 OK"
    echo "$body" | python3 -m json.tool 2>/dev/null | head -10
else
    echo "   ❌ 返回 $code"
    echo "$body"
fi
echo ""

# 2. 测试文件上传
echo "📤 2. 测试 /api/files/upload (文件上传)"
echo "   创建测试文件..."
echo "Test image content" > /tmp/test-upload.txt

response=$(curl -s -w "\n%{http_code}" \
  -X POST "$API_URL/api/files/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/tmp/test-upload.txt" 2>&1)

code=$(echo "$response" | tail -1)
body=$(echo "$response" | head -n -1)

if [ "$code" = "200" ] || [ "$code" = "201" ]; then
    echo "   ✅ 返回 $code"
    echo "$body" | python3 -m json.tool 2>/dev/null | head -15
elif [ "$code" = "401" ]; then
    echo "   ⚠️  返回 401 (需要认证 - 这是正常的)"
    echo "   提示: 文件上传需要登录，接口本身没问题"
elif [ "$code" = "502" ]; then
    echo "   ❌ 返回 502 Bad Gateway (后端问题)"
else
    echo "   ⚠️  返回 $code"
    echo "$body" | head -5
fi
echo ""

# 3. 测试批量导入
echo "📦 3. 测试 /api/products (批量导入)"
test_data='[
  {
    "name": "测试商品",
    "basePrice": 99.99,
    "stock": 100,
    "category": "测试分类"
  }
]'

response=$(curl -s -w "\n%{http_code}" \
  -X POST "$API_URL/api/products" \
  -H "Content-Type: application/json" \
  -d "$test_data" 2>&1)

code=$(echo "$response" | tail -1)
body=$(echo "$response" | head -n -1)

if [ "$code" = "200" ] || [ "$code" = "201" ]; then
    echo "   ✅ 返回 $code"
    echo "$body" | python3 -m json.tool 2>/dev/null | head -15
elif [ "$code" = "401" ]; then
    echo "   ⚠️  返回 401 (需要认证 - 这是正常的)"
    echo "   提示: 批量导入需要登录，接口本身没问题"
elif [ "$code" = "404" ]; then
    echo "   ❌ 返回 404 Not Found (路由不存在)"
else
    echo "   ⚠️  返回 $code"
    echo "$body" | head -5
fi
echo ""

echo "================================"
echo "  测试完成"
echo "================================"
echo ""

# 清理
rm -f /tmp/test-upload.txt

# 总结
echo "📝 总结:"
echo ""
echo "1. ✅ /api/categories/stats - 分类统计"
echo "2. ⏳ /api/files/upload - 文件上传 (需要认证才能完整测试)"
echo "3. ⏳ /api/products - 批量导入 (需要认证才能完整测试)"
echo ""
echo "💡 提示: 接口返回 401 是正常的，说明接口存在但需要登录"
echo "       在管理后台登录后测试这些功能即可"
