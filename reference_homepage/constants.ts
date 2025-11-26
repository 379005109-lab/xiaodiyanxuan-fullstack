
import { Product, StyleCategory, ProductDetail, Order, CartItem, CollectionConfig, AdminUser, MaterialAsset, Category, DesignRequest } from './types';
import { LayoutGrid, Armchair, Gem, Leaf } from 'lucide-react';

// Helper to generate colors with price variations
const generateColors = (group: string, baseHue: number, count: number) => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `m_${group}_${i}`,
        group: group,
        name: `${group} #${i + 101}`,
        type: 'fabric',
        thumbnail: `https://placehold.co/100x100/${(baseHue + i * 10) % 360}4040/FFFFFF?text=${i + 101}`,
        // Simulate price add-ons for specific colors
        priceModifier: i > 15 ? 200 : 0,
        isHot: i === 2 || i === 8 || i === 15,
        description: `编号 ${i+101} 是该系列中的设计师推荐色。采用60S高支纱线织造，表面经过纳米三防处理（防水、防油、防污）。触感温润，透气性极佳，耐磨指数超过50,000次，适合有宠物的家庭。`,
        detailImage: "https://images.unsplash.com/photo-1528458909336-e7a0adfed0a5?auto=format&fit=crop&q=80&w=800"
    }));
};

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: '钢琴键沙发 Piano Key',
    modelNo: 'XD-S2401',
    price: 3960,
    imageUrl: 'https://images.unsplash.com/photo-1550226891-ef816aed4a98?auto=format&fit=crop&q=80&w=800',
    category: StyleCategory.MODERN,
    specsCount: 2,
    isNew: true,
    moq: 5,
    stockStatus: 'in_stock',
    leadTime: '7-10 Days',
    dimensions: '3100 x 1100 x 680 mm'
  },
  {
    id: '2',
    name: '康纳利森林 Canal',
    modelNo: 'XD-S2405',
    price: 3600,
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800',
    category: StyleCategory.MINIMALIST,
    specsCount: 1,
    moq: 10,
    stockStatus: 'made_to_order',
    leadTime: '25-30 Days',
    dimensions: '2800 x 1000 x 700 mm'
  },
  {
    id: '3',
    name: '松墨沙发 Pine',
    modelNo: 'XD-S2399',
    price: 4400,
    imageUrl: 'https://images.unsplash.com/photo-1567538096630-e0c55bd9426f?auto=format&fit=crop&q=80&w=800',
    category: StyleCategory.MODERN,
    specsCount: 1,
    moq: 2,
    stockStatus: 'in_stock',
    dimensions: '3200 x 1200 x 750 mm'
  },
  {
    id: '4',
    name: '复古绿绒 Pixel',
    modelNo: 'XD-S2201',
    price: 4050,
    imageUrl: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&q=80&w=800',
    category: StyleCategory.VINTAGE,
    specsCount: 1,
    moq: 5,
    stockStatus: 'made_to_order',
    dimensions: '2600 x 950 x 720 mm'
  },
  {
    id: '5',
    name: '香奈儿轻奢',
    modelNo: 'XD-L8802',
    price: 4400,
    imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=800',
    category: StyleCategory.LUXURY,
    specsCount: 1,
    moq: 1,
    stockStatus: 'in_stock',
    dimensions: '3400 x 1100 x 680 mm'
  },
  {
    id: '6',
    name: '丹麦苔藓 Green',
    modelNo: 'XD-M9001',
    price: 4400,
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=800',
    category: StyleCategory.MODERN,
    specsCount: 1,
    moq: 20,
    stockStatus: 'made_to_order',
    dimensions: '2200 x 900 x 800 mm'
  },
  {
    id: '7',
    name: '橄榄织梦 Olive',
    modelNo: 'XD-V7721',
    price: 4400,
    imageUrl: 'https://images.unsplash.com/photo-1506898667547-42e22a46e125?auto=format&fit=crop&q=80&w=800',
    category: StyleCategory.VINTAGE,
    specsCount: 2,
    moq: 5,
    stockStatus: 'in_stock',
    dimensions: '2900 x 1000 x 750 mm'
  },
  {
    id: '8',
    name: '森系躺椅 Nature',
    modelNo: 'XD-C1102',
    price: 4400,
    imageUrl: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=800',
    category: StyleCategory.VINTAGE,
    specsCount: 2,
    moq: 2,
    stockStatus: 'in_stock',
    dimensions: '1800 x 800 x 600 mm'
  }
];

