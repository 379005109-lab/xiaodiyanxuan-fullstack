#!/usr/bin/env node

/**
 * API 端点测试脚本
 * 用于验证所有 API 接口是否正常工作
 */

const http = require('http')

const BASE_URL = 'http://localhost:8080'
let token = null

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
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
    name: '健康检查',
    method: 'GET',
    path: '/health',
    body: null,
    auth: false
  },
  {
    name: '微信登录',
    method: 'POST',
    path: '/api/auth/wxlogin',
    body: { code: 'test_code_123' },
    auth: false,
    saveToken: true
  },
  {
    name: '获取商品列表',
    method: 'GET',
    path: '/api/products?page=1&pageSize=10',
    body: null,
    auth: false
  },
  {
    name: '获取分类列表',
    method: 'GET',
    path: '/api/categories',
    body: null,
    auth: false
  },
  {
    name: '获取风格列表',
    method: 'GET',
    path: '/api/styles',
    body: null,
    auth: false
  },
  {
    name: '获取首页数据',
    method: 'GET',
    path: '/api/home',
    body: null,
    auth: false
  },
  {
    name: '获取优惠券列表',
    method: 'GET',
    path: '/api/coupons?page=1&pageSize=10',
    body: null,
    auth: false
  },
  {
    name: '获取砍价列表',
    method: 'GET',
    path: '/api/bargains?page=1&pageSize=10',
    body: null,
    auth: false
  },
  {
    name: '获取套餐列表',
    method: 'GET',
    path: '/api/packages?page=1&pageSize=10',
    body: null,
    auth: false
  }
]

// 运行测试
async function runTests() {
  console.log(`${colors.blue}🧪 开始 API 端点测试...${colors.reset}\n`)

  let passed = 0
  let failed = 0

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i]
    const headers = test.auth && token ? { 'Authorization': `Bearer ${token}` } : {}

    try {
      console.log(`${colors.yellow}[${i + 1}/${tests.length}] ${test.name}${colors.reset}`)
      const result = await makeRequest(test.method, test.path, test.body, headers)

      if (result.status >= 200 && result.status < 300) {
        console.log(`${colors.green}✅ 成功 (${result.status})${colors.reset}`)
        
        // 保存 token
        if (test.saveToken && result.data.data && result.data.data.token) {
          token = result.data.data.token
          console.log(`${colors.green}💾 Token 已保存${colors.reset}`)
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
  console.log(`📈 通过率: ${((passed / tests.length) * 100).toFixed(2)}%`)

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
