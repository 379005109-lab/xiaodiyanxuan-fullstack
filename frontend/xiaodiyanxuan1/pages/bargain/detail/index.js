// pages/bargain/detail/index.js
Page({
  data: {
    id: '',
    name: '',
    origin: 0,
    price: 0,
    remain: 0,
    progress: 0,
    cover: '',
    currentPrice: 0,
    cutAmount: 0,
    progressPercent: 0,
    leftSeconds: 24 * 60 * 60, // 24小时
    leftText: '24:00:00',
    timer: null,
    records: [],
    // 成交区间相关
    dealThreshold: 70, // 达到70%即可成交
    canDeal: false,
    dealPrice: 0
  },

  onLoad(options) {
    const { id, name, origin, price, remain, progress, cover } = options
    const originNum = parseFloat(origin) || 0
    const priceNum = parseFloat(price) || 0
    const remainNum = parseFloat(remain) || 0
    const progressNum = parseFloat(progress) || 0
    
    // 计算已砍金额和当前价格
    const targetSave = originNum - priceNum
    const cutAmount = Math.max(targetSave - remainNum, 0)
    const currentPrice = Math.max(originNum - cutAmount, priceNum)
    const progressPercent = Math.round(progressNum * 100)
    
    // 计算是否可成交（达到70%即可成交）
    const dealThreshold = 70
    const canDeal = progressPercent >= dealThreshold
    // 成交价 = 原价 - (目标优惠 * 当前进度)
    const dealPrice = Math.round(originNum - (targetSave * progressNum))

    this.setData({
      id,
      name: decodeURIComponent(name || ''),
      origin: originNum,
      price: priceNum,
      remain: remainNum,
      progress: progressNum,
      cover: decodeURIComponent(cover || '') || 'https://picsum.photos/400/400?random=800',
      currentPrice: currentPrice.toFixed(0),
      cutAmount: cutAmount.toFixed(0),
      progressPercent,
      dealThreshold,
      canDeal,
      dealPrice
    })

    // 生成模拟砍价记录
    this.generateMockRecords()
    
    // 启动倒计时
    this.startTimer()
  },

  onUnload() {
    this.clearTimer()
  },

  generateMockRecords() {
    const names = ['小明', '小红', '小华', '小李', '小王', '小张']
    const records = []
    const count = Math.floor(Math.random() * 5) + 1
    
    for (let i = 0; i < count; i++) {
      records.push({
        avatar: `https://picsum.photos/100/100?random=${900 + i}`,
        name: names[Math.floor(Math.random() * names.length)] + '***',
        time: `${Math.floor(Math.random() * 24)}小时前`,
        amount: Math.floor(Math.random() * 40) + 10
      })
    }
    
    this.setData({ records })
  },

  startTimer() {
    this.clearTimer()
    const timer = setInterval(() => {
      const next = Math.max(this.data.leftSeconds - 1, 0)
      this.setData({ 
        leftSeconds: next, 
        leftText: this._formatLeftTime(next) 
      })
      if (next === 0) this.clearTimer()
    }, 1000)
    this.setData({ timer })
  },

  clearTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer)
      this.setData({ timer: null })
    }
  },

  _formatLeftTime(s) {
    const hh = String(Math.floor(s / 3600)).padStart(2, '0')
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
    const ss = String(s % 60).padStart(2, '0')
    return `${hh}:${mm}:${ss}`
  },

  // 取消砍价
  onCancelBargain() {
    wx.showModal({
      title: '取消砍价',
      content: '取消后将无法继续砍价，确定要取消吗？',
      confirmText: '确定取消',
      confirmColor: '#DC2626',
      success: (res) => {
        if (res.confirm) {
          // 从本地存储中删除
          try {
            const myBargains = wx.getStorageSync('myBargains') || []
            const filtered = myBargains.filter(item => item.id !== this.data.id)
            wx.setStorageSync('myBargains', filtered)
          } catch (e) {
            console.error('删除砍价数据失败:', e)
          }
          wx.showToast({ title: '已取消砍价', icon: 'success' })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        }
      }
    })
  },

  // 自己砍一刀
  onSelfCut() {
    const cutValue = Math.floor(Math.random() * 20) + 5 // 随机砍5-25元
    const newRemain = Math.max(this.data.remain - cutValue, 0)
    const newCutAmount = parseFloat(this.data.cutAmount) + cutValue
    const targetSave = this.data.origin - this.data.price
    const newProgress = targetSave > 0 ? Math.min(newCutAmount / targetSave, 1) : 0
    const newCurrentPrice = Math.max(this.data.origin - newCutAmount, this.data.price)
    const newProgressPercent = Math.round(newProgress * 100)
    
    // 检查是否达到成交条件
    const canDeal = newProgressPercent >= this.data.dealThreshold
    const dealPrice = Math.round(this.data.origin - (targetSave * newProgress))

    this.setData({
      remain: newRemain,
      cutAmount: newCutAmount.toFixed(0),
      currentPrice: newCurrentPrice.toFixed(0),
      progressPercent: newProgressPercent,
      canDeal,
      dealPrice
    })

    // 添加砍价记录
    const records = [{
      avatar: 'https://picsum.photos/100/100?random=999',
      name: '我',
      time: '刚刚',
      amount: cutValue
    }, ...this.data.records]
    this.setData({ records })

    // 更新本地存储
    this.updateLocalStorage(newRemain, newProgress)

    wx.showToast({
      title: `成功砍掉 ¥${cutValue}`,
      icon: 'success'
    })
  },

  // 更新本地存储
  updateLocalStorage(newRemain, newProgress) {
    try {
      const myBargains = wx.getStorageSync('myBargains') || []
      const updated = myBargains.map(item => {
        if (item.id === this.data.id) {
          return { ...item, remain: newRemain, progress: newProgress }
        }
        return item
      })
      wx.setStorageSync('myBargains', updated)
    } catch (e) {
      console.error('更新砍价数据失败:', e)
    }
  },

  // 立即购买
  onBuyNow() {
    wx.showToast({
      title: '砍价成功，即将跳转购买',
      icon: 'success'
    })
    setTimeout(() => {
      wx.navigateTo({
        url: `/pages/mall/detail/index?id=${this.data.id}`
      })
    }, 1500)
  },

  onShareAppMessage() {
    return {
      title: `帮我砍一刀！${this.data.name}还差￥${this.data.remain}`,
      path: `/pages/bargain/detail/index?id=${this.data.id}&name=${encodeURIComponent(this.data.name)}&origin=${this.data.origin}&price=${this.data.price}&remain=${this.data.remain}&progress=${this.data.progress}&cover=${encodeURIComponent(this.data.cover)}`,
      imageUrl: this.data.cover
    }
  }
})
