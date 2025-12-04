Page({
	data: {
		recommendations: [
			{ id: 'r1', name: '配套茶几', price: 1299, thumb: 'https://picsum.photos/200/200?random=100', added: false, count: 0 },
			{ id: 'r2', name: '配套椅子', price: 599, thumb: 'https://picsum.photos/200/200?random=101', added: false, count: 0 },
			{ id: 'r3', name: '配套灯具', price: 899, thumb: 'https://picsum.photos/200/200?random=102', added: false, count: 0 }
		],
		recommendationTotalPrice: 0
	},
	onLoad() {
		this.loadAddedRecommendations()
		this.calculateTotalPrice()
	},
	loadAddedRecommendations() {
		try {
			const added = wx.getStorageSync('addedRecommendations') || []
			const recommendations = this.data.recommendations.map(r => {
				const addedItem = added.find(a => a.id === r.id)
				if (addedItem) {
					return { ...r, added: true, count: addedItem.count || 1 }
				}
				return r
			})
			this.setData({ recommendations })
		} catch (e) {
			console.error('加载推荐商品失败:', e)
		}
	},
	calculateTotalPrice() {
		const recommendationTotalPrice = this.data.recommendations
			.filter(r => r.added)
			.reduce((sum, r) => sum + (r.price || 0) * (r.count || 1), 0)
		this.setData({ recommendationTotalPrice })
	},
	onAddRecommendation(e) {
		const id = e.currentTarget.dataset.id
		const index = e.currentTarget.dataset.index
		const recommendation = { ...this.data.recommendations[index], count: 1 }
		
		const recommendations = this.data.recommendations.map(r => r.id === id ? { ...r, added: true, count: 1 } : r)
		this.setData({ recommendations }, () => {
			this.saveAddedRecommendations()
			this.calculateTotalPrice()
		})
		wx.showToast({ title: '已添加', icon: 'success' })
	},
	onIncreaseRecQuantity(e) {
		const index = e.currentTarget.dataset.index
		const recommendation = this.data.recommendations[index]
		if (recommendation && recommendation.added) {
			const count = (recommendation.count || 1) + 1
			const recommendations = this.data.recommendations.map((r, i) => i === index ? { ...r, count } : r)
			this.setData({ recommendations }, () => {
				this.saveAddedRecommendations()
				this.calculateTotalPrice()
			})
		}
	},
	onDecreaseRecQuantity(e) {
		const index = e.currentTarget.dataset.index
		const recommendation = this.data.recommendations[index]
		if (recommendation && recommendation.added && recommendation.count > 1) {
			const count = recommendation.count - 1
			const recommendations = this.data.recommendations.map((r, i) => i === index ? { ...r, count } : r)
			this.setData({ recommendations }, () => {
				this.saveAddedRecommendations()
				this.calculateTotalPrice()
			})
		}
	},
	onDeleteRecommendation(e) {
		const index = e.currentTarget.dataset.index
		const recommendation = this.data.recommendations[index]
		wx.showModal({
			title: '删除商品',
			content: '确定要删除这个商品吗？',
			success: (res) => {
				if (res.confirm) {
					const recommendations = this.data.recommendations.map((r, i) => i === index ? { ...r, added: false, count: 0 } : r)
					this.setData({ recommendations }, () => {
						this.saveAddedRecommendations()
						this.calculateTotalPrice()
					})
					wx.showToast({ title: '已删除', icon: 'success' })
				}
			}
		})
	},
	saveAddedRecommendations() {
		const addedRecommendations = this.data.recommendations
			.filter(r => r.added)
			.map(r => ({ id: r.id, name: r.name, price: r.price, thumb: r.thumb, count: r.count || 1 }))
		try {
			wx.setStorageSync('addedRecommendations', addedRecommendations)
		} catch (e) {
			console.error('保存推荐商品失败:', e)
		}
	},
	onConfirm() {
		wx.navigateBack()
	}
})

