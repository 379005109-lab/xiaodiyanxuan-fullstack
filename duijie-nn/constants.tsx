
import { Manufacturer, Product, Category, SKU, ProductOrigin } from './types';

export const MANUFACTURERS: Manufacturer[] = [
  {
    id: '3',
    name: '小迪严选',
    code: 'XDYX',
    logo: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=200&h=200&fit=crop',
    description: '作为平台官方严选品牌，小迪严选专注于提供高性价比、高颜值的全屋定制家具方案，是设计师的首选合作伙伴。',
    productIntro: '主打意式简约、现代极简系列，覆盖卧房、客厅及餐厅全空间。',
    contact: '平台客服',
    phone: '400-000-0000',
    address: '广东省佛山市顺德区乐从镇国际家具城',
    styleTags: ['意式极简', '全屋定制', '高性价比'],
    defaultDiscount: 60,
    defaultCommission: 30,
    status: 'enabled'
  },
  {
    id: '1',
    name: '金龙恒',
    code: 'JL',
    logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop',
    description: '三十年专注软体家具研发，金龙恒不仅是制造者，更是睡眠艺术的传播者。',
    productIntro: '深度睡眠床垫、真皮软床系列，采用进口天然乳胶与人体工学弹簧。',
    contact: '陈经理',
    phone: '400-888-9999',
    address: '广东省佛山市南海区九江镇沙头工业区',
    styleTags: ['睡眠专家', '真皮软床', '三十年品牌'],
    defaultDiscount: 65,
    defaultCommission: 25,
    status: 'enabled'
  }
];

export const CATEGORIES: Category[] = [
  { id: 'cat1', name: '沙发系列', count: 4 },
  { id: 'cat2', name: '床头柜类', count: 4 }
];

const generateSKUs = (baseCode: string, basePrice: number): SKU[] => [
  { 
    id: `${baseCode}-s1`, 
    code: `${baseCode}-SF1617`, 
    name: '右扶手单1.35米 2个1米无扶手贵妃 脚踏80*1.05', 
    listPrice: basePrice * 2, 
    discountPrice: basePrice * 1.2, 
    commission: basePrice * 0.48,
    image: `https://picsum.photos/seed/${baseCode}-s1/100/100`
  }
];

export const PRODUCTS: Product[] = [
  { 
    id: 'p1', 
    name: '迈阿密A级', 
    code: 'SF11', 
    priceRange: '¥4980 - ¥33060', 
    minPrice: 2988, 
    rebatePrice: 1195, 
    category: '沙发系列', 
    origin: ProductOrigin.SELF,
    image: 'https://picsum.photos/seed/miami/200/200',
    skus: generateSKUs('FS14', 16530)
  },
  { 
    id: 'p2', 
    name: 'G625床头柜', 
    code: 'G625', 
    priceRange: '¥2790', 
    minPrice: 1674, 
    rebatePrice: 670, 
    category: '床头柜类', 
    origin: ProductOrigin.AUTHORIZED,
    image: 'https://picsum.photos/seed/g625/200/200',
    skus: [{ id: 'sku-g625', code: 'G625-SKU', name: '标准款床头柜', listPrice: 2790, discountPrice: 1674, commission: 670, image: 'https://picsum.photos/seed/sku-g625/100/100' }]
  },
  { 
    id: 'p3', 
    name: 'G623床头柜', 
    code: 'G623', 
    priceRange: '¥1800', 
    minPrice: 1080, 
    rebatePrice: 432, 
    category: '床头柜类', 
    origin: ProductOrigin.SELF,
    image: 'https://picsum.photos/seed/g623/200/200',
    skus: [{ id: 'sku-g623', code: 'G623-SKU', name: '简约款床头柜', listPrice: 1800, discountPrice: 1080, commission: 432, image: 'https://picsum.photos/seed/sku-g623/100/100' }]
  },
  { 
    id: 'p4', 
    name: 'G622床头柜', 
    code: 'G622', 
    priceRange: '¥2550', 
    minPrice: 1530, 
    rebatePrice: 612, 
    category: '床头柜类', 
    origin: ProductOrigin.AUTHORIZED,
    image: 'https://picsum.photos/seed/g622/200/200',
    skus: [{ id: 'sku-g622', code: 'G622-SKU', name: '现代款床头柜', listPrice: 2550, discountPrice: 1530, commission: 612, image: 'https://picsum.photos/seed/sku-g622/100/100' }]
  }
];
