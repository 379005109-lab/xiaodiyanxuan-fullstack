
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface ImageSearchModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ImageSearchModal({ visible, onClose }: ImageSearchModalProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [pressed, setPressed] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleSearch = () => {
    if (!selectedImage) return;
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      handleClose();
      navigate('/search?type=image');
    }, 2000);
  };

  const handleClose = () => {
    setSelectedImage(null);
    setIsSearching(false);
    onClose();
  };

  const getPressStyle = (key: string) => ({
    transform: pressed === key ? 'scale(0.985) translateY(2px)' : 'scale(1) translateY(0)',
    transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
  });

  const pressHandlers = (key: string) => ({
    onMouseDown: () => setPressed(key),
    onMouseUp: () => setPressed(null),
    onMouseLeave: () => setPressed(null),
    onTouchStart: () => setPressed(key),
    onTouchEnd: () => setPressed(null),
    onTouchCancel: () => setPressed(null),
  });

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !selectedImage) handleClose(); }}
    >
      <div
        className="w-full max-w-[480px] bg-white rounded-t-[20px] overflow-hidden"
        style={{ animation: 'imgSearchSlideUp 0.3s cubic-bezier(0.25,0.46,0.45,0.94) forwards' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5EA]">
          <button
            onClick={handleClose}
            className="text-[15px] text-[#6E6E73] cursor-pointer whitespace-nowrap"
          >
            取消
          </button>
          <h3 className="text-[17px] font-semibold text-[#1D1D1F]">以图搜索</h3>
          <div className="w-10"></div>
        </div>

        {/* 未选择图片 */}
        {!selectedImage && (
          <div className="p-6">
            <div className="flex gap-4 justify-center mb-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                style={getPressStyle('camera')}
                {...pressHandlers('camera')}
                className="flex flex-col items-center gap-3 p-6 bg-[#F5F5F7] rounded-[16px] flex-1 max-w-[140px] cursor-pointer hover:bg-[#EBEBED] transition-colors border border-[#E5E5EA]"
              >
                <div className="w-14 h-14 flex items-center justify-center bg-[#1D1D1F] rounded-full">
                  <i className="ri-camera-line text-2xl text-white"></i>
                </div>
                <span className="text-[14px] text-[#1D1D1F] font-medium">拍照搜索</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={getPressStyle('album')}
                {...pressHandlers('album')}
                className="flex flex-col items-center gap-3 p-6 bg-[#F5F5F7] rounded-[16px] flex-1 max-w-[140px] cursor-pointer hover:bg-[#EBEBED] transition-colors border border-[#E5E5EA]"
              >
                <div className="w-14 h-14 flex items-center justify-center bg-[#1D1D1F] rounded-full">
                  <i className="ri-image-line text-2xl text-white"></i>
                </div>
                <span className="text-[14px] text-[#1D1D1F] font-medium">相册选择</span>
              </button>
            </div>
            <p className="text-center text-[13px] text-[#8E8E93]">
              拍照或上传家具图片，为您找到相似商品
            </p>
          </div>
        )}

        {/* 已选择图片 */}
        {selectedImage && (
          <div className="p-4">
            <div className="relative w-full h-[260px] rounded-[16px] overflow-hidden bg-[#F5F5F7] mb-4">
              <img
                src={selectedImage}
                alt="搜索图片"
                className="w-full h-full object-contain"
              />
              {isSearching && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center rounded-[16px]">
                  <div className="w-12 h-12 border-[3px] border-white/30 border-t-white rounded-full animate-spin mb-3"></div>
                  <span className="text-white text-[15px] font-medium">正在识别商品...</span>
                </div>
              )}
              {!isSearching && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-black/50 backdrop-blur-sm text-white text-[13px] rounded-full cursor-pointer whitespace-nowrap hover:bg-black/60 transition-colors"
                >
                  更换图片
                </button>
              )}
            </div>
            <p className="text-[13px] text-[#8E8E93] text-center mb-4">
              上传家具图片，为您找到相似商品
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedImage(null)}
                style={getPressStyle('reselect')}
                {...pressHandlers('reselect')}
                className="flex-1 py-3 bg-[#F5F5F7] rounded-[14px] text-[15px] font-medium text-[#1D1D1F] cursor-pointer whitespace-nowrap hover:bg-[#EBEBED] transition-colors border border-[#E5E5EA]"
              >
                重新选择
              </button>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                style={getPressStyle('search')}
                {...pressHandlers('search')}
                className="flex-1 py-3 bg-[#1D1D1F] rounded-[14px] text-[15px] font-medium text-white cursor-pointer whitespace-nowrap hover:bg-[#000000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? '搜索中...' : '开始搜索'}
              </button>
            </div>
          </div>
        )}

        {/* 底部安全区 */}
        <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}></div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      <style>{`
        @keyframes imgSearchSlideUp {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
