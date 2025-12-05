import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Search, X, Check, Package } from 'lucide-react';
import { toast } from 'sonner';
import { uploadFile, getFileUrl } from '@/services/uploadService';
import { getProducts } from '@/services/productService';

interface ProductItem {
  _id: string;
  name: string;
  basePrice: number;
  images: string[];
  category: string;
  skus?: Array<{
    _id: string;
    skuName: string;
    material?: Record<string, string>;
    price: number;
  }>;
}

const AdminBargainFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    coverImage: '',
    productId: '',
    skuId: '',
    originalPrice: 0,
    targetPrice: 0,
    category: '',
    style: '',
    minCutAmount: 5,
    maxCutAmount: 50,
    maxHelpers: 20,
    sortOrder: 0
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // 商品选择相关
  const [showProductModal, setShowProductModal] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [selectedSku, setSelectedSku] = useState<any>(null);
  
  // 风格选项（从API获取）
  const [styleOptions, setStyleOptions] = useState<string[]>([]);

  useEffect(() => {
    loadStyles();
    loadProducts();
    if (isEditing && id) {
      loadBargainProduct();
    }
  }, [id, isEditing]);

  // 加载风格选项
  const loadStyles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products/styles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setStyleOptions(data.data);
      }
    } catch (error) {
      console.error('加载风格失败:', error);
    }
  };

  // 加载商品列表
  const loadProducts = async () => {
    try {
      const response = await getProducts({ pageSize: 200 });
      if (response.success) {
        setProducts(response.data || []);
      }
    } catch (error) {
      console.error('加载商品失败:', error);
    }
  };

  // 加载砍价商品（编辑时）
  const loadBargainProduct = async () => {
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
            productId: product.productId || '',
            skuId: product.skuId || '',
            originalPrice: product.originalPrice || 0,
            targetPrice: product.targetPrice || 0,
            category: product.category || '',
            style: product.style || '',
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

  // 处理图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 验证是图片
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }
    
    setUploading(true);
    try {
      const result = await uploadFile(file);
      if (result.success && result.data?.fileId) {
        handleChange('coverImage', result.data.fileId);
        toast.success('图片上传成功');
      } else {
        toast.error('上传失败');
      }
    } catch (error) {
      toast.error('上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 选择商品
  const handleSelectProduct = (product: ProductItem) => {
    setSelectedProduct(product);
    setSelectedSku(null);
  };

  // 选择规格
  const handleSelectSku = (sku: any) => {
    setSelectedSku(sku);
  };

  // 确认选择商品
  const handleConfirmProduct = () => {
    if (!selectedProduct) {
      toast.error('请选择商品');
      return;
    }
    
    const price = selectedSku?.price || selectedProduct.basePrice;
    const materialStr = selectedSku?.material 
      ? Object.values(selectedSku.material).join(' / ') 
      : '';
    const productName = selectedSku 
      ? `${selectedProduct.name} - ${selectedSku.skuName}${materialStr ? ` (${materialStr})` : ''}`
      : selectedProduct.name;
    
    setFormData(prev => ({
      ...prev,
      name: productName,
      productId: selectedProduct._id,
      skuId: selectedSku?._id || '',
      originalPrice: price,
      category: selectedProduct.category || '',
      coverImage: prev.coverImage || (selectedProduct.images?.[0] || '')
    }));
    
    setShowProductModal(false);
    toast.success('已选择商品');
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('请选择或输入商品名称');
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

  // 过滤商品
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">{isEditing ? '编辑' : '新建'}砍价商品</h1>

      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-xl space-y-6">
        {/* 封面图片上传 - 1:1 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">封面图片 *</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-gray-50 transition-colors overflow-hidden"
          >
            {formData.coverImage ? (
              <img 
                src={getFileUrl(formData.coverImage)} 
                alt="封面" 
                className="w-full h-full object-cover"
              />
            ) : uploading ? (
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">上传中...</p>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">点击上传图片</p>
                <p className="text-xs text-gray-400 mt-1">建议 1:1 比例</p>
              </div>
            )}
          </div>
        </div>

        {/* 选择商品 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">选择商品 *</label>
          <div 
            onClick={() => setShowProductModal(true)}
            className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
          >
            {formData.name ? (
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="font-medium">{formData.name}</p>
                  <p className="text-sm text-gray-500">原价: ¥{formData.originalPrice}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-gray-500">
                <Search className="w-5 h-5" />
                <span>点击选择商品</span>
              </div>
            )}
          </div>
        </div>

        {/* 价格设置 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">原价 *</label>
            <input
              type="number"
              placeholder="选择商品后自动填充"
              value={formData.originalPrice || ''}
              onChange={e => handleChange('originalPrice', Number(e.target.value))}
              className="input w-full"
              min="0"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">目标价（砍到底价）*</label>
            <input
              type="number"
              placeholder="输入砍价目标价"
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

        {/* 风格选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">风格</label>
          {styleOptions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {styleOptions.map(style => (
                <button
                  key={style}
                  type="button"
                  onClick={() => handleChange('style', style)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    formData.style === style 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">暂无风格数据</p>
          )}
        </div>

        {/* 砍价规则 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">每次最少砍（元）</label>
            <input
              type="number"
              value={formData.minCutAmount}
              onChange={e => handleChange('minCutAmount', Number(e.target.value))}
              className="input w-full"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">每次最多砍（元）</label>
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

      {/* 商品选择弹窗 */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold">选择商品</h3>
              <button onClick={() => setShowProductModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* 搜索 */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索商品..."
                  value={productSearchTerm}
                  onChange={e => setProductSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            
            {/* 商品列表 */}
            <div className="grid grid-cols-2 gap-4 p-4 max-h-[50vh] overflow-y-auto">
              {filteredProducts.map(product => (
                <div
                  key={product._id}
                  onClick={() => handleSelectProduct(product)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedProduct?._id === product._id 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex gap-3">
                    <img 
                      src={getFileUrl(product.images?.[0] || '')} 
                      alt={product.name} 
                      className="w-16 h-16 rounded object-cover bg-gray-100"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-sm text-gray-500">¥{product.basePrice}</p>
                      {product.skus && product.skus.length > 0 && (
                        <p className="text-xs text-blue-500">{product.skus.length} 个规格</p>
                      )}
                    </div>
                    {selectedProduct?._id === product._id && (
                      <Check className="w-5 h-5 text-primary-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* 规格选择 */}
            {selectedProduct && selectedProduct.skus && selectedProduct.skus.length > 0 && (
              <div className="p-4 border-t bg-gray-50">
                <p className="text-sm font-medium mb-2">选择规格：</p>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.skus.map(sku => (
                    <button
                      key={sku._id}
                      onClick={() => handleSelectSku(sku)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        selectedSku?._id === sku._id
                          ? 'border-primary-500 bg-primary-500 text-white'
                          : 'border-gray-300 hover:border-primary-500'
                      }`}
                    >
                      {sku.skuName} - ¥{sku.price}
                      {sku.material && Object.keys(sku.material).length > 0 && (
                        <span className="text-xs opacity-70 ml-1">
                          ({Object.values(sku.material).join('/')})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* 确认按钮 */}
            <div className="p-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowProductModal(false)} className="btn btn-secondary">
                取消
              </button>
              <button 
                onClick={handleConfirmProduct} 
                disabled={!selectedProduct}
                className="btn btn-primary"
              >
                确认选择
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBargainFormPage;
