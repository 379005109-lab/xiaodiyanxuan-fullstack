
import React from 'react';
import { SERVICES } from '../constants';
import { Check, Sparkles, MapPin, Car, ShoppingBag, UserCheck } from 'lucide-react';

interface DesignViewProps {
    onBookService?: (serviceName: string) => void;
}

const DesignView: React.FC<DesignViewProps> = ({ onBookService }) => {
  return (
    <div className="animate-fade-in-up pb-20 bg-stone-50">
        {/* Hero */}
        <div className="relative py-24 bg-primary overflow-hidden">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-12 transform translate-x-20"></div>
            <div className="max-w-7xl mx-auto px-6 relative z-10 text-center text-white">
                <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">佛山源头陪买服务</h1>
                <p className="text-green-100/80 max-w-2xl mx-auto text-lg font-light">
                    深入佛山家具产业带，专车接送，资深买手带您逛遍 200+ 源头展厅。<br/>省去中间商差价，享受真正的一手出厂价。
                </p>
            </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-4xl mx-auto px-6 -mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-20">
            {SERVICES.map((service, idx) => (
                <div 
                    key={idx} 
                    className={`bg-white rounded-2xl p-10 shadow-xl flex flex-col relative ${service.isPopular ? 'ring-2 ring-accent ring-offset-4' : ''}`}
                >
                    {service.isPopular && (
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-accent text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-md flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Most Value
                        </div>
                    )}

                    <div className="mb-8 text-center border-b border-stone-100 pb-8">
                        <h3 className="text-2xl font-bold text-primary mb-1">{service.title}</h3>
                        <p className="text-xs text-stone-400 uppercase tracking-widest mb-6">{service.enTitle}</p>
                        <div className="text-4xl font-serif font-bold text-accent">{service.price}</div>
                        {idx === 0 && <p className="text-xs text-stone-400 mt-2">* 购满 5 万元可全额抵扣服务费</p>}
                    </div>

                    <ul className="flex-1 space-y-5 mb-10">
                        {service.features.map((feature, fIdx) => (
                            <li key={fIdx} className="flex items-center text-sm text-stone-600 font-medium">
                                <div className="w-6 h-6 rounded-full bg-green-50 text-green-600 flex items-center justify-center mr-4 flex-shrink-0">
                                    <Check className="w-4 h-4" />
                                </div>
                                {feature}
                            </li>
                        ))}
                    </ul>

                    <button 
                        onClick={() => onBookService?.(service.title)}
                        className={`w-full py-4 rounded-xl font-bold transition-colors ${service.isPopular ? 'bg-primary text-white hover:bg-green-900 shadow-lg' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                    >
                        立即预约
                    </button>
                </div>
            ))}
        </div>

        {/* Value Props */}
        <div className="max-w-7xl mx-auto px-6 py-24">
            <h2 className="text-center text-3xl font-serif font-bold text-primary mb-16">为什么选择小迪陪买？</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                 <div className="bg-white p-6 rounded-xl border border-stone-100 text-center hover:border-primary/30 transition-colors">
                    <div className="w-12 h-12 bg-primary/5 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-stone-800 mb-2">源头直达</h4>
                    <p className="text-sm text-stone-500">直连 200+ 工厂展厅，拒绝中间商赚差价。</p>
                 </div>
                 <div className="bg-white p-6 rounded-xl border border-stone-100 text-center hover:border-primary/30 transition-colors">
                    <div className="w-12 h-12 bg-primary/5 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <Car className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-stone-800 mb-2">专车接送</h4>
                    <p className="text-sm text-stone-500">高铁站/机场专车接送，全程舒适出行。</p>
                 </div>
                 <div className="bg-white p-6 rounded-xl border border-stone-100 text-center hover:border-primary/30 transition-colors">
                    <div className="w-12 h-12 bg-primary/5 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserCheck className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-stone-800 mb-2">专业把关</h4>
                    <p className="text-sm text-stone-500">资深行业买手陪同，帮您避坑砍价。</p>
                 </div>
                 <div className="bg-white p-6 rounded-xl border border-stone-100 text-center hover:border-primary/30 transition-colors">
                    <div className="w-12 h-12 bg-primary/5 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-stone-800 mb-2">售后无忧</h4>
                    <p className="text-sm text-stone-500">平台统一跟单发货，出现质量问题先行赔付。</p>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default DesignView;
