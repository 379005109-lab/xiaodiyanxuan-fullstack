export const materialCategories = [
  { id: 'scene', name: '场景效果图', icon: 'ri-landscape-line' },
  { id: 'furniture', name: '家具白底图', icon: 'ri-image-line' }
];

export const materials = [
  {
    id: 1,
    type: 'furniture',
    title: '现代简约沙发',
    image: 'https://readdy.ai/api/search-image?query=modern%20minimalist%20beige%20fabric%20sofa%20on%20pure%20white%20background%2C%20clean%20product%20photography%20with%20no%20shadows%2C%20professional%20furniture%20catalog%20style%2C%20simple%20and%20elegant%20design&width=600&height=600&seq=ai-sofa-1&orientation=squarish',
    date: '2025-12-24',
    tags: ['沙发', '白底图']
  },
  {
    id: 2,
    type: 'scene',
    title: '北欧风客厅',
    image: 'https://readdy.ai/api/search-image?query=scandinavian%20style%20living%20room%20interior%20with%20modern%20furniture%2C%20natural%20light%20through%20large%20windows%2C%20minimalist%20design%20with%20wooden%20floor%20and%20neutral%20colors%2C%20professional%20interior%20photography&width=600&height=600&seq=ai-scene-1&orientation=squarish',
    date: '2025-12-24',
    tags: ['客厅', '北欧风']
  },
  {
    id: 3,
    type: 'furniture',
    title: '实木餐桌',
    image: 'https://readdy.ai/api/search-image?query=solid%20wood%20dining%20table%20on%20pure%20white%20background%2C%20clean%20product%20photography%20with%20no%20shadows%2C%20professional%20furniture%20catalog%20style%2C%20natural%20wood%20grain%20texture%20visible&width=600&height=600&seq=ai-table-1&orientation=squarish',
    date: '2025-12-24',
    tags: ['餐桌', '白底图']
  },
  {
    id: 4,
    type: 'scene',
    title: '现代卧室',
    image: 'https://readdy.ai/api/search-image?query=modern%20bedroom%20interior%20with%20comfortable%20bed%20and%20elegant%20furniture%2C%20soft%20ambient%20lighting%2C%20minimalist%20contemporary%20design%20with%20neutral%20color%20palette%2C%20professional%20interior%20photography&width=600&height=600&seq=ai-bedroom-1&orientation=squarish',
    date: '2025-12-23',
    tags: ['卧室', '现代风']
  },
  {
    id: 5,
    type: 'furniture',
    title: '单人沙发椅',
    image: 'https://readdy.ai/api/search-image?query=elegant%20single%20armchair%20in%20dark%20green%20velvet%20on%20pure%20white%20background%2C%20clean%20product%20photography%20with%20no%20shadows%2C%20professional%20furniture%20catalog%20style%2C%20luxury%20design&width=600&height=600&seq=ai-chair-1&orientation=squarish',
    date: '2025-12-23',
    tags: ['沙发', '白底图']
  },
  {
    id: 6,
    type: 'texture',
    title: '布艺材质',
    image: 'https://readdy.ai/api/search-image?query=high%20quality%20fabric%20texture%20close-up%2C%20soft%20beige%20linen%20material%20with%20visible%20weave%20pattern%2C%20professional%20material%20photography%20with%20even%20lighting%2C%20seamless%20tileable%20texture&width=600&height=600&seq=ai-fabric-1&orientation=squarish',
    date: '2025-12-23',
    tags: ['布艺', '米色']
  },
  {
    id: 7,
    type: 'scheme',
    title: '客厅搭配方案',
    image: 'https://readdy.ai/api/search-image?query=living%20room%20furniture%20arrangement%20scheme%20with%20modern%20sofa%2C%20coffee%20table%20and%20decorations%2C%20top%20view%20layout%20design%2C%20professional%20interior%20design%20presentation%20style&width=600&height=600&seq=ai-scheme-1&orientation=squarish',
    date: '2025-12-23',
    tags: ['客厅', '搭配']
  },
  {
    id: 8,
    type: 'furniture',
    title: '双人床',
    image: 'https://readdy.ai/api/search-image?query=modern%20double%20bed%20with%20upholstered%20headboard%20on%20pure%20white%20background%2C%20clean%20product%20photography%20with%20no%20shadows%2C%20professional%20furniture%20catalog%20style%2C%20elegant%20design&width=600&height=600&seq=ai-bed-1&orientation=squarish',
    date: '2025-12-23',
    tags: ['床', '白底图']
  }
];

