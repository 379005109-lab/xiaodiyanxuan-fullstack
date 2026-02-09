
import { useState, useRef } from 'react';
import type { UploadedImage } from '../page';

interface UploadStepProps {
  uploadedImages: UploadedImage[];
  setUploadedImages: (images: UploadedImage[]) => void;
}

const albumImages = [
  'https://readdy.ai/api/search-image?query=modern%20beige%20fabric%20sofa%20front%20view%20in%20bright%20studio%20setting%2C%20natural%20lighting%2C%20professional%20furniture%20photography%20with%20clean%20simple%20background&width=400&height=400&seq=wb-album-1&orientation=squarish',
  'https://readdy.ai/api/search-image?query=wooden%20dining%20table%20with%20smooth%20surface%20in%20studio%2C%20front%20angle%20view%2C%20professional%20furniture%20photography%20with%20clean%20simple%20background&width=400&height=400&seq=wb-album-2&orientation=squarish',
  'https://readdy.ai/api/search-image?query=comfortable%20gray%20velvet%20armchair%20front%20view%20in%20studio%2C%20professional%20furniture%20photography%20with%20clean%20simple%20background&width=400&height=400&seq=wb-album-3&orientation=squarish',
  'https://readdy.ai/api/search-image?query=minimalist%20bed%20frame%20with%20headboard%20front%20view%20in%20studio%2C%20professional%20furniture%20photography%20with%20clean%20simple%20background&width=400&height=400&seq=wb-album-4&orientation=squarish',
  'https://readdy.ai/api/search-image?query=modern%20glass%20top%20coffee%20table%20front%20view%20in%20studio%2C%20professional%20furniture%20photography%20with%20clean%20simple%20background&width=400&height=400&seq=wb-album-5&orientation=squarish',
  'https://readdy.ai/api/search-image?query=elegant%20wooden%20bookshelf%20with%20items%20front%20view%20in%20studio%2C%20professional%20furniture%20photography%20with%20clean%20simple%20background&width=400&height=400&seq=wb-album-6&orientation=squarish',
];

