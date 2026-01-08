
import React, { useState, useMemo } from 'react';
import { Manufacturer, AdminAccount } from '../types';
import { Button } from './ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  manufacturer: Manufacturer | null;
}

const MOCK_ACCOUNTS: AdminAccount[] = [
  { id: '1', username: '13469111314', type: 'normal', status: 'normal', expiry: '2025-12-31', lastActive: '2024-03-20 14:20', authorizedProductsCount: 45, income: 12500.50, isSelfCreated: true },
  { id: '2', username: '外部平台_Sync001', type: 'normal', status: 'frozen', expiry: '2024-06-15', lastActive: '2024-03-19 18:05', authorizedProductsCount: 12, income: 0, isSelfCreated: false },
  { id: '3', username: '华南区域子账号', type: 'sub', status: 'normal', expiry: '2025-01-20', lastActive: '2024-03-20 09:30', authorizedProductsCount: 5, income: 3200.00, isSelfCreated: true, parentId: '1' },
  { id: '4', username: '设计师_老王', type: 'designer', status: 'normal', expiry: '2026-03-01', lastActive: '2024-03-15 11:12', authorizedProductsCount: 88, income: 54300.00, isSelfCreated: true, parentId: '1' },
];

export const AccountManagementModal: React.FC<Props> = ({ isOpen, onClose, manufacturer }) => {
  const [accounts, setAccounts] = useState<AdminAccount[]>(MOCK_ACCOUNTS);
  const [selectedAcc, setSelectedAcc] = useState<AdminAccount | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'normal' | 'sub' | 'designer'>('all');

  const filtered = useMemo(() => {
    return accounts.filter(acc => {
      const matchSearch = acc.username.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === 'all' || acc.type === filterType;
      return matchSearch && matchType;
    });
  }, [accounts, search, filterType]);

  const toggleFreeze = (id: string) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'frozen' ? 'normal' : 'frozen' } : a));
  };

  const renderTree = (acc: AdminAccount, depth = 0) => {
    const isSelected = selectedAcc?.id === acc.id;
    return (
      <div key={acc.id} className="space-y-2">
        <div 
          onClick={() => setSelectedAcc(acc)}
          style={{ marginLeft: `${depth * 28}px` }}
          className={`p-6 rounded-[2rem] border cursor-pointer transition-all flex items-center justify-between ${isSelected ? 'border-[#153e35] ring-4 ring-emerald-50 bg-white shadow-xl' : 'border-gray-100 bg-white hover:border-emerald-100 shadow-sm'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${acc.status === 'frozen' ? 'bg-red-50 text-red-300' : 'bg-emerald-50 text-emerald-600'}`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className={`text-base font-black ${acc.status === 'frozen' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{acc.username}</p>
                <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${acc.isSelfCreated ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>{acc.isSelfCreated ? '自研体系' : '第三方同步'}</span>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{acc.type} • 状态: {acc.status === 'frozen' ? '已锁定' : '活跃'}</p>
            </div>
          </div>
          <Button size="sm" variant={acc.status === 'frozen' ? 'secondary' : 'danger'} onClick={(e) => { e.stopPropagation(); toggleFreeze(acc.id); }} className="rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest">{acc.status === 'frozen' ? '解冻限制' : '锁定授权'}</Button>
        </div>
        {accounts.filter(a => a.parentId === acc.id).map(child => renderTree(child, depth + 1))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-8">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />
      <div className="relative w-full max-w-[1440px] bg-white rounded-[4rem] shadow-2xl flex h-[90vh] animate-in zoom-in duration-500 overflow-hidden">
        
        {/* Left: Account List with Filters */}
        <div className="w-[60%] flex flex-col border-r border-gray-100 bg-[#fcfdfd]">
          <div className="p-12 border-b bg-white space-y-6">
            <div className="flex justify-between items-center">
               <div>
                  <h2 className="text-4xl font-black text-gray-900 tracking-tighter">账号分发管控中心</h2>
                  <p className="text-sm font-bold text-gray-400 mt-2 uppercase tracking-widest">{manufacturer?.name} • 层级资产概览</p>
               </div>
               <div className="relative w-80">
                  <input type="text" placeholder="搜索手机号或用户名..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-6 pr-6 py-4 bg-gray-50 border rounded-2xl text-sm font-bold shadow-inner focus:ring-2 focus:ring-[#153e35] outline-none transition-all" />
               </div>
            </div>
            
            <div className="flex gap-2">
               {['all', 'normal', 'sub', 'designer'].map(t => (
                  <button key={t} onClick={() => setFilterType(t as any)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterType === t ? 'bg-[#153e35] text-white border-[#153e35] shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}>
                     {t === 'all' ? '全部' : t === 'normal' ? '主账号' : t === 'sub' ? '子账号' : '设计师'}
                  </button>
               ))}
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto p-12 space-y-4 custom-scrollbar">
            {filtered.filter(a => !a.parentId).map(acc => renderTree(acc))}
          </div>
        </div>

        {/* Right: Detailed Tracking (Conditional Visibility) */}
        <div className="w-[40%] p-12 flex flex-col bg-white overflow-y-auto custom-scrollbar">
          {selectedAcc ? (
            <div className="space-y-12 animate-in slide-in-from-right duration-500">
              <div className="text-center">
                 <div className="w-32 h-32 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-8 border-8 border-white shadow-2xl">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                 </div>
                 <h3 className="text-3xl font-black text-gray-900 tracking-tight">{selectedAcc.username}</h3>
                 <div className="flex items-center justify-center gap-2 mt-2">
                    <span className={`w-2 h-2 rounded-full ${selectedAcc.status === 'frozen' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest">{selectedAcc.status === 'frozen' ? '限制中' : '正常运代'}</p>
                 </div>
              </div>

              {selectedAcc.isSelfCreated ? (
                 <div className="space-y-8">
                    <div className="bg-[#153e35] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                       <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-8 border-b border-white/10 pb-2">自研体系运营价值</p>
                       <div className="grid grid-cols-2 gap-10">
                          <div><p className="text-[9px] font-bold text-white/50 uppercase mb-1">已授权SKU</p><p className="text-3xl font-black">{selectedAcc.authorizedProductsCount}</p></div>
                          <div><p className="text-[9px] font-bold text-white/50 uppercase mb-1">累计分润</p><p className="text-3xl font-black">¥{selectedAcc.income.toLocaleString()}</p></div>
                       </div>
                    </div>
                    <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 space-y-4">
                       <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">节点深度操作</h4>
                       <button className="w-full py-5 rounded-2xl bg-white border border-gray-100 text-xs font-black text-[#153e35] hover:bg-emerald-50 transition-all">重置接入认证</button>
                       <button className="w-full py-5 rounded-2xl bg-white border border-gray-100 text-xs font-black text-[#153e35] hover:bg-emerald-50 transition-all">编辑专属库存白名单</button>
                    </div>
                 </div>
              ) : (
                <div className="space-y-8 p-12 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-200 text-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-white/40 backdrop-blur-md z-10 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-6">
                         <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      </div>
                      <h4 className="text-xl font-black text-gray-900 mb-2">第三方接入节点</h4>
                      <p className="text-xs text-gray-400 font-bold max-w-xs leading-relaxed">
                        出于数据隔离与隐私保护，该节点的收益与商品库可见性详情仅在其源系统可见。本平台仅支持层级挂载。
                      </p>
                   </div>
                   <div className="h-64"></div>
                </div>
              )}

              <div className="pt-10 border-t mt-auto">
                 <button className="w-full py-6 rounded-3xl bg-red-50 text-red-500 font-black text-sm hover:bg-red-100 transition-all uppercase tracking-widest shadow-sm">永久注销该授权</button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12">
               <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mb-8">
                  <svg className="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
               </div>
               <p className="text-sm font-black text-gray-400 uppercase tracking-widest">请从左侧列表选择节点<br/>管理全生命周期档案</p>
            </div>
          )}
        </div>

        <button onClick={onClose} className="absolute top-10 right-10 w-16 h-16 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all active:scale-95">
           <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
        </button>
      </div>
    </div>
  );
};
