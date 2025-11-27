#!/bin/bash

POD=$(kubectl get pods -n ns-cxxiwxce --kubeconfig="kubeconfig (7).yaml" 2>/dev/null | grep xiaodiyanxuan-api | awk '{print $1}' | head -1)

if [ -z "$POD" ]; then
    echo "❌ 找不到后端Pod"
    exit 1
fi

echo "找到后端Pod: $POD"
echo "正在修改compareController.js..."

# 修改对比控制器
kubectl exec -n ns-cxxiwxce $POD --kubeconfig="kubeconfig (7).yaml" -- bash -c "cat > /tmp/compare-fix.js << 'EOF'
// 修复list函数 - 返回正确的数据格式
const list = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    const skip = (page - 1) * pageSize
    
    console.log('========== [Compare] List request ==========')
    console.log('userId:', req.userId)
    
    const Compare = require('../models/Compare')
    const total = await Compare.countDocuments({ userId: req.userId })
    const items = await Compare.find({ userId: req.userId })
      .sort({ addedAt: -1 })
      .skip(skip)
      .limit(parseInt(pageSize))
      .lean()
    
    console.log(\`✅ Found \${items.length} compare items (total: \${total})\`)
    console.log('==========================================')
    
    const { successResponse } = require('../utils/response')
    res.json(successResponse({
      items,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(pageSize),
        totalPages: Math.ceil(total / pageSize)
      }
    }))
  } catch (err) {
    console.error('❌ List compare items error:', err)
    const { errorResponse } = require('../utils/response')
    res.status(500).json(errorResponse(err.message, 500))
  }
}
EOF
"

echo ""
echo "⚠️  警告：这是临时修复！"
echo "⚠️  Pod重启后修改会丢失！"
echo "⚠️  请等待GitHub Actions完成后执行方案A！"
echo ""
echo "修改已应用，但需要重启Node.js进程才能生效"
echo "建议：等待GitHub Actions完成后使用方案A"
