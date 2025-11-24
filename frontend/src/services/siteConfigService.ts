import apiClient from '@/lib/apiClient'

export interface SiteConfig {
  [key: string]: any
}

// 获取所有网站配置
export const getAllSiteConfigs = async (): Promise<SiteConfig> => {
  const response = await apiClient.get('/site-config')
  return response.data.data
}

// 获取单个配置
export const getSiteConfig = async (key: string): Promise<any> => {
  const response = await apiClient.get(`/site-config/${key}`)
  return response.data.data
}

// 更新单个配置
export const updateSiteConfig = async (key: string, value: any, type: string = 'text', label?: string, description?: string) => {
  const response = await apiClient.put(`/site-config/${key}`, { value, type, label, description })
  return response.data
}

// 批量更新配置
export const batchUpdateSiteConfigs = async (configs: Record<string, any>) => {
  const response = await apiClient.post('/site-config/batch', { configs })
  return response.data
}
