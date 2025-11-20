const mongoose = require('mongoose')

const MONGODB_URI = 'mongodb://root:g7d6ckdq@jianron-mongodb.ns-cxxiwxce.svc:27017/xiaodiyanxuan'

console.log('Testing MongoDB connection...')
console.log('URI: ' + MONGODB_URI)
console.log('')

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 10000
})
  .then(() => {
    console.log('SUCCESS: MongoDB connected\!')
    console.log('Database: ' + mongoose.connection.db.databaseName)
    console.log('Host: ' + mongoose.connection.host)
    console.log('Port: ' + mongoose.connection.port)
    
    mongoose.connection.db.listCollections().toArray((err, collections) => {
      if (err) {
        console.error('Error listing collections: ' + err.message)
      } else {
        console.log('Collections: ' + collections.length)
        collections.forEach(col => {
          console.log('  - ' + col.name)
        })
      }
      mongoose.connection.close()
      process.exit(0)
    })
  })
  .catch(err => {
    console.error('FAILED: MongoDB connection error\!')
    console.error('Error: ' + err.message)
    console.error('Code: ' + err.code)
    process.exit(1)
  })

setTimeout(() => {
  console.error('TIMEOUT: Connection timeout')
  process.exit(1)
}, 15000)