export const PRODUCT_DETAILS: Record<string, ProductDetail> = {
    '1': {
        id: '1',
        name: '钢琴键沙发 Piano Key',
        modelNo: 'XD-S2401',
        moq: 5,
        price: 3960,
        category: StyleCategory.MODERN,
        specsCount: 5,
        isNew: true,
        stockStatus: 'in_stock',
        imageUrl: 'https://images.unsplash.com/photo-1550226891-ef816aed4a98?auto=format&fit=crop&q=80&w=800',
        description: "灵感源自钢琴黑白键的律动，将音乐的节奏感融入家居设计。设计团队历时180天打磨，采用模块化设计，可自由组合。坐垫填充高密度回弹海绵与羽绒，为您提供云端般的坐感体验。适合现代简约、意式极简风格的豪宅与大平层空间。",
        images: [
            'https://images.unsplash.com/photo-1550226891-ef816aed4a98?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1484101403633-562f491dc963?auto=format&fit=crop&q=80&w=800'
        ],
        specs: [
            { id: 's1', name: '钢琴键组合 I (标准)', price: 3960, originalPrice: 4400, dimensions: '3100 x 1100 x 680 CM' },
            { id: 's2', name: '钢琴键组合 II (加长版)', price: 4560, originalPrice: 5200, dimensions: '3600 x 1100 x 680 CM' },
            { id: 's3', name: 'L型贵妃位组合', price: 5800, originalPrice: 6500, dimensions: '3200 x 1800 x 680 CM' },
            { id: 's4', name: '双人位直排', price: 2800, originalPrice: 3200, dimensions: '2100 x 1100 x 680 CM' },
            { id: 's5', name: '单人休闲位', price: 1600, originalPrice: 1900, dimensions: '1100 x 1100 x 680 CM' }
        ],
        materials: [
            // Group 1: Imported Fabric (20 Colors) - MASSIVE OPTION SHOWCASE
            ...generateColors('进口棉麻', 150, 20),
            
            // Group 2: Tech Fabric (10 Colors)
            ...generateColors('纳米科技布', 200, 10),

            // Group 3: Genuine Leather
            { 
                id: 'm_leather_1', group: '接触面真皮', name: '沙漠沙', type: 'leather', thumbnail: 'https://placehold.co/100x100/CDBA96/FFFFFF?text=',
                priceModifier: 1000,
                description: "精选澳洲进口头层黄牛皮，保留天然毛孔，透气性好。皮胚经过28道工艺鞣制，手感细腻柔软，呈现自然的哑光质感。",
                detailImage: "https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&q=80&w=800"
            },
            { 
                id: 'm_leather_2', group: '接触面真皮', name: '暗夜黑', type: 'leather', thumbnail: 'https://placehold.co/100x100/1A1A1A/FFFFFF?text=',
                priceModifier: 1000,
                description: "经典黑色纳帕皮，表面纹理均匀，富有弹性。适合现代商务风格或极简工业风空间。",
                detailImage: "https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&q=80&w=800"
            },
            { 
                id: 'm_leather_3', group: '接触面真皮', name: '酒红色', type: 'leather', thumbnail: 'https://placehold.co/100x100/991B1B/FFFFFF?text=',
                priceModifier: 1200,
                description: "复古酒红色油蜡皮，具有独特的变色效应，随着使用时间推移，皮面会越来越有光泽。",
                detailImage: "https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&q=80&w=800"
            },
            { 
                id: 'm_leather_4', group: '接触面真皮', name: '松石绿', type: 'leather', thumbnail: 'https://placehold.co/100x100/0D9488/FFFFFF?text=',
                priceModifier: 1000,
                description: "独特的松石绿染色工艺，色泽饱满深邃，为空间带来一抹复古与时尚交织的色彩。",
                detailImage: "https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&q=80&w=800"
            },
            { 
                id: 'm_leather_5', group: '接触面真皮', name: '奶昔白', type: 'leather', thumbnail: 'https://placehold.co/100x100/FEFCE8/FFFFFF?text=',
                priceModifier: 1000,
                description: "温润的奶白色调，营造纯净柔和的居家氛围。表面经过特殊防污涂层处理，易于日常清洁打理。",
                detailImage: "https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&q=80&w=800"
            },
        ]
    }
};

export const CATEGORY_CARDS = [
  {
    id: 'modern',
    name: '现代风',
    subtitle: 'Modern Green',
    count: 12, 
    icon: LayoutGrid,
    bgImage: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&q=80&w=400',
    categoryEnum: StyleCategory.MODERN
  },
  {
    id: 'vintage',
    name: '中古风',
    subtitle: 'Vintage Era',
    count: 8,
    icon: Armchair,
    bgImage: 'https://images.unsplash.com/photo-1542487354-feaf93476caa?auto=format&fit=crop&q=80&w=400',
    categoryEnum: StyleCategory.VINTAGE
  },
  {
    id: 'luxury',
    name: '轻奢风',
    subtitle: 'Lux Emerald',
    count: 5,
    icon: Gem,
    bgImage: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=400',
    categoryEnum: StyleCategory.LUXURY
  },
  {
    id: 'minimalist',
    name: '极简风',
    subtitle: 'Minimalist',
    count: 15,
    icon: Leaf,
    bgImage: 'https://images.unsplash.com/photo-1522758971460-1d21eed7dc1d?auto=format&fit=crop&q=80&w=400',
    categoryEnum: StyleCategory.MINIMALIST
  }
];

