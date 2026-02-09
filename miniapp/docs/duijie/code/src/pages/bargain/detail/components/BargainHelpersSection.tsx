
import React from 'react';

interface Helper {
  id: number;
  name: string;
  avatar: string;
  cutAmount: number;
  time: number;
}

interface Props {
  helpers: Helper[];
}

/**
 * BargainHelpersSection renders a list of helpers who have assisted
 * with a bargain. It includes basic error handling to guard against
 * unexpected data shapes and ensures the component never crashes
 * due to malformed props.
 */
export default function BargainHelpersSection({ helpers }: Props) {
  // Defensive: ensure helpers is always an array
  const safeHelpers = Array.isArray(helpers) ? helpers : [];

  return (
    <div className="border-t border-[#E5E5EA]">
      <div className="px-4 py-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-[#1D1D1F] tracking-tight">
            帮砍记录
          </h3>
          <span className="text-[12px] text-[#86868B]">
            已帮砍 {safeHelpers.length}/50
          </span>
        </div>

        <div className="space-y-0">
          {safeHelpers.map((helper, index) => {
            // Guard against missing required fields
            const {
              id = index,
              name = '未知',
              avatar = '',
              cutAmount = 0,
              time = Date.now(),
            } = helper as Partial<Helper> as Helper;

            // Format the timestamp safely
            const formattedTime = (() => {
              try {
                return new Date(time).toLocaleString('zh-CN', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                });
              } catch {
                return '--';
              }
            })();

            return (
              <div key={id}>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#F5F5F7] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[13px] font-semibold text-[#6E6E73]">
                          {name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-[#1D1D1F]">
                        {name}
                      </div>
                      <div className="text-[11px] text-[#86868B] mt-0.5">
                        {formattedTime}
                      </div>
                    </div>
                  </div>

                  <div className="text-[15px] font-semibold text-[#1D1D1F] tracking-tight">
                    -¥{cutAmount}
                  </div>
                </div>

                {/* Divider between items, omitted after the last element */}
                {index < safeHelpers.length - 1 && (
                  <div className="ml-12 border-t border-[#E5E5EA]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
