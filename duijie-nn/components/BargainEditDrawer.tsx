
import React, { useState, useMemo } from 'react';
import { BargainProduct } from '../types';
import { PRODUCTS } from '../constants';
import { Button } from './ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bargainData: BargainProduct | null;
}

export const BargainEditDrawer: React.FC<Props> = ({ isOpen, onClose, bargainData }) => {
  const [formData, setFormData] = useState<Partial<BargainProduct>>(bargainData || {
    name: '',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
    originalPrice: 0,
    targetPrice: 0,
    styleTags: [],
    minPerBargain: 5,
    maxPerBargain: 50,
    maxHelpers: 20,
    weight: 0,
  });

  const [searchProduct, setSearchProduct] = useState('');
  
  const allStyles = ['现代', '北欧', '中式', '美式', '日式', '轻奢', '工业'];

  const savingSpace = (formData.originalPrice || 0) - (formData.targetPrice || 0);
  const savingPercent = formData.originalPrice ? Math.round((savingSpace / formData.originalPrice) * 100) : 0;

  const toggleStyle = (style: string) => {
    setFormData(prev => ({
      ...prev,
      styleTags: prev.styleTags?.includes(style) 
        ? prev.styleTags.filter(s => s !== style) 
        : [...(prev.styleTags || []), style]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-end overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-[1200px] bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-500">
        
        {/* Header */}
        <div className="h-24 border-b flex items-center justify-between px-10 shrink-0 bg-white">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{bargainData ? '修改砍价活动配置' : '创建全新砍价活动'}</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Marketing Algorithm Configuration</p>
          </div>
          <div className="flex gap-4">
             <Button variant="ghost" onClick={onClose} className="text-gray-400 font-bold">放弃</Button>
             <Button onClick={onClose} className="rounded-2xl px-12 py-4 bg-[#153e35] font-black shadow-xl">提交并生效</Button>
          </div>
        </div>

        <div className="flex-grow overflow-hidden flex">
          {/* Left: Product & Base Info */}
          <div className="w-[55%] border-r p-12 overflow-y-auto custom-scrollbar space-y-12">
            
            <section className="space-y-6">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-emerald-500 pl-4">01. 关联商品与封面</h3>
              
              <div className="flex gap-8">
                <div className="w-48 h-48 rounded-[2rem] border-2 border-dashed border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden relative cursor-pointer group hover:border-[#153e35] transition-all">
                   <img src={formData.image} className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                   </div>
                </div>
                
                <div className="flex-grow space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">选择商品 *</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData(p => ({...p, name: e.target.value}))}
                        placeholder="搜索库房商品..."
                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold shadow-inner"
                      />
                      <svg className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">设计风格标签 (可多选)</label>
                    <div className="flex flex-wrap gap-2">
                       {allStyles.map(style => {
                         const isActive = formData.styleTags?.includes(style);
                         return (
                           <button 
                            key={style}
                            onClick={() => toggleStyle(style)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isActive ? 'bg-[#153e35] text-white border-[#153e35] shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-emerald-200'}`}
                           >
                            {style}
                           </button>
                         )
                       })}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-rose-500 pl-4">02. 价格杠杆设定</h3>
              
              <div className="grid grid-cols-2 gap-8">
                <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">商品原价 (¥)</label>
                   <input 
                    type="number" 
                    value={formData.originalPrice}
                    onChange={e => setFormData(p => ({...p, originalPrice: Number(e.target.value)}))}
                    className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-xl font-black text-gray-900 shadow-sm"
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-rose-400 uppercase mb-2 italic">目标底价 (¥)</label>
                   <input 
                    type="number" 
                    value={formData.targetPrice}
                    onChange={e => setFormData(p => ({...p, targetPrice: Number(e.target.value)}))}
                    className="w-full bg-rose-50 border border-rose-100 rounded-2xl px-6 py-4 text-xl font-black text-rose-600 shadow-sm"
                   />
                </div>
              </div>

              <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
                 <div className="relative z-10 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">总可砍空间</p>
                      <p className="text-4xl font-black text-[#153e35]">¥{savingSpace.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                       <span className="text-xs font-black bg-white text-emerald-600 px-3 py-1 rounded-full shadow-sm">{savingPercent}% 折扣幅度</span>
                    </div>
                 </div>
                 {/* Visual Range Bar */}
                 <div className="mt-8 h-2 w-full bg-white rounded-full overflow-hidden shadow-inner">
                    <div className="bg-[#153e35] h-full" style={{ width: `${savingPercent}%` }} />
                 </div>
              </div>
            </section>
          </div>

          {/* Right: Algorithm & Strategy */}
          <div className="w-[45%] bg-gray-50/50 p-12 overflow-y-auto custom-scrollbar space-y-12">
            
            <section className="space-y-8">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-blue-500 pl-4">03. 砍价策略算法</h3>
              
              <div className="space-y-8">
                <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-4">单次砍价面值区间 (随机生成)</label>
                  <div className="flex items-center gap-4">
                     <div className="flex-grow">
                        <p className="text-[9px] font-bold text-gray-400 mb-1">最小金额</p>
                        <input type="number" value={formData.minPerBargain} onChange={e => setFormData(p => ({...p, minPerBargain: Number(e.target.value)}))} className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-black shadow-inner" />
                     </div>
                     <div className="h-4 w-4 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">~</div>
                     <div className="flex-grow">
                        <p className="text-[9px] font-bold text-gray-400 mb-1">最大金额</p>
                        <input type="number" value={formData.maxPerBargain} onChange={e => setFormData(p => ({...p, maxPerBargain: Number(e.target.value)}))} className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-black shadow-inner" />
                     </div>
                  </div>
                </div>

                <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                   <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">最多帮砍人数限制</label>
                      <span className="text-2xl font-black text-[#153e35]">{formData.maxHelpers} 人</span>
                   </div>
                   <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={formData.maxHelpers}
                    onChange={e => setFormData(p => ({...p, maxHelpers: Number(e.target.value)}))}
                    className="w-full h-2 bg-emerald-100 rounded-full appearance-none accent-[#153e35]"
                   />
                   <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <p className="text-[10px] font-bold text-blue-800 leading-relaxed text-center">
                         核心提示：若要成功砍到底价，平均每人需砍掉 ¥{(savingSpace / (formData.maxHelpers || 1)).toFixed(2)}
                      </p>
                   </div>
                </div>

                <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                   <label className="block text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">列表权重系数 (0-999)</label>
                   <input 
                    type="number" 
                    value={formData.weight}
                    onChange={e => setFormData(p => ({...p, weight: Number(e.target.value)}))}
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-xl font-black shadow-inner" 
                   />
                   <p className="mt-3 text-[9px] font-bold text-gray-300 italic">数值越大，该砍价商品在前端聚合页面的位置越靠前。</p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};