export const COLLECTIONS = [
    {
        id: 1,
        title: "晨雾森林 / Misty Forest",
        description: "灵感来自清晨的北欧森林，以鼠尾草绿与原木色为主调，营造静谧的呼吸感。",
        image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1200",
        items: 5,
        priceStart: 12900
    },
    {
        id: 2,
        title: "复古植物学家 / The Botanist",
        description: "深祖母绿天鹅绒搭配黄铜元素，重现19世纪植物学家的书房美学。",
        image: "https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?auto=format&fit=crop&q=80&w=1200",
        items: 4,
        priceStart: 18800
    },
    {
        id: 3,
        title: "极简禅意 / Zen Garden",
        description: "去繁就简，引入枯山水概念，以低饱和度的绿色和棉麻材质打造冥想空间。",
        image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=1200",
        items: 3,
        priceStart: 9900
    }
];

export const SERVICES = [
    {
        title: "基础陪买服务",
        enTitle: "Standard Guide",
        price: "¥1,000",
        features: ["专车接送（广佛区域含：高铁站、机场）", "1天源头展厅带逛", "专业砍价", "购满5000元抵扣服务费"],
        isPopular: true
    },
    {
        title: "专家定制陪买",
        enTitle: "Expert Guide",
        price: "¥5,000",
        features: ["包含基础服务所有权益", "资深软装设计师陪同", "3天深度选品行程", "全屋搭配方案", "出厂价验货跟单"],
        isPopular: false
    }
];

export const ADVANTAGES = [
    { title: "源头厂家直供", subtitle: "Factory Direct", desc: "品质有保证 · 价格有优势" },
    { title: "款式更多更新", subtitle: "Latest Styles", desc: "每周上新 · 紧跟国际潮流" }
];

export const MOCK_ORDERS: Order[] = [
    {
        id: 'ORD202511248308',
        status: 'pending_payment',
        createdAt: '2025/11/24 14:30',
        totalAmount: 13320,
        customer: {
            name: '张晨笛',
            phone: '13131313131',
            address: '佛山市南海区环岛南路28号',
        },
        items: [
            {
                productId: '5',
                productName: '香奈儿沙发',
                imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=400',
                quantity: 1,
                price: 3960,
                specName: '标准款 / 日落黄',
                dimensions: '3100x1100x680MM',
                material: '意大利纳帕牛皮'
            },
            {
                productId: '4',
                productName: '复古绿绒 Pixel',
                imageUrl: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&q=80&w=400',
                quantity: 1,
                price: 4400,
                specName: '三人位 / 森林绿',
                dimensions: '2800x1000x700MM',
                material: '高精密荷兰绒'
            },
            {
                productId: '1',
                productName: '钢琴键沙发',
                imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=400',
                quantity: 1,
                price: 4960,
                specName: '组合装 / 迷雾蓝',
                dimensions: '3600x1200x650MM',
                material: '棉麻混纺'
            }
        ],
        note: '请务必在周末送货，送到楼上。',
        logs: [
            { id: 'l1', action: '订单创建', operator: 'System', timestamp: '2025/11/24 14:30', type: 'system' }
        ],
        internalNotes: [
            { id: 'n1', content: '客户是设计师推荐，需要重点跟进。', author: 'Anna', timestamp: '2025/11/24 14:35' }
        ]
    },
    {
        id: 'ORD202511235521',
        status: 'paid',
        createdAt: '2025/11/23 09:15',
        totalAmount: 4400,
        customer: {
            name: '李思思',
            phone: '13800138000',
            address: '上海市静安区南京西路1266号',
        },
        items: [
             {
                productId: '2',
                productName: '康纳利森林 Canal',
                imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=400',
                quantity: 1,
                price: 4400,
                specName: '标准款 / 浅灰',
                dimensions: '2100x900x750MM',
                material: '科技布'
            }
        ],
        logs: [
            { id: 'l1', action: '订单创建', operator: 'System', timestamp: '2025/11/23 09:15', type: 'system' },
            { id: 'l2', action: '付款成功', operator: 'WeChat Pay', timestamp: '2025/11/23 09:20', type: 'status_change' }
        ],
        internalNotes: []
    }
];

