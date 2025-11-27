/**
 * 修复Favorite集合的索引问题
 * 删除unique索引，允许用户收藏多个商品
 */

const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xiaodiyanxuan'

async function fixFavoriteIndex() {
  try {
    console.log('连接到MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ MongoDB连接成功')
    
    const db = mongoose.connection.db
    const collection = db.collection('favorites')
    
    console.log('\n查看当前索引...')
    const indexes = await collection.indexes()
    console.log('当前索引:', JSON.stringify(indexes, null, 2))
    
    // 查找并删除userId+productId的unique索引
    const uniqueIndexName = 'userId_1_productId_1'
    const hasUniqueIndex = indexes.some(idx => idx.name === uniqueIndexName && idx.unique === true)
    
    if (hasUniqueIndex) {
      console.log(`\n找到unique索引: ${uniqueIndexName}`)
      console.log('正在删除...')
      await collection.dropIndex(uniqueIndexName)
      console.log('✅ unique索引已删除')
      
      // 重新创建非unique索引
      console.log('\n重新创建非unique索引...')
      await collection.createIndex({ userId: 1, productId: 1 })
      console.log('✅ 非unique索引创建成功')
    } else {
      console.log(`\n未找到unique索引 ${uniqueIndexName}，可能已经修复`)
    }
    
    console.log('\n最终索引列表:')
    const finalIndexes = await collection.indexes()
    console.log(JSON.stringify(finalIndexes, null, 2))
    
    console.log('\n✅ 索引修复完成！')
    console.log('现在用户可以收藏多个商品了')
    
  } catch (error) {
    console.error('❌ 修复失败:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\nMongoDB连接已关闭')
    process.exit(0)
  }
}

// 运行修复
fixFavoriteIndex()
