
import React, { useState } from 'react';
import { Package } from '../types';
import { Button } from './ui/Button';
import { PackageEditDrawer } from './PackageEditDrawer';

const MOCK_PACKAGES: Package[] = [
  {
    id: 'pkg-001',
    name: '意式极简：钢琴键沙龙六件套',
    price: 25000,
    mainImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=60',
    detailImages: [],
    tags: ['意式', '客厅', '高溢价'],
    status: 'on_shelf',
    items: [{ productId: 'p1', quantity: 1 }],
    itemCount: 19,
    profit: 8885
  },
  {
    id: 'pkg-002',
    name: '瓦伦西亚：真皮卧房舒享组合',
    price: 18800,
    mainImage: 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?w=800&auto=format&fit=crop&q=60',
    detailImages: [],
    tags: ['真皮', '卧房', '爆款'],
    status: 'off_shelf',
    items: [],
    itemCount: 12,
    profit: 5200
  }
];

export const PackageManagement: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>(MOCK_PACKAGES);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activePackage, setActivePackage] = useState<Package | null>(null);
  const [search, setSearch] = useState('');

  const filtered = packages.filter(p => p.name.includes(search));

  const toggleStatus = (id: string) => {
    setPackages(prev => prev.map(p => 
      p.id === id ? { ...p, status: p.status === 'on_shelf' ? 'off_shelf' : 'on_shelf' } : p
    ));
  };

  return (
    <div className="max-w-[1440px] mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 shadow-sm">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest">Package Center</span>
          </div>
          <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-none">套餐方案管理</h2>
          <p className="text-gray-400 font-bold uppercase tracking-widest flex items-center gap-3">
            <span className="w-10 h-1 bg-[#153e35] rounded-full"></span>
            整合零散单品，构建高溢价生活场景模版
          </p>
        </div>
        <Button 
          onClick={() => { setActivePackage(null); setIsEditOpen(true); }} 
          className="rounded-[2.5rem] px-12 py-6 bg-[#153e35] font-black text-xl shadow-2xl shadow-emerald-900/30 group"
        >
          <svg className="w-6 h-6 mr-3 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          新建场景套餐
        </Button>
      </div>

      <div className="bg-white rounded-[3.5rem] p-6 border border-gray-100 shadow-xl flex flex-col md:flex-row items-center gap-8 mb-16">
        <div className="relative flex-grow">
          <svg className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="输入套餐名称或关联品牌..." 
            className="w-full pl-16 pr-10 py-6 bg-gray-50 border-none rounded-[2rem] text-lg font-bold focus:ring-4 focus:ring-emerald-500/10 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-gray-100 p-2 rounded-[2rem] gap-2">
           {['全部状态', '已上架', '已下架'].map((t, idx) => (
             <button key={t} className={`px-8 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-widest transition-all ${idx === 0 ? 'bg-white text-gray-900 shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}>{t}</button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
        {filtered.map(pkg => (
          <div key={pkg.id} className="group relative bg-white rounded-[4rem] border border-gray-100 shadow-2xl overflow-hidden hover:shadow-3xl hover:-translate-y-4 transition-all duration-500 flex flex-col h-full">
            
            {/* Immersive Image Header */}
            <div className="relative h-96 overflow-hidden">
               <img src={pkg.mainImage} alt={pkg.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
               
               <div className="absolute top-8 left-8 flex flex-col gap-2">
                 <div className={`px-5 py-2 rounded-full backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest shadow-2xl ${pkg.status === 'on_shelf' ? 'bg-emerald-500/90 text-white' : 'bg-gray-500/90 text-white'}`}>
                    {pkg.status === 'on_shelf' ? '● 在售状态' : '○ 已下架'}
                 </div>
               </div>

               <div className="absolute bottom-10 left-10 right-10">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {pkg.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg text-[9px] font-black text-white uppercase tracking-tighter">#{tag}</span>
                    ))}
                  </div>
                  <h3 className="text-3xl font-black text-white leading-tight mb-2 drop-shadow-lg">{pkg.name}</h3>
               </div>
            </div>

            {/* Content & Action Area */}
            <div className="p-10 flex flex-col flex-grow bg-white">
               <div className="grid grid-cols-3 gap-6 mb-10">
                  <div className="text-center p-4 bg-gray-50 rounded-3xl border border-gray-100">
                     <p className="text-[10px] font-black text-gray-400 uppercase mb-1">包含单品</p>
                     <p className="text-2xl font-black text-gray-900">{pkg.itemCount}</p>
                  </div>
                  <div className="text-center p-4 bg-emerald-50 rounded-3xl border border-emerald-100">
                     <p className="text-[10px] font-black text-emerald-700/60 uppercase mb-1">策划利润</p>
                     <p className="text-2xl font-black text-emerald-800">¥{pkg.profit}</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-3xl border border-blue-100">
                     <p className="text-[10px] font-black text-blue-700/60 uppercase mb-1">结算折扣</p>
                     <p className="text-2xl font-black text-blue-800">60%</p>
                  </div>
               </div>

               <div className="flex items-end justify-between mb-10">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">建议组合零售价</p>
                    <p className="text-5xl font-black text-gray-900 tracking-tighter">¥{pkg.price.toLocaleString()}</p>
                  </div>
                  <button onClick={() => toggleStatus(pkg.id)} className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#153e35] hover:bg-emerald-50 transition-all shadow-sm">
                     <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                  </button>
               </div>

               <div className="mt-auto flex gap-4">
                  <Button 
                    onClick={() => { setActivePackage(pkg); setIsEditOpen(true); }}
                    className="flex-grow py-5 rounded-3xl bg-[#153e35] font-black text-base uppercase tracking-widest shadow-xl shadow-emerald-900/10"
                  >
                    编辑策划
                  </Button>
                  <Button variant="outline" className="px-8 py-5 rounded-3xl border-gray-100 text-red-400 hover:bg-red-50 hover:text-red-500 font-black">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </Button>
               </div>
            </div>
          </div>
        ))}
      </div>

      <PackageEditDrawer 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        packageData={activePackage} 
      />
    </div>
  );
};
