import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface UploadedImage {
  id: string;
  url: string;
}

export default function CustomPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [size, setSize] = useState('');
  const [material, setMaterial] = useState('');
  const [color, setColor] = useState('');
  const [note, setNote] = useState('');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 处理图片上传选项
  const handleActionSheetOption = (option: string) => {
    setShowActionSheet(false);
    if (option === 'camera') {
      // 模拟拍照
      setTimeout(() => {
        const newImage: UploadedImage = {
          id: Date.now().toString(),
          url: `https://readdy.ai/api/search-image?query=modern%20furniture%20design%20reference%20photo%2C%20clean%20product%20shot%2C%20professional%20photography&width=400&height=400&seq=custom-camera-${Date.now()}&orientation=squarish`
        };
        setUploadedImages([...uploadedImages, newImage]);
      }, 500);
    } else if (option === 'album') {
      // 模拟从相册选择
      setTimeout(() => {
        const newImage: UploadedImage = {
          id: Date.now().toString(),
          url: `https://readdy.ai/api/search-image?query=furniture%20design%20inspiration%20photo%2C%20interior%20design%20reference%2C%20professional%20photography&width=400&height=400&seq=custom-album-${Date.now()}&orientation=squarish`
        };
        setUploadedImages([...uploadedImages, newImage]);
      }, 500);
    }
  };

  // 删除图片
  const handleDeleteImage = (id: string) => {
    setUploadedImages(uploadedImages.filter(img => img.id !== id));
  };

  // 提交定制需求
  const handleSubmit = () => {
    if (!size && !material && !color) {
      return;
    }

    setIsSubmitting(true);

    // 模拟提交
    setTimeout(() => {
      setIsSubmitting(false);
      setShowToast(true);
      
      // 2秒后返回首页
      setTimeout(() => {
        setShowToast(false);
        navigate('/');
      }, 2000);
    }, 1000);
  };

  const canSubmit = size || material || color;

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-[calc(80px+env(safe-area-inset-bottom))]">
      {/* 顶部导航栏 */}
      <nav 
        className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="h-11 px-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
          >
            <i className="ri-arrow-left-line text-[22px] text-[#1C1C1E]"></i>
          </button>
          <h1 className="font-semibold text-[17px] text-[#1C1C1E]">个性定制</h1>
          <div className="w-8"></div>
        </div>
      </nav>

      {/* 主内容区域 */}
      <div 
        className="px-4 pt-4"
        style={{ marginTop: 'calc(44px + env(safe-area-inset-top))' }}
      >
        {/* 说明文案 */}
        <div className="mb-4">
          <p className="text-[15px] text-[#8E8E93] text-center">
            填写期望尺寸、材质或颜色，我们将为你定制
          </p>
        </div>

        {/* 表单卡片 */}
        <div className="bg-white rounded-[16px] overflow-hidden mb-4">
          {/* 期望尺寸 */}
          <div className="px-4 py-3 border-b border-[#E5E5EA]">
            <label className="block text-[14px] text-[#1C1C1E] font-medium mb-2">
              期望尺寸
            </label>
            <input
              type="text"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="如：长2m×宽0.9m×高0.8m"
              className="w-full h-11 bg-[#F2F2F7] rounded-[8px] px-3 text-[15px] text-[#1C1C1E] placeholder-[#C6C6C8] outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
            />
          </div>

          {/* 期望材质 */}
          <div className="px-4 py-3 border-b border-[#E5E5EA]">
            <label className="block text-[14px] text-[#1C1C1E] font-medium mb-2">
              期望材质
            </label>
            <input
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="如：科技布/真皮/金属"
              className="w-full h-11 bg-[#F2F2F7] rounded-[8px] px-3 text-[15px] text-[#1C1C1E] placeholder-[#C6C6C8] outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
            />
          </div>

          {/* 期望颜色 */}
          <div className="px-4 py-3">
            <label className="block text-[14px] text-[#1C1C1E] font-medium mb-2">
              期望颜色
            </label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="如：米白/深灰"
              className="w-full h-11 bg-[#F2F2F7] rounded-[8px] px-3 text-[15px] text-[#1C1C1E] placeholder-[#C6C6C8] outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
            />
          </div>
        </div>

        {/* 上传参考图片 */}
        <div className="bg-white rounded-[16px] p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[14px] text-[#1C1C1E] font-medium">参考图片</span>
            <span className="text-[12px] text-[#8E8E93]">选填</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {uploadedImages.map((img) => (
              <div key={img.id} className="relative aspect-square rounded-[8px] overflow-hidden bg-[#F2F2F7]">
                <img src={img.url} alt="参考图" className="w-full h-full object-cover" />
                <button 
                  onClick={() => handleDeleteImage(img.id)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors"
                >
                  <i className="ri-close-line text-white text-xs"></i>
                </button>
              </div>
            ))}
            
            {uploadedImages.length < 6 && (
              <button 
                onClick={() => setShowActionSheet(true)}
                className="aspect-square rounded-[8px] border-2 border-dashed border-[#C6C6C8] flex flex-col items-center justify-center cursor-pointer hover:border-[#FF6B35] hover:bg-[#FF6B35]/5 transition-all"
              >
                <i className="ri-add-line text-[24px] text-[#8E8E93] mb-1"></i>
                <span className="text-[10px] text-[#8E8E93]">上传</span>
              </button>
            )}
          </div>

          {uploadedImages.length > 0 && (
            <p className="text-[12px] text-[#8E8E93] mt-2">
              已上传 {uploadedImages.length}/6 张
            </p>
          )}
        </div>

        {/* 备注 */}
        <div className="bg-white rounded-[16px] p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[14px] text-[#1C1C1E] font-medium">备注说明</span>
            <span className="text-[12px] text-[#8E8E93]">选填</span>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="请输入其他需求或说明..."
            maxLength={500}
            className="w-full h-24 bg-[#F2F2F7] rounded-[8px] p-3 text-[14px] text-[#1C1C1E] placeholder-[#C6C6C8] resize-none outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
          />
          <p className="text-right text-[12px] text-[#8E8E93] mt-1">{note.length}/500</p>
        </div>

        {/* 温馨提示 */}
        <div className="bg-[#FFF7ED] rounded-[12px] p-3 mb-4">
          <div className="flex items-start gap-2">
            <i className="ri-information-line text-[#FF9500] text-[16px] mt-0.5"></i>
            <div className="flex-1">
              <p className="text-[13px] text-[#1C1C1E] mb-1 font-medium">温馨提示</p>
              <p className="text-[12px] text-[#8E8E93] leading-relaxed">
                提交后，我们的定制顾问将在24小时内与您联系，确认详细需求并提供报价方案
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 底部提交按钮 */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#E5E5EA] px-4 py-3"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className={`w-full h-12 rounded-[14px] text-[16px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
            canSubmit && !isSubmitting
              ? 'bg-white border border-[#D2D2D7] text-[#1D1D1F] active:bg-[#F5F5F7]'
              : 'bg-[#E5E5EA] text-[#8E8E93] border border-[#E5E5EA] cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <i className="ri-loader-4-line animate-spin"></i>
              提交中...
            </span>
          ) : (
            '提交定制需求'
          )}
        </button>
        <p className="text-center text-[12px] text-[#8E8E93] mt-2">
          至少填写一项需求信息
        </p>
      </div>

      {/* iOS Action Sheet */}
      {showActionSheet && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setShowActionSheet(false)}
          ></div>
          <div 
            className="fixed left-4 right-4 z-50 animate-slide-up"
            style={{ bottom: 'calc(12px + env(safe-area-inset-bottom))' }}
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-[14px] overflow-hidden mb-2">
              <button 
                onClick={() => handleActionSheetOption('camera')}
                className="w-full h-14 text-[17px] text-[#FF6B35] border-b border-[#E5E5EA] cursor-pointer hover:bg-[#F2F2F7] transition-colors"
              >
                拍摄
              </button>
              <button 
                onClick={() => handleActionSheetOption('album')}
                className="w-full h-14 text-[17px] text-[#FF6B35] cursor-pointer hover:bg-[#F2F2F7] transition-colors"
              >
                从相册选择
              </button>
            </div>
            <button 
              onClick={() => setShowActionSheet(false)}
              className="w-full h-14 bg-white/95 backdrop-blur-xl rounded-[14px] text-[17px] text-[#FF6B35] font-semibold cursor-pointer hover:bg-[#F2F2F7] transition-colors"
            >
              取消
            </button>
          </div>
        </>
      )}

      {/* 成功提示 Toast */}
      {showToast && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-black/80 backdrop-blur-sm rounded-[12px] px-6 py-4 min-w-[160px]">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-[#34C759] rounded-full flex items-center justify-center mb-3">
              <i className="ri-check-line text-white text-[24px]"></i>
            </div>
            <p className="text-white text-[15px] font-medium text-center">提交成功</p>
            <p className="text-white/80 text-[13px] text-center mt-1">我们将尽快与您联系</p>
          </div>
        </div>
      )}

      {/* 隐藏的文件输入 */}
      <input 
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
      />

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
