
import React, { useState, useMemo } from 'react';
import { Manufacturer, AppView } from './types';
import { MANUFACTURERS } from './constants';
import { ManufacturerCard } from './components/ManufacturerCard';
import { AuthorizationView } from './components/AuthorizationView';
import { AdminManufacturerList } from './components/AdminManufacturerList';
import { HierarchyManagement } from './components/HierarchyManagement';
import { FactoryPortal } from './components/FactoryPortal';
import { PackageManagement } from './components/PackageManagement';
import { BargainManagement } from './components/BargainManagement';
import { FactoryDashboard } from './components/FactoryDashboard';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('designer-dashboard');
  const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [enabledIds, setEnabledIds] = useState<Record<string, boolean>>({
    '3': true,
    '1': true,
    '2': false
  });

  const manufacturersWithState = useMemo(() => {
    return MANUFACTURERS.map(m => ({
      ...m,
      isMyOwnFactory: m.id === '3',
      status: (enabledIds[m.id] ? 'enabled' : 'disabled') as 'enabled' | 'disabled'
    }));
  }, [enabledIds]);

  const toggleManufacturer = (id: string) => {
    setEnabledIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAuthorize = (m: Manufacturer) => {
    if (!enabledIds[m.id]) return;
    setSelectedManufacturer(m);
    setView('designer-auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (view === 'admin-products' || view === 'admin-hierarchy') {
      setView('admin-manufacturers');
    } else if (view === 'factory-manage-products' || view === 'factory-inventory') {
      setView('factory-portal');
    } else {
      setView('designer-dashboard');
      setSelectedManufacturer(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfdfd]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setView('designer-dashboard')}>
              <div className="w-9 h-9 bg-[#153e35] rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none">
                Elite Portal
              </h1>
            </div>
            
            <nav className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
              {[
                { label: '设计师', id: 'designer-dashboard' },
                { label: '套餐', id: 'package-management' },
                { label: '砍价', id: 'bargain-management' },
                { label: '工厂端', id: 'factory-portal' },
                { label: '管理员', id: 'admin-manufacturers' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setView(tab.id as any)}
                  className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                    view === tab.id ? 'bg-[#153e35] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900 leading-none">XiaoDi Admin</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Super User</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white font-black text-xs">XD</div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow p-6 lg:p-10">
        {view === 'designer-dashboard' && (
          <div className="max-w-[1440px] mx-auto animate-in fade-in duration-500">
            <div className="mb-12 flex justify-between items-end">
              <div>
                <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-none mb-2">合作品牌库</h2>
                <p className="text-gray-400 font-bold uppercase tracking-widest mt-2 px-1">全量品牌托管与准入控制中心</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-3 w-96 shadow-sm flex items-center">
                <svg className="w-5 h-5 text-gray-400 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="快速定位品牌..." className="bg-transparent border-none outline-none text-sm w-full font-bold" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {manufacturersWithState.filter(m => m.name.includes(searchQuery)).map(m => (
                <ManufacturerCard 
                  key={m.id} 
                  manufacturer={m as any} 
                  onAuthorize={handleAuthorize}
                  isEnabled={enabledIds[m.id]}
                  onToggle={() => toggleManufacturer(m.id)}
                />
              ))}
            </div>
          </div>
        )}

        {view === 'package-management' && <PackageManagement />}
        {view === 'bargain-management' && <BargainManagement />}
        {view === 'factory-portal' && (
          <FactoryPortal 
            onManageProducts={(m) => { setSelectedManufacturer(m); setView('factory-manage-products'); }}
            onManageHierarchy={(m) => { setSelectedManufacturer(m); setView('admin-hierarchy'); }}
            onAuthRequest={(m) => { setSelectedManufacturer(m); setView('designer-auth'); }}
            enabledIds={enabledIds}
            onToggle={toggleManufacturer}
          />
        )}
        {view === 'factory-manage-products' && selectedManufacturer && (
          <FactoryDashboard 
            manufacturer={selectedManufacturer} 
            onBack={handleBack} 
            onManageInventory={() => setView('factory-inventory')} 
          />
        )}
        {view === 'factory-inventory' && selectedManufacturer && (
          <AuthorizationView manufacturer={selectedManufacturer} onBack={() => setView('factory-manage-products')} isAdminMode={true} />
        )}
        
        {view === 'designer-auth' && selectedManufacturer && <AuthorizationView manufacturer={selectedManufacturer} onBack={handleBack} />}
        {view === 'admin-manufacturers' && (
          <AdminManufacturerList 
            onManageHierarchy={(m) => { setSelectedManufacturer(m); setView('admin-hierarchy'); }} 
            onManageProducts={(m) => { setSelectedManufacturer(m); setView('admin-products'); }}
          />
        )}
        {view === 'admin-hierarchy' && selectedManufacturer && <HierarchyManagement manufacturer={selectedManufacturer} onBack={() => setView(selectedManufacturer.id === '3' ? 'factory-portal' : 'admin-manufacturers')} />}
        {view === 'admin-products' && selectedManufacturer && <AuthorizationView manufacturer={selectedManufacturer} onBack={handleBack} isAdminMode={true} />}
      </main>
    </div>
  );
};

export default App;
