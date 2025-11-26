
import React from 'react';
import { Product } from '../types';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';

interface WishlistViewProps {
    products: Product[];
    onRemove: (id: string) => void;
    onViewProduct: (id: string) => void;
}

const WishlistView: React.FC<WishlistViewProps> = ({ products, onRemove, onViewProduct }) => {
    return (
        <div className="animate-fade-in-up min-h-screen pb-20">
            <div className="bg-stone-900 py-16 text-center text-white">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <Heart className="w-8 h-8 text-accent fill-current" />
                </div>
                <h1 className="text-3xl font-serif font-bold mb-2">我的心愿单</h1>
                <p className="text-stone-400 uppercase tracking-widest text-sm">My Wishlist ({products.length})</p>
            </div>

            <div className="max-w-5xl mx-auto px-6 -mt-8">
                {products.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-xl p-16 text-center border border-stone-100">
                        <p className="text-stone-400 font-serif italic text-lg mb-6">暂无收藏商品</p>
                        <button className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-green-900 transition-colors">
                            去商城逛逛
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map(product => (
                            <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-stone-100 group hover:border-primary/30 transition-all">
                                <div className="relative aspect-[4/3] overflow-hidden cursor-pointer" onClick={() => onViewProduct(product.id)}>
                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onRemove(product.id); }}
                                        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full text-stone-400 hover:text-red-500 transition-colors shadow-sm"
                                        title="移除"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <div className="p-5">
                                    <div className="mb-4">
                                        <h3 className="font-bold text-primary text-lg mb-1">{product.name}</h3>
                                        <p className="text-xs text-stone-400 font-mono">{product.modelNo}</p>
                                    </div>
                                    
                                    <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                                        <div className="font-serif font-bold text-[#C04E39] text-xl">¥{product.price.toLocaleString()}</div>
                                        <button 
                                            onClick={() => onViewProduct(product.id)}
                                            className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/5 px-3 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors"
                                        >
                                            查看详情 <ArrowRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WishlistView;