export const furnitureProducts = [
  {
    id: 'sku-001',
    name: '北欧风三人沙发',
    category: '沙发',
    image: 'https://readdy.ai/api/search-image?query=scandinavian%20style%20three-seater%20sofa%20in%20light%20gray%20fabric%20on%20pure%20white%20background%2C%20clean%20product%20photography%2C%20professional%20furniture%20catalog%20style&width=400&height=400&seq=sku-sofa-1&orientation=squarish',
    price: '3999'
  },
  {
    id: 'sku-002',
    name: '现代简约双人床',
    category: '床',
    image: 'https://readdy.ai/api/search-image?query=modern%20minimalist%20double%20bed%20with%20wooden%20frame%20on%20pure%20white%20background%2C%20clean%20product%20photography%2C%20professional%20furniture%20catalog%20style&width=400&height=400&seq=sku-bed-1&orientation=squarish',
    price: '4599'
  },
  {
    id: 'sku-003',
    name: '实木餐桌椅组合',
    category: '餐桌椅',
    image: 'https://readdy.ai/api/search-image?query=solid%20wood%20dining%20table%20with%20four%20chairs%20on%20pure%20white%20background%2C%20clean%20product%20photography%2C%20professional%20furniture%20catalog%20style&width=400&height=400&seq=sku-dining-1&orientation=squarish',
    price: '5299'
  },
  {
    id: 'sku-004',
    name: '单人休闲椅',
    category: '沙发',
    image: 'https://readdy.ai/api/search-image?query=modern%20single%20lounge%20chair%20in%20navy%20blue%20fabric%20on%20pure%20white%20background%2C%20clean%20product%20photography%2C%20professional%20furniture%20catalog%20style&width=400&height=400&seq=sku-chair-1&orientation=squarish',
    price: '1899'
  },
  {
    id: 'sku-005',
    name: '茶几组合',
    category: '茶几',
    image: 'https://readdy.ai/api/search-image?query=modern%20coffee%20table%20set%20with%20glass%20top%20on%20pure%20white%20background%2C%20clean%20product%20photography%2C%20professional%20furniture%20catalog%20style&width=400&height=400&seq=sku-table-1&orientation=squarish',
    price: '1599'
  },
  {
    id: 'sku-006',
    name: '书桌工作台',
    category: '书桌',
    image: 'https://readdy.ai/api/search-image?query=minimalist%20work%20desk%20with%20drawers%20on%20pure%20white%20background%2C%20clean%20product%20photography%2C%20professional%20furniture%20catalog%20style&width=400&height=400&seq=sku-desk-1&orientation=squarish',
    price: '2299'
  }
];

export const styleOptions = [
  { id: 'modern', name: '现代简约' },
  { id: 'nordic', name: '北欧风格' },
  { id: 'chinese', name: '新中式' },
  { id: 'light-luxury', name: '轻奢风' },
  { id: 'industrial', name: '工业风' },
  { id: 'japanese', name: '日式' }
];

export const spaceOptions = [
  { id: 'living', name: '客厅' },
  { id: 'bedroom', name: '卧室' },
  { id: 'dining', name: '餐厅' },
  { id: 'study', name: '书房' },
  { id: 'balcony', name: '阳台' }
];

export const promptTemplates = [
  '温馨舒适的家居氛围，自然光线充足',
  '简约现代的设计风格，线条流畅',
  '高级质感的软装搭配，色彩和谐',
  '宽敞明亮的空间布局，通透感强'
];

export const userCredits = 1280;

