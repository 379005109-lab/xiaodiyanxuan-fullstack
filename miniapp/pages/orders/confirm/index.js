// pages/orders/confirm/index.js
const app = getApp()
const api = app.api || require('../../../utils/api.js')

Page({
  data: {
    items: [],
    selectedAddress: null,
    selectedCoupon: null,
    remark: '',
    goodsTotal: 0,
    couponDiscount: 0,
    freight: 0,
    totalAmount: 0,
    orderType: 'normal'
  },

  onLoad(options) {
    this.setData({ orderType: options.type || 'normal' })
    this.loadOrderItems()
    this.loadDefaultAddress()
  },

  loadOrderItems() {
    try {
      const data = wx.getStorageSync('orderConfirm') || {}
      let items = []

      if (data.isFromCart && data.cartItems) {
        items = data.cartItems
      } else if (data.goodsName) {
        items = [{
          id: data.goodsId || 'item_1',
          name: data.goodsName,
          thumb: data.goodsImage,
          price: data.totalPrice,
          count: 1,
          sizeName: data.sizeName,
          materialName: data.materialName,
          materialColor: data.materialColor
        }]
      }

      let goodsTotal = 0
      items.forEach(item => {
        goodsTotal += (item.price || 0) * (item.count || 1)
      })

      this.setData({ items, goodsTotal }, () => this.calculateTotal())
    } catch(e) {
      console.error('加载订单商品失败:', e)
    }
  },

  loadDefaultAddress() {
    api.getAddresses().then((data) => {
      const list = data.list || data || []
      const def = list.find(a => a.isDefault) || list[0]
      if (def) this.setData({ selectedAddress: def })
    }).catch(() => {
      try {
        const addresses = wx.getStorageSync('addresses') || []
        const def = addresses.find(a => a.isDefault) || addresses[0]
        if (def) this.setData({ selectedAddress: def })
      } catch(e) {}
    })
  },

  calculateTotal() {
    const { goodsTotal, couponDiscount, freight } = this.data
    const totalAmount = Math.max(0, goodsTotal - couponDiscount + freight)
    this.setData({ totalAmount })
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  goSelectAddress() {
    const id = this.data.selectedAddress ? (this.data.selectedAddress._id || this.data.selectedAddress.id) : ''
    wx.navigateTo({ url: `/pages/orders/address-select/index?selectedId=${id}` })
  },

  goSelectCoupon() {
    wx.navigateTo({ url: `/pages/orders/coupon-select/index?amount=${this.data.goodsTotal}` })
  },

  submitOrder() {
    if (!this.data.selectedAddress) {
      return wx.showToast({ title: '请选择收货地址', icon: 'none' })
    }
    if (this.data.items.length === 0) {
      return wx.showToast({ title: '订单商品为空', icon: 'none' })
    }

    const orderData = {
      items: this.data.items.map(item => ({
        goodsId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.count || 1,
        specs: {
          size: item.sizeName,
          material: item.materialName,
          color: item.materialColor
        }
      })),
      address: this.data.selectedAddress,
      couponId: this.data.selectedCoupon ? (this.data.selectedCoupon._id || this.data.selectedCoupon.id) : '',
      remark: this.data.remark,
      totalAmount: this.data.totalAmount
    }

    api.createOrderV2(orderData).then((data) => {
      const orderId = data.orderId || data._id || ''
      const orderNumber = data.orderNumber || orderId
      try { wx.removeStorageSync('orderConfirm') } catch(e) {}
      wx.redirectTo({
        url: `/pages/orders/result/index?orderId=${orderId}&orderNumber=${orderNumber}&amount=${this.data.totalAmount}`
      })
    }).catch((err) => {
      console.error('提交订单失败:', err)
      // Fallback: save to local
      try {
        const orders = wx.getStorageSync('orders') || []
        const orderId = 'ord_' + Date.now()
        orders.unshift({
          _id: orderId,
          orderNumber: orderId,
          items: this.data.items,
          address: this.data.selectedAddress,
          totalAmount: this.data.totalAmount,
          status: 'pending',
          createTime: new Date().toISOString()
        })
        wx.setStorageSync('orders', orders)
        wx.removeStorageSync('orderConfirm')
        wx.redirectTo({
          url: `/pages/orders/result/index?orderId=${orderId}&orderNumber=${orderId}&amount=${this.data.totalAmount}`
        })
      } catch(e) {
        wx.showToast({ title: '提交失败', icon: 'none' })
      }
    })
  },

  goBack() {
    wx.navigateBack()
  }
})