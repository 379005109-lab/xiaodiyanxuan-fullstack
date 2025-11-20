#!/usr/bin/env node
/**
 * 调试应用启动
 */

require('dotenv').config()

console.log('【1】加载 Express...')
const express = require('express')
console.log('✅ Express 已加载')

console.log('\n【2】加载 app.js...')
try {
  const app = require('./src/app')
  console.log('✅ app.js 已加载')
  
  console.log('\n【3】检查应用中间件和路由...')
  console.log(`应用中间件数量: ${app._router.stack.length}`)
  
  // 列出所有路由
  let routeCount = 0
  app._router.stack.forEach((middleware, index) => {
    if (middleware.route) {
      routeCount++
      const methods = Object.keys(middleware.route.methods).map(m => m.toUpperCase())
      console.log(`  [${index}] ${methods.join(', ').padEnd(10)} ${middleware.route.path}`)
    } else if (middleware.name === 'router') {
      console.log(`  [${index}] 路由器 (${middleware.regexp.source})`)
      if (middleware.handle.stack) {
        middleware.handle.stack.forEach((route, subIndex) => {
          if (route.route) {
            routeCount++
            const methods = Object.keys(route.route.methods).map(m => m.toUpperCase())
            console.log(`    └─ ${methods.join(', ').padEnd(10)} ${route.route.path}`)
          }
        })
      }
    }
  })
  
  console.log(`\n总路由数: ${routeCount}`)
  
  console.log('\n【4】启动测试服务器...')
  const server = app.listen(3000, () => {
    console.log('✅ 服务器启动成功，监听端口 3000')
    
    // 测试路由
    const http = require('http')
    
    setTimeout(() => {
      console.log('\n【5】测试路由...')
      
      const testRoutes = [
        { method: 'GET', path: '/health' },
        { method: 'GET', path: '/api' },
        { method: 'POST', path: '/api/auth/login', body: '{"username":"test","password":"test"}' },
        { method: 'GET', path: '/api/products' },
      ]
      
      let testIndex = 0
      
      const testNext = () => {
        if (testIndex >= testRoutes.length) {
          console.log('\n✅ 所有测试完成')
          server.close()
          return
        }
        
        const test = testRoutes[testIndex++]
        const options = {
          hostname: 'localhost',
          port: 3000,
          path: test.path,
          method: test.method,
          headers: {
            'Content-Type': 'application/json'
          }
        }
        
        const req = http.request(options, (res) => {
          let data = ''
          res.on('data', chunk => data += chunk)
          res.on('end', () => {
            console.log(`${test.method.padEnd(6)} ${test.path.padEnd(25)} → ${res.statusCode}`)
            testNext()
          })
        })
        
        req.on('error', err => {
          console.log(`${test.method.padEnd(6)} ${test.path.padEnd(25)} → 错误: ${err.message}`)
          testNext()
        })
        
        if (test.body) {
          req.write(test.body)
        }
        req.end()
      }
      
      testNext()
    }, 1000)
  })
  
} catch (err) {
  console.error('❌ 加载 app.js 失败:', err)
  console.error(err.stack)
}
