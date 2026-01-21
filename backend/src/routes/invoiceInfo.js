const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const InvoiceInfo = require('../models/InvoiceInfo')

// 所有路由需要认证
router.use(auth)

// 获取用户的所有开票信息
router.get('/', async (req, res) => {
  try {
    const invoices = await InvoiceInfo.find({ userId: req.user._id }).sort({ isDefault: -1, createdAt: -1 })
    res.json({ success: true, data: invoices })
  } catch (error) {
    console.error('获取开票信息失败:', error)
    res.status(500).json({ success: false, message: '获取开票信息失败' })
  }
})

// 获取单个开票信息
router.get('/:id', async (req, res) => {
  try {
    const invoice = await InvoiceInfo.findOne({ _id: req.params.id, userId: req.user._id })
    if (!invoice) {
      return res.status(404).json({ success: false, message: '开票信息不存在' })
    }
    res.json({ success: true, data: invoice })
  } catch (error) {
    console.error('获取开票信息失败:', error)
    res.status(500).json({ success: false, message: '获取开票信息失败' })
  }
})

// 新增开票信息
router.post('/', async (req, res) => {
  try {
    const { invoiceType, title, taxNumber, bankName, bankAccount, companyAddress, companyPhone, email, phone, mailingAddress, isDefault, remark } = req.body

    if (!title) {
      return res.status(400).json({ success: false, message: '发票抬头不能为空' })
    }

    // 企业发票必须有税号
    if (invoiceType === 'company' && !taxNumber) {
      return res.status(400).json({ success: false, message: '企业发票必须填写税号' })
    }

    // 如果设为默认，取消其他默认
    if (isDefault) {
      await InvoiceInfo.updateMany({ userId: req.user._id }, { isDefault: false })
    }

    const invoice = new InvoiceInfo({
      userId: req.user._id,
      invoiceType: invoiceType || 'company',
      title,
      taxNumber,
      bankName,
      bankAccount,
      companyAddress,
      companyPhone,
      email,
      phone,
      mailingAddress,
      isDefault: isDefault || false,
      remark
    })

    await invoice.save()
    res.json({ success: true, data: invoice, message: '开票信息添加成功' })
  } catch (error) {
    console.error('添加开票信息失败:', error)
    res.status(500).json({ success: false, message: '添加开票信息失败' })
  }
})

// 更新开票信息
router.put('/:id', async (req, res) => {
  try {
    const invoice = await InvoiceInfo.findOne({ _id: req.params.id, userId: req.user._id })
    if (!invoice) {
      return res.status(404).json({ success: false, message: '开票信息不存在' })
    }

    const { invoiceType, title, taxNumber, bankName, bankAccount, companyAddress, companyPhone, email, phone, mailingAddress, isDefault, remark } = req.body

    // 企业发票必须有税号
    if (invoiceType === 'company' && !taxNumber) {
      return res.status(400).json({ success: false, message: '企业发票必须填写税号' })
    }

    // 如果设为默认，取消其他默认
    if (isDefault && !invoice.isDefault) {
      await InvoiceInfo.updateMany({ userId: req.user._id, _id: { $ne: invoice._id } }, { isDefault: false })
    }

    invoice.invoiceType = invoiceType || invoice.invoiceType
    invoice.title = title || invoice.title
    invoice.taxNumber = taxNumber !== undefined ? taxNumber : invoice.taxNumber
    invoice.bankName = bankName !== undefined ? bankName : invoice.bankName
    invoice.bankAccount = bankAccount !== undefined ? bankAccount : invoice.bankAccount
    invoice.companyAddress = companyAddress !== undefined ? companyAddress : invoice.companyAddress
    invoice.companyPhone = companyPhone !== undefined ? companyPhone : invoice.companyPhone
    invoice.email = email !== undefined ? email : invoice.email
    invoice.phone = phone !== undefined ? phone : invoice.phone
    invoice.mailingAddress = mailingAddress !== undefined ? mailingAddress : invoice.mailingAddress
    invoice.isDefault = isDefault !== undefined ? isDefault : invoice.isDefault
    invoice.remark = remark !== undefined ? remark : invoice.remark
    invoice.updatedAt = new Date()

    await invoice.save()
    res.json({ success: true, data: invoice, message: '开票信息更新成功' })
  } catch (error) {
    console.error('更新开票信息失败:', error)
    res.status(500).json({ success: false, message: '更新开票信息失败' })
  }
})

// 删除开票信息
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await InvoiceInfo.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!invoice) {
      return res.status(404).json({ success: false, message: '开票信息不存在' })
    }
    res.json({ success: true, message: '开票信息删除成功' })
  } catch (error) {
    console.error('删除开票信息失败:', error)
    res.status(500).json({ success: false, message: '删除开票信息失败' })
  }
})

// 设置默认开票信息
router.put('/:id/default', async (req, res) => {
  try {
    const invoice = await InvoiceInfo.findOne({ _id: req.params.id, userId: req.user._id })
    if (!invoice) {
      return res.status(404).json({ success: false, message: '开票信息不存在' })
    }

    // 取消其他默认
    await InvoiceInfo.updateMany({ userId: req.user._id }, { isDefault: false })
    
    // 设置当前为默认
    invoice.isDefault = true
    invoice.updatedAt = new Date()
    await invoice.save()

    res.json({ success: true, data: invoice, message: '已设为默认开票信息' })
  } catch (error) {
    console.error('设置默认开票信息失败:', error)
    res.status(500).json({ success: false, message: '设置默认开票信息失败' })
  }
})

module.exports = router
