import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInViewAnimation } from '../../../hooks/useInViewAnimation';
import TabBar from '../../../components/TabBar';
import ImageSearchModal from '../../../components/ImageSearchModal';

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
    name: '全部商品',
    description: '精选全屋家具，打造理想生活空间',
    coverImage:
      'https://readdy.ai/api/search-image?query=modern%20luxury%20furniture%20showroom%20with%20elegant%20sofas%20tables%20and%20lighting%20in%20bright%20spacious%20interior%2C%20professional%20interior%20photography%20with%20warm%20natural%20lighting%20and%20sophisticated%20design%20aesthetic%2C%20high%20end%20home%20furnishing%20display&width=800&height=400&seq=cat-cover-all&orientation=landscape',
    subCategories: [
      {
        id: 'sofa',
        name: '沙发系列',
        icon: 'ri-sofa-line',
        image:
          'https://readdy.ai/api/search-image?query=elegant%20modern%20sofa%20collection%20display%20with%20multiple%20styles%20in%20bright%20showroom%2C%20premium%20leather%20and%20fabric%20sofas%20with%20clean%20design%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-all-sofa&orientation=squarish',
      },
      {
        id: 'bed',
        name: '床具系列',
        icon: 'ri-hotel-bed-line',
        image:
          'https://readdy.ai/api/search-image?query=luxury%20bed%20collection%20with%20upholstered%20headboards%20and%20premium%20bedding%20in%20modern%20bedroom%20display%2C%20professional%20furniture%20photography%20with%20soft%20warm%20lighting%20on%20light%20background&width=400&height=400&seq=cat-all-bed&orientation=squarish',
      },
      {
        id: 'dining',
        name: '餐桌椅系列',
        icon: 'ri-restaurant-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20dining%20table%20and%20chairs%20set%20collection%20in%20elegant%20showroom%20display%2C%20solid%20wood%20and%20marble%20dining%20furniture%2C%20professional%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-all-dining&orientation=squarish',
      },
      {
        id: 'cabinet',
        name: '柜类系列',
        icon: 'ri-archive-drawer-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20storage%20cabinet%20collection%20with%20wardrobes%20bookcases%20and%20TV%20stands%20in%20bright%20showroom%2C%20premium%20wood%20finish%20furniture%20display%2C%20professional%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-all-cabinet&orientation=squarish',
      },
      {
        id: 'decoration',
        name: '软装饰品',
        icon: 'ri-paint-brush-line',
        image:
          'https://readdy.ai/api/search-image?query=home%20decoration%20accessories%20collection%20with%20cushions%20rugs%20wall%20art%20and%20candles%20in%20elegant%20display%2C%20modern%20soft%20furnishing%20items%2C%20professional%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-all-deco&orientation=squarish',
      },
    ],
  },
  new: {
    id: 'new',
    name: '新品上市',
    description: '2024春夏新品，引领家居潮流',
    coverImage:
      'https://readdy.ai/api/search-image?query=brand%20new%20modern%20furniture%20collection%20launch%20display%20with%20trendy%20designs%20in%20bright%20contemporary%20showroom%2C%20fresh%20spring%20summer%20home%20furnishing%20styles%2C%20professional%20interior%20photography%20with%20warm%20natural%20lighting&width=800&height=400&seq=cat-cover-new&orientation=landscape',
    subCategories: [
      {
        id: 'new-sofa',
        name: '新品沙发',
        icon: 'ri-sofa-line',
        image:
          'https://readdy.ai/api/search-image?query=brand%20new%20modern%20curved%20sofa%20with%20unique%20organic%20shape%20design%20in%20cream%20white%20boucle%20fabric%2C%20trendy%202024%20furniture%20style%2C%20professional%20product%20photography%20with%20soft%20lighting%20on%20clean%20light%20background&width=400&height=400&seq=cat-new-sofa&orientation=squarish',
      },
      {
        id: 'new-bed',
        name: '新品床具',
        icon: 'ri-hotel-bed-line',
        image:
          'https://readdy.ai/api/search-image?query=brand%20new%20luxury%20floating%20platform%20bed%20with%20integrated%20LED%20ambient%20lighting%20and%20velvet%20headboard%2C%20modern%202024%20bedroom%20furniture%20design%2C%20professional%20product%20photography%20with%20soft%20lighting%20on%20clean%20light%20background&width=400&height=400&seq=cat-new-bed&orientation=squarish',
      },
      {
        id: 'new-table',
        name: '新品餐桌',
        icon: 'ri-restaurant-line',
        image:
          'https://readdy.ai/api/search-image?query=brand%20new%20sintered%20stone%20dining%20table%20with%20unique%20sculptural%20base%20design%20in%20modern%20style%2C%20trendy%202024%20dining%20furniture%2C%20professional%20product%20photography%20with%20soft%20lighting%20on%20clean%20light%20background&width=400&height=400&seq=cat-new-table&orientation=squarish',
      },
      {
        id: 'new-chair',
        name: '新品座椅',
        icon: 'ri-armchair-line',
        image:
          'https://readdy.ai/api/search-image?query=brand%20new%20designer%20accent%20chair%20with%20bold%20contemporary%20silhouette%20in%20terracotta%20velvet%20fabric%2C%20trendy%202024%20seating%20furniture%2C%20professional%20product%20photography%20with%20soft%20lighting%20on%20clean%20light%20background&width=400&height=400&seq=cat-new-chair&orientation=squarish',
      },
      {
        id: 'new-light',
        name: '新品灯具',
        icon: 'ri-lightbulb-line',
        image:
          'https://readdy.ai/api/search-image?query=brand%20new%20modern%20sculptural%20pendant%20light%20with%20organic%20flowing%20shape%20in%20warm%20brass%20finish%2C%20trendy%202024%20lighting%20design%2C%20professional%20product%20photography%20with%20soft%20lighting%20on%20clean%20light%20background&width=400&height=400&seq=cat-new-light&orientation=squarish',
      },
    ],
  },
  living: {
    id: 'living',
    name: '客厅空间',
    description: '打造舒适会客空间，彰显生活品味',
    coverImage:
      'https://readdy.ai/api/search-image?query=modern%20luxury%20living%20room%20interior%20with%20elegant%20sofa%20coffee%20table%20and%20ambient%20lighting%20in%20bright%20spacious%20space%2C%20professional%20interior%20design%20photography%20with%20warm%20natural%20light%20and%20sophisticated%20aesthetic&width=800&height=400&seq=cat-cover-living&orientation=landscape',
    subCategories: [
      {
        id: 'living-sofa',
        name: '客厅沙发',
        icon: 'ri-sofa-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20luxury%20sectional%20sofa%20in%20premium%20grey%20fabric%20with%20clean%20lines%20and%20plush%20cushions%20for%20living%20room%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-living-sofa&orientation=squarish',
      },
      {
        id: 'living-table',
        name: '茶几边几',
        icon: 'ri-table-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20marble%20top%20coffee%20table%20with%20gold%20metal%20frame%20and%20matching%20side%20table%20set%20for%20living%20room%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-living-table&orientation=squarish',
      },
      {
        id: 'living-tv',
        name: '电视柜',
        icon: 'ri-tv-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20minimalist%20TV%20stand%20cabinet%20in%20walnut%20wood%20with%20storage%20drawers%20and%20open%20shelves%20for%20living%20room%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-living-tv&orientation=squarish',
      },
      {
        id: 'living-rug',
        name: '客厅地毯',
        icon: 'ri-layout-grid-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20geometric%20pattern%20area%20rug%20in%20neutral%20tones%20with%20soft%20texture%20for%20living%20room%20floor%2C%20professional%20product%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-living-rug&orientation=squarish',
      },
      {
        id: 'living-light',
        name: '客厅灯具',
        icon: 'ri-lightbulb-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20crystal%20chandelier%20pendant%20light%20with%20elegant%20design%20for%20living%20room%20ceiling%2C%20professional%20product%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-living-light&orientation=squarish',
      },
    ],
  },
  bedroom: {
    id: 'bedroom',
    name: '卧室空间',
    description: '营造温馨睡眠环境，享受优质休息',
    coverImage:
      'https://readdy.ai/api/search-image?query=modern%20luxury%20bedroom%20interior%20with%20elegant%20bed%20nightstands%20and%20soft%20lighting%20in%20peaceful%20atmosphere%2C%20professional%20interior%20design%20photography%20with%20warm%20ambient%20light%20and%20cozy%20aesthetic&width=800&height=400&seq=cat-cover-bedroom&orientation=landscape',
    subCategories: [
      {
        id: 'bedroom-bed',
        name: '双人床',
        icon: 'ri-hotel-bed-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20luxury%20upholstered%20king%20size%20bed%20with%20tufted%20headboard%20in%20soft%20grey%20fabric%20and%20premium%20bedding%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-bedroom-bed&orientation=squarish',
      },
      {
        id: 'bedroom-wardrobe',
        name: '衣柜',
        icon: 'ri-door-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20sliding%20door%20wardrobe%20closet%20in%20white%20finish%20with%20mirror%20panels%20and%20organized%20storage%20for%20bedroom%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-bedroom-wardrobe&orientation=squarish',
      },
      {
        id: 'bedroom-nightstand',
        name: '床头柜',
        icon: 'ri-archive-drawer-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20wooden%20nightstand%20with%20drawers%20and%20gold%20handles%20for%20bedroom%20beside%20table%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-bedroom-nightstand&orientation=squarish',
      },
      {
        id: 'bedroom-dresser',
        name: '梳妆台',
        icon: 'ri-makeup-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20vanity%20dresser%20table%20with%20LED%20mirror%20and%20storage%20drawers%20in%20white%20finish%20for%20bedroom%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-bedroom-dresser&orientation=squarish',
      },
      {
        id: 'bedroom-mattress',
        name: '床垫',
        icon: 'ri-hotel-bed-fill',
        image:
          'https://readdy.ai/api/search-image?query=premium%20memory%20foam%20mattress%20with%20quilted%20white%20cover%20and%20comfort%20layers%20displayed%20on%20platform%2C%20professional%20product%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-bedroom-mattress&orientation=squarish',
      },
    ],
  },
  dining: {
    id: 'dining',
    name: '餐厅空间',
    description: '享受美食时光，共聚温馨餐桌',
    coverImage:
      'https://readdy.ai/api/search-image?query=modern%20elegant%20dining%20room%20interior%20with%20dining%20table%20chairs%20and%20pendant%20lighting%20in%20bright%20inviting%20space%2C%20professional%20interior%20design%20photography%20with%20warm%20natural%20light%20and%20sophisticated%20aesthetic&width=800&height=400&seq=cat-cover-dining&orientation=landscape',
    subCategories: [
      {
        id: 'dining-table',
        name: '餐桌',
        icon: 'ri-table-2',
        image:
          'https://readdy.ai/api/search-image?query=modern%20rectangular%20dining%20table%20in%20solid%20wood%20with%20natural%20finish%20for%206%20people%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-dining-table&orientation=squarish',
      },
      {
        id: 'dining-chair',
        name: '餐椅',
        icon: 'ri-armchair-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20upholstered%20dining%20chair%20with%20curved%20backrest%20in%20beige%20fabric%20and%20wooden%20legs%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-dining-chair&orientation=squarish',
      },
      {
        id: 'dining-sideboard',
        name: '餐边柜',
        icon: 'ri-archive-drawer-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20sideboard%20buffet%20cabinet%20in%20walnut%20wood%20with%20storage%20drawers%20and%20glass%20doors%20for%20dining%20room%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-dining-sideboard&orientation=squarish',
      },
      {
        id: 'dining-bar',
        name: '吧台吧椅',
        icon: 'ri-goblet-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20bar%20counter%20with%20high%20bar%20stools%20in%20black%20metal%20and%20leather%20for%20home%20dining%20area%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-dining-bar&orientation=squarish',
      },
    ],
  },
  study: {
    id: 'study',
    name: '书房空间',
    description: '专注工作学习，提升效率品质',
    coverImage:
      'https://readdy.ai/api/search-image?query=modern%20home%20office%20study%20room%20interior%20with%20desk%20bookshelf%20and%20comfortable%20chair%20in%20bright%20productive%20space%2C%20professional%20interior%20design%20photography%20with%20natural%20light%20and%20organized%20aesthetic&width=800&height=400&seq=cat-cover-study&orientation=landscape',
    subCategories: [
      {
        id: 'study-desk',
        name: '书桌',
        icon: 'ri-table-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20minimalist%20writing%20desk%20in%20walnut%20wood%20with%20clean%20lines%20and%20spacious%20work%20surface%20for%20home%20office%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-study-desk&orientation=squarish',
      },
      {
        id: 'study-chair',
        name: '办公椅',
        icon: 'ri-wheelchair-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20ergonomic%20office%20chair%20with%20mesh%20back%20and%20adjustable%20features%20in%20black%20for%20home%20study%20room%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-study-chair&orientation=squarish',
      },
      {
        id: 'study-bookshelf',
        name: '书架',
        icon: 'ri-bookshelf-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20tall%20bookshelf%20with%20multiple%20shelves%20in%20white%20finish%20for%20home%20office%20book%20storage%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-study-bookshelf&orientation=squarish',
      },
      {
        id: 'study-cabinet',
        name: '文件柜',
        icon: 'ri-file-cabinet-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20filing%20cabinet%20with%20drawers%20in%20grey%20metal%20finish%20for%20home%20office%20document%20storage%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-study-cabinet&orientation=squarish',
      },
      {
        id: 'study-light',
        name: '书房灯具',
        icon: 'ri-lightbulb-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20adjustable%20desk%20lamp%20with%20LED%20light%20in%20black%20metal%20finish%20for%20home%20office%20study%2C%20professional%20product%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-study-light&orientation=squarish',
      },
    ],
  },
  balcony: {
    id: 'balcony',
    name: '阳台空间',
    description: '打造休闲角落，享受惬意时光',
    coverImage:
      'https://readdy.ai/api/search-image?query=modern%20cozy%20balcony%20terrace%20with%20outdoor%20furniture%20plants%20and%20comfortable%20seating%20in%20bright%20sunny%20space%2C%20professional%20interior%20design%20photography%20with%20natural%20light%20and%20relaxing%20aesthetic&width=800&height=400&seq=cat-cover-balcony&orientation=landscape',
    subCategories: [
      {
        id: 'balcony-chair',
        name: '休闲椅',
        icon: 'ri-armchair-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20outdoor%20lounge%20chair%20in%20rattan%20wicker%20with%20soft%20cushions%20for%20balcony%20relaxation%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-balcony-chair&orientation=squarish',
      },
      {
        id: 'balcony-table',
        name: '阳台小桌',
        icon: 'ri-table-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20small%20round%20side%20table%20in%20metal%20and%20wood%20for%20balcony%20outdoor%20use%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-balcony-table&orientation=squarish',
      },
      {
        id: 'balcony-swing',
        name: '吊椅秋千',
        icon: 'ri-contrast-drop-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20hanging%20egg%20chair%20swing%20in%20rattan%20with%20cushions%20for%20balcony%20relaxation%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-balcony-swing&orientation=squarish',
      },
      {
        id: 'balcony-shelf',
        name: '花架置物架',
        icon: 'ri-plant-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20tiered%20plant%20stand%20shelf%20in%20metal%20for%20balcony%20flower%20pot%20display%20and%20storage%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-balcony-shelf&orientation=squarish',
      },
      {
        id: 'balcony-storage',
        name: '阳台收纳柜',
        icon: 'ri-archive-drawer-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20outdoor%20storage%20cabinet%20in%20waterproof%20material%20for%20balcony%20organization%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-balcony-storage&orientation=squarish',
      },
    ],
  },
  entrance: {
    id: 'entrance',
    name: '玄关空间',
    description: '第一印象空间，展现家居品味',
    coverImage:
      'https://readdy.ai/api/search-image?query=modern%20elegant%20entrance%20hallway%20interior%20with%20console%20table%20mirror%20and%20organized%20storage%20in%20bright%20welcoming%20space%2C%20professional%20interior%20design%20photography%20with%20natural%20light%20and%20sophisticated%20aesthetic&width=800&height=400&seq=cat-cover-entrance&orientation=landscape',
    subCategories: [
      {
        id: 'entrance-shoe',
        name: '鞋柜',
        icon: 'ri-t-shirt-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20shoe%20storage%20cabinet%20with%20seat%20cushion%20in%20white%20finish%20for%20entrance%20hallway%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-entrance-shoe&orientation=squarish',
      },
      {
        id: 'entrance-console',
        name: '玄关桌',
        icon: 'ri-table-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20narrow%20console%20table%20in%20marble%20and%20gold%20metal%20for%20entrance%20hallway%20decor%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-entrance-console&orientation=squarish',
      },
      {
        id: 'entrance-mirror',
        name: '玄关镜',
        icon: 'ri-contrast-2-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20full%20length%20wall%20mirror%20with%20gold%20metal%20frame%20for%20entrance%20hallway%2C%20professional%20product%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-entrance-mirror&orientation=squarish',
      },
      {
        id: 'entrance-rack',
        name: '衣帽架',
        icon: 'ri-handbag-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20coat%20rack%20stand%20in%20wood%20and%20metal%20with%20hooks%20for%20entrance%20hallway%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-entrance-rack&orientation=squarish',
      },
      {
        id: 'entrance-bench',
        name: '换鞋凳',
        icon: 'ri-armchair-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20upholstered%20bench%20with%20storage%20for%20entrance%20hallway%20shoe%20changing%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-entrance-bench&orientation=squarish',
      },
    ],
  },
  bathroom: {
    id: 'bathroom',
    name: '卫浴空间',
    description: '精致卫浴体验，提升生活质感',
    coverImage:
      'https://readdy.ai/api/search-image?query=modern%20luxury%20bathroom%20interior%20with%20vanity%20mirror%20and%20elegant%20fixtures%20in%20bright%20clean%20space%2C%20professional%20interior%20design%20photography%20with%20natural%20light%20and%20spa-like%20aesthetic&width=800&height=400&seq=cat-cover-bathroom&orientation=landscape',
    subCategories: [
      {
        id: 'bathroom-vanity',
        name: '浴室柜',
        icon: 'ri-archive-drawer-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20bathroom%20vanity%20cabinet%20with%20sink%20and%20storage%20in%20white%20finish%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-bathroom-vanity&orientation=squarish',
      },
      {
        id: 'bathroom-mirror',
        name: '智能镜柜',
        icon: 'ri-contrast-2-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20LED%20mirror%20cabinet%20with%20lighting%20and%20storage%20for%20bathroom%2C%20professional%20product%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-bathroom-mirror&orientation=squarish',
      },
      {
        id: 'bathroom-shelf',
        name: '置物架',
        icon: 'ri-layout-grid-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20bathroom%20wall%20shelf%20in%20chrome%20metal%20for%20towel%20and%20toiletry%20storage%2C%20professional%20product%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-bathroom-shelf&orientation=squarish',
      },
      {
        id: 'bathroom-accessories',
        name: '卫浴配件',
        icon: 'ri-tools-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20bathroom%20accessories%20set%20with%20soap%20dispenser%20toothbrush%20holder%20in%20chrome%20finish%2C%20professional%20product%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-bathroom-accessories&orientation=squarish',
      },
    ],
  },
  style: {
    id: 'style',
    name: '风格合集',
    description: '多样风格选择，满足个性需求',
    coverImage:
      'https://readdy.ai/api/search-image?query=diverse%20interior%20design%20styles%20showcase%20with%20modern%20scandinavian%20industrial%20and%20luxury%20furniture%20collections%20in%20bright%20showroom%2C%20professional%20interior%20photography%20with%20natural%20lighting%20and%20aesthetic%20variety&width=800&height=400&seq=cat-cover-style&orientation=landscape',
    subCategories: [
      {
        id: 'style-modern',
        name: '现代简约',
        icon: 'ri-layout-line',
        image:
          'https://readdy.ai/api/search-image?query=modern%20minimalist%20furniture%20collection%20with%20clean%20lines%20in%20neutral%20colors%20and%20simple%20design%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-style-modern&orientation=squarish',
      },
      {
        id: 'style-nordic',
        name: '北欧风格',
        icon: 'ri-snowflake-line',
        image:
          'https://readdy.ai/api/search-image?query=scandinavian%20nordic%20style%20furniture%20in%20light%20wood%20and%20white%20with%20cozy%20textiles%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-style-nordic&orientation=squarish',
      },
      {
        id: 'style-japanese',
        name: '日式和风',
        icon: 'ri-leaf-line',
        image:
          'https://readdy.ai/api/search-image?query=japanese%20zen%20style%20furniture%20in%20natural%20wood%20with%20minimalist%20design%20and%20tatami%20elements%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-style-japanese&orientation=squarish',
      },
      {
        id: 'style-industrial',
        name: '工业复古',
        icon: 'ri-tools-fill',
        image:
          'https://readdy.ai/api/search-image?query=industrial%20vintage%20style%20furniture%20with%20metal%20frames%20and%20reclaimed%20wood%20in%20rustic%20finish%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-style-industrial&orientation=squarish',
      },
      {
        id: 'style-luxury',
        name: '轻奢风格',
        icon: 'ri-vip-diamond-line',
        image:
          'https://readdy.ai/api/search-image?query=light%20luxury%20style%20furniture%20with%20velvet%20upholstery%20gold%20accents%20and%20elegant%20design%2C%20professional%20furniture%20photography%20with%20soft%20lighting%20on%20light%20background&width=400&height=400&seq=cat-style-luxury&orientation=squarish',
      },
    ],
  },
};

