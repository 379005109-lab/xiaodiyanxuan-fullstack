
import React, { useState, useRef, useEffect } from 'react';
import { MOCK_ORDERS } from '../constants';
import { Order, OrderStatus, OrderLog } from '../types';
import { Download, Search, Filter, Printer, Copy, MoreHorizontal, User, MapPin, Clock, CreditCard, ShoppingBag, ChevronRight, Package, Eye, EyeOff, X, FileSpreadsheet, FileText, Send, AlertCircle, Truck, PenLine, Lock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

const OrderManagementView: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeStatus, setActiveStatus] = useState<OrderStatus | 'all'>('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    
    // UI State for interaction simulations
    const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
    
    // Privacy & Permissions
    const [isSensitiveVisible, setIsSensitiveVisible] = useState(false);
    const [isRequestingPermission, setIsRequestingPermission] = useState(false);

    // Notes
    const [newNote, setNewNote] = useState('');
    const noteInputRef = useRef<HTMLInputElement>(null);

    // Logistics Modal
    const [showLogisticsModal, setShowLogisticsModal] = useState(false);
    const [logisticsForm, setLogisticsForm] = useState({ company: '', trackingNo: '' });
    
    // Toast
    const [showExportToast, setShowExportToast] = useState(false);

    // Collapsible Sections State
    const [expandedSections, setExpandedSections] = useState({
        customer: true,
        products: true,
        timeline: false
    });

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const getStatusConfig = (status: OrderStatus) => {
        switch (status) {
            case 'pending_payment': return { label: '待付款', color: 'text-amber-600 bg-amber-50 border-amber-100', dot: 'bg-amber-500', nextAction: '标记已付' };
            case 'paid': return { label: '待发货', color: 'text-blue-600 bg-blue-50 border-blue-100', dot: 'bg-blue-500', nextAction: '发货' };
            case 'shipped': return { label: '已发货', color: 'text-purple-600 bg-purple-50 border-purple-100', dot: 'bg-purple-500', nextAction: '完成' };
            case 'completed': return { label: '已完成', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', dot: 'bg-emerald-500', nextAction: null };
            default: return { label: '已取消', color: 'text-stone-500 bg-stone-100 border-stone-200', dot: 'bg-stone-400', nextAction: null };
        }
    };

    // --- Actions ---

    const handleOrderClick = (order: Order, focusNote = false) => {
        setSelectedOrder(order);
        setIsSensitiveVisible(false); // Reset sensitive view on new selection
        setIsRequestingPermission(false);
        setExpandedSections({ customer: true, products: true, timeline: false }); // Reset expansion
        
        if (focusNote) {
            setExpandedSections(prev => ({ ...prev, timeline: true }));
            setTimeout(() => {
                noteInputRef.current?.focus();
            }, 300);
        }
    };

    const toggleSensitiveInfo = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedOrder) return;
        
        if (!isSensitiveVisible) {
            // Simulate permission request
            setIsRequestingPermission(true);
            setTimeout(() => {
                setIsRequestingPermission(false);
                setIsSensitiveVisible(true);
                
                // Log the access
                const newLog: OrderLog = {
                    id: `log_${Date.now()}`,
                    action: '查看敏感隐私信息',
                    operator: 'Admin',
                    timestamp: new Date().toLocaleString(),
                    type: 'sensitive_view'
                };
                const updatedOrder = {
                    ...selectedOrder,
                    logs: [newLog, ...selectedOrder.logs]
                };
                updateOrderInState(updatedOrder);
            }, 800); // 0.8s delay
        } else {
            setIsSensitiveVisible(false);
        }
    };

    const renderSensitiveInfo = (text: string, type: 'phone' | 'name' | 'address') => {
        if (isSensitiveVisible) return text;
        
        if (type === 'phone') return text.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
        if (type === 'name') return text.charAt(0) + (text.length > 2 ? '**' : '*');
        if (type === 'address') return text.substring(0, 6) + '******';
        return text;
    };

    const addNote = () => {
        if (!newNote.trim() || !selectedOrder) return;
        const note = {
            id: `note_${Date.now()}`,
            content: newNote,
            author: 'Admin',
            timestamp: new Date().toLocaleString()
        };
        const updatedOrder = {
            ...selectedOrder,
            internalNotes: [note, ...selectedOrder.internalNotes]
        };
        updateOrderInState(updatedOrder);
        setNewNote('');
    };

    const handleWorkflowAction = () => {
        if (!selectedOrder) return;
        
        // If current status is PAID, clicking next action (Ship) should open modal
        if (selectedOrder.status === 'paid') {
            setShowLogisticsModal(true);
            setLogisticsForm({ company: '', trackingNo: '' });
        } else {
            // Standard transition
            const nextMap: Record<string, OrderStatus> = { 'pending_payment': 'paid', 'shipped': 'completed' };
            const next = nextMap[selectedOrder.status];
            if (next) changeStatus(next);
        }
    };

    const submitLogistics = () => {
        if (!selectedOrder || !logisticsForm.company || !logisticsForm.trackingNo) return;
        
        const newLog: OrderLog = {
            id: `log_${Date.now()}`,
            action: `订单发货: ${logisticsForm.company} ${logisticsForm.trackingNo}`,
            operator: 'Admin',
            timestamp: new Date().toLocaleString(),
            type: 'status_change'
        };

        const updatedOrder: Order = {
            ...selectedOrder,
            status: 'shipped',
            logistics: {
                company: logisticsForm.company,
                trackingNo: logisticsForm.trackingNo,
                shippedAt: new Date().toLocaleString()
            },
            logs: [newLog, ...selectedOrder.logs]
        };

        updateOrderInState(updatedOrder);
        setShowLogisticsModal(false);
    };

    const changeStatus = (newStatus: OrderStatus) => {
        if (!selectedOrder) return;
        const newLog: OrderLog = {
            id: `log_${Date.now()}`,
            action: `状态变更: ${selectedOrder.status} -> ${newStatus}`,
            operator: 'Admin',
            timestamp: new Date().toLocaleString(),
            type: 'status_change'
        };
        const updatedOrder = {
            ...selectedOrder,
            status: newStatus,
            logs: [newLog, ...selectedOrder.logs]
        };
        updateOrderInState(updatedOrder);
    };

    const updateOrderInState = (updatedOrder: Order) => {
        setSelectedOrder(updatedOrder);
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    };

    const handleExport = (type: 'Excel' | 'PDF') => {
        setIsExportMenuOpen(false);
        setShowExportToast(true);
        setTimeout(() => setShowExportToast(false), 3000);
    };

    // Filter Logic
    const filteredOrders = orders.filter(o => {
        const matchStatus = activeStatus === 'all' || o.status === activeStatus;
        const matchSearch = o.id.includes(searchTerm) || o.customer.name.includes(searchTerm) || o.customer.phone.includes(searchTerm);
        return matchStatus && matchSearch;
    });

    const stats = [
        { label: '待付款', key: 'pending_payment', count: orders.filter(o => o.status === 'pending_payment').length, color: 'text-amber-600' },
        { label: '待发货', key: 'paid', count: orders.filter(o => o.status === 'paid').length, color: 'text-blue-600' },
        { label: '配送中', key: 'shipped', count: orders.filter(o => o.status === 'shipped').length, color: 'text-purple-600' },
        { label: '已完成', key: 'completed', count: orders.filter(o => o.status === 'completed').length, color: 'text-emerald-600' }
    ];

    return (
        <div className="animate-fade-in-up pb-20 bg-[#F2F4F3] min-h-screen relative flex">
            {/* Main Content Area */}
            <div className={`flex-1 transition-all duration-300 ${selectedOrder ? 'mr-[400px] lg:mr-[500px]' : ''}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                    
                    {/* Header & Stats */}
                    <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
                        <div>
                            <h1 className="text-2xl font-serif font-bold text-primary">订单中心</h1>
                            <p className="text-stone-500 text-xs mt-1 uppercase tracking-wider">Order Management</p>
                        </div>
                        
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                            {stats.map((stat, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => setActiveStatus(stat.key as OrderStatus)}
                                    className={`bg-white px-4 py-2 rounded-lg shadow-sm border min-w-[100px] flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-all ${activeStatus === stat.key ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-stone-100'}`}
                                >
                                    <span className={`text-xl font-serif font-bold ${stat.color}`}>{stat.count}</span>
                                    <span className="text-[10px] text-stone-400 mt-0.5">{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="bg-white p-2 rounded-xl border border-stone-200 shadow-sm mb-8 flex flex-col md:flex-row gap-2 sticky top-24 z-20 mx-1">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                            <input 
                                type="text" 
                                placeholder="搜索订单号、收货人..." 
                                className="w-full pl-9 pr-4 py-2 bg-stone-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-primary/20 text-primary placeholder:text-stone-400 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                            {['all', 'pending_payment', 'paid', 'shipped', 'completed'].map((status) => (
                                <button 
                                    key={status}
                                    onClick={() => setActiveStatus(status as any)}
                                    className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeStatus === status ? 'bg-primary text-white shadow-md' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'}`}
                                >
                                    {status === 'all' ? '全部订单' : getStatusConfig(status as OrderStatus).label}
                                </button>
                            ))}
                        </div>
                        
                        <div className="relative">
                            <button 
                                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                                className="px-3 py-2 bg-stone-50 text-stone-500 hover:text-primary rounded-lg border border-transparent hover:border-stone-200 transition-colors flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                <span className="text-xs hidden md:inline">导出数据</span>
                            </button>
                            {isExportMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-xl border border-stone-100 z-50 overflow-hidden animate-fade-in-up">
                                    <button onClick={() => handleExport('Excel')} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:bg-stone-50 flex items-center gap-2">
                                        <FileSpreadsheet className="w-4 h-4 text-green-600" /> 导出 Excel
                                    </button>
                                    <button onClick={() => handleExport('PDF')} className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:bg-stone-50 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-red-600" /> 导出 PDF
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order List */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredOrders.map(order => {
                            const statusConfig = getStatusConfig(order.status);
                            const isSelected = selectedOrder?.id === order.id;
                            
                            return (
                                <div 
                                    key={order.id} 
                                    onClick={() => handleOrderClick(order)}
                                    className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col cursor-pointer relative ${isSelected ? 'border-primary ring-1 ring-primary' : 'border-stone-100 hover:border-primary/30'}`}
                                >
                                    <div className="px-5 py-4 flex justify-between items-start border-b border-stone-50">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`}></div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-stone-800">{statusConfig.label}</span>
                                                    <span className="text-[10px] text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded border border-stone-100">{order.createdAt.split(' ')[0]}</span>
                                                </div>
                                                <div className="text-[10px] font-mono text-stone-400 mt-1">{order.id}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-serif font-bold text-[#C04E39]">¥{order.totalAmount.toLocaleString()}</div>
                                        </div>
                                    </div>

                                    <div className="p-5 flex-1 bg-white space-y-3">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex gap-3 items-center">
                                                <div className="w-10 h-10 rounded-lg bg-stone-50 border border-stone-100 overflow-hidden flex-shrink-0">
                                                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-xs font-medium text-stone-700 truncate">{item.productName}</h4>
                                                    <span className="text-[10px] text-stone-400">{item.specName} x {item.quantity}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action Footer on Card */}
                                    <div className="bg-stone-50 px-5 py-3 border-t border-stone-100 flex justify-between items-center group-hover:bg-stone-100/50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <User className="w-3 h-3 text-stone-400" />
                                            <span className="text-xs text-stone-500">{order.customer.name.charAt(0)}**</span>
                                        </div>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOrderClick(order, true);
                                            }}
                                            className="text-xs flex items-center gap-1 text-primary hover:text-accent font-medium px-2 py-1 rounded hover:bg-white transition-all shadow-sm"
                                        >
                                            <PenLine className="w-3 h-3" />
                                            写跟进
                                        </button>
                                    </div>
                                    
                                    {/* Selected Indicator */}
                                    {isSelected && (
                                        <div className="absolute inset-y-0 right-0 w-1 bg-primary"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Right Drawer - Order Details */}
            <div className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out w-full md:w-[400px] lg:w-[500px] flex flex-col border-l border-primary/5 ${selectedOrder ? 'translate-x-0' : 'translate-x-full'}`}>
                {selectedOrder && (
                    <>
                        {/* Drawer Header */}
                        <div className="h-20 bg-stone-50 px-6 flex items-center justify-between border-b border-stone-100 flex-shrink-0">
                            <div>
                                <h2 className="font-serif font-bold text-lg text-primary">订单详情</h2>
                                <p className="text-xs text-stone-400 font-mono">{selectedOrder.id}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
                                <X className="w-5 h-5 text-stone-500" />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            
                            {/* Workflow Actions */}
                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${getStatusConfig(selectedOrder.status).dot}`}></div>
                                    <span className="font-bold text-primary">{getStatusConfig(selectedOrder.status).label}</span>
                                </div>
                                {getStatusConfig(selectedOrder.status).nextAction && (
                                    <button 
                                        onClick={handleWorkflowAction}
                                        className="bg-primary text-white text-xs px-4 py-2 rounded-lg hover:bg-green-900 transition-colors shadow-sm"
                                    >
                                        {getStatusConfig(selectedOrder.status).nextAction}
                                    </button>
                                )}
                            </div>

                            {/* Logistics Info (If Shipped) */}
                            {selectedOrder.logistics && (
                                <section className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                    <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <Truck className="w-3 h-3" /> 物流跟踪
                                    </h3>
                                    <div className="text-sm text-stone-700">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-stone-500">物流公司</span>
                                            <span className="font-medium">{selectedOrder.logistics.company}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-stone-500">运单编号</span>
                                            <span className="font-mono">{selectedOrder.logistics.trackingNo}</span>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Customer Info (Collapsible) */}
                            <section>
                                <div 
                                    className="flex justify-between items-center mb-4 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => toggleSection('customer')}
                                >
                                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                                        <User className="w-3 h-3" /> 客户信息
                                    </h3>
                                    {expandedSections.customer ? <ChevronUp className="w-3 h-3 text-stone-400" /> : <ChevronDown className="w-3 h-3 text-stone-400" />}
                                </div>
                                
                                {expandedSections.customer && (
                                    <div className="bg-white border border-stone-100 rounded-xl p-4 shadow-sm space-y-3 relative overflow-hidden animate-fade-in-up">
                                        <div className="flex justify-end mb-2">
                                            <button 
                                                onClick={toggleSensitiveInfo}
                                                disabled={isRequestingPermission}
                                                className={`text-[10px] flex items-center gap-1 transition-colors px-2 py-1 rounded ${isSensitiveVisible ? 'bg-red-50 text-red-600' : 'bg-stone-100 text-stone-500 hover:text-primary'}`}
                                            >
                                                {isRequestingPermission ? (
                                                    <>
                                                        <span className="w-2 h-2 rounded-full border border-stone-400 border-t-transparent animate-spin"></span>
                                                        申请中...
                                                    </>
                                                ) : (
                                                    <>
                                                        {isSensitiveVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                        {isSensitiveVisible ? '隐藏' : '查看'}
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {!isSensitiveVisible && (
                                            <div className="absolute top-8 right-2 opacity-10 pointer-events-none">
                                                <Lock className="w-12 h-12 text-stone-900" />
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between border-b border-stone-50 pb-3">
                                            <span className="text-stone-500 text-sm">联系人</span>
                                            <span className="font-medium text-stone-800 text-sm">
                                                {renderSensitiveInfo(selectedOrder.customer.name, 'name')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-stone-50 pb-3">
                                            <span className="text-stone-500 text-sm">联系电话</span>
                                            <span className="font-medium text-stone-800 text-sm font-mono">
                                                {renderSensitiveInfo(selectedOrder.customer.phone, 'phone')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-start">
                                            <span className="text-stone-500 text-sm whitespace-nowrap mr-4">收货地址</span>
                                            <span className="font-medium text-stone-800 text-sm text-right">
                                                {renderSensitiveInfo(selectedOrder.customer.address, 'address')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-start pt-2 bg-yellow-50/50 p-2 rounded-lg mt-2">
                                            <span className="text-yellow-700 text-xs whitespace-nowrap mr-4 font-bold">买家备注</span>
                                            <span className="text-yellow-800 text-xs text-right">{selectedOrder.note || '无'}</span>
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* Product List (Collapsible) */}
                            <section>
                                <div 
                                    className="flex justify-between items-center mb-4 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => toggleSection('products')}
                                >
                                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                                        <ShoppingBag className="w-3 h-3" /> 商品清单
                                    </h3>
                                    {expandedSections.products ? <ChevronUp className="w-3 h-3 text-stone-400" /> : <ChevronDown className="w-3 h-3 text-stone-400" />}
                                </div>
                                {expandedSections.products && (
                                    <div className="space-y-4 animate-fade-in-up">
                                        {selectedOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex gap-4 bg-stone-50 p-3 rounded-xl border border-stone-100">
                                                <div className="w-16 h-16 rounded-lg bg-white overflow-hidden border border-stone-200 flex-shrink-0">
                                                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold text-primary text-sm">{item.productName}</h4>
                                                        <span className="text-xs text-stone-500">x{item.quantity}</span>
                                                    </div>
                                                    <div className="text-xs text-stone-500 mt-1">{item.specName}</div>
                                                    <div className="flex gap-2 mt-2">
                                                        {item.dimensions && <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-stone-200 text-stone-400">{item.dimensions}</span>}
                                                        {item.material && <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-stone-200 text-stone-400">{item.material}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Timeline & Notes (Collapsible) */}
                            <section>
                                <div 
                                    className="flex justify-between items-center mb-4 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => toggleSection('timeline')}
                                >
                                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                                        <Clock className="w-3 h-3" /> 订单动态 & 跟进
                                    </h3>
                                    {expandedSections.timeline ? <ChevronUp className="w-3 h-3 text-stone-400" /> : <ChevronDown className="w-3 h-3 text-stone-400" />}
                                </div>
                                
                                {expandedSections.timeline && (
                                    <div className="bg-white border border-stone-100 rounded-xl overflow-hidden shadow-sm animate-fade-in-up">
                                        {/* Timeline */}
                                        <div className="max-h-40 overflow-y-auto p-4 space-y-4 bg-stone-50/30">
                                            {selectedOrder.logs.map((log, idx) => (
                                                <div key={idx} className="flex gap-3 text-xs">
                                                    <div className="text-stone-400 w-24 flex-shrink-0">{log.timestamp.split(' ')[1]} <br/><span className="text-[9px]">{log.timestamp.split(' ')[0]}</span></div>
                                                    <div className="flex-1">
                                                        <div className={`font-medium ${log.type === 'sensitive_view' ? 'text-red-500' : 'text-stone-700'}`}>
                                                            {log.action}
                                                        </div>
                                                        <div className="text-[10px] text-stone-400">操作人: {log.operator}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Notes */}
                                        <div className="border-t border-stone-100 p-4">
                                            <div className="space-y-3 mb-4">
                                                {selectedOrder.internalNotes.map((note) => (
                                                    <div key={note.id} className="bg-yellow-50 p-2.5 rounded-lg text-xs relative group">
                                                        <div className="text-stone-700">{note.content}</div>
                                                        <div className="text-[10px] text-stone-400 mt-1 text-right flex justify-end gap-2">
                                                            <span>{note.author}</span>
                                                            <span>{note.timestamp}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <input 
                                                    ref={noteInputRef}
                                                    type="text" 
                                                    value={newNote}
                                                    onChange={(e) => setNewNote(e.target.value)}
                                                    placeholder="添加跟进备注..."
                                                    className="flex-1 bg-stone-50 border-none rounded-lg text-xs px-3 py-2 focus:ring-1 focus:ring-primary/30"
                                                    onKeyPress={(e) => e.key === 'Enter' && addNote()}
                                                />
                                                <button 
                                                    onClick={addNote}
                                                    disabled={!newNote.trim()}
                                                    className="p-2 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-green-900 transition-colors"
                                                >
                                                    <Send className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>
                        </div>
                    </>
                )}
            </div>

            {/* Logistics Modal */}
            {showLogisticsModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in-up">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-serif font-bold text-lg text-primary">填写发货信息</h3>
                            <button onClick={() => setShowLogisticsModal(false)} className="text-stone-400 hover:text-stone-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-stone-500 mb-1 block">物流公司 Logistics Provider</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-stone-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="例如: 顺丰速运"
                                    value={logisticsForm.company}
                                    onChange={(e) => setLogisticsForm({...logisticsForm, company: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-stone-500 mb-1 block">运单编号 Tracking Number</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-stone-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="例如: SF123456789"
                                    value={logisticsForm.trackingNo}
                                    onChange={(e) => setLogisticsForm({...logisticsForm, trackingNo: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button 
                                onClick={() => setShowLogisticsModal(false)}
                                className="flex-1 py-2.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
                            >
                                取消
                            </button>
                            <button 
                                onClick={submitLogistics}
                                disabled={!logisticsForm.company || !logisticsForm.trackingNo}
                                className="flex-1 py-2.5 rounded-lg bg-primary text-white hover:bg-green-900 disabled:opacity-50 transition-colors font-medium"
                            >
                                确认发货
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Toast */}
            {showExportToast && (
                <div className="fixed top-24 right-1/2 translate-x-1/2 bg-white text-stone-800 border border-stone-200 px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-2 animate-fade-in-up">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">数据导出已生成</span>
                </div>
            )}
        </div>
    );
};

export default OrderManagementView;