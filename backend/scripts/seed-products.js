/**
 * 导入测试商品数据到数据库
 * 用法: node scripts/seed-products.js
 */
require('dotenv').config()
const mongoose = require('mongoose')
const Product = require('../src/models/Product')

const MONGODB_URI = process.env.MONGODB_URI

const testProducts = [
  {
    name: '意式极简真皮沙发客厅组合',
    description: '头层牛皮 · 高密度海绵 · 全实木框架，意大利设计师联名款',
    basePrice: 5999,
    originalPrice: 8999,
    thumbnail: 'https://picsum.photos/800/800?random=prod1',
    images: [
      'https://picsum.photos/800/800?random=prod1',
      'https://picsum.photos/800/800?random=prod1b',
      'https://picsum.photos/800/800?random=prod1c'
    ],
    category: '沙发',
    styles: ['意式轻奢', '现代简约'],
    tags: ['真皮', '客厅', '三人位'],
    stock: 50,
    sales: 326,
    views: 1520,
    status: 'active'
  },
  {
    name: '北欧实木餐桌椅组合一桌四椅',
    description: '白蜡木 · 环保水性漆 · 稳固承重，北欧匠心工艺',
    basePrice: 3299,
    originalPrice: 5299,
    thumbnail: 'https://picsum.photos/800/800?random=prod2',
    images: [
      'https://picsum.photos/800/800?random=prod2',
      'https://picsum.photos/800/800?random=prod2b'
    ],
    category: '餐桌',
    styles: ['北欧风', '原木风'],
    tags: ['实木', '餐厅', '一桌四椅'],
    stock: 30,
    sales: 218,
    views: 980,
    status: 'active'
  },
  {
    name: '轻奢岩板茶几电视柜组合',
    description: '天然岩板 · 不锈钢拉丝 · 大容量收纳，现代轻奢风格',
    basePrice: 2899,
    originalPrice: 4599,
    thumbnail: 'https://picsum.photos/800/800?random=prod3',
    images: [
      'https://picsum.photos/800/800?random=prod3',
      'https://picsum.photos/800/800?random=prod3b'
    ],
    category: '茶几',
    styles: ['轻奢风', '现代简约'],
    tags: ['岩板', '客厅', '收纳'],
    stock: 45,
    sales: 185,
    views: 860,
    status: 'active'
  },
  {
    name: '现代简约实木双人床1.8米',
    description: '进口橡木 · 静音排骨架 · 环保认证，舒适睡眠体验',
    basePrice: 4599,
    originalPrice: 6999,
    thumbnail: 'https://picsum.photos/800/800?random=prod4',
    images: [
      'https://picsum.photos/800/800?random=prod4',
      'https://picsum.photos/800/800?random=prod4b'
    ],
    category: '床',
    styles: ['现代简约'],
    tags: ['实木', '卧室', '双人床', '1.8米'],
    stock: 25,
    sales: 412,
    views: 2100,
    status: 'active'
  },
  {
    name: '奶油风布艺沙发小户型',
    description: '可拆洗 · 乳胶填充 · 猫抓布面料，小空间大舒适',
    basePrice: 3599,
    originalPrice: 5599,
    thumbnail: 'https://picsum.photos/800/800?random=prod5',
    images: [
      'https://picsum.photos/800/800?random=prod5',
      'https://picsum.photos/800/800?random=prod5b'
    ],
    category: '沙发',
    styles: ['奶油风', '北欧风'],
    tags: ['布艺', '小户型', '可拆洗'],
    stock: 60,
    sales: 156,
    views: 750,
    status: 'active'
  },
  {
    name: '全实木书桌书架一体',
    description: '橡胶木 · 大桌面 · 多层收纳，学习办公两相宜',
    basePrice: 1899,
    originalPrice: 2899,
    thumbnail: 'https://picsum.photos/800/800?random=prod6',
    images: [
      'https://picsum.photos/800/800?random=prod6',
      'https://picsum.photos/800/800?random=prod6b'
    ],
    category: '书桌',
    styles: ['现代简约', '北欧风'],
    tags: ['实木', '书房', '收纳'],
    stock: 40,
    sales: 89,
    views: 620,
    status: 'active'
  },
  {
    name: '意式轻奢床头柜皮质',
    description: '超纤皮 · 静音抽屉 · 金属脚，精致卧室点缀',
    basePrice: 899,
    originalPrice: 1399,
    thumbnail: 'https://picsum.photos/800/800?random=prod7',
    images: [
      'https://picsum.photos/800/800?random=prod7'
    ],
    category: '床头柜',
    styles: ['意式轻奢'],
    tags: ['皮质', '卧室', '收纳'],
    stock: 80,
    sales: 267,
    views: 530,
    status: 'active'
  },
  {
    name: '北欧风实木衣柜推拉门',
    description: '白蜡木 · 大空间收纳 · 静音滑轨，衣物井然有序',
    basePrice: 4299,
    originalPrice: 6599,
    thumbnail: 'https://picsum.photos/800/800?random=prod8',
    images: [
      'https://picsum.photos/800/800?random=prod8',
      'https://picsum.photos/800/800?random=prod8b'
    ],
    category: '衣柜',
    styles: ['北欧风'],
    tags: ['实木', '卧室', '推拉门', '大容量'],
    stock: 20,
    sales: 134,
    views: 890,
    status: 'active'
  },
  {
    name: '现代简约圆形餐桌岩板',
    description: '岩板桌面 · 转盘设计 · 碳钢底座，聚餐好帮手',
    basePrice: 2199,
    originalPrice: 3299,
    thumbnail: 'https://picsum.photos/800/800?random=prod9',
    images: [
      'https://picsum.photos/800/800?random=prod9'
    ],
    category: '餐桌',
    styles: ['现代简约'],
    tags: ['岩板', '餐厅', '圆桌', '转盘'],
    stock: 35,
    sales: 98,
    views: 470,
    status: 'active'
  },
  {
    name: '高端乳胶弹簧床垫1.8m',
    description: '泰国乳胶 · 独立袋装弹簧 · 透气面料，深度好眠',
    basePrice: 2699,
    originalPrice: 4599,
    thumbnail: 'https://picsum.photos/800/800?random=prod10',
    images: [
      'https://picsum.photos/800/800?random=prod10',
      'https://picsum.photos/800/800?random=prod10b'
    ],
    category: '床垫',
    styles: ['现代简约'],
    tags: ['乳胶', '弹簧', '卧室', '1.8米'],
    stock: 55,
    sales: 345,
    views: 1680,
    status: 'active'
  }
]

async function seed() {
  try {
    console.log('连接数据库...')
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'xiaodiyanxuan'
    })
    console.log('✅ 已连接')

    const existing = await Product.countDocuments()
    console.log(`当前商品数量: ${existing}`)

    if (existing > 0) {
      console.log('⚠️  数据库已有商品，跳过导入。如需重新导入，请先清空 products 集合。')
      await mongoose.disconnect()
      return
    }

    const result = await Product.insertMany(testProducts)
    console.log(`✅ 成功导入 ${result.length} 条测试商品`)
    result.forEach(p => {
      console.log(`   - ${p.name} (¥${p.basePrice})`)
    })

    await mongoose.disconnect()
    console.log('✅ 完成')
  } catch (err) {
    console.error('❌ 导入失败:', err.message)
    process.exit(1)
  }
}

seed()
