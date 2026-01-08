
import React, { useState, useMemo, useEffect } from 'react';
import { Manufacturer, HierarchyNode, DistributionMode, Product, RoleConfig, AccountTreeNode, ReconciliationRecord } from '../types';
import { PRODUCTS, CATEGORIES } from '../constants';
import { Button } from './ui/Button';

interface Props {
  manufacturer: Manufacturer;
  onBack: () => void;
}

const ORG_TREE: AccountTreeNode[] = [
  { id: 'o1', name: '华南区域总部', type: 'org', children: [
      { id: 'a1', name: '张店长', type: 'account', role: '店长' },
      { id: 'o2', name: '广州分公司', type: 'org', children: [
          { id: 'a2', name: '李思维设计师', type: 'account', role: '设计师' },
          { id: 'a3', name: '王木木', type: 'account', role: '设计师' }
      ]}
  ]}
];

const ROLES: RoleConfig[] = [
  { id: 'r1', name: '大区店长', minDiscount: 60, commissionRatio: 12, status: 'active' },
  { id: 'r2', name: '认证设计师', minDiscount: 75, commissionRatio: 25, status: 'active' },
  { id: 'r3', name: '普通销售', minDiscount: 85, commissionRatio: 8, status: 'active' },
];

// Fixed type annotation to correctly reflect an array of reconciliation records with items
const MOCK_RECON: (ReconciliationRecord & { items?: any[] })[] = [
  { 
    id: 'rec1', orderNo: 'ORD20240320001', orgName: '广州天河分中心', amount: 15600, status: 'pending', date: '2024-03-20', designerName: '李思维',
    items: [
      { name: '迈阿密A级沙发', price: 29880, discount: 60, settlement: 17928, commissionRate: 15, commissionAmt: 2689 },
      { name: 'G625床头柜', price: 2790, discount: 70, settlement: 1953, commissionRate: 10, commissionAmt: 195 }
    ]
  },
  { 
    id: 'rec2', orderNo: 'ORD20240319882', orgName: '深圳南山工作室', amount: 8900, status: 'approved', date: '2024-03-19', designerName: '王木木',
    items: [
      { name: 'G623简易床', price: 18000, discount: 65, settlement: 11700, commissionRate: 20, commissionAmt: 2340 }
    ]
  },
];

const INITIAL_TREE: HierarchyNode[] = [
  {
    id: 'n1', name: 'XX旗舰总部', phone: '400', role: '总控节点', distribution: 40, minDiscount: 60, authorized: 1, productCount: 120, status: 'normal', isExpanded: true,
    linkedAccounts: [],
    selectedProductIds: PRODUCTS.map(p => p.id),
    children: [
      {
        id: 'n2', name: '华南分销部', phone: '138', role: '一级分销', distribution: 15, minDiscount: 75, authorized: 0, productCount: 50, status: 'normal', isExpanded: false, selectedProductIds: [], children: []
      }
    ]
  }
];

