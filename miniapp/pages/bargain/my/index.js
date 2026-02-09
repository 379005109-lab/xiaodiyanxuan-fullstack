// pages/bargain/my/index.js
const app = getApp()
const api = app.api || require('../../../utils/api.js')

Page({
  data: {
    currentTab: 'active',
    list: [],
    loading: false
  },

  onLoad() {
    this.loadList()
  },

  onShow() {
    this.loadList()
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.currentTab) return
    this.setData({ currentTab: tab })
    this.loadList()
  },

  loadList() {
    this.setData({ loading: true })
    api.getMyBargains().then((data) => {
      const all = data.list || data || []
      const filtered = all.filter(item => {
        if (this.data.currentTab === 'active') return item.status === 'active' || item.status === 'pending'
        if (this.data.currentTab === 'completed') return item.status === 'completed' || item.status === 'success'
        return item.status === 'expired' || item.status === 'failed'
      })
      this.setData({ list: filtered, loading: false })
    }).catch(() => {
      this.setData({ loading: false })
    })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/bargain/detail/index?id=${id}` })
  },

  goBrowse() {
    wx.navigateTo({ url: '/pages/bargain/index' })
  },

  goBack() {
    wx.navigateBack()
  }
})
