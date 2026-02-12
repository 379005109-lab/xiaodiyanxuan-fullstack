const mongoose = require('mongoose')

const bannerItemSchema = new mongoose.Schema({
  image: { type: String, default: '' },
  link: { type: String, default: '' },
  sort: { type: Number, default: 0 },
  status: { type: Boolean, default: true }
}, { _id: true })

const couponItemSchema = new mongoose.Schema({
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  amount: { type: Number, default: 0 },
  threshold: { type: Number, default: 0 }
}, { _id: true })

const productListSchema = new mongoose.Schema({
  title: { type: String, default: '商品列表' },
  productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  displayMode: { type: String, enum: ['grid', 'list', 'scroll'], default: 'grid' },
  limit: { type: Number, default: 10 }
}, { _id: false })

const storeHeaderSchema = new mongoose.Schema({
  logo: { type: String, default: '' },
  name: { type: String, default: '' },
  description: { type: String, default: '' }
}, { _id: false })

const pageValueSchema = new mongoose.Schema({
  components: { type: [mongoose.Schema.Types.Mixed], default: [] },
  // 保留旧字段以兼容历史数据
  storeHeader: { type: storeHeaderSchema, default: () => ({}) },
  banners: { type: [bannerItemSchema], default: [] },
  coupons: { type: [couponItemSchema], default: [] },
  productList: { type: productListSchema, default: () => ({}) },
  customSections: { type: [mongoose.Schema.Types.Mixed], default: [] }
}, { _id: false, strict: false })

const storeDecorationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    default: '默认页面'
  },
  title: {
    type: String,
    trim: true,
    default: ''
  },
  coverImage: {
    type: String,
    default: ''
  },
  value: {
    type: pageValueSchema,
    default: () => ({})
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'draft'
  },
  type: {
    type: String,
    enum: ['homepage', 'custom'],
    default: 'homepage'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  ownerType: {
    type: String,
    enum: ['platform', 'manufacturer', 'designer'],
    default: 'platform'
  },
  manufacturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manufacturer',
    default: null
  },
  bgColor: {
    type: String,
    default: '#ffffff'
  },
  bgImage: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
})

storeDecorationSchema.index({ merchantId: 1, type: 1 })
storeDecorationSchema.index({ isDefault: 1 })

module.exports = mongoose.model('StoreDecoration', storeDecorationSchema)
