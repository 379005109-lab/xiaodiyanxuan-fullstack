
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockUser } from '../../../mocks/user';

export default function AvatarPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentAvatar, setCurrentAvatar] = useState(mockUser.avatar);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleChangeAvatar = () => {
    setShowActionSheet(true);
  };

  const handleTakePhoto = () => {
    setShowActionSheet(false);
    setShowPermissionDialog(true);
  };

  const handleChooseFromAlbum = () => {
    setShowActionSheet(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      simulateUpload(file);
    }
  };

  const simulateUpload = (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setUploading(false);
              setCurrentAvatar(e.target?.result as string);
              setShowSuccessToast(true);
              setTimeout(() => setShowSuccessToast(false), 2000);
            }, 300);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* 导航栏 */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
        <div className="h-11 flex items-center justify-between px-4">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center active:scale-95 transition-transform"
          >
            <i className="ri-arrow-left-s-line text-xl text-[#1D1D1F]"></i>
          </button>
          <span className="text-base font-medium text-[#1D1D1F]">更换头像</span>
          <div className="w-8"></div>
        </div>
      </div>

      {/* 头像预览 */}
      <div className="flex flex-col items-center pt-12 pb-8">
        <div className="relative">
          <img
            src={currentAvatar}
            alt="头像"
            className="w-32 h-32 rounded-full object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
              <div className="text-white text-sm font-medium">{uploadProgress}%</div>
            </div>
          )}
        </div>
        <button
          onClick={handleChangeAvatar}
          disabled={uploading}
          className="mt-8 px-8 h-11 bg-[#1D1D1F] text-white text-sm font-medium rounded-full active:scale-95 transition-transform disabled:opacity-50"
        >
          {uploading ? '上传中...' : '更换头像'}
        </button>
      </div>

      {/* 提示信息 */}
      <div className="mx-4 mt-6 p-4 bg-white rounded-2xl">
        <div className="flex items-start gap-3">
          <i className="ri-information-line text-lg text-[#1D1D1F] mt-0.5"></i>
          <div className="flex-1">
            <p className="text-sm text-[#1D1D1F] font-medium mb-2">头像要求</p>
            <ul className="space-y-1 text-xs text-[#6E6E73]">
              <li>• 支持 JPG、PNG 格式</li>
              <li>• 文件大小不超过 5MB</li>
              <li>• 建议使用正方形图片</li>
              <li>• 建议尺寸 500x500 像素以上</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 上传进度条 */}
      {uploading && (
        <div className="fixed bottom-20 left-4 right-4 bg-white rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#1D1D1F]">上传中</span>
            <span className="text-sm text-[#6E6E73]">{uploadProgress}%</span>
          </div>
          <div className="h-1 bg-[#E5E5EA] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1D1D1F] transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* ActionSheet */}
      {showActionSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setShowActionSheet(false)}
        >
          <div className="absolute inset-0 bg-black/30"></div>
          <div
            className="relative w-full bg-white rounded-t-[20px] pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-2 pb-3">
              <div className="w-9 h-1 bg-[#E5E5EA] rounded-full"></div>
            </div>
            <button
              onClick={handleTakePhoto}
              className="w-full h-14 text-[#1D1D1F] text-base font-medium border-b border-[#E5E5EA] active:bg-[#F5F5F7] transition-colors"
            >
              拍照
            </button>
            <button
              onClick={handleChooseFromAlbum}
              className="w-full h-14 text-[#1D1D1F] text-base font-medium active:bg-[#F5F5F7] transition-colors"
            >
              从相册选择
            </button>
            <div className="h-2 bg-[#F5F5F7]"></div>
            <button
              onClick={() => setShowActionSheet(false)}
              className="w-full h-14 text-[#1D1D1F] text-base font-medium active:bg-[#F5F5F7] transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 权限弹窗 */}
      {showPermissionDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowPermissionDialog(false)}></div>
          <div className="relative w-full max-w-xs bg-white rounded-[20px] overflow-hidden">
            <div className="p-6 text-center">
              <i className="ri-camera-line text-4xl text-[#1D1D1F] mb-4"></i>
              <h3 className="text-base font-medium text-[#1D1D1F] mb-2">需要相机权限</h3>
              <p className="text-sm text-[#6E6E73]">
                请在系统设置中允许访问相机
              </p>
            </div>
            <div className="border-t border-[#E5E5EA]">
              <button
                onClick={() => setShowPermissionDialog(false)}
                className="w-full h-11 text-[#1D1D1F] text-base font-medium active:bg-[#F5F5F7] transition-colors"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 成功提示 */}
      {showSuccessToast && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-[#1D1D1F]/90 backdrop-blur-sm text-white px-6 py-3 rounded-2xl text-sm flex items-center gap-2">
            <i className="ri-check-line text-lg"></i>
            <span>头像更换成功</span>
          </div>
        </div>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
