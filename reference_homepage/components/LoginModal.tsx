
import React, { useState } from 'react';
import { X, User, Lock, ArrowRight, Loader2 } from 'lucide-react';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isRegister, setIsRegister] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            onLogin();
        }, 1000);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-stone-100 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-stone-400" />
                </button>

                <div className="p-8 pt-12">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-serif font-bold text-primary mb-2">
                            {isRegister ? '注册账号' : '欢迎回来'}
                        </h2>
                        <p className="text-stone-500 text-sm">
                            {isRegister ? '加入小迪严选，开启高端家居之旅' : '登录以访问您的定制需求和订单'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-500 ml-1">手机号码</label>
                            <div className="relative">
                                <input 
                                    type="tel" 
                                    placeholder="请输入手机号" 
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 pl-10 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                    required
                                />
                                <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-500 ml-1">密码</label>
                            <div className="relative">
                                <input 
                                    type="password" 
                                    placeholder="请输入密码" 
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 pl-10 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                    required
                                />
                                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        {isRegister && (
                            <div className="space-y-1 animate-fade-in-up">
                                <label className="text-xs font-bold text-stone-500 ml-1">验证码</label>
                                <div className="flex gap-3">
                                    <input 
                                        type="text" 
                                        placeholder="0000" 
                                        className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all text-center tracking-widest"
                                    />
                                    <button type="button" className="px-4 py-3 bg-stone-100 text-stone-600 rounded-xl text-sm font-bold hover:bg-stone-200 whitespace-nowrap">
                                        获取验证码
                                    </button>
                                </div>
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-white py-3.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-green-900 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {isRegister ? '立即注册' : '登 录'}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button 
                            onClick={() => setIsRegister(!isRegister)}
                            className="text-sm text-stone-400 hover:text-primary transition-colors"
                        >
                            {isRegister ? '已有账号？去登录' : '还没有账号？立即注册'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
