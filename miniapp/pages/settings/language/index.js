import { getLanguage, setLanguage, getLocale, languages } from '../../../utils/i18n/index'

Page({
  data: {
    languages: languages,
    currentLang: 'zh',
    i18n: {}
  },

  onLoad() {
    this.setData({
      currentLang: getLanguage(),
      i18n: getLocale()
    })
  },

  onSelectLang(e) {
    const code = e.currentTarget.dataset.code
    if (code === this.data.currentLang) return

    setLanguage(code)
    
    // 更新当前页面
    this.setData({
      currentLang: code,
      i18n: getLocale()
    })

    // 显示提示
    wx.showToast({
      title: this.data.i18n.common.success,
      icon: 'success'
    })

    // 通知其他页面刷新
    const pages = getCurrentPages()
    pages.forEach(page => {
      if (page.route !== 'pages/settings/language/index' && page.refreshI18n) {
        page.refreshI18n()
      }
    })

    // 延迟返回，让用户看到切换效果
    setTimeout(() => {
      wx.navigateBack()
    }, 500)
  }
})
