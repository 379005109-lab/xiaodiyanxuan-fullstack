// 使用全局 api，避免懒加载导致的路径问题
const app = getApp()
const api = app.api || require('../../utils/api.js')

Page({
	data: {
		tabs: [
			{ name: '全部' }, { name: '沙发' }, { name: '床具' }, { name: '桌椅' }, { name: '定制' }
		],
		currentTab: 0,
		// 顶部搜索与筛选
		searchText: '',
		sortKey: 'comprehensive',
		priceAsc: true,
		showStylePopup: false,
		showCategoryDrawer: false,
		styles: ['中古风','现代风','极简风','轻奢风'],
		selectedStyle: '',
		categories: [{ id: '', name: '全部' }],  // 从后台加载
		selectedCategory: '',  // 使用分类ID
		selectedCategoryName: '全部',

		allGoods: [],
		filteredGoods: [],
		loading: false
	},
	onLoad() {
		this.loadCategories()
		this.loadGoodsList()
		this.closeOverlays()
	},
	// 加载分类列表
	loadCategories() {
		api.getCategories().then((data) => {
			const categoryList = [{ id: '', name: '全部' }]
			if (Array.isArray(data)) {
				data.forEach(c => {
					categoryList.push({ id: c.id, name: c.name })
				})
			}
			this.setData({ categories: categoryList })
		}).catch((err) => {
			console.error('加载分类失败:', err)
		})
	},
	loadGoodsList() {
		this.setData({ loading: true })
		const params = {
			page: 1,
			pageSize: 100
		}
		// 如果选择了分类，添加分类筛选
		if (this.data.selectedCategory) {
			params.category = this.data.selectedCategory
		}
		api.getGoodsList(params).then((data) => {
			// 假设后端返回格式：{ list: [], total: 0 }
			const goodsList = data.list || data || []
			this.setData({
				allGoods: goodsList,
				loading: false
			}, () => {
				this.applyFilter()
			})
		}).catch((err) => {
			console.error('加载商品列表失败:', err)
			this.setData({ loading: false })
			// 如果请求失败，使用默认数据
			this.setData({
				allGoods: [
					{ id: 'g1', name: '莫兰迪沙发', price: 2699, thumb: 'https://picsum.photos/1080/1080?random=200', style: '现代风', category: '沙发' },
					{ id: 'g2', name: '原木床具', price: 3599, thumb: 'https://picsum.photos/1080/1080?random=201', style: '极简风', category: '家具' },
					{ id: 'g3', name: '北欧餐椅', price: 499, thumb: 'https://picsum.photos/1080/1080?random=202', style: '现代风', category: '家具' },
					{ id: 'g4', name: '茶几套装', price: 899, thumb: 'https://picsum.photos/1080/1080?random=203', style: '中古风', category: '家具' },
					{ id: 'g5', name: '定制衣柜', price: 5299, thumb: 'https://picsum.photos/1080/1080?random=204', style: '极简风', category: '家具' },
					{ id: 'g6', name: '布艺沙发', price: 2899, thumb: 'https://picsum.photos/1080/1080?random=205', style: '轻奢风', category: '沙发' }
				]
			}, () => {
				this.applyFilter()
			})
		})
	},
	onShow() {
		if (this.getTabBar) {
			this.getTabBar().setData({ selected: 2 })
		}
		// 打开时关闭可能残留的弹层
		this.closeOverlays()
	},
	onTabChange(e) {
		this.setData({ currentTab: e.currentTarget.dataset.index });
	},
	// 搜索
	onSearchInput(e) { this.setData({ searchText: e.detail.value }) },
	onSearchConfirm() {
		const keyword = this.data.searchText
		if (keyword) {
			// 调用搜索接口
			this.setData({ loading: true })
			api.searchGoods(keyword).then((data) => {
				const goodsList = data.list || data || []
				this.setData({
					allGoods: goodsList,
					loading: false
				}, () => {
					this.applyFilter()
				})
			}).catch((err) => {
				console.error('搜索失败:', err)
				this.setData({ loading: false })
				this.applyFilter()
			})
		} else {
			// 如果没有关键词，重新加载全部商品
			this.loadGoodsList()
		}
	},

	// 顶部排序
	onTapSort(e) { this.closeOverlays(); this.setData({ sortKey: e.currentTarget.dataset.key }, this.applyFilter) },
	onTapPrice() { this.closeOverlays(); this.setData({ sortKey: 'price', priceAsc: !this.data.priceAsc }, this.applyFilter) },

	// 风格筛选
	toggleStyle() { this.setData({ showStylePopup: !this.data.showStylePopup, showCategoryDrawer: false }) },
	onSelectStyle(e) { this.setData({ selectedStyle: e.currentTarget.dataset.style }) },
	resetStyle() { this.setData({ selectedStyle: '' }) },
	applyStyle() { this.setData({ showStylePopup: false }, this.applyFilter) },

	// 类别抽屉
	openCategory() { this.setData({ showCategoryDrawer: true, showStylePopup: false }) },
	closeCategory() { this.setData({ showCategoryDrawer: false }) },
	onSelectCategory(e) { 
		const catId = e.currentTarget.dataset.id || ''
		const catName = e.currentTarget.dataset.name || '全部'
		this.setData({ 
			selectedCategory: catId, 
			selectedCategoryName: catName,
			showCategoryDrawer: false 
		})
		// 重新加载商品列表（按分类筛选）
		this.loadGoodsList()
	},
	closeOverlays() { this.setData({ showStylePopup: false, showCategoryDrawer: false }) },

	applyFilter() {
		const { searchText, selectedStyle } = this.data
		let list = this.data.allGoods.slice()
		// 搜索
		if (searchText) list = list.filter(g => (g.name || '').includes(searchText))
		// 风格
		if (selectedStyle) list = list.filter(g => g.style === selectedStyle)
		// 排序
		if (this.data.sortKey === 'sales') {
			list.sort((a, b) => (b.sales || 0) - (a.sales || 0))
		} else if (this.data.sortKey === 'price') {
			list.sort((a, b) => this.data.priceAsc ? a.price - b.price : b.price - a.price)
		}
		this.setData({ filteredGoods: list })
	},
	goDetail(e) {
		// 若弹层展开，先关闭，不进行跳转
		if (this.data.showStylePopup || this.data.showCategoryDrawer) {
			this.closeOverlays()
			return
		}
		const id = e.currentTarget.dataset.id
		wx.navigateTo({ url: `/pages/mall/detail/index?id=${id}` })
	}
})


