// pages/orders/detail/index.js
const app = getApp()
const api = app.api || require('../../../utils/api.js')

Page({
  data: {
    orderId: '',
    order: {},
    statusIcon: '',
    statusText: '',
    statusHint: '',
    showActions: true
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ orderId: options.id })
      this.loadOrder(options.id)
    }
  },

  loadOrder(id) {
    api.getOrderDetail(id).then((data) => {
      const order = data.order || data || {}
      this.setData({ order })
      this.updateStatus(order.status)
    }).catch(() => {
      // Fallback: load from local
      try {
        const orders = wx.getStorageSync('orders') || []
        const order = orders.find(o => (o._id || o.id) === id)
        if (order) {
          this.setData({ order })
          this.updateStatus(order.status)
        }
      } catch(e) {}
    })
  },

  updateStatus(status) {
    const map = {
      pending: { icon: '\u23F3', text: '\u5F85\u4ED8\u6B3E', hint: '\u8BF7\u5C3D\u5FEB\u5B8C\u6210\u652F\u4ED8' },
      paid: { icon: '\u2705', text: '\u5DF2\u4ED8\u6B3E', hint: '\u5546\u5BB6\u6B63\u5728\u5904\u7406\u60A8\u7684\u8BA2\u5355' },
      shipped: { icon: '\uD83D\uDE9A', text: '\u5DF2\u53D1\u8D27', hint: '\u5546\u54C1\u6B63\u5728\u914D\u9001\u4E2D' },
      completed: { icon: '\u2713', text: '\u5DF2\u5B8C\u6210', hint: '' },
      cancelled: { icon: '\u2715', text: '\u5DF2\u53D6\u6D88', hint: '' }
    }
    const info = map[status] || map.pending
    this.setData({
      statusIcon: info.icon,
      statusText: info.text,
      statusHint: info.hint,
      showActions: status !== 'cancelled'
    })
  },

  copyOrderNo() {
    const no = this.data.order.orderNumber || this.data.order._id
    if (no) {
      wx.setClipboardData({
        data: no,
        success: () => wx.showToast({ title: '\u5DF2\u590D\u5236', icon: 'success' })
      })
    }
  },

  cancelOrder() {
    wx.showModal({
      title: '\u53D6\u6D88\u8BA2\u5355',
      content: '\u786E\u5B9A\u8981\u53D6\u6D88\u6B64\u8BA2\u5355\u5417\uFF1F',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          api.cancelOrder(this.data.orderId).then(() => {
            wx.showToast({ title: '\u5DF2\u53D6\u6D88', icon: 'success' })
            this.loadOrder(this.data.orderId)
          }).catch(() => {
            try {
              let orders = wx.getStorageSync('orders') || []
              const idx = orders.findIndex(o => (o._id || o.id) === this.data.orderId)
              if (idx >= 0) { orders[idx].status = 'cancelled'; wx.setStorageSync('orders', orders) }
              this.setData({ 'order.status': 'cancelled' })
              this.updateStatus('cancelled')
              wx.showToast({ title: '\u5DF2\u53D6\u6D88', icon: 'success' })
            } catch(e) {}
          })
        }
      }
    })
  },

  payOrder() {
    wx.showToast({ title: '\u652F\u4ED8\u529F\u80FD\u5F00\u53D1\u4E2D', icon: 'none' })
  },

  confirmReceive() {
    wx.showModal({
      title: '\u786E\u8BA4\u6536\u8D27',
      content: '\u786E\u5B9A\u5DF2\u6536\u5230\u5546\u54C1\u5417\uFF1F',
      success: (res) => {
        if (res.confirm) {
          api.confirmOrder(this.data.orderId).then(() => {
            wx.showToast({ title: '\u5DF2\u786E\u8BA4', icon: 'success' })
            this.loadOrder(this.data.orderId)
          }).catch(() => {
            try {
              let orders = wx.getStorageSync('orders') || []
              const idx = orders.findIndex(o => (o._id || o.id) === this.data.orderId)
              if (idx >= 0) { orders[idx].status = 'completed'; wx.setStorageSync('orders', orders) }
              this.setData({ 'order.status': 'completed' })
              this.updateStatus('completed')
              wx.showToast({ title: '\u5DF2\u786E\u8BA4', icon: 'success' })
            } catch(e) {}
          })
        }
      }
    })
  },

  goRefund() {
    wx.showToast({ title: '\u552E\u540E\u529F\u80FD\u5F00\u53D1\u4E2D', icon: 'none' })
  },

  contactService() {
    wx.navigateTo({ url: '/pages/profile/service/index' })
  },

  goProductDetail(e) {
    const id = e.currentTarget.dataset.id
    if (id) wx.navigateTo({ url: `/pages/mall/detail/index?id=${id}` })
  },

  goBack() {
    wx.navigateBack().catch(() => {
      wx.switchTab({ url: '/pages/profile/index' })
    })
  }
})