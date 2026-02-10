// pages/bargain/detail/index.js
const app = getApp()
const api = app.api || require('../../utils/api.js')

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
    this.setData({ id })

    // 先用 URL 参数初始化基本数据
    this._initFromParams(options)

    // 尝试从 API 加载真实数据
    if (id) {
      api.getBargainDetail(id).then((res) => {
        const data = res.data || res || {}
        const bargain = data.bargain || data
        if (bargain && (bargain.originalPrice || bargain.currentPrice)) {
          const originVal = bargain.originalPrice || parseFloat(origin) || 0
          const targetVal = bargain.targetPrice || parseFloat(price) || 0
          const currentVal = bargain.currentPrice || originVal
          const targetSave = originVal - targetVal
          const cutAmt = Math.max(originVal - currentVal, 0)
          const prog = targetSave > 0 ? Math.min(cutAmt / targetSave, 1) : 0
          const progPct = Math.round(prog * 100)
          const helpers = bargain.helpers || []
          this.setData({
            name: bargain.productName || decodeURIComponent(name || ''),
            origin: originVal,
            price: targetVal,
            remain: Math.max(currentVal - targetVal, 0),
            progress: prog,
            cover: bargain.thumbnail || bargain.coverImage || decodeURIComponent(cover || ''),
            currentPrice: currentVal.toFixed(0),
            cutAmount: cutAmt.toFixed(0),
            progressPercent: progPct,
            canDeal: progPct >= this.data.dealThreshold,
            dealPrice: Math.round(currentVal),
            records: helpers.map(h => ({
              avatar: h.userAvatar || '',
              name: h.userName || '用户',
              time: h.helpedAt ? this._timeAgo(h.helpedAt) : '',
              amount: h.priceReduction || 0
            }))
          })
          // 计算剩余倒计时
          if (bargain.expiresAt) {
            const left = Math.max(0, Math.floor((new Date(bargain.expiresAt) - Date.now()) / 1000))
            this.setData({ leftSeconds: left, leftText: this._formatLeftTime(left) })
          }
        }
      }).catch(() => {})
    }

    this.startTimer()
  },

  _initFromParams(options) {
    const { name, origin, price, remain, progress, cover } = options
    const originNum = parseFloat(origin) || 0
    const priceNum = parseFloat(price) || 0
    const remainNum = parseFloat(remain) || 0
    const progressNum = parseFloat(progress) || 0
    const targetSave = originNum - priceNum
    const cutAmount = Math.max(targetSave - remainNum, 0)
    const currentPrice = Math.max(originNum - cutAmount, priceNum)
    const progressPercent = Math.round(progressNum * 100)
    const dealThreshold = 70
    const canDeal = progressPercent >= dealThreshold
    const dealPrice = Math.round(originNum - (targetSave * progressNum))
    this.setData({
      name: decodeURIComponent(name || ''),
      origin: originNum, price: priceNum,
      remain: remainNum, progress: progressNum,
      cover: decodeURIComponent(cover || '') || '',
      currentPrice: currentPrice.toFixed(0),
      cutAmount: cutAmount.toFixed(0),
      progressPercent, dealThreshold, canDeal, dealPrice
    })
    this.generateMockRecords()
  },

  _timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return '刚刚'
    if (diff < 3600) return Math.floor(diff / 60) + '分钟前'
    if (diff < 86400) return Math.floor(diff / 3600) + '小时前'
    return Math.floor(diff / 86400) + '天前'
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
          api.cancelBargain(this.data.id).catch(() => {})
          try {
            const myBargains = wx.getStorageSync('myBargains') || []
            const filtered = myBargains.filter(item => item.id !== this.data.id)
            wx.setStorageSync('myBargains', filtered)
          } catch (e) {
            console.error('删除砍价数据失败:', e)
          }
          wx.showToast({ title: '已取消砍价', icon: 'success' })
          setTimeout(() => { wx.navigateBack() }, 1500)
        }
      }
    })
  },

  // 自己砍一刀
  onSelfCut() {
    api.helpBargain(this.data.id).then((res) => {
      const result = res.data || res || {}
      const cutValue = result.cutAmount || Math.floor(Math.random() * 20) + 5
      this._applyLocalCut(cutValue)
      wx.showToast({ title: `成功砍掉 ¥${cutValue}`, icon: 'success' })
    }).catch(() => {
      // API 失败时使用本地模拟
      const cutValue = Math.floor(Math.random() * 20) + 5
      this._applyLocalCut(cutValue)
      wx.showToast({ title: `成功砍掉 ¥${cutValue}`, icon: 'success' })
    })
  },

  _applyLocalCut(cutValue) {
    const newRemain = Math.max(this.data.remain - cutValue, 0)
    const newCutAmount = parseFloat(this.data.cutAmount) + cutValue
    const targetSave = this.data.origin - this.data.price
    const newProgress = targetSave > 0 ? Math.min(newCutAmount / targetSave, 1) : 0
    const newCurrentPrice = Math.max(this.data.origin - newCutAmount, this.data.price)
    const newProgressPercent = Math.round(newProgress * 100)
    const canDeal = newProgressPercent >= this.data.dealThreshold
    const dealPrice = Math.round(this.data.origin - (targetSave * newProgress))
    this.setData({
      remain: newRemain, cutAmount: newCutAmount.toFixed(0),
      currentPrice: newCurrentPrice.toFixed(0), progressPercent: newProgressPercent,
      canDeal, dealPrice
    })
    const records = [{ avatar: '', name: '我', time: '刚刚', amount: cutValue }, ...this.data.records]
    this.setData({ records })
    this.updateLocalStorage(newRemain, newProgress)
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
