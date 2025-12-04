const api = require('../../api/index')
Page({
  data: { keyword: '', list: [], loading: false, searched: false },
  inputKeyword(e) { this.setData({ keyword: e.detail.value }) },
  async search() {
    const { keyword } = this.data
    if (!keyword.trim()) return
    this.setData({ loading: true, searched: true })
    try {
      const res = await api.goods.search(keyword)
      this.setData({ list: res.data.list || [], loading: false })
    } catch (err) {
      this.setData({ loading: false })
    }
  },
  goDetail(e) {
    wx.navigateTo({ url: `/pages/goods/detail?id=${e.currentTarget.dataset.id}` })
  }
})
