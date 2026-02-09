import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Category {
  id: string;
  name: string;
}

interface SpaceDetail {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  subCategories: SubCategory[];
}

interface SubCategory {
  id: string;
  name: string;
  icon: string;
  image: string;
}

const categories: Category[] = [
  { id: 'all', name: '全部' },
  { id: 'new', name: '新品' },
  { id: 'living', name: '客厅空间' },
  { id: 'bedroom', name: '卧室空间' },
  { id: 'dining', name: '餐厅空间' },
  { id: 'study', name: '书房空间' },
  { id: 'balcony', name: '阳台空间' },
  { id: 'entrance', name: '玄关空间' },
  { id: 'bathroom', name: '卫浴空间' },
  { id: 'style', name: '风格合集' },
];

const spaceDetails: Record<string, SpaceDetail> = {
  all: {
    id: 'all',
    name: '全部空间',
    description: '探索全屋家居灵感',
    coverImage: 'https://readdy.ai/api/search-image?query=modern%20minimalist%20home%20interior%20design%20with%20natural%20light%20clean%20white%20background%20soft%20shadows%20elegant%20furniture%208k&width=800&height=400&seq=space-all-v1&orientation=landscape',
    subCategories: [
      { id: '1', name: '客厅', icon: 'ri-sofa-line', image: 'https://readdy.ai/api/search-image?query=modern%20living%20room%20sofa%20natural%20light%208k&width=200&height=200&seq=space-all-sub-1&orientation=squarish' },
      { id: '2', name: '卧室', icon: 'ri-hotel-bed-line', image: 'https://readdy.ai/api/search-image?query=cozy%20bedroom%20interior%20natural%20light%208k&width=200&height=200&seq=space-all-sub-2&orientation=squarish' },
      { id: '3', name: '餐厅', icon: 'ri-restaurant-line', image: 'https://readdy.ai/api/search-image?query=elegant%20dining%20room%20table%208k&width=200&height=200&seq=space-all-sub-3&orientation=squarish' },
      { id: '4', name: '书房', icon: 'ri-book-open-line', image: 'https://readdy.ai/api/search-image?query=minimalist%20home%20office%20desk%208k&width=200&height=200&seq=space-all-sub-4&orientation=squarish' },
      { id: '5', name: '阳台', icon: 'ri-plant-line', image: 'https://readdy.ai/api/search-image?query=modern%20balcony%20garden%20natural%20light%208k&width=200&height=200&seq=space-all-sub-5&orientation=squarish' },
      { id: '6', name: '玄关', icon: 'ri-door-line', image: 'https://readdy.ai/api/search-image?query=elegant%20entrance%20hallway%20interior%208k&width=200&height=200&seq=space-all-sub-6&orientation=squarish' },
    ],
  },
  new: {
    id: 'new',
    name: '新品上架',
    description: '最新家居设计',
    coverImage: 'https://readdy.ai/api/search-image?query=latest%20modern%20furniture%20collection%20natural%20light%20clean%20background%20elegant%20design%208k&width=800&height=400&seq=space-new-v1&orientation=landscape',
    subCategories: [
      { id: '1', name: '新品沙发', icon: 'ri-sofa-line', image: 'https://readdy.ai/api/search-image?query=new%20modern%20sofa%20white%20background%208k&width=200&height=200&seq=space-new-sub-1&orientation=squarish' },
      { id: '2', name: '新品床具', icon: 'ri-hotel-bed-line', image: 'https://readdy.ai/api/search-image?query=new%20modern%20bed%20white%20background%208k&width=200&height=200&seq=space-new-sub-2&orientation=squarish' },
      { id: '3', name: '新品桌椅', icon: 'ri-table-line', image: 'https://readdy.ai/api/search-image?query=new%20dining%20table%20chairs%20white%20background%208k&width=200&height=200&seq=space-new-sub-3&orientation=squarish' },
      { id: '4', name: '新品灯具', icon: 'ri-lightbulb-line', image: 'https://readdy.ai/api/search-image?query=new%20modern%20pendant%20light%20white%20background%208k&width=200&height=200&seq=space-new-sub-4&orientation=squarish' },
      { id: '5', name: '新品装饰', icon: 'ri-palette-line', image: 'https://readdy.ai/api/search-image?query=new%20home%20decor%20accessories%20white%20background%208k&width=200&height=200&seq=space-new-sub-5&orientation=squarish' },
      { id: '6', name: '新品收纳', icon: 'ri-inbox-line', image: 'https://readdy.ai/api/search-image?query=new%20storage%20furniture%20white%20background%208k&width=200&height=200&seq=space-new-sub-6&orientation=squarish' },
    ],
  },
  living: {
    id: 'living',
    name: '客厅空间',
    description: '沙发/茶几/电视柜/装饰',
    coverImage: 'https://readdy.ai/api/search-image?query=modern%20living%20room%20interior%20with%20cream%20sofa%20wooden%20coffee%20table%20natural%20daylight%20soft%20shadows%20elegant%20minimalist%20design%208k&width=800&height=400&seq=space-living-v1&orientation=landscape',
    subCategories: [
      { id: '1', name: '沙发', icon: 'ri-sofa-line', image: 'https://readdy.ai/api/search-image?query=modern%20sofa%20cream%20color%20white%20background%208k&width=200&height=200&seq=space-living-sub-1&orientation=squarish' },
      { id: '2', name: '茶几', icon: 'ri-table-line', image: 'https://readdy.ai/api/search-image?query=modern%20coffee%20table%20wood%20white%20background%208k&width=200&height=200&seq=space-living-sub-2&orientation=squarish' },
      { id: '3', name: '电视柜', icon: 'ri-tv-line', image: 'https://readdy.ai/api/search-image?query=modern%20tv%20cabinet%20wood%20white%20background%208k&width=200&height=200&seq=space-living-sub-3&orientation=squarish' },
      { id: '4', name: '边几', icon: 'ri-table-2', image: 'https://readdy.ai/api/search-image?query=modern%20side%20table%20white%20background%208k&width=200&height=200&seq=space-living-sub-4&orientation=squarish' },
      { id: '5', name: '地毯', icon: 'ri-layout-grid-line', image: 'https://readdy.ai/api/search-image?query=modern%20area%20rug%20geometric%20pattern%20white%20background%208k&width=200&height=200&seq=space-living-sub-5&orientation=squarish' },
      { id: '6', name: '装饰画', icon: 'ri-image-line', image: 'https://readdy.ai/api/search-image?query=modern%20wall%20art%20frame%20white%20background%208k&width=200&height=200&seq=space-living-sub-6&orientation=squarish' },
    ],
  },
  bedroom: {
    id: 'bedroom',
    name: '卧室空间',
    description: '床/床头柜/衣柜/梳妆台',
    coverImage: 'https://readdy.ai/api/search-image?query=cozy%20bedroom%20interior%20with%20grey%20upholstered%20bed%20wooden%20nightstand%20warm%20bedside%20lamp%20natural%20light%20soft%20beige%20bedding%20peaceful%20atmosphere%208k&width=800&height=400&seq=space-bedroom-v1&orientation=landscape',
    subCategories: [
      { id: '1', name: '床', icon: 'ri-hotel-bed-line', image: 'https://readdy.ai/api/search-image?query=modern%20bed%20grey%20upholstered%20white%20background%208k&width=200&height=200&seq=space-bedroom-sub-1&orientation=squarish' },
      { id: '2', name: '床头柜', icon: 'ri-archive-drawer-line', image: 'https://readdy.ai/api/search-image?query=modern%20nightstand%20wood%20white%20background%208k&width=200&height=200&seq=space-bedroom-sub-2&orientation=squarish' },
      { id: '3', name: '衣柜', icon: 'ri-door-open-line', image: 'https://readdy.ai/api/search-image?query=modern%20wardrobe%20closet%20white%20background%208k&width=200&height=200&seq=space-bedroom-sub-3&orientation=squarish' },
      { id: '4', name: '梳妆台', icon: 'ri-makeup-line', image: 'https://readdy.ai/api/search-image?query=modern%20vanity%20table%20mirror%20white%20background%208k&width=200&height=200&seq=space-bedroom-sub-4&orientation=squarish' },
      { id: '5', name: '床品', icon: 'ri-t-shirt-line', image: 'https://readdy.ai/api/search-image?query=modern%20bedding%20set%20beige%20white%20background%208k&width=200&height=200&seq=space-bedroom-sub-5&orientation=squarish' },
      { id: '6', name: '床头灯', icon: 'ri-lightbulb-line', image: 'https://readdy.ai/api/search-image?query=modern%20bedside%20lamp%20white%20background%208k&width=200&height=200&seq=space-bedroom-sub-6&orientation=squarish' },
    ],
  },
  dining: {
    id: 'dining',
    name: '餐厅空间',
    description: '餐桌椅/餐边柜/灯具',
    coverImage: 'https://readdy.ai/api/search-image?query=elegant%20dining%20room%20interior%20with%20natural%20wood%20dining%20table%20upholstered%20chairs%20warm%20pendant%20light%20natural%20daylight%20sophisticated%20atmosphere%20modern%20design%208k&width=800&height=400&seq=space-dining-v1&orientation=landscape',
    subCategories: [
      { id: '1', name: '餐桌', icon: 'ri-table-line', image: 'https://readdy.ai/api/search-image?query=modern%20dining%20table%20wood%20white%20background%208k&width=200&height=200&seq=space-dining-sub-1&orientation=squarish' },
      { id: '2', name: '餐椅', icon: 'ri-armchair-line', image: 'https://readdy.ai/api/search-image?query=modern%20dining%20chair%20upholstered%20white%20background%208k&width=200&height=200&seq=space-dining-sub-2&orientation=squarish' },
      { id: '3', name: '餐边柜', icon: 'ri-archive-line', image: 'https://readdy.ai/api/search-image?query=modern%20sideboard%20cabinet%20wood%20white%20background%208k&width=200&height=200&seq=space-dining-sub-3&orientation=squarish' },
      { id: '4', name: '吧椅', icon: 'ri-goblet-line', image: 'https://readdy.ai/api/search-image?query=modern%20bar%20stool%20white%20background%208k&width=200&height=200&seq=space-dining-sub-4&orientation=squarish' },
      { id: '5', name: '吊灯', icon: 'ri-lightbulb-flash-line', image: 'https://readdy.ai/api/search-image?query=modern%20pendant%20light%20dining%20white%20background%208k&width=200&height=200&seq=space-dining-sub-5&orientation=squarish' },
      { id: '6', name: '地毯', icon: 'ri-layout-grid-line', image: 'https://readdy.ai/api/search-image?query=modern%20dining%20rug%20white%20background%208k&width=200&height=200&seq=space-dining-sub-6&orientation=squarish' },
    ],
  },
  study: {
    id: 'study',
    name: '书房空间',
    description: '书桌/书椅/书架/台灯',
    coverImage: 'https://readdy.ai/api/search-image?query=minimalist%20home%20office%20interior%20with%20natural%20wood%20desk%20ergonomic%20chair%20organized%20bookshelf%20bright%20natural%20light%20clean%20workspace%20modern%20design%208k&width=800&height=400&seq=space-study-v1&orientation=landscape',
    subCategories: [
      { id: '1', name: '书桌', icon: 'ri-table-line', image: 'https://readdy.ai/api/search-image?query=modern%20desk%20wood%20white%20background%208k&width=200&height=200&seq=space-study-sub-1&orientation=squarish' },
      { id: '2', name: '书椅', icon: 'ri-armchair-line', image: 'https://readdy.ai/api/search-image?query=modern%20office%20chair%20ergonomic%20white%20background%208k&width=200&height=200&seq=space-study-sub-2&orientation=squarish' },
      { id: '3', name: '书架', icon: 'ri-bookshelf-line', image: 'https://readdy.ai/api/search-image?query=modern%20bookshelf%20wood%20white%20background%208k&width=200&height=200&seq=space-study-sub-3&orientation=squarish' },
      { id: '4', name: '台灯', icon: 'ri-lightbulb-line', image: 'https://readdy.ai/api/search-image?query=modern%20desk%20lamp%20white%20background%208k&width=200&height=200&seq=space-study-sub-4&orientation=squarish' },
      { id: '5', name: '文件柜', icon: 'ri-file-cabinet-line', image: 'https://readdy.ai/api/search-image?query=modern%20filing%20cabinet%20white%20background%208k&width=200&height=200&seq=space-study-sub-5&orientation=squarish' },
      { id: '6', name: '收纳盒', icon: 'ri-inbox-line', image: 'https://readdy.ai/api/search-image?query=modern%20storage%20box%20organizer%20white%20background%208k&width=200&height=200&seq=space-study-sub-6&orientation=squarish' },
    ],
  },
  balcony: {
    id: 'balcony',
    name: '阳台空间',
    description: '休闲椅/花架/收纳柜',
    coverImage: 'https://readdy.ai/api/search-image?query=modern%20balcony%20garden%20interior%20with%20leisure%20chair%20plant%20stand%20natural%20light%20green%20plants%20peaceful%20atmosphere%20elegant%20design%208k&width=800&height=400&seq=space-balcony-v1&orientation=landscape',
    subCategories: [
      { id: '1', name: '休闲椅', icon: 'ri-armchair-line', image: 'https://readdy.ai/api/search-image?query=modern%20leisure%20chair%20outdoor%20white%20background%208k&width=200&height=200&seq=space-balcony-sub-1&orientation=squarish' },
      { id: '2', name: '花架', icon: 'ri-plant-line', image: 'https://readdy.ai/api/search-image?query=modern%20plant%20stand%20wood%20white%20background%208k&width=200&height=200&seq=space-balcony-sub-2&orientation=squarish' },
      { id: '3', name: '收纳柜', icon: 'ri-archive-line', image: 'https://readdy.ai/api/search-image?query=modern%20storage%20cabinet%20outdoor%20white%20background%208k&width=200&height=200&seq=space-balcony-sub-3&orientation=squarish' },
      { id: '4', name: '小茶几', icon: 'ri-table-2', image: 'https://readdy.ai/api/search-image?query=modern%20small%20coffee%20table%20outdoor%20white%20background%208k&width=200&height=200&seq=space-balcony-sub-4&orientation=squarish' },
      { id: '5', name: '吊椅', icon: 'ri-contrast-drop-line', image: 'https://readdy.ai/api/search-image?query=modern%20hanging%20chair%20white%20background%208k&width=200&height=200&seq=space-balcony-sub-5&orientation=squarish' },
      { id: '6', name: '装饰灯', icon: 'ri-lightbulb-line', image: 'https://readdy.ai/api/search-image?query=modern%20outdoor%20decorative%20light%20white%20background%208k&width=200&height=200&seq=space-balcony-sub-6&orientation=squarish' },
    ],
  },
  entrance: {
    id: 'entrance',
    name: '玄关空间',
    description: '鞋柜/穿衣镜/挂钩',
    coverImage: 'https://readdy.ai/api/search-image?query=elegant%20entrance%20hallway%20interior%20with%20shoe%20cabinet%20full%20length%20mirror%20coat%20hooks%20natural%20light%20clean%20design%20modern%20minimalist%208k&width=800&height=400&seq=space-entrance-v1&orientation=landscape',
    subCategories: [
      { id: '1', name: '鞋柜', icon: 'ri-archive-line', image: 'https://readdy.ai/api/search-image?query=modern%20shoe%20cabinet%20wood%20white%20background%208k&width=200&height=200&seq=space-entrance-sub-1&orientation=squarish' },
      { id: '2', name: '穿衣镜', icon: 'ri-contrast-line', image: 'https://readdy.ai/api/search-image?query=modern%20full%20length%20mirror%20white%20background%208k&width=200&height=200&seq=space-entrance-sub-2&orientation=squarish' },
      { id: '3', name: '挂钩', icon: 'ri-handbag-line', image: 'https://readdy.ai/api/search-image?query=modern%20wall%20hooks%20coat%20rack%20white%20background%208k&width=200&height=200&seq=space-entrance-sub-3&orientation=squarish' },
      { id: '4', name: '换鞋凳', icon: 'ri-armchair-line', image: 'https://readdy.ai/api/search-image?query=modern%20shoe%20bench%20white%20background%208k&width=200&height=200&seq=space-entrance-sub-4&orientation=squarish' },
      { id: '5', name: '装饰柜', icon: 'ri-archive-drawer-line', image: 'https://readdy.ai/api/search-image?query=modern%20console%20table%20white%20background%208k&width=200&height=200&seq=space-entrance-sub-5&orientation=squarish' },
      { id: '6', name: '地垫', icon: 'ri-layout-grid-line', image: 'https://readdy.ai/api/search-image?query=modern%20entrance%20mat%20white%20background%208k&width=200&height=200&seq=space-entrance-sub-6&orientation=squarish' },
    ],
  },
  bathroom: {
    id: 'bathroom',
    name: '卫浴空间',
    description: '浴室柜/镜柜/收纳架',
    coverImage: 'https://readdy.ai/api/search-image?query=modern%20bathroom%20interior%20with%20vanity%20cabinet%20mirror%20cabinet%20storage%20shelf%20natural%20light%20clean%20white%20design%20elegant%20minimalist%208k&width=800&height=400&seq=space-bathroom-v1&orientation=landscape',
    subCategories: [
      { id: '1', name: '浴室柜', icon: 'ri-archive-line', image: 'https://readdy.ai/api/search-image?query=modern%20bathroom%20vanity%20cabinet%20white%20background%208k&width=200&height=200&seq=space-bathroom-sub-1&orientation=squarish' },
      { id: '2', name: '镜柜', icon: 'ri-contrast-line', image: 'https://readdy.ai/api/search-image?query=modern%20mirror%20cabinet%20bathroom%20white%20background%208k&width=200&height=200&seq=space-bathroom-sub-2&orientation=squarish' },
      { id: '3', name: '收纳架', icon: 'ri-stack-line', image: 'https://readdy.ai/api/search-image?query=modern%20bathroom%20storage%20shelf%20white%20background%208k&width=200&height=200&seq=space-bathroom-sub-3&orientation=squarish' },
      { id: '4', name: '毛巾架', icon: 'ri-t-shirt-line', image: 'https://readdy.ai/api/search-image?query=modern%20towel%20rack%20white%20background%208k&width=200&height=200&seq=space-bathroom-sub-4&orientation=squarish' },
      { id: '5', name: '置物架', icon: 'ri-inbox-line', image: 'https://readdy.ai/api/search-image?query=modern%20bathroom%20organizer%20shelf%20white%20background%208k&width=200&height=200&seq=space-bathroom-sub-5&orientation=squarish' },
      { id: '6', name: '浴室灯', icon: 'ri-lightbulb-line', image: 'https://readdy.ai/api/search-image?query=modern%20bathroom%20light%20fixture%20white%20background%208k&width=200&height=200&seq=space-bathroom-sub-6&orientation=squarish' },
    ],
  },
  style: {
    id: 'style',
    name: '风格合集',
    description: '复古混搭/慵懒家/侘寂风',
    coverImage: 'https://readdy.ai/api/search-image?query=mixed%20interior%20design%20styles%20collection%20vintage%20modern%20cozy%20wabi%20sabi%20natural%20light%20elegant%20atmosphere%208k&width=800&height=400&seq=space-style-v1&orientation=landscape',
    subCategories: [
      { id: '1', name: '复古混搭', icon: 'ri-palette-line', image: 'https://readdy.ai/api/search-image?query=vintage%20eclectic%20furniture%20style%20white%20background%208k&width=200&height=200&seq=space-style-sub-1&orientation=squarish' },
      { id: '2', name: '慵懒家', icon: 'ri-emotion-line', image: 'https://readdy.ai/api/search-image?query=cozy%20lazy%20home%20style%20furniture%20white%20background%208k&width=200&height=200&seq=space-style-sub-2&orientation=squarish' },
      { id: '3', name: '侘寂风', icon: 'ri-leaf-line', image: 'https://readdy.ai/api/search-image?query=wabi%20sabi%20style%20furniture%20natural%20white%20background%208k&width=200&height=200&seq=space-style-sub-3&orientation=squarish' },
      { id: '4', name: '北欧风', icon: 'ri-snowflake-line', image: 'https://readdy.ai/api/search-image?query=scandinavian%20style%20furniture%20white%20background%208k&width=200&height=200&seq=space-style-sub-4&orientation=squarish' },
      { id: '5', name: '日式风', icon: 'ri-sun-line', image: 'https://readdy.ai/api/search-image?query=japanese%20style%20furniture%20minimalist%20white%20background%208k&width=200&height=200&seq=space-style-sub-5&orientation=squarish' },
      { id: '6', name: '现代简约', icon: 'ri-layout-line', image: 'https://readdy.ai/api/search-image?query=modern%20minimalist%20furniture%20white%20background%208k&width=200&height=200&seq=space-style-sub-6&orientation=squarish' },
    ],
  },
};

