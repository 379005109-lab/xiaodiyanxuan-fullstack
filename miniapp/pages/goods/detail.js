/**
 * 商品详情页
 */

const api = require('../../api/index')
const app = getApp()

Page({
  data: {
    id: '',
    goods: null,
    loading: true,
    selectedSize: null,
    selectedMaterial: null,
    selectedColor: null,
    quantity: 1,
    totalPrice: 0
  },

  onLoad(options) {
    this.setData({ id: options.id })
    this.loadDetail()
  },

  // 加载商品详情
  async loadDetail() {
    try {
      this.setData({ loading: true })
      
      const res = await api.goods.getDetail(this.data.id)
      const goods = res.data
      
      // 默认选中第一个规格
      const selectedSize = goods.sizes?.[0] || null
      const selectedMaterial = goods.materialsGroups?.[0] || null
      const selectedColor = selectedMaterial?.colors?.[0] || null
      
      this.setData({
        goods,
        selectedSize,
        selectedMaterial,
        selectedColor,
        loading: false
      })
      
      this.calculatePrice()
    } catch (err) {
      console.error('加载商品详情失败', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  // 计算总价
  calculatePrice() {
    const { goods, selectedSize, quantity } = this.data
    if (!goods) return
    
    let price = goods.price
    if (selectedSize?.extra) {
      price += selectedSize.extra
    }
    
    this.setData({
      totalPrice: price * quantity
    })
  },

  // 选择尺寸
  selectSize(e) {
    const { index } = e.currentTarget.dataset
    this.setData({
      selectedSize: this.data.goods.sizes[index]
    })
    this.calculatePrice()
  },

  // 选择材质
  selectMaterial(e) {
    const { index } = e.currentTarget.dataset
    const material = this.data.goods.materialsGroups[index]
    this.setData({
      selectedMaterial: material,
      selectedColor: material.colors?.[0] || null
    })
  },

  // 选择颜色
  selectColor(e) {
    const { index } = e.currentTarget.dataset
    this.setData({
      selectedColor: this.data.selectedMaterial.colors[index]
    })
  },

  // 修改数量
  changeQuantity(e) {
    const { type } = e.currentTarget.dataset
    let quantity = this.data.quantity
    
    if (type === 'minus' && quantity > 1) {
      quantity--
    } else if (type === 'plus') {
      quantity++
    }
    
    this.setData({ quantity })
    this.calculatePrice()
  },

  // 加入购物车
  async addToCart() {
    if (!app.checkLogin()) return
    
    const { goods, selectedSize, selectedMaterial, selectedColor, quantity } = this.data
    
    try {
      wx.showLoading({ title: '加入中...' })
      
      await api.cart.add({
        goodsId: goods.id,
        count: quantity,
        specs: {
          size: selectedSize?.name || '',
          material: selectedMaterial?.name || '',
          materialColor: selectedColor?.name || ''
        }
      })
      
      wx.hideLoading()
      wx.showToast({
        title: '已加入购物车',
        icon: 'success'
      })
    } catch (err) {
      wx.hideLoading()
      wx.showToast({
        title: err.message || '添加失败',
        icon: 'none'
      })
    }
  },

  // 立即购买
  buyNow() {
    if (!app.checkLogin()) return
    
    const { goods, selectedSize, selectedMaterial, selectedColor, quantity, totalPrice } = this.data
    
    // 保存订单数据到缓存
    const orderData = {
      type: 'normal',
      goods: [{
        goodsId: goods.id,
        name: goods.name,
        price: totalPrice / quantity,
        count: quantity,
        thumb: goods.images?.[0] || '',
        specs: {
          size: selectedSize?.name || '',
          material: selectedMaterial?.name || '',
          materialColor: selectedColor?.name || ''
        }
      }],
      totalPrice
    }
    
    wx.setStorageSync('pendingOrder', orderData)
    wx.navigateTo({
      url: '/pages/order/create'
    })
  },

  // 预览图片
  previewImage(e) {
    const { index } = e.currentTarget.dataset
    wx.previewImage({
      current: this.data.goods.images[index],
      urls: this.data.goods.images
    })
  }
})
