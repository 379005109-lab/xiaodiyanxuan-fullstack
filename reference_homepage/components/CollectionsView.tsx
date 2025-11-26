
import React from 'react';
import { COLLECTIONS } from '../constants';
import { ArrowUpRight } from 'lucide-react';
import { Page } from '../types';

interface CollectionsViewProps {
    setCurrentPage?: (page: Page) => void;
}

const CollectionsView: React.FC<CollectionsViewProps> = ({ setCurrentPage }) => {
  return (
    <div className="animate-fade-in-up pb-20">
       {/* Header */}
       <div className="bg-stone-100 py-16 text-center">
            <h1 className="text-4xl font-serif font-bold text-primary mb-2">灵感套系</h1>
            <p className="text-stone-500 uppercase tracking-[0.2em] text-sm">Curated Collections</p>
       </div>

       <div className="max-w-7xl mx-auto px-6 -mt-8">
            <div className="grid grid-cols-1 gap-12">
                {COLLECTIONS.map((collection, idx) => (
                    <div key={collection.id} className={`flex flex-col ${idx % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 group`}>
                        {/* Image */}
                        <div 
                            className="md:w-3/5 relative overflow-hidden h-64 md:h-auto cursor-pointer"
                            onClick={() => setCurrentPage?.('collection-detail')}
                        >
                            <img 
                                src={collection.image} 
                                alt={collection.title} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                        </div>
                        
                        {/* Content */}
                        <div className="md:w-2/5 p-10 flex flex-col justify-center space-y-6">
                            <div className="flex items-center gap-3">
                                <span className="text-6xl font-serif text-stone-100 font-bold -ml-2">0{collection.id}</span>
                                <div className="h-px bg-primary flex-1 opacity-20"></div>
                            </div>
                            
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-primary mb-2">{collection.title}</h2>
                                <p className="text-stone-500 leading-relaxed text-sm">{collection.description}</p>
                            </div>

                            <div className="bg-stone-50 p-4 rounded-xl space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-400">包含单品</span>
                                    <span className="font-medium text-primary">{collection.items} 件</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-400">起售价</span>
                                    <span className="font-serif font-bold text-accent text-lg">¥{collection.priceStart.toLocaleString()}</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => setCurrentPage?.('collection-detail')}
                                className="flex items-center justify-between w-full bg-primary text-white p-4 rounded-xl hover:bg-green-900 transition-colors group/btn"
                            >
                                <span className="font-serif italic text-sm">配置此套系</span>
                                <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
       </div>
    </div>
  );
};

export default CollectionsView;
