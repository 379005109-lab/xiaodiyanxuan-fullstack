#!/usr/bin/env node

/**
 * 通知和对比 API 测试脚本
 */

const http = require('http')

const BASE_URL = 'http://localhost:8080'
let token = null
let userId = null
let notificationId = null
let compareItemId = null

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

// 发送 HTTP 请求
function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path)
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data),
            headers: res.headers
          })
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          })
        }
      })
    })

    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

// 测试用例
const tests = [
  {
    name: '1. 健康检查',
    method: 'GET',
    path: '/health',
    body: null,
    auth: false
  },
  {
    name: '2. 微信登录',
    method: 'POST',
    path: '/api/auth/wxlogin',
    body: { code: 'test_code_123' },
    auth: false,
    saveToken: true
  },
  {
    name: '3. 获取通知列表',
    method: 'GET',
    path: '/api/notifications',
    body: null,
    auth: true
  },
  {
    name: '4. 获取未读通知数',
    method: 'GET',
    path: '/api/notifications/unread/count',
    body: null,
    auth: true
  },
  {
    name: '5. 获取通知统计',
    method: 'GET',
    path: '/api/notifications/stats',
    body: null,
    auth: true
  },
  {
    name: '6. 创建通知',
    method: 'POST',
    path: '/api/notifications',
    body: {
      type: 'order',
      title: '新订单提醒',
      message: '您收到了一个新订单',
      relatedId: 'order_123',
      actionUrl: '/admin/orders/order_123'
    },
    auth: true,
    saveNotificationId: true
  },
  {
    name: '7. 标记通知为已读',
    method: 'PATCH',
    path: '/api/notifications/{notificationId}/read',
    body: { read: true },
    auth: true,
    requiresNotificationId: true
  },
  {
    name: '8. 标记所有通知为已读',
    method: 'PATCH',
    path: '/api/notifications/mark-all-read',
    body: {},
    auth: true
  },
  {
    name: '9. 获取对比列表',
    method: 'GET',
    path: '/api/compare',
    body: null,
    auth: true
  },
  {
    name: '10. 获取对比统计',
    method: 'GET',
    path: '/api/compare/stats',
    body: null,
    auth: true
  },
  {
    name: '11. 添加到对比',
    method: 'POST',
    path: '/api/compare',
    body: {
      productId: 'product_123',
      skuId: 'sku_456',
      selectedMaterials: {
        fabric: '棉麻',
        filling: '羽绒',
        frame: '实木',
        leg: '金属'
      }
    },
    auth: true,
    saveCompareItemId: true
  },
  {
    name: '12. 移除对比项',
    method: 'DELETE',
    path: '/api/compare/product_123',
    body: { skuId: 'sku_456' },
    auth: true,
    requiresCompareItemId: true
  },
  {
    name: '13. 清空对比列表',
    method: 'DELETE',
    path: '/api/compare',
    body: {},
    auth: true
  },
  {
    name: '14. 删除通知',
    method: 'DELETE',
    path: '/api/notifications/{notificationId}',
    body: null,
    auth: true,
    requiresNotificationId: true
  },
  {
    name: '15. 清空所有通知',
    method: 'DELETE',
    path: '/api/notifications/clear-all',
    body: {},
    auth: true
  }
]

// 运行测试
async function runTests() {
  console.log(`${colors.blue}🧪 开始通知和对比 API 测试...${colors.reset}\n`)

  let passed = 0
  let failed = 0

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i]
    
    // 检查是否需要 ID
    if (test.requiresNotificationId && !notificationId) {
      console.log(`${colors.yellow}[${i + 1}/${tests.length}] ${test.name}${colors.reset}`)
      console.log(`${colors.yellow}⏭️  跳过（需要通知 ID）${colors.reset}\n`)
      continue
    }
    
    if (test.requiresCompareItemId && !compareItemId) {
      console.log(`${colors.yellow}[${i + 1}/${tests.length}] ${test.name}${colors.reset}`)
      console.log(`${colors.yellow}⏭️  跳过（需要对比项 ID）${colors.reset}\n`)
      continue
    }

    const headers = test.auth && token ? { 'Authorization': `Bearer ${token}` } : {}
    let path = test.path
    
    // 替换 ID 占位符
    if (notificationId) {
      path = path.replace('{notificationId}', notificationId)
    }
    if (compareItemId) {
      path = path.replace('{compareItemId}', compareItemId)
    }

    try {
      console.log(`${colors.yellow}[${i + 1}/${tests.length}] ${test.name}${colors.reset}`)
      const result = await makeRequest(test.method, path, test.body, headers)

      if (result.status >= 200 && result.status < 300) {
        console.log(`${colors.green}✅ 成功 (${result.status})${colors.reset}`)
        
        // 保存 token
        if (test.saveToken && result.data.data && result.data.data.token) {
          token = result.data.data.token
          userId = result.data.data.userId
          console.log(`${colors.green}💾 Token 已保存${colors.reset}`)
        }

        // 保存通知 ID
        if (test.saveNotificationId && result.data.data && result.data.data._id) {
          notificationId = result.data.data._id
          console.log(`${colors.green}💾 通知 ID 已保存: ${notificationId}${colors.reset}`)
        }

        // 保存对比项 ID
        if (test.saveCompareItemId && result.data.data && result.data.data._id) {
          compareItemId = result.data.data._id
          console.log(`${colors.green}💾 对比项 ID 已保存: ${compareItemId}${colors.reset}`)
        }

        passed++
      } else {
        console.log(`${colors.red}❌ 失败 (${result.status})${colors.reset}`)
        console.log(`   错误: ${result.data.message || '未知错误'}`)
        failed++
      }
    } catch (err) {
      console.log(`${colors.red}❌ 错误: ${err.message}${colors.reset}`)
      failed++
    }

    console.log()
  }

  // 总结
  console.log(`${colors.blue}📊 测试总结${colors.reset}`)
  console.log(`${colors.green}✅ 通过: ${passed}${colors.reset}`)
  console.log(`${colors.red}❌ 失败: ${failed}${colors.reset}`)
  console.log(`📈 通过率: ${((passed / (tests.length - 2)) * 100).toFixed(2)}%`)

  if (failed === 0) {
    console.log(`\n${colors.green}🎉 所有测试通过！${colors.reset}`)
  } else {
    console.log(`\n${colors.red}⚠️  有 ${failed} 个测试失败${colors.reset}`)
  }
}

// 运行测试
runTests().catch(err => {
  console.error(`${colors.red}❌ 测试运行失败: ${err.message}${colors.reset}`)
  process.exit(1)
})
