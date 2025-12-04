const api = require('../../api/index')

Page({
  data: {
    list: [],
    loading: true,
    page: 1,
    pageSize: 10,
    hasMore: true
  },

  onLoad(options) {
    this.loadData()
  },

  async loadData() {
    const { page, pageSize, list } = this.data
    try {
      const res = await api.goods.getList({ page, pageSize })
      const newList = page === 1 ? res.data.list : [...list, ...res.data.list]
      this.setData({
        list: newList,
        loading: false,
        hasMore: res.data.list.length === pageSize
      })
    } catch (err) {
      this.setData({ loading: false })
    }
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.setData({ page: this.data.page + 1 })
      this.loadData()
    }
  },

  goDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/goods/detail?id=${id}` })
  }
})
