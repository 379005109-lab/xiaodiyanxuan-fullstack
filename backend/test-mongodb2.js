const mongoose = require('mongoose')

// 尝试不同的连接字符串
const uris = [
  'mongodb://root:g7d6ckdq@jianron-mongodb.ns-cxxiwxce.svc:27017/xiaodiyanxuan',
  'mongodb://root:g7d6ckdq@jianron-mongodb.ns-cxxiwxce.svc:27017/xiaodiyanxuan?authSource=admin',
  'mongodb://root:g7d6ckdq@jianron-mongodb.ns-cxxiwxce.svc:27017/?authSource=admin'
]

async function testConnection(uri) {
  console.log('Testing: ' + uri)
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000
    })
    console.log('SUCCESS\!')
    mongoose.connection.close()
    return true
  } catch (err) {
    console.log('FAILED: ' + err.message)
    return false
  }
}

async function main() {
  for (const uri of uris) {
    const success = await testConnection(uri)
    if (success) {
      console.log('\nConnected with: ' + uri)
      process.exit(0)
    }
    console.log('')
  }
  console.log('All connections failed')
  process.exit(1)
}

main()
