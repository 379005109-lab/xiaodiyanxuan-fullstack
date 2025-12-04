// app.js
const api = require('./utils/api.js')

App({
  onLaunch() {
    // 微信登录
    this.wxLogin()
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
    userInfo: null
  },
  
  // 将 api 挂载到全局，避免懒加载导致的路径问题
  // 必须在 App 函数外部定义，确保在页面加载前可用
  api: api
})
