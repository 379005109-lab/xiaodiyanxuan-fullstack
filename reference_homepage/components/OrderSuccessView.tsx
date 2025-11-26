
import React from 'react';
import { CheckCircle, ArrowRight, ShoppingBag, ClipboardList } from 'lucide-react';
import { Page } from '../types';

interface OrderSuccessViewProps {
    orderId: string | null;
    setCurrentPage: (page: Page) => void;
}

const OrderSuccessView: React.FC<OrderSuccessViewProps> = ({ orderId, setCurrentPage }) => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 animate-fade-in-up bg-stone-50">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-lg w-full text-center border border-stone-100">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            
            <h1 className="text-3xl font-serif font-bold text-primary mb-2">提交成功</h1>
            <p className="text-stone-500 mb-8">
                您的意向采购单已生成，我们的销售顾问将在 24 小时内与您联系。
            </p>

            {orderId && (
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 mb-8">
                    <span className="text-xs text-stone-400 uppercase tracking-widest block mb-1">Order Reference</span>
                    <span className="font-mono font-bold text-lg text-primary">{orderId}</span>
                </div>
            )}

            <div className="flex flex-col gap-3">
                <button 
                    onClick={() => setCurrentPage('orders')}
                    className="w-full bg-primary text-white py-3.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-green-900 transition-colors flex items-center justify-center gap-2"
                >
                    <ClipboardList className="w-4 h-4" />
                    查看我的订单
                </button>
                <button 
                    onClick={() => setCurrentPage('home')}
                    className="w-full bg-white text-stone-600 border border-stone-200 py-3.5 rounded-xl font-bold hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
                >
                    <ShoppingBag className="w-4 h-4" />
                    返回首页
                </button>
            </div>
        </div>
    </div>
  );
};

export default OrderSuccessView;
