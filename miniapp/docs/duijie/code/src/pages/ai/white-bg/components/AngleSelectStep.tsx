
import type { AngleOption } from '../page';

interface AngleSelectStepProps {
  angles: AngleOption[];
  toggleAngle: (id: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  creditsCost: number;
  userCredits: number;
}

export default function AngleSelectStep({
  angles,
  toggleAngle,
  description,
  setDescription,
  creditsCost,
  userCredits,
}: AngleSelectStepProps) {
  const selectedCount = angles.filter((a) => a.selected).length;

  return (
    <div>
      {/* 提示 */}
      <div className="bg-[#FFF8F0] rounded-[12px] p-3 mb-4 flex items-start gap-2.5">
        <i className="ri-information-line text-[#FF9500] text-[18px] mt-0.5"></i>
        <div>
          <p className="text-[13px] text-[#1C1C1E] font-medium mb-0.5">
            选择需要生成的角度
          </p>
          <p className="text-[12px] text-[#8E8E93]">
            勾选需要的角度，每个角度将生成一张白底图，参考图例了解各角度效果
          </p>
        </div>
      </div>

      {/* 角度选择卡片 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[15px] text-[#1C1C1E] font-medium">拍摄角度</span>
          <span className="text-[13px] text-[#8E8E93]">
            已选 {selectedCount} 个角度
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {angles.map((angle) => (
            <div
              key={angle.id}
              onClick={() => toggleAngle(angle.id)}
              className={`relative bg-white rounded-[14px] overflow-hidden cursor-pointer transition-all ${
                angle.selected
                  ? 'ring-2 ring-[#FF9500] shadow-[0_2px_12px_rgba(255,149,0,0.15)]'
                  : 'hover:shadow-md'
              }`}
            >
              {/* 图例 */}
              <div className="relative aspect-[4/3] bg-[#FAFAFA] overflow-hidden">
                <img
                  src={angle.image}
                  alt={angle.name}
                  className="w-full h-full object-cover"
                />
                {/* 选中标记 */}
                <div
                  className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    angle.selected
                      ? 'bg-[#FF9500]'
                      : 'bg-white/80 border-2 border-[#D1D1D6]'
                  }`}
                >
                  {angle.selected && (
                    <i className="ri-check-line text-white text-[13px]"></i>
                  )}
                </div>
                {/* 角度图标 */}
                <div
                  className={`absolute bottom-2 left-2 w-7 h-7 rounded-full flex items-center justify-center ${
                    angle.selected ? 'bg-[#FF9500]/90' : 'bg-black/40'
                  }`}
                >
                  <i className={`${angle.icon} text-white text-[14px]`}></i>
                </div>
              </div>

              {/* 信息 */}
              <div className="p-3">
                <p
                  className={`text-[14px] font-medium mb-0.5 ${
                    angle.selected ? 'text-[#FF9500]' : 'text-[#1C1C1E]'
                  }`}
                >
                  {angle.name}
                </p>
                <p className="text-[11px] text-[#8E8E93]">{angle.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            angles.forEach((a) => {
              if (!a.selected) toggleAngle(a.id);
            });
          }}
          className="flex-1 h-9 bg-white rounded-full text-[13px] text-[#1C1C1E] font-medium cursor-pointer hover:bg-[#F2F2F7] transition-colors whitespace-nowrap"
        >
          全选
        </button>
        <button
          onClick={() => {
            angles.forEach((a) => {
              if (a.selected) toggleAngle(a.id);
            });
          }}
          className="flex-1 h-9 bg-white rounded-full text-[13px] text-[#1C1C1E] font-medium cursor-pointer hover:bg-[#F2F2F7] transition-colors whitespace-nowrap"
        >
          清空
        </button>
        <button
          onClick={() => {
            const recommended = ['front', '45deg', 'side'];
            angles.forEach((a) => {
              const shouldSelect = recommended.includes(a.id);
              if (shouldSelect !== a.selected) toggleAngle(a.id);
            });
          }}
          className="flex-1 h-9 bg-[#FFF5F0] rounded-full text-[13px] text-[#FF9500] font-medium cursor-pointer hover:bg-[#FFEAD9] transition-colors whitespace-nowrap"
        >
          推荐组合
        </button>
      </div>

      {/* 描述备注 */}
      <div className="bg-white rounded-[16px] p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <i className="ri-pencil-line text-[#8E8E93] text-[16px]"></i>
          <span className="text-[14px] text-[#1C1C1E] font-medium">补充描述</span>
          <span className="text-[12px] text-[#8E8E93]">（选填）</span>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="描述产品特征或特殊要求，如：需要展示产品细节纹理、保持原有颜色..."
          maxLength={500}
          className="w-full h-20 bg-[#F2F2F7] rounded-[10px] p-3 text-[14px] text-[#1C1C1E] placeholder-[#C6C6C8] resize-none outline-none focus:ring-2 focus:ring-[#FF9500]/30 transition-all"
        />
        <p className="text-right text-[12px] text-[#8E8E93] mt-1">
          {description.length}/500
        </p>
      </div>

      {/* 积分消耗预览 */}
      <div className="bg-white rounded-[16px] p-4">
        <div className="flex items-center gap-2 mb-3">
          <i className="ri-coin-line text-[#FF9500] text-[16px]"></i>
          <span className="text-[14px] text-[#1C1C1E] font-medium">积分消耗</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#8E8E93]">选择角度数</span>
            <span className="text-[13px] text-[#1C1C1E]">{selectedCount} 个</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#8E8E93]">单张消耗</span>
            <span className="text-[13px] text-[#1C1C1E]">20 积分</span>
          </div>
          <div className="h-px bg-[#E5E5EA]"></div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#1C1C1E] font-medium">合计消耗</span>
            <span className="text-[16px] text-[#FF9500] font-semibold">
              {creditsCost} 积分
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#8E8E93]">当前余额</span>
            <span
              className={`text-[13px] font-medium ${
                userCredits >= creditsCost ? 'text-[#34C759]' : 'text-[#FF3B30]'
              }`}
            >
              {userCredits} 积分
              {userCredits < creditsCost && ' (余额不足)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
