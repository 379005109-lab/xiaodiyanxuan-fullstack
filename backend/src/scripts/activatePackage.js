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

// 激活套餐
const activatePackages = async () => {
  try {
    // 查看所有套餐
    const allPackages = await Package.find({});
    console.log('📊 所有套餐:');
    allPackages.forEach((pkg, index) => {
      console.log(`  ${index + 1}. ${pkg.name} (${pkg.status}) - ID: ${pkg._id}`);
    });
    
    // 将第一个套餐设为active
    if (allPackages.length > 0) {
      const firstPackage = allPackages[0];
      firstPackage.status = 'active';
      await firstPackage.save();
      console.log(`✅ 套餐"${firstPackage.name}"已设为active状态`);
    }
    
    // 再次查看状态
    const updatedPackages = await Package.find({});
    console.log('📊 更新后的套餐状态:');
    updatedPackages.forEach((pkg, index) => {
      console.log(`  ${index + 1}. ${pkg.name} (${pkg.status})`);
    });
    
  } catch (error) {
    console.error('❌ 激活套餐失败:', error);
  }
};

// 主函数
const main = async () => {
  await connectDB();
  await activatePackages();
  mongoose.connection.close();
  console.log('🔚 脚本执行完成');
};

main();
