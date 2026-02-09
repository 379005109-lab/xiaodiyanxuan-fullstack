import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SceneTemplate {
  id: number;
  image: string;
  title: string;
  space: string;
  style: string;
  light: string;
  ratio: string;
  height: number;
}

const sceneTemplates: SceneTemplate[] = [
  {
    id: 1,
    image: 'https://readdy.ai/api/search-image?query=modern%20minimalist%20living%20room%20interior%20with%20large%20windows%20and%20natural%20light%2C%20beige%20sofa%20and%20wooden%20furniture%2C%20clean%20scandinavian%20design%2C%20professional%20interior%20photography&width=400&height=500&seq=public-scene-1&orientation=portrait',
    title: '北欧客厅',
    space: '客厅',
    style: '北欧',
    light: '自然光',
    ratio: '4:3',
    height: 220
  },
  {
    id: 2,
    image: 'https://readdy.ai/api/search-image?query=luxury%20italian%20style%20bedroom%20with%20elegant%20bed%20and%20soft%20lighting%2C%20cream%20color%20palette%20with%20gold%20accents%2C%20high%20end%20interior%20design%20photography&width=400&height=350&seq=public-scene-2&orientation=portrait',
    title: '意式轻奢卧室',
    space: '卧室',
    style: '意式轻奢',
    light: '柔光',
    ratio: '16:9',
    height: 180
  },
  {
    id: 3,
    image: 'https://readdy.ai/api/search-image?query=modern%20dining%20room%20with%20wooden%20table%20and%20designer%20chairs%2C%20pendant%20lights%20above%2C%20warm%20ambient%20lighting%2C%20contemporary%20interior%20photography&width=400&height=400&seq=public-scene-3&orientation=squarish',
    title: '现代餐厅',
    space: '餐厅',
    style: '现代简约',
    light: '暖光',
    ratio: '1:1',
    height: 200
  },
  {
    id: 4,
    image: 'https://readdy.ai/api/search-image?query=cozy%20study%20room%20with%20bookshelf%20and%20comfortable%20reading%20chair%2C%20natural%20daylight%20through%20window%2C%20minimalist%20japanese%20style%20interior&width=400&height=480&seq=public-scene-4&orientation=portrait',
    title: '日式书房',
    space: '书房',
    style: '日式',
    light: '自然光',
    ratio: '4:3',
    height: 240
  },
  {
    id: 5,
    image: 'https://readdy.ai/api/search-image?query=elegant%20cream%20style%20living%20room%20with%20curved%20sofa%20and%20soft%20textures%2C%20warm%20neutral%20tones%2C%20dreamy%20soft%20lighting%2C%20luxury%20interior%20photography&width=400&height=360&seq=public-scene-5&orientation=portrait',
    title: '奶油风客厅',
    space: '客厅',
    style: '奶油风',
    light: '柔光',
    ratio: '16:9',
    height: 190
  },
  {
    id: 6,
    image: 'https://readdy.ai/api/search-image?query=new%20chinese%20style%20master%20bedroom%20with%20traditional%20elements%20and%20modern%20comfort%2C%20dark%20wood%20furniture%20with%20silk%20bedding%2C%20ambient%20warm%20lighting&width=400&height=420&seq=public-scene-6&orientation=portrait',
    title: '新中式主卧',
    space: '主卧',
    style: '新中式',
    light: '暖光',
    ratio: '4:3',
    height: 210
  },
  {
    id: 7,
    image: 'https://readdy.ai/api/search-image?query=vintage%20mid-century%20modern%20living%20room%20with%20retro%20furniture%20and%20warm%20colors%2C%20artistic%20interior%20design%20with%20unique%20decorations%2C%20professional%20photography&width=400&height=380&seq=public-scene-7&orientation=portrait',
    title: '中古风客厅',
    space: '客厅',
    style: '中古风',
    light: '自然光',
    ratio: '1:1',
    height: 195
  },
  {
    id: 8,
    image: 'https://readdy.ai/api/search-image?query=bright%20scandinavian%20kids%20room%20with%20playful%20elements%20and%20natural%20light%2C%20white%20and%20pastel%20colors%2C%20clean%20modern%20design%2C%20interior%20photography&width=400&height=450&seq=public-scene-8&orientation=portrait',
    title: '北欧次卧',
    space: '次卧',
    style: '北欧',
    light: '自然光',
    ratio: '4:3',
    height: 225
  },
  {
    id: 9,
    image: 'https://readdy.ai/api/search-image?query=italian%20minimalist%20dining%20area%20with%20marble%20table%20and%20designer%20chairs%2C%20soft%20diffused%20lighting%2C%20elegant%20contemporary%20interior&width=400&height=340&seq=public-scene-9&orientation=portrait',
    title: '意式极简餐厅',
    space: '餐厅',
    style: '意式极简',
    light: '柔光',
    ratio: '16:9',
    height: 175
  },
  {
    id: 10,
    image: 'https://readdy.ai/api/search-image?query=cozy%20elderly%20bedroom%20with%20comfortable%20bed%20and%20warm%20lighting%2C%20soft%20neutral%20colors%2C%20accessible%20design%20with%20elegant%20furniture&width=400&height=400&seq=public-scene-10&orientation=squarish',
    title: '温馨老人房',
    space: '老人房',
    style: '现代简约',
    light: '暖光',
    ratio: '1:1',
    height: 200
  }
];

