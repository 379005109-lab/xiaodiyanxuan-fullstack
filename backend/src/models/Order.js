const mongoose = require('mongoose')
const { ORDER_STATUS } = require('../config/constants')

const orderSchema = new mongoose.Schema({
  orderNo: { type: String, unique: true, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // 订单归属厂家（下单用户的厂家）
  ownerManufacturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer' },
  
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
  
  // 结算模式: supplier_transfer=供应商调货(一键到底), commission_mode=返佣模式
  settlementMode: { type: String, enum: ['supplier_transfer', 'commission_mode', null], default: null },
  
  // 价格计算相关字段
  originalPrice: { type: Number, default: 0 },          // 原价（商城标价）
  minDiscountRate: { type: Number, default: 0.6 },      // 最低折扣率（如0.6表示60%）
  commissionRate: { type: Number, default: 0.4 },       // 返佣率（如0.4表示40%）
  minDiscountPrice: { type: Number, default: 0 },       // 最低折扣价 = 原价 × 最低折扣率
  commissionAmount: { type: Number, default: 0 },       // 返佣金额 = 最低折扣价 × 返佣率
  supplierPrice: { type: Number, default: 0 },          // 供应商价格（一键到底）= 最低折扣价 - 返佣金额
  
  // 返佣申请状态（返佣模式下使用）
  commissionStatus: { type: String, enum: ['pending', 'applied', 'approved', 'paid', null], default: null },
  commissionAppliedAt: Date,     // 返佣申请时间
  commissionApprovedAt: Date,    // 返佣审批时间
  commissionPaidAt: Date,        // 返佣发放时间
  
  // 付款比例功能
  paymentRatioEnabled: { type: Boolean, default: false },  // 是否启用分期付款
  paymentRatio: { type: Number, default: 100 },  // 首付比例（如50表示50%）
  firstPaymentAmount: { type: Number, default: 0 },  // 首付金额
  remainingPaymentAmount: { type: Number, default: 0 },  // 剩余应付金额
  remainingPaymentStatus: { type: String, enum: ['pending', 'paid', null], default: null },  // 尾款支付状态
  remainingPaymentPaidAt: Date,  // 尾款支付时间
  remainingPaymentRemindedAt: Date,  // 尾款提醒时间
  
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
