
import React, { useState } from 'react';
import { X, MapPin, Phone, User, CheckCircle } from 'lucide-react';
import { CartItem } from '../types';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    cartItems: CartItem[];
    totalAmount: number;
    onConfirm: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, cartItems, totalAmount, onConfirm }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        note: ''
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[85vh] md:h-[600px]">
                
                {/* Left: Form */}
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6 md:hidden">
                        <h2 className="text-xl font-serif font-bold text-primary">确认订单</h2>
                        <button onClick={onClose}><X className="w-6 h-6 text-stone-400" /></button>
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-primary mb-8 hidden md:block">确认订单 Checkout</h2>
                    
                    <div className="space-y-6">
                        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">收货信息 Shipping Info</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-stone-500">收货人姓名 <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="请输入收货人姓名"
                                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 pl-10 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                    />
                                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-stone-500">联系电话 <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="请输入手机号码"
                                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 pl-10 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                        value={formData.phone}
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                    />
                                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-500">收货地址 <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="请输入完整的收货地址"
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 pl-10 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                    value={formData.address}
                                    onChange={e => setFormData({...formData, address: e.target.value})}
                                />
                                <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-500">备注 (选填)</label>
                            <textarea 
                                placeholder="如有特殊要求，请在此说明"
                                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all resize-none h-24"
                                value={formData.note}
                                onChange={e => setFormData({...formData, note: e.target.value})}
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Right: Summary */}
                <div className="w-full md:w-[380px] bg-stone-50 p-8 flex flex-col border-l border-stone-100">
                     <div className="flex justify-between items-center mb-6 hidden md:flex">
                        <h3 className="font-serif font-bold text-lg text-primary">订单摘要</h3>
                        <button onClick={onClose} className="hover:bg-stone-200 p-1.5 rounded-full transition-colors"><X className="w-5 h-5 text-stone-500" /></button>
                     </div>

                     <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                        {cartItems.map(item => (
                            <div key={item.id} className="flex gap-3 bg-white p-3 rounded-xl border border-stone-100">
                                <img src={item.image} alt="" className="w-16 h-16 object-cover rounded-lg bg-stone-100" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm text-primary truncate">{item.name}</h4>
                                    <p className="text-xs text-stone-500 truncate">{item.spec}</p>
                                    <p className="text-xs text-stone-500 truncate mb-1">面料: {item.material}</p>
                                    <div className="flex justify-between items-center">
                                         <span className="text-xs text-stone-400">数量: {item.quantity}</span>
                                         <span className="text-sm font-bold text-[#C04E39]">¥{item.price.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                     </div>

                     <div className="mt-6 border-t border-stone-200 pt-6 space-y-3">
                        <div className="flex justify-between text-sm text-stone-600">
                            <span>商品总计</span>
                            <span className="font-medium">¥{totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-stone-600">
                            <span>运费</span>
                            <span className="text-green-600 font-medium">免费</span>
                        </div>
                        <div className="flex justify-between items-baseline pt-2">
                            <span className="font-serif font-bold text-lg text-primary">合计 Total</span>
                            <span className="font-serif font-bold text-2xl text-[#C04E39]">¥{totalAmount.toLocaleString()}</span>
                        </div>
                     </div>

                     <div className="mt-8 flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-stone-200 font-medium text-stone-600 hover:bg-stone-100 transition-colors"
                        >
                            取消
                        </button>
                        <button 
                            onClick={onConfirm}
                            className="flex-[2] py-3 rounded-xl bg-primary text-white font-bold hover:bg-green-900 shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5"
                        >
                            提交订单
                        </button>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutModal;