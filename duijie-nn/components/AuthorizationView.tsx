
import React, { useState, useMemo } from 'react';
import { Manufacturer, Category, Product, SKU } from '../types';
import { CATEGORIES, PRODUCTS } from '../constants';
import { Button } from './ui/Button';

interface AuthorizationViewProps {
  manufacturer: Manufacturer;
  onBack: () => void;
  isAdminMode?: boolean;
}

export const AuthorizationView: React.FC<AuthorizationViewProps> = ({ manufacturer, onBack, isAdminMode = false }) => {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([CATEGORIES[0].id]);
  const [expandedProductIds, setExpandedProductIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleProductExpansion = (id: string) => {
    setExpandedProductIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleProduct = (id: string, isPreviouslyAuthorized: boolean) => {
    if (!isAdminMode && isPreviouslyAuthorized) return;
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return PRODUCTS;
    return PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const getProductsByCategory = (catName: string) => 
    filteredProducts.filter(p => p.category === catName);

  const handleSelectAllInCategory = (catName: string, checked: boolean) => {
    const catProds = getProductsByCategory(catName).filter(p => isAdminMode || !p.isPreviouslyAuthorized);
    const catIds = catProds.map(p => p.id);
    
    if (checked) {
      setSelectedProductIds(prev => Array.from(new Set([...prev, ...catIds])));
    } else {
      setSelectedProductIds(prev => prev.filter(id => !catIds.includes(id)));
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4">
      {/* Brand Profile Header */}
      <div className="bg-white rounded-[3rem] p-10 mb-8 border border-gray-100 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-50 rounded-full blur-3xl -mr-40 -mt-40 opacity-50" />
        
        <div className="relative z-10 flex flex-col lg:flex-row gap-10 items-center lg:items-start">
          <div className="shrink-0">
            <img 
              src={manufacturer.logo} 
              alt={manufacturer.name} 
              className="w-32 h-32 rounded-[2.5rem] object-cover shadow-2xl border-4 border-white"
            />
          </div>

          <div className="flex-grow text-center lg:text-left">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4 justify-center lg:justify-start">
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                {isAdminMode ? '品牌商品库管理' : manufacturer.name}
              </h1>
              <span className="inline-flex px-4 py-1.5 bg-[#153e35] text-white text-[10px] font-black rounded-full tracking-widest uppercase self-center shadow-lg">
                {manufacturer.code}
              </span>
            </div>
            
            <p className="text-base text-gray-500 leading-relaxed max-w-2xl font-medium italic mb-8">
              “{manufacturer.description}”
            </p>

            {/* Current Policy Banner */}
            <div className="flex flex-wrap gap-8 justify-center lg:justify-start border-t border-gray-100 pt-8 mt-auto">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">供应折扣力度</span>
                  <div className="flex items-baseline gap-1">
                     <span className="text-3xl font-black text-[#153e35]">{manufacturer.defaultDiscount || 60}</span>
                     <span className="text-xs font-bold text-gray-400">% OFF</span>
                  </div>
               </div>
               <div className="w-px h-10 bg-gray-100 self-end hidden lg:block" />
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">预估返佣比例</span>
                  <div className="flex items-baseline gap-1">
                     <span className="text-3xl font-black text-emerald-600">{manufacturer.defaultCommission || 30}</span>
                     <span className="text-xs font-bold text-emerald-500">%</span>
                  </div>
               </div>
               <div className="w-px h-10 bg-gray-100 self-end hidden lg:block" />
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">当前合约效期</span>
                  <p className="text-lg font-black text-blue-800">{manufacturer.expiryDate || '2026-12-31'}</p>
               </div>
            </div>
          </div>
          
          <div className="shrink-0">
            <Button variant="outline" onClick={onBack} className="rounded-2xl px-8 py-4 border-gray-100 text-gray-500 hover:text-[#153e35] hover:bg-emerald-50 transition-all font-black text-sm shadow-sm">
              {isAdminMode ? '返回门户' : '返回品牌库'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Selection Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
            <h2 className="text-xl font-black text-gray-900 tracking-tight shrink-0">
              {isAdminMode ? '全库商品名录' : '商品选库搜索'}
            </h2>
            <div className="relative flex-grow max-w-md">
               <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               <input 
                  type="text" 
                  placeholder="输入商品名称或编码..." 
                  className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-[1.5rem] focus:ring-2 focus:ring-[#153e35] focus:outline-none transition-all text-sm font-bold shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
          </div>

          <div className="space-y-4">
            {CATEGORIES.map(cat => {
              const isOpen = expandedCategories.includes(cat.id);
              const catProducts = getProductsByCategory(cat.name);
              const selectableCatProds = catProducts.filter(p => isAdminMode || !p.isPreviouslyAuthorized);
              const isAllSelected = selectableCatProds.length > 0 && selectableCatProds.every(p => selectedProductIds.includes(p.id));

              if (catProducts.length === 0 && searchQuery) return null;

              return (
                <div key={cat.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden transition-all duration-300">
                  {/* Category Header */}
                  <div className={`p-6 flex items-center justify-between transition-colors ${isOpen ? 'bg-gray-50/50 border-b border-gray-50' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-4 flex-grow cursor-pointer" onClick={() => toggleCategory(cat.id)}>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isOpen ? 'bg-[#153e35] text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-gray-900">{cat.name}</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cat.count} 款商品正在分销</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <label className="flex items-center gap-3 cursor-pointer group select-none">
                          <input type="checkbox" className="hidden" checked={isAllSelected} onChange={(e) => handleSelectAllInCategory(cat.name, e.target.checked)} />
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isAllSelected ? 'bg-emerald-600 border-emerald-600 shadow-lg shadow-emerald-900/10' : 'border-gray-200 bg-white group-hover:border-emerald-300'}`}>
                            {isAllSelected && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <span className={`text-xs font-black uppercase tracking-widest transition-colors ${isAllSelected ? 'text-emerald-700' : 'text-gray-400'}`}>
                            {isAdminMode ? '全库管控' : '全选类目'}
                          </span>
                       </label>
                       <div onClick={() => toggleCategory(cat.id)} className={`cursor-pointer transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                         <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                       </div>
                    </div>
                  </div>

                  <div className={`transition-all duration-300 ${isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <div className="p-4 space-y-4">
                      {catProducts.map(prod => {
                        const isSelected = selectedProductIds.includes(prod.id);
                        const isAuth = !isAdminMode && prod.isPreviouslyAuthorized;
                        const isExpanded = expandedProductIds.includes(prod.id);
                        return (
                          <div key={prod.id} className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm transition-all hover:border-[#153e35]/30">
                            <div className={`flex items-center gap-6 p-6 transition-all ${isAuth ? 'bg-emerald-50/20' : 'bg-white'}`}>
                              <label className="relative flex items-center cursor-pointer">
                                <input type="checkbox" className="hidden" checked={isAuth || isSelected} onChange={() => toggleProduct(prod.id, !!isAuth)} disabled={isAuth} />
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isAuth ? 'bg-emerald-600 border-emerald-600' : isSelected ? 'bg-[#153e35] border-[#153e35]' : 'border-gray-200 bg-white'}`}>
                                  {(isAuth || isSelected) && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </div>
                              </label>

                              <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                {prod.image ? <img src={prod.image} className="w-full h-full object-cover" /> : (
                                  <svg className="w-10 h-10 text-gray-200" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z"/></svg>
                                )}
                              </div>
                              
                              <div className="flex-grow min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className="text-lg font-black text-gray-800 truncate leading-none">{prod.name}</h4>
                                  {isAuth && <span className="text-[8px] font-black text-white bg-emerald-500 px-2 py-0.5 rounded-full uppercase tracking-widest">已授权</span>}
                                </div>
                                <div className="flex items-center gap-3">
                                   <p className="text-[10px] text-gray-400 font-bold tracking-tight uppercase">{prod.code}</p>
                                   <button onClick={() => toggleProductExpansion(prod.id)} className="text-blue-500 text-[10px] font-black hover:underline flex items-center uppercase tracking-widest">
                                      {isExpanded ? '收起详情' : '展开多规格'}
                                      <svg className={`w-3 h-3 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                   </button>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-x-12 gap-y-2 mt-4">
                                  <div>
                                     <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">官方标价</p>
                                     <p className="text-sm font-black text-gray-900">{prod.priceRange}</p>
                                  </div>
                                  <div>
                                     <p className="text-[9px] text-orange-500 font-black uppercase tracking-widest">预计成交</p>
                                     <p className="text-sm font-black text-orange-600">¥{prod.minPrice}</p>
                                  </div>
                                  <div>
                                     <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">单件佣金</p>
                                     <p className="text-sm font-black text-emerald-700">¥{prod.rebatePrice}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* SKU Details Table */}
                            {isExpanded && (
                              <div className="bg-gray-50/50 p-6 border-t border-gray-100">
                                <div className="space-y-3">
                                  {prod.skus.map(sku => (
                                    <div key={sku.id} className="bg-white rounded-[1.5rem] p-4 border border-gray-100 flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
                                      {/* SKU Image */}
                                      <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 shrink-0 overflow-hidden flex items-center justify-center shadow-inner">
                                        {sku.image ? <img src={sku.image} className="w-full h-full object-cover" /> : (
                                          <svg className="w-8 h-8 text-gray-200" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z"/></svg>
                                        )}
                                      </div>

                                      <div className="grid grid-cols-4 flex-grow gap-8 items-center">
                                        <div className="col-span-1 min-w-0">
                                          <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-tighter">SKU CODE: {sku.code}</p>
                                          <p className="text-xs text-gray-700 font-black truncate leading-tight" title={sku.name}>{sku.name}</p>
                                        </div>
                                        <div className="text-center">
                                          <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">标价</p>
                                          <p className="text-sm font-black text-gray-900">¥{sku.listPrice}</p>
                                        </div>
                                        <div className="text-center">
                                          <p className="text-[9px] text-orange-500 font-black uppercase tracking-widest mb-1">折后</p>
                                          <p className="text-sm font-black text-orange-600">¥{sku.discountPrice}</p>
                                        </div>
                                        <div className="text-center">
                                          <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest mb-1">预估返佣</p>
                                          <p className="text-sm font-black text-emerald-700">¥{sku.commission}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating Summary Panel */}
        <div className="lg:col-span-4">
          <div className="bg-[#153e35] rounded-[2.5rem] p-10 text-white shadow-2xl sticky top-28 overflow-hidden border border-emerald-900/10">
            <h3 className="text-xl font-black mb-10 flex items-center tracking-tight">
              <svg className="w-6 h-6 mr-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {isAdminMode ? '库房更新摘要' : '申请确认'}
            </h3>

            <div className="space-y-8 mb-10">
              <div className="flex justify-between items-center bg-white/5 rounded-[1.5rem] p-6 border border-white/10">
                <div>
                  <p className="text-[10px] text-emerald-200 font-black uppercase tracking-widest mb-2">
                    {isAdminMode ? '本次调整' : '新增选库'}
                  </p>
                  <p className="text-4xl font-black">{selectedProductIds.length}<span className="text-xs font-normal ml-2 opacity-50 uppercase tracking-widest">ITEMS</span></p>
                </div>
                <div className="w-px h-12 bg-white/10 mx-6"></div>
                <div className="flex-grow">
                  <p className="text-[10px] text-emerald-200 font-black uppercase tracking-widest mb-2">
                    {isAdminMode ? '在架库房' : '历史授权'}
                  </p>
                  <p className="text-2xl font-black opacity-60">
                    {PRODUCTS.filter(p => isAdminMode ? !p.isPreviouslyAuthorized : p.isPreviouslyAuthorized).length}
                  </p>
                </div>
              </div>

              {selectedProductIds.length > 0 && (
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-emerald-200/50 uppercase tracking-widest">待提交清单明细</p>
                  <div className="max-h-72 overflow-y-auto custom-scrollbar pr-3 space-y-3">
                    {selectedProductIds.map(id => {
                      const p = PRODUCTS.find(prod => prod.id === id);
                      return (
                        <div key={id} className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5 group/item">
                          <img src={p?.image} className="w-12 h-12 rounded-xl object-cover shadow-lg" />
                          <div className="flex-grow min-w-0">
                             <p className="text-xs font-black truncate">{p?.name}</p>
                             <p className="text-[9px] text-emerald-200/40 font-bold uppercase">{p?.code}</p>
                          </div>
                          <button onClick={() => toggleProduct(id, false)} className="text-white/20 hover:text-red-400 transition-colors">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedProductIds.length === 0 && (
                <div className="py-20 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                   <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                   </div>
                  <p className="text-sm text-emerald-200/40 font-black uppercase tracking-widest">
                    {isAdminMode ? '请勾选商品调整管控' : '请在左侧勾选商品'}
                  </p>
                </div>
              )}
            </div>

            <Button 
              className="w-full py-6 rounded-[1.5rem] bg-emerald-400 hover:bg-emerald-300 text-[#153e35] font-black text-xl border-none shadow-2xl shadow-emerald-900/40" 
              disabled={selectedProductIds.length === 0}
            >
              {isAdminMode ? '确认更新库房配置' : '立即提交选库申请'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
