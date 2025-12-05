import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, Upload } from 'lucide-react';
import { toast } from 'sonner';

const AdminBargainFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    coverImage: '',
    originalPrice: 0,
    targetPrice: 0,
    category: '沙发',
    style: '现代简约',
    minCutAmount: 5,
    maxCutAmount: 50,
    maxHelpers: 20,
    sortOrder: 0
  });
  const [loading, setLoading] = useState(false);

  const categoryOptions = ['沙发', '床具', '餐桌椅', '柜类', '其他'];
  const styleOptions = ['现代简约', '北欧风', '轻奢', '中式', '意式极简'];

  useEffect(() => {
    if (isEditing && id) {
      loadProduct();
    }
  }, [id, isEditing]);

  const loadProduct = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bargains/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const product = data.data.find((p: any) => p._id === id);
        if (product) {
          setFormData({
            name: product.name || '',
            coverImage: product.coverImage || '',
            originalPrice: product.originalPrice || 0,
            targetPrice: product.targetPrice || 0,
            category: product.category || '沙发',
            style: product.style || '现代简约',
            minCutAmount: product.minCutAmount || 5,
            maxCutAmount: product.maxCutAmount || 50,
            maxHelpers: product.maxHelpers || 20,
            sortOrder: product.sortOrder || 0
          });
        }
      }
    } catch (error) {
      console.error('加载商品失败:', error);
      toast.error('加载失败');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('请输入商品名称');
      return;
    }
    if (!formData.originalPrice || !formData.targetPrice) {
      toast.error('请输入价格');
      return;
    }
    if (formData.targetPrice >= formData.originalPrice) {
      toast.error('目标价必须低于原价');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = isEditing ? `/api/bargains/products/${id}` : '/api/bargains/products';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(isEditing ? '更新成功' : '创建成功');
        navigate('/admin/bargain');
      } else {
        toast.error(data.message || '操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">{isEditing ? '编辑' : '新建'}砍价商品</h1>

      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-xl space-y-6">
        {/* 商品名称 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">商品名称 *</label>
          <input 
            type="text" 
            placeholder="输入砍价商品名称"
            className="input w-full"
            value={formData.name}
            onChange={e => handleChange('name', e.target.value)}
          />
        </div>

        {/* 封面图片 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">封面图片URL</label>
          <input 
            type="text" 
            placeholder="输入图片URL"
            className="input w-full"
            value={formData.coverImage}
            onChange={e => handleChange('coverImage', e.target.value)}
          />
          {formData.coverImage && (
            <div className="mt-2 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
              <img src={formData.coverImage} alt="预览" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* 价格设置 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">原价 *</label>
            <input
              type="number"
              placeholder="0"
              value={formData.originalPrice || ''}
              onChange={e => handleChange('originalPrice', Number(e.target.value))}
              className="input w-full"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">目标价（底价）*</label>
            <input
              type="number"
              placeholder="0"
              value={formData.targetPrice || ''}
              onChange={e => handleChange('targetPrice', Number(e.target.value))}
              className="input w-full"
              min="0"
            />
          </div>
        </div>

        {/* 价格预览 */}
        {formData.originalPrice > 0 && formData.targetPrice > 0 && (
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              可砍空间：<span className="font-bold text-green-600">¥{formData.originalPrice - formData.targetPrice}</span>
              （{Math.round((1 - formData.targetPrice / formData.originalPrice) * 100)}% 折扣）
            </p>
          </div>
        )}

        {/* 分类和风格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
            <select
              value={formData.category}
              onChange={e => handleChange('category', e.target.value)}
              className="input w-full"
            >
              {categoryOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">风格</label>
            <select
              value={formData.style}
              onChange={e => handleChange('style', e.target.value)}
              className="input w-full"
            >
              {styleOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 砍价规则 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">每次最少砍</label>
            <input
              type="number"
              value={formData.minCutAmount}
              onChange={e => handleChange('minCutAmount', Number(e.target.value))}
              className="input w-full"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">每次最多砍</label>
            <input
              type="number"
              value={formData.maxCutAmount}
              onChange={e => handleChange('maxCutAmount', Number(e.target.value))}
              className="input w-full"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">最多帮砍人数</label>
            <input
              type="number"
              value={formData.maxHelpers}
              onChange={e => handleChange('maxHelpers', Number(e.target.value))}
              className="input w-full"
              min="1"
            />
          </div>
        </div>

        {/* 排序权重 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">排序权重</label>
          <input
            type="number"
            value={formData.sortOrder}
            onChange={e => handleChange('sortOrder', Number(e.target.value))}
            className="input w-full"
          />
          <p className="text-xs text-gray-500 mt-1">数值越大排序越靠前</p>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <button onClick={() => navigate('/admin/bargain')} className="btn btn-secondary">取消</button>
          <button onClick={handleSave} disabled={loading} className="btn btn-primary w-32">
            {loading ? '保存中...' : (isEditing ? '更新' : '创建')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminBargainFormPage;