// 场景风格卡片数据（不规则大图）
export const sceneStyleCards = [
  {
    id: 'modern-living',
    name: '现代简约客厅',
    style: '现代简约',
    space: '客厅',
    image: 'https://readdy.ai/api/search-image?query=modern%20minimalist%20living%20room%20interior%20design%20with%20clean%20lines%20and%20neutral%20colors%2C%20large%20windows%20with%20natural%20light%2C%20contemporary%20furniture%20arrangement%2C%20professional%20architectural%20photography%20with%20soft%20ambient%20lighting&width=600&height=400&seq=style-modern-living&orientation=landscape',
    orientation: 'landscape',
    popular: true
  },
  {
    id: 'nordic-bedroom',
    name: '北欧风卧室',
    style: '北欧风格',
    space: '卧室',
    image: 'https://readdy.ai/api/search-image?query=scandinavian%20style%20bedroom%20with%20cozy%20atmosphere%20and%20natural%20wood%20elements%2C%20white%20walls%20with%20soft%20textiles%2C%20minimalist%20nordic%20design%20with%20plants%2C%20professional%20interior%20photography&width=400&height=600&seq=style-nordic-bedroom&orientation=portrait',
    orientation: 'portrait',
    popular: true
  },
  {
    id: 'chinese-living',
    name: '新中式客厅',
    style: '新中式',
    space: '客厅',
    image: 'https://readdy.ai/api/search-image?query=modern%20chinese%20style%20living%20room%20with%20traditional%20elements%20and%20contemporary%20design%2C%20elegant%20wooden%20furniture%20with%20silk%20cushions%2C%20zen%20atmosphere%20with%20calligraphy%20art%2C%20professional%20interior%20photography&width=600&height=400&seq=style-chinese-living&orientation=landscape',
    orientation: 'landscape',
    popular: false
  },
  {
    id: 'luxury-dining',
    name: '轻奢餐厅',
    style: '轻奢风',
    space: '餐厅',
    image: 'https://readdy.ai/api/search-image?query=luxury%20dining%20room%20with%20elegant%20marble%20table%20and%20velvet%20chairs%2C%20golden%20accents%20and%20crystal%20chandelier%2C%20sophisticated%20modern%20design%20with%20warm%20lighting%2C%20professional%20interior%20photography&width=400&height=600&seq=style-luxury-dining&orientation=portrait',
    orientation: 'portrait',
    popular: true
  },
  {
    id: 'industrial-study',
    name: '工业风书房',
    style: '工业风',
    space: '书房',
    image: 'https://readdy.ai/api/search-image?query=industrial%20style%20home%20office%20with%20exposed%20brick%20wall%20and%20metal%20shelving%2C%20vintage%20desk%20with%20leather%20chair%2C%20edison%20bulb%20lighting%20and%20concrete%20floor%2C%20professional%20interior%20photography&width=600&height=400&seq=style-industrial-study&orientation=landscape',
    orientation: 'landscape',
    popular: false
  },
  {
    id: 'japanese-bedroom',
    name: '日式卧室',
    style: '日式',
    space: '卧室',
    image: 'https://readdy.ai/api/search-image?query=japanese%20zen%20bedroom%20with%20tatami%20floor%20and%20low%20platform%20bed%2C%20shoji%20screens%20and%20natural%20wood%20elements%2C%20minimalist%20peaceful%20atmosphere%20with%20soft%20lighting%2C%20professional%20interior%20photography&width=400&height=600&seq=style-japanese-bedroom&orientation=portrait',
    orientation: 'portrait',
    popular: true
  },
  {
    id: 'modern-bedroom',
    name: '现代卧室',
    style: '现代简约',
    space: '卧室',
    image: 'https://readdy.ai/api/search-image?query=modern%20contemporary%20bedroom%20with%20upholstered%20bed%20and%20sleek%20furniture%2C%20neutral%20color%20palette%20with%20accent%20lighting%2C%20clean%20lines%20and%20luxurious%20textiles%2C%20professional%20interior%20photography&width=600&height=400&seq=style-modern-bedroom&orientation=landscape',
    orientation: 'landscape',
    popular: false
  },
  {
    id: 'nordic-living',
    name: '北欧客厅',
    style: '北欧风格',
    space: '客厅',
    image: 'https://readdy.ai/api/search-image?query=scandinavian%20living%20room%20with%20comfortable%20sofa%20and%20wooden%20coffee%20table%2C%20large%20windows%20with%20white%20curtains%2C%20cozy%20hygge%20atmosphere%20with%20plants%20and%20books%2C%20professional%20interior%20photography&width=400&height=600&seq=style-nordic-living&orientation=portrait',
    orientation: 'portrait',
    popular: true
  },
  {
    id: 'luxury-living',
    name: '轻奢客厅',
    style: '轻奢风',
    space: '客厅',
    image: 'https://readdy.ai/api/search-image?query=luxury%20modern%20living%20room%20with%20velvet%20sofa%20and%20marble%20coffee%20table%2C%20golden%20accents%20and%20designer%20lighting%2C%20sophisticated%20elegant%20interior%20with%20art%20pieces%2C%20professional%20interior%20photography&width=600&height=400&seq=style-luxury-living&orientation=landscape',
    orientation: 'landscape',
    popular: true
  },
  {
    id: 'chinese-study',
    name: '新中式书房',
    style: '新中式',
    space: '书房',
    image: 'https://readdy.ai/api/search-image?query=modern%20chinese%20style%20study%20room%20with%20traditional%20wooden%20desk%20and%20calligraphy%20brushes%2C%20elegant%20bookshelf%20with%20antique%20decorations%2C%20zen%20atmosphere%20with%20bamboo%20plants%2C%20professional%20interior%20photography&width=400&height=600&seq=style-chinese-study&orientation=portrait',
    orientation: 'portrait',
    popular: false
  }
];

