#!/bin/bash

# 测试所有登录端点

echo "🧪 测试登录端点..."
echo ""

# 测试 1: /api/auth/login
echo "1️⃣  测试 /api/auth/login"
echo "   请求: POST /api/auth/login"
echo "   数据: {\"username\":\"zcd\",\"password\":\"asd123\"}"
echo ""
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"zcd","password":"asd123"}' | jq '.' 2>/dev/null || echo "   响应: (无法解析)"
echo ""

# 测试 2: /api/auth/wxlogin
echo "2️⃣  测试 /api/auth/wxlogin"
echo "   请求: POST /api/auth/wxlogin"
echo "   数据: {\"username\":\"zcd\",\"password\":\"asd123\"}"
echo ""
curl -s -X POST http://localhost:8080/api/auth/wxlogin \
  -H "Content-Type: application/json" \
  -d '{"username":"zcd","password":"asd123"}' | jq '.' 2>/dev/null || echo "   响应: (无法解析)"
echo ""

# 测试 3: CORS 验证
echo "3️⃣  测试 CORS (前端地址)"
echo "   请求: POST /api/auth/login (带 Origin 头)"
echo "   Origin: https://lgpzubdtdxjf.sealoshzh.site"
echo ""
curl -s -v -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://lgpzubdtdxjf.sealoshzh.site" \
  -d '{"username":"zcd","password":"asd123"}' 2>&1 | grep -E "Access-Control|HTTP"
echo ""

# 测试 4: 健康检查
echo "4️⃣  测试健康检查"
echo "   请求: GET /health"
echo ""
curl -s http://localhost:8080/health | jq '.' 2>/dev/null || echo "   响应: (无法解析)"
echo ""

echo "✅ 测试完成！"
