const mongoose = require('mongoose');
require('dotenv').config();

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB 连接成功');
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error);
    process.exit(1);
  }
};

// Authorization 模型
const authorizationSchema = new mongoose.Schema({
  minDiscountRate: { type: Number, min: 0, max: 100 },
  commissionRate: { type: Number, min: 0, max: 100 },
}, { strict: false });

const Authorization = mongoose.model('Authorization', authorizationSchema);

const updateAuthDefaults = async () => {
  await connectDB();
  
  try {
    // 查找所有缺少 minDiscountRate 或 commissionRate 的授权记录
    const authsToUpdate = await Authorization.find({
      $or: [
        { minDiscountRate: { $exists: false } },
        { minDiscountRate: null },
        { minDiscountRate: 0 },
        { commissionRate: { $exists: false } },
        { commissionRate: null },
        { commissionRate: 0 }
      ]
    });
    
    console.log(`📊 找到 ${authsToUpdate.length} 条需要更新的授权记录`);
    
    if (authsToUpdate.length === 0) {
      console.log('✅ 所有授权记录已有折扣和返佣值');
      process.exit(0);
    }
    
    // 批量更新
    const result = await Authorization.updateMany(
      {
        $or: [
          { minDiscountRate: { $exists: false } },
          { minDiscountRate: null },
          { minDiscountRate: 0 },
          { commissionRate: { $exists: false } },
          { commissionRate: null },
          { commissionRate: 0 }
        ]
      },
      {
        $set: {
          minDiscountRate: 85,  // 默认 85% 折扣
          commissionRate: 10   // 默认 10% 返佣
        }
      }
    );
    
    console.log(`✅ 已更新 ${result.modifiedCount} 条授权记录`);
    console.log('   - 默认折扣率: 85%');
    console.log('   - 默认返佣率: 10%');
    
    // 验证更新结果
    const sample = await Authorization.findOne({
      minDiscountRate: 85,
      commissionRate: 10
    });
    
    if (sample) {
      console.log('\n📋 示例记录:');
      console.log(`   ID: ${sample._id}`);
      console.log(`   折扣率: ${sample.minDiscountRate}%`);
      console.log(`   返佣率: ${sample.commissionRate}%`);
    }
    
  } catch (error) {
    console.error('❌ 更新失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 数据库连接已关闭');
    process.exit(0);
  }
};

updateAuthDefaults();