// 家具分类
export const furnitureCategories = [
  { id: 'all', name: '全部', icon: 'ri-apps-line' },
  { id: 'sofa', name: '沙发', icon: 'ri-sofa-line' },
  { id: 'bed', name: '床', icon: 'ri-hotel-bed-line' },
  { id: 'table', name: '桌子', icon: 'ri-table-line' },
  { id: 'chair', name: '椅子', icon: 'ri-armchair-line' },
  { id: 'cabinet', name: '柜子', icon: 'ri-archive-drawer-line' },
  { id: 'lamp', name: '灯具', icon: 'ri-lightbulb-line' }
];

// 面料选项
export const fabricOptions = [
  { id: 'italian-leather', name: '意大利头层牛皮', tag: '推荐', priceAdd: 800 },
  { id: 'nappa-leather', name: 'Nappa真皮', tag: '热门', priceAdd: 600 },
  { id: 'tech-fabric', name: '科技布', tag: '', priceAdd: 0 },
  { id: 'cotton-linen', name: '棉麻混纺', tag: '', priceAdd: 200 },
  { id: 'velvet', name: '丝绒', tag: '', priceAdd: 400 },
  { id: 'microfiber', name: '超纤皮', tag: '', priceAdd: 300 },
];

// 材质颜色选项
export const materialColorOptions = [
  { id: 'mc-black', name: '黑色', color: '#1a1a1a' },
  { id: 'mc-dark-brown', name: '深棕', color: '#3d2b1f' },
  { id: 'mc-brown', name: '棕色', color: '#6b4423' },
  { id: 'mc-camel', name: '驼色', color: '#c19a6b' },
  { id: 'mc-gray', name: '灰色', color: '#808080' },
  { id: 'mc-olive', name: '橄榄绿', color: '#808000' },
  { id: 'mc-cream', name: '米白', color: '#f5f5dc' },
  { id: 'mc-tan', name: '浅棕', color: '#d2b48c' },
  { id: 'mc-charcoal', name: '炭灰', color: '#36454f' },
  { id: 'mc-navy', name: '藏青', color: '#000080' },
  { id: 'mc-burgundy', name: '酒红', color: '#800020' },
  { id: 'mc-sand', name: '沙色', color: '#c2b280' },
];

