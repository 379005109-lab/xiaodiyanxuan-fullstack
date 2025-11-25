import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [interestLevel, setInterestLevel] = useState<'needed' | 'undecided' | null>(null);
  const [formData, setFormData] = useState({
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    productType: '',
    customizationDetails: '',
    dimensions: '',
    materials: '',
    colors: '',
    budget: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleInterestClick = (level: 'needed' | 'undecided') => {
    setInterestLevel(level);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.contactName || !formData.contactPhone || !formData.productType || !formData.customizationDetails) {
      toast.error('请填写必填信息（姓名、电话、产品类型、定制需求）');
      return;
    }
    
    setSubmitting(true);
    try {
      await submitCustomizationRequest(formData);
      toast.success('您的需求已提交！我们将尽快与您联系。');
      setInterestLevel(null);
      setFormData({
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        productType: '',
        customizationDetails: '',
        dimensions: '',
        materials: '',
        colors: '',
        budget: '',
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">需要个性化定制？</h3>
      <p className="text-sm text-gray-600 mb-4">我们可以根据您的需求调整尺寸、材质或风格。请告诉我们您的想法。</p>
      
      <div className="flex gap-4 mb-4">
        <button onClick={() => handleInterestClick('needed')} className={`btn ${interestLevel === 'needed' ? 'btn-primary' : 'btn-secondary'}`}>需要定制</button>
        <button onClick={() => handleInterestClick('undecided')} className={`btn ${interestLevel === 'undecided' ? 'btn-primary' : 'btn-secondary'}`}>暂不确定</button>
      </div>

      <AnimatePresence>
        {interestLevel && (
          <motion.form 
            onSubmit={handleSubmit}
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" 
                value={formData.contactName} 
                onChange={e => setFormData({...formData, contactName: e.target.value})} 
                placeholder="您的姓名 *" 
                className="input"
                required
              />
              <input 
                type="tel" 
                value={formData.contactPhone} 
                onChange={e => setFormData({...formData, contactPhone: e.target.value})} 
                placeholder="联系电话 *" 
                className="input"
                required
              />
            </div>
            <input 
              type="email" 
              value={formData.contactEmail} 
              onChange={e => setFormData({...formData, contactEmail: e.target.value})} 
              placeholder="邮箱（可选）" 
              className="input"
            />
            <input 
              type="text" 
              value={formData.productType} 
              onChange={e => setFormData({...formData, productType: e.target.value})} 
              placeholder="产品类型（如：沙发、床、桌子）*" 
              className="input"
              required
            />
            <textarea 
              value={formData.customizationDetails} 
              onChange={e => setFormData({...formData, customizationDetails: e.target.value})} 
              placeholder="详细描述您的定制需求 *" 
              className="input min-h-[100px]"
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" 
                value={formData.dimensions} 
                onChange={e => setFormData({...formData, dimensions: e.target.value})} 
                placeholder="尺寸要求（可选）" 
                className="input"
              />
              <input 
                type="text" 
                value={formData.materials} 
                onChange={e => setFormData({...formData, materials: e.target.value})} 
                placeholder="材质要求（可选）" 
                className="input"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" 
                value={formData.colors} 
                onChange={e => setFormData({...formData, colors: e.target.value})} 
                placeholder="颜色要求（可选）" 
                className="input"
              />
              <input 
                type="text" 
                value={formData.budget} 
                onChange={e => setFormData({...formData, budget: e.target.value})} 
                placeholder="预算范围（可选）" 
                className="input"
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? '提交中...' : '提交我的定制需求'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
