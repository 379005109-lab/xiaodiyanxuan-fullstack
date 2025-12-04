/**
 * 购物车页面
 */

const api = require('../../api/index')
const app = getApp()

Page({
  data: {
    cartList: [],
    loading: true,
    totalPrice: 0,
    selectedAll: false
  },

  onShow() {
    if (app.globalData.isLogin) {
      this.loadCart()
    } else {
      this.setData({ loading: false })
    }
  },

  // 加载购物车
  async loadCart() {
    try {
      this.setData({ loading: true })
      
      const res = await api.cart.getList()
      const cartList = (res.data || []).map(item => ({
        ...item,
        selected: true
      }))
      
      this.setData({
        cartList,
        loading: false,
        selectedAll: cartList.length > 0
      })
      
      this.calculateTotal()
    } catch (err) {
      console.error('加载购物车失败', err)
      this.setData({ loading: false })
    }
  },

  // 计算总价
  calculateTotal() {
    const { cartList } = this.data
    let totalPrice = 0
    let allSelected = cartList.length > 0
    
    cartList.forEach(item => {
      if (item.selected) {
        totalPrice += item.price * item.count
      } else {
        allSelected = false
      }
    })
    
    this.setData({ totalPrice, selectedAll: allSelected })
  },

  // 选择/取消选择商品
  toggleSelect(e) {
    const { index } = e.currentTarget.dataset
    const { cartList } = this.data
    cartList[index].selected = !cartList[index].selected
    this.setData({ cartList })
    this.calculateTotal()
  },

  // 全选/取消全选
  toggleSelectAll() {
    const { cartList, selectedAll } = this.data
    cartList.forEach(item => {
      item.selected = !selectedAll
    })
    this.setData({ cartList })
    this.calculateTotal()
  },

  // 修改数量
  async changeQuantity(e) {
    const { index, type } = e.currentTarget.dataset
    const { cartList } = this.data
    const item = cartList[index]
    
    let newCount = item.count
    if (type === 'minus' && newCount > 1) {
      newCount--
    } else if (type === 'plus') {
      newCount++
    } else {
      return
    }

    try {
      await api.cart.update(item.cartId, newCount)
      cartList[index].count = newCount
      this.setData({ cartList })
      this.calculateTotal()
    } catch (err) {
      wx.showToast({
        title: '修改失败',
        icon: 'none'
      })
    }
  },

  // 删除商品
  async deleteItem(e) {
    const { index } = e.currentTarget.dataset
    const { cartList } = this.data
    const item = cartList[index]

    wx.showModal({
      title: '提示',
      content: '确定删除该商品吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.cart.remove(item.cartId)
            cartList.splice(index, 1)
            this.setData({ cartList })
            this.calculateTotal()
            wx.showToast({ title: '已删除', icon: 'success' })
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  // 去结算
  checkout() {
    const { cartList, totalPrice } = this.data
    const selectedItems = cartList.filter(item => item.selected)
    
    if (selectedItems.length === 0) {
      wx.showToast({
        title: '请选择商品',
        icon: 'none'
      })
      return
    }

    // 保存订单数据
    const orderData = {
      type: 'cart',
      goods: selectedItems.map(item => ({
        goodsId: item.goodsId,
        name: item.name,
        price: item.price,
        count: item.count,
        thumb: item.thumb,
        specs: item.specs
      })),
      totalPrice
    }
    
    wx.setStorageSync('pendingOrder', orderData)
    wx.navigateTo({
      url: '/pages/order/create'
    })
  },

  // 去登录
  goLogin() {
    app.login().then(() => {
      this.loadCart()
    })
  }
})
