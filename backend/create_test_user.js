#!/usr/bin/env node
/**
 * 创建测试用户脚本
 */
require('dotenv').config()
const mongoose = require('mongoose')
const User = require('./src/models/User')

const createTestUser = async () => {
  try {
    // 连接数据库
    console.log('🔗 连接 MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    })
    console.log('✅ MongoDB 已连接')
    
    // 检查用户是否已存在
    console.log('🔍 检查用户是否已存在...')
    let user = await User.findOne({ username: 'zcd' })
    
    if (user) {
      console.log('⚠️  用户已存在，更新密码...')
      user.password = 'asd123'
      user.nickname = '测试用户'
      user.userType = 'customer'
      await user.save()
      console.log('✅ 用户已更新')
    } else {
      console.log('➕ 创建新用户...')
      user = await User.create({
        username: 'zcd',
        password: 'asd123',
        nickname: '测试用户',
        userType: 'customer',
        email: 'zcd@test.com',
        phone: '13800138000'
      })
      console.log('✅ 用户已创建')
    }
    
    console.log('')
    console.log('📊 用户信息:')
    console.log(`  ID: ${user._id}`)
    console.log(`  用户名: ${user.username}`)
    console.log(`  昵称: ${user.nickname}`)
    console.log(`  邮箱: ${user.email}`)
    console.log(`  电话: ${user.phone}`)
    console.log(`  用户类型: ${user.userType}`)
    console.log('')
    
    console.log('✅ 完成！')
    console.log('')
    console.log('📝 登录信息:')
    console.log('  账号: zcd')
    console.log('  密码: asd123')
    
    process.exit(0)
  } catch (err) {
    console.error('❌ 错误:', err.message)
    process.exit(1)
  }
}

createTestUser()
