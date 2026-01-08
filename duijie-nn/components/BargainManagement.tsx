
import React, { useState } from 'react';
import { BargainProduct } from '../types';
import { Button } from './ui/Button';
import { BargainEditDrawer } from './BargainEditDrawer';

const MOCK_BARGAINS: BargainProduct[] = [
  {
    id: 'b1',
    name: 'G601沙发',
    code: '6923a6ebc6d6fe40ce5d0d73',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
    originalPrice: 7038,
    targetPrice: 99,
    styleTags: ['现代', '简约'],
    minPerBargain: 5,
    maxPerBargain: 50,
    maxHelpers: 20,
    weight: 0,
    status: 'active',
    initiateCount: 1,
    successCount: 0
  }
];

export const BargainManagement: React.FC = () => {
  const [bargains, setBargains] = useState<BargainProduct[]>(MOCK_BARGAINS);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeBargain, setActiveBargain] = useState<BargainProduct | null>(null);
  const [search, setSearch] = useState('');

  const toggleStatus = (id: string) => {
    setBargains(prev => prev.map(b => 
      b.id === id ? { ...b, status: b.status === 'active' ? 'inactive' : 'active' } : b
    ));
  };

  return (
    <div className="max-w-[1440px] mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 px-4">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-50 text-rose-700 rounded-full border border-rose-100 shadow-sm mb-4">
             <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Marketing Center</span>
          </div>
          <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-none">砍价营销中心</h2>
          <p className="text-gray-400 font-bold uppercase tracking-widest mt-4 flex items-center gap-3">
             <span className="w-10 h-1 bg-[#153e35] rounded-full"></span>
             裂变获客神器：高转化、低成本的流量引擎
          </p>
        </div>
        <Button 
          onClick={() => { setActiveBargain(null); setIsEditOpen(true); }}
          className="rounded-[2.5rem] px-12 py-6 bg-[#153e35] font-black text-xl shadow-2xl shadow-emerald-900/30 group"
        >
          <svg className="w-6 h-6 mr-3 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          创建砍价活动
        </Button>
      </div>

      <div className="bg-white rounded-[3.5rem] p-6 border border-gray-100 shadow-xl flex flex-col md:flex-row items-center gap-8 mb-16 mx-4">
        <div className="relative flex-grow">
          <svg className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="搜索砍价商品或活动编码..." 
            className="w-full pl-16 pr-10 py-6 bg-gray-50 border-none rounded-[2rem] text-lg font-bold focus:ring-4 focus:ring-emerald-500/10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-gray-100 p-2 rounded-[2rem] gap-2">
           {['进行中', '已结束', '草箱'].map((t, idx) => (
             <button key={t} className={`px-8 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-widest transition-all ${idx === 0 ? 'bg-white text-[#153e35] shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}>{t}</button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 px-4">
        {bargains.map(item => {
          const discountPercent = Math.round(((item.originalPrice - item.targetPrice) / item.originalPrice) * 100);
          return (
            <div key={item.id} className="bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 group">
              <div className="flex flex-col lg:flex-row">
                {/* Product Hero */}
                <div className="lg:w-80 h-64 lg:h-auto relative overflow-hidden shrink-0">
                  <img src={item.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
                  <div className="absolute top-6 left-6">
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${item.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                      {item.status === 'active' ? '● 上架中' : '○ 已停止'}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-grow p-10 flex flex-col justify-between">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 mb-1">{item.name}</h3>
                      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{item.code}</p>
                      <div className="flex gap-2 mt-4">
                        {item.styleTags.map(tag => (
                          <span key={tag} className="px-3 py-1 bg-gray-50 text-gray-400 text-[9px] font-black rounded-lg border uppercase tracking-tighter">#{tag}</span>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-8 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-2">原价</p>
                        <p className="text-xl font-black text-gray-400 line-through leading-none">¥{item.originalPrice}</p>
                      </div>
                      <div className="w-px h-10 bg-gray-200 self-center" />
                      <div>
                        <p className="text-[9px] font-black text-rose-500 uppercase mb-2 italic">最低砍至</p>
                        <p className="text-3xl font-black text-rose-600 leading-none">¥{item.targetPrice}</p>
                      </div>
                      <div className="w-px h-10 bg-gray-200 self-center" />
                      <div>
                        <p className="text-[9px] font-black text-emerald-600 uppercase mb-2">可省空间</p>
                        <p className="text-2xl font-black text-emerald-600 leading-none">¥{item.originalPrice - item.targetPrice}</p>
                        <p className="text-[10px] font-bold text-emerald-500 mt-1">{discountPercent}% OFF</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 pt-10 border-t flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex gap-12">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </div>
                        <div>
                          <p className="text-lg font-black text-gray-900 leading-none">{item.initiateCount}</p>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">发起次数</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                          <p className="text-lg font-black text-gray-900 leading-none">{item.successCount}</p>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">成功砍成</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button 
                        variant="ghost" 
                        onClick={() => toggleStatus(item.id)}
                        className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${item.status === 'active' ? 'text-gray-400 hover:text-rose-500 border-gray-100 hover:border-rose-100' : 'text-emerald-600 border-emerald-50 hover:bg-emerald-50'}`}
                      >
                        {item.status === 'active' ? '立即下架' : '重新上架'}
                      </Button>
                      <Button 
                        onClick={() => { setActiveBargain(item); setIsEditOpen(true); }}
                        className="px-8 py-4 rounded-2xl bg-[#153e35] font-black text-[10px] uppercase tracking-widest shadow-xl"
                      >
                        编辑配置
                      </Button>
                      <button className="p-4 rounded-2xl text-red-400 hover:bg-red-50 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <BargainEditDrawer 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        bargainData={activeBargain} 
      />
    </div>
  );
};
