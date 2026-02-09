// pages/bargain/help/index.js
const app = getApp()
const api = app.api || require('../../../utils/api.js')

Page({
  data: {
    bargainId: '',
    product: {},
    records: [],
    hasHelped: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ bargainId: options.id })
      this.loadDetail(options.id)
    }
  },

  loadDetail(id) {
    api.getBargainDetail(id).then((data) => {
      const bargain = data.bargain || data || {}
      this.setData({
        product: {
          name: bargain.productName || bargain.name,
          image: bargain.coverImage || bargain.image,
          currentPrice: bargain.currentPrice,
          originalPrice: bargain.originalPrice,
          targetPrice: bargain.targetPrice,
          progress: bargain.progress || Math.round(((bargain.originalPrice - bargain.currentPrice) / (bargain.originalPrice - bargain.targetPrice)) * 100),
          remainAmount: ((bargain.currentPrice || 0) - (bargain.targetPrice || 0)).toFixed(2)
        },
        records: bargain.helpers || bargain.records || []
      })
    }).catch(err => {
      console.error('加载砍价详情失败:', err)
    })
  },

  helpBargain() {
    if (this.data.hasHelped) return
    api.helpBargain(this.data.bargainId).then((data) => {
      const amount = data.cutAmount || data.amount || (Math.random() * 50 + 5).toFixed(2)
      this.setData({ hasHelped: true })
      wx.showToast({ title: `成功砍掉 ¥${amount}`, icon: 'none' })
      this.loadDetail(this.data.bargainId)
    }).catch(err => {
      wx.showToast({ title: err.message || '砍价失败', icon: 'none' })
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
