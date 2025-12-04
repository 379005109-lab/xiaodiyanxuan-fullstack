// index.js
// 使用全局 api，避免懒加载导致的路径问题
const app = getApp()
const api = app.api || require('../../utils/api.js')

Page({
	data: {
		fullscreenImage: '',
		guideServiceImage: '',
		banners: [],
		styles: [],
		hots: []
	},
	onLoad() {
		this.loadHomeData()
	},
	loadHomeData() {
		wx.showLoading({ title: '加载中...' })
		api.getHomeData().then((data) => {
			// 根据后端返回的数据结构设置页面数据
			// 假设后端返回格式：{ fullscreenImage, newProductsImage, banners, styles, hots }
			this.setData({
				fullscreenImage: data.fullscreenImage || 'https://picsum.photos/1080/1920?random=500',
				guideServiceImage: data.guideServiceImage || 'https://picsum.photos/1080/400?random=501',
				banners: data.banners || [],
				styles: data.styles || [],
				hots: data.hots || []
			})
			wx.hideLoading()
		}).catch((err) => {
			console.error('加载首页数据失败:', err)
			wx.hideLoading()
			// 如果请求失败，使用默认数据
			this.setData({
				fullscreenImage: 'https://picsum.photos/1080/1920?random=500',
				guideServiceImage: 'https://picsum.photos/1080/400?random=501',
				banners: [
					'https://picsum.photos/1080/720?random=300',
					'https://picsum.photos/1080/720?random=301',
					'https://picsum.photos/1080/720?random=302'
				],
				styles: [
					{name:'北欧风', img:'https://picsum.photos/1080/1080?random=310'},
					{name:'新中式', img:'https://picsum.photos/1080/1080?random=311'},
					{name:'现代简约', img:'https://picsum.photos/1080/1080?random=312'},
					{name:'原木风', img:'https://picsum.photos/1080/1080?random=313'}
				],
				hots: [
					{ id:'h1', name:'北欧沙发', price:2699, save:600, img:'https://picsum.photos/1080/1080?random=320' },
					{ id:'h2', name:'原木床具', price:3599, save:800, img:'https://picsum.photos/1080/1080?random=321' },
					{ id:'h3', name:'茶几套装', price:899, save:200, img:'https://picsum.photos/1080/1080?random=322' },
					{ id:'h4', name:'布艺单椅', price:899, save:180, img:'https://picsum.photos/1080/1080?random=323' }
				]
			})
		})
	},
	goGuideService() {
		wx.navigateTo({ url: '/pages/guide/index' })
	},
	goFullscreenDetail() {
		wx.showToast({ title: '查看详情', icon: 'none' })
		// 可以跳转到详情页面
	},
	onShow() {
		if (this.getTabBar) {
			this.getTabBar().setData({ selected: 0 })
		}
	},
	goBargain() {
		wx.switchTab({ url: '/pages/bargain/index' })
	},
	goMall() {
		wx.switchTab({ url: '/pages/mall/index' })
	},
	goPackage() {
		wx.switchTab({ url: '/pages/package/index' })
	},
	onSearch() {
		// 跳转到商城页面并聚焦搜索框
		wx.switchTab({ url: '/pages/mall/index' })
	},
	goDesigner() {
		wx.showToast({ title: '设计师专区', icon: 'none' })
		// 可以跳转到设计师专区页面
	},
	goHotDetail(e) {
		const id = e.currentTarget.dataset.id
		// 跳转到商品详情页
		wx.navigateTo({ url: `/pages/mall/detail/index?id=${id}` })
	},
	goStyle(e) {
		const name = e.currentTarget.dataset.name
		// 跳转到商城页面并筛选风格
		wx.switchTab({ url: '/pages/mall/index' })
		// 可以通过事件总线或存储传递风格参数
	}
})
