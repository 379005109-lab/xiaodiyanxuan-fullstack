
import React, { useState } from 'react';
import { Manufacturer } from '../types';
import { Button } from './ui/Button';
import { ManufacturerEditDrawer } from './ManufacturerEditDrawer';
import { AccountManagementModal } from './AccountManagementModal';

const INITIAL_DATA: Manufacturer[] = [
  {
    id: '3',
    name: '小迪严选',
    logo: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=200&h=200&fit=crop',
    code: 'XDYX20251222PLAT',
    isPreferred: true,
    expiryDate: '2026-12-31',
    defaultDiscount: 60,
    defaultCommission: 40,
    status: 'enabled',
    description: '官方直营平台品牌',
    productIntro: '全屋场景',
    contact: 'Admin',
    phone: '400',
    address: '佛山',
    styleTags: ['官方严选'],
    quotas: {
      authAccounts: { current: 0, max: 50 },
      subAccounts: { current: 0, max: 50 },
      designers: { current: 0, max: 50 }
    }
  },
  {
    id: '1',
    name: '金龙恒',
    logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop',
    code: 'JL202512268866',
    isPreferred: false,
    expiryDate: '2026-12-26',
    defaultDiscount: 80,
    defaultCommission: 12,
    status: 'enabled',
    description: '三十年软体家具',
    productIntro: '深度睡眠',
    contact: '陈经理',
    phone: '400',
    address: '佛山',
    styleTags: ['睡眠专家'],
    quotas: {
      authAccounts: { current: 0, max: 1 },
      subAccounts: { current: 0, max: 9 },
      designers: { current: 0, max: 1 }
    }
  },
  {
    id: '2',
    name: '各色',
    logo: 'https://images.unsplash.com/photo-1541746972996-4e0b0f43e01a?w=200&h=200&fit=crop',
    code: 'GS202512257516',
    isPreferred: true,
    expiryDate: '2026-12-26',
    defaultDiscount: 60,
    defaultCommission: 23,
    status: 'enabled',
    description: '美学空间设计',
    productIntro: '定制柜类',
    contact: '王经理',
    phone: '400',
    address: '上海',
    styleTags: ['色彩美学'],
    quotas: {
      authAccounts: { current: 0, max: 5 },
      subAccounts: { current: 0, max: 10 },
      designers: { current: 0, max: 100 }
    }
  }
];

