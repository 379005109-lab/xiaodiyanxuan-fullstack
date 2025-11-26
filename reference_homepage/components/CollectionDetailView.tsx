
import React, { useState, useEffect, useRef } from 'react';
import { MOCK_COLLECTION_CONFIG, PRODUCTS } from '../constants';
import { ChevronLeft, Check, Plus, Minus, ArrowRight, Sparkles, ChevronRight, Box, Calendar, FileText, CheckCircle2, Eye, X, Ruler, Filter } from 'lucide-react';
import { Order, OrderItem, CollectionOption } from '../types';

interface CollectionDetailViewProps {
    onBack: () => void;
    onGenerateOrder?: (order: Order) => void;
    onQuickView?: (productId: string) => void;
}

const getMaterialColor = (name: string) => {
    if (name.includes('绿')) return '#14452F';
    if (name.includes('黄') || name.includes('金')) return '#D6AD60';
    if (name.includes('蓝')) return '#64748B';
    if (name.includes('白') || name.includes('米')) return '#F5F5F4';
    if (name.includes('棕') || name.includes('咖')) return '#78350F';
    if (name.includes('灰')) return '#57534E';
    if (name.includes('黑')) return '#171717';
    return '#E5E7EB';
};

const CollectionDetailView: React.FC<CollectionDetailViewProps> = ({ onBack, onGenerateOrder, onQuickView }) => {
    const config = MOCK_COLLECTION_CONFIG;
    
    // State
    const [selections, setSelections] = useState<Record<string, { optionId: string, spec: string, material: string, qty: number }>>({});
    const slotScrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [quickViewOption, setQuickViewOption] = useState<CollectionOption | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('All');

    // Initialize
    useEffect(() => {
        const defaults: Record<string, any> = {};
        config.slots.forEach(slot => {
            if (slot.options.length > 0) {
                defaults[slot.id] = {
                    optionId: slot.options[0].id,
                    spec: slot.options[0].specs[0],
                    material: slot.options[0].materials[0],
                    qty: 1
                };
            }
        });
        setSelections(defaults);
    }, []);

    const handleSelectionChange = (slotId: string, optionId: string, spec?: string, material?: string) => {
        const option = config.slots.find(s => s.id === slotId)?.options.find(o => o.id === optionId);
        if (!option) return;

        setSelections(prev => ({
            ...prev,
            [slotId]: {
                optionId,
                spec: spec || prev[slotId]?.spec || option.specs[0],
                material: material || (prev[slotId]?.optionId === optionId ? prev[slotId].material : option.materials[0]),
                qty: prev[slotId]?.qty || 1
            }
        }));
    };

    const updateQty = (slotId: string, delta: number) => {
        setSelections(prev => ({
            ...prev,
            [slotId]: {
                ...prev[slotId],
                qty: Math.max(1, prev[slotId].qty + delta)
            }
        }));
    };

    const scrollSlot = (slotId: string, direction: 'left' | 'right') => {
        const container = slotScrollRefs.current[slotId];
        if (container) {
            const scrollAmount = 350;
            container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    const calculateTotal = () => {
        let total = 0;
        let volume = 0;
        Object.keys(selections).forEach(slotId => {
            const sel = selections[slotId];
            const slot = config.slots.find(s => s.id === slotId);
            const option = slot?.options.find(o => o.id === sel.optionId);
            if (option) {
                let itemPrice = option.price;
                if (sel.material.includes('全青皮') || sel.material.includes('真皮')) {
                    itemPrice += 1000;
                }
                total += itemPrice * sel.qty;
                volume += 0.8 * sel.qty;
            }
        });
        return { total, volume };
    };

    const handleSubmitOrder = () => {
        if (!onGenerateOrder) return;
        
        const { total } = calculateTotal();
        const items: OrderItem[] = [];
        
        Object.keys(selections).forEach(slotId => {
            const sel = selections[slotId];
            const slot = config.slots.find(s => s.id === slotId);
            const option = slot?.options.find(o => o.id === sel.optionId);
            
            if (option) {
                items.push({
                    productId: option.id,
                    productName: option.name,
                    imageUrl: option.imageUrl,
                    quantity: sel.qty,
                    price: option.price,
                    specName: sel.spec,
                    material: sel.material,
                    dimensions: '定制尺寸'
                });
            }
        });

        const newOrder: Order = {
            id: `ORD${Date.now()}`,
            status: 'pending_payment',
            createdAt: new Date().toLocaleString(),
            totalAmount: total,
            items: items,
            customer: {
                name: '当前用户',
                phone: '138****0000',
                address: '未填写地址'
            },
            logs: [{
                id: `log_${Date.now()}`,
                action: '从套系方案生成意向订单',
                operator: 'System',
                timestamp: new Date().toLocaleString(),
                type: 'system'
            }],
            internalNotes: []
        };

        onGenerateOrder(newOrder);
    };

    const { total: currentTotal, volume: totalVolume } = calculateTotal();
    const progress = (Object.keys(selections).length / config.slots.length) * 100;

    return (
        <div className="min-h-screen bg-[#F2F4F3] animate-fade-in-up pb-20 font-sans relative">
            {/* Top Nav */}
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200 px-6 h-16 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="flex items-center gap-1 text-stone-500 hover:text-primary transition-colors group">
                        <div className="p-1 rounded-full group-hover:bg-stone-100 transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-sm">返回列表</span>
                    </button>
                    <div className="h-6 w-px bg-stone-200"></div>
                    <div className="flex flex-col">
                        <h1 className="font-serif font-bold text-primary text-base leading-tight">{config.name}</h1>
                        <span className="text-[10px] text-stone-400 font-mono tracking-wider">{config.id} · CONFIGURATOR</span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:block text-right">
                        <div className="text-[10px] text-stone-400 uppercase tracking-wider">Base Price</div>
                        <div className="font-serif font-bold text-stone-600 text-sm">¥{config.basePrice.toLocaleString()} 起</div>
                    </div>
                    <button className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-green-900 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        生成报价单
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
                
                {/* LEFT: Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-10 pb-40 custom-scrollbar">
                    
                    {/* Hero Section */}
                    <div className="relative w-full h-48 md:h-64 rounded-3xl overflow-hidden mb-12 shadow-xl group ring-1 ring-black/5">
                        <img src={config.heroImage} alt={config.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        <div className="absolute bottom-0 left-0 w-full p-8 text-white">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-accent text-stone-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Collection</span>
                                <span className="text-white/80 text-[10px] tracking-widest uppercase">Nordic Series</span>
                            </div>
                            <h2 className="text-3xl font-serif font-bold mb-2">{config.name}</h2>
                            <p className="opacity-90 text-sm font-light max-w-2xl leading-relaxed">{config.description}</p>
                        </div>
                    </div>

                    {/* Slots Configuration */}
                    <div className="space-y-12">
                        {config.slots.map((slot, index) => {
                            const filteredOptions = slot.options.filter(opt => {
                                if (activeCategory === 'All') return true;
                                if (activeCategory === 'Leather') return opt.materials.some(m => m.includes('皮') || m.includes('Leather'));
                                if (activeCategory === 'Fabric') return opt.materials.some(m => m.includes('布') || m.includes('绒') || m.includes('麻'));
                                return true;
                            });

                            return (
                            <div key={slot.id} className="scroll-mt-24 group/slot relative" id={slot.id}>
                                {/* Slot Header */}
                                <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 px-1 gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-stone-300">0{index + 1}</span>
                                            <h3 className="text-xl font-serif font-bold text-primary">{slot.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-stone-500">
                                            <span>快速筛选:</span>
                                            {['All', 'Leather', 'Fabric'].map(cat => (
                                                <button 
                                                    key={cat}
                                                    onClick={() => setActiveCategory(cat)}
                                                    className={`px-2 py-0.5 rounded transition-colors ${activeCategory === cat ? 'bg-primary text-white' : 'hover:bg-stone-200'}`}
                                                >
                                                    {cat === 'All' ? '全部' : cat === 'Leather' ? '真皮' : '布艺'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Pagination Controls - HIGH VISIBILITY */}
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => scrollSlot(slot.id, 'left')}
                                            className="w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center hover:bg-black transition-colors shadow-lg z-10 border-2 border-white/10"
                                            title="Previous"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => scrollSlot(slot.id, 'right')}
                                            className="w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center hover:bg-black transition-colors shadow-lg z-10 border-2 border-white/10"
                                            title="Next"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Horizontal Scroll Container */}
                                <div 
                                    ref={el => slotScrollRefs.current[slot.id] = el}
                                    className="flex overflow-x-auto gap-4 pb-8 pt-2 scrollbar-hide snap-x snap-mandatory px-1"
                                    style={{ scrollBehavior: 'smooth' }}
                                >
                                    {filteredOptions.map((option) => {
                                        const isSelected = selections[slot.id]?.optionId === option.id;
                                        return (
                                            <div 
                                                key={option.id}
                                                className={`snap-center flex-shrink-0 w-[420px] bg-white rounded-xl overflow-hidden border transition-all duration-300 group flex flex-row h-36 ${isSelected ? 'border-primary ring-2 ring-primary ring-offset-2 shadow-lg' : 'border-stone-100 hover:border-primary/50 hover:shadow-md'}`}
                                            >
                                                {/* Left: Square Image */}
                                                <div className="w-36 h-36 relative flex-shrink-0 bg-stone-100 border-r border-stone-50">
                                                    <img src={option.imageUrl} alt={option.name} className="w-full h-full object-cover" />
                                                    
                                                    {/* Quick View Button - Eye Icon */}
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setQuickViewOption(option);
                                                        }}
                                                        className="absolute top-2 left-2 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur rounded-full text-stone-600 hover:text-primary hover:bg-white shadow-md transition-all z-20"
                                                        title="Quick View"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Right: Info */}
                                                <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                                                    <div>
                                                        <div className="flex justify-between items-start">
                                                            <h4 className="font-bold text-stone-800 line-clamp-1 text-sm pr-2" title={option.name}>{option.name}</h4>
                                                            {isSelected && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />}
                                                        </div>
                                                        <div className="text-[#C04E39] font-serif font-bold mt-1 text-base">¥{option.price.toLocaleString()}</div>
                                                    </div>

                                                    <div className="space-y-2 mt-2">
                                                        <div className="text-[10px] text-stone-400">可选规格: {option.specs.length} 款</div>
                                                        
                                                        {/* Select Button */}
                                                        <button 
                                                            onClick={() => handleSelectionChange(slot.id, option.id)}
                                                            className={`w-full py-2 rounded text-xs font-bold transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
                                                        >
                                                            {isSelected ? '已添加到清单' : '加入配置'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT: Floating Sidebar (Invoice Style) */}
                <div className="hidden lg:block w-96 bg-white border-l border-stone-100 shadow-2xl relative z-30 flex flex-col">
                    <div className="p-6 border-b border-stone-100 bg-stone-50/50">
                        <h3 className="font-serif font-bold text-primary text-lg mb-1">配置清单</h3>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-stone-400 uppercase tracking-widest">Pro Forma Invoice</span>
                            <div className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">Draft</div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Progress */}
                        <div className="mb-6">
                            <div className="flex justify-between text-xs font-bold mb-2">
                                <span className="text-stone-500">完成度</span>
                                <span className="text-primary">{Math.round(progress)}%</span>
                            </div>
                            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>

                        {/* Selected Items List */}
                        <div className="space-y-4">
                            {config.slots.map(slot => {
                                const sel = selections[slot.id];
                                const option = slot.options.find(o => o.id === sel?.optionId);
                                
                                if (!sel || !option) return (
                                    <div key={slot.id} className="p-4 border border-dashed border-stone-200 rounded-xl text-center">
                                        <span className="text-xs text-stone-400">未选择 {slot.name}</span>
                                    </div>
                                );

                                return (
                                    <div key={slot.id} className="flex gap-3 items-start group">
                                        <div className="w-12 h-12 rounded bg-stone-50 overflow-hidden flex-shrink-0 border border-stone-100">
                                            <img src={option.imageUrl} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs font-bold text-stone-700 line-clamp-1">{option.name}</span>
                                                <span className="text-xs font-serif font-bold text-stone-900">¥{(option.price * sel.qty).toLocaleString()}</span>
                                            </div>
                                            <div className="text-[10px] text-stone-500 mt-0.5 truncate">{sel.material}</div>
                                            
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="flex items-center border border-stone-200 rounded bg-white">
                                                    <button onClick={() => updateQty(slot.id, -1)} className="p-0.5 hover:bg-stone-50"><Minus className="w-3 h-3 text-stone-400" /></button>
                                                    <span className="text-[10px] w-4 text-center">{sel.qty}</span>
                                                    <button onClick={() => updateQty(slot.id, 1)} className="p-0.5 hover:bg-stone-50"><Plus className="w-3 h-3 text-stone-400" /></button>
                                                </div>
                                                <button onClick={() => document.getElementById(slot.id)?.scrollIntoView({ behavior: 'smooth' })} className="text-[10px] text-primary underline opacity-0 group-hover:opacity-100 transition-opacity">
                                                    修改
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Summary Footer */}
                    <div className="p-6 bg-stone-50 border-t border-stone-200 space-y-4">
                         <div className="space-y-2 text-xs text-stone-500">
                            <div className="flex justify-between">
                                <span>商品总额</span>
                                <span>¥{currentTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-emerald-600">
                                <span>材质升级 (真皮)</span>
                                <span>+¥0</span>
                            </div>
                             <div className="flex justify-between">
                                <span>预估体积</span>
                                <span>{totalVolume.toFixed(2)} m³</span>
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t border-stone-200">
                            <div className="flex justify-between items-end mb-4">
                                <span className="font-bold text-primary">预估总价</span>
                                <span className="font-serif font-bold text-2xl text-[#C04E39]">¥{currentTotal.toLocaleString()}</span>
                            </div>
                            <button 
                                onClick={handleSubmitOrder}
                                className="w-full bg-primary text-white py-3.5 rounded-xl font-bold hover:bg-green-900 shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                提交采购意向 <ArrowRight className="w-4 h-4" />
                            </button>
                            <p className="text-[10px] text-center text-stone-400 mt-2">
                                * 最终报价以销售顾问确认为准
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mobile Bottom Bar (visible only on small screens) */}
                <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-stone-200 p-4 z-50 flex justify-between items-center shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                     <div>
                        <div className="text-[10px] text-stone-400 uppercase">Total Estimate</div>
                        <div className="font-serif font-bold text-xl text-[#C04E39]">¥{currentTotal.toLocaleString()}</div>
                     </div>
                     <button 
                        onClick={handleSubmitOrder}
                        className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg"
                    >
                        提交意向
                    </button>
                </div>
            </div>

            {/* Quick View Modal (Internal) */}
            {quickViewOption && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up" onClick={() => setQuickViewOption(null)}>
                    <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                        <div className="relative h-64 bg-stone-100">
                            <img src={quickViewOption.imageUrl} alt="" className="w-full h-full object-cover" />
                            <button onClick={() => setQuickViewOption(null)} className="absolute top-2 right-2 bg-black/40 hover:bg-black/60 text-white p-1 rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <h3 className="text-xl font-serif font-bold text-primary mb-1">{quickViewOption.name}</h3>
                            <div className="text-2xl font-serif font-bold text-[#C04E39] mb-4">¥{quickViewOption.price.toLocaleString()}</div>
                            
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Available Specs</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {quickViewOption.specs.map(spec => (
                                            <span key={spec} className="text-xs border border-stone-200 px-2 py-1 rounded bg-stone-50 text-stone-600">{spec}</span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Materials</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {quickViewOption.materials.map(mat => (
                                            <span key={mat} className="text-xs border border-stone-200 px-2 py-1 rounded bg-stone-50 text-stone-600 flex items-center gap-1">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getMaterialColor(mat) }}></div>
                                                {mat}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-stone-100 bg-stone-50">
                            <button 
                                onClick={() => setQuickViewOption(null)}
                                className="w-full bg-stone-200 text-stone-600 py-3 rounded-xl font-bold hover:bg-stone-300"
                            >
                                关闭
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CollectionDetailView;
