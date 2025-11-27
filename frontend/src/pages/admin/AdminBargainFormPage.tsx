import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import ProductSelector from '../../components/admin/ProductSelector';
import { getProducts } from '@/services/productService';
import { getAllCategories, Category } from '@/services/categoryService';
import { createCategoryLookup, getRoleDiscountMultiplier } from '@/utils/categoryHelper';
import { useAuthStore } from '@/store/authStore';

interface Product {
  id: number;
  name: string;
  price: number;
  specs: string;
  image: string;
  category: string;
  material: any;
  _id?: string;
}

const AdminBargainFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isEditing = Boolean(id);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [floorPrice, setFloorPrice] = useState(0);
  const [styleTags, setStyleTags] = useState<string[]>([]);
  const [activityName, setActivityName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [participantLimit, setParticipantLimit] = useState(0);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLookup, setCategoryLookup] = useState<Map<string, Category>>(new Map());

  // Mock data for style tags
  const allStyleTags = ['现代简约', '轻奢', '北欧', '意式极简'];

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await getProducts({ pageSize: 200 });
      if (response.success) {
        const products = response.data.map((p: any) => ({
          id: p._id ? parseInt(p._id.slice(-4)) : Math.random(),
          _id: p._id,
          name: p.name,
          price: p.basePrice || 0,
          specs: Object.values(p.specifications || {}).join(' | ') || '无规格',
          image: p.images?.[0] || '/placeholder.svg',
          category: p.category,
          material: p.skus?.[0]?.material || {}
        }));
        setAllProducts(products);
      }
    } catch (error) {
      console.error('加载商品失败:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const allCategories = await getAllCategories();
      setCategories(allCategories);
      setCategoryLookup(createCategoryLookup(allCategories));
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const getDiscountMultiplier = (categoryKey?: string) => {
    return getRoleDiscountMultiplier(categoryLookup, user?.role, categoryKey);
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setFloorPrice(Math.round(product.price * 0.8));
  };

  const toggleStyleTag = (tag: string) => {
    setStyleTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };


  useEffect(() => {
    if (isEditing && id) {
      const bargainProducts = JSON.parse(localStorage.getItem('bargain_products') || '[]');
      const productToEdit = bargainProducts.find((p: any) => p.id === parseInt(id, 10));
      if (productToEdit) {
        const product = allProducts.find(p => p.id === productToEdit.productId);
        setSelectedProduct(product || null);
        setFloorPrice(Math.round(productToEdit.floorPrice));
        setStyleTags(productToEdit.styleTags || []);
        setActivityName(productToEdit.activityName || '');
        setStartTime(productToEdit.startTime || '');
        setEndTime(productToEdit.endTime || '');
        setParticipantLimit(productToEdit.participantLimit || 0);
      }
    }
  }, [id, isEditing]);

  const handleSave = () => {
    if (!selectedProduct) {
      alert('请先选择一个商品！');
      return;
    }

    const finalFloorPrice = Math.round(floorPrice);

    const bargainProduct = {
      id: isEditing ? parseInt(id!, 10) : Date.now(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productImage: selectedProduct.image,
      originalPrice: selectedProduct.price,
      floorPrice: finalFloorPrice,
      styleTags,
      activityName,
      startTime,
      endTime,
      participantLimit,
      status: 'active',
    };

    const bargainProducts = JSON.parse(localStorage.getItem('bargain_products') || '[]');
    if (isEditing) {
      const index = bargainProducts.findIndex((p: any) => p.id === bargainProduct.id);
      bargainProducts[index] = bargainProduct;
    } else {
      bargainProducts.push(bargainProduct);
    }

    localStorage.setItem('bargain_products', JSON.stringify(bargainProducts));
    navigate('/admin/bargain');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">{isEditing ? '编辑' : '新建'}砍价商品</h1>

      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-xl space-y-8">
        {/* Activity Name & Image Display */}
        <div className="text-center">
          <input 
            type="text" 
            placeholder="给活动起个名字" 
            className="input input-ghost text-2xl font-bold w-full max-w-md text-center mb-4"
            value={activityName}
            onChange={e => setActivityName(e.target.value)}
          />
          {selectedProduct && (
            <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden mx-auto max-w-md">
              <img src={selectedProduct.image} alt={selectedProduct.name} className="max-h-full max-w-full object-contain" />
            </div>
          )}
        </div>

        {/* Product Selector */}
        <div>
          <h2 className="text-xl font-bold mb-4">选择商品</h2>
          <ProductSelector 
            onSelect={handleProductSelect} 
            selectedProductId={selectedProduct?.id || null} 
          />
        </div>
        
        {selectedProduct && (
          <div className="border-t pt-8 space-y-6">
            {/* 底价提醒 */}
            {user?.role === 'designer' && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900">该商品的底价是：¥{Math.round(selectedProduct.price * getDiscountMultiplier(selectedProduct.category))}</p>
                  <p className="text-xs text-red-700 mt-1">砍价底价不能低于此价格</p>
                </div>
              </div>
            )}

            {/* Product Info */}
            <div>
              <h3 className="text-lg font-semibold">{selectedProduct.name}</h3>
              <p className="text-sm text-gray-500">规格: {selectedProduct.specs} | 材质: {selectedProduct.material ? Object.values(selectedProduct.material).join(', ') : '暂无'}</p>
            </div>

            {/* Price & Limits Config */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">原价: <span className="line-through">¥{selectedProduct.price}</span></span>
                <span className="text-lg font-bold text-red-500">¥{Math.round(floorPrice)}</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <label htmlFor="floorPrice" className="block text-sm font-medium text-gray-700">设置底价</label>
                <input
                  type="number"
                  id="floorPrice"
                  value={floorPrice}
                  onChange={e => setFloorPrice(Math.round(Number(e.target.value)))}
                  className="input w-full mt-1"
                  step="1"
                  min="0"
                />
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">开始时间</label>
                <input type="datetime-local" id="startTime" value={startTime} onChange={e => setStartTime(e.target.value)} className="input w-full mt-1" />
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">结束时间</label>
                <input type="datetime-local" id="endTime" value={endTime} onChange={e => setEndTime(e.target.value)} className="input w-full mt-1" />
              </div>
              <div className="md:col-span-2 p-4 bg-gray-50 rounded-lg">
                <label htmlFor="participantLimit" className="block text-sm font-medium text-gray-700">参与人数限制</label>
                <input type="number" id="participantLimit" value={participantLimit} onChange={e => setParticipantLimit(Number(e.target.value))} className="input w-full mt-1" />
                <p className="text-xs text-gray-500 mt-1">设置为 0 表示不限制人数。</p>
              </div>
            </div>

            {/* Style Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">风格标签</label>
              <div className="flex flex-wrap gap-2">
                {allStyleTags.map(tag => (
                  <button 
                    key={tag}
                    onClick={() => toggleStyleTag(tag)}
                    className={`btn btn-sm ${styleTags.includes(tag) ? 'btn-primary' : 'btn-outline'}`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-8 border-t">
              <button onClick={() => navigate('/admin/bargain')} className="btn btn-ghost">取消</button>
              <button onClick={handleSave} className="btn btn-primary w-32">{isEditing ? '更新' : '发起活动'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBargainFormPage;
