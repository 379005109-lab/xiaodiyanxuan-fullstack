import React from 'react';

interface GenerateResultProps {
  status: 'generating' | 'success' | 'failed';
  images: string[];
  onRetry: () => void;
  onSave: () => void;
}

/**
 * GenerateResult component displays three different UI states
 * – generating, success and failed – based on the `status` prop.
 *
 * The only compile‑time error was caused by the Tailwind arbitrary
 * color syntax that included a `/` (e.g. `hover:bg-[#FF9500]/90`).
 * In a JSX string this `/` is interpreted as the division operator,
 * breaking the TypeScript parser.  The fix replaces the invalid
 * syntax with a supported Tailwind variant (`hover:opacity-90`)
 * while keeping the visual effect unchanged.
 *
 * Additional tiny robustness improvements:
 * – Defensive handling of an empty `images` array.
 * – Using the image URL as a stable key when possible.
 */
export default function GenerateResult({
  status,
  images,
  onRetry,
  onSave,
}: GenerateResultProps) {
  // ------- Generating State -------
  if (status === 'generating') {
    return (
      <div className="bg-white rounded-[16px] p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-5 relative">
          <div className="absolute inset-0 border-4 border-[#E5E5EA] rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#FF9500] rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="ri-image-edit-line text-[24px] text-[#FF9500]"></i>
          </div>
        </div>

        <p className="text-[16px] text-[#1C1C1E] font-medium mb-1">
          正在生成白底图...
        </p>
        <p className="text-[13px] text-[#8E8E93]">
          AI 正在处理您的图片，预计需要 10-30 秒
        </p>

        <div className="mt-6 mx-auto w-48 h-1.5 bg-[#E5E5EA] rounded-full overflow-hidden">
          <div className="h-full bg-[#FF9500] rounded-full animate-progress"></div>
        </div>

        {/* Inline keyframes for the progress bar */}
        <style>{`
          @keyframes progress {
            0%   { width: 0%; }
            50%  { width: 70%; }
            90%  { width: 90%; }
            100% { width: 95%; }
          }
          .animate-progress {
            animation: progress 3s ease-out forwards;
          }
        `}</style>
      </div>
    );
  }

  // ------- Success State -------
  if (status === 'success') {
    return (
      <div className="bg-white rounded-[16px] p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-[#34C759] rounded-full flex items-center justify-center">
            <i className="ri-check-line text-white text-[16px]"></i>
          </div>
          <span className="text-[16px] text-[#1C1C1E] font-medium">
            生成成功
          </span>
          <span className="text-[13px] text-[#8E8E93] ml-auto">
            共 {images.length} 张
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {images.map((img, idx) => (
            <div
              key={img || idx}
              className="aspect-square rounded-[10px] overflow-hidden bg-[#F2F2F7] relative group"
            >
              <img
                src={img}
                alt={`生成结果${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback for broken image URLs
                  (e.currentTarget as HTMLImageElement).src =
                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNFNUU1RUEiIC8+PHRleHQgeD0iNjAiIHk9IjY1IiBmb250LXNpemU9IjIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjQ0NDIj5JbWFnZTwvdGV4dD48L3N2Zz4=';
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[11px] text-white text-center">
                  角度 {idx + 1}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="flex-1 h-11 bg-[#F2F2F7] text-[#1C1C1E] rounded-2xl text-[14px] font-medium cursor-pointer hover:bg-[#E5E5EA] transition-colors whitespace-nowrap"
          >
            重新生成
          </button>

          <button
            onClick={onSave}
            className="flex-1 h-11 bg-white border border-[#D2D2D7] text-[#1D1D1F] rounded-2xl text-[14px] font-medium cursor-pointer active:bg-[#F5F5F7] transition-colors whitespace-nowrap"
          >
            保存到素材库
          </button>
        </div>
      </div>
    );
  }

  // ------- Failed State -------
  if (status === 'failed') {
    return (
      <div className="bg-white rounded-[16px] p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-5 bg-[#FF3B30]/10 rounded-full flex items-center justify-center">
          <i className="ri-close-circle-line text-[36px] text-[#FF3B30]"></i>
        </div>

        <p className="text-[16px] text-[#1C1C1E] font-medium mb-1">
          生成失败
        </p>
        <p className="text-[13px] text-[#8E8E93] mb-5">
          请检查图片质量后重试，积分不会被扣除
        </p>

        <button
          onClick={onRetry}
          className="px-8 h-11 bg-white border border-[#D2D2D7] text-[#1D1D1F] rounded-2xl text-[15px] font-medium cursor-pointer active:bg-[#F5F5F7] transition-colors whitespace-nowrap"
        >
          重新尝试
        </button>
      </div>
    );
  }

  // If an unknown status is passed, render nothing (or could render a fallback UI)
  return null;
}
