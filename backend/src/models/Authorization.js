const mongoose = require('mongoose')

/**
 * 授权模型
 * 用于管理厂家之间、厂家与设计师之间的商品授权和价格设置
 */
const authorizationSchema = new mongoose.Schema({
  // 授权方（厂家）
  fromManufacturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manufacturer',
    required: true
  },
  
  // 被授权方
  toManufacturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manufacturer'
  },
  toDesigner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'  // 设计师用户
  },
  
  // 授权类型
  authorizationType: {
    type: String,
    enum: ['manufacturer', 'designer'],  // 授权给厂家或设计师
    required: true
  },
  
  // 授权商品范围
  scope: {
    type: String,
    enum: ['all', 'category', 'specific', 'mixed'],  // 全部商品、按分类、指定商品
    default: 'all'
  },
  
  // 授权的分类（当scope='category'时）
  categories: [String],
  
  // 授权的具体商品（当scope='specific'时）
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  // 最低折扣率（百分比，如 85 表示 85%）
  minDiscountRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // 返佣比例（百分比，如 10 表示 10%）
  commissionRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // 授权价格设置（基于原价的折扣率）
  priceSettings: {
    // 全局折扣率（如果设置了，优先级最高）
    globalDiscount: {
      type: Number,
      min: 0,
      max: 1,
      default: 1  // 1表示原价，0.85表示85折
    },
    
    // 按分类设置折扣
    categoryDiscounts: [{
      category: String,
      discount: {
        type: Number,
        min: 0,
        max: 1
      }
    }],
    
    // 按具体商品设置价格
    productPrices: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      price: Number,  // 授权价格
      discount: Number  // 或者使用折扣率
    }]
  },
  
  // 授权状态
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'revoked'],
    default: 'active'
  },
  
  // 是否启用（控制商品在商城中的显示）
  isEnabled: {
    type: Boolean,
    default: true
  },
  
  // 商品覆盖设置（价格、可见性）
  productOverrides: {
    type: Map,
    of: {
      price: Number,
      hidden: Boolean
    },
    default: {}
  },
  
  // 授权有效期
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: Date,  // 如果为空，表示永久有效
  
  // 备注说明
  notes: String,
  
  // 授权商品保存的文件夹分类（授权通过后，接收方需要指定保存位置）
  savedToFolderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  savedToFolderName: String,  // 冗余字段，方便显示
  isFolderSelected: {
    type: Boolean,
    default: false  // 是否已选择保存文件夹
  },
  
  // 创建和更新时间
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // 创建人
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
})

// 索引优化
authorizationSchema.index({ fromManufacturer: 1, status: 1 })
authorizationSchema.index({ toManufacturer: 1, status: 1 })
authorizationSchema.index({ toDesigner: 1, status: 1 })
authorizationSchema.index({ status: 1, validUntil: 1 })

// 虚拟字段：是否已过期
authorizationSchema.virtual('isExpired').get(function() {
  if (!this.validUntil) return false
  return new Date() > this.validUntil
})

// 虚拟字段：是否有效
authorizationSchema.virtual('isValid').get(function() {
  return this.status === 'active' && !this.isExpired
})

// 方法：获取商品的授权价格
authorizationSchema.methods.getAuthorizedPrice = function(product) {
  // 1. 优先检查具体商品价格
  const productPrice = this.priceSettings.productPrices.find(
    p => p.productId.toString() === product._id.toString()
  )
  if (productPrice) {
    return productPrice.price || (product.basePrice * productPrice.discount)
  }
  
  // 2. 检查分类折扣
  if (product.category) {
    const categoryDiscount = this.priceSettings.categoryDiscounts.find(
      c => c.category === product.category
    )
    if (categoryDiscount) {
      return product.basePrice * categoryDiscount.discount
    }
  }
  
  // 3. 使用全局折扣
  return product.basePrice * this.priceSettings.globalDiscount
}

// 静态方法：检查用户对商品的授权
authorizationSchema.statics.checkAuthorization = async function(userId, productId, userType) {
  const query = {
    status: 'active',
    $or: [
      { validUntil: { $exists: false } },
      { validUntil: { $gt: new Date() } }
    ]
  }
  
  if (userType === 'manufacturer') {
    query.toManufacturer = userId
  } else if (userType === 'designer') {
    query.toDesigner = userId
  }
  
  // 查找匹配的授权
  const authorizations = await this.find(query)
    .populate('fromManufacturer')
    .lean()
  
  // 检查商品是否在授权范围内
  for (const auth of authorizations) {
    if (auth.scope === 'all') return auth
    if (auth.scope === 'category' && auth.categories.includes(productId.category)) return auth
    if (auth.scope === 'specific' && auth.products.some(p => p.toString() === productId.toString())) return auth
  }
  
  return null
}

module.exports = mongoose.model('Authorization', authorizationSchema)
