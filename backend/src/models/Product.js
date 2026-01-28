const mongoose = require('mongoose')
const { PRODUCT_STATUS } = require('../config/constants')

const materialDescriptionOptionSchema = new mongoose.Schema({
  id: String,
  text: String
}, { _id: false })

// SKU子文档Schema
const skuSchema = new mongoose.Schema({
  code: String,
  spec: String,
  color: String,
  // 面料选择（单选，关联materialsGroups）
  fabricMaterialId: String, // 关联的材质分组ID
  fabricName: String, // 面料名称（如：纳帕皮A+黑色）
  fabricImage: String, // 面料缩略图（材质库图片）
  materialDescriptionId: String, // 关联商品的材质描述选项ID
  // 其他材质（文字+图片）
  otherMaterials: String, // 其他材质描述（如：蛇形弹簧+45D海绵+不锈钢支撑脚）
  otherMaterialsImage: String, // 其他材质图片
  material: mongoose.Schema.Types.Mixed, // 支持字符串或对象 {fabric, filling, frame, leg}
  materialId: String,
  materialCategories: [String], // 已配置的材质类目列表
  materialUpgradePrices: mongoose.Schema.Types.Mixed,
  materialImages: mongoose.Schema.Types.Mixed,
  materialDescriptions: mongoose.Schema.Types.Mixed,
  // 库存模式
  stockMode: { type: Boolean, default: true }, // true=有库存模式，false=定制模式
  stock: { type: Number, default: 0 }, // 库存数量
  deliveryDays: { type: Number, default: 7 }, // 发货天数（库存模式）
  productionDays: { type: Number, default: 30 }, // 制作天数（定制模式）
  deliveryNote: String, // 发货备注（如"现货"、"预售15天"等）
  arrivalDate: Date, // 到货时间
  price: { type: Number, default: 0 },
  costPrice: { type: Number, default: 0 },
  discountPrice: Number,
  videos: [String], // SKU视频
  images: [String],
  effectImages: [String], // 效果图/渲染图
  files: [mongoose.Schema.Types.Mixed], // SKU专属文件 {name, url, size, type}
  length: Number,
  width: Number,
  height: Number,
  // 包装信息
  packageVolume: String, // 包装体积（如：0.5m³）
  packageCount: { type: Number, default: 1 }, // 包装件数
  isPro: { type: Boolean, default: false },
  proFeature: String,
  status: { type: Boolean, default: true },
  sales: { type: Number, default: 0 },
  manufacturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer' },
  manufacturerName: String // 冗余字段，方便显示
}, { _id: true })

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  productCode: String,
  code: { type: String, unique: true, sparse: true },
  subCodes: [String], // 副编号数组
  description: String,
  basePrice: { type: Number, required: true },
  manufacturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer' },
  authorizedLabelPrices: mongoose.Schema.Types.Mixed,
  stock: { type: Number, default: 0 },
  thumbnail: String,
  images: [String],
  videos: [String], // 视频URL数组
  videoTitles: [String], // 视频标题数组，与videos一一对应
  files: [mongoose.Schema.Types.Mixed], // 设计文件数组 {name, url, size}
  category: mongoose.Schema.Types.Mixed, // 支持字符串ID或对象
  style: mongoose.Schema.Types.Mixed,
  styles: [String], // 多个风格标签（现代风、轻奢风等）
  manufacturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer' },
  manufacturerName: String, // 冗余字段，方便显示
  specifications: mongoose.Schema.Types.Mixed,
  skus: [skuSchema], // SKU数组
  materialsGroups: [{ // 材质分组数据
    name: String,
    extra: { type: Number, default: 0 },
    better: { type: Boolean, default: false },
    img: String,
    colors: [{
      name: String,
      img: String
    }]
  }],
  // 材质配置（面料选择 + 其他材质）
  materialConfigs: [{
    id: String,
    fabricName: String, // 面料名称（从材质库选择）
    fabricId: String, // 材质库ID
    images: [String], // 该材质对应的图片组
    price: { type: Number, default: 0 } // 加价金额
  }],
  materialDescriptionOptions: [materialDescriptionOptionSchema],
  otherMaterialsText: String, // 其他材质（固定文字，如：蛇形弹簧+45D海绵+不锈钢脚）
  otherMaterialsImage: String, // 其他材质图片
  materialImages: mongoose.Schema.Types.Mixed, // 材质图片 { categoryName: [{name, url}] }
  materialCategories: [String], // 材质类目列表
  // 系列信息
  series: String, // 系列名称
  seriesImage: String, // 系列图片
  tags: [String],
  isCombo: { type: Boolean, default: false },
  comboItems: [String],
  sales: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
  status: { type: String, enum: Object.values(PRODUCT_STATUS), default: PRODUCT_STATUS.ACTIVE },
  // 产品拥有者权限相关字段
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 产品拥有者（上传者）
  ownerName: String, // 拥有者名称（冗余字段）
  pricingMode: { 
    type: String, 
    enum: ['owner_managed', 'superior_managed'], 
    default: 'owner_managed' 
  }, // 定价模式：owner_managed=拥有者管理，superior_managed=上级管理
  tierPricingConfig: { // 分层定价配置
    enabled: { type: Boolean, default: false },
    tiers: [{ // 层级定价规则
      tierLevel: Number, // 层级等级
      tierName: String, // 层级名称
      discountRate: Number, // 折扣率（如0.8表示8折）
      commissionRate: Number, // 分佣率（如0.1表示10%分佣）
      minQuantity: { type: Number, default: 1 }, // 最小起订量
      isActive: { type: Boolean, default: true }
    }]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: false },
  toObject: { virtuals: false }
})

productSchema.index({ name: 'text', description: 'text' })
productSchema.index({ category: 1 })
productSchema.index({ style: 1 })
productSchema.index({ manufacturerId: 1 })
productSchema.index({ status: 1 })
productSchema.index({ order: 1 })  // 排序字段索引

module.exports = mongoose.model('Product', productSchema)
