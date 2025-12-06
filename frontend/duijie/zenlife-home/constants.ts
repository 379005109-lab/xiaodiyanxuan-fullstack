
import { Product, Category } from './types';
import { Wind, Shield, Zap, Award, Sun, Maximize, Layers, Truck } from 'lucide-react';

export const CATEGORIES: Category[] = [
  { id: 'all', name: '综合' },
  { id: 'sales', name: '销量' },
  { id: 'price', name: '价格' },
  { id: 'category', name: '类别' },
  { id: 'style', name: '风格' },
];

export const MOCK_ORDERS = [
    { id: 'ord-1', date: '2023-10-24', total: 12000, status: '已完成', items: 2 },
    { id: 'ord-2', date: '2023-11-05', total: 450, status: '配送中', items: 1 },
];

export const MOCK_COUPONS = [
    { id: 'cp-1', value: 100, min: 1000, title: '新人专享券', expire: '2024-01-01' },
    { id: 'cp-2', value: 500, min: 5000, title: '大额满减券', expire: '2023-12-12' },
];

export const MOCK_APPOINTMENTS = [
    { id: 'apt-1', date: '2023-11-20', time: '14:00', type: '到店体验', status: '待确认' },
    { id: 'apt-2', date: '2023-11-25', time: '10:00', type: '设计师上门', status: '已预约' },
];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: '罗马沙发B级',
    subtitle: '意大利进口头层牛皮',
    category: '沙发',
    price: 45520,
    originalPrice: 48000,
    rating: 4.9,
    reviews: 128,
    image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1550226891-ef816aed4a98?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&q=80&w=800'
    ],
    description: '采用意大利进口头层牛皮，触感细腻，透气性好。人体工学设计，贴合背部曲线，久坐不累。现代简约风格，彰显格调。',
    features: ['意大利进口真皮', '高密度海绵', '实木框架', '3年质保'],
    featuresList: [
        { icon: Shield, label: '3年质保' },
        { icon: Wind, label: '透气' },
        { icon: Award, label: '进口皮' }
    ],
    specs: [
      { label: '尺寸', value: '360x270x90cm' },
      { label: '材质', value: '头层牛皮' },
      { label: '填充', value: '羽绒+乳胶' },
    ],
    dimensions: { length: 360, width: 270, height: 90 },
    colors: ['#D2B48C', '#2F4F4F', '#808080', '#F5F5DC', '#A52A2A', '#000000'],
    variants: [
      {
        id: 'v1',
        name: '单扶双+无扶单+转角+贵妃+大理石组合',
        image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=800',
        dimensions: '360x270x90CM',
        price: 45520
      },
      {
        id: 'v2',
        name: '双扶手三人位+脚踏组合',
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800',
        dimensions: '280x100x90CM',
        price: 32800
      },
       {
        id: 'v3',
        name: '直排四人位+大理石边几',
        image: 'https://images.unsplash.com/photo-1550226891-ef816aed4a98?auto=format&fit=crop&q=80&w=800',
        dimensions: '320x100x90CM',
        price: 38600
      }
    ]
  },
  {
    id: '2',
    name: '莫基石沙发A级',
    subtitle: '极简主义设计',
    category: '沙发',
    price: 54600,
    rating: 4.8,
    reviews: 85,
    image: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=800'
    ],
    description: '模块化设计，可根据户型自由组合。高级灰色调，百搭耐看。纳米科技布面料，防水防污，易于打理。',
    features: ['模块化组合', '科技布面料', '加宽扶手', '可拆洗'],
    featuresList: [
        { icon: Layers, label: '模块化' },
        { icon: Zap, label: '防污' },
        { icon: Maximize, label: '可拆洗' }
    ],
    specs: [
      { label: '尺寸', value: '320x180x85cm' },
      { label: '材质', value: '科技布' },
      { label: '颜色', value: '高级灰' },
    ],
    dimensions: { length: 320, width: 180, height: 85 },
    colors: ['#808080', '#A9A9A9', '#D3D3D3']
  },
  {
    id: '3',
    name: 'L8811桌子',
    subtitle: '北欧实木餐桌',
    category: '桌子',
    price: 7000,
    rating: 4.7,
    reviews: 210,
    image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&q=80&w=800',
    description: '精选北美白蜡木，纹理清晰自然。圆角打磨处理，防止磕碰。稳固的桌腿结构，承重力强。',
    features: ['北美白蜡木', '环保水性漆', '加厚桌面', '榫卯结构'],
    featuresList: [
        { icon: Sun, label: '自然木' },
        { icon: Shield, label: '耐磨' },
        { icon: Layers, label: '榫卯' }
    ],
    specs: [
      { label: '尺寸', value: '140x80x75cm' },
      { label: '材质', value: '白蜡木' },
      { label: '风格', value: '北欧' },
    ],
    dimensions: { length: 140, width: 80, height: 75 },
    colors: ['#DEB887', '#8B4513']
  },
  {
    id: '4',
    name: 'L8802沙发',
    subtitle: '小户型首选',
    category: '沙发',
    price: 10860,
    rating: 4.6,
    reviews: 340,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800',
    description: '专为小户型设计，不占空间。棉麻面料，透气亲肤。座包饱满，回弹性好。简约时尚，温馨舒适。',
    features: ['棉麻面料', '小户型设计', '实木脚', '多色可选'],
    featuresList: [
        { icon: Maximize, label: '省空间' },
        { icon: Wind, label: '透气' },
        { icon: Sun, label: '多色' }
    ],
    specs: [
      { label: '尺寸', value: '210x90x85cm' },
      { label: '材质', value: '棉麻' },
      { label: '风格', value: '现代简约' },
    ],
    dimensions: { length: 210, width: 90, height: 85 },
    colors: ['#F5F5DC', '#D8BFD8', '#ADD8E6']
  },
  {
    id: '5',
    name: '质感沙发 • 莫兰迪灰',
    subtitle: '砍一刀专享',
    category: '砍价',
    price: 2199,
    originalPrice: 3999,
    isBargain: true,
    bargainInfo: {
      participants: 12,
      minPrice: 2199,
      discount: 200,
    },
    rating: 4.9,
    reviews: 999,
    image: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=800',
    description: '莫兰迪配色，高级感十足。三人位设计，满足家庭需求。现发起砍价活动，邀请好友助力，立省大额现金。',
    features: ['莫兰迪色系', '三人位', '高性价比', '限时特惠'],
    featuresList: [
        { icon: Award, label: '高性价' },
        { icon: Zap, label: '限时' },
        { icon: Truck, label: '包邮' }
    ],
    specs: [
      { label: '尺寸', value: '240x95x85cm' },
      { label: '材质', value: '混纺' },
    ],
    dimensions: { length: 240, width: 95, height: 85 },
    colors: ['#778899', '#B0C4DE']
  },
  {
    id: '6',
    name: '原木电视柜 • 极简主义',
    subtitle: '砍一刀专享',
    category: '砍价',
    price: 1099,
    originalPrice: 1699,
    isBargain: true,
    bargainInfo: {
      participants: 8,
      minPrice: 1099,
      discount: 120,
    },
    rating: 4.8,
    reviews: 520,
    image: 'https://images.unsplash.com/photo-1601084881623-df923982e666?auto=format&fit=crop&q=80&w=800',
    description: '悬空设计，方便扫地机器人清洁。多层实木板，环保耐用。大容量储物空间，让客厅井井有条。',
    features: ['悬空设计', '多层实木', '大容量', '极简风格'],
    featuresList: [
        { icon: Maximize, label: '大容量' },
        { icon: Shield, label: '耐用' },
        { icon: Layers, label: '多层板' }
    ],
    specs: [
      { label: '尺寸', value: '200x40x45cm' },
      { label: '材质', value: '多层实木' },
    ],
    dimensions: { length: 200, width: 40, height: 45 },
    colors: ['#CD853F', '#D2691E']
  },
   {
    id: '7',
    name: '真皮套餐',
    subtitle: '一站式配齐，省心又省钱',
    category: '套餐',
    price: 16888,
    rating: 5.0,
    reviews: 45,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=800',
    description: '包含真皮沙发、岩板茶几组合、单人休闲椅、真皮大床。全屋家具一站式购齐，风格统一，省去搭配烦恼。',
    features: ['全屋搭配', '真皮材质', '风格统一', '送货安装'],
    featuresList: [
        { icon: Layers, label: '全屋' },
        { icon: Truck, label: '送装' },
        { icon: Award, label: '质保' }
    ],
    specs: [
      { label: '包含', value: '沙发+茶几+椅+床' },
      { label: '风格', value: '意式极简' },
    ],
    dimensions: { length: 0, width: 0, height: 0 },
    colors: ['#2F4F4F'],
    packageItems: [
        {
            category: '沙发',
            count: 1,
            items: [
                // Re-using existing products as mock data
                 {
                    id: 'p-sofa-1',
                    name: '劳伦斯沙发',
                    price: 4400,
                    image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=300',
                    category: '沙发',
                    rating: 5, reviews: 10, description: '', features: [], specs: [],
                    variants: [
                        {id: 'v1', name: '双人位', image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=300', price: 4400, dimensions: '3360x1120x680mm'},
                        {id: 'v2', name: '三人位', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=300', price: 6900, dimensions: '4000x1120x680mm'}
                    ],
                    colors: ['#D2B48C', '#2F4F4F', '#808080', '#F5F5DC']
                },
                {
                    id: 'p-sofa-2',
                    name: '大黑牛沙发',
                    price: 5200,
                    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=300',
                    category: '沙发',
                    rating: 5, reviews: 10, description: '', features: [], specs: [],
                    variants: [], colors: ['#000']
                },
                 {
                    id: 'p-sofa-3',
                    name: '康纳利沙发',
                    price: 3800,
                    image: 'https://images.unsplash.com/photo-1550226891-ef816aed4a98?auto=format&fit=crop&q=80&w=300',
                    category: '沙发',
                    rating: 5, reviews: 10, description: '', features: [], specs: [],
                    variants: [], colors: ['#F5F5DC']
                },
                {
                    id: 'p-sofa-4',
                    name: '像素沙发',
                    price: 4100,
                    image: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&q=80&w=300',
                    category: '沙发',
                    rating: 5, reviews: 10, description: '', features: [], specs: [],
                     variants: [], colors: ['#808080']
                },
                 {
                    id: 'p-sofa-5',
                    name: '花瓣沙发',
                    price: 3500,
                    image: 'https://images.unsplash.com/photo-1512212621149-107ffe572d2f?auto=format&fit=crop&q=80&w=300',
                    category: '沙发',
                    rating: 5, reviews: 10, description: '', features: [], specs: [],
                     variants: [], colors: ['#228B22']
                },
                 {
                    id: 'p-sofa-6',
                    name: '钢琴键沙发',
                    price: 4800,
                    image: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=300',
                    category: '沙发',
                    rating: 5, reviews: 10, description: '', features: [], specs: [],
                     variants: [], colors: ['#8B4513']
                }
            ]
        },
        {
            category: '床',
            count: 1,
            items: [
                {
                    id: 'p-bed-1',
                    name: '真皮大床',
                    price: 3200,
                    image: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=300',
                    category: '床',
                    rating: 5, reviews: 10, description: '', features: [], specs: [],
                    colors: ['#fff']
                }
            ]
        },
        {
            category: '床头柜',
            count: 2,
            items: [
                {
                    id: 'p-table-1',
                    name: '极简床头柜',
                    price: 800,
                    image: 'https://images.unsplash.com/photo-1532323544230-7191fd510c59?auto=format&fit=crop&q=80&w=300',
                    category: '床头柜',
                    rating: 5, reviews: 10, description: '', features: [], specs: [],
                    colors: ['#DEB887']
                }
            ]
        }
    ]
  }
];