export default function SpaceCategoryPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageLoadStates, setImageLoadStates] = useState<Record<string, 'loading' | 'loaded' | 'error'>>({});

  const currentSpace = spaceDetails[selectedCategory];

  const recentSearches = ['北欧沙发', '实木餐桌', '简约书桌'];
  const hotSearches = ['客厅沙发', '卧室床', '餐桌椅', '书房书架', '阳台椅'];

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === selectedCategory) return;
    
    setIsLoading(true);
    setSelectedCategory(categoryId);
    setImageLoadStates();
    
    setTimeout(() => {
      setIsLoading(false);
    }, 400);
  };

  const handleSubCategoryClick = (subCategoryId: string) => {
    navigate(`/products/list?space=${selectedCategory}&category=${subCategoryId}`);
  };

  const handleViewAll = () => {
    navigate(`/products/list?space=${selectedCategory}`);
  };

  const handleImageLoad = (imageId: string) => {
    setImageLoadStates(prev => ({ ...prev, [imageId]: 'loaded' }));
  };

  const handleImageError = (imageId: string) => {
    setImageLoadStates(prev => ({ ...prev, [imageId]: 'error' }));
  };

  const handleImageRetry = (imageId: string, imageSrc: string) => {
    setImageLoadStates(prev => ({ ...prev, [imageId]: 'loading' }));
    const img = new Image();
    img.onload = () => handleImageLoad(imageId);
    img.onerror = () => handleImageError(imageId);
    img.src = imageSrc;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">商品库</h1>
        </div>

        {/* 搜索栏 */}
        <div className="px-4 pb-3">
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchDropdown(true)}
                  placeholder="搜索商品/品牌/空间"
                  className="w-full h-9 pl-9 pr-3 text-sm bg-gray-50 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base"></i>
              </div>
              <button className="w-9 h-9 flex items-center justify-center bg-gray-50 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
                <i className="ri-scan-line text-gray-700 text-lg"></i>
              </button>
            </div>

            {/* 搜索下拉 */}
            {showSearchDropdown && (
              <div className="absolute top-full left-0 right-12 mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50">
                <div className="p-4">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">最近搜索</span>
                      <button className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">清空</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((item, index) => (
                        <button
                          key={index}
                          className="px-3 py-1.5 text-sm text-gray-700 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center mb-2">
                      <i className="ri-fire-line text-orange-500 text-sm mr-1"></i>
                      <span className="text-xs font-medium text-gray-500">热门搜索</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {hotSearches.map((item, index) => (
                        <button
                          key={index}
                          className="px-3 py-1.5 text-sm text-gray-700 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 主体布局 */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* 左侧类目栏 */}
        <div className="w-22 bg-gray-50 border-r border-gray-100 overflow-y-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`w-full px-2 py-4 text-sm relative transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'text-orange-600 font-semibold bg-white'
                  : 'text-gray-600 font-normal hover:bg-white/50'
              }`}
            >
              {selectedCategory === category.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-orange-600 rounded-r"></div>
              )}
              {category.name}
            </button>
          ))}
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {/* 骨架屏 */}
              <div className="w-full h-48 bg-gray-100 rounded-2xl animate-pulse"></div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="w-full aspect-square bg-gray-100 rounded-xl animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : currentSpace ? (
            <div className="p-4 space-y-4">
              {/* 空间主视觉卡 */}
              <div className="relative w-full h-48 bg-gray-50 rounded-2xl overflow-hidden shadow-sm">
                {imageLoadStates['cover'] === 'error' ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <i className="ri-image-line text-4xl text-gray-300 mb-2"></i>
                    <p className="text-sm text-gray-400 mb-2">暂无封面</p>
                    <button
                      onClick={() => handleImageRetry('cover', currentSpace.coverImage)}
                      className="px-3 py-1 text-xs text-orange-600 border border-orange-600 rounded-full hover:bg-orange-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      重试
                    </button>
                  </div>
                ) : (
                  <>
                    {imageLoadStates['cover'] !== 'loaded' && (
                      <div className="absolute inset-0 bg-gray-100 animate-pulse"></div>
                    )}
                    <img
                      src={currentSpace.coverImage}
                      alt={currentSpace.name}
                      onLoad={() => handleImageLoad('cover')}
                      onError={() => handleImageError('cover')}
                      className={`w-full h-full object-cover transition-opacity duration-500 ${
                        imageLoadStates['cover'] === 'loaded' ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  </>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h2 className="text-xl font-bold text-white mb-1">{currentSpace.name}</h2>
                  <p className="text-sm text-white/90 mb-3">{currentSpace.description}</p>
                  <button
                    onClick={handleViewAll}
                    className="px-4 py-1.5 text-sm font-medium text-white bg-white/20 backdrop-blur-sm border border-white/30 rounded-full hover:bg-white/30 transition-all cursor-pointer whitespace-nowrap"
                  >
                    查看全部
                  </button>
                </div>
              </div>

              {/* 细分类网格 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">细分类目</h3>
                <div className="grid grid-cols-3 gap-3">
                  {currentSpace.subCategories.map((subCategory) => (
                    <button
                      key={subCategory.id}
                      onClick={() => handleSubCategoryClick(subCategory.id)}
                      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="relative w-full aspect-square bg-gray-50">
                        {imageLoadStates[`sub-${subCategory.id}`] === 'error' ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                            <i className={`${subCategory.icon} text-3xl text-gray-300 mb-1`}></i>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleImageRetry(`sub-${subCategory.id}`, subCategory.image);
                              }}
                              className="mt-1 px-2 py-0.5 text-xs text-orange-600 border border-orange-600 rounded-full hover:bg-orange-50 transition-colors whitespace-nowrap"
                            >
                              重试
                            </button>
                          </div>
                        ) : (
                          <>
                            {imageLoadStates[`sub-${subCategory.id}`] !== 'loaded' && (
                              <div className="absolute inset-0 bg-gray-100 animate-pulse"></div>
                            )}
                            <img
                              src={subCategory.image}
                              alt={subCategory.name}
                              onLoad={() => handleImageLoad(`sub-${subCategory.id}`)}
                              onError={() => handleImageError(`sub-${subCategory.id}`)}
                              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
                                imageLoadStates[`sub-${subCategory.id}`] === 'loaded' ? 'opacity-100' : 'opacity-0'
                              }`}
                            />
                          </>
                        )}
                      </div>
                      <div className="p-2.5 text-center">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                          {subCategory.name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full px-4">
              <i className="ri-inbox-line text-6xl text-gray-200 mb-4"></i>
              <p className="text-base text-gray-400 mb-4">暂无该空间内容</p>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm text-gray-600 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap">
                  切换类目
                </button>
                <button className="px-4 py-2 text-sm text-white bg-orange-600 rounded-full hover:bg-orange-700 transition-colors cursor-pointer whitespace-nowrap">
                  联系客服
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 点击外部关闭搜索下拉 */}
      {showSearchDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSearchDropdown(false)}
        ></div>
      )}
    </div>
  );
}
