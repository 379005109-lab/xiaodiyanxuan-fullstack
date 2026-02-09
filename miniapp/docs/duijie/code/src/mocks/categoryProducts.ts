export interface CategoryProduct {
  id: string;
  name: string;
  image: string;
  craft: string;
  material: string;
  priceFrom: number;
  deliveryDays: number;
  tags: string[];
  manufacturer: string;
}

export const categoryProducts: CategoryProduct[] = [
  {
    id: 'SF001',
    name: '云栖藤编休闲椅',
    image: 'https://readdy.ai/api/search-image?query=modern%20rattan%20woven%20leisure%20armchair%20with%20comfortable%20cushion%20in%20natural%20beige%20color%2C%20elegant%20outdoor%20balcony%20furniture%20with%20curved%20backrest%20and%20metal%20legs%2C%20professional%20product%20photography%20with%20soft%20studio%20lighting%20on%20clean%20minimal%20light%20gray%20background&width=600&height=600&seq=cp-001&orientation=squarish',
    craft: '手工藤编',
    material: 'PE仿藤+铝合金',
    priceFrom: 1280,
    deliveryDays: 15,
    tags: ['可定制', '工程款'],
    manufacturer: '佛山·南海藤艺'
  },
  {
    id: 'SF002',
    name: '岚风实木摇椅',
    image: 'https://readdy.ai/api/search-image?query=solid%20wood%20rocking%20chair%20with%20elegant%20curved%20design%20and%20comfortable%20fabric%20seat%20cushion%20in%20warm%20walnut%20color%2C%20modern%20Scandinavian%20style%20balcony%20leisure%20furniture%2C%20professional%20product%20photography%20with%20soft%20studio%20lighting%20on%20clean%20minimal%20light%20gray%20background&width=600&height=600&seq=cp-002&orientation=squarish',
    craft: '榫卯工艺',
    material: '北美白蜡木',
    priceFrom: 2380,
    deliveryDays: 25,
    tags: ['可定制'],
    manufacturer: '东莞·厚街木研所'
  },
  {
    id: 'SF003',
    name: '月影铝合金折叠椅',
    image: 'https://readdy.ai/api/search-image?query=modern%20aluminum%20folding%20leisure%20chair%20with%20breathable%20mesh%20fabric%20seat%20in%20matte%20black%20finish%2C%20lightweight%20portable%20outdoor%20balcony%20furniture%20with%20sleek%20minimalist%20design%2C%20professional%20product%20photography%20with%20soft%20studio%20lighting%20on%20clean%20minimal%20light%20gray%20background&width=600&height=600&seq=cp-003&orientation=squarish',
    craft: '阳极氧化',
    material: '航空铝合金',
    priceFrom: 680,
    deliveryDays: 7,
    tags: ['工程款'],
    manufacturer: '永康·金属工坊'
  },
  {
    id: 'SF004',
    name: '禅意竹编躺椅',
    image: 'https://readdy.ai/api/search-image?query=zen%20style%20bamboo%20woven%20reclining%20lounge%20chair%20with%20adjustable%20backrest%20and%20natural%20bamboo%20color%2C%20traditional%20Chinese%20craft%20outdoor%20balcony%20relaxation%20furniture%2C%20professional%20product%20photography%20with%20soft%20studio%20lighting%20on%20clean%20minimal%20light%20gray%20background&width=600&height=600&seq=cp-004&orientation=squarish',
    craft: '传统竹编',
    material: '毛竹+碳化处理',
    priceFrom: 960,
    deliveryDays: 20,
    tags: ['可定制', '工程款'],
    manufacturer: '安吉·竹韵坊'
  },
  {
    id: 'SF005',
    name: '星云布艺懒人椅',
    image: 'https://readdy.ai/api/search-image?query=modern%20fabric%20lazy%20bean%20bag%20lounge%20chair%20with%20soft%20velvet%20upholstery%20in%20warm%20cream%20white%20color%2C%20comfortable%20contemporary%20balcony%20leisure%20seating%20with%20organic%20round%20shape%2C%20professional%20product%20photography%20with%20soft%20studio%20lighting%20on%20clean%20minimal%20light%20gray%20background&width=600&height=600&seq=cp-005&orientation=squarish',
    craft: '高频热合',
    material: '科技绒布+EPP',
    priceFrom: 520,
    deliveryDays: 5,
    tags: [],
    manufacturer: '杭州·软装研究所'
  },
  {
    id: 'BD001',
    name: '拾光铁艺吊篮椅',
    image: 'https://readdy.ai/api/search-image?query=modern%20iron%20hanging%20egg%20swing%20chair%20with%20thick%20cushion%20in%20dark%20green%20velvet%2C%20elegant%20balcony%20leisure%20furniture%20with%20black%20metal%20frame%20and%20chain%20suspension%2C%20professional%20product%20photography%20with%20soft%20studio%20lighting%20on%20clean%20minimal%20light%20gray%20background&width=600&height=600&seq=cp-006&orientation=squarish',
    craft: '锻造焊接',
    material: '碳钢+静电喷涂',
    priceFrom: 1580,
    deliveryDays: 18,
    tags: ['可定制'],
    manufacturer: '佛山·铁艺世家'
  },
  {
    id: 'BD002',
    name: '清风户外特斯林椅',
    image: 'https://readdy.ai/api/search-image?query=modern%20outdoor%20teslin%20mesh%20leisure%20chair%20with%20aluminum%20frame%20in%20silver%20gray%20color%2C%20breathable%20weather%20resistant%20balcony%20furniture%20with%20ergonomic%20curved%20backrest%2C%20professional%20product%20photography%20with%20soft%20studio%20lighting%20on%20clean%20minimal%20light%20gray%20background&width=600&height=600&seq=cp-007&orientation=squarish',
    craft: '一体成型',
    material: '特斯林网布+铝管',
    priceFrom: 450,
    deliveryDays: 3,
    tags: ['工程款'],
    manufacturer: '中山·户外家具厂'
  },
  {
    id: 'BD003',
    name: '暮光柚木扶手椅',
    image: 'https://readdy.ai/api/search-image?query=premium%20teak%20wood%20armchair%20with%20wide%20armrests%20and%20comfortable%20linen%20seat%20cushion%20in%20natural%20honey%20color%2C%20luxury%20outdoor%20balcony%20leisure%20furniture%20with%20classic%20elegant%20design%2C%20professional%20product%20photography%20with%20soft%20studio%20lighting%20on%20clean%20minimal%20light%20gray%20background&width=600&height=600&seq=cp-008&orientation=squarish',
    craft: '传统木作',
    material: '缅甸柚木',
    priceFrom: 3680,
    deliveryDays: 30,
    tags: ['可定制', '工程款'],
    manufacturer: '东阳·木雕名坊'
  }
];

export const filterChips = {
  material: ['实木', '藤编', '金属', '布艺', '竹制', '塑料'],
  style: ['现代简约', '北欧', '日式', '中式', '工业风', '轻奢'],
  craft: ['手工编织', '榫卯', '焊接', '注塑', '雕刻'],
  price: ['500以下', '500-1000', '1000-2000', '2000-5000', '5000以上'],
  delivery: ['7天内', '15天内', '30天内', '30天以上'],
  type: ['现货', '定制', '工程款']
};
