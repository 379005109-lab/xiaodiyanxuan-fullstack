// pages/orders/coupon-select/index.js
const app = getApp()
const api = app.api || require('../../../utils/api.js')
const { requireLogin } = require('../../../utils/auth.js')

Page({
  data: {
    coupons: [],
    selectedId: '',
    loading: false,
    orderAmount: 0
  },

  onLoad(options) {
    if (!requireLogin()) return
    if (options.selectedId) this.setData({ selectedId: options.selectedId })
    if (options.amount) this.setData({ orderAmount: Number(options.amount) })
    this.loadCoupons()
  },

  loadCoupons() {
    this.setData({ loading: true })
    api.getCoupons({ status: 'available' }).then((data) => {
      const list = (data.list || data || []).map(c => ({
        ...c,
        disabled: this.data.orderAmount > 0 && c.minAmount > this.data.orderAmount
      }))
      this.setData({ coupons: list, loading: false })
    }).catch(() => {
      this.setData({ loading: false })
    })
  },

  selectCoupon(e) {
    const item = e.currentTarget.dataset.item
    if (item.disabled) return
    try {
      wx.setStorageSync('selectedCoupon', item)
    } catch(e) {}
    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2]
    if (prevPage) {
      prevPage.setData({ selectedCoupon: item })
    }
    wx.navigateBack()
  },

  noCoupon() {
    try {
      wx.removeStorageSync('selectedCoupon')
    } catch(e) {}
    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2]
    if (prevPage) {
      prevPage.setData({ selectedCoupon: null })
    }
    wx.navigateBack()
  },

  goBack() {
    wx.navigateBack()
  }
})
