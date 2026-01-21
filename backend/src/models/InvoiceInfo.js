const mongoose = require('mongoose')

const invoiceInfoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // 发票类型：personal=个人, company=企业
  invoiceType: { type: String, enum: ['personal', 'company'], default: 'company' },
  // 发票抬头（个人姓名或企业名称）
  title: { type: String, required: true },
  // 税号（企业必填）
  taxNumber: { type: String },
  // 开户银行（企业可选）
  bankName: { type: String },
  // 银行账号（企业可选）
  bankAccount: { type: String },
  // 企业地址（企业可选）
  companyAddress: { type: String },
  // 企业电话（企业可选）
  companyPhone: { type: String },
  // 收票邮箱
  email: { type: String },
  // 收票手机
  phone: { type: String },
  // 邮寄地址（纸质发票）
  mailingAddress: { type: String },
  // 是否为默认开票信息
  isDefault: { type: Boolean, default: false },
  // 备注
  remark: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

invoiceInfoSchema.index({ userId: 1 })

module.exports = mongoose.model('InvoiceInfo', invoiceInfoSchema)
