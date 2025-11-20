#!/usr/bin/env node

/**
 * API 验证脚本 - 验证所有后端 API 端点
 * 用法: node verify-apis.js
 */

const http = require('http')

const BASE_URL = 'http://localhost:8080'
let token = null
let notificationId = null

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

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

async function test(name, method, path, body = null, auth = true, checks = []) {
  const headers = auth && token ? { 'Authorization': `Bearer ${token}` } : {}
  
  try {
    const result = await makeRequest(method, path, body, headers)
    const success = result.status >= 200 && result.status < 300
    
    console.log(`${success ? colors.green : colors.red}${success ? '✅' : '❌'} ${name}${colors.reset}`)
    
    if (!success) {
      console.log(`   状态码: ${result.status}`)
      console.log(`   错误: ${result.data.message || '未知错误'}`)
      return false
    }
    
    // 执行检查
    for (const check of checks) {
      if (!check(result.data)) {
        console.log(`   ${colors.red}❌ 检查失败${colors.reset}`)
        return false
      }
    }
    
    return true
  } catch (err) {
    console.log(`${colors.red}❌ ${name}${colors.reset}`)
    console.log(`   错误: ${err.message}`)
    return false
  }
}

async function runTests() {
  console.log(`${colors.blue}🧪 开始 API 验证${colors.reset}\n`)
  
  let passed = 0
  let failed = 0
  
  // 1. 健康检查
  console.log(`${colors.cyan}📍 基础检查${colors.reset}`)
  if (await test('健康检查', 'GET', '/health', null, false)) passed++
  else failed++
  console.log()
  
  // 2. 登录
  console.log(`${colors.cyan}🔐 认证${colors.reset}`)
  if (await test('微信登录', 'POST', '/api/auth/wxlogin', { code: 'test_code' }, false, [
    (data) => {
      if (data.data && data.data.token) {
        token = data.data.token
        console.log(`   ${colors.green}Token 已保存${colors.reset}`)
        return true
      }
      return false
    }
  ])) passed++
  else failed++
  console.log()
  
  if (!token) {
    console.log(`${colors.red}❌ 无法获取令牌，停止测试${colors.reset}`)
    return
  }
  
  // 3. 通知 API
  console.log(`${colors.cyan}📢 通知 API${colors.reset}`)
  
  if (await test('获取通知列表', 'GET', '/api/notifications', null, true, [
    (data) => data.success && Array.isArray(data.data) && data.pagination
  ])) passed++
  else failed++
  
  if (await test('获取未读通知数', 'GET', '/api/notifications/unread/count', null, true, [
    (data) => data.success && typeof data.data.unreadCount === 'number'
  ])) passed++
  else failed++
  
  if (await test('获取通知统计', 'GET', '/api/notifications/stats', null, true, [
    (data) => data.success && data.data.total !== undefined && data.data.byType
  ])) passed++
  else failed++
  
  if (await test('创建通知', 'POST', '/api/notifications', {
    type: 'order',
    title: '测试通知',
    message: '这是一条测试通知'
  }, true, [
    (data) => {
      if (data.data && data.data._id) {
        notificationId = data.data._id
        console.log(`   ${colors.green}通知 ID 已保存${colors.reset}`)
        return true
      }
      return false
    }
  ])) passed++
  else failed++
  
  if (notificationId) {
    if (await test('标记通知为已读', 'PATCH', `/api/notifications/${notificationId}/read`, 
      { read: true }, true)) passed++
    else failed++
  }
  
  if (await test('标记所有通知为已读', 'PATCH', '/api/notifications/mark-all-read', {}, true)) passed++
  else failed++
  
  if (notificationId) {
    if (await test('删除通知', 'DELETE', `/api/notifications/${notificationId}`, null, true)) passed++
    else failed++
  }
  
  if (await test('清空所有通知', 'DELETE', '/api/notifications/clear-all', {}, true)) passed++
  else failed++
  
  console.log()
  
  // 4. 对比 API
  console.log(`${colors.cyan}🔄 对比 API${colors.reset}`)
  
  if (await test('获取对比列表', 'GET', '/api/compare', null, true, [
    (data) => data.success && Array.isArray(data.data) && data.pagination
  ])) passed++
  else failed++
  
  if (await test('获取对比统计', 'GET', '/api/compare/stats', null, true, [
    (data) => data.success && data.data.total !== undefined && data.data.maxItems
  ])) passed++
  else failed++
  
  if (await test('添加到对比', 'POST', '/api/compare', {
    productId: 'test_product_123',
    skuId: 'test_sku_456'
  }, true)) passed++
  else failed++
  
  if (await test('移除对比项', 'DELETE', '/api/compare/test_product_123', 
    { skuId: 'test_sku_456' }, true)) passed++
  else failed++
  
  if (await test('清空对比列表', 'DELETE', '/api/compare', {}, true)) passed++
  else failed++
  
  console.log()
  
  // 总结
  console.log(`${colors.blue}📊 测试总结${colors.reset}`)
  console.log(`${colors.green}✅ 通过: ${passed}${colors.reset}`)
  console.log(`${colors.red}❌ 失败: ${failed}${colors.reset}`)
  console.log(`📈 通过率: ${((passed / (passed + failed)) * 100).toFixed(2)}%`)
  
  if (failed === 0) {
    console.log(`\n${colors.green}🎉 所有测试通过！${colors.reset}`)
    process.exit(0)
  } else {
    console.log(`\n${colors.red}⚠️  有 ${failed} 个测试失败${colors.reset}`)
    process.exit(1)
  }
}

runTests().catch(err => {
  console.error(`${colors.red}❌ 测试运行失败: ${err.message}${colors.reset}`)
  process.exit(1)
})
