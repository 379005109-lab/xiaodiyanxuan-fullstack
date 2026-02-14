// app.js
const api = require('./utils/api.js')

App({
  onLaunch(options) {
    // 解析 QR 码场景值，提取 manufacturerId（店铺二维码入口）
    // wxacode scene 格式: mId=<manufacturerId>
    if (options && options.scene) {
      try {
        const scene = decodeURIComponent(options.scene)
        console.log('[App] scene:', scene)
        const params = {}
        scene.split('&').forEach(pair => {
          const [k, v] = pair.split('=')
          if (k && v) params[k] = v
        })
        if (params.mId) {
          this.globalData.manufacturerId = params.mId
          console.log('[App] 进入厂家店铺, manufacturerId:', params.mId)
        }
      } catch (e) {
        console.warn('[App] scene 解析失败:', e)
      }
    }
    // query 参数也可能携带 manufacturerId（普通二维码 / 调试）
    if (options && options.query && options.query.manufacturerId) {
      this.globalData.manufacturerId = options.query.manufacturerId
      console.log('[App] query 进入厂家店铺, manufacturerId:', options.query.manufacturerId)
    }

    // 加载 Remix Icon 字体
    wx.loadFontFace({
      global: true,
      family: 'remixicon',
      source: 'url("https://cdn.jsdelivr.net/npm/remixicon@4.0.0/fonts/remixicon.woff2")',
      scopes: ['webview', 'native'],
      success: () => console.log('[Font] remixicon loaded'),
      fail: (err) => console.warn('[Font] remixicon load failed:', err)
    })
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
    userInfo: null,
    manufacturerId: null
  },
  
  // 将 api 挂载到全局，避免懒加载导致的路径问题
  // 必须在 App 函数外部定义，确保在页面加载前可用
  api: api
})
