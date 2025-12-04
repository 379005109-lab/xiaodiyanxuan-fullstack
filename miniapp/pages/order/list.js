const api = require('../../api/index')

Page({
  data: { orders: [], loading: true, status: '' },
  onLoad(options) {
    this.setData({ status: options.status || '' })
    this.loadData()
  },
  async loadData() {
    try {
      const res = await api.order.getList({ status: this.data.status })
      this.setData({ orders: res.data || [], loading: false })
    } catch (err) {
      this.setData({ loading: false })
    }
  },
  goDetail(e) {
    wx.navigateTo({ url: `/pages/order/detail?id=${e.currentTarget.dataset.id}` })
  }
})
