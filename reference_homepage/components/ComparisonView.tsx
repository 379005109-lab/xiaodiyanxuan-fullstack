
import React from 'react';
import { ProductDetail } from '../types';
import { X, CheckCircle, ShoppingCart, AlertCircle } from 'lucide-react';

interface ComparisonViewProps {
    products: ProductDetail[];
    onRemove: (productId: string) => void;
    onClear: () => void;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ products, onRemove, onClear }) => {
    
    if (products.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <AlertCircle className="w-12 h-12 text-stone-300 mb-4" />
                <h2 className="text-2xl font-serif font-bold text-primary mb-2">暂无对比商品</h2>
                <p className="text-stone-500 mb-6">请从商城添加商品进行对比</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up pb-20">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex justify-between items-end mb-8 border-b border-stone-200 pb-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-primary">商品对比</h1>
                        <p className="text-stone-500 text-sm mt-1">对比不同商品的规格、材质和价格，帮助您做出最佳选择</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-stone-500 bg-white border border-stone-200 px-3 py-1 rounded-full">已对比: {products.length}/4</span>
                        <button onClick={onClear} className="text-sm text-[#C04E39] hover:underline">清空对比栏</button>
                    </div>
                </div>

                <div className="overflow-x-auto pb-4">
                    <table className="w-full min-w-[800px] border-separate border-spacing-0 comparison-table">
                        <thead>
                            <tr>
                                <th className="bg-transparent p-4 text-left w-48 sticky left-0 z-10">
                                    <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">对比项</div>
                                </th>
                                {products.map(p => (
                                    <th key={p.id} className="p-4 w-72 bg-white rounded-t-xl border-t border-x border-stone-100 relative">
                                        <button 
                                            onClick={() => onRemove(p.id)}
                                            className="absolute top-2 right-2 bg-stone-100 hover:bg-stone-200 rounded-full p-1 transition-colors"
                                        >
                                            <X className="w-4 h-4 text-stone-500" />
                                        </button>
                                        <div className="w-full aspect-[4/3] bg-stone-50 rounded-lg overflow-hidden mb-4">
                                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                        </div>
                                        <h3 className="text-center font-bold text-primary">{p.name}</h3>
                                    </th>
                                ))}
                                {/* Fill empty slots if needed for grid alignment visual, optional */}
                                {Array.from({length: Math.max(0, 4 - products.length)}).map((_, i) => (
                                    <th key={`empty-${i}`} className="p-4 w-72 bg-stone-50/30 rounded-t-xl border-t border-x border-dashed border-stone-200">
                                        <div className="h-full flex items-center justify-center text-stone-300 text-sm">
                                            空槽位
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Price Row */}
                            <tr>
                                <td className="p-4 text-sm font-bold text-stone-500 sticky left-0 bg-stone-50/80 backdrop-blur z-10 border-b border-stone-200">价格 Price</td>
                                {products.map(p => (
                                    <td key={p.id} className="p-4 text-center bg-white border-x border-b border-stone-100">
                                        <div className="font-serif font-bold text-xl text-[#C04E39]">¥{p.price.toLocaleString()}</div>
                                        <div className="text-xs text-stone-400 line-through">¥{(p.price * 1.2).toFixed(0)}</div>
                                    </td>
                                ))}
                                {Array.from({length: Math.max(0, 4 - products.length)}).map((_, i) => <td key={i} className="border-b border-stone-100"></td>)}
                            </tr>

                            {/* Model No */}
                            <tr>
                                <td className="p-4 text-sm font-bold text-stone-500 sticky left-0 bg-stone-50/80 backdrop-blur z-10 border-b border-stone-200">型号 Model</td>
                                {products.map(p => (
                                    <td key={p.id} className="p-4 text-center bg-white border-x border-b border-stone-100 font-mono text-sm text-stone-600">
                                        {p.modelNo || 'N/A'}
                                    </td>
                                ))}
                                {Array.from({length: Math.max(0, 4 - products.length)}).map((_, i) => <td key={i} className="border-b border-stone-100"></td>)}
                            </tr>

                            {/* Dimensions */}
                            <tr>
                                <td className="p-4 text-sm font-bold text-stone-500 sticky left-0 bg-stone-50/80 backdrop-blur z-10 border-b border-stone-200">规格 Specs</td>
                                {products.map(p => (
                                    <td key={p.id} className="p-4 text-center bg-white border-x border-b border-stone-100 text-sm text-stone-600">
                                        {p.specs[0]?.name || '标准款'}
                                    </td>
                                ))}
                                {Array.from({length: Math.max(0, 4 - products.length)}).map((_, i) => <td key={i} className="border-b border-stone-100"></td>)}
                            </tr>

                            {/* Materials */}
                            <tr>
                                <td className="p-4 text-sm font-bold text-stone-500 sticky left-0 bg-stone-50/80 backdrop-blur z-10 border-b border-stone-200">面料 Material</td>
                                {products.map(p => (
                                    <td key={p.id} className="p-4 text-center bg-white border-x border-b border-stone-100">
                                        <div className="flex flex-col items-center gap-2">
                                            <img src={p.materials[0]?.thumbnail} className="w-10 h-10 rounded border border-stone-200" alt="" />
                                            <span className="text-xs text-stone-600">{p.materials[0]?.name}</span>
                                        </div>
                                    </td>
                                ))}
                                {Array.from({length: Math.max(0, 4 - products.length)}).map((_, i) => <td key={i} className="border-b border-stone-100"></td>)}
                            </tr>

                             {/* Dimensions Detailed */}
                             <tr>
                                <td className="p-4 text-sm font-bold text-stone-500 sticky left-0 bg-stone-50/80 backdrop-blur z-10 border-b border-stone-200">尺寸 Dimensions</td>
                                {products.map(p => (
                                    <td key={p.id} className="p-4 text-center bg-white border-x border-b border-stone-100 text-xs text-stone-500 uppercase">
                                        {p.specs[0]?.dimensions || 'N/A'}
                                    </td>
                                ))}
                                {Array.from({length: Math.max(0, 4 - products.length)}).map((_, i) => <td key={i} className="border-b border-stone-100"></td>)}
                            </tr>

                            {/* Actions */}
                            <tr>
                                <td className="p-4 text-sm font-bold text-stone-500 sticky left-0 bg-stone-50/80 backdrop-blur z-10 rounded-bl-xl border-b border-stone-200">操作 Action</td>
                                {products.map(p => (
                                    <td key={p.id} className="p-4 text-center bg-white border-x border-b border-stone-100 last:rounded-br-xl">
                                        <div className="flex flex-col gap-2">
                                            <button className="w-full bg-primary text-white py-2 rounded-lg text-sm font-bold hover:bg-green-900 flex items-center justify-center gap-2">
                                                <ShoppingCart className="w-4 h-4" /> 加入购物车
                                            </button>
                                            <button className="w-full bg-stone-100 text-stone-600 py-2 rounded-lg text-sm font-bold hover:bg-stone-200">
                                                查看详情
                                            </button>
                                        </div>
                                    </td>
                                ))}
                                {Array.from({length: Math.max(0, 4 - products.length)}).map((_, i) => <td key={i} className="border-b border-stone-100"></td>)}
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-center mt-8">
                    <button className="bg-stone-200 text-stone-600 px-6 py-2 rounded-lg text-sm font-bold hover:bg-stone-300">
                        继续选购
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComparisonView;
