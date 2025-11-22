// 删除 Category 集合中的 slug 索引
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xiaodiyanxuan';

async function fixCategoryIndex() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 连接到 MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('categories');

    // 获取所有索引
    const indexes = await collection.indexes();
    console.log('\n📋 当前索引:', JSON.stringify(indexes, null, 2));

    // 删除 slug 索引
    try {
      await collection.dropIndex('slug_1');
      console.log('\n✅ 成功删除 slug_1 索引');
    } catch (err) {
      if (err.code === 27) {
        console.log('\n⚠️  slug_1 索引不存在');
      } else {
        console.error('\n❌ 删除索引失败:', err.message);
      }
    }

    // 确认结果
    const newIndexes = await collection.indexes();
    console.log('\n📋 删除后的索引:', JSON.stringify(newIndexes, null, 2));

    console.log('\n🎉 完成！');
    process.exit(0);
  } catch (err) {
    console.error('❌ 错误:', err);
    process.exit(1);
  }
}

fixCategoryIndex();
