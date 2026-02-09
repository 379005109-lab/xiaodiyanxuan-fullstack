const app = getApp()
const api = app.api || require('../../utils/api.js')

const mockPackages = [
  {
    id: 1, name: 'B4尊享套餐', subtitle: '精心打造的整体软装方案',
    style: '意式极简', material: '头层真皮', roomType: '三房两厅',
    price: 42830, originalPrice: 58600, discount: '7.3折',
    image: 'https://readdy.ai/api/search-image?query=luxury%20Italian%20minimalist%20living%20room%20furniture%20set%20with%20premium%20leather%20sofa%20modern%20design%20elegant%20interior%20warm%20brown%20and%20gold%20tones%20professional%20photography&width=600&height=500&seq=pkgnew1&orientation=portrait',
    contents: [
      { name: '布艺沙发', quantity: 1, price: 8800 },
      { name: '实木茶几', quantity: 1, price: 2800 },
      { name: '餐桌', quantity: 1, price: 3200 },
      { name: '餐椅', quantity: 4, price: 4800 },
      { name: '主卧床', quantity: 1, price: 12000 },
      { name: '床头柜', quantity: 2, price: 2400 }
    ]
  },
  {
    id: 2, name: 'B2逸享套餐', subtitle: '轻奢舒适的居家方案',
    style: '现代风格', material: '头层真皮', roomType: '三房二厅',
    price: 28546, originalPrice: 42000, discount: '6.8折',
    image: 'https://readdy.ai/api/search-image?query=modern%20contemporary%20living%20room%20with%20beige%20leather%20sofa%20elegant%20furniture%20set%20warm%20lighting%20professional%20interior%20photography%20cream%20and%20brown%20tones&width=600&height=500&seq=pkgnew2&orientation=portrait',
    contents: [
      { name: '真皮沙发组合', quantity: 1, price: 18800 },
      { name: '大理石茶几', quantity: 1, price: 5800 },
      { name: '岩板餐桌', quantity: 1, price: 6800 },
      { name: '餐椅', quantity: 4, price: 4800 }
    ]
  },
  {
    id: 3, name: '测试', subtitle: '精心打造的整体软装方案',
    style: '轻奢现代', material: '进口皮革', roomType: '两房一厅',
    price: 8889, originalPrice: 12000, discount: '7.4折',
    image: 'https://readdy.ai/api/search-image?query=modern%20furniture%20collection%20with%20sofa%20dining%20table%20coffee%20table%20bedroom%20set%20elegant%20design%20professional%20product%20photography%20neutral%20tones&width=600&height=500&seq=pkgnew3&orientation=portrait',
    contents: [
      { name: '沙发', quantity: 1, price: 5800 },
      { name: '茶几', quantity: 1, price: 1800 },
      { name: '餐桌', quantity: 1, price: 2800 }
    ]
  },
  {
    id: 4, name: '六件套', subtitle: '客厅餐厅一站式方案',
    style: '现代简约', material: '优质布艺', roomType: '客餐厅',
    price: 25000, originalPrice: 35000, discount: '7.1折',
    image: 'https://readdy.ai/api/search-image?query=six%20piece%20furniture%20set%20including%20sofa%20coffee%20table%20dining%20table%20chairs%20modern%20minimalist%20design%20professional%20photography%20warm%20lighting&width=600&height=500&seq=pkgnew4&orientation=portrait',
    contents: [
      { name: '钢琴键沙发', quantity: 1, price: 8800 },
      { name: '圆形茶几', quantity: 1, price: 2800 },
      { name: '圆形餐桌', quantity: 1, price: 4200 },
      { name: '芬兰休闲椅', quantity: 1, price: 3200 },
      { name: '沙丘床', quantity: 1, price: 6800 },
      { name: '劳伦斯床', quantity: 1, price: 5200 }
    ]
  }
]

Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
    packages: [],
    isLoading: true
  },

  onLoad() {
    const sysInfo = wx.getWindowInfo()
    const menuBtn = wx.getMenuButtonBoundingClientRect()
    const statusBarHeight = sysInfo.statusBarHeight || 44
    const navBarHeight = menuBtn.bottom + (menuBtn.top - statusBarHeight)
    this.setData({ statusBarHeight, navBarHeight })
    this.loadPackages()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
  },

  loadPackages() {
    this.setData({ isLoading: true })
    api.getPackages().then((data) => {
      const list = data.list || data || []
      this.setData({ packages: list.length > 0 ? list : mockPackages, isLoading: false })
    }).catch(() => {
      this.setData({ packages: mockPackages, isLoading: false })
    })
  },

  goMyPackages() {
    wx.navigateTo({ url: '/pages/package/my/index' })
  },

  goPackageConfig(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/package/config/index?id=' + id })
  }
})


