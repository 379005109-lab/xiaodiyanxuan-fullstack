import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

type TabType = 'all' | 'craft' | 'product' | 'detail' | 'size' | 'scene';

const tabs: { id: TabType; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'craft', label: '工艺视频' },
  { id: 'product', label: '实拍' },
  { id: 'detail', label: '细节' },
  { id: 'size', label: '尺寸结构' },
  { id: 'scene', label: '场景效果' },
];

export default function MediaViewerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mediaList = [], currentIndex = 0, activeTab = 'all' } = location.state || {};

  const [index, setIndex] = useState(currentIndex);
  const [scale, setScale] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [activeTabState, setActiveTabState] = useState<TabType>(activeTab);

  const currentMedia = mediaList[index];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showControls) {
      timer = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timer);
  }, [showControls, index]);

  const handlePrev = () => {
    if (index > 0) {
      setIndex(index - 1);
      setScale(1);
      setShowControls(true);
    }
  };

  const handleNext = () => {
    if (index < mediaList.length - 1) {
      setIndex(index + 1);
      setScale(1);
      setShowControls(true);
    }
  };

  const handleImageClick = () => {
    setShowControls(!showControls);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '商品媒体',
          text: currentMedia?.type === 'video' ? currentMedia.title : '商品图片',
          url: window.location.href,
        });
      } catch {
        // 用户取消分享
      }
    }
  };

  if (!currentMedia) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white text-[14px]">媒体不存在</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* 顶部控制栏 */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
          <div className="h-[44px] flex items-center justify-between px-4">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            >
              <i className="ri-arrow-left-line text-[20px] text-white"></i>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[15px] text-white font-medium">{index + 1}</span>
              <span className="text-[13px] text-white/60">/</span>
              <span className="text-[13px] text-white/60">{mediaList.length}</span>
            </div>
            <button
              onClick={handleShare}
              className="w-8 h-8 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            >
              <i className="ri-share-line text-[20px] text-white"></i>
            </button>
          </div>

          {/* Tab 导航 */}
          <div className="overflow-x-auto scrollbar-hide px-4 pb-3">
            <div className="flex items-center gap-2 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabState(tab.id)}
                  className={`px-3 py-1 rounded-full text-[12px] font-medium whitespace-nowrap cursor-pointer transition-all duration-200 active:scale-95 ${
                    activeTabState === tab.id
                      ? 'bg-white text-[#1D1D1F]'
                      : 'bg-white/20 text-white border border-white/30'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 媒体内容区 */}
      <div 
        className="w-full h-full flex items-center justify-center"
        onClick={handleImageClick}
      >
        {currentMedia.type === 'video' ? (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <div className="text-center">
              <div className="w-20 h-20 flex items-center justify-center bg-white/10 rounded-full mb-4 mx-auto cursor-pointer active:scale-95 transition-transform">
                <i className="ri-play-fill text-[40px] text-white"></i>
              </div>
              <p className="text-[15px] text-white/80 mb-1">{currentMedia.title}</p>
              <p className="text-[13px] text-white/50">{currentMedia.duration}</p>
            </div>
          </div>
        ) : (
          <img
            src={currentMedia.url}
            alt=""
            className="max-w-full max-h-full object-contain"
            style={{ transform: `scale(${scale})` }}
          />
        )}
      </div>

      {/* 左右切换按钮 */}
      {index > 0 && (
        <button
          onClick={handlePrev}
          className={`fixed left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full cursor-pointer transition-all duration-300 active:scale-95 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <i className="ri-arrow-left-s-line text-[24px] text-white"></i>
        </button>
      )}
      
      {index < mediaList.length - 1 && (
        <button
          onClick={handleNext}
          className={`fixed right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full cursor-pointer transition-all duration-300 active:scale-95 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <i className="ri-arrow-right-s-line text-[24px] text-white"></i>
        </button>
      )}

      {/* 底部缩略图 */}
      <div 
        className={`fixed bottom-0 left-0 right-0 transition-all duration-300 ${
          showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="bg-gradient-to-t from-black/80 to-transparent backdrop-blur-sm pt-4 pb-4">
          <div className="overflow-x-auto scrollbar-hide px-4">
            <div className="flex items-center gap-2 min-w-max">
              {mediaList.map((item: any, i: number) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setIndex(i);
                    setScale(1);
                  }}
                  className={`flex-shrink-0 w-[60px] h-[60px] rounded-[8px] overflow-hidden cursor-pointer transition-all duration-200 active:scale-95 border-2 ${
                    i === index ? 'border-white' : 'border-transparent opacity-60'
                  }`}
                >
                  <img
                    src={item.type === 'video' ? item.thumbnail : item.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <i className="ri-play-fill text-[16px] text-white"></i>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
