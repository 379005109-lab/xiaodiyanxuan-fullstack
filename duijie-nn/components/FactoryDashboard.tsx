
import React, { useState, useMemo } from 'react';
import { Manufacturer, PartnerInfo, FactoryStats, Product, ProductOrigin } from '../types';
import { PRODUCTS, CATEGORIES } from '../constants';
import { Button } from './ui/Button';

interface Props {
  manufacturer: Manufacturer;
  onBack: () => void;
  onManageInventory: () => void;
}

const MOCK_STATS: FactoryStats = {
  totalSales: 1284500,
  activeMerchants: 24,
  activeDesigners: 156,
  productCount: 1248,
  monthlyGrowth: 12.5
};

const MOCK_PARTNERS: PartnerInfo[] = [
  { id: 'p1', name: '极简空间上海分部', type: 'merchant', authDate: '2023-12-01', productCount: 45, salesVolume: 320000, status: 'active', avatar: 'https://i.pravatar.cc/150?u=p1' },
  { id: 'p2', name: '王木木设计师工作室', type: 'designer', authDate: '2024-01-15', productCount: 12, salesVolume: 85000, status: 'active', avatar: 'https://i.pravatar.cc/150?u=p2' },
];

export const FactoryDashboard: React.FC<Props> = ({ manufacturer, onBack, onManageInventory }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'partners' | 'designers'>('overview');
  const [selectedPartner, setSelectedPartner] = useState<PartnerInfo | null>(null);
  const [metricDetail, setMetricDetail] = useState<string | null>(null);

  // 授权池配置状态
  const [poolConfigs, setPoolConfigs] = useState<Record<string, { discount: number, commission: number }>>({
    'p1': { discount: 65, commission: 25 },
    'p2': { discount: 60, commission: 30 },
    'p3': { discount: 70, commission: 20 },
    'p4': { discount: 65, commission: 25 }
  });

  const handleUpdatePool = (prodId: string, field: 'discount' | 'commission', val: number) => {
    setPoolConfigs(prev => ({
      ...prev,
      [prodId]: { ...prev[prodId], [field]: val }
    }));
  };

  const renderMetricDetail = () => {
    switch(metricDetail) {
      case 'gmv':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end px-2"><p className="text-gray-400 font-black uppercase tracking-widest text-[10px] italic">GMV 成交趋势分析 (半年视图)</p><p className="text-emerald-600 font-black text-sm bg-emerald-50 px-3 py-1 rounded-full">+12.5% 较上月增长</p></div>
            <div className="h-72 flex items-end justify-between gap-6 px-6 border-b border-gray-100 pb-2">
               {[35, 55, 40, 75, 65, 90, 85].map((h, i) => (
                 <div key={i} className="flex-grow bg-emerald-100/50 rounded-t-2xl transition-all hover:bg-emerald-500 cursor-pointer relative group" style={{ height: `${h}%` }}>
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-2xl z-20">¥{(h*10000).toLocaleString()}</div>
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-black text-gray-400 uppercase tracking-tighter whitespace-nowrap">{i === 6 ? '本月' : `${i+1}月`}</div>
                 </div>
               ))}
            </div>
            <div className="pt-8 grid grid-cols-2 gap-4">
               <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100"><p className="text-[9px] font-black text-gray-400 uppercase mb-2">平均客单价 (元)</p><p className="text-2xl font-black text-gray-900">¥12,450</p></div>
               <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100"><p className="text-[9px] font-black text-gray-400 uppercase mb-2">转化率 (CR %)</p><p className="text-2xl font-black text-gray-900">18.2%</p></div>
            </div>
          </div>
        );
      case 'merchant':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <p className="text-gray-400 font-black uppercase tracking-widest text-[10px] px-2 italic mb-4">合作渠道商贡献分布排行</p>
            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
               {MOCK_PARTNERS.concat(MOCK_PARTNERS).map((p, idx) => (
                <div key={`${p.id}-${idx}`} className="p-6 bg-white rounded-[2.5rem] border border-gray-100 flex justify-between items-center group hover:border-[#153e35]/30 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-6">
                     <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-400 text-xs">0{idx+1}</div>
                     <img src={p.avatar} className="w-14 h-14 rounded-2xl shadow-sm border-2 border-white" />
                     <div><p className="font-black text-sm text-gray-900">{p.name}</p><p className="text-[10px] text-gray-400 font-black mt-1 uppercase tracking-widest">已授权 {p.productCount} 款资产</p></div>
                  </div>
                  <div className="text-right">
                     <p className="text-sm font-black text-emerald-600">¥{p.salesVolume.toLocaleString()}</p>
                     <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic mt-1">累计贡献值</p>
                  </div>
                </div>
               ))}
            </div>
          </div>
        );
      case 'designer':
        return (
          <div className="grid grid-cols-2 gap-8 animate-in fade-in duration-500">
             <div className="p-8 bg-[#153e35] rounded-[3rem] text-white shadow-2xl flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-2 italic">本月活跃设计师</p>
                <p className="text-6xl font-black">156</p>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-6 bg-white/10 px-4 py-1.5 rounded-full">较上月 +24%</p>
             </div>
             <div className="p-8 bg-blue-50 rounded-[3rem] border border-blue-100 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 italic">用户黏性 (Retention)</p>
                <p className="text-6xl font-black text-blue-600">82%</p>
                <div className="w-full h-2 bg-white rounded-full mt-6 overflow-hidden shadow-inner"><div className="h-full bg-blue-400" style={{ width: '82%' }} /></div>
             </div>
             <div className="col-span-2 bg-gray-50 p-10 rounded-[3rem] border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 text-center italic underline underline-offset-8 decoration-emerald-200">设计师等级与产值结构</p>
                <div className="space-y-6">
                   {[
                      { label: '战略顾问级', count: 45, color: 'bg-[#153e35]' },
                      { label: '资深独立工作室', count: 88, color: 'bg-emerald-500' },
                      { label: '新晋合作设计师', count: 23, color: 'bg-emerald-200' }
                   ].map(lvl => (
                      <div key={lvl.label} className="space-y-2">
                         <div className="flex justify-between text-[11px] font-black uppercase tracking-widest"><span>{lvl.label}</span><span className="text-gray-900">{lvl.count} 位</span></div>
                         <div className="h-2 w-full bg-white rounded-full overflow-hidden shadow-inner"><div className={`h-full ${lvl.color} transition-all duration-1000`} style={{ width: `${(lvl.count/156)*100}%` }} /></div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        );
      case 'sku':
        return (
           <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between font-black text-[10px] text-gray-400 uppercase tracking-widest italic px-2"><span>资产类目覆盖度 (SKU Coverage)</span><span>权重占比</span></div>
              <div className="space-y-6">
                {CATEGORIES.map((c, i) => {
                  const percentage = [45, 30, 15, 10][i] || Math.round(Math.random()*20 + 5);
                  return (
                    <div key={c.id} className="space-y-2">
                      <div className="flex justify-between text-xs font-black">
                        <span className="flex items-center gap-2 italic">
                          <span className="w-2 h-2 rounded-full bg-orange-400 shadow-sm" />
                          {c.name}
                        </span>
                        <span className="text-orange-600 font-black">{percentage}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-orange-400 transition-all duration-1000" style={{ width: `${percentage}%` }} /></div>
                    </div>
                  )
                })}
              </div>
              <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 text-center">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">全库库存健康值</p>
                 <p className="text-3xl font-black text-[#153e35]">94.5%</p>
                 <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-2 italic">核心爆款备货充足</p>
              </div>
           </div>
        );
      default: return null;
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto pb-24 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-16 px-4">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 bg-white rounded-[2rem] border shadow-2xl p-4 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
            <img src={manufacturer.logo} alt={manufacturer.name} className="w-full h-full object-contain" />
          </div>
          <div><h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-none mb-1">数字化经营看板</h2><p className="text-gray-400 font-bold uppercase tracking-widest flex items-center gap-4">{manufacturer.name} <span className="w-1 h-1 bg-gray-300 rounded-full"></span> 全量资产监控与通路分析</p></div>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={onBack} className="rounded-2xl px-8 py-4 font-black text-xs tracking-widest uppercase">返回厂家中心</Button>
          <Button onClick={onManageInventory} className="rounded-2xl px-12 py-4 bg-[#153e35] shadow-xl font-black uppercase tracking-widest text-xs">全库商品资产管理</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 px-4">
        {[
          { id: 'gmv', label: '累计结算GMV (¥)', value: MOCK_STATS.totalSales.toLocaleString(), color: 'text-emerald-600', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2' },
          { id: 'merchant', label: '合作商户数 (户)', value: MOCK_STATS.activeMerchants, color: 'text-blue-600', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2' },
          { id: 'designer', label: '活跃设计师 (人)', value: MOCK_STATS.activeDesigners, color: 'text-[#153e35]', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0' },
          { id: 'sku', label: '全库商品SKU (款)', value: MOCK_STATS.productCount.toLocaleString(), color: 'text-orange-600', icon: 'M20 7l-8-4-8 4m16 0l-8 4' },
        ].map((stat) => (
          <div key={stat.id} onClick={() => setMetricDetail(stat.id)} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-gray-50 rounded-full opacity-50 group-hover:scale-125 transition-transform" />
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-gray-50 ${stat.color} relative z-10 shadow-sm group-hover:bg-white transition-all`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={stat.icon} /></svg>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10 italic">{stat.label}</p>
            <p className={`text-4xl font-black leading-none ${stat.color} relative z-10 tracking-tighter`}>{stat.value}</p>
            <div className="absolute bottom-6 right-8 text-[10px] font-black text-gray-200 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all italic">点击展开明细</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[4rem] border shadow-2xl overflow-hidden flex flex-col mx-4">
        <nav className="flex px-12 py-8 gap-12 border-b bg-white">
           {['overview', 'partners', 'designers'].map((t, idx) => (
             <button key={t} onClick={() => setActiveTab(t as any)} className={`py-2 border-b-4 transition-all font-black text-sm uppercase tracking-widest ${activeTab === t ? 'border-[#153e35] text-[#153e35]' : 'border-transparent text-gray-300'}`}>
                {idx === 0 ? '① 指标趋势概览' : idx === 1 ? '② 渠道商准入管控' : '③ 垂直分成体系'}
             </button>
           ))}
        </nav>
        <div className="p-12 flex-grow bg-[#fcfdfd] min-h-[500px]">
           {activeTab === 'partners' ? (
              <div className="grid grid-cols-1 gap-6">
                 {MOCK_PARTNERS.map(partner => (
                    <div key={partner.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 flex items-center justify-between shadow-sm hover:shadow-xl transition-all group">
                       <div className="flex items-center gap-8"><img src={partner.avatar} className="w-20 h-20 rounded-[1.5rem] object-cover shadow-md border-4 border-white" /><div className="min-w-0"><h5 className="text-xl font-black text-gray-900 leading-none mb-2">{partner.name}</h5><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{partner.type} • 累计成交流水 ¥{partner.salesVolume.toLocaleString()}</p></div></div>
                       <Button onClick={() => setSelectedPartner(partner)} variant="outline" className="rounded-2xl px-12 py-4 font-black text-xs uppercase tracking-widest border-2 hover:bg-[#153e35] hover:text-white transition-all shadow-sm">配置专属授权池</Button>
                    </div>
                 ))}
              </div>
           ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-30 py-20 text-center">
                 <div className="w-24 h-24 bg-gray-100 rounded-[2rem] flex items-center justify-center text-gray-300 mb-8 border-2 border-dashed border-gray-200">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                 </div>
                 <p className="text-xl font-black uppercase tracking-widest text-gray-400">请切换至“渠道商准入管控”<br/><span className="text-xs mt-2 block opacity-50">进行资产分销授权与价格链条设定</span></p>
              </div>
           )}
        </div>
      </div>

      {/* 指标详情模态框 (GMV/商户/SKU详情画面) */}
      {metricDetail && (
         <div className="fixed inset-0 z-[300] flex items-center justify-center p-8">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={() => setMetricDetail(null)} />
            <div className="relative w-full max-w-2xl bg-white rounded-[3.5rem] p-12 shadow-2xl animate-in zoom-in duration-300">
               <div className="flex justify-between items-center mb-12 shrink-0 border-b pb-8 border-gray-100"><h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">经营指标深度洞察</h3><button onClick={() => setMetricDetail(null)} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-500 active:scale-95 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M6 18L18 6"/></svg></button></div>
               <div className="overflow-hidden">
                  {renderMetricDetail()}
               </div>
               <div className="mt-16 flex justify-center"><Button onClick={() => setMetricDetail(null)} className="rounded-[2.5rem] px-24 py-5 bg-[#153e35] text-white font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all">返回概览面板</Button></div>
            </div>
         </div>
      )}

      {/* 专属授权池配置 (透出结算价、返佣金额的人民币换算) */}
      {selectedPartner && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in" onClick={() => setSelectedPartner(null)} />
          <div className="relative w-full max-w-[1240px] bg-white rounded-[4rem] shadow-2xl h-[88vh] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
            <div className="p-12 border-b flex justify-between items-center shrink-0 bg-white z-10 shadow-sm">
               <div className="flex items-center gap-8"><img src={selectedPartner.avatar} className="w-20 h-20 rounded-[1.5rem] shadow-2xl border-4 border-white" /><div><h3 className="text-4xl font-black text-gray-900 leading-none mb-2">[{selectedPartner.name}] 专属资产分销授权</h3><p className="text-[10px] text-gray-400 font-black uppercase tracking-widest italic underline underline-offset-4 decoration-emerald-500">直接管控结算价格与预计返佣流转金额</p></div></div>
               <button onClick={() => setSelectedPartner(null)} className="w-16 h-16 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-400 hover:text-red-500 transition-all active:scale-90"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M6 18L18 6" /></svg></button>
            </div>
            <div className="flex-grow overflow-y-auto p-12 custom-scrollbar space-y-6 bg-gray-50/20">
               {PRODUCTS.map(prod => {
                  const config = poolConfigs[prod.id] || { discount: 65, commission: 25 };
                  const settlementPrice = Math.round(prod.minPrice * (config.discount / 100));
                  const commissionAmount = Math.round(prod.minPrice * (config.commission / 100));
                  return (
                    <div key={prod.id} className="bg-white p-8 rounded-[3.5rem] border border-gray-100 flex items-center gap-12 shadow-sm hover:shadow-2xl transition-all group">
                       <div className="w-24 h-24 rounded-[2rem] border-2 border-gray-50 overflow-hidden shadow-inner shrink-0 group-hover:border-emerald-200 transition-all p-1 bg-white">
                          <img src={prod.image} className="w-full h-full object-cover rounded-[1.5rem]" />
                       </div>
                       <div className="flex-grow min-w-0">
                          <h5 className="text-xl font-black text-gray-900 truncate mb-1">{prod.name}</h5>
                          <p className="text-[11px] text-gray-400 font-black uppercase tracking-widest italic">{prod.code} • {prod.category}</p>
                       </div>
                       <div className="grid grid-cols-5 gap-12 text-center shrink-0">
                          <div><p className="text-[9px] font-black text-gray-400 uppercase mb-2">商品标价</p><p className="text-lg font-black text-gray-900">¥{prod.minPrice.toLocaleString()}</p></div>
                          <div className="border-l pl-12 border-gray-100"><p className="text-[9px] font-black text-blue-500 uppercase mb-2 italic">结算折扣 (%)</p><input type="number" value={config.discount} onChange={e => handleUpdatePool(prod.id, 'discount', Number(e.target.value))} className="w-20 bg-blue-50 border border-blue-100 rounded-xl text-xs font-black text-center py-2.5 text-blue-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" /></div>
                          <div><p className="text-[9px] font-black text-blue-400 uppercase mb-2">折后结算价</p><p className="text-xl font-black text-blue-600">¥{settlementPrice.toLocaleString()}</p></div>
                          <div className="border-l pl-12 border-gray-100"><p className="text-[9px] font-black text-emerald-600 uppercase mb-2 italic">返佣比例 (%)</p><input type="number" value={config.commission} onChange={e => handleUpdatePool(prod.id, 'commission', Number(e.target.value))} className="w-20 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-black text-center py-2.5 text-emerald-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all" /></div>
                          <div><p className="text-[9px] font-black text-emerald-400 uppercase mb-2">预计返佣额</p><p className="text-xl font-black text-emerald-700">¥{commissionAmount.toLocaleString()}</p></div>
                       </div>
                    </div>
                  );
               })}
            </div>
            <div className="p-12 border-t bg-white flex justify-end gap-6 shadow-inner shrink-0 z-20">
               <Button variant="outline" onClick={() => setSelectedPartner(null)} className="rounded-2xl px-12 py-5 font-black text-xs uppercase tracking-widest border-2">放弃修改</Button>
               <Button onClick={() => setSelectedPartner(null)} className="rounded-2xl px-24 py-5 bg-[#153e35] shadow-2xl font-black text-xs uppercase tracking-widest text-white active:scale-95 transition-all">发布并部署授权配置</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
