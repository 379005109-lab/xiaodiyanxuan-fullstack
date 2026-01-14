const mongoose = require('mongoose')
const { ORDER_STATUS } = require('../config/constants')

const orderSchema = new mongoose.Schema({
  orderNo: { type: String, unique: true, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // 订单类型：product=普通商品订单, package=套餐订单
  orderType: { type: String, enum: ['product', 'package'], default: 'product' },
  
  // 普通商品订单的items
  items: [{
    productId: String,
    productName: String,
    manufacturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer' },
    manufacturerName: String,
    image: String,  // 商品图片
    price: Number,
    quantity: Number,
    specifications: { size: String, material: String, color: String, fill: String, frame: String, leg: String },
    selectedMaterials: { fabric: String, filling: String, frame: String, leg: String },  // 用户选择的材质
    materialUpgradePrices: mongoose.Schema.Types.Mixed,  // 材质升级价格 { '半青皮-蓝色': 500 }
    subtotal: Number
  }],
  
  // 套餐订单专用字段
  packageInfo: {
    packageId: String,
    packageName: String,
    packagePrice: Number,
    selections: [{
      categoryKey: String,
      categoryName: String,
      required: Number,  // 该分类需要选择的数量
      products: [{
        productId: String,
        productName: String,
        manufacturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer' },
        manufacturerName: String,
        image: String,  // 商品图片
        quantity: Number,
        materials: mongoose.Schema.Types.Mixed,  // 材质选择 { fabric: '半青皮-蓝色' }
        materialUpgrade: Number  // 材质升级费用
      }]
    }]
  },
  
  subtotal: Number,
  discountAmount: { type: Number, default: 0 },
  totalAmount: Number,
  priceModified: { type: Boolean, default: false },
  priceModifyHistory: [{
    originalAmount: Number,
    newAmount: Number,
    reason: String,
    priceMode: { type: String, enum: ['flat', 'itemized', null], default: null },
    itemPrices: mongoose.Schema.Types.Mixed,
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    modifiedAt: { type: Date, default: Date.now }
  }],
  recipient: { name: String, phone: String, address: String },
  status: { type: Number, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.PENDING_PAYMENT },
  couponCode: String,
  notes: String,
  // 支付信息
  paymentMethod: String, // wechat, alipay, bank
  // 物流信息
  shippingCompany: String,
  trackingNumber: String,
  createdAt: { type: Date, default: Date.now },
  paidAt: Date,
  shippedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  updatedAt: { type: Date, default: Date.now },
  // 软删除字段
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // 取消请求字段（需要管理后台确认）
  cancelRequest: { type: Boolean, default: false },
  cancelRequestedAt: Date,
  // 商家备注
  adminNote: { type: String, default: '' },
  // 退款关联
  refundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Refund' },
  refundStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'completed', null], default: null },
  // 订单分发状态
  dispatchStatus: { type: String, enum: ['pending', 'dispatched', null], default: null },
  dispatchedAt: Date,
  // 分层返佣计算结果
  commissions: [{
    accountId: String,           // 账号ID（TierSystem.authorizedAccounts 中的 _id）
    userId: String,              // 用户ID
    username: String,            // 用户名
    nickname: String,            // 昵称
    depth: Number,               // 层级深度（0=下单者自己，1=直接上级，2=上级的上级...）
    commissionRate: Number,      // 返佣比例（0-1）
    commissionAmount: Number,    // 返佣金额（元）
    tierCompanyId: String,       // 所属公司ID
    tierCompanyName: String,     // 所属公司名称
    calculatedAt: { type: Date, default: Date.now }
  }]
})

orderSchema.index({ userId: 1 })
orderSchema.index({ orderNo: 1 })
orderSchema.index({ status: 1 })
orderSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Order', orderSchema)
