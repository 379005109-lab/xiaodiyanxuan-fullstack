// pages/profile/invoice/edit/index.js
const app = getApp()
const api = app.api || require('../../../../utils/api.js')

Page({
  data: {
    isEdit: false,
    invoiceId: '',
    form: {
      type: 'personal',
      title: '',
      taxNumber: '',
      bank: '',
      bankAccount: '',
      companyAddress: '',
      companyPhone: '',
      isDefault: false
    }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true, invoiceId: options.id })
      this.loadInvoice(options.id)
    }
  },

  loadInvoice(id) {
    api.getInvoiceDetail(id).then((data) => {
      const inv = data.invoice || data || {}
      this.setData({
        form: {
          type: inv.type || 'personal',
          title: inv.title || inv.name || '',
          taxNumber: inv.taxNumber || '',
          bank: inv.bank || '',
          bankAccount: inv.bankAccount || '',
          companyAddress: inv.companyAddress || '',
          companyPhone: inv.companyPhone || '',
          isDefault: inv.isDefault || false
        }
      })
    }).catch(() => {})
  },

  setType(e) {
    this.setData({ 'form.type': e.currentTarget.dataset.type })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  onDefaultChange(e) {
    this.setData({ 'form.isDefault': e.detail.value })
  },

  save() {
    const { form } = this.data
    if (!form.title) return wx.showToast({ title: '请输入名称', icon: 'none' })
    if (form.type === 'company' && !form.taxNumber) return wx.showToast({ title: '请输入税号', icon: 'none' })

    const saveFunc = this.data.isEdit
      ? api.updateInvoice(this.data.invoiceId, form)
      : api.addInvoice(form)

    saveFunc.then(() => {
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1000)
    }).catch(() => {
      wx.showToast({ title: '保存失败', icon: 'none' })
    })
  },

  deleteInvoice() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条发票信息吗？',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          api.deleteInvoice(this.data.invoiceId).then(() => {
            wx.showToast({ title: '已删除', icon: 'success' })
            setTimeout(() => wx.navigateBack(), 1000)
          }).catch(() => {
            wx.showToast({ title: '删除失败', icon: 'none' })
          })
        }
      }
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
