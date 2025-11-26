
import React from 'react';
import { Product } from '../types';
import { Package, Clock, ArrowUpRight, Eye, Ruler } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onClick?: (productId: string) => void;
  onQuickView?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, onQuickView }) => {
  return (
    <div 
        className="group relative cursor-pointer bg-white rounded-xl overflow-hidden border border-stone-100 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
        onClick={() => onClick?.(product.id)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] bg-stone-100 overflow-hidden">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        
        {/* Overlay Action */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onQuickView?.(product);
                }}
                className="bg-white text-stone-600 p-2.5 rounded-full hover:bg-primary hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300 shadow-lg"
                title="Quick View"
            >
                <Eye className="w-4 h-4" />
            </button>
            <div className="bg-white/90 backdrop-blur text-primary px-4 py-2 rounded-full font-bold text-xs transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-2">
                Details <ArrowUpRight className="w-3 h-3" />
            </div>
        </div>

        {/* B2B Tags - Minimalist */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isNew && (
                <div className="bg-accent text-stone-900 text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest rounded-sm shadow-sm">
                    New
                </div>
            )}
            {product.stockStatus === 'in_stock' ? (
                 <div className="bg-emerald-600/90 backdrop-blur text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest rounded-sm shadow-sm flex items-center gap-1">
                    <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div> Stock
                </div>
            ) : (
                <div className="bg-stone-800/80 backdrop-blur text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest rounded-sm shadow-sm">
                    Order
                </div>
            )}
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
            <div>
                 <p className="text-[9px] text-stone-400 font-mono mb-1 tracking-wider">{product.modelNo || 'N/A'}</p>
                 <h3 className="font-bold text-primary text-sm group-hover:text-primary/70 transition-colors line-clamp-1">{product.name}</h3>
            </div>
        </div>
        
        {/* B2B Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-[10px] text-stone-500 bg-stone-50 p-2 rounded-lg border border-stone-100">
             <div className="flex items-center gap-1.5">
                 <Package className="w-3 h-3 text-stone-300" />
                 <span>MOQ: <span className="font-bold text-stone-700">{product.moq || 1}</span> pcs</span>
             </div>
             <div className="flex items-center gap-1.5">
                 <Clock className="w-3 h-3 text-stone-300" />
                 <span>Lead: {product.leadTime?.split(' ')[0] || '7'} days</span>
             </div>
        </div>
        
        {/* Dimensions Display (New) */}
        {product.dimensions && (
            <div className="flex items-center gap-1.5 text-[10px] text-stone-400 border-t border-stone-50 pt-2">
                <Ruler className="w-3 h-3" />
                <span className="font-mono">{product.dimensions}</span>
            </div>
        )}

        <div className="flex justify-between items-center pt-1 border-t border-stone-50">
            <span className="font-serif font-bold text-base text-[#C04E39]">¥{product.price.toLocaleString()} <span className="text-[9px] font-sans font-normal text-stone-400">/pc</span></span>
            <span className="text-[9px] font-bold text-primary/60 group-hover:text-primary transition-colors uppercase tracking-wider">
                Inquire
            </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
