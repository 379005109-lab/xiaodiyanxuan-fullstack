// app.js
const api = require('./utils/api.js')
import { initLanguage, getLanguage, getLocale } from './utils/i18n/index'

App({
  onLaunch() {
    // 初始化多语言
    this.initI18n()
    // 微信登录
    this.wxLogin()
  },
  
  // 初始化多语言系统
  initI18n() {
    const lang = initLanguage()
    this.globalData.language = lang
    this.globalData.i18n = getLocale()
  },
  
  // 获取当前语言翻译对象
  getI18n() {
    return getLocale()
  },
  
  wxLogin() {
    wx.login({
      success: (res) => {
        if (res.code) {
          // 调用后端登录接口
          this.api.wxLogin(res.code).then((data) => {
            // 保存 token
            if (data.token) {
              wx.setStorageSync('token', data.token)
            }
            // 保存用户信息
            if (data.userInfo) {
              wx.setStorageSync('userInfo', data.userInfo)
            }
          }).catch((err) => {
            console.error('登录失败:', err)
            // 登录失败不影响使用，可以继续使用小程序
          })
        }
      },
      fail: (err) => {
        console.error('获取登录凭证失败:', err)
      }
    })
  },
  
  globalData: {
    userInfo: null,
    language: 'zh',
    i18n: {}
  },
  
  // 将 api 挂载到全局，避免懒加载导致的路径问题
  // 必须在 App 函数外部定义，确保在页面加载前可用
  api: api
})