export default function CategoryPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageLoadStates, setImageLoadStates] = useState<
    Record<string, 'loading' | 'loaded' | 'error'>
  >({});
  const [showImageSearch, setShowImageSearch] = useState(false);

  const coverRef = useInViewAnimation<HTMLDivElement>({ threshold: 0.1 });
  const gridRef = useInViewAnimation<HTMLDivElement>({
    threshold: 0.1,
    staggerDelay: 100,
    staggerChildren: true,
  });

  const currentSpace = spaceDetails[selectedCategory];

  const recentSearches = ['北欧沙发', '实木餐桌', '简约书桌'];
  const hotSearches = ['客厅沙发', '卧室床', '餐桌椅', '书房书架', '阳台椅'];

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === selectedCategory) return;
    setIsLoading(true);
    setSelectedCategory(categoryId);
    setImageLoadStates({});
    setTimeout(() => {
      setIsLoading(false);
    }, 400);
  };

  const handleSubCategoryClick = (subCategoryId: string) => {
    navigate(`/products/category-list?space=${selectedCategory}&category=${subCategoryId}`);
  };

  const handleViewAll = () => {
    navigate(`/products/category-list?space=${selectedCategory}`);
  };

  const handleImageLoad = (imageId: string) => {
    setImageLoadStates((prev) => ({ ...prev, [imageId]: 'loaded' }));
  };

  const handleImageError = (imageId: string) => {
    setImageLoadStates((prev) => ({ ...prev, [imageId]: 'error' }));
  };

  const handleImageRetry = (imageId: string, imageSrc: string) => {
    setImageLoadStates((prev) => ({ ...prev, [imageId]: 'loading' }));
    const img = new Image();
    img.onload = () => handleImageLoad(imageId);
    img.onerror = () => handleImageError(imageId);
    img.src = imageSrc;
  };

  return (
    <div className="min-h-screen bg-white pb-[60px]">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-50 bg-white border-b border-[#E5E5EA]">
        <div className="px-4 py-3">
          <h1 className="text-[20px] font-semibold text-[#1D1D1F]">商品库</h1>
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
                  className="w-full h-10 pl-9 pr-3 text-[15px] bg-[#F5F5F7] border-none rounded-[12px] focus:outline-none focus:ring-1 focus:ring-[#1D1D1F]/20 placeholder:text-[#8E8E93]"
                />
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] text-base"></i>
              </div>
              <button
                onClick={() => setShowImageSearch(true)}
                className="w-10 h-10 flex items-center justify-center bg-[#F5F5F7] rounded-[12px] hover:bg-[#E5E5EA] transition-colors cursor-pointer press-button"
              >
                <i className="ri-camera-line text-[#1D1D1F] text-lg"></i>
              </button>
            </div>

            {/* 搜索下拉 */}
            {showSearchDropdown && (
              <div
                className="absolute top-full left-0 right-12 mt-2 bg-white rounded-[16px] shadow-sm border border-[#E5E5EA] overflow-hidden z-50"
                style={{
                  animation:
                    'fadeInDown 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
                }}
              >
                <div className="p-4">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-medium text-[#6E6E73]">
                        最近搜索
                      </span>
                      <button className="text-[13px] text-[#8E8E93] hover:text-[#1D1D1F] cursor-pointer press-button">
                        清空
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((item, index) => (
                        <button
                          key={index}
                          className="px-3 py-1.5 text-[14px] text-[#1D1D1F] bg-[#F5F5F7] rounded-full hover:bg-[#E5E5EA] transition-colors cursor-pointer whitespace-nowrap press-button"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center mb-2">
                      <i className="ri-fire-line text-[#1D1D1F] text-sm mr-1"></i>
                      <span className="text-[13px] font-medium text-[#6E6E73]">
                        热门搜索
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {hotSearches.map((item, index) => (
                        <button
                          key={index}
                          className="px-3 py-1.5 text-[14px] text-[#1D1D1F] bg-[#F5F5F7] rounded-full hover:bg-[#E5E5EA] transition-colors cursor-pointer whitespace-nowrap press-button"
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
      <div className="flex h-[calc(100vh-120px-60px)]">
        {/* 左侧类目栏 */}
        <div className="w-20 sm:w-22 bg-[#F5F5F7] border-r border-[#E5E5EA] overflow-y-auto flex-shrink-0">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`w-full px-1 sm:px-2 py-4 text-[13px] sm:text-[14px] relative transition-all cursor-pointer whitespace-nowrap press-button ${
                selectedCategory === category.id
                  ? 'text-[#1D1D1F] font-semibold bg-white'
                  : 'text-[#6E6E73] font-normal hover:bg-white/50'
              }`}
            >
              {selectedCategory === category.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#1D1D1F] rounded-r"></div>
              )}
              {category.name}
            </button>
          ))}
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1 overflow-y-auto min-w-0">
          {isLoading ? (
            <div className="p-3 sm:p-4 space-y-4">
              <div className="w-full h-40 sm:h-48 bg-[#F5F5F7] rounded-[16px] animate-pulse"></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="w-full aspect-square bg-[#F5F5F7] rounded-[16px] animate-pulse"></div>
                    <div className="h-4 bg-[#F5F5F7] rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : currentSpace ? (
            <div className="p-3 sm:p-4 space-y-4">
              {/* 空间主视觉卡 */}
              <div
                ref={coverRef}
                className="relative w-full h-40 sm:h-48 bg-[#F5F5F7] rounded-[16px] overflow-hidden border border-[#E5E5EA]"
              >
                {imageLoadStates['cover'] === 'error' ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#F5F5F7] to-[#E5E5EA]">
                    <i className="ri-image-line text-3xl sm:text-4xl text-[#C6C6C8] mb-2"></i>
                    <p className="text-[13px] sm:text-[14px] text-[#8E8E93] mb-2">
                      暂无封面
                    </p>
                    <button
                      onClick={() =>
                        handleImageRetry('cover', currentSpace.coverImage)
                      }
                      className="px-3 py-1 text-[13px] text-[#1D1D1F] border border-[#E5E5EA] rounded-full hover:bg-[#F5F5F7] transition-colors cursor-pointer whitespace-nowrap press-button"
                    >
                      重试
                    </button>
                  </div>
                ) : (
                  <>
                    {imageLoadStates['cover'] !== 'loaded' && (
                      <div className="absolute inset-0 bg-[#F5F5F7] animate-pulse"></div>
                    )}
                    <img
                      src={currentSpace.coverImage}
                      alt={currentSpace.name}
                      onLoad={() => handleImageLoad('cover')}
                      onError={() => handleImageError('cover')}
                      className={`w-full h-full object-cover object-top transition-opacity duration-500 ${
                        imageLoadStates['cover'] === 'loaded'
                          ? 'opacity-100'
                          : 'opacity-0'
                      }`}
                    />
                  </>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <h2 className="text-[20px] sm:text-[22px] font-bold text-white mb-1">
                    {currentSpace.name}
                  </h2>
                  <p className="text-[13px] sm:text-[14px] text-white/90 mb-2 sm:mb-3">
                    {currentSpace.description}
                  </p>
                  <button
                    onClick={handleViewAll}
                    className="px-4 sm:px-5 py-1.5 sm:py-2 text-[13px] sm:text-[14px] font-medium text-[#1D1D1F] bg-white/90 backdrop-blur-sm border border-white/30 rounded-[14px] hover:bg-white transition-all cursor-pointer whitespace-nowrap press-button"
                  >
                    查看全部
                  </button>
                </div>
              </div>

              {/* 细分类网格 */}
              <div>
                <h3 className="text-[15px] font-semibold text-[#1D1D1F] mb-3">
                  细分类目
                </h3>
                <div
                  ref={gridRef}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3"
                >
                  {currentSpace.subCategories.map((subCategory, index) => (
                    <button
                      key={subCategory.id}
                      onClick={() => handleSubCategoryClick(subCategory.id)}
                      className="group bg-white rounded-[16px] overflow-hidden border border-[#E5E5EA] hover:shadow-sm transition-all cursor-pointer press-button"
                      style={{
                        opacity: 0,
                        animation:
                          'fadeInUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
                        animationDelay: `${index * 100}ms`,
                      }}
                    >
                      <div className="relative w-full aspect-square bg-[#F5F5F7]">
                        {imageLoadStates[`sub-${subCategory.id}`] ===
                        'error' ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#F5F5F7] to-[#E5E5EA]">
                            <i
                              className={`${subCategory.icon} text-2xl sm:text-3xl text-[#C6C6C8] mb-1`}
                            ></i>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleImageRetry(
                                  `sub-${subCategory.id}`,
                                  subCategory.image,
                                );
                              }}
                              className="mt-1 px-2 py-0.5 text-[12px] text-[#1D1D1F] border border-[#E5E5EA] rounded-full hover:bg-[#F5F5F7] transition-colors whitespace-nowrap press-button"
                            >
                              重试
                            </button>
                          </div>
                        ) : (
                          <>
                            {imageLoadStates[`sub-${subCategory.id}`] !==
                              'loaded' && (
                              <div className="absolute inset-0 bg-[#F5F5F7] animate-pulse"></div>
                            )}
                            <img
                              src={subCategory.image}
                              alt={subCategory.name}
                              onLoad={() =>
                                handleImageLoad(`sub-${subCategory.id}`)
                              }
                              onError={() =>
                                handleImageError(`sub-${subCategory.id}`)
                              }
                              className={`w-full h-full object-cover object-top transition-all duration-500 group-hover:scale-105 ${
                                imageLoadStates[`sub-${subCategory.id}`] ===
                                'loaded'
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              }`}
                            />
                          </>
                        )}
                      </div>
                      <div className="p-2 sm:p-2.5 text-center">
                        <p className="text-[13px] sm:text-[14px] font-medium text-[#1D1D1F] group-hover:text-[#6E6E73] transition-colors">
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
              <i className="ri-inbox-line text-5xl sm:text-6xl text-[#E5E5EA] mb-4"></i>
              <p className="text-[14px] sm:text-[15px] text-[#8E8E93] mb-4">
                暂无该空间内容
              </p>
              <div className="flex gap-2">
                <button className="px-4 sm:px-5 py-2 sm:py-2.5 text-[13px] sm:text-[14px] text-[#1D1D1F] bg-white rounded-[14px] hover:bg-[#F5F5F7] transition-colors cursor-pointer whitespace-nowrap press-button border border-[#D2D2D7] active:bg-[#F5F5F7]">
                  切换类目
                </button>
                <button className="px-4 sm:px-5 py-2 sm:py-2.5 text-[13px] sm:text-[14px] text-[#1D1D1F] bg-white rounded-[14px] hover:bg-[#F5F5F7] transition-colors cursor-pointer whitespace-nowrap press-button border border-[#D2D2D7] active:bg-[#F5F5F7]">
                  联系客服
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部导航栏 */}
      <TabBar />

      {/* 以图搜索弹窗 */}
      <ImageSearchModal visible={showImageSearch} onClose={() => setShowImageSearch(false)} />
    </div>
  );
}
