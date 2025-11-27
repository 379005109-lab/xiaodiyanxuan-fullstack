/**
 * 完整修复Favorite集合的所有unique索引
 */

const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xiaodiyanxuan'

async function fixAllFavoriteIndexes() {
  try {
    console.log('连接到MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ MongoDB连接成功\n')
    
    const db = mongoose.connection.db
    const collection = db.collection('favorites')
    
    console.log('查看当前所有索引...')
    const indexes = await collection.indexes()
    console.log('当前索引:', JSON.stringify(indexes, null, 2))
    console.log('\n')
    
    // 需要删除的unique索引列表
    const uniqueIndexesToDrop = []
    
    indexes.forEach(idx => {
      if (idx.unique && idx.name !== '_id_') {
        uniqueIndexesToDrop.push(idx.name)
      }
    })
    
    if (uniqueIndexesToDrop.length === 0) {
      console.log('✅ 没有找到需要删除的unique索引')
    } else {
      console.log(`找到 ${uniqueIndexesToDrop.length} 个unique索引需要删除:`)
      uniqueIndexesToDrop.forEach(name => console.log(`  - ${name}`))
      console.log('\n')
      
      for (const indexName of uniqueIndexesToDrop) {
        try {
          console.log(`正在删除索引: ${indexName}...`)
          await collection.dropIndex(indexName)
          console.log(`✅ ${indexName} 已删除\n`)
        } catch (err) {
          console.error(`❌ 删除 ${indexName} 失败:`, err.message)
        }
      }
    }
    
    // 重新创建必要的非unique索引
    console.log('重新创建必要的索引...')
    
    // userId索引
    try {
      await collection.createIndex({ userId: 1 })
      console.log('✅ userId 索引创建成功')
    } catch (err) {
      console.log('  (userId索引可能已存在)')
    }
    
    // userId + productId 非unique索引
    try {
      await collection.createIndex({ userId: 1, productId: 1 })
      console.log('✅ userId+productId 非unique索引创建成功')
    } catch (err) {
      console.log('  (userId+productId索引可能已存在)')
    }
    
    console.log('\n最终索引列表:')
    const finalIndexes = await collection.indexes()
    finalIndexes.forEach(idx => {
      const uniqueTag = idx.unique ? ' [UNIQUE]' : ''
      console.log(`  - ${idx.name}${uniqueTag}`)
      console.log(`    Keys: ${JSON.stringify(idx.key)}`)
    })
    
    console.log('\n✅ 所有索引修复完成！')
    console.log('现在用户可以收藏多个商品了\n')
    
  } catch (error) {
    console.error('\n❌ 修复失败:', error)
  } finally {
    await mongoose.disconnect()
    console.log('MongoDB连接已关闭')
    process.exit(0)
  }
}

fixAllFavoriteIndexes()
