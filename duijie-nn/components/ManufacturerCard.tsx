
import React from 'react';
import { Manufacturer } from '../types';
import { Button } from './ui/Button';

interface ManufacturerCardProps {
  manufacturer: Manufacturer;
  onAuthorize: (m: Manufacturer) => void;
  isEnabled?: boolean;
  onToggle?: () => void;
}

export const ManufacturerCard: React.FC<ManufacturerCardProps> = ({ 
  manufacturer, 
  onAuthorize, 
  isEnabled = true, 
  onToggle 
}) => {
  return (
    <div 
      className={`bg-white rounded-[2.5rem] border ${isEnabled ? 'border-gray-100' : 'border-gray-200 bg-gray-50/50'} shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col h-full relative group`}
    >
      {/* Visibility Toggle Switch */}
      <div className="absolute top-6 left-6 z-30 flex items-center gap-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-2xl border border-gray-100 shadow-sm">
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={isEnabled} 
            onChange={onToggle} 
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
        <span className={`text-[9px] font-black uppercase tracking-widest ${isEnabled ? 'text-emerald-700' : 'text-gray-400'}`}>
          {isEnabled ? '已开启显示' : '已隐藏商品'}
        </span>
      </div>

      {/* Brand Hero Section */}
      <div className={`relative h-44 flex items-center justify-center p-8 overflow-hidden transition-all duration-500 ${!isEnabled ? 'grayscale opacity-60' : 'bg-[#f9fbfc]'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <img 
          src={manufacturer.logo} 
          alt={manufacturer.name} 
          className="w-24 h-24 rounded-3xl object-cover shadow-2xl transform group-hover:scale-110 transition-transform duration-700 z-10 border-4 border-white"
        />
        {manufacturer.id === '3' && (
          <div className="absolute top-6 right-6 bg-[#153e35] text-white text-[9px] font-black px-4 py-1.5 rounded-full shadow-lg z-20 tracking-widest uppercase">
            官方严选
          </div>
        )}
      </div>

      <div className={`p-8 flex flex-col flex-grow relative ${!isEnabled ? 'opacity-50' : ''}`}>
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-black text-gray-900 group-hover:text-emerald-800 transition-colors leading-tight mb-1">{manufacturer.name}</h3>
            <span className="text-[10px] font-bold text-gray-300 tracking-widest uppercase">{manufacturer.code}</span>
          </div>
          
          {/* Financial Labels */}
          <div className="flex flex-col items-end gap-1">
             <div className="bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                <p className="text-[8px] font-black text-emerald-800 uppercase leading-none">最低折扣</p>
                <p className="text-sm font-black text-[#153e35]">{manufacturer.defaultDiscount || 60}%</p>
             </div>
             <div className="bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                <p className="text-[8px] font-black text-blue-800 uppercase leading-none">返佣比例</p>
                <p className="text-sm font-black text-blue-700">{manufacturer.defaultCommission || 30}%</p>
             </div>
          </div>
        </div>

        <div className="space-y-4 flex-grow">
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-medium italic">
            “{manufacturer.description}”
          </p>
          
          <div className="flex flex-wrap gap-1.5">
             {manufacturer.styleTags?.map(tag => (
                <span key={tag} className="text-[9px] font-black px-2 py-0.5 bg-gray-50 text-gray-400 rounded-lg border">{tag}</span>
             ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-50">
          <button 
            disabled={!isEnabled}
            onClick={(e) => { e.stopPropagation(); onAuthorize(manufacturer); }}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
              isEnabled 
              ? 'bg-[#153e35] text-white hover:bg-emerald-900 shadow-lg shadow-emerald-900/10' 
              : 'bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-200'
            }`}
          >
            {isEnabled ? '进入品牌选库' : '开启后可进入'}
            {isEnabled && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>}
          </button>
        </div>
      </div>
    </div>
  );
};
