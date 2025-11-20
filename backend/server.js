require('dotenv').config()
const mongoose = require('mongoose')
const app = require('./src/app')

const PORT = process.env.PORT || 8080

// 连接 MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    })
    console.log('✅ MongoDB 已连接')
  } catch (err) {
    console.warn('⚠️  MongoDB 连接失败:', err.message)
    console.warn('⚠️  服务器将在没有数据库的情况下启动')
  }
}

// 启动服务器
const startServer = async () => {
  await connectDB()
  
  app.listen(PORT, () => {
    console.log(`🚀 服务器运行在端口 ${PORT}`)
    console.log(`📝 环境: ${process.env.NODE_ENV}`)
    console.log(`🔗 数据库: ${process.env.MONGODB_URI}`)
    console.log(`📍 健康检查: http://localhost:${PORT}/health`)
  })
}

startServer()

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n📛 收到关闭信号，正在关闭...')
  mongoose.connection.close()
  process.exit(0)
})
