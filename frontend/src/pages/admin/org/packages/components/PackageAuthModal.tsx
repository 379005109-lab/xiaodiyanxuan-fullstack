import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, ChevronRight, ChevronDown } from 'lucide-react';
import {
  getMenuPermissionsAPI,
  getTenantPackageMenuAPI,
  updateTenantPackageMenuAPI,
} from '@/services/applicationService';

interface PackageAuthModalProps {
  packageId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface MenuNode {
  id: string;
  name: string;
  children?: MenuNode[];
}

export default function PackageAuthModal({
  packageId,
  onClose,
  onSuccess,
}: PackageAuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [menuTree, setMenuTree] = useState<MenuNode[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [packageId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [menuRes, authRes] = await Promise.all([
        getMenuPermissionsAPI(),
        getTenantPackageMenuAPI(packageId),
      ]);

      if (menuRes.code === 0 || menuRes.code === 200) {
        setMenuTree(menuRes.data || []);
        // 默认展开所有节点
        const allIds = new Set<string>();
        const collectIds = (nodes: MenuNode[]) => {
          nodes.forEach((node) => {
            allIds.add(node.id);
            if (node.children) {
              collectIds(node.children);
            }
          });
        };
        collectIds(menuRes.data || []);
        setExpandedIds(allIds);
      }

      if (authRes.code === 0 || authRes.code === 200) {
        const menuIds = authRes.data?.menuIds || [];
        setCheckedIds(new Set(menuIds));
      }
    } catch (error: any) {
      toast.error(error.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getAllChildIds = (node: MenuNode): string[] => {
    const ids: string[] = [node.id];
    if (node.children) {
      node.children.forEach((child) => {
        ids.push(...getAllChildIds(child));
      });
    }
    return ids;
  };

  const toggleCheck = (node: MenuNode) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      const allIds = getAllChildIds(node);
      const isChecked = next.has(node.id);

      if (isChecked) {
        // 取消选中：移除自己和所有子节点
        allIds.forEach((id) => next.delete(id));
      } else {
        // 选中：添加自己和所有子节点
        allIds.forEach((id) => next.add(id));
      }

      return next;
    });
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const res = await updateTenantPackageMenuAPI({
        tenantPackageId: packageId,
        menuIds: Array.from(checkedIds),
      });
      if (res.code === 0 || res.code === 200) {
        toast.success('授权配置成功');
        onSuccess();
      } else {
        toast.error(res.msg || '授权配置失败');
      }
    } catch (error: any) {
      toast.error(error.message || '授权配置失败');
    } finally {
      setSubmitting(false);
    }
  };

  const renderTree = (nodes: MenuNode[], level = 0): React.ReactNode => {
    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedIds.has(node.id);
      const isChecked = checkedIds.has(node.id);

      return (
        <div key={node.id}>
          <div
            className="flex items-center gap-2 py-1.5 hover:bg-stone-50 rounded px-2"
            style={{ paddingLeft: `${level * 20 + 8}px` }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(node.id)}
                className="text-stone-400 hover:text-stone-600"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <span className="w-4" />
            )}
            <label className="flex items-center gap-2 cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleCheck(node)}
                className="rounded border-stone-300 text-[#14B8A6] focus:ring-[#14B8A6]"
              />
              <span className="text-sm text-stone-700">{node.name}</span>
            </label>
          </div>
          {hasChildren && isExpanded && renderTree(node.children!, level + 1)}
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h3 className="text-lg font-semibold text-stone-900">授权配置</h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
          {loading ? (
            <div className="text-center py-8 text-stone-500">加载中...</div>
          ) : menuTree.length === 0 ? (
            <div className="text-center py-8 text-stone-500">暂无菜单数据</div>
          ) : (
            <div className="border border-stone-200 rounded-lg p-2 max-h-96 overflow-y-auto">
              {renderTree(menuTree)}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200 bg-stone-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-100 transition-colors text-sm"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-[#14B8A6] text-white rounded-lg hover:bg-[#0d9488] transition-colors text-sm disabled:opacity-50"
          >
            {submitting ? '保存中...' : '确定'}
          </button>
        </div>
      </div>
    </div>
  );
}
