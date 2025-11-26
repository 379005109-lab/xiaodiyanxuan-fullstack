
import React, { useState } from 'react';
import { 
    LayoutDashboard, PenTool, Users, Palette, ShoppingBag, 
    ListTree, Layers, ClipboardList, PenLine, Home, Search, 
    Bell, Settings, LogOut, Plus, Filter, Download, Trash2, Edit, Eye, 
    FileSpreadsheet, ChevronDown, ToggleRight, BarChart3, CheckCircle, XCircle, Ruler, 
    ArrowLeft, ArrowRight, X, Truck, User, MapPin, Package, ToggleLeft, 
    MoreHorizontal, Image as ImageIcon, FolderOpen, AlertTriangle, DollarSign, Tag, Cloud, Calculator, Box, ChevronRight
} from 'lucide-react';
import { PRODUCTS, MOCK_ADMIN_USERS, MOCK_DESIGN_REQUESTS, MOCK_CATEGORIES } from '../constants';

interface AdminPortalProps {
    onExit: () => void;
}

type AdminView = 'dashboard' | 'design' | 'users' | 'assets' | 'products' | 'categories' | 'packages' | 'orders' | 'customization';

// --- MOCK DATA ---

const MOCK_ASSETS_LIST = [
    { id: 1, name: '纳帕头层牛皮', category: 'leather', subCategory: '全青皮', colors: 24, stock: 1200, status: 'active', image: 'https://placehold.co/100x100/78350F/FFFFFF?text=Napa' },
    { id: 2, name: '意大利磨砂布', category: 'fabric', subCategory: '棉麻', colors: 18, stock: 850, status: 'active', image: 'https://placehold.co/100x100/57534E/FFFFFF?text=Linen' },
    { id: 3, name: '北美黑胡桃木', category: 'wood', subCategory: '实木', colors: 1, stock: 50, status: 'active', image: 'https://placehold.co/100x100/451a03/FFFFFF?text=Walnut' },
    { id: 4, name: '高回弹海绵 45D', category: 'filler', subCategory: '海绵', colors: 1, stock: 5000, status: 'active', image: 'https://placehold.co/100x100/fef08a/000000?text=Sponge' },
    { id: 5, name: '超纤科技皮', category: 'leather', subCategory: '人造皮', colors: 36, stock: 2000, status: 'active', image: 'https://placehold.co/100x100/A8A29E/FFFFFF?text=Tech' },
    { id: 6, name: '碳素钢枪黑', category: 'metal', subCategory: '五金', colors: 1, stock: 300, status: 'active', image: 'https://placehold.co/100x100/171717/FFFFFF?text=Steel' },
    { id: 7, name: '土耳其植绒', category: 'fabric', subCategory: '绒布', colors: 12, stock: 600, status: 'inactive', image: 'https://placehold.co/100x100/be123c/FFFFFF?text=Velvet' },
    { id: 8, name: '泰国乳胶 2cm', category: 'filler', subCategory: '乳胶', colors: 1, stock: 100, status: 'active', image: 'https://placehold.co/100x100/ecfccb/000000?text=Latex' },
];

