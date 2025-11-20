require('dotenv').config()
const mongoose = require('mongoose')
const Category = require('../src/models/Category')
const Style = require('../src/models/Style')
const Product = require('../src/models/Product')
const Coupon = require('../src/models/Coupon')

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    console.log('✅ MongoDB 已连接')

    // 清空现有数据
    await Category.deleteMany({})
    await Style.deleteMany({})
    await Product.deleteMany({})
    await Coupon.deleteMany({})
    console.log('🗑️  已清空现有数据')

    // 创建分类
    const categories = await Category.insertMany([
      { name: '沙发', description: '舒适的沙发系列', order: 1, status: 'active' },
      { name: '床', description: '高质量的床铺', order: 2, status: 'active' },
      { name: '餐桌', description: '优雅的餐桌', order: 3, status: 'active' },
      { name: '椅子', description: '舒适的椅子', order: 4, status: 'active' },
      { name: '柜子', description: '实用的柜子', order: 5, status: 'active' },
      { name: '茶几', description: '精致的茶几', order: 6, status: 'active' }
    ])
    console.log(`✅ 已创建 ${categories.length} 个分类`)

    // 创建风格
    const styles = await Style.insertMany([
      { name: '现代', description: '现代简约风格', order: 1, status: 'active' },
      { name: '北欧', description: '北欧风格', order: 2, status: 'active' },
      { name: '中式', description: '中式风格', order: 3, status: 'active' },
      { name: '欧式', description: '欧式风格', order: 4, status: 'active' },
      { name: '日式', description: '日式风格', order: 5, status: 'active' },
      { name: '工业', description: '工业风格', order: 6, status: 'active' }
    ])
    console.log(`✅ 已创建 ${styles.length} 个风格`)

    // 创建商品
    const products = await Product.insertMany([
      {
        name: '舒适布艺沙发',
        code: 'SOFA001',
        description: '高质量布艺沙发，舒适耐用',
        basePrice: 2999,
        stock: 50,
        thumbnail: 'https://via.placeholder.com/300x300?text=Sofa',
        images: ['https://via.placeholder.com/600x600?text=Sofa1'],
        category: { id: categories[0]._id, name: categories[0].name },
        style: { id: styles[0]._id, name: styles[0].name },
        specifications: {
          sizes: [
            { id: 'S1', name: '2人座', priceExtra: 0 },
            { id: 'S2', name: '3人座', priceExtra: 500 },
            { id: 'S3', name: '4人座', priceExtra: 1000 }
          ],
          materials: [
            { id: 'M1', name: '棉麻布', priceExtra: 0, colors: ['灰色', '米色', '黑色'] },
            { id: 'M2', name: '皮革', priceExtra: 500, colors: ['黑色', '棕色'] }
          ],
          fills: [
            { id: 'F1', name: '海绵', priceExtra: 0 },
            { id: 'F2', name: '羽毛', priceExtra: 300 }
          ],
          frames: [
            { id: 'FR1', name: '木框', priceExtra: 0 },
            { id: 'FR2', name: '钢框', priceExtra: 200 }
          ],
          legs: [
            { id: 'L1', name: '木腿', priceExtra: 0 },
            { id: 'L2', name: '金属腿', priceExtra: 150 }
          ]
        },
        sales: 120,
        views: 5000,
        status: 'active'
      },
      {
        name: '现代简约床',
        code: 'BED001',
        description: '简约现代风格床，舒适睡眠',
        basePrice: 1999,
        stock: 30,
        thumbnail: 'https://via.placeholder.com/300x300?text=Bed',
        images: ['https://via.placeholder.com/600x600?text=Bed1'],
        category: { id: categories[1]._id, name: categories[1].name },
        style: { id: styles[0]._id, name: styles[0].name },
        specifications: {
          sizes: [
            { id: 'S1', name: '单人床', priceExtra: 0 },
            { id: 'S2', name: '双人床', priceExtra: 500 }
          ],
          materials: [
            { id: 'M1', name: '实木', priceExtra: 0 },
            { id: 'M2', name: '板材', priceExtra: -300 }
          ],
          fills: [],
          frames: [],
          legs: []
        },
        sales: 80,
        views: 3000,
        status: 'active'
      },
      {
        name: '北欧餐桌',
        code: 'TABLE001',
        description: '北欧风格餐桌，适合家庭聚餐',
        basePrice: 1599,
        stock: 25,
        thumbnail: 'https://via.placeholder.com/300x300?text=Table',
        images: ['https://via.placeholder.com/600x600?text=Table1'],
        category: { id: categories[2]._id, name: categories[2].name },
        style: { id: styles[1]._id, name: styles[1].name },
        specifications: {
          sizes: [
            { id: 'S1', name: '4人', priceExtra: 0 },
            { id: 'S2', name: '6人', priceExtra: 400 },
            { id: 'S3', name: '8人', priceExtra: 800 }
          ],
          materials: [
            { id: 'M1', name: '橡木', priceExtra: 0 },
            { id: 'M2', name: '胡桃木', priceExtra: 300 }
          ],
          fills: [],
          frames: [],
          legs: []
        },
        sales: 60,
        views: 2500,
        status: 'active'
      }
    ])
    console.log(`✅ 已创建 ${products.length} 个商品`)

    // 创建优惠券
    const now = new Date()
    const coupons = await Coupon.insertMany([
      {
        code: 'WELCOME100',
        type: 'fixed',
        value: 100,
        minAmount: 500,
        maxAmount: 999999,
        description: '新用户欢迎优惠券',
        validFrom: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        validTo: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        usageLimit: 1000,
        usageCount: 0,
        status: 'active'
      },
      {
        code: 'DISCOUNT20',
        type: 'percentage',
        value: 20,
        minAmount: 1000,
        maxAmount: 999999,
        description: '满减优惠券 - 20% 折扣',
        validFrom: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        validTo: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        usageLimit: 500,
        usageCount: 0,
        status: 'active'
      },
      {
        code: 'SUMMER50',
        type: 'fixed',
        value: 50,
        minAmount: 300,
        maxAmount: 999999,
        description: '夏季优惠券',
        validFrom: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        validTo: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        usageLimit: 2000,
        usageCount: 0,
        status: 'active'
      }
    ])
    console.log(`✅ 已创建 ${coupons.length} 个优惠券`)

    console.log('\n✨ 数据初始化完成！')
    process.exit(0)
  } catch (err) {
    console.error('❌ 错误:', err.message)
    process.exit(1)
  }
}

seedData()