export default function UploadStep({ uploadedImages, setUploadedImages }: UploadStepProps) {
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [selectedAlbumImages, setSelectedAlbumImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Handle selection from the action sheet */
  const handleActionOption = (option: string) => {
    setShowActionSheet(false);
    if (option === 'camera') {
      const newImage: UploadedImage = {
        id: Date.now().toString(),
        url: `https://readdy.ai/api/search-image?query=modern%20furniture%20piece%20photographed%20from%20front%20angle%20in%20bright%20studio%2C%20clear%20product%20shot%20with%20good%20lighting%2C%20professional%20photography%20with%20simple%20background&width=600&height=600&seq=wb-cam-${Date.now()}&orientation=squarish`,
        name: `拍摄照片_${uploadedImages.length + 1}`,
      };
      setUploadedImages([...uploadedImages, newImage]);
    } else if (option === 'album') {
      setSelectedAlbumImages([]);
      setShowAlbumPicker(true);
    } else if (option === 'file') {
      fileInputRef.current?.click();
    }
  };

  /** Toggle selection of an album image */
  const toggleAlbumImage = (img: string) => {
    setSelectedAlbumImages((prev) =>
      prev.includes(img) ? prev.filter((i) => i !== img) : [...prev, img]
    );
  };

  /** Confirm selection from album picker */
  const handleAlbumConfirm = () => {
    const timestamp = Date.now();
    const newImages = selectedAlbumImages.map((url, idx) => ({
      id: `${timestamp}-${idx}`,
      url,
      name: `相册照片_${uploadedImages.length + idx + 1}`,
    }));
    setUploadedImages((prev) => [...prev, ...newImages]);
    setShowAlbumPicker(false);
    setSelectedAlbumImages([]);
  };

  /** Delete an uploaded image */
  const handleDeleteImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  /** Handle files selected via the hidden file input */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const timestamp = Date.now();
      const newImages: UploadedImage[] = Array.from(files).map((file, idx) => ({
        id: `${timestamp}-${idx}`,
        url: URL.createObjectURL(file),
        name: file.name,
      }));
      setUploadedImages((prev) => [...prev, ...newImages]);
    }
    // Reset the input so the same file can be selected again if needed
    e.target.value = '';
  };

  return (
    <div>
      {/* 提示信息 */}
      <div className="bg-[#FFF8F0] rounded-[12px] p-3 mb-4 flex items-start gap-2.5">
        <i className="ri-lightbulb-line text-[#FF9500] text-[18px] mt-0.5"></i>
        <div>
          <p className="text-[13px] text-[#1C1C1E] font-medium mb-0.5">上传产品照片</p>
          <p className="text-[12px] text-[#8E8E93]">
            支持上传1张或多张不同角度的产品照片，照片越多生成效果越好
          </p>
        </div>
      </div>

      {/* 已上传图片列表 */}
      {uploadedImages.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[15px] text-[#1C1C1E] font-medium">
              已上传 {uploadedImages.length} 张
            </span>
            <span className="text-[12px] text-[#8E8E93]">长按预览</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {uploadedImages.map((img) => (
              <div
                key={img.id}
                className="relative aspect-square rounded-[12px] overflow-hidden bg-[#F2F2F7] group"
                onContextMenu={(e) => {
                  e.preventDefault();
                  setPreviewImage(img.url);
                }}
              >
                <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                <button
                  onClick={() => handleDeleteImage(img.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <i className="ri-close-line text-white text-sm"></i>
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1.5">
                  <p className="text-[10px] text-white truncate">{img.name}</p>
                </div>
              </div>
            ))}

            {/* 添加更多按钮 */}
            <div
              onClick={() => setShowActionSheet(true)}
              className="aspect-square rounded-[12px] border-2 border-dashed border-[#C6C6C8] flex flex-col items-center justify-center cursor-pointer hover:border-[#FF9500] hover:bg-[#FF9500]/5 transition-all"
            >
              <i className="ri-add-line text-[24px] text-[#8E8E93]"></i>
              <span className="text-[11px] text-[#8E8E93] mt-1">继续添加</span>
            </div>
          </div>
        </div>
      )}

      {/* 空状态上传区域 */}
      {uploadedImages.length === 0 && (
        <div
          onClick={() => setShowActionSheet(true)}
          className="bg-white rounded-[16px] border-2 border-dashed border-[#C6C6C8] py-16 flex flex-col items-center justify-center cursor-pointer hover:border-[#FF9500] hover:bg-[#FF9500]/5 transition-all mb-4"
        >
          <div className="w-16 h-16 bg-[#FFF5F0] rounded-full flex items-center justify-center mb-4">
            <i className="ri-camera-line text-[28px] text-[#FF9500]"></i>
          </div>
          <p className="text-[15px] text-[#1C1C1E] font-medium mb-1">点击上传产品照片</p>
          <p className="text-[12px] text-[#8E8E93]">支持拍照、相册选择，可多张上传</p>
        </div>
      )}

      {/* 示例参考 */}
      <div className="bg-white rounded-[16px] p-4">
        <div className="flex items-center gap-2 mb-3">
          <i className="ri-image-2-line text-[#8E8E93] text-[16px]"></i>
          <span className="text-[14px] text-[#1C1C1E] font-medium">拍摄建议</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="aspect-square rounded-[8px] overflow-hidden bg-[#F2F2F7] mb-1.5">
              <img
                src="https://readdy.ai/api/search-image?query=furniture%20product%20photographed%20from%20front%20angle%20with%20good%20lighting%20and%20clean%20background%2C%20showing%20correct%20photography%20technique%20for%20product%20catalog%2C%20professional%20example%20photo&width=300&height=300&seq=wb-tip-good1&orientation=squarish"
                alt="正确示例"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center justify-center gap-1">
              <i className="ri-checkbox-circle-fill text-[#34C759] text-[12px]"></i>
              <span className="text-[11px] text-[#34C759]">光线充足</span>
            </div>
          </div>
          <div className="text-center">
            <div className="aspect-square rounded-[8px] overflow-hidden bg-[#F2F2F7] mb-1.5">
              <img
                src="https://readdy.ai/api/search-image?query=furniture%20product%20photographed%20with%20complete%20view%20showing%20all%20parts%20clearly%2C%20no%20obstruction%2C%20clean%20background%2C%20professional%20product%20photography%20example&width=300&height=300&seq=wb-tip-good2&orientation=squarish"
                alt="正确示例"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center justify-center gap-1">
              <i className="ri-checkbox-circle-fill text-[#34C759] text-[12px]"></i>
              <span className="text-[11px] text-[#34C759]">主体完整</span>
            </div>
          </div>
          <div className="text-center">
            <div className="aspect-square rounded-[8px] overflow-hidden bg-[#F2F2F7] mb-1.5">
              <img
                src="https://readdy.ai/api/search-image?query=furniture%20product%20photographed%20in%20dark%20environment%20with%20poor%20lighting%20and%20cluttered%20background%2C%20showing%20incorrect%20photography%20technique%2C%20bad%20example%20photo&width=300&height=300&seq=wb-tip-bad1&orientation=squarish"
                alt="错误示例"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center justify-center gap-1">
              <i className="ri-close-circle-fill text-[#FF3B30] text-[12px]"></i>
              <span className="text-[11px] text-[#FF3B30]">避免遮挡</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Sheet */}
      {showActionSheet && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowActionSheet(false)}></div>
          <div
            className="fixed left-4 right-4 z-50 animate-slide-up"
            style={{ bottom: 'calc(12px + env(safe-area-inset-bottom))' }}
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-[14px] overflow-hidden mb-2">
              <button
                onClick={() => handleActionOption('camera')}
                className="w-full h-14 text-[17px] text-[#FF9500] border-b border-[#E5E5EA] cursor-pointer hover:bg-[#F2F2F7] transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-camera-line text-[20px]"></i>
                拍摄
              </button>
              <button
                onClick={() => handleActionOption('album')}
                className="w-full h-14 text-[17px] text-[#FF9500] border-b border-[#E5E5EA] cursor-pointer hover:bg-[#F2F2F7] transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-image-line text-[20px]"></i>
                从相册选择
              </button>
              <button
                onClick={() => handleActionOption('file')}
                className="w-full h-14 text-[17px] text-[#FF9500] cursor-pointer hover:bg-[#F2F2F7] transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-folder-line text-[20px]"></i>
                从文件选择
              </button>
            </div>
            <button
              onClick={() => setShowActionSheet(false)}
              className="w-full h-14 bg-white/95 backdrop-blur-xl rounded-[14px] text-[17px] text-[#FF9500] font-semibold cursor-pointer hover:bg-[#F2F2F7] transition-colors"
            >
              取消
            </button>
          </div>
        </>
      )}

      {/* 相册选择器 */}
      {showAlbumPicker && (
        <div className="fixed inset-0 z-50 bg-[#F2F2F7]">
          <nav
            className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA]"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <div className="h-11 px-4 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowAlbumPicker(false);
                  setSelectedAlbumImages([]);
                }}
                className="text-[17px] text-[#FF9500] cursor-pointer"
              >
                取消
              </button>
              <h1 className="font-semibold text-[17px] text-[#1C1C1E]">选择照片</h1>
              <button
                onClick={handleAlbumConfirm}
                disabled={selectedAlbumImages.length === 0}
                className={`text-[17px] font-semibold cursor-pointer ${
                  selectedAlbumImages.length > 0 ? 'text-[#FF9500]' : 'text-[#C6C6C8]'
                }`}
              >
                完成({selectedAlbumImages.length})
              </button>
            </div>
          </nav>
          <div className="px-1 pt-2" style={{ marginTop: 'calc(44px + env(safe-area-inset-top))' }}>
            <div className="px-3 py-2 mb-2">
              <p className="text-[12px] text-[#8E8E93]">可选择多张照片</p>
            </div>
            <div className="grid grid-cols-3 gap-0.5">
              {albumImages.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleAlbumImage(img)}
                  className={`relative aspect-square cursor-pointer ${
                    selectedAlbumImages.includes(img) ? 'ring-2 ring-[#FF9500] ring-inset' : ''
                  }`}
                >
                  <img src={img} alt={`相册${idx + 1}`} className="w-full h-full object-cover" />
                  {selectedAlbumImages.includes(img) && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-[#FF9500] rounded-full flex items-center justify-center">
                      <span className="text-[11px] text-white font-bold">
                        {selectedAlbumImages.indexOf(img) + 1}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 图片预览 */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          onClick={() => setPreviewImage(null)}
        >
          <img src={previewImage} alt="预览" className="max-w-full max-h-full object-contain" />
          <button
            className="absolute top-12 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center cursor-pointer"
            onClick={() => setPreviewImage(null)}
          >
            <i className="ri-close-line text-white text-[20px]"></i>
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