// 扩展家具商品数据（带SKU和更多信息）
export const furnitureProductsExtended = [
  {
    id: 'sku-001',
    name: '北欧风三人沙发',
    category: 'sofa',
    image: 'https://readdy.ai/api/search-image?query=scandinavian%20style%20three-seater%20sofa%20in%20light%20gray%20fabric%20on%20pure%20white%20background%2C%20clean%20product%20photography%2C%20professional%20furniture%20catalog%20style&width=400&height=400&seq=sku-sofa-1&orientation=squarish',
    price: 3999,
    originalPrice: 4999,
    sku: 'SF-BY-001',
    specs: ['浅灰色', '深灰色', '米白色'],
    fabrics: ['tech-fabric', 'cotton-linen', 'velvet'],
    colors: ['mc-gray', 'mc-charcoal', 'mc-cream'],
    stock: 128,
    sold: 356
  },
  {
    id: 'sku-002',
    name: '现代简约双人床',
    category: 'bed',
    image: 'https://readdy.ai/api/search-image?query=modern%20minimalist%20double%20bed%20with%20wooden%20frame%20on%20pure%20white%20background%2C%20clean%20product%20photography%2C%20professional%20furniture%20catalog%20style&width=400&height=400&seq=sku-bed-1&orientation=squarish',
    price: 4599,
    originalPrice: 5599,
    sku: 'BD-XD-001',
    specs: ['1.5米', '1.8米'],
    fabrics: ['italian-leather', 'nappa-leather', 'tech-fabric'],
    colors: ['mc-cream', 'mc-gray', 'mc-dark-brown'],
    stock: 86,
    sold: 234
  },
  {
    id: 'sku-003',
    name: '实木餐桌椅组合',
    category: 'table',
    image: 'https://readdy.ai/api/search-image?query=solid%20wood%20dining%20table%20with%20four%20chairs%20on%20pure%20white%20background%2C%20clean%20product%20photography%2C%20professional%20furniture%20catalog%20style&width=400&height=400&seq=sku-dining-1&orientation=squarish',
    price: 5299,
    originalPrice: 6299,
    sku: 'DT-SM-001',
    specs: ['原木色', '胡桃色'],
    fabrics: ['cotton-linen', 'velvet'],
    colors: ['mc-tan', 'mc-brown'],
    stock: 45,
    sold: 189
  },
  {
    id: 'sku-004',
    name: '单人休闲椅',
    category: 'chair',
    image: 'https://readdy.ai/api/search-image?query=modern%20single%20lounge%20chair%20in%20navy%20blue%20fabric%20on%20pure%20white%20background%2C%20clean%20product%20photography%2C%20professional%20furniture%20catalog%20style&width=400&height=400&seq=sku-chair-1&orientation=squarish',
    price: 1899,
    originalPrice: 2299,
    sku: 'CH-XX-001',
    specs: ['藏蓝色', '墨绿色', '灰色'],
    fabrics: ['velvet', 'tech-fabric', 'cotton-linen'],
    colors: ['mc-navy', 'mc-olive', 'mc-gray'],
    stock: 256,
    sold: 567
  },
  {
    id: 'sku-005',
    name: '茶几组合',
    category: 'table',
    image: 'https://readdy.ai/api/search-image?query=modern%20coffee%20table%20set%20with%20glass%20top%20on%20pure%20white%20background%2C%20clean%20product%20photography%2C%20professional%20furniture%20catalog%20style&width=400&height=400&seq=sku-table-1&orientation=squarish',
    price: 1599,
    originalPrice: 1999,
    sku: 'TB-CJ-001',
    specs: ['黑色', '白色'],
    fabrics: [],
    colors: ['mc-black', 'mc-cream'],
    stock: 178,
    sold: 423
  },
  {
    id: 'sku-006',
    name: '书桌工作台',
    category: 'table',
    image: 'https://readdy.ai/api/search-image?query=minimalist%20work%20desk%20with%20drawers%20on%20pure%20white%20background%2C%20clean%20product%20photography%2C%20professional%20furniture%20catalog%20style&width=400&height=400&seq=sku-desk-1&orientation=squarish',
    price: 2299,
    originalPrice: 2799,
    sku: 'DK-GZ-001',
    specs: ['白色', '原木色'],
    fabrics: [],
    colors: ['mc-cream', 'mc-tan'],
    stock: 92,
    sold: 278
  },
  {
    id: 'sku-007',
    name: '意式轻奢沙发',
    category: 'sofa',
    image: 'https://readdy.ai/api/search-image?query=italian%20luxury%20leather%20sofa%20in%20cream%20white%20color%20on%20pure%20white%20background%2C%20elegant%20design%20with%20golden%20legs%2C%20professional%20furniture%20photography&width=400&height=400&seq=sku-sofa-2&orientation=squarish',
    price: 8999,
    originalPrice: 10999,
    sku: 'SF-YS-001',
    specs: ['奶白色', '灰色', '棕色'],
    fabrics: ['italian-leather', 'nappa-leather', 'microfiber'],
    colors: ['mc-cream', 'mc-gray', 'mc-brown'],
    stock: 34,
    sold: 89
  },
  {
    id: 'sku-008',
    name: '北欧实木床头柜',
    category: 'cabinet',
    image: 'https://readdy.ai/api/search-image?query=scandinavian%20solid%20wood%20nightstand%20with%20two%20drawers%20on%20pure%20white%20background%2C%20natural%20wood%20grain%2C%20professional%20furniture%20photography&width=400&height=400&seq=sku-cabinet-1&orientation=squarish',
    price: 899,
    originalPrice: 1199,
    sku: 'CB-CT-001',
    specs: ['原木色', '白色'],
    fabrics: [],
    colors: ['mc-tan', 'mc-cream'],
    stock: 312,
    sold: 678
  },
  {
    id: 'sku-009',
    name: '现代落地灯',
    category: 'lamp',
    image: 'https://readdy.ai/api/search-image?query=modern%20floor%20lamp%20with%20arc%20design%20and%20fabric%20shade%20on%20pure%20white%20background%2C%20elegant%20minimalist%20style%2C%20professional%20lighting%20photography&width=400&height=400&seq=sku-lamp-1&orientation=squarish',
    price: 699,
    originalPrice: 899,
    sku: 'LP-LD-001',
    specs: ['黑色', '金色'],
    fabrics: [],
    colors: ['mc-black', 'mc-camel'],
    stock: 156,
    sold: 345
  },
  {
    id: 'sku-010',
    name: '布艺餐椅',
    category: 'chair',
    image: 'https://readdy.ai/api/search-image?query=fabric%20dining%20chair%20with%20wooden%20legs%20on%20pure%20white%20background%2C%20comfortable%20cushion%20seat%2C%20professional%20furniture%20photography&width=400&height=400&seq=sku-chair-2&orientation=squarish',
    price: 599,
    originalPrice: 799,
    sku: 'CH-CY-001',
    specs: ['灰色', '米色', '蓝色'],
    fabrics: ['cotton-linen', 'tech-fabric'],
    colors: ['mc-gray', 'mc-cream', 'mc-navy'],
    stock: 423,
    sold: 892
  },
  {
    id: 'sku-011',
    name: '电视柜组合',
    category: 'cabinet',
    image: 'https://readdy.ai/api/search-image?query=modern%20TV%20stand%20cabinet%20with%20storage%20compartments%20on%20pure%20white%20background%2C%20minimalist%20design%20with%20wooden%20finish%2C%20professional%20furniture%20photography&width=400&height=400&seq=sku-cabinet-2&orientation=squarish',
    price: 2899,
    originalPrice: 3499,
    sku: 'CB-DS-001',
    specs: ['白色', '胡桃色'],
    fabrics: [],
    colors: ['mc-cream', 'mc-brown'],
    stock: 67,
    sold: 156
  },
  {
    id: 'sku-012',
    name: '台灯',
    category: 'lamp',
    image: 'https://readdy.ai/api/search-image?query=modern%20table%20lamp%20with%20ceramic%20base%20and%20fabric%20shade%20on%20pure%20white%20background%2C%20elegant%20bedside%20lighting%2C%20professional%20photography&width=400&height=400&seq=sku-lamp-2&orientation=squarish',
    price: 399,
    originalPrice: 499,
    sku: 'LP-TD-001',
    specs: ['白色', '灰色'],
    fabrics: [],
    colors: ['mc-cream', 'mc-gray'],
    stock: 289,
    sold: 567
  }
];