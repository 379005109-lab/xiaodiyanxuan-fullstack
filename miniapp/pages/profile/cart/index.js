const app = getApp()
const api = app.api || require('../../../utils/api.js')
const { requireLogin } = require('../../../utils/auth.js')

Page({
  data: {
    cartList: [],
    allChecked: false,
    totalPrice: 0,
    checkedCount: 0
  },
  onLoad() {
    if (!requireLogin()) return
    this.loadCart()
  },
  onShow() {
    this.loadCart()
  },
  loadCart() {
    // 默认材质信息（用于没有材质数据的旧商品）
    const defaultMaterial = '标准皮革'
    const defaultFill = '高密度海绵'
    const defaultFrame = '实木框架'
    const defaultLeg = '木质脚'
    
    // 统一格式化购物车项，如果没有材质信息则使用默认值
    const formatCartItem = (item) => ({
      ...item,
      checked: true,
      sizeName: item.sizeName || item.specs?.size || '默认',
      dims: item.dims || item.specs?.dims || '',
      fabric: item.fabric || item.material || item.specs?.material || defaultMaterial,
      materialColor: item.materialColor || item.specs?.materialColor || '经典黑',
      fill: item.fill || item.specs?.fill || defaultFill,
      fillExtra: item.fillExtra || 0,
      frame: item.frame || item.specs?.frame || defaultFrame,
      leg: item.leg || item.specs?.leg || defaultLeg
    })
    
    // 优先从API加载
    api.getCart().then((res) => {
      const list = Array.isArray(res) ? res : (res.list || [])
      const cartList = list.map(formatCartItem)
      this.setData({ cartList }, () => {
        this.calculateTotal()
      })
    }).catch((err) => {
      console.error('加载购物车失败:', err)
      // 从本地存储加载
      try {
        const cart = wx.getStorageSync('cart') || []
        const cartList = cart.map(formatCartItem)
        this.setData({ cartList }, () => {
          this.calculateTotal()
        })
      } catch (e) {
        console.error('加载本地购物车失败:', e)
      }
    })
  },
  calculateTotal() {
    const { cartList } = this.data
    let totalPrice = 0
    let checkedCount = 0
    let allChecked = cartList.length > 0
    
    cartList.forEach(item => {
      if (item.checked) {
        totalPrice += (item.price || 0) * (item.count || 1)
        checkedCount += (item.count || 1)
      } else {
        allChecked = false
      }
    })
    
    this.setData({ totalPrice, checkedCount, allChecked })
  },
  onToggleCheck(e) {
    const index = e.currentTarget.dataset.index
    const checked = !this.data.cartList[index].checked
    this.setData({
      [`cartList[${index}].checked`]: checked
    }, () => {
      this.calculateTotal()
    })
  },
  onToggleAll() {
    const allChecked = !this.data.allChecked
    const cartList = this.data.cartList.map(item => ({ ...item, checked: allChecked }))
    this.setData({ cartList, allChecked }, () => {
      this.calculateTotal()
    })
  },
  onIncrease(e) {
    const index = e.currentTarget.dataset.index
    const count = (this.data.cartList[index].count || 1) + 1
    this.setData({
      [`cartList[${index}].count`]: count
    }, () => {
      this.calculateTotal()
      this.saveCart()
    })
  },
  onDecrease(e) {
    const index = e.currentTarget.dataset.index
    const currentCount = this.data.cartList[index].count || 1
    if (currentCount > 1) {
      this.setData({
        [`cartList[${index}].count`]: currentCount - 1
      }, () => {
        this.calculateTotal()
        this.saveCart()
      })
    }
  },
  onDelete(e) {
    const index = e.currentTarget.dataset.index
    const item = this.data.cartList[index]
    wx.showModal({
      title: '删除商品',
      content: '确定要删除这个商品吗？',
      success: (res) => {
        if (res.confirm) {
          const cartList = this.data.cartList.filter((_, i) => i !== index)
          this.setData({ cartList }, () => {
            this.calculateTotal()
            this.saveCart()
          })
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  },
  saveCart() {
    try {
      const cart = this.data.cartList.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        count: item.count || 1,
        thumb: item.thumb,
        specs: item.specs
      }))
      wx.setStorageSync('cart', cart)
    } catch (e) {
      console.error('保存购物车失败:', e)
    }
  },
  goMall() {
    wx.switchTab({ url: '/pages/mall/index' })
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/mall/detail/index?id=${id}` })
  },
  onCheckout() {
    const checkedItems = this.data.cartList.filter(item => item.checked)
    if (checkedItems.length === 0) {
      wx.showToast({ title: '请选择商品', icon: 'none' })
      return
    }
    
    // 组装订单数据 - 保留完整的商品信息
    const cartItems = checkedItems.map(item => ({
      id: item.id,
      name: item.name,
      code: item.name,
      price: item.price,
      count: item.count || 1,
      thumb: item.thumb,
      sizeName: item.sizeName || '默认',
      dims: item.dims || '',
      fabric: item.fabric || item.material || '',
      materialColor: item.materialColor || '',
      fill: item.fill || '',
      fillExtra: item.fillExtra || 0,
      frame: item.frame || '',
      leg: item.leg || ''
    }))
    
    try {
      wx.setStorageSync('orderConfirm', {
        isFromCart: true,
        cartItems: cartItems,
        totalPrice: this.data.totalPrice
      })
    } catch (e) {
      console.error('保存订单数据失败:', e)
    }
    
    wx.navigateTo({ url: '/pages/order/confirm/index?type=cart' })
  }
})
