import apiClient from '@/lib/apiClient';
import { RegisterFormData, AuthResponse } from '@/types';
import javaApiClient from '@/api/javaApiClient';

// 登录API - 账号密码登录
export const loginAPI = async (params: { username: string; password: string }) => {
  try {
    // OAuth2 密码模式登录 - 参照Vue版代码的参数格式
    const loginData = new URLSearchParams();
    loginData.append('grant_type', 'password');
    loginData.append('client_id', 'tenant');
    loginData.append('scope', 'server');
    loginData.append('state', '1829779435941711873');
    loginData.append('username', params.username);
    loginData.append('password', params.password);
    
    const response = await javaApiClient.post('/oauth2/token', loginData, {
      headers: {
        'Authorization': `Basic dGVuYW50OnRlbmFudA`
      }
    });
    
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '登录认证失败');
  }
};

// 登录API - 手机号验证码登录
export const loginPhoneAPI = async (params: { phone: string; code: string }) => {
  try {
    // 手机号验证码登录 - 假设使用相同的OAuth2端点
    const loginData = new URLSearchParams();
    loginData.append('grant_type', 'password');
    loginData.append('client_id', 'tenant');
    loginData.append('scope', 'server');
    loginData.append('state', '1829779435941711873');
    loginData.append('username', params.phone);
    loginData.append('password', params.code); // 假设验证码作为密码传递
    
    const response = await javaApiClient.post('/oauth2/token', loginData, {
      headers: {
        'Authorization': `Basic dGVuYW50OnRlbmFudA`
      }
    });
    
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '登录认证失败');
  }
};

// 获取当前用户信息API
export const getCurrentUserAPI = async (token: string) => {
  try {
    const response = await javaApiClient.get('/accuser/currentUser', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取用户信息失败');
  }
};

// 发送验证码API
export const sendVerificationCodeAPI = async (params: { phone: string }) => {
  try {
    const response = await javaApiClient.post('/send-code', params);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '发送验证码失败');
  }
};

// 登录用户 - 适配现有React代码
export const loginUser = async (formData: any): Promise<AuthResponse> => {
  try {
    // 调用登录API
    const loginResponse = await loginAPI({
      username: formData.username,
      password: formData.password
    });
    
    // 构建完整token
    const token = `${loginResponse.data.token_type} ${loginResponse.data.access_token}`;
    
    // 获取用户信息
    const userInfoResponse = await getCurrentUserAPI(loginResponse.data.access_token);
    
    return {
      success: true,
      message: '登录成功',
      data: {
        user: userInfoResponse.data.userInfo,
        token: token
      }
    };
  } catch (error: any) {
    throw new Error(error.message || '登录失败');
  }
};

// 手机号验证码登录/注册 - 适配现有React代码
export const registerWithPhone = async (phone: string, verifyCode: string): Promise<AuthResponse> => {
  try {
    // 调用手机号登录API
    const loginResponse = await loginPhoneAPI({
      phone: phone,
      code: verifyCode
    });
    
    // 构建完整token
    const token = `${loginResponse.data.token_type} ${loginResponse.data.access_token}`;
    
    // 获取用户信息
    const userInfoResponse = await getCurrentUserAPI(loginResponse.data.access_token);
    
    return {
      success: true,
      message: '登录成功',
      data: {
        user: userInfoResponse.data.userInfo,
        token: token
      }
    };
  } catch (error: any) {
    throw new Error(error.message || '登录失败');
  }
};

// 发送验证码 - 适配现有React代码
export const sendVerificationCode = async (phone: string): Promise<{ success: boolean; message: string; code?: string }> => {
  try {
    const response = await sendVerificationCodeAPI({ phone });
    return {
      success: true,
      message: '验证码已发送',
      code: response.data?.code
    };
  } catch (error: any) {
    throw new Error(error.message || '发送验证码失败');
  }
};

// 注册用户 - 适配现有React代码
export const registerUser = async (formData: RegisterFormData): Promise<AuthResponse> => {
  try {
    // 调用手机号登录API（注册和登录使用相同接口）
    const loginResponse = await loginPhoneAPI({
      phone: formData.phone,
      code: formData.verifyCode
    });
    
    // 构建完整token
    const token = `${loginResponse.data.token_type} ${loginResponse.data.access_token}`;
    
    // 获取用户信息
    const userInfoResponse = await getCurrentUserAPI(loginResponse.data.access_token);
    
    return {
      success: true,
      message: '注册成功',
      data: {
        user: userInfoResponse.data.userInfo,
        token: token
      }
    };
  } catch (error: any) {
    throw new Error(error.message || '注册失败');
  }
};

// 获取租户列表API
export const getTenantListAPI = async () => {
  try {
    const response = await javaApiClient.get('/accuser/tenant/list', {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取租户列表失败');
  }
};

// 切换租户API
export const switchTenantAPI = async (data: { tenantId: string }) => {
  try {
    const response = await javaApiClient.post('/accuser/switch/tenant', data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '切换租户失败');
  }
};

// 添加/编辑租户API
export const addOrEditTenantAPI = async (data: any) => {
  try {
    const url = data.id ? `/tenant/edit` : `/tenant/add`;
    const method = data.id ? 'PUT' : 'POST';
    
    const response = await javaApiClient({
      url,
      method,
      data,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '保存租户失败');
  }
};

// 添加授权API
export const addAuthorizationAPI = async (data: any) => {
  try {
    const response = await javaApiClient.post('/tenant/authorize', data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '添加授权失败');
  }
};

// 获取租户详情API
export const getTenantDetailAPI = async (tenantId: string) => {
  try {
    const response = await javaApiClient.get(`/tenant/detail/${tenantId}`, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取租户详情失败');
  }
};
