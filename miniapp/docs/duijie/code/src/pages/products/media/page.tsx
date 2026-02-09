import { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

// SF001沙发媒体数据
const mediaData = {
  videos: [
    { id: 'v1', title: '真皮缝线工艺', duration: '2:15', thumbnail: 'https://readdy.ai/api/search-image?query=luxury%20leather%20sofa%20stitching%20process%20close-up%20in%20professional%20workshop%2C%20skilled%20craftsman%20hand%20sewing%20premium%20Italian%20leather%20with%20precision%2C%20warm%20workshop%20lighting%2C%20cinematic%20documentary%20style%2C%20ultra%20realistic%208k&width=400&height=300&seq=sf001-craft-v1&orientation=landscape', mediaType: 'craft', theme: ['material-leather', 'craft-stitching'], style: 'modern', space: 'showroom', sku: [], service: [] },
    { id: 'v2', title: '框架榫卯结构', duration: '3:20', thumbnail: 'https://readdy.ai/api/search-image?query=furniture%20frame%20mortise%20and%20tenon%20joint%20construction%20process%2C%20solid%20hardwood%20frame%20assembly%20in%20workshop%2C%20professional%20woodworking%20craftsmanship%2C%20warm%20lighting%2C%20documentary%20photography%20style&width=400&height=300&seq=sf001-craft-v2&orientation=landscape', mediaType: 'craft', theme: ['structure-frame', 'craft-mortise'], style: 'modern', space: 'showroom', sku: [], service: [] },
    { id: 'v3', title: '高密度海绵填充', duration: '1:45', thumbnail: 'https://readdy.ai/api/search-image?query=sofa%20cushion%20high%20density%20foam%20filling%20process%2C%20professional%20upholstery%20workshop%2C%20craftsman%20inserting%20premium%20foam%20into%20leather%20cover%2C%20clean%20industrial%20setting%2C%20documentary%20style&width=400&height=300&seq=sf001-craft-v3&orientation=landscape', mediaType: 'craft', theme: ['comfort-filling', 'structure-frame'], style: 'modern', space: 'showroom', sku: [], service: [] },
    { id: 'v4', title: '拉扣工艺详解', duration: '2:00', thumbnail: 'https://readdy.ai/api/search-image?query=leather%20sofa%20button%20tufting%20process%20close-up%2C%20skilled%20craftsman%20creating%20deep%20button%20tufts%20on%20premium%20leather%2C%20professional%20workshop%20lighting%2C%20cinematic%20documentary%20style&width=400&height=300&seq=sf001-craft-v4&orientation=landscape', mediaType: 'craft', theme: ['craft-tufting', 'material-leather'], style: 'luxury', space: 'showroom', sku: [], service: [] },
    { id: 'v5', title: '五金件安装', duration: '1:30', thumbnail: 'https://readdy.ai/api/search-image?query=furniture%20hardware%20installation%20process%2C%20brass%20and%20stainless%20steel%20legs%20being%20attached%20to%20sofa%20frame%2C%20professional%20assembly%20workshop%2C%20clean%20industrial%20photography&width=400&height=300&seq=sf001-craft-v5&orientation=landscape', mediaType: 'craft', theme: ['structure-hardware'], style: 'modern', space: 'showroom', sku: [], service: [] },
    { id: 'v6', title: '电动功能演示', duration: '1:50', thumbnail: 'https://readdy.ai/api/search-image?query=electric%20recliner%20sofa%20mechanism%20demonstration%2C%20smooth%20motorized%20footrest%20and%20headrest%20adjustment%2C%20modern%20living%20room%20setting%2C%20professional%20product%20video%20style&width=400&height=300&seq=sf001-craft-v6&orientation=landscape', mediaType: 'craft', theme: ['function-electric'], style: 'modern', space: 'living', sku: [], service: [] },
    { id: 'v7', title: '开箱与验收指南', duration: '4:30', thumbnail: 'https://readdy.ai/api/search-image?query=luxury%20furniture%20unboxing%20and%20inspection%20guide%2C%20professional%20delivery%20team%20carefully%20unpacking%20premium%20sofa%2C%20clean%20home%20entrance%20setting%2C%20instructional%20video%20style&width=400&height=300&seq=sf001-service-v1&orientation=landscape', mediaType: 'service', theme: [], style: 'modern', space: 'living', sku: [], service: ['unboxing'] },
    { id: 'v8', title: '安装步骤详解', duration: '5:15', thumbnail: 'https://readdy.ai/api/search-image?query=modular%20sofa%20assembly%20instruction%20video%2C%20professional%20installer%20connecting%20sofa%20sections%2C%20clean%20modern%20living%20room%2C%20step%20by%20step%20tutorial%20style&width=400&height=300&seq=sf001-service-v2&orientation=landscape', mediaType: 'service', theme: [], style: 'modern', space: 'living', sku: [], service: ['installation'] },
    { id: 'v9', title: '真皮保养教程', duration: '3:45', thumbnail: 'https://readdy.ai/api/search-image?query=leather%20sofa%20care%20and%20maintenance%20tutorial%2C%20professional%20cleaning%20and%20conditioning%20premium%20leather%2C%20soft%20natural%20lighting%2C%20instructional%20video%20style&width=400&height=300&seq=sf001-service-v3&orientation=landscape', mediaType: 'service', theme: ['material-leather'], style: 'modern', space: 'living', sku: [], service: ['maintenance'] },
  ],
  photos: [
    { id: 'p1', title: '浅灰真皮全景', url: 'https://readdy.ai/api/search-image?query=luxury%20light%20gray%20Italian%20leather%20sofa%20in%20minimalist%20showroom%2C%20premium%20full%20grain%20leather%20with%20natural%20texture%2C%20soft%20studio%20lighting%2C%20professional%20furniture%20photography%2C%20ultra%20realistic%208k&width=800&height=600&seq=sf001-product-p1&orientation=landscape', mediaType: 'product', theme: ['material-leather'], style: 'modern', space: 'showroom', sku: ['color-lightgray', 'material-leather'], service: [] },
    { id: 'p2', title: '深灰真皮全景', url: 'https://readdy.ai/api/search-image?query=luxury%20dark%20charcoal%20gray%20Italian%20leather%20sofa%20in%20elegant%20showroom%2C%20premium%20top%20grain%20leather%20with%20rich%20texture%2C%20professional%20studio%20lighting%2C%20high-end%20furniture%20photography&width=800&height=600&seq=sf001-product-p2&orientation=landscape', mediaType: 'product', theme: ['material-leather'], style: 'modern', space: 'showroom', sku: ['color-darkgray', 'material-leather'], service: [] },
    { id: 'p3', title: '米白科技布全景', url: 'https://readdy.ai/api/search-image?query=modern%20cream%20white%20tech%20fabric%20sofa%20in%20bright%20minimalist%20showroom%2C%20stain-resistant%20performance%20fabric%20with%20soft%20texture%2C%20clean%20studio%20lighting%2C%20professional%20furniture%20photography&width=800&height=600&seq=sf001-product-p3&orientation=landscape', mediaType: 'product', theme: ['material-fabric'], style: 'nordic', space: 'showroom', sku: ['color-cream', 'material-techfabric'], service: [] },
    { id: 'p4', title: '棉麻混纺款', url: 'https://readdy.ai/api/search-image?query=natural%20linen%20cotton%20blend%20sofa%20in%20warm%20scandinavian%20interior%2C%20breathable%20fabric%20with%20organic%20texture%2C%20soft%20natural%20lighting%2C%20lifestyle%20furniture%20photography&width=800&height=600&seq=sf001-product-p4&orientation=landscape', mediaType: 'product', theme: ['material-fabric'], style: 'nordic', space: 'living', sku: ['material-linen'], service: [] },
    { id: 'p5', title: '皮革纹理特写', url: 'https://readdy.ai/api/search-image?query=extreme%20close-up%20of%20premium%20Italian%20leather%20texture%20showing%20natural%20grain%20and%20pores%2C%20luxury%20sofa%20material%20detail%2C%20macro%20photography%20with%20soft%20side%20lighting%2C%20ultra%20realistic%208k&width=800&height=600&seq=sf001-detail-p1&orientation=landscape', mediaType: 'detail', theme: ['material-leather', 'craft-stitching'], style: 'luxury', space: 'showroom', sku: ['material-leather'], service: [] },
    { id: 'p6', title: '缝线工艺特写', url: 'https://readdy.ai/api/search-image?query=close-up%20of%20premium%20leather%20sofa%20stitching%20detail%2C%20precise%20double%20needle%20seams%20on%20Italian%20leather%2C%20professional%20macro%20photography%20showing%20craftsmanship%20quality&width=800&height=600&seq=sf001-detail-p2&orientation=landscape', mediaType: 'detail', theme: ['craft-stitching', 'material-leather'], style: 'luxury', space: 'showroom', sku: [], service: [] },
    { id: 'p7', title: '拉扣细节', url: 'https://readdy.ai/api/search-image?query=leather%20sofa%20button%20tufting%20detail%20close-up%2C%20deep%20diamond%20tufts%20with%20premium%20leather%2C%20professional%20macro%20photography%20with%20soft%20lighting&width=800&height=600&seq=sf001-detail-p3&orientation=landscape', mediaType: 'detail', theme: ['craft-tufting'], style: 'luxury', space: 'showroom', sku: [], service: [] },
    { id: 'p8', title: '黄铜脚细节', url: 'https://readdy.ai/api/search-image?query=luxury%20sofa%20brass%20leg%20detail%20close-up%2C%20polished%20gold%20brass%20furniture%20feet%20on%20hardwood%20floor%2C%20professional%20product%20photography%20with%20elegant%20lighting&width=800&height=600&seq=sf001-detail-p4&orientation=landscape', mediaType: 'detail', theme: ['structure-hardware', 'material-metal'], style: 'luxury', space: 'showroom', sku: [], service: [] },
    { id: 'p9', title: '坐垫填充剖面', url: 'https://readdy.ai/api/search-image?query=sofa%20cushion%20cross-section%20showing%20high%20density%20foam%20layers%20and%20down%20feather%20top%2C%20furniture%20construction%20detail%2C%20professional%20product%20photography&width=800&height=600&seq=sf001-detail-p5&orientation=landscape', mediaType: 'detail', theme: ['comfort-filling', 'structure-frame'], style: 'modern', space: 'showroom', sku: [], service: [] },
    { id: 'p10', title: '现代客厅场景', url: 'https://readdy.ai/api/search-image?query=luxury%20gray%20leather%20sofa%20in%20modern%20minimalist%20living%20room%2C%20floor%20to%20ceiling%20windows%20with%20city%20view%2C%20marble%20coffee%20table%2C%20professional%20interior%20photography%2C%20cinematic%20lighting&width=800&height=600&seq=sf001-scene-p1&orientation=landscape', mediaType: 'scene', theme: ['atmosphere-lighting'], style: 'modern', space: 'living', sku: ['color-lightgray'], service: [] },
    { id: 'p11', title: '北欧风客厅', url: 'https://readdy.ai/api/search-image?query=cream%20fabric%20sofa%20in%20bright%20scandinavian%20living%20room%2C%20wooden%20floors%20and%20white%20walls%2C%20natural%20daylight%2C%20cozy%20hygge%20atmosphere%2C%20professional%20interior%20photography&width=800&height=600&seq=sf001-scene-p2&orientation=landscape', mediaType: 'scene', theme: ['atmosphere-color'], style: 'nordic', space: 'living', sku: ['color-cream', 'material-techfabric'], service: [] },
    { id: 'p12', title: '侘寂风空间', url: 'https://readdy.ai/api/search-image?query=minimalist%20wabi-sabi%20living%20room%20with%20natural%20linen%20sofa%2C%20raw%20concrete%20walls%2C%20organic%20textures%2C%20soft%20diffused%20lighting%2C%20zen%20aesthetic%20interior%20photography&width=800&height=600&seq=sf001-scene-p3&orientation=landscape', mediaType: 'scene', theme: ['atmosphere-lighting'], style: 'wabisabi', space: 'living', sku: ['material-linen'], service: [] },
    { id: 'p13', title: '轻奢展厅陈列', url: 'https://readdy.ai/api/search-image?query=luxury%20dark%20leather%20sofa%20in%20high-end%20furniture%20showroom%2C%20brass%20accents%20and%20marble%20surfaces%2C%20dramatic%20spotlight%20lighting%2C%20museum-like%20display%2C%20professional%20commercial%20photography&width=800&height=600&seq=sf001-scene-p4&orientation=landscape', mediaType: 'scene', theme: ['atmosphere-lighting'], style: 'luxury', space: 'showroom', sku: ['color-darkgray', 'material-leather'], service: [] },
    { id: 'p14', title: '书房搭配方案', url: 'https://readdy.ai/api/search-image?query=compact%20leather%20sofa%20in%20elegant%20home%20office%20study%2C%20walnut%20bookshelves%20and%20brass%20desk%20lamp%2C%20warm%20ambient%20lighting%2C%20sophisticated%20interior%20photography&width=800&height=600&seq=sf001-scene-p5&orientation=landscape', mediaType: 'scene', theme: ['atmosphere-lighting'], style: 'modern', space: 'study', sku: ['size-2seat'], service: [] },
    { id: 'p15', title: '三视图尺寸标注', url: 'https://readdy.ai/api/search-image?query=technical%20furniture%20drawing%20with%20three%20view%20orthographic%20projection%2C%20sofa%20dimensions%20and%20measurements%20annotated%2C%20clean%20CAD%20style%20illustration%20on%20white%20background%2C%20professional%20technical%20diagram&width=800&height=600&seq=sf001-drawing-p1&orientation=landscape', mediaType: 'drawing', theme: [], style: 'modern', space: 'showroom', sku: ['size-3seat'], service: [] },
    { id: 'p16', title: '模块组合图', url: 'https://readdy.ai/api/search-image?query=modular%20sofa%20configuration%20diagram%20showing%20different%20arrangement%20options%2C%20technical%20illustration%20with%20measurements%2C%20clean%20professional%20CAD%20style%20drawing&width=800&height=600&seq=sf001-drawing-p2&orientation=landscape', mediaType: 'drawing', theme: ['function-modular'], style: 'modern', space: 'showroom', sku: ['size-chaise', 'size-ottoman'], service: [] },
    { id: 'p17', title: '结构爆炸图', url: 'https://readdy.ai/api/search-image?query=sofa%20exploded%20view%20technical%20illustration%20showing%20internal%20frame%20structure%20springs%20and%20cushion%20layers%2C%20professional%20furniture%20construction%20diagram%2C%20clean%20white%20background&width=800&height=600&seq=sf001-drawing-p3&orientation=landscape', mediaType: 'drawing', theme: ['structure-frame', 'structure-spring'], style: 'modern', space: 'showroom', sku: [], service: [] },
    { id: 'p18', title: '3D渲染-浅灰', url: 'https://readdy.ai/api/search-image?query=photorealistic%203D%20render%20of%20light%20gray%20leather%20sofa%20on%20white%20background%2C%20high%20quality%20CGI%20furniture%20visualization%2C%20studio%20lighting%2C%20product%20rendering&width=800&height=600&seq=sf001-3d-p1&orientation=landscape', mediaType: '3d', theme: [], style: 'modern', space: 'showroom', sku: ['color-lightgray', 'material-leather'], service: [] },
    { id: 'p19', title: '3D渲染-深灰', url: 'https://readdy.ai/api/search-image?query=photorealistic%203D%20render%20of%20dark%20charcoal%20leather%20sofa%20on%20white%20background%2C%20high%20quality%20CGI%20furniture%20visualization%2C%20professional%20studio%20lighting&width=800&height=600&seq=sf001-3d-p2&orientation=landscape', mediaType: '3d', theme: [], style: 'modern', space: 'showroom', sku: ['color-darkgray', 'material-leather'], service: [] },
    { id: 'p20', title: '3D渲染-米白布艺', url: 'https://readdy.ai/api/search-image?query=photorealistic%203D%20render%20of%20cream%20white%20fabric%20sofa%20on%20white%20background%2C%20high%20quality%20CGI%20furniture%20visualization%20with%20soft%20fabric%20texture%2C%20studio%20lighting&width=800&height=600&seq=sf001-3d-p3&orientation=landscape', mediaType: '3d', theme: [], style: 'nordic', space: 'showroom', sku: ['color-cream', 'material-techfabric'], service: [] },
  ]
};

// 筛选配置
const filterConfig = {
  mediaType: {
    label: '媒体类型',
    options: [
      { id: 'craft', label: '工艺视频', icon: 'ri-video-line' },
      { id: 'detail', label: '细节特写', icon: 'ri-focus-3-line' },
      { id: 'scene', label: '空间实拍', icon: 'ri-home-smile-line' },
      { id: 'drawing', label: '尺寸图纸', icon: 'ri-ruler-line' },
      { id: '3d', label: '3D模型', icon: 'ri-box-3-line' },
      { id: 'service', label: '安装&保养', icon: 'ri-tools-line' },
    ]
  },
  theme: {
    label: '内容主题',
    groups: [
      {
        label: '材质',
        options: [
          { id: 'material-leather', label: '真皮' },
          { id: 'material-fabric', label: '布艺' },
          { id: 'material-wood', label: '木材' },
          { id: 'material-metal', label: '金属' },
          { id: 'material-stone', label: '石材' },
        ]
      },
      {
        label: '舒适',
        options: [
          { id: 'comfort-seat', label: '坐感' },
          { id: 'comfort-back', label: '靠背' },
          { id: 'comfort-filling', label: '填充' },
        ]
      },
      {
        label: '结构',
        options: [
          { id: 'structure-frame', label: '框架' },
          { id: 'structure-spring', label: '弹簧' },
          { id: 'structure-hardware', label: '五金' },
        ]
      },
      {
        label: '工艺',
        options: [
          { id: 'craft-stitching', label: '缝线' },
          { id: 'craft-edging', label: '包边' },
          { id: 'craft-mortise', label: '榫卯' },
          { id: 'craft-tufting', label: '拉扣' },
        ]
      },
      {
        label: '功能',
        options: [
          { id: 'function-removable', label: '可拆洗' },
          { id: 'function-modular', label: '模块' },
          { id: 'function-storage', label: '储物' },
          { id: 'function-electric', label: '电动' },
        ]
      },
      {
        label: '氛围',
        options: [
          { id: 'atmosphere-lighting', label: '灯光' },
          { id: 'atmosphere-color', label: '配色' },
        ]
      },
    ]
  },
  style: {
    label: '风格',
    options: [
      { id: 'modern', label: '现代极简' },
      { id: 'nordic', label: '北欧' },
      { id: 'wabisabi', label: '侘寂' },
      { id: 'luxury', label: '轻奢' },
    ]
  },
  space: {
    label: '空间',
    options: [
      { id: 'living', label: '客厅' },
      { id: 'bedroom', label: '卧室' },
      { id: 'study', label: '书房' },
      { id: 'showroom', label: '展厅' },
    ]
  },
  sku: {
    label: '规格SKU',
    groups: [
      {
        label: '颜色',
        options: [
          { id: 'color-lightgray', label: '浅灰' },
          { id: 'color-darkgray', label: '深灰' },
          { id: 'color-cream', label: '米白' },
          { id: 'color-brown', label: '焦糖棕' },
        ]
      },
      {
        label: '面料',
        options: [
          { id: 'material-leather', label: '真皮' },
          { id: 'material-techfabric', label: '科技布' },
          { id: 'material-linen', label: '棉麻' },
          { id: 'material-velvet', label: '丝绒' },
        ]
      },
      {
        label: '尺寸',
        options: [
          { id: 'size-2seat', label: '双人位' },
          { id: 'size-3seat', label: '三人位' },
          { id: 'size-4seat', label: '四人位' },
          { id: 'size-chaise', label: '贵妃位' },
          { id: 'size-ottoman', label: '脚凳' },
        ]
      },
    ]
  },
  service: {
    label: '交付与服务',
    options: [
      { id: 'delivery', label: '交期' },
      { id: 'unboxing', label: '包装开箱' },
      { id: 'installation', label: '安装步骤' },
      { id: 'warranty', label: '质保说明' },
      { id: 'maintenance', label: '清洁保养' },
    ]
  }
};

type MediaType = 'all' | 'video' | 'photo' | 'detail' | 'drawing' | '3d';

const topTabs: { id: MediaType; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'video', label: '视频' },
  { id: 'photo', label: '图片' },
  { id: 'detail', label: '细节' },
  { id: 'drawing', label: '图纸' },
  { id: '3d', label: '3D' },
];

