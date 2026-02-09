const rules = [
  { icon: 'ri-scissors-cut-line', text: '每次砍价范围：¥50 ~ ¥200' },
  { icon: 'ri-group-line', text: '最多 50 人帮砍，每人限砍一次' },
  { icon: 'ri-timer-line', text: '砍价有效期 24 小时' },
  { icon: 'ri-shopping-bag-3-line', text: '砍到目标价即可下单购买' },
];

export default function BargainRulesSection() {
  return (
    <div className="border-t border-[#E5E5EA]">
      <div className="px-4 py-5">
        <h3 className="text-[15px] font-semibold text-[#1D1D1F] tracking-tight mb-4">
          砍价规则
        </h3>
        <div className="space-y-3">
          {rules.map((rule, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-[#F5F5F7] flex-shrink-0">
                {/* Icon font class */}
                <i className={`${rule.icon} text-[13px] text-[#6E6E73]`} />
              </div>
              <span className="text-[13px] text-[#6E6E73] leading-relaxed">
                {rule.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
