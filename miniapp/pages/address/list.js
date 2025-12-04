const api = require('../../api/index')
Page({
  data: { list: [], isSelect: false },
  onLoad(options) { this.setData({ isSelect: options.select === '1' }); this.loadData() },
  async loadData() {
    try {
      const res = await api.address.getList()
      this.setData({ list: res.data || [] })
    } catch (err) {}
  },
  selectAddress(e) {
    if (this.data.isSelect) {
      const address = this.data.list[e.currentTarget.dataset.index]
      const pages = getCurrentPages()
      const prev = pages[pages.length - 2]
      prev.setData({ address })
      wx.navigateBack()
    }
  },
  goEdit(e) { wx.navigateTo({ url: `/pages/address/edit?id=${e.currentTarget.dataset.id || ''}` }) }
})
