import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { materialCategories, materials } from '../../mocks/aiMaterials';
import TabBar from '../../components/TabBar';
import UseInProductDrawer from './components/UseInProductDrawer';

export default function AIPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('scene');
  const [showMenu, setShowMenu] = useState(false);
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingMaterialId, setDeletingMaterialId] = useState<string | null>(null);
  
  // 管理模式状态
  const [isManageMode, setIsManageMode] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [showUseInProductDrawer, setShowUseInProductDrawer] = useState(false);

  const filteredMaterials = materials.filter(m => m.type === activeCategory);

  const menuItems = [
    { id: 'scene', name: '生成场景效果图', icon: 'ri-landscape-line', disabled: false },
    { id: 'white-bg', name: '生成白底图', icon: 'ri-image-edit-line', disabled: false },
    { id: 'replace', name: '家具替换', icon: 'ri-swap-box-line', disabled: false },
    { id: 'texture', name: '更换材质面料', icon: 'ri-palette-line', disabled: false }
  ];

  const materialActions = [
    { id: 'scene', name: '生成场景效果图', icon: 'ri-landscape-line' },
    { id: 'white-bg', name: '生成白底图', icon: 'ri-image-edit-line' },
    { id: 'replace', name: '家具替换', icon: 'ri-swap-box-line' },
    { id: 'texture', name: '更换材质面料', icon: 'ri-palette-line' },
    { id: 'download', name: '下载', icon: 'ri-download-line' },
    { id: 'delete', name: '删除', icon: 'ri-delete-bin-line', danger: true }
  ];

  const handleMenuClick = (id: string) => {
    if (id === 'scene') {
      navigate('/ai/generate-scene');
    } else if (id === 'white-bg') {
      navigate('/ai/white-bg');
    } else if (id === 'replace') {
      navigate('/ai/furniture-replace');
    } else if (id === 'match') {
      navigate('/ai/soft-decoration');
    } else if (id === 'texture') {
      navigate('/ai/texture-replace');
    } else if (id === 'public-scene') {
      navigate('/ai/public-scene');
    }
    setShowMenu(false);
  };

  const handleMaterialAction = (actionId: string, materialId: string) => {
    setActiveMaterialId(null);
    
    if (actionId === 'scene') {
      navigate('/ai/generate-scene');
    } else if (actionId === 'white-bg') {
      navigate('/ai/white-bg');
    } else if (actionId === 'replace') {
      navigate('/ai/furniture-replace');
    } else if (actionId === 'texture') {
      navigate('/ai/texture-replace');
    } else if (actionId === 'download') {
      showToastMessage('素材已开始下载');
    } else if (actionId === 'delete') {
      setDeletingMaterialId(materialId);
      setShowDeleteConfirm(true);
    }
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeletingMaterialId(null);
    showToastMessage('素材已删除');
  };

  const handleMoreClick = (e: React.MouseEvent, materialId: string) => {
    e.stopPropagation();
    setActiveMaterialId(activeMaterialId === materialId ? null : materialId);
  };

  // 进入管理模式
  const handleEnterManageMode = () => {
    setIsManageMode(true);
    setSelectedMaterials([]);
  };

  // 退出管理模式
  const handleExitManageMode = () => {
    setIsManageMode(false);
    setSelectedMaterials([]);
  };

  // 切换选择素材
  const handleToggleSelect = (materialId: string) => {
    setSelectedMaterials(prev => 
      prev.includes(materialId) 
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    );
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedMaterials.length === filteredMaterials.length) {
      setSelectedMaterials([]);
    } else {
      setSelectedMaterials(filteredMaterials.map(m => m.id));
    }
  };

  // 批量删除确认
  const handleBatchDeleteConfirm = () => {
    setShowBatchDeleteConfirm(false);
    showToastMessage(`已删除 ${selectedMaterials.length} 个素材`);
    setSelectedMaterials([]);
    setIsManageMode(false);
  };

  // 使用到产品中
  const handleUseInProduct = () => {
    if (selectedMaterials.length > 0) {
      setShowUseInProductDrawer(true);
    }
  };

  // 获取选中素材的图片信息
  const getSelectedMaterialImages = () => {
    return selectedMaterials.map(id => {
      const material = materials.find(m => m.id.toString() === id);
      return {
        id,
        image: material?.image || ''
      };
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-20">
      {/* Toast 提示 */}
      {showToast && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] bg-black/75 text-white px-6 py-3 rounded-lg text-[14px] animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-[90]"
            onClick={() => setShowDeleteConfirm(false)}
          ></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] bg-white rounded-[20px] w-[270px] overflow-hidden animate-scale-in">
            <div className="px-4 pt-5 pb-4 text-center">
              <h3 className="text-[17px] font-semibold text-[#1D1D1F] mb-2">删除素材</h3>
              <p className="text-[13px] text-[#6E6E73]">确定要删除这个素材吗？删除后无法恢复。</p>
            </div>
            <div className="flex border-t border-[#E5E5EA]">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 text-[17px] text-[#6E6E73] border-r border-[#E5E5EA] cursor-pointer hover:bg-[#F5F5F7] transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="flex-1 py-3 text-[17px] text-[#1D1D1F] font-medium cursor-pointer hover:bg-[#F5F5F7] transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </>
      )}

      {/* 批量删除确认弹窗 */}
      {showBatchDeleteConfirm && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-[90]"
            onClick={() => setShowBatchDeleteConfirm(false)}
          ></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] bg-white rounded-[20px] w-[270px] overflow-hidden animate-scale-in">
            <div className="px-4 pt-5 pb-4 text-center">
              <h3 className="text-[17px] font-semibold text-[#1D1D1F] mb-2">批量删除</h3>
              <p className="text-[13px] text-[#6E6E73]">确定要删除选中的 {selectedMaterials.length} 个素材吗？删除后无法恢复。</p>
            </div>
            <div className="flex border-t border-[#E5E5EA]">
              <button 
                onClick={() => setShowBatchDeleteConfirm(false)}
                className="flex-1 py-3 text-[17px] text-[#6E6E73] border-r border-[#E5E5EA] cursor-pointer hover:bg-[#F5F5F7] transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleBatchDeleteConfirm}
                className="flex-1 py-3 text-[17px] text-[#1D1D1F] font-medium cursor-pointer hover:bg-[#F5F5F7] transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </>
      )}

      {/* 顶部导航栏 */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="h-11 px-4 flex items-center justify-between">
          {isManageMode ? (
            <>
              <button 
                onClick={handleExitManageMode}
                className="text-[15px] text-[#6E6E73] cursor-pointer whitespace-nowrap"
              >
                取消
              </button>
              <div className="font-semibold text-[17px] text-[#1D1D1F]">
                已选择 {selectedMaterials.length} 项
              </div>
              <button 
                onClick={handleExitManageMode}
                className="text-[15px] text-[#1D1D1F] font-medium cursor-pointer whitespace-nowrap"
              >
                完成
              </button>
            </>
          ) : (
            <>
              <div className="font-semibold text-[17px] text-[#1D1D1F]">AI 创作</div>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity">
                  <i className="ri-camera-line text-[22px] text-[#1D1D1F]"></i>
                </button>
                <button className="w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity">
                  <i className="ri-search-line text-[22px] text-[#1D1D1F]"></i>
                </button>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* 分类标签 - 改为白底+描边，选中态浅底 */}
      <div 
        className="fixed z-40 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA]"
        style={{ top: 'calc(44px + env(safe-area-inset-top))' }}
      >
        <div className="flex items-center px-4 py-3 gap-2 overflow-x-auto scrollbar-hide">
          {materialCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                if (isManageMode) {
                  setSelectedMaterials([]);
                }
              }}
              className={`flex items-center gap-1.5 px-4 h-9 rounded-full whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-[#F5F5F7] text-[#1D1D1F] border border-[#C7C7CC]'
                  : 'bg-white text-[#1D1D1F] border border-[#D2D2D7] hover:bg-[#F5F5F7]'
              }`}
            >
              <i className={`${cat.icon} text-[14px]`}></i>
              <span className="text-[14px] font-medium">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 素材网格 */}
      <div 
        className="px-4 pt-4"
        style={{ marginTop: 'calc(44px + 52px + env(safe-area-inset-top))' }}
      >
        {/* 素材统计 */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] text-[#6E6E73]">共 {filteredMaterials.length} 个素材</p>
          {!isManageMode && (
            <button 
              onClick={handleEnterManageMode}
              className="text-[13px] text-[#1D1D1F] flex items-center cursor-pointer whitespace-nowrap"
            >
              管理 <i className="ri-arrow-right-s-line ml-0.5"></i>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filteredMaterials.map(material => (
            <div
              key={material.id}
              onClick={() => isManageMode && handleToggleSelect(material.id)}
              className={`bg-white rounded-xl overflow-hidden cursor-pointer group border transition-all ${
                isManageMode && selectedMaterials.includes(material.id) 
                  ? 'border-[#1D1D1F] shadow-sm' 
                  : 'border-[#E5E5EA]'
              }`}
            >
              <div className="relative aspect-square bg-[#F5F5F7] overflow-hidden">
                <img
                  src={material.image}
                  alt={material.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                
                {/* 管理模式下的选择框 - 改为白底+描边 */}
                {isManageMode && (
                  <div className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center z-10">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedMaterials.includes(material.id) 
                        ? 'bg-[#1D1D1F] border-[#1D1D1F]' 
                        : 'bg-white/90 border-[#D2D2D7]'
                    }`}>
                      {selectedMaterials.includes(material.id) && (
                        <i className="ri-check-line text-white text-[12px]"></i>
                      )}
                    </div>
                  </div>
                )}

                {/* 非管理模式下的日期 */}
                {!isManageMode && (
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full z-10">
                    <span className="text-[10px] text-[#6E6E73]">{material.date}</span>
                  </div>
                )}

                {/* 素材操作菜单 */}
                {!isManageMode && activeMaterialId === material.id && (
                  <>
                    <div 
                      className="fixed inset-0 z-[80]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMaterialId(null);
                      }}
                    ></div>
                    <div className="absolute top-10 right-2 z-[90] bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden w-[160px] animate-scale-in">
                      {materialActions.map((action, idx) => (
                        <button
                          key={action.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMaterialAction(action.id, material.id);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-[#F5F5F7] ${
                            idx !== materialActions.length - 1 ? 'border-b border-[#E5E5EA]' : ''
                          }`}
                        >
                          <i className={`${action.icon} text-[16px] ${action.danger ? 'text-[#1D1D1F]' : 'text-[#6E6E73]'}`}></i>
                          <span className={`text-[14px] ${action.danger ? 'text-[#1D1D1F]' : 'text-[#1D1D1F]'}`}>
                            {action.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="p-3 relative z-0">
                <h3 className="text-[14px] font-medium text-[#1D1D1F] mb-2 line-clamp-1">
                  {material.title}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {material.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] text-[#6E6E73] bg-[#F5F5F7] px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 空状态 */}
        {filteredMaterials.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <i className="ri-image-line text-[64px] text-[#C6C6C8] mb-4"></i>
            <p className="text-[15px] text-[#6E6E73] mb-4">暂无素材</p>
            <button 
              onClick={() => setShowMenu(true)}
              className="px-6 h-11 bg-white border border-[#D2D2D7] text-[#1D1D1F] rounded-[16px] text-[14px] font-medium whitespace-nowrap cursor-pointer hover:bg-[#F5F5F7] active:bg-[#F5F5F7] transition-colors"
            >
              开始创作
            </button>
          </div>
        )}

        {/* 底部提示 */}
        {filteredMaterials.length > 0 && !isManageMode && (
          <div className="text-center py-8 text-[13px] text-[#6E6E73]">
            已经到底了
          </div>
        )}

        {/* 管理模式底部留白 */}
        {isManageMode && (
          <div className="h-20"></div>
        )}
      </div>

      {/* 管理模式底部操作栏 - 改为白底+描边按钮 */}
      {isManageMode && (
        <div 
          className="fixed left-0 right-0 bg-white border-t border-[#E5E5EA] z-50 pb-[env(safe-area-inset-bottom)]"
          style={{ bottom: '49px' }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <button 
              onClick={handleSelectAll}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedMaterials.length === filteredMaterials.length && filteredMaterials.length > 0
                  ? 'bg-[#1D1D1F] border-[#1D1D1F]' 
                  : 'border-[#D2D2D7]'
              }`}>
                {selectedMaterials.length === filteredMaterials.length && filteredMaterials.length > 0 && (
                  <i className="ri-check-line text-white text-[12px]"></i>
                )}
              </div>
              <span className="text-[14px] text-[#1D1D1F]">全选</span>
            </button>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleUseInProduct}
                disabled={selectedMaterials.length === 0}
                className={`flex items-center gap-1.5 px-4 h-11 rounded-[14px] transition-all cursor-pointer whitespace-nowrap border ${
                  selectedMaterials.length > 0 
                    ? 'bg-white border-[#D2D2D7] text-[#1D1D1F] hover:bg-[#F5F5F7] active:bg-[#F5F5F7]' 
                    : 'bg-[#F5F5F7] border-[#E5E5EA] text-[#AEAEB2]'
                }`}
              >
                <i className="ri-shopping-bag-line text-[16px]"></i>
                <span className="text-[14px] font-medium">
                  使用到产品中{selectedMaterials.length > 0 ? `（${selectedMaterials.length}）` : ''}
                </span>
              </button>
              <button 
                onClick={() => {
                  if (selectedMaterials.length > 0) {
                    showToastMessage(`已下载 ${selectedMaterials.length} 个素材`);
                  }
                }}
                disabled={selectedMaterials.length === 0}
                className={`w-11 h-11 flex items-center justify-center rounded-[14px] transition-all cursor-pointer border ${
                  selectedMaterials.length > 0 
                    ? 'bg-white border-[#D2D2D7] text-[#1D1D1F] hover:bg-[#F5F5F7] active:bg-[#F5F5F7]' 
                    : 'bg-[#F5F5F7] border-[#E5E5EA] text-[#AEAEB2]'
                }`}
              >
                <i className="ri-download-line text-[18px]"></i>
              </button>
              <button 
                onClick={() => {
                  if (selectedMaterials.length > 0) {
                    setShowBatchDeleteConfirm(true);
                  }
                }}
                disabled={selectedMaterials.length === 0}
                className={`w-11 h-11 flex items-center justify-center rounded-[14px] transition-all cursor-pointer border ${
                  selectedMaterials.length > 0 
                    ? 'bg-white border-[#D2D2D7] text-[#1D1D1F] hover:bg-[#F5F5F7] active:bg-[#F5F5F7]' 
                    : 'bg-[#F5F5F7] border-[#E5E5EA] text-[#AEAEB2]'
                }`}
              >
                <i className="ri-delete-bin-line text-[18px]"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 使用到产品中抽屉 */}
      <UseInProductDrawer
        isOpen={showUseInProductDrawer}
        onClose={() => setShowUseInProductDrawer(false)}
        selectedMaterials={selectedMaterials}
        materialImages={getSelectedMaterialImages()}
      />

      {/* 右侧功能菜单按钮 - 改为白底+描边 */}
      {!isManageMode && (
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="fixed right-4 z-50 w-14 h-14 bg-white border border-[#D2D2D7] rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-[#F5F5F7] hover:shadow-xl active:bg-[#F5F5F7]"
          style={{ bottom: 'calc(49px + 20px + env(safe-area-inset-bottom))' }}
        >
          <i className={`${showMenu ? 'ri-close-line' : 'ri-add-line'} text-[26px] text-[#1D1D1F] transition-transform duration-200 ${showMenu ? 'rotate-90' : ''}`}></i>
        </button>
      )}

      {/* 功能菜单面板 */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowMenu(false)}
          ></div>
          <div
            className="fixed right-4 z-50 bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
            style={{ bottom: 'calc(49px + 90px + env(safe-area-inset-bottom))', width: '220px' }}
          >
            <div className="px-4 py-3 border-b border-[#E5E5EA]">
              <h3 className="text-[15px] font-semibold text-[#1D1D1F]">AI 功能</h3>
            </div>
            {menuItems.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => !item.disabled && handleMenuClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all duration-200 cursor-pointer ${
                  idx !== menuItems.length - 1 ? 'border-b border-[#E5E5EA]' : ''
                } ${
                  item.disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-[#F5F5F7] active:bg-[#E5E5EA]'
                }`}
                disabled={item.disabled}
              >
                <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F5F5F7]">
                  <i className={`${item.icon} text-[18px] ${item.disabled ? 'text-[#C6C6C8]' : 'text-[#6E6E73]'}`}></i>
                </div>
                <span className={`text-[14px] flex-1 text-left ${item.disabled ? 'text-[#C6C6C8]' : 'text-[#1D1D1F]'}`}>
                  {item.name}
                </span>
                {item.disabled ? (
                  <span className="text-[10px] text-[#6E6E73] bg-[#E5E5EA] px-1.5 py-0.5 rounded">
                    即将上线
                  </span>
                ) : (
                  <i className="ri-arrow-right-s-line text-[#C6C6C8] text-lg"></i>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>

      <TabBar />
    </div>
  );
}
