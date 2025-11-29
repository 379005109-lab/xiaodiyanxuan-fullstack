const mongoose = require('mongoose');
const Package = require('../models/Package');
require('dotenv').config();

// 连接数据库
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('🔗 连接数据库:', mongoUri ? mongoUri.replace(/\/\/.*@/, '//***:***@') : '未配置');
    
    await mongoose.connect(mongoUri);
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
};

// 创建测试套餐
const createTestPackage = async () => {
  try {
    // 检查是否已有套餐
    const existingPackages = await Package.find({});
    console.log('📊 现有套餐数量:', existingPackages.length);
    
    if (existingPackages.length > 0) {
      console.log('📋 现有套餐列表:');
      existingPackages.forEach((pkg, index) => {
        console.log(`  ${index + 1}. ${pkg.name} (${pkg.status}) - 创建时间: ${pkg.createdAt}`);
      });
      return;
    }
    
    // 创建测试套餐
    const testPackage = new Package({
      name: '测试套餐',
      description: '这是一个测试套餐',
      basePrice: 5999,
      status: 'active',
      products: [],
      categories: []
    });
    
    await testPackage.save();
    console.log('✅ 测试套餐创建成功:', testPackage.name);
    
    // 再次检查
    const allPackages = await Package.find({});
    console.log('📊 创建后套餐总数:', allPackages.length);
    
  } catch (error) {
    console.error('❌ 创建测试套餐失败:', error);
  }
};

// 主函数
const main = async () => {
  await connectDB();
  await createTestPackage();
  mongoose.connection.close();
  console.log('🔚 脚本执行完成');
};

main();
