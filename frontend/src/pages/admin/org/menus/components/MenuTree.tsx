import { useState } from 'react';

interface MenuTreeProps {
  onSelect: (menu: any) => void;
}

export default function MenuTree({ onSelect }: MenuTreeProps) {
  const [searchText, setSearchText] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['1', '4', '10']);
  const [selectedKey, setSelectedKey] = useState<string>('1');

  // 模拟菜单数据
  const menuData = [
    {
      id: '1',
      name: '租户管理',
      icon: 'ri-building-2-line',
      type: 'WEB',
      sort: 1,
      status: true,
      children: [
        { id: '2', name: '租户列表', icon: '', type: 'WEB', sort: 1, status: true },
        { id: '3', name: '添加账号', icon: '', type: 'WEB', sort: 2, status: true },
      ]
    },
    {
      id: '4',
      name: '前台配置',
      icon: 'ri-settings-3-line',
      type: 'WEB',
      sort: 2,
      status: true,
      children: [
        { id: '5', name: '前台首页', icon: '', type: 'WEB', sort: 1, status: true },
        { id: '6', name: '前台商品', icon: '', type: 'WEB', sort: 2, status: true },
      ]
    },
    {
      id: '10',
      name: '订单管理',
      icon: 'ri-file-list-3-line',
      type: 'WEB',
      sort: 6,
      status: true,
      children: [
        { id: '11', name: '订单列表', icon: '', type: 'WEB', sort: 1, status: true },
        { id: '12', name: '订单详情', icon: '', type: 'WEB', sort: 2, status: true },
      ]
    },
    {
      id: '14',
      name: '办公中心',
      icon: 'ri-briefcase-line',
      type: 'WEB',
      sort: 14,
      status: true,
      children: []
    },
    {
      id: '18',
      name: '业务中心',
      icon: 'ri-customer-service-2-line',
      type: 'WEB',
      sort: 18,
      status: true,
      children: [
        { id: '19', name: '客户管理', icon: '', type: 'WEB', sort: 1, status: true },
      ]
    },
    {
      id: '24',
      name: '系统权限',
      icon: 'ri-shield-check-line',
      type: 'WEB',
      sort: 24,
      status: true,
      children: []
    },
  ];

  const toggleExpand = (key: string) => {
    if (expandedKeys.includes(key)) {
      setExpandedKeys(expandedKeys.filter(k => k !== key));
    } else {
      setExpandedKeys([...expandedKeys, key]);
    }
  };

  const handleSelect = (menu: any) => {
    setSelectedKey(menu.id);
    onSelect(menu);
  };

  const renderTreeNode = (node: any, level: number = 0) => {
    const isExpanded = expandedKeys.includes(node.id);
    const isSelected = selectedKey === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center px-4 py-2 cursor-pointer hover:bg-stone-50 ${
            isSelected ? 'bg-[#14B8A6]/10 text-[#14B8A6]' : 'text-stone-700'
          }`}
          style={{ paddingLeft: `${16 + level * 20}px` }}
          onClick={() => handleSelect(node)}
        >
          {hasChildren && (
            <i
              className={`${
                isExpanded ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'
              } text-sm mr-1 cursor-pointer`}
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
            ></i>
          )}
          {!hasChildren && <span className="w-4 mr-1"></span>}
          {node.icon && <i className={`${node.icon} text-base mr-2`}></i>}
          <span className="text-sm flex-1">{node.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded ${
            node.type === 'WEB' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
          }`}>
            {node.type}
          </span>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child: any) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="p-4 border-b border-stone-200">
        <div className="relative">
          <input
            type="text"
            placeholder="请输入关键字"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]"
          />
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {menuData.map(node => renderTreeNode(node))}
      </div>

      <div className="p-4 border-t border-stone-200">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#14B8A6] text-white rounded-lg hover:bg-[#12a594] transition-colors cursor-pointer whitespace-nowrap">
          <i className="ri-add-line"></i>
          <span className="text-sm">新增菜单</span>
        </button>
      </div>
    </>
  );
}
