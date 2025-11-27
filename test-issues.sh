#!/bin/bash

echo "===== 测试6个问题 ====="
echo ""

# 需要一个有效的token
TOKEN="YOUR_TOKEN_HERE"

echo "1. 测试对比功能 /api/compare"
curl -X POST https://pkochbpmcgaa.sealoshzh.site/api/compare \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":"test123","skuId":"sku123"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "2. 测试收藏功能 /api/favorites"
curl -X POST https://pkochbpmcgaa.sealoshzh.site/api/favorites \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":"test456"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "3-4. 需要登录前端查看订单页面"
echo "5. 测试陪买服务提交"
curl -X POST https://pkochbpmcgaa.sealoshzh.site/api/buying-service-requests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"serviceType":"standard","scheduledDate":"2024-12-01T10:00:00Z","notes":"test"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "6. 购物车结算按钮 - 需要前端测试"