export const AdminManufacturerList: React.FC<{ 
  onManageHierarchy: (m: Manufacturer) => void,
  onManageProducts: (m: Manufacturer) => void 
}> = ({ onManageHierarchy, onManageProducts }) => {
  const [manufacturers, setManufacturers] = useState(INITIAL_DATA);
  const [showEdit, setShowEdit] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const [activeM, setActiveM] = useState<Manufacturer | null>(null);

  const handleUpdate = (id: string, field: string, value: any) => {
    setManufacturers(prev => prev.map(m => {
      if (m.id !== id) return m;
      
      const newM = { ...m };
      if (field.startsWith('quotas.')) {
        const key = field.split('.')[1] as 'authAccounts' | 'subAccounts' | 'designers';
        if (newM.quotas) {
          newM.quotas = {
            ...newM.quotas,
            [key]: { ...newM.quotas[key], max: parseInt(value) || 0 }
          };
        }
      } else {
        (newM as any)[field] = value;
      }
      return newM;
    }));
  };

  return (
    <div className="max-w-[1600px] mx-auto p-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {manufacturers.map(m => (
          <div key={m.id} className="bg-white rounded-[4.5rem] border border-gray-100 shadow-[0_30px_60px_rgba(0,0,0,0.03)] p-12 flex flex-col relative group transition-all hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] border-yellow-100">
            
            {/* Header Area */}
            <div className="flex justify-between items-start mb-12">
               <div className="flex items-center gap-6">
                  <div className="w-28 h-28 rounded-full bg-gray-50 border shadow-inner flex items-center justify-center overflow-hidden">
                     <img src={m.logo} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-4xl font-black text-gray-900 tracking-tight">{m.name}</h3>
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1 cursor-pointer hover:text-blue-500">点击添加标签</span>
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{m.code}</span>
                     </div>
                  </div>
               </div>
               <div className="flex flex-col items-end gap-3">
                  <button onClick={() => handleUpdate(m.id, 'isPreferred', !m.isPreferred)} className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${m.isPreferred ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-gray-50 text-gray-300 border border-gray-100'}`}>
                    {m.isPreferred ? '优质厂家 ★' : '设为优质'}
                  </button>
                  <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 text-center flex flex-col min-w-[120px]">
                     <span className="text-[8px] font-black text-blue-400 uppercase mb-0.5 leading-none">效期至:</span>
                     <input 
                        type="date" 
                        value={m.expiryDate || ''} 
                        onChange={e => handleUpdate(m.id, 'expiryDate', e.target.value)} 
                        className="bg-transparent text-[11px] font-black text-blue-700 outline-none text-center" 
                     />
                  </div>
               </div>
            </div>

            {/* Financial Blocks (Matching Screenshot) */}
            <div className="grid grid-cols-2 gap-6 mb-12">
               <div className="bg-[#f0fff8] p-8 rounded-[3rem] border border-emerald-100 text-center transition-all hover:ring-4 hover:ring-emerald-50">
                  <p className="text-[10px] font-black text-emerald-700 uppercase mb-3 tracking-widest">最低折扣</p>
                  <div className="flex items-center justify-center">
                    <input 
                        type="number" 
                        value={m.defaultDiscount} 
                        onChange={e => handleUpdate(m.id, 'defaultDiscount', e.target.value)} 
                        className="w-24 bg-transparent text-5xl font-black text-[#153e35] text-center outline-none" 
                    />
                    <span className="text-3xl font-black text-[#153e35]">%</span>
                  </div>
               </div>
               <div className="bg-[#f0faff] p-8 rounded-[3rem] border border-blue-100 text-center transition-all hover:ring-4 hover:ring-blue-50">
                  <p className="text-[10px] font-black text-blue-700 uppercase mb-3 tracking-widest">返佣比例</p>
                  <div className="flex items-center justify-center">
                    <input 
                        type="number" 
                        value={m.defaultCommission} 
                        onChange={e => handleUpdate(m.id, 'defaultCommission', e.target.value)} 
                        className="w-24 bg-transparent text-5xl font-black text-blue-700 text-center outline-none" 
                    />
                    <span className="text-3xl font-black text-blue-700">%</span>
                  </div>
               </div>
            </div>

            {/* Account Quotas (Inline Editable) */}
            <div className="mb-12 space-y-8 px-4">
               <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">账号总额</span>
                  <div className="bg-gray-100 px-6 py-2 rounded-2xl border font-black text-gray-600 text-sm">
                    {m.quotas ? (m.quotas.authAccounts.max + m.quotas.subAccounts.max + m.quotas.designers.max).toLocaleString() : 0}
                  </div>
               </div>
               <div className="bg-gray-50/50 rounded-[4rem] p-12 border border-gray-100 grid grid-cols-3 gap-8 shadow-inner">
                  {[
                    { l: '授权主号', k: 'authAccounts', c: m.quotas?.authAccounts },
                    { l: '员工/子号', k: 'subAccounts', c: m.quotas?.subAccounts },
                    { l: '注册设计', k: 'designers', c: m.quotas?.designers }
                  ].map(q => (
                    <div key={q.l} className="text-center group/q">
                        <div className="flex items-center justify-center text-4xl font-black text-gray-900 mb-2 leading-none">
                           <span>{q.c?.current || 0}</span>
                           <span className="mx-1 text-gray-200">/</span>
                           <input 
                              type="number" 
                              value={q.c?.max || 0} 
                              onChange={e => handleUpdate(m.id, `quotas.${q.k}`, e.target.value)} 
                              className="w-16 bg-transparent text-center outline-none border-b-2 border-transparent focus:border-[#153e35] transition-all" 
                           />
                        </div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter whitespace-nowrap">{q.l}</p>
                    </div>
                  ))}
               </div>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-6 border-t pt-10 px-2">
               <button onClick={() => { setActiveM(m); setShowAccounts(true); }} className="py-5 bg-white border border-gray-100 rounded-3xl text-[11px] font-black text-gray-600 hover:text-emerald-700 hover:shadow-lg transition-all uppercase tracking-widest">厂家账号管理</button>
               <button onClick={() => onManageProducts(m)} className="py-5 bg-white border border-gray-100 rounded-3xl text-[11px] font-black text-gray-600 hover:text-blue-600 hover:shadow-lg transition-all uppercase tracking-widest">选品授权</button>
               <button onClick={() => { setActiveM(m); setShowEdit(true); }} className="py-5 bg-white border border-gray-100 rounded-3xl text-[11px] font-black text-gray-600 hover:text-emerald-600 hover:shadow-xl transition-all uppercase tracking-widest">资料编辑</button>
               <button onClick={() => onManageHierarchy(m)} className="py-5 bg-white border border-gray-100 rounded-3xl text-[11px] font-black text-blue-600/60 hover:text-blue-700 hover:shadow-xl transition-all uppercase tracking-widest">分层体系</button>
            </div>
          </div>
        ))}
      </div>

      <ManufacturerEditDrawer isOpen={showEdit} onClose={() => setShowEdit(false)} manufacturer={activeM} />
      <AccountManagementModal isOpen={showAccounts} onClose={() => setShowAccounts(false)} manufacturer={activeM} />
    </div>
  );
};