const spaceOptions = ['全部', '客厅', '餐厅', '主卧', '次卧', '书房', '老人房'];
const styleOptions = ['全部', '意式极简', '意式轻奢', '奶油风', '中古风', '北欧', '新中式', '日式', '现代简约'];
const lightOptions = ['全部', '自然光', '暖光', '柔光', '冷光'];
const ratioOptions = ['全部', '1:1', '4:3', '16:9', '9:16'];

export default function PublicScenePage() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    space: '全部',
    style: '全部',
    light: '全部',
    ratio: '全部'
  });
  const [sortBy, setSortBy] = useState('推荐');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedScenes, setSelectedScenes] = useState<number[]>([]);
  const [previewScene, setPreviewScene] = useState<SceneTemplate | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showTip, setShowTip] = useState(true);

  // 筛选后的场景
  const filteredScenes = sceneTemplates.filter(scene => {
    if (filters.space !== '全部' && scene.space !== filters.space) return false;
    if (filters.style !== '全部' && scene.style !== filters.style) return false;
    if (filters.light !== '全部' && scene.light !== filters.light) return false;
    if (filters.ratio !== '全部' && scene.ratio !== filters.ratio) return false;
    if (searchText && !scene.title.includes(searchText) && !scene.style.includes(searchText) && !scene.space.includes(searchText)) return false;
    return true;
  });

  // 分成两列
  const leftColumn = filteredScenes.filter((_, idx) => idx % 2 === 0);
  const rightColumn = filteredScenes.filter((_, idx) => idx % 2 === 1);

  const toggleSelect = (id: number) => {
    if (selectedScenes.includes(id)) {
      setSelectedScenes(selectedScenes.filter(s => s !== id));
    } else {
      setSelectedScenes([...selectedScenes, id]);
    }
  };

  const openPreview = (scene: SceneTemplate) => {
    setPreviewScene(scene);
    setPreviewIndex(filteredScenes.findIndex(s => s.id === scene.id));
  };

  const handlePrevPreview = () => {
    if (previewIndex > 0) {
      const newIndex = previewIndex - 1;
      setPreviewIndex(newIndex);
      setPreviewScene(filteredScenes[newIndex]);
    }
  };

  const handleNextPreview = () => {
    if (previewIndex < filteredScenes.length - 1) {
      const newIndex = previewIndex + 1;
      setPreviewIndex(newIndex);
      setPreviewScene(filteredScenes[newIndex]);
    }
  };

  const handleConfirm = () => {
    // 返回AI生图页面并回填场景
    navigate('/ai/generate-scene', { 
      state: { 
        selectedScenes: selectedScenes.map(id => sceneTemplates.find(s => s.id === id)) 
      } 
    });
  };

  const getFilterOptions = (type: string) => {
    switch (type) {
      case 'space': return spaceOptions;
      case 'style': return styleOptions;
      case 'light': return lightOptions;
      case 'ratio': return ratioOptions;
      default: return [];
    }
  };

  const getFilterLabel = (type: string) => {
    switch (type) {
      case 'space': return '空间';
      case 'style': return '风格';
      case 'light': return '光线';
      case 'ratio': return '比例';
      default: return '';
    }
  };

  useEffect(() => {
    // 3秒后隐藏提示
    const timer = setTimeout(() => setShowTip(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-[calc(70px+env(safe-area-inset-bottom))]">
      {/* 顶部导航栏 */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="h-11 px-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
          >
            <i className="ri-arrow-left-s-line text-[24px] text-[#1C1C1E]"></i>
          </button>
          
          {showSearch ? (
            <div className="flex-1 mx-2">
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] text-[16px]"></i>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="搜索场景模板"
                  autoFocus
                  className="w-full h-9 pl-9 pr-4 bg-[#F2F2F7] rounded-lg text-[14px] text-[#1C1C1E] placeholder-[#8E8E93] outline-none"
                />
              </div>
            </div>
          ) : (
            <h1 className="font-semibold text-[17px] text-[#1C1C1E]">公库场景</h1>
          )}
          
          <div className="flex items-center gap-1">
            {showSearch ? (
              <button 
                onClick={() => { setShowSearch(false); setSearchText(''); }}
                className="px-3 py-1 text-[14px] text-[#FF9500] cursor-pointer whitespace-nowrap"
              >
                取消
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setShowSearch(true)}
                  className="w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
                >
                  <i className="ri-search-line text-[22px] text-[#1C1C1E]"></i>
                </button>
                <button 
                  onClick={() => navigate(-1)}
                  className="w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
                >
                  <i className="ri-close-line text-[22px] text-[#1C1C1E]"></i>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 筛选栏 */}
      <div 
        className="fixed z-40 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA]"
        style={{ top: 'calc(44px + env(safe-area-inset-top))' }}
      >
        <div className="flex items-center px-4 py-2.5 gap-2">
          {/* 筛选胶囊 */}
          {['space', 'style', 'light', 'ratio'].map(type => (
            <button
              key={type}
              onClick={() => setActiveFilter(activeFilter === type ? null : type)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-all cursor-pointer ${
                filters[type as keyof typeof filters] !== '全部'
                  ? 'bg-[#F5F5F7] text-[#FF9500] border border-[#FF9500]/30'
                  : activeFilter === type
                  ? 'bg-[#F5F5F7] text-[#1D1D1F] border border-[#C7C7CC]'
                  : 'bg-white text-[#1D1D1F] border border-[#D2D2D7]'
              }`}
            >
              <span>{filters[type as keyof typeof filters] !== '全部' ? filters[type as keyof typeof filters] : getFilterLabel(type)}</span>
              <i className={`ri-arrow-down-s-line text-[14px] transition-transform ${activeFilter === type ? 'rotate-180' : ''}`}></i>
            </button>
          ))}
          
          {/* 排序 */}
          <div className="ml-auto relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-[#D2D2D7] text-[13px] text-[#1D1D1F] whitespace-nowrap cursor-pointer"
            >
              <i className="ri-sort-desc text-[14px]"></i>
              <span>{sortBy}</span>
            </button>
            
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)}></div>
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg overflow-hidden z-20 min-w-[100px]">
                  {['推荐', '最新', '热门'].map(sort => (
                    <button
                      key={sort}
                      onClick={() => { setSortBy(sort); setShowSortMenu(false); }}
                      className={`w-full px-4 py-2.5 text-[14px] text-left cursor-pointer transition-colors ${
                        sortBy === sort ? 'bg-[#F5F5F7] text-[#FF9500]' : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'
                      }`}
                    >
                      {sort}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 筛选下拉面板 */}
        {activeFilter && (
          <div className="px-4 pb-3 border-t border-[#E5E5EA] pt-2">
            <div className="flex flex-wrap gap-2">
              {getFilterOptions(activeFilter).map(option => (
                <button
                  key={option}
                  onClick={() => {
                    setFilters({ ...filters, [activeFilter]: option });
                    setActiveFilter(null);
                  }}
                  className={`px-3 py-1.5 rounded-full text-[13px] whitespace-nowrap cursor-pointer transition-all ${
                    filters[activeFilter as keyof typeof filters] === option
                      ? 'bg-[#F5F5F7] text-[#FF9500] border border-[#FF9500]/30'
                      : 'bg-white text-[#1D1D1F] border border-[#D2D2D7] hover:bg-[#F5F5F7]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 瀑布流内容 */}
      <div 
        className="px-3 pt-3"
        style={{ marginTop: activeFilter ? 'calc(44px + 90px + env(safe-area-inset-top))' : 'calc(44px + 52px + env(safe-area-inset-top))' }}
      >
        {/* 浮层提示 */}
        {showTip && (
          <div className="mb-3 bg-gradient-to-r from-[#FF9500]/10 to-[#FFCC00]/10 rounded-xl p-3 flex items-center gap-2 animate-fade-in">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FF9500]/20">
              <i className="ri-lightbulb-line text-[#FF9500] text-[16px]"></i>
            </div>
            <p className="flex-1 text-[13px] text-[#1C1C1E]">我们还提供多个场景模板，点击可预览选择</p>
            <button 
              onClick={() => setShowTip(false)}
              className="w-6 h-6 flex items-center justify-center cursor-pointer"
            >
              <i className="ri-close-line text-[#8E8E93] text-[16px]"></i>
            </button>
          </div>
        )}

        <div className="flex gap-3">
          {/* 左列 */}
          <div className="flex-1 flex flex-col gap-3">
            {leftColumn.map(scene => (
              <div
                key={scene.id}
                className="relative bg-white rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)] cursor-pointer group"
                onClick={() => openPreview(scene)}
              >
                <div className="relative" style={{ height: scene.height }}>
                  <img
                    src={scene.image}
                    alt={scene.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* 选中状态 */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSelect(scene.id); }}
                    className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      selectedScenes.includes(scene.id)
                        ? 'bg-[#FF9500] border-2 border-white'
                        : 'bg-white/80 backdrop-blur-sm border border-[#E5E5EA]'
                    }`}
                  >
                    {selectedScenes.includes(scene.id) && (
                      <i className="ri-check-line text-white text-[14px]"></i>
                    )}
                  </button>
                </div>
                <div className="p-2.5">
                  <h3 className="text-[13px] font-medium text-[#1C1C1E] mb-1.5 line-clamp-1">{scene.title}</h3>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] text-[#8E8E93] bg-[#F2F2F7] px-1.5 py-0.5 rounded">{scene.space}</span>
                    <span className="text-[10px] text-[#8E8E93] bg-[#F2F2F7] px-1.5 py-0.5 rounded">{scene.style}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 右列 */}
          <div className="flex-1 flex flex-col gap-3">
            {rightColumn.map(scene => (
              <div
                key={scene.id}
                className="relative bg-white rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)] cursor-pointer group"
                onClick={() => openPreview(scene)}
              >
                <div className="relative" style={{ height: scene.height }}>
                  <img
                    src={scene.image}
                    alt={scene.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* 选中状态 */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSelect(scene.id); }}
                    className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      selectedScenes.includes(scene.id)
                        ? 'bg-[#FF9500] border-2 border-white'
                        : 'bg-white/80 backdrop-blur-sm border border-[#E5E5EA]'
                    }`}
                  >
                    {selectedScenes.includes(scene.id) && (
                      <i className="ri-check-line text-white text-[14px]"></i>
                    )}
                  </button>
                </div>
                <div className="p-2.5">
                  <h3 className="text-[13px] font-medium text-[#1C1C1E] mb-1.5 line-clamp-1">{scene.title}</h3>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] text-[#8E8E93] bg-[#F2F2F7] px-1.5 py-0.5 rounded">{scene.space}</span>
                    <span className="text-[10px] text-[#8E8E93] bg-[#F2F2F7] px-1.5 py-0.5 rounded">{scene.style}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 空状态 */}
        {filteredScenes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <i className="ri-image-line text-[64px] text-[#C6C6C8] mb-4"></i>
            <p className="text-[15px] text-[#8E8E93]">暂无匹配的场景模板</p>
          </div>
        )}

        {/* 加载更多提示 */}
        {filteredScenes.length > 0 && (
          <div className="text-center py-6 text-[13px] text-[#8E8E93]">
            上拉加载更多
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-[#E5E5EA] z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="h-[60px] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-[#8E8E93]">已选</span>
            <span className="text-[18px] font-semibold text-[#FF9500]">{selectedScenes.length}</span>
            <span className="text-[14px] text-[#8E8E93]">张</span>
          </div>
          <button
            onClick={handleConfirm}
            disabled={selectedScenes.length === 0}
            className={`px-8 h-12 rounded-[16px] text-[15px] font-medium whitespace-nowrap cursor-pointer transition-all ${
              selectedScenes.length > 0
                ? 'bg-white border border-[#D2D2D7] text-[#1D1D1F] hover:bg-[#F5F5F7] active:bg-[#F5F5F7]'
                : 'bg-[#E5E5EA] text-[#8E8E93] cursor-not-allowed border border-transparent'
            }`}
          >
            {selectedScenes.length > 0 ? '使用该场景' : '确定'}
          </button>
        </div>
      </div>

      {/* 大图预览弹窗 */}
      {previewScene && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col">
          {/* 预览顶部栏 */}
          <div 
            className="flex items-center justify-between px-4 h-11 bg-black/50"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <button 
              onClick={() => setPreviewScene(null)}
              className="w-8 h-8 flex items-center justify-center cursor-pointer"
            >
              <i className="ri-close-line text-[24px] text-white"></i>
            </button>
            <span className="text-[15px] text-white">{previewIndex + 1} / {filteredScenes.length}</span>
            <div className="w-8"></div>
          </div>

          {/* 图片预览区 */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            {/* 左箭头 */}
            {previewIndex > 0 && (
              <button
                onClick={handlePrevPreview}
                className="absolute left-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors z-10"
              >
                <i className="ri-arrow-left-s-line text-[24px] text-white"></i>
              </button>
            )}

            <img
              src={previewScene.image}
              alt={previewScene.title}
              className="max-w-full max-h-full object-contain"
            />

            {/* 右箭头 */}
            {previewIndex < filteredScenes.length - 1 && (
              <button
                onClick={handleNextPreview}
                className="absolute right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors z-10"
              >
                <i className="ri-arrow-right-s-line text-[24px] text-white"></i>
              </button>
            )}
          </div>

          {/* 预览信息 */}
          <div className="px-4 py-3 bg-black/50">
            <h3 className="text-[16px] font-medium text-white mb-2">{previewScene.title}</h3>
            <div className="flex flex-wrap gap-2">
              <span className="text-[12px] text-white/70 bg-white/20 px-2 py-1 rounded">{previewScene.space}</span>
              <span className="text-[12px] text-white/70 bg-white/20 px-2 py-1 rounded">{previewScene.style}</span>
              <span className="text-[12px] text-white/70 bg-white/20 px-2 py-1 rounded">{previewScene.light}</span>
              <span className="text-[12px] text-white/70 bg-white/20 px-2 py-1 rounded">{previewScene.ratio}</span>
            </div>
          </div>

          {/* 预览底部操作 */}
          <div 
            className="px-4 py-3 bg-black/80 flex items-center justify-between"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
          >
            <button
              onClick={() => toggleSelect(previewScene.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all ${
                selectedScenes.includes(previewScene.id)
                  ? 'bg-[#FF9500] text-white'
                  : 'bg-white/20 text-white'
              }`}
            >
              <i className={`${selectedScenes.includes(previewScene.id) ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'} text-[18px]`}></i>
              <span className="text-[14px] whitespace-nowrap">{selectedScenes.includes(previewScene.id) ? '已选择' : '选择'}</span>
            </button>
            
            <button
              onClick={() => {
                if (!selectedScenes.includes(previewScene.id)) {
                  toggleSelect(previewScene.id);
                }
                setPreviewScene(null);
                handleConfirm();
              }}
              className="px-6 h-11 bg-white border border-[#D2D2D7] text-[#1D1D1F] rounded-[14px] text-[14px] font-medium whitespace-nowrap cursor-pointer hover:bg-[#F5F5F7] active:bg-[#F5F5F7] transition-colors"
            >
              使用该场景
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
