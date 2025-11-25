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
  const [requirements, setRequirements] = useState({ dimensions: '', material: '', style: '', other: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleInterestClick = (level: 'needed' | 'undecided') => {
    setInterestLevel(level);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitCustomizationRequest({ 
        productId, 
        interestLevel, 
        requirements 
      });
      toast.success('您的需求已提交！我们将尽快与您联系。');
      setInterestLevel(null); // Reset form
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
            <textarea value={requirements.dimensions} onChange={e => setRequirements({...requirements, dimensions: e.target.value})} placeholder="期望尺寸（如：长度2米，深度0.9米）" className="input"></textarea>
            <textarea value={requirements.material} onChange={e => setRequirements({...requirements, material: e.target.value})} placeholder="期望材质（如：科技布，颜色改为米白）" className="input"></textarea>
            <textarea value={requirements.style} onChange={e => setRequirements({...requirements, style: e.target.value})} placeholder="期望风格（如：希望腿部改为金属材质，更简约）" className="input"></textarea>
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? '提交中...' : '提交我的定制需求'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
