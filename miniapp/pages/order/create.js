const api = require('../../api/index')
Page({
  data: { goods: [], address: null, totalPrice: 0, remark: '' },
  onLoad() {
    const order = wx.getStorageSync('pendingOrder')
    if (order) {
      this.setData({ goods: order.goods, totalPrice: order.totalPrice })
    }
  },
  selectAddress() {
    wx.navigateTo({ url: '/pages/address/list?select=1' })
  },
  inputRemark(e) {
    this.setData({ remark: e.detail.value })
  },
  async submit() {
    if (!this.data.address) {
      return wx.showToast({ title: '请选择地址', icon: 'none' })
    }
    try {
      wx.showLoading({ title: '提交中...' })
      const res = await api.order.create({
        goods: this.data.goods,
        addressId: this.data.address.id,
        remark: this.data.remark
      })
      wx.hideLoading()
      wx.removeStorageSync('pendingOrder')
      wx.redirectTo({ url: `/pages/order/detail?id=${res.data.orderId}` })
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '提交失败', icon: 'none' })
    }
  }
})
