const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// MongoDB连接字符串
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://root:jqx26i46@e.mongo.sealoshzh.site:27017'

// 用户Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'designer', 'admin', 'super_admin'], default: 'customer' },
  email: String,
  phone: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

const User = mongoose.model('User', userSchema)

async function createAdminUser() {
  try {
    console.log('连接到 MongoDB...')
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'xiaodiyanxuan'
    })
    console.log('✅ 已连接到 MongoDB')

    // 检查是否已存在admin用户
    const existingAdmin = await User.findOne({ username: 'admin' })
    if (existingAdmin) {
      console.log('ℹ️  admin 用户已存在')
      console.log('用户名: admin')
      console.log('角色:', existingAdmin.role)
      
      // 更新密码
      const hashedPassword = await bcrypt.hash('admin123', 10)
      existingAdmin.password = hashedPassword
      existingAdmin.role = 'super_admin'
      await existingAdmin.save()
      console.log('✅ 已更新 admin 密码为: admin123')
    } else {
      // 创建新的admin用户
      const hashedPassword = await bcrypt.hash('admin123', 10)
      const adminUser = new User({
        username: 'admin',
        password: hashedPassword,
        role: 'super_admin',
        email: 'admin@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      await adminUser.save()
      console.log('✅ 成功创建 admin 用户')
    }

    console.log('\n📋 登录信息:')
    console.log('   用户名: admin')
    console.log('   密码: admin123')
    console.log('   角色: super_admin')
    console.log('\n🔗 登录地址: http://lgpzubdtdxjf.sealoshzh.site/login')

  } catch (error) {
    console.error('❌ 错误:', error)
  } finally {
    await mongoose.connection.close()
    console.log('\n✅ 数据库连接已关闭')
  }
}

createAdminUser()
