
import React, { useState } from 'react';
import { X, Send, CheckCircle, FileText } from 'lucide-react';

interface CustomizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    productName: string;
}

const CustomizationModal: React.FC<CustomizationModalProps> = ({ isOpen, onClose, productName }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        requirements: '',
        dimensions: '',
        budget: '',
        contactTime: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-stone-100 rounded-full transition-colors z-10"
                >
                    <X className="w-5 h-5 text-stone-400" />
                </button>

                {step === 1 ? (
                    <div className="p-8 pt-10">
                        <div className="mb-6">
                            <h2 className="text-2xl font-serif font-bold text-primary mb-1">个性化定制申请</h2>
                            <p className="text-stone-500 text-sm">针对商品：<span className="font-bold text-primary">{productName}</span></p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-stone-500 mb-1 block">特殊尺寸/规格要求</label>
                                <input 
                                    type="text" 
                                    placeholder="例如：长度需要调整为 2.8米"
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary outline-none"
                                    value={formData.dimensions}
                                    onChange={e => setFormData({...formData, dimensions: e.target.value})}
                                />
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-stone-500 mb-1 block">定制详情描述</label>
                                <textarea 
                                    placeholder="请描述您对材质、颜色或结构的特殊需求..."
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary outline-none h-24 resize-none"
                                    value={formData.requirements}
                                    onChange={e => setFormData({...formData, requirements: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-stone-500 mb-1 block">预估预算</label>
                                    <input 
                                        type="text" 
                                        placeholder="¥"
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary outline-none"
                                        value={formData.budget}
                                        onChange={e => setFormData({...formData, budget: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-stone-500 mb-1 block">方便联系时间</label>
                                    <select 
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary outline-none"
                                        value={formData.contactTime}
                                        onChange={e => setFormData({...formData, contactTime: e.target.value})}
                                    >
                                        <option value="">随时</option>
                                        <option value="morning">工作日上午</option>
                                        <option value="afternoon">工作日下午</option>
                                        <option value="weekend">周末</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-yellow-50 p-3 rounded-lg flex gap-3 items-start mt-4">
                                <FileText className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-yellow-700 leading-relaxed">
                                    提交后，我们的定制顾问将在 24 小时内与您电话联系，确认具体工艺细节并提供报价。
                                </p>
                            </div>

                            <button 
                                type="submit"
                                className="w-full bg-primary text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-green-900 transition-colors flex items-center justify-center gap-2 mt-4"
                            >
                                提交定制需求
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-fade-in-up">
                            <CheckCircle className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-primary mb-2">提交成功</h2>
                        <p className="text-stone-500 mb-8">
                            您的定制需求已收到。<br/>顾问将尽快与您取得联系。
                        </p>
                        <button 
                            onClick={onClose}
                            className="bg-stone-100 text-stone-600 px-8 py-3 rounded-xl font-bold hover:bg-stone-200 transition-colors"
                        >
                            关闭
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomizationModal;
