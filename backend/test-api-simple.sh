#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8080"
TOKEN=""
NOTIFICATION_ID=""
PRODUCT_ID="product_123"
SKU_ID="sku_456"

echo -e "${BLUE}🧪 开始 API 集成测试${NC}\n"

# 1. 健康检查
echo -e "${YELLOW}1. 健康检查${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/health")
echo "响应: $RESPONSE"
echo ""

# 2. 微信登录
echo -e "${YELLOW}2. 微信登录${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/wxlogin" \
  -H "Content-Type: application/json" \
  -d '{"code":"test_code_123"}')
echo "响应: $RESPONSE"
TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token: $TOKEN"
echo ""

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ 登录失败，无法获取 Token${NC}"
  exit 1
fi

# 3. 获取通知列表
echo -e "${YELLOW}3. 获取通知列表${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/api/notifications" \
  -H "Authorization: Bearer $TOKEN")
echo "响应: $RESPONSE"
echo ""

# 4. 获取未读通知数
echo -e "${YELLOW}4. 获取未读通知数${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/api/notifications/unread/count" \
  -H "Authorization: Bearer $TOKEN")
echo "响应: $RESPONSE"
echo ""

# 5. 获取通知统计
echo -e "${YELLOW}5. 获取通知统计${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/api/notifications/stats" \
  -H "Authorization: Bearer $TOKEN")
echo "响应: $RESPONSE"
echo ""

# 6. 创建通知
echo -e "${YELLOW}6. 创建通知${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/notifications" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "order",
    "title": "新订单提醒",
    "message": "您收到了一个新订单",
    "relatedId": "order_123",
    "actionUrl": "/admin/orders/order_123"
  }')
echo "响应: $RESPONSE"
NOTIFICATION_ID=$(echo $RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
echo "通知 ID: $NOTIFICATION_ID"
echo ""

# 7. 标记通知为已读
if [ ! -z "$NOTIFICATION_ID" ]; then
  echo -e "${YELLOW}7. 标记通知为已读${NC}"
  RESPONSE=$(curl -s -X PATCH "$BASE_URL/api/notifications/$NOTIFICATION_ID/read" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"read":true}')
  echo "响应: $RESPONSE"
  echo ""
fi

# 8. 获取对比列表
echo -e "${YELLOW}8. 获取对比列表${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/api/compare" \
  -H "Authorization: Bearer $TOKEN")
echo "响应: $RESPONSE"
echo ""

# 9. 获取对比统计
echo -e "${YELLOW}9. 获取对比统计${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/api/compare/stats" \
  -H "Authorization: Bearer $TOKEN")
echo "响应: $RESPONSE"
echo ""

# 10. 添加到对比
echo -e "${YELLOW}10. 添加到对比${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/compare" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"skuId\": \"$SKU_ID\",
    \"selectedMaterials\": {
      \"fabric\": \"棉麻\",
      \"filling\": \"羽绒\",
      \"frame\": \"实木\",
      \"leg\": \"金属\"
    }
  }")
echo "响应: $RESPONSE"
echo ""

# 11. 移除对比项
echo -e "${YELLOW}11. 移除对比项${NC}"
RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/compare/$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"skuId\":\"$SKU_ID\"}")
echo "响应: $RESPONSE"
echo ""

# 12. 清空对比列表
echo -e "${YELLOW}12. 清空对比列表${NC}"
RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/compare" \
  -H "Authorization: Bearer $TOKEN")
echo "响应: $RESPONSE"
echo ""

# 13. 标记所有通知为已读
echo -e "${YELLOW}13. 标记所有通知为已读${NC}"
RESPONSE=$(curl -s -X PATCH "$BASE_URL/api/notifications/mark-all-read" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')
echo "响应: $RESPONSE"
echo ""

# 14. 删除通知
if [ ! -z "$NOTIFICATION_ID" ]; then
  echo -e "${YELLOW}14. 删除通知${NC}"
  RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/notifications/$NOTIFICATION_ID" \
    -H "Authorization: Bearer $TOKEN")
  echo "响应: $RESPONSE"
  echo ""
fi

# 15. 清空所有通知
echo -e "${YELLOW}15. 清空所有通知${NC}"
RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/notifications/clear-all" \
  -H "Authorization: Bearer $TOKEN")
echo "响应: $RESPONSE"
echo ""

echo -e "${GREEN}✅ 测试完成${NC}"
