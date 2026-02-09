const api = require('../../utils/api.js')

Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
    loginType: 'account',
    // 账号密码
    account: '',
    password: '',
    showPassword: false,
    // 手机号
    phone: '',
    verifyCode: '',
    countdown: 0,
    isSending: false,
    // 协议
    agreeTerms: false,
    // 按钮状态
    isAccountLoginDisabled: true,
    isPhoneLoginDisabled: true
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    const statusBarHeight = sysInfo.statusBarHeight || 44
    this.setData({
      statusBarHeight,
      navBarHeight: statusBarHeight + 44
    })
  },

  onUnload() {
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer)
    }
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/index/index' }) })
  },

  // ========== 切换登录方式 ==========
  switchLoginType(e) {
    this.setData({ loginType: e.currentTarget.dataset.type })
  },

  // ========== 账号密码输入 ==========
  onAccountInput(e) {
    this.setData({ account: e.detail.value })
    this.updateAccountBtnState()
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value })
    this.updateAccountBtnState()
  },

  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword })
  },

  updateAccountBtnState() {
    const { account, password, agreeTerms } = this.data
    this.setData({
      isAccountLoginDisabled: !account || !password || !agreeTerms
    })
  },

  // ========== 手机号输入 ==========
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
    this.updatePhoneBtnState()
  },

  onCodeInput(e) {
    this.setData({ verifyCode: e.detail.value })
    this.updatePhoneBtnState()
  },

  updatePhoneBtnState() {
    const { phone, verifyCode, agreeTerms } = this.data
    this.setData({
      isPhoneLoginDisabled: !phone || !verifyCode || verifyCode.length !== 6 || !agreeTerms
    })
  },

  // ========== 协议 ==========
  toggleTerms() {
    this.setData({ agreeTerms: !this.data.agreeTerms })
    this.updateAccountBtnState()
    this.updatePhoneBtnState()
  },

  viewUserAgreement() {
    wx.showToast({ title: '用户协议', icon: 'none' })
  },

  viewPrivacyPolicy() {
    wx.showToast({ title: '隐私政策', icon: 'none' })
  },

  // ========== 发送验证码 ==========
  handleSendCode() {
    const { phone, countdown, isSending } = this.data
    if (countdown > 0 || isSending) return

    if (!phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' })
      return
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }

    this.setData({ isSending: true })

    api.sendSmsCode(phone).then(() => {
      this.setData({ isSending: false, countdown: 60 })
      wx.showToast({ title: '验证码已发送', icon: 'success' })
      this.startCountdown()
    }).catch(() => {
      this.setData({ isSending: false })
    })
  },

  startCountdown() {
    if (this._countdownTimer) clearInterval(this._countdownTimer)
    this._countdownTimer = setInterval(() => {
      const { countdown } = this.data
      if (countdown <= 1) {
        clearInterval(this._countdownTimer)
        this._countdownTimer = null
        this.setData({ countdown: 0 })
      } else {
        this.setData({ countdown: countdown - 1 })
      }
    }, 1000)
  },

  // ========== 忘记密码 ==========
  onForgotPassword() {
    wx.showToast({ title: '请联系客服重置密码', icon: 'none' })
  },

  // ========== 账号密码登录 ==========
  handleAccountLogin() {
    const { account, password, agreeTerms } = this.data
    if (!account) return wx.showToast({ title: '请输入账号', icon: 'none' })
    if (!password) return wx.showToast({ title: '请输入密码', icon: 'none' })
    if (!agreeTerms) return wx.showToast({ title: '请先同意用户协议和隐私政策', icon: 'none' })

    wx.showLoading({ title: '登录中...' })

    api.accountLogin(account, password).then((data) => {
      wx.hideLoading()
      this.onLoginSuccess(data)
    }).catch((err) => {
      wx.hideLoading()
      console.error('账号登录失败:', err)
    })
  },

  // ========== 手机号登录 ==========
  handlePhoneLogin() {
    const { phone, verifyCode, agreeTerms } = this.data
    if (!phone) return wx.showToast({ title: '请输入手机号', icon: 'none' })
    if (!/^1[3-9]\d{9}$/.test(phone)) return wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
    if (!verifyCode) return wx.showToast({ title: '请输入验证码', icon: 'none' })
    if (verifyCode.length !== 6) return wx.showToast({ title: '请输入6位验证码', icon: 'none' })
    if (!agreeTerms) return wx.showToast({ title: '请先同意用户协议和隐私政策', icon: 'none' })

    wx.showLoading({ title: '登录中...' })

    api.phoneLogin(phone, verifyCode).then((data) => {
      wx.hideLoading()
      this.onLoginSuccess(data)
    }).catch((err) => {
      wx.hideLoading()
      console.error('手机号登录失败:', err)
    })
  },

  // ========== 微信一键登录 ==========
  handleWxLogin() {
    wx.showLoading({ title: '登录中...' })

    wx.login({
      success: (res) => {
        if (res.code) {
          api.wxLogin(res.code).then((data) => {
            wx.hideLoading()
            this.onLoginSuccess(data)
          }).catch((err) => {
            wx.hideLoading()
            console.error('微信登录失败:', err)
          })
        } else {
          wx.hideLoading()
          wx.showToast({ title: '获取登录凭证失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '微信登录失败', icon: 'none' })
      }
    })
  },

  // ========== 登录成功统一处理 ==========
  onLoginSuccess(data) {
    if (data.token) {
      wx.setStorageSync('token', data.token)
    }
    if (data.userId) {
      wx.setStorageSync('userId', data.userId)
    }
    if (data.nickname || data.avatar) {
      const userInfo = wx.getStorageSync('userInfo') || {}
      if (data.nickname) userInfo.nickname = data.nickname
      if (data.avatar) userInfo.avatar = data.avatar
      wx.setStorageSync('userInfo', userInfo)
    }

    wx.showToast({ title: '登录成功', icon: 'success' })

    setTimeout(() => {
      // 如果有回调页面则返回，否则跳到我的页面
      const pages = getCurrentPages()
      if (pages.length > 1) {
        wx.navigateBack()
      } else {
        wx.switchTab({ url: '/pages/profile/index' })
      }
    }, 1000)
  }
})
