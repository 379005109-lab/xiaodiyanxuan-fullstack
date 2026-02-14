// pages/profile/invoice/index.js
const app = getApp()
const api = app.api || require('../../../utils/api.js')
const { requireLogin } = require('../../../utils/auth.js')

Page({
  data: {
    invoices: [],
    loading: false
  },

  onLoad() {
    if (!requireLogin()) return
    this.loadInvoices()
  },

  onShow() {
    this.loadInvoices()
  },

  loadInvoices() {
    this.setData({ loading: true })
    api.getInvoiceList().then((data) => {
      this.setData({ invoices: data.list || data || [], loading: false })
    }).catch(() => {
      this.setData({ loading: false })
    })
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/profile/invoice/edit/index?id=${id}` })
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/profile/invoice/edit/index' })
  },

  goBack() {
    wx.navigateBack()
  }
})
