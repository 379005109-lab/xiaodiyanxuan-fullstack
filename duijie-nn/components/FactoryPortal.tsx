
import React, { useState, useMemo } from 'react';
import { Manufacturer } from '../types';
import { MANUFACTURERS } from '../constants';
import { Button } from './ui/Button';
import { ManufacturerEditDrawer } from './ManufacturerEditDrawer';
import { AccountManagementModal } from './AccountManagementModal';

interface Props {
  onManageProducts: (m: Manufacturer) => void;
  onAuthRequest: (m: Manufacturer) => void;
  onManageHierarchy: (m: Manufacturer) => void;
  enabledIds: Record<string, boolean>;
  onToggle: (id: string) => void;
}

export const FactoryPortal: React.FC<Props> = ({ onManageProducts, onAuthRequest, onManageHierarchy, enabledIds, onToggle }) => {
  const [search, setSearch] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const [activeM, setActiveM] = useState<Manufacturer | null>(null);

  const [manufacturers, setManufacturers] = useState(() => 
    MANUFACTURERS.map(m => ({
      ...m,
      isMyOwnFactory: m.id === '3',
    }))
  );

  const handleUpdateFinance = (id: string, field: 'defaultDiscount' | 'defaultCommission', val: number) => {
    setManufacturers(prev => prev.map(m => m.id === id ? { ...m, [field]: val } : m));
  };

  const filtered = manufacturers.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || m.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-[1440px] mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div>
          <h2 className="text-6xl font-black text-gray-900 tracking-tighter mb-4 leading-none">品牌工厂中心</h2>
          <p className="text-gray-400 font-bold uppercase tracking-widest flex items-center gap-3">
            <span className="w-10 h-1 bg-blue-600 rounded-full"></span>
            管理自有资产或申请跨品牌授权
          </p>
        </div>
        <input 
          type="text" 
          placeholder="搜索品牌库..." 
          className="pl-8 pr-8 py-5 bg-white border border-gray-100 rounded-[2rem] shadow-xl w-80 font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {filtered.map(m => (
          <div key={m.id} className={`bg-white rounded-[3.5rem] border ${m.isMyOwnFactory ? 'border-blue-200 ring-4 ring-blue-50' : 'border-gray-100'} shadow-2xl overflow-hidden flex flex-col hover:shadow-3xl transition-all duration-500 group relative h-full`}>
            {/* Visibility Toggle */}
            <div className="absolute top-8 left-8 z-30 flex items-center gap-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-2xl border border-gray-100 shadow-sm">
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={enabledIds[m.id]} onChange={() => onToggle(m.id)} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
                <span className={`text-[9px] font-black uppercase tracking-widest ${enabledIds[m.id] ? 'text-emerald-700' : 'text-gray-400'}`}>
                    {enabledIds[m.id] ? '展示中' : '已隐藏'}
                </span>
            </div>

            <div className="p-12 pb-6 flex-grow flex flex-col">
               <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 rounded-[2rem] border p-4 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                     <img src={m.logo} alt={m.name} className="w-full h-full object-contain" />
                  </div>
                  <div>
                     <h3 className="text-3xl font-black text-gray-900 leading-none mb-2">{m.name}</h3>
                     {m.isMyOwnFactory && <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full tracking-widest uppercase">自有品牌</span>}
                  </div>
               </div>

               {/* Editable Financials for Own Factory */}
               <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100 text-center">
                     <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-1 italic">结算折扣 (%)</p>
                     {m.isMyOwnFactory ? (
                        <input type="number" value={m.defaultDiscount} onChange={e => handleUpdateFinance(m.id, 'defaultDiscount', Number(e.target.value))} className="w-full bg-transparent text-center text-3xl font-black text-[#153e35] outline-none" />
                     ) : (
                        <p className="text-3xl font-black text-[#153e35]">{m.defaultDiscount}%</p>
                     )}
                  </div>
                  <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100 text-center">
                     <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest mb-1 italic">返佣比例 (%)</p>
                     {m.isMyOwnFactory ? (
                        <input type="number" value={m.defaultCommission} onChange={e => handleUpdateFinance(m.id, 'defaultCommission', Number(e.target.value))} className="w-full bg-transparent text-center text-3xl font-black text-blue-600 outline-none" />
                     ) : (
                        <p className="text-3xl font-black text-blue-600">{m.defaultCommission}%</p>
                     )}
                  </div>
               </div>
            </div>

            <div className="p-8 pt-0 grid grid-cols-2 gap-4 bg-gray-50/50 border-t mt-auto pt-8">
               {m.isMyOwnFactory ? (
                 <>
                    <button onClick={() => onManageProducts(m)} className="col-span-2 py-5 bg-[#153e35] text-white rounded-2xl font-black text-base uppercase tracking-widest shadow-xl active:scale-95 transition-all">经营看板</button>
                    <button onClick={() => { setActiveM(m as any); setShowAccounts(true); }} className="py-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black text-gray-500 hover:text-emerald-700 transition-all uppercase tracking-widest shadow-sm">账号管理</button>
                    <button onClick={() => onManageHierarchy(m as any)} className="py-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black text-gray-500 hover:text-blue-700 transition-all uppercase tracking-widest shadow-sm">分成体系</button>
                    <button onClick={() => { setActiveM(m as any); setShowEdit(true); }} className="py-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black text-gray-500 hover:border-[#153e35] transition-all uppercase tracking-widest shadow-sm">资料编辑</button>
                    <button className="py-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black text-red-400 hover:bg-red-50 transition-all uppercase tracking-widest shadow-sm">下架停运</button>
                 </>
               ) : (
                 <Button onClick={() => onAuthRequest(m as any)} variant="outline" className="col-span-2 py-5 rounded-2xl font-black text-base uppercase tracking-widest border-2">申请经销授权</Button>
               )}
            </div>
          </div>
        ))}
      </div>

      <ManufacturerEditDrawer isOpen={showEdit} onClose={() => setShowEdit(false)} manufacturer={activeM} />
      <AccountManagementModal isOpen={showAccounts} onClose={() => setShowAccounts(false)} manufacturer={activeM} />
    </div>
  );
};
