import { useState } from 'react';
import { toast } from 'sonner';

// This would be in a service file
const submitCustomizationRequest = async (data: any) => {
  const API_URL = import.meta.env.VITE_API_URL || 'https://bcvriiezbpza.sealoshzh.site/api';
  const response = await fetch(`${API_URL}/customization`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Include Authorization header if the user is logged in
      // 'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || '提交失败');
  }
  return result;
};

interface CustomizationFormProps {
  productId: string;
}

export default function CustomizationForm({ productId }: CustomizationFormProps) {
  const [formData, setFormData] = useState({
    dimensions: '',
    materials: '',
    colors: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.dimensions && !formData.materials && !formData.colors) {
      toast.error('请至少填写一项定制需求');
      return;
    }
    
    // 构建提交数据 - 后端需要的必填字段从用户信息获取
    const customizationDetails = [
      formData.dimensions && `尺寸：${formData.dimensions}`,
      formData.materials && `材质：${formData.materials}`,
      formData.colors && `颜色：${formData.colors}`,
    ].filter(Boolean).join(' | ');
    
    const submitData = {
      contactName: '当前登录用户', // 后端会从token获取
      contactPhone: '从用户信息获取', // 后端会从token获取
      productType: '定制家具',
      customizationDetails,
      dimensions: formData.dimensions,
      materials: formData.materials,
      colors: formData.colors,
    };
    
    setSubmitting(true);
    try {
      await submitCustomizationRequest(submitData);
      toast.success('您的定制需求已提交！我们将尽快与您联系。');
      setFormData({
        dimensions: '',
        materials: '',
        colors: '',
      });
    } catch (error: any) {
      toast.error(error.message || '提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">需要个性化定制？</h3>
      <p className="text-sm text-gray-600 mb-4">告诉我们您期望的尺寸、材质或颜色，我们将为您定制。</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          type="text" 
          value={formData.dimensions} 
          onChange={e => setFormData({...formData, dimensions: e.target.value})} 
          placeholder="期望尺寸（如：长2米 × 宽0.9米 × 高0.8米）" 
          className="input w-full"
        />
        <input 
          type="text" 
          value={formData.materials} 
          onChange={e => setFormData({...formData, materials: e.target.value})} 
          placeholder="期望材质（如：科技布、真皮、金属）" 
          className="input w-full"
        />
        <input 
          type="text" 
          value={formData.colors} 
          onChange={e => setFormData({...formData, colors: e.target.value})} 
          placeholder="期望颜色（如：米白色、深灰色）" 
          className="input w-full"
        />
        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? '提交中...' : '提交定制需求'}
        </button>
      </form>
    </div>
  );
}
