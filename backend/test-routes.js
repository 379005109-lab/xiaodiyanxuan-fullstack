#!/usr/bin/env node
/**
 * 测试路由是否正确加载
 */

require('dotenv').config()
const app = require('./src/app')

// 列出所有已注册的路由
console.log('\n📋 已注册的路由:')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

function listRoutes(stack, prefix = '') {
  stack.forEach(middleware => {
    if (middleware.route) {
      // 这是一个路由
      const methods = Object.keys(middleware.route.methods).map(m => m.toUpperCase())
      console.log(`${methods.join(', ').padEnd(10)} ${prefix}${middleware.route.path}`)
    } else if (middleware.name === 'router' && middleware.handle.stack) {
      // 这是一个路由器
      const routerPrefix = middleware.regexp
        .source.replace(/\\/g, '')
        .replace(/\?/g, '')
        .replace(/\(/g, '')
        .replace(/\)/g, '')
        .replace(/\$/g, '')
        .replace(/\^/g, '')
        .replace(/\//g, '')
        .replace(/\|/g, '/')
      
      // 简化路由前缀提取
      let cleanPrefix = prefix
      if (middleware.regexp.source.includes('/api')) {
        const match = middleware.regexp.source.match(/\/api\/\w+/)
        if (match) {
          cleanPrefix = match[0]
        }
      }
      
      listRoutes(middleware.handle.stack, cleanPrefix)
    }
  })
}

listRoutes(app._router.stack)

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// 测试健康检查
console.log('【测试】GET /health')
const http = require('http')

const server = app.listen(0, () => {
  const port = server.address().port
  
  const req = http.get(`http://localhost:${port}/health`, (res) => {
    let data = ''
    res.on('data', chunk => data += chunk)
    res.on('end', () => {
      console.log(`✅ 状态码: ${res.statusCode}`)
      console.log(`   响应: ${data}`)
      
      // 测试 API 路由
      console.log('\n【测试】GET /api/products')
      const req2 = http.get(`http://localhost:${port}/api/products`, (res2) => {
        let data2 = ''
        res2.on('data', chunk => data2 += chunk)
        res2.on('end', () => {
          console.log(`${res2.statusCode === 404 ? '❌' : '✅'} 状态码: ${res2.statusCode}`)
          if (res2.statusCode !== 200) {
            console.log(`   响应: ${data2.substring(0, 100)}`)
          }
          
          server.close()
        })
      })
      
      req2.on('error', err => {
        console.log(`❌ 错误: ${err.message}`)
        server.close()
      })
    })
  })
  
  req.on('error', err => {
    console.log(`❌ 错误: ${err.message}`)
    server.close()
  })
})
