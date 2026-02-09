Page({
	data: {
		packageId: '',
		// 当前查看的视角索引
		currentViewIndex: 0,
		currentPreviewLabel: '',
		// 每个类别对应的图片组（使用占位图，实际项目中应使用真实图片URL）
		categoryImages: {
			sofa: [
				'https://picsum.photos/1080/720?random=1001',
				'https://picsum.photos/1080/720?random=1002',
				'https://picsum.photos/1080/720?random=1003'
			],
			table: [
				'https://picsum.photos/1080/720?random=2001',
				'https://picsum.photos/1080/720?random=2002',
				'https://picsum.photos/1080/720?random=2003'
			],
			bed: [
				'https://picsum.photos/1080/720?random=3001',
				'https://picsum.photos/1080/720?random=3002',
				'https://picsum.photos/1080/720?random=3003'
			],
			nightstand: [
				'https://picsum.photos/1080/720?random=4001',
				'https://picsum.photos/1080/720?random=4002',
				'https://picsum.photos/1080/720?random=4003'
			],
			'dining-table': [
				'https://picsum.photos/1080/720?random=5001',
				'https://picsum.photos/1080/720?random=5002',
				'https://picsum.photos/1080/720?random=5003'
			],
			'dining-chair': [
				'https://picsum.photos/1080/720?random=6001',
				'https://picsum.photos/1080/720?random=6002',
				'https://picsum.photos/1080/720?random=6003'
			]
		},
		// 当前类别的预览图列表
		previewImages: [],
		// 当前主图
		currentViewImage: '',
		// 类别配置
		// allowRepeat: true 表示可以重复选择同一个商品（如床头柜、餐椅）
		// allowRepeat: false 表示不能重复选择，只能选一个（如沙发、床、茶几、餐桌）
		categories: [
			{ key: 'sofa', name: '沙发', required: 1, selected: false, allowRepeat: false, remaining: 1 },
			{ key: 'table', name: '茶几', required: 1, selected: false, allowRepeat: false, remaining: 1 },
			{ key: 'bed', name: '软床', required: 1, selected: false, allowRepeat: false, remaining: 1 },
			{ key: 'nightstand', name: '床头柜', required: 2, selected: false, allowRepeat: true, remaining: 2 },
			{ key: 'dining-table', name: '餐桌', required: 1, selected: false, allowRepeat: false, remaining: 1 },
			{ key: 'dining-chair', name: '餐椅', required: 4, selected: false, allowRepeat: true, remaining: 4 }
		],
		// 当前选中的类别
		currentCategory: 'sofa',
		// 所有商品数据
		allGoods: {
			sofa: [
				{ id: 's1', code: 'FS-SF3201', dims: '240*90*80cm', thumb: 'https://picsum.photos/400/400?random=10', price: 5999, count: 0, material: '标准皮革', materialColor: '经典黑', fill: '高密度海绵', frame: '实木框架', leg: '木质脚' },
				{ id: 's2', code: 'FS-SF3202', dims: '280*100*85cm', thumb: 'https://picsum.photos/400/400?random=11', price: 6999, count: 0, material: '标准皮革', materialColor: '米白色', fill: '高密度海绵', frame: '实木框架', leg: '木质脚' },
				{ id: 's3', code: 'FS-SF3203', dims: '300*110*88cm', thumb: 'https://picsum.photos/400/400?random=12', price: 7999, count: 0, material: '全青皮', materialColor: '经典黑', fill: '海绵+羽绒', frame: '加厚实木', leg: '金属脚' },
				{ id: 's4', code: 'FS-SF3204', dims: '320*120*90cm', thumb: 'https://picsum.photos/400/400?random=13', price: 8999, count: 0, material: '标准皮革', materialColor: '深棕色', fill: '高密度海绵', frame: '实木框架', leg: '木质脚' },
				{ id: 's5', code: 'FS-SF3205', dims: '340*130*92cm', thumb: 'https://picsum.photos/400/400?random=14', price: 9999, count: 0, material: '全青皮', materialColor: '米白色', fill: '海绵+羽绒', frame: '加厚实木', leg: '金属脚' },
				{ id: 's6', code: 'FS-SF3206', dims: '360*140*95cm', thumb: 'https://picsum.photos/400/400?random=15', price: 10999, count: 0, material: '标准皮革', materialColor: '经典黑', fill: '高密度海绵', frame: '实木框架', leg: '木质脚' },
				{ id: 's7', code: 'FS-SF3207', dims: '380*150*98cm', thumb: 'https://picsum.photos/400/400?random=16', price: 11999, count: 0, material: '全青皮', materialColor: '深棕色', fill: '海绵+羽绒', frame: '加厚实木', leg: '金属脚' },
				{ id: 's8', code: 'FS-SF3208', dims: '400*160*100cm', thumb: 'https://picsum.photos/400/400?random=17', price: 12999, count: 0, material: '标准皮革', materialColor: '米白色', fill: '高密度海绵', frame: '实木框架', leg: '木质脚' },
				{ id: 's9', code: 'FS-SF3209', dims: '420*170*102cm', thumb: 'https://picsum.photos/400/400?random=18', price: 13999, count: 0, material: '全青皮', materialColor: '经典黑', fill: '海绵+羽绒', frame: '加厚实木', leg: '金属脚' },
				{ id: 's10', code: 'FS-SF3210', dims: '440*180*105cm', thumb: 'https://picsum.photos/400/400?random=19', price: 14999, count: 0, material: '标准皮革', materialColor: '深棕色', fill: '高密度海绵', frame: '实木框架', leg: '木质脚' },
				{ id: 's11', code: 'FS-SF3211', dims: '460*190*108cm', thumb: 'https://picsum.photos/400/400?random=20', price: 15999, count: 0, material: '全青皮', materialColor: '米白色', fill: '海绵+羽绒', frame: '加厚实木', leg: '金属脚' },
				{ id: 's12', code: 'FS-SF3212', dims: '480*200*110cm', thumb: 'https://picsum.photos/400/400?random=21', price: 16999, count: 0, material: '标准皮革', materialColor: '经典黑', fill: '高密度海绵', frame: '实木框架', leg: '木质脚' }
			],
			table: [
				{ id: 't1', code: 'FS-TCJ3201', dims: '120*60*40cm', thumb: 'https://picsum.photos/400/400?random=20', price: 1299, count: 0, material: '实木', materialColor: '', fill: '', frame: '', leg: '木质脚' },
				{ id: 't2', code: 'FS-TCJ3202', dims: '140*70*45cm', thumb: 'https://picsum.photos/400/400?random=21', price: 1599, count: 0, material: '实木', materialColor: '', fill: '', frame: '', leg: '金属脚' },
				{ id: 't3', code: 'FS-TCJ3203', dims: '140*100*30cm', thumb: 'https://picsum.photos/400/400?random=22', price: 1899, count: 0, material: '实木', materialColor: '', fill: '', frame: '', leg: '木质脚' }
			],
			bed: [
				{ id: 'b1', code: 'FS-RC3201', dims: '200*180*50cm', thumb: 'https://picsum.photos/400/400?random=30', price: 8999, count: 0, material: '标准皮革', materialColor: '经典黑', fill: '高密度海绵', frame: '实木框架', leg: '木质脚' },
				{ id: 'b2', code: 'FS-RC3202', dims: '220*200*55cm', thumb: 'https://picsum.photos/400/400?random=31', price: 10999, count: 0, material: '标准皮革', materialColor: '米白色', fill: '高密度海绵', frame: '实木框架', leg: '木质脚' },
				{ id: 'b3', code: 'FS-RC3203', dims: '240*220*60cm', thumb: 'https://picsum.photos/400/400?random=32', price: 12999, count: 0, material: '全青皮', materialColor: '经典黑', fill: '海绵+羽绒', frame: '加厚实木', leg: '金属脚' },
				{ id: 'b4', code: 'FS-RC3204', dims: '260*240*65cm', thumb: 'https://picsum.photos/400/400?random=33', price: 13999, count: 0, material: '标准皮革', materialColor: '深棕色', fill: '高密度海绵', frame: '实木框架', leg: '木质脚' },
				{ id: 'b5', code: 'FS-RC3205', dims: '280*260*70cm', thumb: 'https://picsum.photos/400/400?random=34', price: 14999, count: 0, material: '全青皮', materialColor: '米白色', fill: '海绵+羽绒', frame: '加厚实木', leg: '金属脚' },
				{ id: 'b6', code: 'FS-RC3206', dims: '300*280*75cm', thumb: 'https://picsum.photos/400/400?random=35', price: 15999, count: 0, material: '标准皮革', materialColor: '经典黑', fill: '高密度海绵', frame: '实木框架', leg: '木质脚' },
				{ id: 'b7', code: 'FS-RC3207', dims: '320*300*80cm', thumb: 'https://picsum.photos/400/400?random=36', price: 16999, count: 0, material: '全青皮', materialColor: '深棕色', fill: '海绵+羽绒', frame: '加厚实木', leg: '金属脚' },
				{ id: 'b8', code: 'FS-RC3208', dims: '340*320*85cm', thumb: 'https://picsum.photos/400/400?random=37', price: 17999, count: 0, material: '标准皮革', materialColor: '米白色', fill: '高密度海绵', frame: '实木框架', leg: '木质脚' },
				{ id: 'b9', code: 'FS-RC3209', dims: '360*340*90cm', thumb: 'https://picsum.photos/400/400?random=38', price: 18999, count: 0, material: '全青皮', materialColor: '经典黑', fill: '海绵+羽绒', frame: '加厚实木', leg: '金属脚' },
				{ id: 'b10', code: 'FS-RC3210', dims: '380*360*95cm', thumb: 'https://picsum.photos/400/400?random=39', price: 19999, count: 0, material: '标准皮革', materialColor: '深棕色', fill: '高密度海绵', frame: '实木框架', leg: '木质脚' },
				{ id: 'b11', code: 'FS-RC3211', dims: '400*380*100cm', thumb: 'https://picsum.photos/400/400?random=40', price: 20999, count: 0, material: '全青皮', materialColor: '米白色', fill: '海绵+羽绒', frame: '加厚实木', leg: '金属脚' },
				{ id: 'b12', code: 'FS-RC3212', dims: '420*400*105cm', thumb: 'https://picsum.photos/400/400?random=41', price: 21999, count: 0, material: '标准皮革', materialColor: '经典黑', fill: '高密度海绵', frame: '实木框架', leg: '木质脚' }
			],
			nightstand: [
				{ id: 'n1', code: 'FS-CTG3201', dims: '50*40*50cm', thumb: 'https://picsum.photos/400/400?random=40', price: 599, count: 0, material: '实木', materialColor: '', fill: '', frame: '', leg: '' },
				{ id: 'n2', code: 'FS-CTG3202', dims: '55*45*55cm', thumb: 'https://picsum.photos/400/400?random=41', price: 699, count: 0, material: '实木', materialColor: '', fill: '', frame: '', leg: '' },
				{ id: 'n3', code: 'FS-CTG3203', dims: '60*50*60cm', thumb: 'https://picsum.photos/400/400?random=42', price: 799, count: 0, material: '实木', materialColor: '', fill: '', frame: '', leg: '' }
			],
			'dining-table': [
				{ id: 'dt1', code: 'FS-CZ3201', dims: '160*80*75cm', thumb: 'https://picsum.photos/400/400?random=50', price: 2999, count: 0, material: '实木', materialColor: '', fill: '', frame: '', leg: '木质脚' },
				{ id: 'dt2', code: 'FS-CZ3202', dims: '180*90*75cm', thumb: 'https://picsum.photos/400/400?random=51', price: 3499, count: 0, material: '实木', materialColor: '', fill: '', frame: '', leg: '金属脚' },
				{ id: 'dt3', code: 'FS-CZ3203', dims: '200*100*75cm', thumb: 'https://picsum.photos/400/400?random=52', price: 3999, count: 0, material: '实木', materialColor: '', fill: '', frame: '', leg: '木质脚' }
			],
			'dining-chair': [
				{ id: 'dc1', code: 'FS-CY3201', dims: '45*45*85cm', thumb: 'https://picsum.photos/400/400?random=60', price: 299, count: 0, material: '标准皮革', materialColor: '经典黑', fill: '高密度海绵', frame: '实木框架', leg: '木质脚' },
				{ id: 'dc2', code: 'FS-CY3202', dims: '50*50*90cm', thumb: 'https://picsum.photos/400/400?random=61', price: 399, count: 0, material: '标准皮革', materialColor: '米白色', fill: '高密度海绵', frame: '实木框架', leg: '金属脚' },
				{ id: 'dc3', code: 'FS-CY3203', dims: '55*55*95cm', thumb: 'https://picsum.photos/400/400?random=62', price: 499, count: 0, material: '全青皮', materialColor: '深棕色', fill: '海绵+羽绒', frame: '加厚实木', leg: '木质脚' }
			]
		},
		// 当前显示的商品列表
		currentGoodsList: [],
		// 总价（一口价，固定不变）
		totalPrice: 9999, // 一口价
		// 原价（划线价，固定不变）
		originalPrice: 14999, // 原价
		// 选中的商品映射（存储每个商品的选中数量）
		selectedGoods: {},
		// 下一个类别名称
		nextCategoryName: '',
		// 是否有下一个类别
		hasNextCategory: true,
		// 导航栏滚动位置
		scrollIntoView: '',
		// 搭配推荐产品
		recommendations: [
			{ id: 'r1', name: '配套茶几', price: 1299, thumb: 'https://picsum.photos/200/200?random=100' },
			{ id: 'r2', name: '配套椅子', price: 599, thumb: 'https://picsum.photos/200/200?random=101' },
			{ id: 'r3', name: '配套灯具', price: 899, thumb: 'https://picsum.photos/200/200?random=102' }
		],
		hasSelectedGoods: false,
		currentCategoryIndex: 0,
		previewLabels: [], // 预览图对应的标签
		// 商品详情弹窗
		showGoodsModal: false,
		goodsModalData: null,
		goodsModalVariants: [],
		goodsModalVariantId: '',
		pendingGoodsId: '',
		selectedGoodsVariant: {},
		// 面料选择
		goodsModalFabrics: [],
		goodsModalFabricIndex: 0,
		goodsModalAllowRepeat: false,
		goodsModalQuantity: 1
	},
	onLoad(query) {
		const { id = '' } = query || {}
		this.setData({ packageId: id })
		
		// 立即设置初始显示数据，确保页面立即渲染
		const category = this.data.categories.find(c => c.key === 'sofa')
		const images = this.data.categoryImages['sofa'] || []
		const goodsList = (this.data.allGoods['sofa'] || []).map(item => ({
			...item,
			count: 0,
			allowRepeat: category ? category.allowRepeat : false,
			variants: this.buildVariants(item, 'sofa')
		}))
		
		// 当前类别的预览图与标签
		const previewImages = images
		const categoryName = category && category.name ? category.name : '视角'
		const previewLabels = images.map((_, idx) => `${categoryName} · ${idx + 1}`)
		
		// 立即设置数据，让页面显示（一口价模式，总价固定）
		this.setData({
			currentCategory: 'sofa',
			currentCategoryIndex: 0,
			currentViewIndex: 0,
			previewImages: previewImages,
			previewLabels: previewLabels,
			currentViewImage: images[0] || '',
			currentPreviewLabel: previewLabels[0] || '',
			currentGoodsList: goodsList,
			totalPrice: this.data.totalPrice, // 一口价，不变
			hasNextCategory: true,
			nextCategoryName: (this.data.categories.find(c => c.key !== 'sofa') || {}).name || ''
		})
		
		// 延迟执行其他初始化逻辑，不阻塞页面渲染
		setTimeout(() => {
			this.checkCategorySelected('sofa')
			this.calculateTotal()
			this.updateNextCategory()
		}, 50)
	},
	// 初始化类别
	initCategory(categoryKey) {
		const categories = this.data.categories || []
		const categoryIndex = categories.findIndex(c => c.key === categoryKey)
		if (categoryIndex === -1) return
		const category = categories[categoryIndex]
		
		// 获取该类别的图片组
		const images = this.data.categoryImages[categoryKey] || []
		
		// 更新商品列表，使用count而不是selected，并添加allowRepeat属性
		const goodsList = (this.data.allGoods[categoryKey] || []).map(item => ({
			...item,
			count: this.data.selectedGoods[item.id] || 0,
			allowRepeat: category.allowRepeat,
			variants: this.buildVariants(item, categoryKey)
		}))
		
		// 当前类别的预览图和标签
		const previewImages = images
		const categoryName = category.name || '视角'
		const previewLabels = images.map((_, idx) => `${categoryName} · 视角 ${idx + 1}`)
		
		this.setData({
			currentCategory: categoryKey,
			currentCategoryIndex: categoryIndex,
			currentViewIndex: 0,
			previewImages: previewImages,
			previewLabels: previewLabels,
			currentViewImage: images[0] || '',
			currentPreviewLabel: previewLabels[0] || '',
			currentGoodsList: goodsList,
			scrollIntoView: `nav-${categoryKey}`
		})
		
		// 异步执行其他逻辑
		setTimeout(() => {
			this.checkCategorySelected(categoryKey)
			this.calculateTotal()
			this.updateNextCategory()
		}, 10)
		
		// 延迟滚动
		setTimeout(() => {
			wx.pageScrollTo({ scrollTop: 0, duration: 300 }).catch(() => {})
		}, 150)
	},
	// 检查类别是否已选择完成
	checkCategorySelected(categoryKey) {
		const category = this.data.categories.find(c => c.key === categoryKey)
		if (!category) return
		
		// 计算该类别的总选中数量
		const totalSelected = this.data.currentGoodsList.reduce((sum, g) => sum + (g.count || 0), 0)
		const isSelected = totalSelected >= category.required
		// 计算剩余需要选择的数量
		const remaining = Math.max(0, category.required - totalSelected)
		
		const categories = this.data.categories.map(c => {
			if (c.key === categoryKey) {
				return { ...c, selected: isSelected, remaining: remaining }
			}
			return c
		})
		
		this.setData({ categories }, () => {
			this.updateNextCategory()
			// 检查是否所有类别都选完了
			const allSelected = categories.every(c => c.selected)
			if (allSelected && isSelected) {
				// 所有类别都选完了，不自动跳转，显示确认订单按钮
				// 用户需要手动点击确认订单按钮
			} else if (isSelected) {
				// 当前类别选完了，但还有未完成的类别，自动跳转到下一个类别
				setTimeout(() => {
					this.autoNextCategory()
				}, 800)
			}
		})
	},
	// 点击预览图
	onTapPreview(e) {
		const index = Number(e.currentTarget.dataset.index || 0)
		const { previewImages = [], previewLabels = [] } = this.data
		const safeIndex = index >= 0 && index < previewImages.length ? index : 0
		const nextImage = previewImages[safeIndex] || ''
		const nextLabel = previewLabels[safeIndex] || ''
		this.setData({
			currentViewIndex: safeIndex,
			currentViewImage: nextImage,
			currentPreviewLabel: nextLabel
		})
	},
	// 点击类别导航
	onTapCategory(e) {
		const key = e.currentTarget.dataset.key
		if (this.data.showGoodsModal) {
			this.closeGoodsModal()
		}
		this.initCategory(key)
	},
	// 减少商品数量（取消）
	onReduceGoods(e) {
		const id = e.currentTarget.dataset.id
		const goods = this.data.currentGoodsList.find(g => g.id === id)
		if (!goods || goods.count <= 0) return
		
		const category = this.data.categories.find(c => c.key === this.data.currentCategory)
		if (!category || !category.allowRepeat) return
		
		// 减少数量
		const newCount = goods.count - 1
		this.data.selectedGoods[id] = newCount > 0 ? newCount : 0
		if (newCount <= 0) {
			delete this.data.selectedGoodsVariant[id]
		}
		
		// 更新商品列表
		const currentGoodsList = this.data.currentGoodsList.map(g => ({
			...g,
			count: g.id === id ? (newCount > 0 ? newCount : 0) : g.count,
			allowRepeat: category.allowRepeat
		}))
		
		this.setData({ currentGoodsList }, () => {
			this.checkCategorySelected(this.data.currentCategory)
			this.calculateTotal()
			this.updateRecommendations()
		})
	},
	buildVariants(goods, categoryKey) {
		if (goods.variants && goods.variants.length) return goods.variants
		if (categoryKey === 'sofa') {
			return [
				{ id: `${goods.id}-double`, label: '双人沙发', desc: '适合2-3人使用', priceDelta: 0 },
				{ id: `${goods.id}-triple`, label: '三人沙发', desc: '适合3-4人使用', priceDelta: 1500 },
				{ id: `${goods.id}-chaise`, label: '贵妃组合', desc: '含贵妃位+脚踏', priceDelta: 3200 }
			]
		}
		if (categoryKey === 'bed') {
			return [
				{ id: `${goods.id}-queen`, label: '标准款', desc: '1.8m × 2.0m', priceDelta: 0 },
				{ id: `${goods.id}-king`, label: '加大款', desc: '2.0m × 2.2m', priceDelta: 1800 }
			]
		}
		if (categoryKey === 'dining-chair') {
			return [
				{ id: `${goods.id}-std`, label: '标准高度', desc: '45cm 座高', priceDelta: 0 },
				{ id: `${goods.id}-high`, label: '高脚款', desc: '50cm 座高', priceDelta: 200 }
			]
		}
		return [
			{ id: `${goods.id}-default`, label: '标准配置', desc: goods.dims || '', priceDelta: 0 }
		]
	},
	openGoodsModal(goods) {
		const parsedDims = this.parseDims(goods.dims)
		const variants = this.buildVariants(goods, this.data.currentCategory)
		const selectedVariant = this.data.selectedGoodsVariant[goods.id]
		const defaultVariantId = variants.find(v => v.id === selectedVariant)?.id || (variants[0] && variants[0].id) || ''
		
		// 面料选项（材质+颜色合并）
		const fabrics = this.getFabricOptions(this.data.currentCategory)
		const fabricIndex = fabrics.findIndex(f => f.name === goods.fabric) >= 0 ? fabrics.findIndex(f => f.name === goods.fabric) : 0
		
		// 获取当前类别配置
		const category = this.data.categories.find(c => c.key === this.data.currentCategory)
		const allowRepeat = category ? category.allowRepeat : false
		const currentQty = goods.count || 1
		
		this.setData({
			showGoodsModal: true,
			pendingGoodsId: goods.id,
			goodsModalData: {
				...goods,
				dimsParsed: parsedDims
			},
			goodsModalVariants: variants,
			goodsModalVariantId: defaultVariantId,
			goodsModalFabrics: fabrics,
			goodsModalFabricIndex: fabricIndex,
			goodsModalAllowRepeat: allowRepeat,
			goodsModalQuantity: allowRepeat ? Math.max(1, currentQty) : 1
		})
	},
	// 获取面料选项（材质+颜色合并）
	getFabricOptions(categoryKey) {
		if (['sofa', 'bed', 'dining-chair'].includes(categoryKey)) {
			return [
				{ id: 'f1', name: '标准皮革-经典黑', img: 'https://picsum.photos/100/100?random=201' },
				{ id: 'f2', name: '标准皮革-米白色', img: 'https://picsum.photos/100/100?random=202' },
				{ id: 'f3', name: '全青皮-深棕色', img: 'https://picsum.photos/100/100?random=203' },
				{ id: 'f4', name: '科技布-浅灰色', img: 'https://picsum.photos/100/100?random=204' },
				{ id: 'f5', name: '科技布-米白色', img: 'https://picsum.photos/100/100?random=205' },
				{ id: 'f6', name: '科技布-深蓝色', img: 'https://picsum.photos/100/100?random=206' }
			]
		}
		if (['table', 'nightstand', 'dining-table'].includes(categoryKey)) {
			return [
				{ id: 'f7', name: '实木-原木色', img: 'https://picsum.photos/100/100?random=207' },
				{ id: 'f8', name: '实木-胡桃色', img: 'https://picsum.photos/100/100?random=208' },
				{ id: 'f9', name: '岩板-雪花白', img: 'https://picsum.photos/100/100?random=209' },
				{ id: 'f10', name: '岩板-灰色', img: 'https://picsum.photos/100/100?random=210' }
			]
		}
		return []
	},
	// 选择面料
	onSelectFabric(e) {
		const index = e.currentTarget.dataset.index
		this.setData({ goodsModalFabricIndex: index })
	},
	// 弹窗内增加数量
	onModalIncreaseQty() {
		const category = this.data.categories.find(c => c.key === this.data.currentCategory)
		if (!category) return
		const currentTotal = this.data.currentGoodsList.reduce((sum, g) => sum + (g.count || 0), 0)
		const goods = this.data.currentGoodsList.find(g => g.id === this.data.pendingGoodsId)
		const existingCount = goods ? goods.count : 0
		const newQty = this.data.goodsModalQuantity + 1
		// 检查是否超过限制
		if (currentTotal - existingCount + newQty > category.required) {
			wx.showToast({ title: `最多选择${category.required}件`, icon: 'none' })
			return
		}
		this.setData({ goodsModalQuantity: newQty })
	},
	// 弹窗内减少数量
	onModalDecreaseQty() {
		if (this.data.goodsModalQuantity <= 1) return
		this.setData({ goodsModalQuantity: this.data.goodsModalQuantity - 1 })
	},
	closeGoodsModal() {
		this.setData({
			showGoodsModal: false,
			goodsModalData: null,
			goodsModalVariants: [],
			goodsModalVariantId: '',
			pendingGoodsId: '',
			goodsModalFabrics: [],
			goodsModalFabricIndex: 0,
			goodsModalAllowRepeat: false,
			goodsModalQuantity: 1
		})
	},
	parseDims(dims = '') {
		if (!dims) return { length: '', width: '', height: '' }
		const clean = dims.replace(/cm|厘米|CM|\s/g, '').replace(/×/g, 'x')
		const parts = clean.split(/[x\*]/).filter(Boolean)
		return {
			length: parts[0] || '',
			width: parts[1] || '',
			height: parts[2] || ''
		}
	},
	onTapGoods(e) {
		const id = e.currentTarget.dataset.id
		const goods = this.data.currentGoodsList.find(g => g.id === id)
		if (!goods) return
		this.openGoodsModal(goods)
	},
	confirmGoodsSelection() {
		const goodsId = this.data.pendingGoodsId
		if (!goodsId) {
			this.closeGoodsModal()
			return
		}
		
		// 获取选择的面料
		const fabrics = this.data.goodsModalFabrics
		const fabricIndex = this.data.goodsModalFabricIndex
		const selectedFabric = fabrics[fabricIndex]?.name || ''
		const quantity = this.data.goodsModalQuantity || 1
		
		// 更新商品的面料信息
		this.handleSelectGoodsWithOptions(goodsId, this.data.goodsModalVariantId, selectedFabric, quantity)
		this.closeGoodsModal()
	},
	// 带选项的商品选择
	handleSelectGoodsWithOptions(id, variantId, fabric, quantity) {
		const category = this.data.categories.find(c => c.key === this.data.currentCategory)
		if (!category) return
		
		const goods = this.data.currentGoodsList.find(g => g.id === id)
		if (!goods) return
		
		// 保存变体选择
		if (variantId) {
			this.data.selectedGoodsVariant[id] = variantId
		}
		
		if (category.allowRepeat) {
			// 可重复选择模式：直接设置数量
			this.data.selectedGoods[id] = quantity
			
			const currentGoodsList = this.data.currentGoodsList.map(g => ({
				...g,
				count: g.id === id ? quantity : g.count,
				fabric: g.id === id ? fabric : g.fabric,
				allowRepeat: category.allowRepeat
			}))
			
			this.setData({ currentGoodsList }, () => {
				this.checkCategorySelected(this.data.currentCategory)
				this.calculateTotal()
			})
		} else {
			// 单选模式：取消其他选择
			this.data.currentGoodsList.forEach(g => {
				if (g.id !== id) {
					this.data.selectedGoods[g.id] = 0
					delete this.data.selectedGoodsVariant[g.id]
				}
			})
			this.data.selectedGoods[id] = 1
			
			const currentGoodsList = this.data.currentGoodsList.map(g => ({
				...g,
				count: g.id === id ? 1 : 0,
				fabric: g.id === id ? fabric : g.fabric,
				allowRepeat: category.allowRepeat
			}))
			
			this.setData({ currentGoodsList }, () => {
				this.checkCategorySelected(this.data.currentCategory)
				this.calculateTotal()
				this.updateRecommendations()
			})
		}
	},
	onSelectVariant(e) {
		const id = e.currentTarget.dataset.id
		if (!id) return
		this.setData({ goodsModalVariantId: id })
	},
	handleSelectGoods(id, variantId = '') {
		
		const category = this.data.categories.find(c => c.key === this.data.currentCategory)
		if (!category) return
		
		// 计算当前类别总选中数量
		const currentTotal = this.data.currentGoodsList.reduce((sum, g) => sum + (g.count || 0), 0)
		const goods = this.data.currentGoodsList.find(g => g.id === id)
		if (!goods) return
		const chosenVariantId = variantId || this.data.selectedGoodsVariant[id] || ''
		if (chosenVariantId) {
			this.data.selectedGoodsVariant[id] = chosenVariantId
		}
		const currentCount = goods.count || 0
		
		// 如果允许重复选择（如床头柜、餐椅）
		if (category.allowRepeat) {
			// 每次点击增加数量（可以连续点击多次）
			// 检查增加后是否超过总数限制
			if (currentTotal >= category.required) {
				wx.showToast({ title: `最多选择${category.required}件`, icon: 'none' })
				return
			}
			const newCount = currentCount + 1
			this.data.selectedGoods[id] = newCount
			
			// 更新商品列表
			const currentGoodsList = this.data.currentGoodsList.map(g => ({
				...g,
				count: g.id === id ? newCount : g.count,
				allowRepeat: category.allowRepeat
			}))
			
			this.setData({ currentGoodsList }, () => {
				this.checkCategorySelected(this.data.currentCategory)
				this.calculateTotal()
			})
		} else {
			// 单选模式（如沙发、床、茶几、餐桌）- 只能选一个，选中后取消其他
			if (currentCount > 0) {
				// 取消选择
				this.data.selectedGoods[id] = 0
				const currentGoodsList = this.data.currentGoodsList.map(g => ({
					...g,
					count: g.id === id ? 0 : g.count,
					allowRepeat: category.allowRepeat
				}))
				this.setData({ currentGoodsList }, () => {
					this.checkCategorySelected(this.data.currentCategory)
					this.calculateTotal()
					this.updateRecommendations()
				})
				delete this.data.selectedGoodsVariant[id]
			} else {
				// 选中当前商品，取消其他选择
				this.data.currentGoodsList.forEach(g => {
					if (g.id !== id) {
						this.data.selectedGoods[g.id] = 0
						delete this.data.selectedGoodsVariant[g.id]
					}
				})
				this.data.selectedGoods[id] = 1
				if (chosenVariantId) {
					this.data.selectedGoodsVariant[id] = chosenVariantId
				}
				
				const currentGoodsList = this.data.currentGoodsList.map(g => ({
					...g,
					count: g.id === id ? 1 : 0,
					allowRepeat: category.allowRepeat
				}))
				
				this.setData({ currentGoodsList }, () => {
					this.checkCategorySelected(this.data.currentCategory)
					this.calculateTotal()
					this.updateRecommendations()
				})
			}
		}
	},
	// 自动跳转到下一个未完成的类别
	autoNextCategory() {
		const { categories, currentCategoryIndex } = this.data
		let targetIndex = categories.findIndex((c, idx) => idx > currentCategoryIndex && !c.selected)
		if (targetIndex === -1) {
			targetIndex = categories.findIndex(c => !c.selected)
		}
		if (targetIndex !== -1 && targetIndex !== currentCategoryIndex) {
			if (this.data.showGoodsModal) {
				this.closeGoodsModal()
			}
			this.initCategory(categories[targetIndex].key)
		}
	},
	// 手动点击下一个类别
	onNextCategory() {
		const { currentCategoryIndex, categories } = this.data
		if (currentCategoryIndex < categories.length - 1) {
			if (this.data.showGoodsModal) {
				this.closeGoodsModal()
			}
			this.initCategory(categories[currentCategoryIndex + 1].key)
		}
	},
	// 完成配置并跳转订单页
	onComplete() {
		// 组装订单数据（一口价模式）
		const orderData = {
			packageId: this.data.packageId,
			goods: [],
			totalPrice: this.data.totalPrice, // 一口价
			originalPrice: this.data.originalPrice, // 原价（划线价）
			discount: this.data.originalPrice - this.data.totalPrice, // 优惠金额
			categoryNames: {
				sofa: '沙发',
				table: '茶几',
				bed: '软床',
				nightstand: '床头柜',
				'dining-table': '餐桌',
				'dining-chair': '餐椅'
			}
		}
		
		// 遍历所有选中的商品
		Object.keys(this.data.selectedGoods).forEach(id => {
			const count = this.data.selectedGoods[id] || 0
			if (count > 0) {
				// 在所有商品中查找商品信息
				Object.keys(this.data.allGoods).forEach(categoryKey => {
					const goods = this.data.allGoods[categoryKey].find(g => g.id === id)
					if (goods) {
						const categoryName = orderData.categoryNames[categoryKey] || categoryKey
						const variants = this.buildVariants(goods, categoryKey)
						const variantId = this.data.selectedGoodsVariant[id]
						const variant = variants.find(v => v.id === variantId)
						orderData.goods.push({
							id: goods.id,
							code: goods.code,
							name: goods.code,
							dims: goods.dims,
							price: goods.price, // 商品原价（用于显示）
							originalPrice: goods.price, // 商品原价
							count: count,
							category: categoryKey,
							categoryName: categoryName,
							thumb: goods.thumb,
							material: goods.material || '标准材质',
							materialColor: goods.materialColor || '',
							fill: goods.fill || '',
							frame: goods.frame || '',
							leg: goods.leg || '',
							variantId: variant ? variant.id : '',
							variantLabel: variant ? variant.label : ''
						})
					}
				})
			}
		})
		
		// 检查是否所有类别都选完了
		const allSelected = this.data.categories.every(c => c.selected)
		if (!allSelected) {
			wx.showToast({ title: '请完成所有类别选择', icon: 'none' })
			return
		}
		
		// 保存订单数据到本地存储
		try {
			wx.setStorageSync('packageOrder', orderData)
		} catch (e) {
			console.error('保存订单数据失败:', e)
		}
		
		// 跳转到订单确认页
		wx.navigateTo({ url: '/pages/order/confirm/index?type=package' })
	},
	// 计算总价（一口价模式，总价固定不变）
	calculateTotal() {
		// 一口价模式，总价固定，不需要计算
		// 但需要确保显示正确的价格
		this.setData({ 
			totalPrice: this.data.totalPrice,
			originalPrice: this.data.originalPrice
		})
	},
	// 更新下一个类别信息
	updateNextCategory() {
		const { categories, currentCategoryIndex } = this.data
		const hasNext = currentCategoryIndex < categories.length - 1
		const nextName = hasNext ? categories[currentCategoryIndex + 1].name : ''
		if (this.data.hasNextCategory !== hasNext || this.data.nextCategoryName !== nextName) {
			this.setData({
				hasNextCategory: hasNext,
				nextCategoryName: nextName
			})
		}
	},
	// 更新搭配推荐显示
	updateRecommendations() {
		// 检查是否有选中的商品
		const hasSelected = Object.values(this.data.selectedGoods).some(count => count > 0)
		this.setData({ hasSelectedGoods: hasSelected })
	},
	// 图片加载错误处理（静默处理，不显示错误）
	onImageError(e) {
		// 静默处理图片加载失败，不影响功能
		console.log('Image load error:', e.detail.errMsg)
	}
})

