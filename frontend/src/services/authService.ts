import apiClient from '@/lib/apiClient';
import { RegisterFormData, AuthResponse } from '@/types';

export const registerUser = async (formData: RegisterFormData): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post('/auth/register', formData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '注册失败，请稍后再试');
  }
};

export const loginUser = async (formData: any): Promise<AuthResponse> => {
  try {
    // 将 username 字段转换为 identifier（如果需要）
    const loginData = {
      username: formData.username,
      password: formData.password,
    };
    const response = await apiClient.post('/auth/login', loginData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '登录失败，请检查您的凭证');
  }
};

// 发送验证码
export const sendVerificationCode = async (phone: string): Promise<{ success: boolean; message: string; code?: string }> => {
  try {
    const response = await apiClient.post('/auth/send-code', { phone });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '发送验证码失败');
  }
};

// 手机号登录/注册
export const registerWithPhone = async (phone: string, verifyCode: string): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post('/auth/register', { phone, verifyCode });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '登录失败');
  }
};