export const MOCK_CART: CartItem[] = [
    {
        id: 'c1',
        productId: '1',
        name: '钢琴键沙发 Piano Key',
        price: 4960,
        image: 'https://images.unsplash.com/photo-1550226891-ef816aed4a98?auto=format&fit=crop&q=80&w=400',
        spec: '钢琴键组合 I',
        material: '全青皮-极地白',
        quantity: 1,
        selected: true
    },
    {
        id: 'c2',
        productId: '2',
        name: '钢琴键沙发 Piano Key',
        price: 3960,
        image: 'https://images.unsplash.com/photo-1550226891-ef816aed4a98?auto=format&fit=crop&q=80&w=400',
        spec: '钢琴键组合 I',
        material: '普通皮',
        quantity: 1,
        selected: true
    }
];

// Helper to generate multiple items
const generateSofaOptions = () => {
    const images = [
        'https://images.unsplash.com/photo-1550226891-ef816aed4a98?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&q=80&w=400'
    ];
    
    const names = [
        '钢琴键沙发', '劳伦斯沙发', '地平线沙发', '香奈儿沙发', '云朵沙发', 
        '大黑牛沙发', '意式极简', '北欧布艺', '复古绿绒', '中古皮质',
        'Baxter象耳', '模块化沙发', '转角组合', '单人贵妃', '弧形设计款'
    ];

    return Array.from({ length: 15 }).map((_, i) => ({
        id: `opt_sofa_${i + 1}`,
        name: names[i] || `沙发款式 ${i + 1}`,
        price: 3500 + (i * 120),
        imageUrl: images[i % images.length],
        specs: ['标准款', '加大款', '组合款'],
        materials: ['普通皮', '全青皮', '进口棉麻', '科技布']
    }));
};

export const MOCK_COLLECTION_CONFIG: CollectionConfig = {
    id: '1126',
    name: '晨雾森林套系',
    basePrice: 12900,
    description: '以鼠尾草绿为主调，搭配天然原木，为您打造一个静谧的北欧森林客厅。',
    heroImage: 'https://images.unsplash.com/photo-1550226891-ef816aed4a98?auto=format&fit=crop&q=80&w=1200',
    slots: [
        {
            id: 'slot_sofa',
            name: '沙发',
            requiredQuantity: 1,
            options: generateSofaOptions()
        },
        {
            id: 'slot_chair',
            name: '休闲椅',
            requiredQuantity: 1,
            options: [
                 {
                    id: 'opt_chair_1',
                    name: '毛毛虫懒人沙发',
                    price: 1200,
                    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=400',
                    specs: ['单人位'],
                    materials: ['科技布-绿色', '棉麻-米色']
                },
                {
                    id: 'opt_chair_2',
                    name: '单人真皮沙发',
                    price: 2200,
                    imageUrl: 'https://images.unsplash.com/photo-1506898667547-42e22a46e125?auto=format&fit=crop&q=80&w=400',
                    specs: ['单人位'],
                    materials: ['真皮-棕色']
                }
            ]
        }
    ]
};

export const MOCK_ADMIN_USERS = [
    { id: 1, name: 'ZCD', email: 'zcd@example.com', role: 'admin', phone: '13800138000', balance: 10000, status: 'active', lastLogin: '2024-11-25 10:00' },
    { id: 2, name: 'Designer A', email: 'design@example.com', role: 'designer', phone: '13900139000', balance: 500, status: 'active', lastLogin: '2024-11-24 14:30' },
];

export const MOCK_DESIGN_REQUESTS = [
    { id: 'req1', userName: '王先生', userPhone: '135****1234', description: '希望设计一个现代简约风格的客厅，大概30平米。', status: 'pending', submittedAt: '2024-11-25 09:00' },
    { id: 'req2', userName: '李女士', userPhone: '186****5678', description: '需要整屋软装搭配方案，偏向法式复古。', status: 'processing', submittedAt: '2024-11-24 16:20' },
];

export const MOCK_CATEGORIES = [
    { id: 'cat1', name: '沙发', level: 1, productCount: 15, updatedAt: '2024-11-20' },
    { id: 'cat2', name: '休闲椅', level: 1, productCount: 8, updatedAt: '2024-11-21' },
    { id: 'cat3', name: '茶几', level: 1, productCount: 12, updatedAt: '2024-11-18' },
    { id: 'cat4', name: '床具', level: 1, productCount: 6, updatedAt: '2024-11-22' },
    { id: 'cat5', name: '柜类', level: 1, productCount: 9, updatedAt: '2024-11-19' },
    { id: 'cat6', name: '灯饰', level: 1, productCount: 20, updatedAt: '2024-11-15' },
    { id: 'cat7', name: '地毯', level: 1, productCount: 5, updatedAt: '2024-11-10' },
];
