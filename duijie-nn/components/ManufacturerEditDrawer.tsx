
import React, { useState } from 'react';
import { Manufacturer, PaymentAccount } from '../types';
import { Button } from './ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  manufacturer: Manufacturer | null;
}

export const ManufacturerEditDrawer: React.FC<Props> = ({ isOpen, onClose, manufacturer }) => {
  const [activeSec, setActiveSec] = useState<'base' | 'payment' | 'legal'>('base');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-[#fcfdfd] shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
        
        <div className="p-12 border-b bg-white flex items-center justify-between shrink-0 shadow-sm">
          <div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter">品牌商务全档案管理</h2>
            <p className="text-[10px] font-black text-gray-400 mt-3 uppercase tracking-widest italic underline decoration-[#153e35] underline-offset-8">Corporate Profile & Financial Intelligence</p>
          </div>
          <button onClick={onClose} className="w-16 h-16 rounded-[2rem] bg-gray-50 flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all active:scale-95"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M6 18L18 6" /></svg></button>
        </div>

        <nav className="flex px-12 py-6 bg-white border-b gap-12 shrink-0">
           {['base', 'payment', 'legal'].map(t => (
             <button key={t} onClick={() => setActiveSec(t as any)} className={`py-2 border-b-4 font-black text-xs uppercase tracking-widest transition-all ${activeSec === t ? 'border-[#153e35] text-[#153e35]' : 'border-transparent text-gray-300'}`}>
                {t === 'base' ? '基础档案' : t === 'payment' ? '结算账户配置' : '资质与开票'}
             </button>
           ))}
        </nav>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-12 space-y-12 bg-gray-50/20">
          {activeSec === 'base' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex gap-10">
                  <div className="w-56 h-56 rounded-[3rem] bg-white border-4 border-white shadow-2xl overflow-hidden shrink-0 relative group flex items-center justify-center">
                     <img src={manufacturer?.logo} className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[#153e35] font-black text-[10px] uppercase">更换LOGO</div>
                  </div>
                  <div className="flex-grow grid grid-cols-2 gap-8 pt-4">
                     <div className="col-span-1"><label className="block text-[10px] font-black text-gray-400 uppercase mb-3">厂家编码 (CODE)</label><input type="text" defaultValue={manufacturer?.code} className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 font-black shadow-sm" /></div>
                     <div className="col-span-1"><label className="block text-[10px] font-black text-gray-400 uppercase mb-3">品牌联系人</label><input type="text" defaultValue={manufacturer?.contact} className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 font-black shadow-sm" /></div>
                     <div className="col-span-2"><label className="block text-[10px] font-black text-gray-400 uppercase mb-3">厂家注册/经营地址</label><input type="text" defaultValue={manufacturer?.address} className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 font-black shadow-sm" /></div>
                  </div>
               </div>
               <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-8">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest border-l-4 border-[#153e35] pl-4">品牌市场策略</h4>
                  <div className="grid grid-cols-2 gap-8">
                     <div><label className="block text-[10px] font-black text-gray-400 mb-2">默认折扣底线 (%)</label><input type="number" defaultValue={manufacturer?.defaultDiscount} className="w-full bg-emerald-50/30 border border-emerald-100 rounded-2xl px-6 py-4 text-2xl font-black text-[#153e35]" /></div>
                     <div><label className="block text-[10px] font-black text-gray-400 mb-2">预设返佣比例 (%)</label><input type="number" defaultValue={manufacturer?.defaultCommission} className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl px-6 py-4 text-2xl font-black text-blue-700" /></div>
                  </div>
               </div>
            </div>
          )}

          {activeSec === 'payment' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-8">
                  <div className="flex items-center gap-4 text-blue-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg><h4 className="text-sm font-black uppercase tracking-widest">银行对公账户</h4></div>
                  <div className="grid grid-cols-2 gap-8">
                     <div className="col-span-2"><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase">开户行全称</label><input type="text" placeholder="例如：中国工商银行佛山乐从支行" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-black shadow-inner" /></div>
                     <div className="col-span-1"><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase">账户名称</label><input type="text" placeholder="必须与营业执照一致" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-black shadow-inner" /></div>
                     <div className="col-span-1"><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase">银行账号</label><input type="text" placeholder="输入16-19位银行卡号" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-black shadow-inner" /></div>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-8">
                  <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-6">
                    <div className="flex items-center gap-4 text-emerald-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><h4 className="text-sm font-black uppercase tracking-widest">支付宝配置</h4></div>
                    <input type="text" placeholder="支付宝账号" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-black shadow-inner" />
                    <input type="text" placeholder="实名认证姓名" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-black shadow-inner" />
                  </div>
                  <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-6">
                    <div className="flex items-center gap-4 text-emerald-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg><h4 className="text-sm font-black uppercase tracking-widest">微信支付配置</h4></div>
                    <input type="text" placeholder="微信商户号 (MCH_ID)" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-black shadow-inner" />
                    <input type="text" placeholder="微信AppID" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-black shadow-inner" />
                  </div>
               </div>
            </div>
          )}

          {activeSec === 'legal' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl grid grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                     <h4 className="text-sm font-black uppercase tracking-widest border-l-4 border-amber-500 pl-4">营业执照 (高清扫描件)</h4>
                     <div className="aspect-[3/4] rounded-[2.5rem] bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 transition-all group overflow-hidden">
                        <svg className="w-12 h-12 text-gray-300 group-hover:scale-110 transition-transform mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">点击上传 JPG/PDF</p>
                     </div>
                  </div>
                  <div className="space-y-8">
                     <h4 className="text-sm font-black uppercase tracking-widest border-l-4 border-emerald-500 pl-4">税务开票资料</h4>
                     <div className="space-y-4">
                        <input type="text" placeholder="单位抬头全称" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-xs font-black shadow-inner" />
                        <input type="text" placeholder="纳税人识别号 (18位)" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-xs font-black shadow-inner" />
                        <input type="text" placeholder="注册地址及电话" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-xs font-black shadow-inner" />
                        <input type="text" placeholder="开户行及账号" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-xs font-black shadow-inner" />
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        <div className="p-12 border-t bg-white flex gap-8 shrink-0 shadow-inner">
          <Button variant="outline" onClick={onClose} className="flex-grow rounded-[2rem] py-6 font-black uppercase tracking-widest border-2">放弃</Button>
          <Button className="flex-grow rounded-[2rem] py-6 bg-[#153e35] text-white font-black shadow-2xl uppercase tracking-widest" onClick={onClose}>同步全系统档案</Button>
        </div>
      </div>
    </div>
  );
};