interface FilterState {
  mediaType: string[];
  theme: string[];
  style: string[];
  space: string[];
  sku: string[];
  service: string[];
}

export default function ProductMediaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MediaType>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'relevant' | 'video-first'>('latest');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    mediaType: [],
    theme: [],
    style: [],
    space: [],
    sku: [],
    service: [],
  });
  const [expandedSections, setExpandedSections] = useState<string[]>(['mediaType', 'theme']);

  // 合并所有媒体
  const allMedia = useMemo(() => [
    ...mediaData.videos.map(v => ({ ...v, type: 'video' as const, url: v.thumbnail })),
    ...mediaData.photos.map(p => ({
      ...p,
      type: 'photo' as const,
      duration: undefined,
      thumbnail: undefined
    }))
  ], []);

  // 根据筛选条件过滤媒体
  const filteredMedia = useMemo(() => {
    let result = allMedia;

    // 顶部tab筛选
    if (activeTab !== 'all') {
      if (activeTab === 'video') {
        result = result.filter(m => m.type === 'video');
      } else if (activeTab === 'photo') {
        result = result.filter(m => m.type === 'photo' && ['product', 'scene'].includes(m.mediaType));
      } else if (activeTab === 'detail') {
        result = result.filter(m => m.mediaType === 'detail');
      } else if (activeTab === 'drawing') {
        result = result.filter(m => m.mediaType === 'drawing');
      } else if (activeTab === '3d') {
        result = result.filter(m => m.mediaType === '3d');
      }
    }

    // 左侧筛选
    if (filters.mediaType.length > 0) {
      result = result.filter(m => filters.mediaType.includes(m.mediaType));
    }
    if (filters.theme.length > 0) {
      result = result.filter(m => m.theme.some(t => filters.theme.includes(t)));
    }
    if (filters.style.length > 0) {
      result = result.filter(m => filters.style.includes(m.style));
    }
    if (filters.space.length > 0) {
      result = result.filter(m => filters.space.includes(m.space));
    }
    if (filters.sku.length > 0) {
      result = result.filter(m => m.sku.some(s => filters.sku.includes(s)));
    }
    if (filters.service.length > 0) {
      result = result.filter(m => m.service.some(s => filters.service.includes(s)));
    }

    return result;
  }, [allMedia, activeTab, filters]);

  // 已选筛选条件
  const selectedFilters = useMemo(() => {
    const chips: { key: string; category: string; label: string }[] = [];

    const findLabel = (id: string) => {
      for (const data of Object.values(filterConfig)) {
        if ('options' in data) {
          const opt = data.options.find(o => o.id === id);
          if (opt) return { category: data.label, label: opt.label };
        }
        if ('groups' in data) {
          for (const group of data.groups) {
            const opt = group.options.find(o => o.id === id);
            if (opt) return { category: group.label, label: opt.label };
          }
        }
      }
      return null;
    };

    Object.entries(filters).forEach(([category, values]) => {
      values.forEach(value => {
        const found = findLabel(value);
        if (found) {
          chips.push({ key: `${category}-${value}`, category, label: found.label });
        }
      });
    });

    return chips;
  }, [filters]);

  const toggleFilter = (category: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value]
    }));
  };

  const removeFilter = (category: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [category as keyof FilterState]: prev[category as keyof FilterState].filter(v => v !== value)
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      mediaType: [],
      theme: [],
      style: [],
      space: [],
      sku: [],
      service: [],
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleMediaClick = (index: number) => {
    navigate(`/products/media/${id}/viewer`, {
      state: {
        mediaList: filteredMedia,
        currentIndex: index,
        activeTab
      }
    });
  };

  // 渲染筛选选项
  const renderFilterOption = (
    option: { id: string; label: string; icon?: string },
    category: keyof FilterState,
    isSelected: boolean
  ) => (
    <button
      key={option.id}
      onClick={() => toggleFilter(category, option.id)}
      className={`
        group flex items-center gap-2 px-3 py-2 rounded-[10px] text-[13px] font-medium
        transition-all duration-[180ms] cubic-bezier(0.2,0.8,0.2,1) cursor-pointer
        ${isSelected
          ? 'bg-[#1D1D1F] text-white'
          : 'bg-white text-[#1D1D1F] hover:bg-[#F5F5F7]'}
        active:scale-[0.985]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-2
      `}
    >
      {option.icon && <i className={`${option.icon} text-[14px]`}></i>}
      <span className="whitespace-nowrap">{option.label}</span>
      {isSelected && <i className="ri-check-line text-[14px]"></i>}
    </button>
  );

  // 已选筛选条件数量
  const filterCount = useMemo(() => {
    return Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);
  }, [filters]);

  // 排序媒体
  const sortedMedia = useMemo(() => {
    let result = [...filteredMedia];
    
    if (sortBy === 'latest') {
      // 保持原顺序（假设已按最新排序）
    } else if (sortBy === 'relevant') {
      // 按匹配度排序（有更多标签匹配的排前面）
      result.sort((a, b) => {
        const aMatches = [...a.theme, ...a.sku, ...a.service].filter(tag => 
          [...filters.theme, ...filters.sku, ...filters.service].includes(tag)
        ).length;
        const bMatches = [...b.theme, ...b.sku, ...b.service].filter(tag => 
          [...filters.theme, ...filters.sku, ...filters.service].includes(tag)
        ).length;
        return bMatches - aMatches;
      });
    } else if (sortBy === 'video-first') {
      result.sort((a, b) => {
        if (a.type === 'video' && b.type !== 'video') return -1;
        if (a.type !== 'video' && b.type === 'video') return 1;
        return 0;
      });
    }
    
    return result;
  }, [filteredMedia, sortBy]);

  const applyFilters = () => {
    setIsFilterDrawerOpen(false);
  };

  const cancelFilters = () => {
    setIsFilterDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-white pb-[env(safe-area-inset-bottom)]">
      {/* 顶部导航栏 - Sticky */}
      <div
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#EAEAEC]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* 标题栏 */}
        <div className="h-[52px] flex items-center justify-between px-4 max-w-[1440px] mx-auto">
          <Link
            to={`/products/detail/${id}`}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F6F6F7] cursor-pointer transition-colors duration-[160ms] active:scale-[0.97]"
          >
            <i className="ri-arrow-left-line text-[20px] text-[#1D1D1F]"></i>
          </Link>
          <h1 className="text-[17px] font-semibold text-[#1D1D1F]">SF001 媒体资料库</h1>
          <div className="w-9"></div>
        </div>

        {/* 二级Tab横滑 + 工具栏 */}
        <div className="px-4 py-3 flex items-center gap-3 overflow-x-auto scrollbar-hide">
          {/* Tab横滑区域 */}
          <div className="flex items-center gap-1 bg-[#F6F6F7] p-1 rounded-full flex-shrink-0">
            {topTabs.map(tab => {
              const count =
                tab.id === 'all'
                  ? allMedia.length
                  : tab.id === 'video'
                    ? allMedia.filter(m => m.type === 'video').length
                    : tab.id === 'photo'
                      ? allMedia.filter(m => m.type === 'photo' && ['product', 'scene'].includes(m.mediaType)).length
                      : tab.id === 'detail'
                        ? allMedia.filter(m => m.mediaType === 'detail').length
                        : tab.id === 'drawing'
                          ? allMedia.filter(m => m.mediaType === 'drawing').length
                          : allMedia.filter(m => m.mediaType === '3d').length;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap cursor-pointer
                    transition-all duration-[180ms] cubic-bezier(0.2,0.8,0.2,1)
                    active:scale-[0.985]
                    ${activeTab === tab.id
                      ? 'bg-white text-[#1D1D1F] shadow-sm'
                      : 'text-[#6E6E73]'}
                  `}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 工具按钮组 */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            {/* 筛选按钮 */}
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className="
                relative flex items-center gap-1.5 px-3 py-1.5 bg-[#F6F6F7] rounded-full
                text-[13px] font-medium text-[#1D1D1F] whitespace-nowrap cursor-pointer
                hover:bg-[#EAEAEC] transition-all duration-[160ms]
                active:scale-[0.985]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-1
              "
            >
              <i className="ri-filter-3-line text-[14px]"></i>
              <span>筛选</span>
              {filterCount > 0 && (
                <span className="ml-0.5 text-[#0071E3]">·{filterCount}</span>
              )}
            </button>

            {/* 排序按钮 */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="
                  appearance-none pl-3 pr-7 py-1.5 bg-[#F6F6F7] rounded-full
                  text-[13px] font-medium text-[#1D1D1F] cursor-pointer
                  hover:bg-[#EAEAEC] transition-all duration-[160ms]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-1
                  active:scale-[0.985]
                "
              >
                <option value="latest">最新</option>
                <option value="relevant">最相关</option>
                <option value="video-first">视频优先</option>
              </select>
              <i className="ri-arrow-down-s-line text-[14px] text-[#6E6E73] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            </div>

            {/* 结果数 */}
            <span className="text-[12px] text-[#6E6E73] whitespace-nowrap">
              共{sortedMedia.length}项
            </span>
          </div>
        </div>

        {/* 已选筛选条件 Chips */}
        {selectedFilters.length > 0 && (
          <div className="px-4 pb-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {selectedFilters.map(chip => (
              <button
                key={chip.key}
                onClick={() => {
                  const [category, ...rest] = chip.key.split('-');
                  const value = rest.join('-');
                  removeFilter(category, value);
                }}
                className="
                  flex items-center gap-1.5 px-3 py-1.5 bg-[#F6F6F7] rounded-full
                  text-[12px] text-[#1D1D1F] font-medium cursor-pointer flex-shrink-0
                  hover:bg-[#EAEAEC] transition-colors duration-[160ms]
                  active:scale-[0.97]
                "
              >
                {chip.label}
                <i className="ri-close-line text-[14px] text-[#6E6E73]"></i>
              </button>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-[12px] text-[#0071E3] font-medium cursor-pointer whitespace-nowrap flex-shrink-0 px-2"
            >
              清空
            </button>
          </div>
        )}
      </div>

      {/* 主内容区 - 响应式布局 */}
      <div 
        className="pt-[calc(52px+env(safe-area-inset-top))] max-w-[1440px] mx-auto"
        style={{
          paddingTop: selectedFilters.length > 0 
            ? 'calc(52px + 48px + 48px + env(safe-area-inset-top))' 
            : 'calc(52px + 48px + env(safe-area-inset-top))'
        }}
      >
        {/* 桌面端：双栏布局 */}
        <div className="hidden lg:flex">
          {/* 左侧筛选栏 - 桌面端常驻 */}
          <aside
            className="w-[280px] flex-shrink-0 border-r border-[#EAEAEC] h-[calc(100vh-100px-env(safe-area-inset-top))] overflow-y-auto sticky top-[calc(100px+env(safe-area-inset-top))]"
          >
            <div className="p-5 space-y-6">
              {/* 媒体类型 */}
              <div>
                <button
                  onClick={() => toggleSection('mediaType')}
                  className="w-full flex items-center justify-between py-2 cursor-pointer group"
                >
                  <span className="text-[13px] font-semibold text-[#1D1D1F] uppercase tracking-wide">
                    {filterConfig.mediaType.label}
                  </span>
                  <i className={`ri-arrow-${expandedSections.includes('mediaType') ? 'up' : 'down'}-s-line text-[18px] text-[#6E6E73] group-hover:text-[#1D1D1F] transition-colors`}></i>
                </button>
                {expandedSections.includes('mediaType') && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {filterConfig.mediaType.options.map(opt =>
                      renderFilterOption(opt, 'mediaType', filters.mediaType.includes(opt.id))
                    )}
                  </div>
                )}
              </div>

              <div className="h-px bg-[#EAEAEC]"></div>

              {/* 内容主题 */}
              <div>
                <button
                  onClick={() => toggleSection('theme')}
                  className="w-full flex items-center justify-between py-2 cursor-pointer group"
                >
                  <span className="text-[13px] font-semibold text-[#1D1D1F] uppercase tracking-wide">
                    {filterConfig.theme.label}
                  </span>
                  <i className={`ri-arrow-${expandedSections.includes('theme') ? 'up' : 'down'}-s-line text-[18px] text-[#6E6E73] group-hover:text-[#1D1D1F] transition-colors`}></i>
                </button>
                {expandedSections.includes('theme') && (
                  <div className="mt-3 space-y-4">
                    {filterConfig.theme.groups.map(group => (
                      <div key={group.label}>
                        <p className="text-[12px] text-[#6E6E73] mb-2">{group.label}</p>
                        <div className="flex flex-wrap gap-2">
                          {group.options.map(opt =>
                            renderFilterOption(opt, 'theme', filters.theme.includes(opt.id))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-px bg-[#EAEAEC]"></div>

              {/* 风格 / 空间 */}
              <div>
                <button
                  onClick={() => toggleSection('styleSpace')}
                  className="w-full flex items-center justify-between py-2 cursor-pointer group"
                >
                  <span className="text-[13px] font-semibold text-[#1D1D1F] uppercase tracking-wide">
                    风格 / 空间
                  </span>
                  <i className={`ri-arrow-${expandedSections.includes('styleSpace') ? 'up' : 'down'}-s-line text-[18px] text-[#6E6E73] group-hover:text-[#1D1D1F] transition-colors`}></i>
                </button>
                {expandedSections.includes('styleSpace') && (
                  <div className="mt-3 space-y-4">
                    <div>
                      <p className="text-[12px] text-[#6E6E73] mb-2">风格</p>
                      <div className="flex flex-wrap gap-2">
                        {filterConfig.style.options.map(opt =>
                          renderFilterOption(opt, 'style', filters.style.includes(opt.id))
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[12px] text-[#6E6E73] mb-2">空间</p>
                      <div className="flex flex-wrap gap-2">
                        {filterConfig.space.options.map(opt =>
                          renderFilterOption(opt, 'space', filters.space.includes(opt.id))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="h-px bg-[#EAEAEC]"></div>

              {/* 规格SKU */}
              <div>
                <button
                  onClick={() => toggleSection('sku')}
                  className="w-full flex items-center justify-between py-2 cursor-pointer group"
                >
                  <span className="text-[13px] font-semibold text-[#1D1D1F] uppercase tracking-wide">
                    {filterConfig.sku.label}
                  </span>
                  <i className={`ri-arrow-${expandedSections.includes('sku') ? 'up' : 'down'}-s-line text-[18px] text-[#6E6E73] group-hover:text-[#1D1D1F] transition-colors`}></i>
                </button>
                {expandedSections.includes('sku') && (
                  <div className="mt-3 space-y-4">
                    {filterConfig.sku.groups.map(group => (
                      <div key={group.label}>
                        <p className="text-[12px] text-[#6E6E73] mb-2">{group.label}</p>
                        <div className="flex flex-wrap gap-2">
                          {group.options.map(opt =>
                            renderFilterOption(opt, 'sku', filters.sku.includes(opt.id))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-px bg-[#EAEAEC]"></div>

              {/* 交付与服务 */}
              <div>
                <button
                  onClick={() => toggleSection('service')}
                  className="w-full flex items-center justify-between py-2 cursor-pointer group"
                >
                  <span className="text-[13px] font-semibold text-[#1D1D1F] uppercase tracking-wide">
                    {filterConfig.service.label}
                  </span>
                  <i className={`ri-arrow-${expandedSections.includes('service') ? 'up' : 'down'}-s-line text-[18px] text-[#6E6E73] group-hover:text-[#1D1D1F] transition-colors`}></i>
                </button>
                {expandedSections.includes('service') && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {filterConfig.service.options.map(opt =>
                      renderFilterOption(opt, 'service', filters.service.includes(opt.id))
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* 右侧内容区 - 桌面端 */}
          <main className="flex-1 min-w-0">
            <div className="p-6">
              {sortedMedia.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {sortedMedia.map((item, index) => (
                      <button
                        key={item.id}
                        onClick={() => handleMediaClick(index)}
                        className="
                          group relative aspect-[4/3] rounded-[14px] overflow-hidden cursor-pointer
                          bg-[#F6F6F7]
                          transition-all duration-[200ms] cubic-bezier(0.2,0.8,0.2,1)
                          hover:-translate-y-[2px] hover:shadow-lg
                          active:scale-[0.985]
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-2
                        "
                      >
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-[300ms] group-hover:scale-[1.02]"
                        />

                        {/* 渐变遮罩 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-[200ms]"></div>

                        {/* 视频播放按钮 */}
                        {item.type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg transition-transform duration-[200ms] group-hover:scale-110">
                              <i className="ri-play-fill text-[24px] text-[#1D1D1F] ml-0.5"></i>
                            </div>
                          </div>
                        )}

                        {/* 时长标签 */}
                        {item.duration && (
                          <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md text-[11px] text-white font-medium">
                            {item.duration}
                          </div>
                        )}

                        {/* 类型标签 */}
                        <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-md text-[11px] text-[#1D1D1F] font-medium">
                          {item.mediaType === 'craft' && '工艺'}
                          {item.mediaType === 'product' && '实拍'}
                          {item.mediaType === 'detail' && '细节'}
                          {item.mediaType === 'scene' && '场景'}
                          {item.mediaType === 'drawing' && '图纸'}
                          {item.mediaType === '3d' && '3D'}
                          {item.mediaType === 'service' && '服务'}
                        </div>

                        {/* 标题 */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-[200ms]">
                          <p className="text-[13px] text-white font-medium truncate">{item.title}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* 底部统计 */}
                  <div className="mt-8 text-center">
                    <p className="text-[13px] text-[#6E6E73]">
                      共 {sortedMedia.length} 项媒体资料
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 flex items-center justify-center bg-[#F6F6F7] rounded-full mb-4">
                    <i className="ri-image-line text-[28px] text-[#C6C6C8]"></i>
                  </div>
                  <p className="text-[15px] text-[#6E6E73] mb-2">暂无匹配的媒体资料</p>
                  <button
                    onClick={clearAllFilters}
                    className="text-[14px] text-[#0071E3] font-medium cursor-pointer hover:underline"
                  >
                    清除筛选条件
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* 移动端：单栏布局 */}
        <div className="lg:hidden">
          <div className="px-4 py-4">
            {sortedMedia.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {sortedMedia.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => handleMediaClick(index)}
                      className="
                        group relative aspect-[4/3] rounded-[14px] overflow-hidden cursor-pointer
                        bg-[#F6F6F7]
                        transition-all duration-[200ms] cubic-bezier(0.2,0.8,0.2,1)
                        active:scale-[0.985]
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-2
                      "
                    >
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />

                      {/* 视频播放按钮 */}
                      {item.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
                            <i className="ri-play-fill text-[20px] text-[#1D1D1F] ml-0.5"></i>
                          </div>
                        </div>
                      )}

                      {/* 时长标签 */}
                      {item.duration && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] text-white font-medium">
                          {item.duration}
                        </div>
                      )}

                      {/* 类型标签 */}
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded text-[10px] text-[#1D1D1F] font-medium">
                        {item.mediaType === 'craft' && '工艺'}
                        {item.mediaType === 'product' && '实拍'}
                        {item.mediaType === 'detail' && '细节'}
                        {item.mediaType === 'scene' && '场景'}
                        {item.mediaType === 'drawing' && '图纸'}
                        {item.mediaType === '3d' && '3D'}
                        {item.mediaType === 'service' && '服务'}
                      </div>
                    </button>
                  ))}
                </div>

                {/* 底部统计 */}
                <div className="mt-6 text-center">
                  <p className="text-[13px] text-[#6E6E73]">
                    共 {sortedMedia.length} 项媒体资料
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 flex items-center justify-center bg-[#F6F6F7] rounded-full mb-4">
                  <i className="ri-image-line text-[28px] text-[#C6C6C8]"></i>
                </div>
                <p className="text-[15px] text-[#6E6E73] mb-2">暂无匹配的媒体资料</p>
                <button
                  onClick={clearAllFilters}
                  className="text-[14px] text-[#0071E3] font-medium cursor-pointer hover:underline"
                >
                  清除筛选条件
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 筛选抽屉 - Bottom Sheet (移动端) */}
      {isFilterDrawerOpen && (
        <>
          {/* 遮罩 */}
          <div
            className="fixed inset-0 bg-black/40 z-[60] lg:hidden"
            style={{ 
              animation: 'fadeIn 220ms cubic-bezier(0.2,0.8,0.2,1)',
              paddingTop: 'env(safe-area-inset-top)'
            }}
            onClick={cancelFilters}
          ></div>

          {/* 抽屉内容 */}
          <div
            className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-[20px] shadow-2xl lg:hidden"
            style={{
              height: '80vh',
              maxHeight: '85vh',
              animation: 'slideUp 220ms cubic-bezier(0.2,0.8,0.2,1)',
              paddingBottom: 'env(safe-area-inset-bottom)'
            }}
          >
            {/* 抽屉头部 */}
            <div className="sticky top-0 z-10 bg-white border-b border-[#EAEAEC] rounded-t-[20px]">
              {/* 拖动指示器 */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-[#C6C6C8] rounded-full"></div>
              </div>

              <div className="flex items-center justify-between px-4 pb-3">
                <h2 className="text-[17px] font-semibold text-[#1D1D1F]">筛选</h2>
                <div className="flex items-center gap-2">
                  {filterCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-[14px] text-[#0071E3] font-medium cursor-pointer"
                    >
                      清空
                    </button>
                  )}
                  <button
                    onClick={cancelFilters}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F6F6F7] cursor-pointer transition-colors"
                  >
                    <i className="ri-close-line text-[20px] text-[#1D1D1F]"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* 抽屉内容区 - 独立滚动 */}
            <div className="overflow-y-auto" style={{ height: 'calc(80vh - 120px)' }}>
              <div className="p-4 space-y-4">
                {/* 媒体类型 */}
                <div className="bg-[#F6F6F7] rounded-[12px] p-4">
                  <button
                    onClick={() => toggleSection('mediaType')}
                    className="w-full flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-[15px] font-semibold text-[#1D1D1F]">
                      {filterConfig.mediaType.label}
                    </span>
                    <i className={`ri-arrow-${expandedSections.includes('mediaType') ? 'up' : 'down'}-s-line text-[20px] text-[#6E6E73]`}></i>
                  </button>
                  {expandedSections.includes('mediaType') && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {filterConfig.mediaType.options.map(opt =>
                        renderFilterOption(opt, 'mediaType', filters.mediaType.includes(opt.id))
                      )}
                    </div>
                  )}
                </div>

                {/* 内容主题 */}
                <div className="bg-[#F6F6F7] rounded-[12px] p-4">
                  <button
                    onClick={() => toggleSection('theme')}
                    className="w-full flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-[15px] font-semibold text-[#1D1D1F]">
                      {filterConfig.theme.label}
                    </span>
                    <i className={`ri-arrow-${expandedSections.includes('theme') ? 'up' : 'down'}-s-line text-[20px] text-[#6E6E73]`}></i>
                  </button>
                  {expandedSections.includes('theme') && (
                    <div className="mt-3 space-y-3">
                      {filterConfig.theme.groups.map(group => (
                        <div key={group.label}>
                          <p className="text-[13px] text-[#6E6E73] mb-2 font-medium">{group.label}</p>
                          <div className="flex flex-wrap gap-2">
                            {group.options.map(opt =>
                              renderFilterOption(opt, 'theme', filters.theme.includes(opt.id))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 风格 / 空间 */}
                <div className="bg-[#F6F6F7] rounded-[12px] p-4">
                  <button
                    onClick={() => toggleSection('styleSpace')}
                    className="w-full flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-[15px] font-semibold text-[#1D1D1F]">
                      风格 / 空间
                    </span>
                    <i className={`ri-arrow-${expandedSections.includes('styleSpace') ? 'up' : 'down'}-s-line text-[20px] text-[#6E6E73]`}></i>
                  </button>
                  {expandedSections.includes('styleSpace') && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="text-[13px] text-[#6E6E73] mb-2 font-medium">风格</p>
                        <div className="flex flex-wrap gap-2">
                          {filterConfig.style.options.map(opt =>
                            renderFilterOption(opt, 'style', filters.style.includes(opt.id))
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-[13px] text-[#6E6E73] mb-2 font-medium">空间</p>
                        <div className="flex flex-wrap gap-2">
                          {filterConfig.space.options.map(opt =>
                            renderFilterOption(opt, 'space', filters.space.includes(opt.id))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 规格SKU */}
                <div className="bg-[#F6F6F7] rounded-[12px] p-4">
                  <button
                    onClick={() => toggleSection('sku')}
                    className="w-full flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-[15px] font-semibold text-[#1D1D1F]">
                      {filterConfig.sku.label}
                    </span>
                    <i className={`ri-arrow-${expandedSections.includes('sku') ? 'up' : 'down'}-s-line text-[20px] text-[#6E6E73]`}></i>
                  </button>
                  {expandedSections.includes('sku') && (
                    <div className="mt-3 space-y-3">
                      {filterConfig.sku.groups.map(group => (
                        <div key={group.label}>
                          <p className="text-[13px] text-[#6E6E73] mb-2 font-medium">{group.label}</p>
                          <div className="flex flex-wrap gap-2">
                            {group.options.map(opt =>
                              renderFilterOption(opt, 'sku', filters.sku.includes(opt.id))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 交付与服务 */}
                <div className="bg-[#F6F6F7] rounded-[12px] p-4">
                  <button
                    onClick={() => toggleSection('service')}
                    className="w-full flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-[15px] font-semibold text-[#1D1D1F]">
                      {filterConfig.service.label}
                    </span>
                    <i className={`ri-arrow-${expandedSections.includes('service') ? 'up' : 'down'}-s-line text-[20px] text-[#6E6E73]`}></i>
                  </button>
                  {expandedSections.includes('service') && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {filterConfig.service.options.map(opt =>
                        renderFilterOption(opt, 'service', filters.service.includes(opt.id))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 底部操作栏 */}
            <div className="sticky bottom-0 bg-white border-t border-[#EAEAEC] p-4 flex items-center gap-3">
              <button
                onClick={cancelFilters}
                className="
                  flex-1 h-[48px] rounded-full bg-[#F6F6F7] text-[#1D1D1F]
                  text-[15px] font-semibold cursor-pointer whitespace-nowrap
                  hover:bg-[#EAEAEC] transition-all duration-[160ms]
                  active:scale-[0.985]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-2
                "
              >
                取消
              </button>
              <button
                onClick={applyFilters}
                className="
                  flex-1 h-[48px] rounded-full bg-[#1D1D1F] text-white
                  text-[15px] font-semibold cursor-pointer whitespace-nowrap
                  hover:bg-[#000000] transition-all duration-[160ms]
                  active:scale-[0.985]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-2
                "
              >
                应用 ({sortedMedia.length})
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        aside::-webkit-scrollbar {
          width: 6px;
        }
        aside::-webkit-scrollbar-track {
          background: transparent;
        }
        aside::-webkit-scrollbar-thumb {
          background: #D1D1D6;
          border-radius: 3px;
        }
        aside::-webkit-scrollbar-thumb:hover {
          background: #A1A1A6;
        }
      `}</style>
    </div>
  );
}
