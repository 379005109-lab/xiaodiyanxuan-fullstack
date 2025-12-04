const api = require('../../api/index')
Page({
  data: { order: null, loading: true },
  onLoad(options) { this.loadData(options.id) },
  async loadData(id) {
    try {
      const res = await api.order.getDetail(id)
      this.setData({ order: res.data, loading: false })
    } catch (err) { this.setData({ loading: false }) }
  }
})
