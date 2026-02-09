// pages/package/my/index.js
const app = getApp()
const api = app.api || require('../../../utils/api.js')

Page({
  data: {
    packages: [],
    loading: false
  },

  onLoad() {
    this.loadMyPackages()
  },

  onShow() {
    this.loadMyPackages()
  },

  loadMyPackages() {
    this.setData({ loading: true })
    api.getOrders({ type: 'package' }).then((data) => {
      const list = (data.list || data || []).map(o => ({
        ...o,
        statusText: this.getStatusText(o.status)
      }))
      this.setData({ packages: list, loading: false })
    }).catch(() => {
      this.setData({ loading: false })
    })
  },

  getStatusText(status) {
    const map = {
      pending: '待付款', paid: '已付款', shipped: '已发货',
      completed: '已完成', cancelled: '已取消'
    }
    return map[status] || '进行中'
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/package/detail/index?id=${id}` })
  },

  goBrowse() {
    wx.switchTab({ url: '/pages/package/index' })
  },

  goBack() {
    wx.navigateBack()
  }
})