export const HierarchyManagement: React.FC<Props> = ({ manufacturer, onBack }) => {
  const [tab, setTab] = useState<'list' | 'map' | 'roles' | 'reconcile'>('list');
  const [treeData, setTreeData] = useState<HierarchyNode[]>(INITIAL_TREE);
  const [showOrgTree, setShowOrgTree] = useState(false);
  const [showProdEdit, setShowProdEdit] = useState(false);
  const [showNodeInfo, setShowNodeInfo] = useState(false);
  const [showReconDetail, setShowReconDetail] = useState<string | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [expandedOrgs, setExpandedOrgs] = useState<string[]>(['o1', 'o2']);
  const [expandedCats, setExpandedCats] = useState<string[]>([]);

  const updateNode = (id: string, updates: Partial<HierarchyNode>) => {
    const traverse = (nodes: HierarchyNode[]): HierarchyNode[] => nodes.map(n => {
      if (n.id === id) return { ...n, ...updates };
      if (n.children && n.children.length > 0) return { ...n, children: traverse(n.children) };
      return n;
    });
    setTreeData(traverse(treeData));
  };

  const findNode = (id: string, nodes: HierarchyNode[]): HierarchyNode | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children && n.children.length > 0) {
        const found = findNode(id, n.children);
        if (found) return found;
      }
    }
    return null;
  };

  const activeNode = useMemo(() => activeNodeId ? findNode(activeNodeId, treeData) : null, [activeNodeId, treeData]);

  // 处理分润和折扣的双向同步逻辑
  const handlePriceSync = (nodeId: string, prodId: string, field: 'discount' | 'price' | 'comm_rate' | 'comm_amt', value: number, basePrice: number) => {
    // 简化处理：实际项目中这里会更新 overrides
    console.log(`Syncing ${field} to ${value} for prod ${prodId}`);
  };

  const renderBubble = (node: HierarchyNode) => (
    <div key={node.id} className="flex flex-col items-center shrink-0">
      <div className="w-[320px] p-8 bg-white rounded-[2.5rem] border-2 border-gray-100 shadow-2xl hover:border-[#153e35] transition-all relative">
        {/* 顶部展开/收起按钮 */}
        {node.children && node.children.length > 0 && (
          <button 
            onClick={() => updateNode(node.id, { isExpanded: !node.isExpanded })}
            className="absolute -top-3 right-8 w-8 h-8 bg-white border-2 border-gray-100 rounded-full flex items-center justify-center shadow-lg hover:border-[#153e35] transition-all z-10"
          >
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${node.isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M19 9l-7 7-7-7"/></svg>
          </button>
        )}

        {/* 头部：头像和名称 */}
        <div className="flex items-center gap-4 mb-6">
           {/* 点击头像查看绑定人员 */}
           <div 
             onClick={() => { setActiveNodeId(node.id); setShowOrgTree(true); }}
             className="group w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white shadow-lg flex items-center justify-center overflow-hidden cursor-pointer hover:scale-110 transition-transform relative"
           >
              {node.linkedAccounts && node.linkedAccounts.length > 0 ? (
                <img src={`https://i.pravatar.cc/150?u=${node.id}`} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black text-lg">{node.name.charAt(0)}</span>
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                 <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              </div>
           </div>
           <div className="flex-grow min-w-0">
              <h4 className="text-lg font-black text-gray-900 truncate leading-tight">{node.name}</h4>
              <span className="text-[10px] font-bold text-gray-400">{node.role}</span>
           </div>
        </div>

        {/* 折扣和返佣 - 独立逻辑，不关联角色权限 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
           <div className="bg-[#f0fff8] p-4 rounded-2xl border border-emerald-100 text-center">
              <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">最低折扣</p>
              <div className="flex items-center justify-center">
                 <input type="number" value={node.minDiscount} onChange={e => updateNode(node.id, { minDiscount: parseInt(e.target.value) || 0 })} className="w-12 bg-transparent text-center font-black text-2xl text-emerald-900 outline-none" />
                 <span className="text-xs font-black text-emerald-900">%</span>
              </div>
           </div>
           <div className="bg-[#f0f9ff] p-4 rounded-2xl border border-blue-100 text-center">
              <p className="text-[9px] font-black text-blue-600 uppercase mb-1">返佣比例</p>
              <div className="flex items-center justify-center">
                 <input type="number" value={node.distribution} onChange={e => updateNode(node.id, { distribution: parseInt(e.target.value) || 0 })} className="w-12 bg-transparent text-center font-black text-2xl text-blue-900 outline-none" />
                 <span className="text-xs font-black text-blue-900">%</span>
              </div>
           </div>
        </div>

        {/* 底部：绑定人员和商品统计 + 操作按钮 */}
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              {/* 点击查看绑定人员 */}
              <button 
                onClick={() => { setActiveNodeId(node.id); setShowOrgTree(true); }}
                className="flex items-center gap-1.5 text-gray-500 hover:text-[#153e35] transition-colors group"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                <span className="text-xs font-black">{node.linkedAccounts?.length || 0}人</span>
              </button>
              {/* 点击查看绑定商品 */}
              <button 
                onClick={() => { setActiveNodeId(node.id); setShowProdEdit(true); }}
                className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition-colors group"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                <span className="text-xs font-black">{node.selectedProductIds?.length || 0}商品</span>
              </button>
           </div>
           <div className="flex items-center gap-2">
              {/* 添加子节点 */}
              <button 
                onClick={() => {
                   const sub: HierarchyNode = { id: `sub-${Date.now()}`, name: '新分销商', phone: '', role: '分销代理', distribution: 10, minDiscount: 70, authorized: 0, productCount: 0, status: 'normal', isExpanded: false, selectedProductIds: [], linkedAccounts: [], children: [] };
                   updateNode(node.id, { children: [...node.children, sub], isExpanded: true });
                }}
                className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              </button>
              {/* 删除节点 */}
              {node.id !== 'n1' && (
                <button 
                  onClick={() => {
                     if (confirm('确定要删除此节点吗？')) {
                        // 从父节点中移除
                        const removeFromParent = (nodes: HierarchyNode[]): HierarchyNode[] => {
                           return nodes.map(n => ({
                              ...n,
                              children: n.children.filter(c => c.id !== node.id).map(c => ({ ...c, children: removeFromParent(c.children) }))
                           }));
                        };
                        setTreeData(removeFromParent(treeData));
                     }
                  }}
                  className="w-9 h-9 bg-red-50 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              )}
           </div>
        </div>
      </div>
      
      {node.children && node.children.length > 0 && node.isExpanded && (
        <div className="flex flex-col items-center">
           <div className="w-px h-12 bg-gray-200" />
           <div className="flex gap-8 relative">
              {node.children.length > 1 && <div className="absolute top-0 left-[160px] right-[160px] h-px bg-gray-200" />}
              {node.children.map(renderBubble)}
           </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto h-screen flex flex-col bg-[#fcfdfd] overflow-hidden">
      <header className="p-8 border-b bg-white flex items-center justify-between shrink-0 shadow-sm z-[60]">
         <div className="flex items-center gap-8">
            <img src={manufacturer.logo} className="w-16 h-16 rounded-2xl border" />
            <div>
               <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">分层架构管控系统</h2>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">{manufacturer.name} • 全域部署</p>
            </div>
         </div>
         <nav className="flex gap-8">
            {['list', 'roles', 'reconcile'].map(t => (
              <button key={t} onClick={() => setTab(t as any)} className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${tab === t || (tab === 'map' && t === 'list') ? 'bg-[#153e35] text-white shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}>
                 {t === 'list' ? '公司分层' : t === 'roles' ? '角色权限' : '分润对账'}
              </button>
            ))}
         </nav>
         <Button variant="outline" onClick={onBack} className="rounded-2xl px-10 py-4 font-black uppercase text-xs">返回主控</Button>
      </header>

      <div className="flex-grow overflow-auto relative custom-scrollbar">
         {tab === 'list' && (
            <div className="p-20 max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500">
               {treeData.map(node => (
                  <div key={node.id} className="bg-white p-12 rounded-[4rem] border border-gray-100 flex items-center justify-between shadow-2xl hover:shadow-3xl transition-all group">
                     <div className="flex items-center gap-10">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-gray-50 flex items-center justify-center border text-3xl font-black text-gray-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">{node.name.charAt(0)}</div>
                        <div>
                           <h4 className="text-3xl font-black text-gray-900 mb-2">{node.name}</h4>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">下属业务节点: {node.children.length} 个 • 默认分润比例 {node.distribution}%</p>
                        </div>
                     </div>
                     <Button onClick={() => setTab('map')} className="rounded-[2rem] px-14 py-6 bg-[#153e35] font-black uppercase text-sm tracking-widest shadow-2xl">部署架构地图</Button>
                  </div>
               ))}
            </div>
         )}

         {tab === 'map' && (
            <div className="relative w-full h-full overflow-hidden bg-gray-50/50">
               {/* 缩放控制面板 */}
               <div className="absolute bottom-12 left-12 flex flex-col gap-4 z-[80]">
                  <button onClick={() => setZoomScale(p => Math.min(2, p + 0.1))} className="w-14 h-14 bg-white shadow-2xl rounded-2xl flex items-center justify-center text-[#153e35] hover:bg-gray-50 transition-colors"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M12 4v16m8-8H4" /></svg></button>
                  <button onClick={() => setZoomScale(1)} className="w-14 h-14 bg-white shadow-2xl rounded-2xl flex items-center justify-center text-gray-400 text-xs font-black uppercase tracking-tighter">100%</button>
                  <button onClick={() => setZoomScale(p => Math.max(0.3, p - 0.1))} className="w-14 h-14 bg-white shadow-2xl rounded-2xl flex items-center justify-center text-[#153e35] hover:bg-gray-50 transition-colors"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M20 12H4" /></svg></button>
               </div>

               <div 
                 className="flex justify-center pt-40 min-h-full pb-60 transition-transform duration-300 origin-top overflow-visible"
                 style={{ transform: `scale(${zoomScale})` }}
               >
                  {treeData.map(renderBubble)}
               </div>
               
               <button onClick={() => setTab('list')} className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-white px-12 py-5 rounded-full shadow-2xl border-2 border-emerald-500 font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all z-[70] text-emerald-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                  切换目录试图
               </button>
            </div>
         )}

         {tab === 'roles' && (
            <div className="p-20 max-w-6xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-500">
               {/* 提示信息 */}
               <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-200">
                  <div className="flex items-start gap-4">
                     <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                     </div>
                     <div>
                        <p className="text-sm font-black text-amber-800 mb-1">角色权限与节点折扣/返佣是独立的</p>
                        <p className="text-xs text-amber-600">角色权限用于定义功能访问权限。每个分层节点的折扣和返佣比例在节点卡片中独立设置，不受角色权限影响。</p>
                     </div>
                  </div>
               </div>

               <h3 className="text-3xl font-black text-gray-900 flex items-center gap-4">角色功能权限配置 <span className="text-xs bg-gray-100 text-gray-400 px-3 py-1 rounded-full font-bold">ACCESS CONTROL</span></h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {ROLES.map(role => (
                    <div key={role.id} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-8 group hover:border-[#153e35] transition-all">
                       <div className="flex justify-between items-center">
                          <h4 className="text-2xl font-black text-gray-800">{role.name}</h4>
                          <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">已启用</span>
                       </div>
                       
                       {/* 功能权限列表 */}
                       <div className="space-y-3">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">功能权限</p>
                          <div className="flex flex-wrap gap-2">
                             <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black">查看商品</span>
                             <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black">下单</span>
                             <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black">查看订单</span>
                             {role.name === '大区店长' && (
                               <>
                                 <span className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black">管理下级</span>
                                 <span className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black">查看报表</span>
                               </>
                             )}
                             {role.name === '认证设计师' && (
                               <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black">设计方案</span>
                             )}
                          </div>
                       </div>

                       {/* 参考值（仅供参考，实际在节点设置） */}
                       <div className="bg-gray-50 p-6 rounded-2xl">
                          <p className="text-[9px] font-black text-gray-400 uppercase mb-4 tracking-widest">建议参考值（实际在节点卡片设置）</p>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="text-center">
                                <p className="text-[9px] text-gray-400 mb-1">建议折扣</p>
                                <p className="text-lg font-black text-gray-300">{role.minDiscount}%</p>
                             </div>
                             <div className="text-center">
                                <p className="text-[9px] text-gray-400 mb-1">建议返佣</p>
                                <p className="text-lg font-black text-gray-300">{role.commissionRatio}%</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         )}

         {tab === 'reconcile' && (
            <div className="p-20 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
               <div className="flex justify-between items-end mb-12">
                  <h3 className="text-3xl font-black text-gray-900 leading-none">财务分润对账流水 <span className="text-xs font-bold text-gray-300 ml-4">AUDIT TRAIL</span></h3>
                  <Button className="rounded-2xl px-12 py-4 bg-[#153e35] text-white font-black text-xs uppercase tracking-widest">导出全量对账单</Button>
               </div>
               <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-gray-50 border-b">
                           <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">流水单号/日期</th>
                           <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">对账单位/人员</th>
                           <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">拨付总额</th>
                           <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">状态与明细</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {MOCK_RECON.map(rec => (
                           <React.Fragment key={rec.id}>
                           <tr className="hover:bg-gray-50 transition-colors">
                              <td className="px-10 py-8">
                                 <p className="text-sm font-black text-gray-900 mb-1">{rec.orderNo}</p>
                                 <p className="text-[10px] text-gray-400 font-bold">{rec.date}</p>
                              </td>
                              <td className="px-10 py-8">
                                 <p className="text-sm font-black text-gray-800 mb-1">{rec.orgName}</p>
                                 <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">执行人: {rec.designerName}</p>
                              </td>
                              <td className="px-10 py-8 text-center">
                                 <p className="text-xl font-black text-[#153e35]">¥{rec.amount.toLocaleString()}</p>
                              </td>
                              <td className="px-10 py-8 text-right">
                                 <div className="flex items-center justify-end gap-4">
                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${rec.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                       {rec.status === 'pending' ? '待对账' : '已结算'}
                                    </span>
                                    <button 
                                      onClick={() => setShowReconDetail(showReconDetail === rec.id ? null : rec.id)}
                                      className="w-10 h-10 bg-white border rounded-xl flex items-center justify-center text-gray-400 hover:text-[#153e35] transition-all"
                                    >
                                       <svg className={`w-6 h-6 transition-transform ${showReconDetail === rec.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M19 9l-7 7-7-7"/></svg>
                                    </button>
                                 </div>
                              </td>
                           </tr>
                           {showReconDetail === rec.id && (
                              <tr className="bg-gray-50/50">
                                 <td colSpan={4} className="p-0">
                                    <div className="p-10 space-y-4 animate-in slide-in-from-top duration-300">
                                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 italic">订单包含的商品及分润拆解 (ITEMIZED BREAKDOWN)</p>
                                       {rec.items?.map((item: any, idx: number) => (
                                          <div key={idx} className="bg-white p-6 rounded-2xl border flex items-center justify-between shadow-sm">
                                             <div className="flex items-center gap-6">
                                                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 text-xs font-black italic">{idx + 1}</div>
                                                <span className="text-sm font-black text-gray-800">{item.name}</span>
                                             </div>
                                             <div className="flex gap-12 text-right">
                                                <div><p className="text-[9px] text-gray-400 font-black uppercase mb-1">成交价</p><p className="text-xs font-black">¥{item.settlement.toLocaleString()}</p></div>
                                                <div><p className="text-[9px] text-gray-400 font-black uppercase mb-1">分润比例</p><p className="text-xs font-black text-blue-600">{item.commissionRate}%</p></div>
                                                <div><p className="text-[9px] text-gray-400 font-black uppercase mb-1">返佣金额</p><p className="text-sm font-black text-[#153e35]">¥{item.commissionAmt.toLocaleString()}</p></div>
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 </td>
                              </tr>
                           )}
                           </React.Fragment>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}
      </div>

      {/* 侧滑：节点基础资料编辑 */}
      {showNodeInfo && activeNode && (
        <div className="fixed inset-0 z-[200] flex justify-end">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={() => setShowNodeInfo(false)} />
           <div className="relative w-full max-w-xl bg-white shadow-3xl h-full flex flex-col animate-in slide-in-from-right duration-500">
              <div className="p-12 border-b flex items-center justify-between bg-white z-10 shadow-sm">
                 <div><h3 className="text-3xl font-black text-gray-900 leading-none">编辑业务节点档案</h3><p className="text-[10px] text-gray-400 font-black mt-3 uppercase tracking-widest italic">Node Basic Information Editor</p></div>
                 <button onClick={() => setShowNodeInfo(false)} className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all active:scale-95"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M6 18L18 6" /></svg></button>
              </div>
              <div className="flex-grow overflow-y-auto p-12 space-y-12 bg-gray-50/20 custom-scrollbar">
                 <div className="flex flex-col items-center gap-8 bg-white p-12 rounded-[3.5rem] border shadow-inner">
                    <div className="w-40 h-40 rounded-[3rem] bg-gray-100 border-4 border-white shadow-2xl relative group overflow-hidden cursor-pointer flex items-center justify-center">
                       <img src={`https://i.pravatar.cc/150?u=${activeNode.id}`} className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10"><span className="text-white text-[10px] font-black uppercase">上传LOGO</span></div>
                    </div>
                    <div className="w-full space-y-8">
                       <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">业务节点展示名称 *</label>
                          <input type="text" value={activeNode.name} onChange={e => updateNode(activeNode.id, { name: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-black text-xl shadow-inner focus:ring-2 focus:ring-emerald-500 transition-all" />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">联系电话 (用于单据打印)</label>
                          <input type="text" defaultValue={activeNode.phone} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-black text-xl shadow-inner" />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">所属业务角色 (不可更改)</label>
                          <div className="w-full bg-gray-100 border-none rounded-2xl px-6 py-4 font-black text-gray-400 italic shadow-inner">{activeNode.role}</div>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="p-12 border-t bg-white flex gap-8 shrink-0 shadow-inner">
                 <Button variant="outline" onClick={() => setShowNodeInfo(false)} className="flex-grow rounded-3xl py-6 font-black uppercase text-xs tracking-widest border-2">取消编辑</Button>
                 <Button className="flex-grow rounded-3xl py-6 bg-[#153e35] text-white font-black shadow-2xl uppercase text-xs tracking-widest" onClick={() => setShowNodeInfo(false)}>更新节点档案</Button>
              </div>
           </div>
        </div>
      )}

      {/* 侧滑：商品分润设置（实时同步） */}
      {showProdEdit && activeNode && (
         <div className="fixed inset-0 z-[200] flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={() => setShowProdEdit(false)} />
            <div className="relative w-full max-w-6xl bg-white shadow-3xl h-full flex flex-col animate-in slide-in-from-right duration-500">
               <div className="p-12 border-b flex items-center justify-between shrink-0 bg-white z-10 shadow-sm">
                  <div><h3 className="text-4xl font-black text-gray-900 leading-none tracking-tight">商品分润配置</h3><p className="text-[10px] text-gray-400 font-black mt-3 uppercase tracking-widest italic">{activeNode.name} • 多维资产管控</p></div>
                  <button onClick={() => setShowProdEdit(false)} className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M6 18L18 6" /></svg></button>
               </div>
               <div className="flex-grow overflow-y-auto p-12 space-y-10 bg-gray-50/20 custom-scrollbar">
                  {CATEGORIES.map(cat => {
                     const products = PRODUCTS.filter(p => p.category === cat.name);
                     const isOpen = expandedCats.includes(cat.id);
                     return (
                        <div key={cat.id} className="bg-white rounded-[4rem] border border-gray-100 shadow-xl overflow-hidden transition-all duration-300">
                           <div className="p-10 flex justify-between items-center bg-white border-b border-gray-50">
                              <div onClick={() => setExpandedCats(p => isOpen ? p.filter(id => id !== cat.id) : [...p, cat.id])} className="flex items-center gap-6 cursor-pointer group">
                                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isOpen ? 'bg-[#153e35] text-white shadow-2xl' : 'bg-gray-100 text-gray-400'}`}><svg className={`w-8 h-8 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M19 9l-7 7-7-7"/></svg></div>
                                 <h5 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{cat.name}</h5>
                              </div>
                           </div>
                           {isOpen && (
                              <div className="p-10 space-y-6 bg-gray-50/50">
                                 {products.map(prod => {
                                    const minPrice = Math.round(prod.minPrice * (activeNode.minDiscount / 100));
                                    const commAmt = Math.round(prod.minPrice * (activeNode.distribution / 100));
                                    return (
                                       <div key={prod.id} className="bg-white p-8 rounded-[3.5rem] border border-gray-100 flex items-center justify-between shadow-sm hover:border-emerald-200 transition-all">
                                          <div className="flex items-center gap-8 w-1/3">
                                             <img src={prod.image} className="w-24 h-24 rounded-[1.5rem] border shadow-sm object-cover" />
                                             <div className="min-w-0"><h6 className="text-xl font-black text-gray-900 mb-1 truncate">{prod.name}</h6><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{prod.code}</p><p className="text-[11px] font-black text-gray-400 mt-2">标价 ¥{prod.minPrice.toLocaleString()}</p></div>
                                          </div>
                                          <div className="grid grid-cols-2 gap-8 flex-grow">
                                             <div className="bg-[#f0fff8] px-8 py-5 rounded-[2.5rem] border border-emerald-100 flex flex-col justify-center">
                                                <p className="text-[9px] font-black text-emerald-700 uppercase mb-3 text-center">最低折扣价 (¥)</p>
                                                <div className="flex items-center justify-center gap-4">
                                                   <div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">¥</span><input type="number" defaultValue={minPrice} className="w-32 bg-white rounded-xl px-6 py-2 text-xl font-black text-[#153e35] text-center shadow-inner outline-none" /></div>
                                                   <div className="flex items-center text-xs font-black text-emerald-700/40 italic"><input type="number" defaultValue={activeNode.minDiscount} className="w-10 bg-transparent text-center font-black" />%</div>
                                                </div>
                                             </div>
                                             <div className="bg-[#f0f9ff] px-8 py-5 rounded-[2.5rem] border border-blue-100 flex flex-col justify-center">
                                                <p className="text-[9px] font-black text-blue-700 uppercase mb-3 text-center">预计分佣金额 (¥)</p>
                                                <div className="flex items-center justify-center gap-4">
                                                   <div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">¥</span><input type="number" defaultValue={commAmt} className="w-32 bg-white rounded-xl px-6 py-2 text-xl font-black text-blue-900 text-center shadow-inner outline-none" /></div>
                                                   <div className="flex items-center text-xs font-black text-blue-700/40 italic"><input type="number" defaultValue={activeNode.distribution} className="w-10 bg-transparent text-center font-black" />%</div>
                                                </div>
                                             </div>
                                          </div>
                                       </div>
                                    )
                                 })}
                              </div>
                           )}
                        </div>
                     )
                  })}
               </div>
               <div className="p-12 border-t bg-white flex justify-end gap-8 shrink-0 shadow-inner">
                  <Button variant="outline" onClick={() => setShowProdEdit(false)} className="rounded-[2.5rem] px-14 py-6 font-black uppercase text-sm border-2">放弃修改</Button>
                  <Button onClick={() => setShowProdEdit(false)} className="rounded-[2.5rem] px-24 py-6 bg-[#153e35] text-white font-black shadow-2xl uppercase text-sm tracking-widest">保存并应用策略</Button>
               </div>
            </div>
         </div>
      )}

      {/* 侧滑：绑定人员（包含角色绑定） */}
      {showOrgTree && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in" onClick={() => setShowOrgTree(false)} />
          <div className="relative w-full max-w-xl bg-white shadow-3xl h-full flex flex-col animate-in slide-in-from-right duration-500">
             <div className="p-12 border-b flex items-center justify-between bg-white shadow-sm shrink-0">
                <div><h3 className="text-3xl font-black text-gray-900 leading-none">层级人员及角色绑定</h3><p className="text-[10px] text-gray-400 font-black mt-3 uppercase tracking-widest italic">User & Functional Role Binding</p></div>
                <button onClick={() => setShowOrgTree(false)} className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M6 18L18 6"/></svg></button>
             </div>
             <div className="flex-grow overflow-y-auto p-12 space-y-8 bg-gray-50/20 custom-scrollbar">
                {/* 已绑定人员列表 */}
                {activeNode && activeNode.linkedAccounts && activeNode.linkedAccounts.length > 0 && (
                  <div className="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">已绑定人员 ({activeNode.linkedAccounts.length})</p>
                    <div className="flex flex-wrap gap-3">
                      {activeNode.linkedAccounts.map(acc => (
                        <div key={acc.id} className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-emerald-200">
                          <img src={`https://i.pravatar.cc/150?u=${acc.id}`} className="w-8 h-8 rounded-lg object-cover" />
                          <span className="text-sm font-black text-gray-800">{acc.name}</span>
                          <button 
                            onClick={() => {
                              if (activeNode) {
                                updateNode(activeNode.id, { 
                                  linkedAccounts: activeNode.linkedAccounts?.filter(a => a.id !== acc.id) 
                                });
                              }
                            }}
                            className="w-5 h-5 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 可选人员列表 */}
                <div className="bg-white rounded-[3.5rem] p-10 border border-gray-100 shadow-inner">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">选择要绑定的人员</p>
                   {ORG_TREE.map(n => {
                      const isExpanded = expandedOrgs.includes(n.id);
                      return (
                        <div key={n.id} className="space-y-4">
                           <div onClick={() => setExpandedOrgs(p => isExpanded ? p.filter(id => id !== n.id) : [...p, n.id])} className="flex items-center gap-6 p-4 hover:bg-gray-50 rounded-3xl cursor-pointer transition-colors">
                              <div className="w-12 h-12 rounded-[1.2rem] bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/></svg></div>
                              <span className="text-lg font-black text-gray-900 flex-grow">{n.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{n.children?.length} 人</span>
                                <svg className={`w-5 h-5 text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                              </div>
                           </div>
                           {isExpanded && n.children?.map(c => {
                              const isLinked = activeNode?.linkedAccounts?.some(a => a.id === c.id);
                              return (
                                <div 
                                  key={c.id} 
                                  onClick={() => {
                                    if (activeNode) {
                                      if (isLinked) {
                                        updateNode(activeNode.id, { 
                                          linkedAccounts: activeNode.linkedAccounts?.filter(a => a.id !== c.id) 
                                        });
                                      } else {
                                        updateNode(activeNode.id, { 
                                          linkedAccounts: [...(activeNode.linkedAccounts || []), { id: c.id, name: c.name, phone: '', role: c.role || '' }]
                                        });
                                      }
                                    }
                                  }}
                                  className={`ml-12 flex items-center gap-6 p-6 rounded-2xl border cursor-pointer transition-all ${isLinked ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50/50 border-gray-100 hover:border-emerald-200'}`}
                                >
                                   <div className="w-12 h-12 rounded-xl bg-white border shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                                     <img src={`https://i.pravatar.cc/150?u=${c.id}`} className="w-full h-full object-cover" />
                                   </div>
                                   <div className="flex-grow">
                                     <p className="text-base font-black text-gray-800">{c.name}</p>
                                     <p className="text-[10px] text-gray-400 font-bold">{c.role || '未分配角色'}</p>
                                   </div>
                                   <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isLinked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200'}`}>
                                     {isLinked && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                                   </div>
                                </div>
                              );
                           })}
                        </div>
                      )
                   })}
                </div>

                {/* 提示信息 */}
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600">
                    <span className="font-black">提示：</span>折扣和返佣比例在节点卡片中独立设置，与角色权限无关。
                  </p>
                </div>
             </div>
             <div className="p-12 border-t bg-white flex gap-6 shrink-0 shadow-inner">
                <Button variant="outline" onClick={() => setShowOrgTree(false)} className="flex-grow rounded-3xl py-6 font-black uppercase text-xs tracking-widest border-2">放弃绑定</Button>
                <Button onClick={() => setShowOrgTree(false)} className="flex-grow rounded-3xl py-6 bg-[#153e35] text-white font-black shadow-2xl uppercase text-xs tracking-widest">部署人员策略</Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
