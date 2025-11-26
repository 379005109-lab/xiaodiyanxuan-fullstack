
import React, { useState } from 'react';
import { MOCK_CART } from '../constants';
import { CartItem } from '../types';
import { Minus, Plus, Trash2, ArrowRight, Package, TrendingUp, Wallet, Tag } from 'lucide-react';

interface CartViewProps {
    onCheckout: (items: CartItem[], total: number) => void;
}

const CartView: React.FC<CartViewProps> = ({ onCheckout }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>(MOCK_CART);

    const updateQuantity = (id: string, delta: number) => {
        setCartItems(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const toggleSelect = (id: string) => {
        setCartItems(prev => prev.map(item => 
            item.id === id ? { ...item, selected: !item.selected } : item
        ));
    };

    const removeItem = (id: string) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const clearCart = () => {
        if (window.confirm('确定要清空购物车吗？')) {
            setCartItems([]);
        }
    };

    const selectedItems = cartItems.filter(i => i.selected);
    const totalAmount = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Statistics for cards (based on ALL items in cart, not just selected, usually stats show everything)
    const totalTypes = cartItems.length;
    const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const allTotalValue = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const avgPrice = totalCount > 0 ? Math.round(allTotalValue / totalCount) : 0;

    return (
        <div className="animate-fade-in-up pb-32">
            <div className="max-w-5xl mx-auto px-6 py-12">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-primary mb-2">购物袋</h1>
                        <p className="text-stone-500 uppercase tracking-widest text-xs">Shopping Bag ({cartItems.length})</p>
                    </div>
                    {cartItems.length > 0 && (
                        <button 
                            onClick={clearCart}
                            className="text-sm text-stone-400 hover:text-red-500 transition-colors flex items-center gap-1 border-b border-transparent hover:border-red-500 pb-0.5"
                        >
                            <Trash2 className="w-3 h-3" /> 清空购物车
                        </button>
                    )}
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    <div className="bg-white p-5 rounded-xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-3">
                            <Package className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-bold text-stone-500">商品种类</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">{totalTypes}</div>
                    </div>
                    
                    <div className="bg-white p-5 rounded-xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-bold text-stone-500">商品总数</span>
                        </div>
                        <div className="text-2xl font-bold text-emerald-600">{totalCount}</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-3">
                            <Wallet className="w-4 h-4 text-red-500" />
                            <span className="text-xs font-bold text-stone-500">合计金额</span>
                        </div>
                        <div className="text-2xl font-bold text-red-600">¥{allTotalValue.toLocaleString()}</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-3">
                            <Tag className="w-4 h-4 text-purple-500" />
                            <span className="text-xs font-bold text-stone-500">平均价格</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-600">¥{avgPrice.toLocaleString()}</div>
                    </div>
                </div>

                {cartItems.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-stone-100">
                        <p className="text-stone-400 font-serif italic mb-4">您的购物袋是空的</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {cartItems.map(item => (
                            <div key={item.id} className="bg-white p-4 md:p-6 rounded-2xl border border-stone-100 shadow-sm flex flex-col md:flex-row gap-6 items-center group hover:border-primary/20 transition-all">
                                {/* Checkbox & Image */}
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <input 
                                        type="checkbox" 
                                        checked={item.selected} 
                                        onChange={() => toggleSelect(item.id)}
                                        className="w-5 h-5 rounded border-stone-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                                    />
                                    <div className="w-24 h-24 md:w-32 md:h-32 bg-stone-50 rounded-xl overflow-hidden border border-stone-200">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 w-full md:w-auto text-left">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg text-primary">{item.name}</h3>
                                        <button onClick={() => removeItem(item.id)} className="text-stone-400 hover:text-red-500 transition-colors p-1">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-1 text-sm text-stone-500 mb-4">
                                        <p>规格: <span className="text-stone-800">{item.spec}</span></p>
                                        <p>面料: <span className="text-stone-800">{item.material}</span></p>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <div className="font-serif font-bold text-xl text-[#C04E39]">¥{item.price.toLocaleString()}</div>
                                        
                                        <div className="flex items-center bg-stone-50 border border-stone-200 rounded-lg">
                                            <button 
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="p-2 text-stone-500 hover:text-primary transition-colors disabled:opacity-30"
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                                            <button 
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="p-2 text-stone-500 hover:text-primary transition-colors"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Bottom Bar */}
            {cartItems.length > 0 && (
                <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-stone-200 p-4 z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                    <div className="max-w-5xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <span className="text-stone-500 text-sm hidden md:inline">已选 {selectedItems.length} 件商品</span>
                            <div className="flex items-baseline gap-2">
                                <span className="font-bold text-primary">合计:</span>
                                <span className="font-serif font-bold text-2xl text-[#C04E39]">¥{totalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => onCheckout(selectedItems, totalAmount)}
                            disabled={selectedItems.length === 0}
                            className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-green-900 shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-1 flex items-center gap-2 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                        >
                            立即结算
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartView;
