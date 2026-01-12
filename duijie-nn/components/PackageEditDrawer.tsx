
import React, { useState, useMemo } from 'react';
import { Package, Product, Category } from '../types';
import { PRODUCTS, CATEGORIES } from '../constants';
import { Button } from './ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  packageData: Package | null;
}

interface PackageSlot {
  id: string;
  name: string;
  requiredCount: number; // 几选几里的“选几”，例如“10选1”里的“1”
  poolProductIds: string[]; // 备选池，例如“10选1”里的“10”
  categoryId: string;
}

export const PackageEditDrawer: React.FC<Props> = ({ isOpen, onClose, packageData }) => {
  // 1. 套餐基本信息
  const [name, setName] = useState(packageData?.name || '');
  const [price, setPrice] = useState(packageData?.price || 0);
  const [mainImage, setMainImage] = useState(packageData?.mainImage || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400');

  // 2. 槽位逻辑 (N选M)
  const [slots, setSlots] = useState<PackageSlot[]>([
    { id: 's1', name: '主沙发位', requiredCount: 1, poolProductIds: [], categoryId: 'cat1' },
    { id: 's2', name: '茶几组合', requiredCount: 1, poolProductIds: [], categoryId: 'cat2' }
  ]);
  const [activeSlotId, setActiveSlotId] = useState<string>('s1');

  // 3. 类目树与搜索
  const [treeSearch, setTreeSearch] = useState('');
  const [expandedCats, setExpandedCats] = useState<string[]>(['cat1', 'cat2']);

  const activeSlot = slots.find(s => s.id === activeSlotId);

  // 过滤后的类目树 (模拟树状，实际项目中可更复杂)
  const filteredCategories = useMemo(() => {
    return CATEGORIES.filter(c => c.name.includes(treeSearch));
  }, [treeSearch]);

  // 当前激活槽位可选的商品池
  const currentPool = useMemo(() => {
    if (!activeSlot) return [];
    return PRODUCTS.filter(p => p.category === CATEGORIES.find(c => c.id === activeSlot.categoryId)?.name);
  }, [activeSlot]);

  const toggleProductInSlot = (productId: string) => {
    setSlots(prev => prev.map(s => {
      if (s.id !== activeSlotId) return s;
      const exists = s.poolProductIds.includes(productId);
      return {
        ...s,
        poolProductIds: exists 
          ? s.poolProductIds.filter(id => id !== productId) 
          : [...s.poolProductIds, productId]
      };
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex justify-end overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-[1500px] bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-500">
        
        {/* 1. Header: 身份与基础信息编辑 */}
        <div className="h-24 border-b flex items-center justify-between px-10 shrink-0 bg-white z-10 shadow-sm">
          <div className="flex items-center gap-8 flex-grow">
            <div className="relative group w-16 h-16 shrink-0 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-md">
              <img src={mainImage} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
            </div>
            <div className="flex-grow max-w-xl">
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="text-2xl font-black text-gray-900 bg-transparent border-none focus:ring-0 p-0 w-full placeholder:text-gray-200"
                placeholder="在此输入套餐标题..."
              />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">方案架构编辑模式 / SCHEME ARCHITECT MODE</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right mr-4">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">建议组合零售价</p>
              <div className="flex items-center bg-gray-50 rounded-xl px-4 py-2 border border-gray-100">
                <span className="text-sm font-black text-gray-400 mr-2">¥</span>
                <input 
                  type="number" 
                  value={price} 
                  onChange={e => setPrice(Number(e.target.value))}
                  className="bg-transparent border-none focus:ring-0 font-black text-lg w-32 p-0"
                />
              </div>
            </div>
            <Button variant="outline" onClick={onClose} className="rounded-xl px-6 py-4">取消</Button>
            <Button onClick={onClose} className="rounded-xl px-10 py-4 bg-[#153e35] shadow-xl shadow-emerald-900/20 font-black">发布方案</Button>
          </div>
        </div>

        <div className="flex-grow overflow-hidden flex">
          
          {/* 2. Left Sidebar: 树状类目导航 */}
          <aside className="w-72 border-r bg-gray-50/50 flex flex-col shrink-0">
            <div className="p-6 border-b bg-white">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input 
                  type="text" 
                  placeholder="搜索类目树..." 
                  value={treeSearch}
                  onChange={e => setTreeSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-gray-100 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#153e35]/10"
                />
              </div>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-2 custom-scrollbar">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-4">库房全品类目录</div>
              {filteredCategories.map(cat => (
                <div key={cat.id} className="space-y-1">
                  <div 
                    onClick={() => setExpandedCats(prev => prev.includes(cat.id) ? prev.filter(i => i !== cat.id) : [...prev, cat.id])}
                    className="flex items-center justify-between p-3 hover:bg-white rounded-xl cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <svg className={`w-4 h-4 text-gray-300 transition-transform ${expandedCats.includes(cat.id) ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                      <span className="text-xs font-black text-gray-600 group-hover:text-gray-900">{cat.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-300 bg-gray-100 px-2 py-0.5 rounded-md">{cat.count}</span>
                  </div>
                  {expandedCats.includes(cat.id) && (
                    <div className="pl-8 space-y-1">
                      <div className="p-2 text-[10px] font-bold text-gray-400 hover:text-[#153e35] cursor-pointer">全选该类目</div>
                      <div className="p-2 text-[10px] font-bold text-gray-400 hover:text-[#153e35] cursor-pointer">仅查看有库存</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>

          {/* 3. Middle: 套餐架构槽位 (N选M逻辑核心) */}
          <main className="w-[450px] border-r bg-white flex flex-col shrink-0">
            <div className="p-8 border-b flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">套餐架构 / Slots</h3>
                <p className="text-[10px] font-bold text-gray-400 mt-1">定义每个槽位的“几选几”逻辑</p>
              </div>
              <button className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/20">
              {slots.map((slot, index) => {
                const isActive = activeSlotId === slot.id;
                return (
                  <div 
                    key={slot.id}
                    onClick={() => setActiveSlotId(slot.id)}
                    className={`relative p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer group ${
                      isActive ? 'bg-[#153e35] border-[#153e35] shadow-2xl text-white' : 'bg-white border-gray-100 hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${isActive ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-400'}`}>
                          0{index + 1}
                        </div>
                        <div>
                          <input 
                            value={slot.name} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setSlots(prev => prev.map(s => s.id === slot.id ? {...s, name: val} : s));
                            }}
                            className={`font-black text-lg bg-transparent border-none p-0 focus:ring-0 ${isActive ? 'text-white' : 'text-gray-900'}`}
                          />
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isActive ? 'bg-emerald-500' : 'bg-gray-100 text-gray-400'}`}>
                        {slot.poolProductIds.length}选{slot.requiredCount}
                      </div>
                    </div>

                    <div className={`p-5 rounded-2xl flex items-center justify-between ${isActive ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <div>
                        <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isActive ? 'text-white/40' : 'text-gray-400'}`}>配置规则</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black">客户必选:</span>
                          <input 
                            type="number" 
                            value={slot.requiredCount} 
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              setSlots(prev => prev.map(s => s.id === slot.id ? {...s, requiredCount: val} : s));
                            }}
                            className={`w-12 bg-transparent border-b-2 font-black text-center text-sm focus:ring-0 ${isActive ? 'border-white/20 text-white' : 'border-gray-200 text-gray-900'}`}
                          />
                          <span className="text-xs font-black">款</span>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isActive ? 'text-white/40' : 'text-gray-400'}`}>当前池容量</p>
                         <p className="text-xl font-black">{slot.poolProductIds.length}</p>
                      </div>
                    </div>

                    {isActive && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {slot.poolProductIds.slice(0, 3).map(pid => {
                          const p = PRODUCTS.find(prod => prod.id === pid);
                          return (
                            <img key={pid} src={p?.image} className="w-8 h-8 rounded-lg object-cover ring-2 ring-white/10" />
                          );
                        })}
                        {slot.poolProductIds.length > 3 && (
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-black">
                            +{slot.poolProductIds.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <button className="w-full py-8 border-2 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-300 hover:text-[#153e35] hover:border-emerald-200 transition-all">
                <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                <span className="text-xs font-black uppercase tracking-widest">新增配置槽位</span>
              </button>
            </div>
          </main>

          {/* 4. Right: 高密度备选商品池 */}
          <div className="flex-grow bg-white flex flex-col min-w-0">
            <div className="p-8 border-b flex items-center justify-between shrink-0">
              <div>
                <h4 className="text-lg font-black text-gray-900 leading-none">正在为 [{activeSlot?.name}] 配置备选池</h4>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">
                  请勾选该槽位下允许客户选择的所有商品 (当前已选 {activeSlot?.poolProductIds.length} 款)
                </p>
              </div>
              <div className="flex gap-4">
                 <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-[10px] font-black border border-emerald-100 uppercase tracking-widest">
                    推荐系数: 高
                 </div>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 content-start custom-scrollbar bg-gray-50/20">
              {currentPool.map(prod => {
                const isSelected = activeSlot?.poolProductIds.includes(prod.id);
                return (
                  <div 
                    key={prod.id}
                    onClick={() => toggleProductInSlot(prod.id)}
                    className={`group relative flex flex-col bg-white border-2 rounded-[2rem] overflow-hidden cursor-pointer transition-all ${
                      isSelected ? 'border-emerald-500 ring-4 ring-emerald-500/10 shadow-xl' : 'border-gray-100 hover:border-emerald-200 hover:shadow-lg'
                    }`}
                  >
                    <div className="aspect-square relative overflow-hidden">
                      <img src={prod.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center backdrop-blur-[2px]">
                          <div className="bg-emerald-500 text-white rounded-2xl p-3 shadow-2xl scale-110 animate-in zoom-in">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7"/></svg>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h4 className="text-sm font-black text-gray-800 truncate mb-1">{prod.name}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{prod.code}</span>
                        <span className="text-sm font-black text-emerald-600">¥{prod.minPrice}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {currentPool.length === 0 && (
                <div className="col-span-full py-32 flex flex-col items-center justify-center opacity-20">
                  <svg className="w-24 h-24 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  <p className="text-xl font-black uppercase tracking-widest">该类目下暂无可选商品</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
