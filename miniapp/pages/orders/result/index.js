// pages/orders/result/index.js
Page({
  data: {
    orderNumber: '',
    totalAmount: '0',
    orderId: ''
  },

  onLoad(options) {
    if (options.orderNumber) this.setData({ orderNumber: options.orderNumber })
    if (options.amount) this.setData({ totalAmount: options.amount })
    if (options.orderId) this.setData({ orderId: options.orderId })
  },

  goOrderDetail() {
    const id = this.data.orderId || this.data.orderNumber
    if (id) {
      wx.redirectTo({ url: `/pages/orders/detail/index?id=${id}` })
    } else {
      wx.redirectTo({ url: '/pages/profile/orders/index' })
    }
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  goBack() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