const MOCK_ADMIN_PACKAGES = [
    { 
        id: 'PKG2024112601', name: '晨雾森林套系 Misty Forest', price: 12900, cost: 9400, profit: 3500, 
        items: [
            { name: '钢琴键沙发', img: 'https://images.unsplash.com/photo-1550226891-ef816aed4a98?auto=format&fit=crop&q=80&w=100', qty: 1 },
            { name: '北欧茶几', img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=100', qty: 1 },
            { name: '羊毛地毯', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=100', qty: 1 }
        ],
        categories: ['沙发', '茶几', '地毯'], stock: 99, sales: 45,
        status: 'active', createdAt: '2024-11-20',
        image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=200' 
    },
    { 
        id: 'PKG2024112702', name: '复古植物学家 The Botanist', price: 18800, cost: 13600, profit: 5200,
        items: [
            { name: '中古柜', img: 'https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?auto=format&fit=crop&q=80&w=100', qty: 1 },
            { name: '丝绒单椅', img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=100', qty: 2 }
        ],
        categories: ['柜类', '单椅'], stock: 12, sales: 8,
        status: 'active', createdAt: '2024-11-18',
        image: 'https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?auto=format&fit=crop&q=80&w=200' 
    }
];

const MOCK_ADMIN_ORDERS = [
    {
        id: 'ORD202511248308', buyer: { name: '张晨笛', phone: '131****3131', avatar: 'Z', address: '佛山市南海区环岛南路28号' },
        amount: 13320, items: [
            { name: '香奈儿沙发', spec: '标准款', price: 3960, qty: 1, img: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=100', dimensions: '3100x1100x680MM', material: '意大利纳帕牛皮' },
            { name: '复古绿绒 Pixel', spec: '三人位', price: 4400, qty: 1, img: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&q=80&w=100', dimensions: '2800x1000x700MM', material: '高精密荷兰绒' },
            { name: '钢琴键沙发', spec: '组合装', price: 4960, qty: 1, img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=100', dimensions: '3600x1200x650MM', material: '棉麻混纺' }
        ], 
        status: 'pending_payment', createdAt: '2025-11-24 14:30',
        source: '小程序', note: '周末送货'
    },
    {
        id: 'ORD202511235521', buyer: { name: '李思思', phone: '138****8000', avatar: 'L', address: '上海市静安区南京西路1266号' },
        amount: 4400, items: [
            { name: '康纳利森林 Canal', spec: '标准款', price: 4400, qty: 1, img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=100', dimensions: '2100x900x750MM', material: '科技布' }
        ], 
        status: 'paid', createdAt: '2025-11-23 09:15',
        source: 'PC端', note: ''
    },
    {
        id: 'ORD202511221001', buyer: { name: '王五', phone: '139****9999', avatar: 'W', address: '北京市朝阳区建国路88号' },
        amount: 25800, items: [
            { name: '晨雾森林套系', spec: '完整版', price: 12900, qty: 2, img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=100' }
        ], 
        status: 'shipped', createdAt: '2025-11-22 18:20',
        source: '代客下单', note: '加急', logistics: { company: '顺丰速运', no: 'SF1234567890' }
    },
    {
        id: 'ORD202511208888', buyer: { name: '赵六', phone: '150****0000', avatar: 'Z', address: '深圳市南山区科技园' },
        amount: 9900, items: [
            { name: '极简禅意套系', spec: '标准版', price: 9900, qty: 1, img: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=100' }
        ], 
        status: 'completed', createdAt: '2025-11-20 11:00',
        source: 'PC端', note: ''
    }
];

const MOCK_CUSTOM_REQUESTS = [
    { 
        id: 'cr1', client: '张先生', phone: '138****1234', type: '定制家具', 
        req: { size: '2800*1000', material: '进口纳帕皮', color: '爱马仕橙' }, 
        status: 'pending', time: '2025/11/25 12:38:49' 
    },
    { 
        id: 'cr2', client: '李小姐', phone: '139****5678', type: '定制家具', 
        req: { size: '常规尺寸', material: '磨砂布', color: '大象灰' }, 
        status: 'pending', time: '2025/11/25 12:16:04' 
    },
    { 
        id: 'cr4', client: '赵设计师', phone: '150****0000', type: '定制家具', 
        req: { size: '定制 L型', material: '科技布', color: '米白' }, 
        status: 'completed', time: '2025/11/25 11:52:03' 
    }
];

const AdminPortal: React.FC<AdminPortalProps> = ({ onExit }) => {
    const [activeView, setActiveView] = useState<AdminView>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    
    // States
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [logisticsModalOpen, setLogisticsModalOpen] = useState(false);
    const [activeOrderStatus, setActiveOrderStatus] = useState('all');
    const [logisticsForm, setLogisticsForm] = useState({ company: '', trackingNo: '' });
    const [productTab, setProductTab] = useState<'all' | 'active' | 'warehouse' | 'alert'>('all');
    const [assetFilter, setAssetFilter] = useState<'all' | 'leather' | 'fabric' | 'wood' | 'metal' | 'filler'>('all');

    // --- Shared UI Components ---
    const IconButton = ({ icon: Icon, color = 'text-gray-500', onClick }: { icon: any, color?: string, onClick?: () => void }) => (
        <button onClick={onClick} className={`p-1.5 hover:bg-gray-100 rounded-md transition-colors ${color}`}>
            <Icon className="w-4 h-4" />
        </button>
    );

    const StatusBadge = ({ status, text }: { status: string, text?: string }) => {
        const config: Record<string, { color: string, label: string }> = {
            active: { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', label: '正常' },
            pending: { color: 'bg-amber-50 text-amber-600 border-amber-100', label: '待处理' },
            inactive: { color: 'bg-gray-100 text-gray-500 border-gray-200', label: '下架' },
            processing: { color: 'bg-blue-50 text-blue-600 border-blue-100', label: '处理中' },
            completed: { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', label: '已完成' },
            pending_payment: { color: 'bg-orange-50 text-orange-600 border-orange-100', label: '待付款' },
            paid: { color: 'bg-blue-50 text-blue-600 border-blue-100', label: '待发货' },
            shipped: { color: 'bg-purple-50 text-purple-600 border-purple-100', label: '已发货' },
            cancelled: { color: 'bg-gray-50 text-gray-500 border-gray-200', label: '已取消' },
        };
        const current = config[status] || config.inactive;
        return <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${current.color}`}>{text || current.label}</span>;
    };

    const Pagination = () => (
        <div className="flex items-center justify-end gap-2 mt-auto p-4 border-t border-gray-200 text-xs text-gray-500 bg-white sticky bottom-0">
            <span>共 10 条记录</span>
            <div className="flex gap-1">
                <button className="p-1 border rounded hover:bg-gray-50 disabled:opacity-50" disabled><ArrowLeft className="w-3 h-3" /></button>
                <button className="px-2 py-1 border rounded bg-blue-600 text-white border-blue-600">1</button>
                <button className="px-2 py-1 border rounded hover:bg-gray-50">2</button>
                <button className="p-1 border rounded hover:bg-gray-50"><ArrowRight className="w-3 h-3" /></button>
            </div>
        </div>
    );

    // --- RENDER FUNCTIONS ---

    const renderDashboard = () => (
        <div className="space-y-6 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">数据看板 Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: '今日订单', count: 12, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: '待处理需求', count: 4, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: '本月销售额', count: '¥128,000', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: '新增用户', count: 25, color: 'text-purple-600', bg: 'bg-purple-50' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between h-32">
                        <div className="flex justify-between items-start">
                            <h4 className="text-sm text-gray-500 font-medium">{stat.label}</h4>
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <BarChart3 className={`w-4 h-4 ${stat.color}`} />
                            </div>
                        </div>
                        <div className={`text-3xl font-bold ${stat.color}`}>{stat.count}</div>
                    </div>
                ))}
            </div>
            <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 h-[500px] flex flex-col items-center justify-center text-gray-400">
                <BarChart3 className="w-16 h-16 mb-4 opacity-20" />
                <p>销售数据可视化图表区域</p>
            </div>
        </div>
    );

    const renderDesignManagement = () => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in-up min-h-[600px] flex flex-col">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-1">设计管理</h2>
                <p className="text-xs text-gray-400">管理用户提交的免费设计需求</p>
            </div>
            <div className="px-6 py-4 border-b border-gray-100 flex gap-2 bg-gray-50/30">
                {['全部', '待处理', '处理中', '已完成'].map((tab, i) => (
                    <button key={tab} className={`px-4 py-1.5 rounded text-sm font-medium ${i===0 ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {tab} {i===1 && '(1)'}
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-semibold">
                        <tr><th className="p-4 pl-6">用户信息</th><th className="p-4">需求描述</th><th className="p-4">状态</th><th className="p-4">提交时间</th><th className="p-4 text-right pr-6">操作</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {MOCK_DESIGN_REQUESTS.map(req => (
                            <tr key={req.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="p-4 pl-6 align-top"><div className="font-bold text-gray-800">{req.userName}</div><div className="text-xs text-gray-500 mt-0.5">{req.userPhone}</div></td>
                                <td className="p-4 align-top text-gray-600 max-w-xs">{req.description}</td>
                                <td className="p-4 align-top"><StatusBadge status={req.status} /></td>
                                <td className="p-4 align-top text-gray-500 text-xs">{req.submittedAt}</td>
                                <td className="p-4 align-top text-right pr-6"><div className="flex justify-end gap-2"><IconButton icon={Eye} color="text-blue-600"/><IconButton icon={Trash2} color="text-red-500"/></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination />
        </div>
    );

    const renderUserManagement = () => (
        <div className="space-y-6 animate-fade-in-up">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50/30">
                    <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="搜索用户..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" /></div>
                    <button className="px-4 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-200"><Filter className="w-4 h-4" /> 筛选</button>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-semibold border-y border-gray-200">
                        <tr><th className="p-4 pl-6">用户</th><th className="p-4">角色</th><th className="p-4">手机号</th><th className="p-4">余额</th><th className="p-4">状态</th><th className="p-4 text-right pr-6">操作</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {MOCK_ADMIN_USERS.map(user => (
                            <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="p-4 pl-6 flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">{user.name.charAt(0)}</div><div><div className="font-bold">{user.name}</div><div className="text-xs text-gray-400">{user.email}</div></div></td>
                                <td className="p-4"><span className="bg-red-50 text-red-600 text-xs px-2 py-1 rounded border border-red-100">{user.role}</span></td>
                                <td className="p-4 text-gray-600">{user.phone}</td>
                                <td className="p-4 font-mono">¥{user.balance}</td>
                                <td className="p-4"><StatusBadge status={user.status} text="正常" /></td>
                                <td className="p-4 text-right pr-6"><div className="flex justify-end gap-2"><IconButton icon={Edit} color="text-blue-600" /><IconButton icon={XCircle} color="text-red-500" /></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderAssetManagement = () => {
        const filteredAssets = MOCK_ASSETS_LIST.filter(a => assetFilter === 'all' || a.category === assetFilter);
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex overflow-hidden min-h-[700px] animate-fade-in-up">
                <div className="w-60 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
                    <div className="p-4 border-b border-gray-200"><h3 className="font-bold text-gray-800 flex items-center gap-2"><FolderOpen className="w-4 h-4 text-blue-600" /> 素材库</h3></div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {[{ id: 'all', label: '全部', count: 128, icon: LayoutDashboard }, { id: 'leather', label: '皮革', count: 45, icon: Layers }, { id: 'fabric', label: '布艺', count: 32, icon: Palette }, { id: 'wood', label: '木材', count: 12, icon: Box }, { id: 'metal', label: '金属', count: 8, icon: Settings }, { id: 'filler', label: '填充', count: 15, icon: Cloud }].map((item) => (
                            <button key={item.id} onClick={() => setAssetFilter(item.id as any)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${assetFilter === item.id ? 'bg-white text-blue-600 font-medium shadow-sm ring-1 ring-gray-200' : 'text-gray-600 hover:bg-gray-200/50'}`}>
                                <div className="flex items-center gap-3"><item.icon className={`w-4 h-4 ${assetFilter === item.id ? 'text-blue-500' : 'opacity-70'}`} />{item.label}</div><span className={`text-[10px] px-1.5 py-0.5 rounded-full ${assetFilter === item.id ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-500'}`}>{item.count}</span>
                            </button>
                        ))}
                    </div>
                    <div className="p-4 border-t border-gray-200 bg-white"><button className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-sm"><Plus className="w-4 h-4" /> 上传</button></div>
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                        <div className="flex gap-4 items-center"><h2 className="text-lg font-bold text-gray-800">{assetFilter === 'all' ? '全部素材' : assetFilter.toUpperCase()}</h2><div className="h-4 w-px bg-gray-300"></div><div className="flex gap-2"><button className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 text-gray-600">批量管理</button></div></div>
                        <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="搜索..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500" /></div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 custom-scrollbar">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            <div className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer min-h-[220px] bg-white"><div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors"><Plus className="w-6 h-6" /></div><span className="text-sm font-medium">添加</span></div>
                            {filteredAssets.map(asset => (
                                <div key={asset.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group relative overflow-hidden flex flex-col">
                                    <div className="aspect-square relative bg-gray-100 overflow-hidden"><img src={asset.image} alt={asset.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[1px]"><button className="p-2 bg-white rounded-full text-gray-700 hover:text-blue-600 shadow-lg"><Eye className="w-4 h-4" /></button><button className="p-2 bg-white rounded-full text-gray-700 hover:text-blue-600 shadow-lg"><Edit className="w-4 h-4" /></button></div><div className="absolute top-2 left-2"><StatusBadge status={asset.status} text={asset.status === 'active' ? '使用中' : '停用'} /></div></div>
                                    <div className="p-3 flex-1 flex flex-col"><div className="flex justify-between items-start mb-1"><h4 className="font-bold text-gray-800 truncate pr-2 text-sm" title={asset.name}>{asset.name}</h4><MoreHorizontal className="w-4 h-4 text-gray-300 cursor-pointer hover:text-gray-600" /></div><div className="text-xs text-gray-500 mb-3 flex items-center gap-2"><span className="bg-gray-100 px-1.5 py-0.5 rounded">{asset.subCategory}</span><span className="text-gray-300">|</span><span>{asset.colors} 色</span></div><div className="mt-auto pt-2 border-t border-gray-50 flex justify-between items-center"><div className="flex items-center gap-1 text-[10px] text-gray-400"><Package className="w-3 h-3" /><span className={`${asset.stock < 100 ? 'text-red-400 font-bold' : ''}`}>库存: {asset.stock}</span></div><span className="text-[10px] font-mono text-gray-300">ID:{asset.id}</span></div></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Pagination />
                </div>
            </div>
        );
    };

    const renderProductManagement = () => {
        let displayProducts = PRODUCTS;
        if (productTab === 'active') displayProducts = PRODUCTS.filter(p => p.stockStatus === 'in_stock');
        if (productTab === 'warehouse') displayProducts = PRODUCTS.filter(p => p.stockStatus !== 'in_stock');
        if (productTab === 'alert') displayProducts = PRODUCTS.slice(0, 1); 

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in-up min-h-[700px] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-start flex-shrink-0">
                    <div><h2 className="text-xl font-bold text-gray-800 mb-1">商品管理</h2><p className="text-xs text-gray-400">管理所有上架商品、库存及价格策略</p></div>
                    <div className="flex gap-3"><button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-50"><Download className="w-4 h-4" /> 导出报表</button><button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-sm shadow-blue-200"><Plus className="w-4 h-4" /> 发布商品</button></div>
                </div>
                <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-200 flex flex-col md:flex-row justify-between gap-4 items-center flex-shrink-0">
                    <div className="flex gap-1 bg-gray-200/50 p-1 rounded-lg">
                        {[{ id: 'all', label: '全部商品' }, { id: 'active', label: '销售中' }, { id: 'warehouse', label: '仓库中' }, { id: 'alert', label: '库存预警', alert: true }].map(tab => (
                            <button key={tab.id} onClick={() => setProductTab(tab.id as any)} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${productTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}>{tab.label} {tab.alert && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>}</button>
                        ))}
                    </div>
                    <div className="flex gap-3 w-full md:w-auto"><select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-blue-500"><option>所有分类</option>{MOCK_CATEGORIES.map(c => <option key={c.id}>{c.name}</option>)}</select><div className="relative flex-1 md:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="搜索..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500" /></div></div>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                            <tr><th className="p-4 pl-6 w-12"><input type="checkbox" /></th><th className="p-4 w-80">商品信息</th><th className="p-4">价格分析 (CNY)</th><th className="p-4">库存监控</th><th className="p-4">状态</th><th className="p-4 text-right pr-6">操作</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {displayProducts.map(p => (
                                <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="p-4 pl-6"><input type="checkbox" /></td>
                                    <td className="p-4"><div className="flex items-center gap-4"><div className="relative w-14 h-14 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex-shrink-0"><img src={p.imageUrl} className="w-full h-full object-cover" alt="" />{p.isNew && <span className="absolute top-0 left-0 bg-red-500 text-white text-[8px] px-1.5 py-0.5 font-bold rounded-br">NEW</span>}</div><div><div className="font-bold text-gray-800 text-sm mb-1">{p.name}</div><div className="text-[10px] text-blue-500 flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded w-fit"><Layers className="w-3 h-3" /> {p.specsCount} 个 SKU 变体</div></div></div></td>
                                    <td className="p-4"><div className="space-y-1.5 bg-gray-50 p-2 rounded-lg border border-transparent group-hover:border-gray-200 transition-colors"><div className="flex items-center justify-between w-36"><span className="text-gray-400 text-[10px]">Sale</span><span className="font-bold text-gray-800">¥{p.price.toLocaleString()}</span></div><div className="flex items-center justify-between w-36 text-xs"><span className="text-gray-400 text-[10px]">Cost</span><span className="text-gray-500 font-mono">¥{(p.price * 0.6).toFixed(0)}</span></div><div className="h-px bg-gray-200 w-full"></div><div className="flex items-center justify-between w-36 text-xs"><span className="text-gray-400 text-[10px]">Margin</span><span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded">40%</span></div></div></td>
                                    <td className="p-4"><div className="w-32"><div className="flex justify-between text-xs mb-1.5 font-medium"><span className={p.stockStatus === 'in_stock' ? 'text-gray-600' : 'text-red-500'}>{p.stockStatus === 'in_stock' ? '充足' : '缺货'}</span><span className="text-gray-400">{p.stockStatus === 'in_stock' ? '999+' : '0'}</span></div><div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${p.stockStatus === 'in_stock' ? 'bg-emerald-500 w-3/4' : 'bg-red-500 w-full animate-pulse'}`}></div></div><div className="text-[10px] text-gray-400 mt-2 flex items-center gap-1"><Calculator className="w-3 h-3" /> 累计: {Math.floor(Math.random() * 500)}</div></div></td>
                                    <td className="p-4"><div className="flex items-center gap-2"><ToggleRight className={`w-9 h-9 cursor-pointer ${p.stockStatus === 'in_stock' ? 'text-blue-600' : 'text-gray-300'}`} /></div></td>
                                    <td className="p-4 text-right pr-6"><div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity"><IconButton icon={Edit} color="text-blue-600 bg-blue-50" /><IconButton icon={Trash2} color="text-red-500 bg-red-50" /></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination />
            </div>
        );
    };

    const renderCategoryManagement = () => (
        <div className="space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[{ label: '分类总数', val: '7', icon: ListTree, color: 'purple' }, { label: '商品总数', val: PRODUCTS.length, icon: ShoppingBag, color: 'emerald' }, { label: '折扣分类', val: '0', icon: Settings, color: 'orange' }].map((c, i) => (
                    <div key={i} className={`bg-${c.color}-50 p-5 rounded-xl border border-${c.color}-100 flex justify-between items-center`}><div><div className={`text-${c.color}-800 text-xs font-bold mb-1`}>{c.label}</div><div className={`text-2xl font-bold text-${c.color}-900`}>{c.val}</div></div><c.icon className={`w-8 h-8 text-${c.color}-300`} /></div>
                ))}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/30"><div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="搜索..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" /></div><button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"><Plus className="w-4 h-4" /> 新建分类</button></div>
                <table className="w-full text-left text-sm"><thead className="bg-gray-50 text-gray-600 font-semibold"><tr><th className="p-4 pl-6">分类结构</th><th className="p-4">层级</th><th className="p-4">商品热度</th><th className="p-4">状态</th><th className="p-4">更新时间</th><th className="p-4 text-right pr-6">操作</th></tr></thead><tbody className="divide-y divide-gray-100">{MOCK_CATEGORIES.map(cat => (<tr key={cat.id} className="hover:bg-blue-50/30 transition-colors"><td className="p-4 pl-6 font-bold text-gray-800 flex items-center gap-2"><ChevronRight className="w-4 h-4 text-gray-400"/> {cat.name}</td><td className="p-4">{cat.level}</td><td className="p-4"><div className="flex items-center gap-2"><div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{width: `${Math.min(cat.productCount * 5, 100)}%`}}></div></div><span className="text-xs text-gray-400">{cat.productCount} items</span></div></td><td className="p-4"><ToggleRight className="w-8 h-8 text-emerald-500 cursor-pointer" /></td><td className="p-4 text-gray-500 text-xs">{cat.updatedAt}</td><td className="p-4 text-right pr-6"><div className="flex justify-end gap-2"><IconButton icon={Edit} color="text-blue-600" /><IconButton icon={Trash2} color="text-red-500" /></div></td></tr>))}</tbody></table>
                <Pagination />
            </div>
        </div>
    );

    const renderPackageManagement = () => (
        <div className="space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-3 gap-4">
                {[{ label: '套餐总数', val: '12', icon: Layers, color: 'blue' }, { label: '上架中', val: '8', icon: CheckCircle, color: 'emerald' }, { label: '库存预警', val: '1', icon: XCircle, color: 'red' }].map((c, i) => (<div key={i} className="bg-white p-5 rounded-xl border border-gray-200 flex justify-between items-center shadow-sm"><div><div className="text-gray-500 text-xs font-bold mb-1">{c.label}</div><div className={`text-2xl font-bold text-${c.color}-600`}>{c.val}</div></div><c.icon className={`w-8 h-8 text-${c.color}-200`} /></div>))}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30"><h2 className="text-xl font-bold text-gray-800">套餐列表</h2><button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2"><Plus className="w-4 h-4" /> 新建套餐</button></div>
                <div className="flex-1 overflow-auto p-6 grid grid-cols-1 gap-4">
                    {MOCK_ADMIN_PACKAGES.map(pkg => (
                        <div key={pkg.id} className="flex bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all gap-6 items-center group">
                            <div className="w-48 aspect-video bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 relative">
                                <img src={pkg.image} alt="" className="w-full h-full object-cover" />
                                <div className="absolute top-2 left-2"><StatusBadge status={pkg.status} /></div>
                            </div>
                            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg mb-1">{pkg.name}</h3>
                                    <div className="text-xs text-gray-400 font-mono mb-3">{pkg.id}</div>
                                    <div className="flex -space-x-2 overflow-hidden">
                                        {pkg.items.map((item: any, idx: number) => (
                                            <img key={idx} src={item.img} className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover bg-gray-100" alt={item.name} title={item.name} />
                                        ))}
                                        <div className="h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-bold">+{pkg.items.length}</div>
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center space-y-2">
                                    <div className="flex justify-between text-sm"><span className="text-gray-500">售价</span><span className="font-bold text-blue-600">¥{pkg.price.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-gray-500">成本</span><span className="font-mono text-gray-700">¥{pkg.cost?.toLocaleString() || '-'}</span></div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{width: '35%'}}></div></div>
                                    <div className="text-xs text-emerald-600 font-bold text-right">毛利率 35%</div>
                                </div>
                                <div className="flex flex-col justify-center items-end gap-2">
                                    <div className="text-sm text-gray-600">库存: <span className="font-bold">{pkg.stock}</span></div>
                                    <div className="text-sm text-gray-600">销量: {pkg.sales}</div>
                                    <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded text-xs font-bold hover:bg-blue-100">编辑</button>
                                        <button className="px-3 py-1.5 bg-red-50 text-red-600 rounded text-xs font-bold hover:bg-red-100">下架</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <Pagination />
            </div>
        </div>
    );

    const renderOrderManagement = () => {
        const filteredOrders = MOCK_ADMIN_ORDERS.filter(o => activeOrderStatus === 'all' || o.status === activeOrderStatus);
        return (
        <div className="space-y-6 animate-fade-in-up relative h-full flex">
            <div className={`flex-1 transition-all duration-300 flex flex-col ${selectedOrder ? 'mr-96' : ''}`}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">{[{ label: '全部', key: 'all', val: MOCK_ADMIN_ORDERS.length }, { label: '待付款', key: 'pending_payment', val: MOCK_ADMIN_ORDERS.filter(o=>o.status==='pending_payment').length }, { label: '待发货', key: 'paid', val: MOCK_ADMIN_ORDERS.filter(o=>o.status==='paid').length }, { label: '售后', key: 'refund', val: 0 }].map((tab) => (<div key={tab.key} onClick={() => setActiveOrderStatus(tab.key)} className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${activeOrderStatus === tab.key ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-200' : 'bg-white border-gray-200 hover:border-blue-300'}`}><span className={`font-bold text-sm ${activeOrderStatus === tab.key ? 'text-blue-800' : 'text-gray-600'}`}>{tab.label}</span><span className={`text-xl font-bold ${activeOrderStatus === tab.key ? 'text-blue-600' : 'text-gray-800'}`}>{tab.val}</span></div>))}</div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center bg-gray-50/30"><div className="flex gap-2"><select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white focus:border-blue-400"><option>支付方式</option></select></div><div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="搜索订单..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" /></div><button className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center gap-2"><Download className="w-4 h-4" /> 导出</button></div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left text-sm"><thead className="bg-gray-50 text-gray-600 font-semibold border-y border-gray-200 sticky top-0 z-10"><tr><th className="p-4 pl-6">订单信息</th><th className="p-4">买家</th><th className="p-4">金额</th><th className="p-4">状态</th><th className="p-4">下单时间</th><th className="p-4 text-right pr-6">操作</th></tr></thead><tbody className="divide-y divide-gray-100">{filteredOrders.map(order => (<tr key={order.id} onClick={() => setSelectedOrder(order)} className={`cursor-pointer transition-colors ${selectedOrder?.id === order.id ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}><td className="p-4 pl-6"><div className="font-bold text-blue-600 font-mono text-xs mb-1">{order.id}</div><div className="text-xs text-gray-500 flex items-center gap-1"><Package className="w-3 h-3" /> 共 {order.items?.length || 1} 件商品</div></td><td className="p-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold border border-gray-200">{order.buyer.name.charAt(0)}</div><div><div className="font-bold text-gray-800">{order.buyer.name}</div><div className="text-xs text-gray-400">{order.buyer.phone}</div></div></div></td><td className="p-4 font-mono font-bold text-gray-800">¥{order.amount.toLocaleString()}</td><td className="p-4"><StatusBadge status={order.status} /></td><td className="p-4 text-xs text-gray-500">{order.createdAt}</td><td className="p-4 text-right pr-6"><button className="text-xs text-blue-600 hover:underline font-medium">详情</button></td></tr>))}</tbody></table>
                    </div>
                    <Pagination />
                </div>
            </div>
            {/* Order Drawer */}
            <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 z-30 flex flex-col ${selectedOrder ? 'translate-x-0' : 'translate-x-full'}`}>
                {selectedOrder && (<><div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-gray-50"><span className="font-bold text-gray-800">订单详情</span><button onClick={() => setSelectedOrder(null)} className="hover:bg-gray-200 p-1 rounded-full"><X className="w-5 h-5 text-gray-500" /></button></div><div className="flex-1 overflow-y-auto p-6 space-y-6"><div className="bg-blue-50 p-4 rounded-xl border border-blue-100"><div className="flex justify-between items-center mb-2"><span className="text-xs text-blue-600 font-bold uppercase">Status</span></div><div className="flex items-center gap-2"><StatusBadge status={selectedOrder.status} />{selectedOrder.status === 'paid' && (<button onClick={() => setLogisticsModalOpen(true)} className="ml-auto bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700 flex items-center gap-1"><Truck className="w-3 h-3" /> 发货</button>)}</div></div><div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 shadow-sm"><div className="flex justify-between text-sm"><span className="text-gray-500">联系人</span><span className="font-medium">{selectedOrder.buyer.name}</span></div><div className="flex justify-between text-sm"><span className="text-gray-500">电话</span><span className="font-mono">{selectedOrder.buyer.phone}</span></div></div><div className="border-t border-gray-100 pt-4"><div className="flex justify-between text-sm mb-2"><span className="text-gray-500">总额</span><span>¥{selectedOrder.amount.toLocaleString()}</span></div><div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-100"><span className="font-bold text-gray-800">实付</span><span className="text-xl font-bold text-blue-600">¥{selectedOrder.amount.toLocaleString()}</span></div></div></div></>)}
            </div>
            {logisticsModalOpen && (<div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"><div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl"><h3 className="text-lg font-bold text-gray-800 mb-4">发货</h3><div className="space-y-4"><input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="物流公司" value={logisticsForm.company} onChange={e=>setLogisticsForm({...logisticsForm, company: e.target.value})}/><input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="单号" value={logisticsForm.trackingNo} onChange={e=>setLogisticsForm({...logisticsForm, trackingNo: e.target.value})}/></div><div className="flex justify-end gap-2 mt-6"><button onClick={()=>setLogisticsModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg text-sm">取消</button><button onClick={()=>{setLogisticsModalOpen(false);alert('发货成功')}} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">确认</button></div></div></div>)}
        </div>
        );
    };

    const renderCustomizationManagement = () => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in-up min-h-[600px]">
            <div className="p-6 border-b border-gray-100"><h2 className="text-xl font-bold text-gray-800 mb-1">定制化需求</h2><p className="text-xs text-gray-400">管理客户提交的定制化需求</p></div>
            <table className="w-full text-left text-sm"><thead className="bg-gray-50 text-gray-600 font-semibold"><tr><th className="p-4 pl-6">客户信息</th><th className="p-4">类型</th><th className="p-4">状态</th><th className="p-4">时间</th><th className="p-4 text-right pr-6">操作</th></tr></thead><tbody className="divide-y divide-gray-100">{MOCK_CUSTOM_REQUESTS.map(req => (<tr key={req.id} className="hover:bg-blue-50/30 transition-colors"><td className="p-4 pl-6"><div className="font-bold text-gray-800">{req.client}</div></td><td className="p-4 text-gray-600">{req.type}</td><td className="p-4"><StatusBadge status={req.status} text={req.status === 'pending' ? '待处理' : '处理中'} /></td><td className="p-4 text-gray-500 text-xs">{req.time}</td><td className="p-4 text-right pr-6"><div className="flex justify-end gap-3 text-blue-600 font-medium text-xs"><button className="hover:underline">查看</button></div></td></tr>))}</tbody></table>
            <Pagination />
        </div>
    );

    return (
        <div className="flex h-screen bg-[#F5F7FA] font-sans text-gray-800 overflow-hidden">
            {/* Sidebar */}
            <aside className={`bg-[#001529] text-gray-400 flex-shrink-0 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} flex flex-col shadow-xl z-20`}>
                <div className="h-16 flex items-center justify-center border-b border-[#002140] bg-[#001529]">
                    {isSidebarOpen ? <div className="flex items-center gap-2 text-white font-bold text-lg tracking-wider"><LayoutDashboard className="w-6 h-6 text-blue-500" /> 后台管理</div> : <LayoutDashboard className="w-6 h-6 text-blue-500" />}
                </div>
                <div className="flex-1 overflow-y-auto py-4 space-y-1 px-2 custom-scrollbar">
                    {[{ id: 'dashboard', label: '首页', icon: Home }, { id: 'design', label: '设计管理', icon: PenTool }, { id: 'users', label: '账号管理', icon: Users }, { id: 'assets', label: '素材管理', icon: Palette }, { id: 'products', label: '商品管理', icon: ShoppingBag }, { id: 'categories', label: '分类管理', icon: ListTree }, { id: 'packages', label: '套餐管理', icon: Layers }, { id: 'orders', label: '订单管理', icon: ClipboardList }, { id: 'customization', label: '定制需求', icon: PenLine }].map((item) => (
                        <button key={item.id} onClick={() => { setActiveView(item.id as AdminView); setSelectedOrder(null); }} className={`w-full flex items-center px-4 py-3 transition-all rounded-md mb-1 group ${activeView === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 font-medium' : 'hover:text-white text-gray-400 hover:bg-[#002140]'}`}>
                            <item.icon className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'} ${activeView === item.id ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                            {isSidebarOpen && <span className="text-sm">{item.label}</span>}
                        </button>
                    ))}
                </div>
                <div className="p-4 border-t border-[#002140]"><div className="flex items-center gap-3 px-2 mb-4"><div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold border-2 border-[#002140]">A</div>{isSidebarOpen && <div className="text-xs"><div className="text-gray-200 font-bold">Admin</div><div className="text-gray-500">v2.0</div></div>}</div></div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#F0F2F5]">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
                    <div className="flex items-center gap-4"><button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">{isSidebarOpen ? <ToggleLeft className="w-5 h-5" /> : <ToggleRight className="w-5 h-5" />}</button><div className="flex items-center gap-2 text-gray-500 text-sm"><Home className="w-4 h-4" /><span>/</span><span className="text-gray-800 font-medium capitalize">{activeView}</span></div></div>
                    <div className="flex items-center gap-4"><button onClick={onExit} className="px-4 py-1.5 border border-blue-200 text-blue-600 rounded-md text-xs font-medium hover:bg-blue-50 transition-colors flex items-center gap-1"><LogOut className="w-3 h-3" /> 返回前台</button><button className="p-2 hover:bg-gray-100 rounded-full relative text-gray-500"><Bell className="w-5 h-5" /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span></button></div>
                </header>
                <div className="flex-1 overflow-hidden p-6">
                    {activeView === 'dashboard' && renderDashboard()}
                    {activeView === 'design' && renderDesignManagement()}
                    {activeView === 'users' && renderUserManagement()}
                    {activeView === 'assets' && renderAssetManagement()}
                    {activeView === 'products' && renderProductManagement()}
                    {activeView === 'categories' && renderCategoryManagement()}
                    {activeView === 'packages' && renderPackageManagement()}
                    {activeView === 'orders' && renderOrderManagement()}
                    {activeView === 'customization' && renderCustomizationManagement()}
                </div>
            </main>
        </div>
    );
};

export default AdminPortal;
