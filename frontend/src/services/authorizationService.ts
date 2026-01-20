import apiClient from '@/lib/apiClient'

// 授权管理相关的API服务
export const authorizationService = {
  // 获取待审批的授权申请
  getPendingRequests: async () => {
    const response = await apiClient.get('/authorizations/pending-requests')
    return response.data
  },

  // 获取我授予的授权
  getMyGrants: async () => {
    const response = await apiClient.get('/authorizations/my-grants')
    return response.data
  },

  // 获取我收到的授权
  getReceivedAuthorizations: async () => {
    const response = await apiClient.get('/authorizations/received')
    return response.data
  },

  // 获取层级结构
  getTierHierarchy: async () => {
    const response = await apiClient.get('/authorizations/tier-hierarchy')
    return response.data
  },

  // 获取设计师待审批申请
  getDesignerPendingRequests: async () => {
    const response = await apiClient.get('/authorizations/designer-requests/pending')
    return response.data
  },

  // 获取厂家待审批申请
  getManufacturerPendingRequests: async () => {
    const response = await apiClient.get('/authorizations/manufacturer-requests/pending')
    return response.data
  },

  // 获取我的设计师申请
  getMyDesignerRequests: async () => {
    const response = await apiClient.get('/authorizations/designer-requests/my')
    return response.data
  },

  // 获取我的厂家申请
  getMyManufacturerRequests: async () => {
    const response = await apiClient.get('/authorizations/manufacturer-requests/my')
    return response.data
  },

  // 审批设计师申请
  approveDesignerRequest: async (requestId: string, data: any) => {
    const response = await apiClient.put(`/authorizations/designer-requests/${requestId}/approve`, data)
    return response.data
  },

  // 审批厂家申请
  approveManufacturerRequest: async (requestId: string, data: any) => {
    const response = await apiClient.put(`/authorizations/manufacturer-requests/${requestId}/approve`, data)
    return response.data
  },

  // 拒绝设计师申请
  rejectDesignerRequest: async (requestId: string) => {
    const response = await apiClient.put(`/authorizations/designer-requests/${requestId}/reject`, {})
    return response.data
  },

  // 拒绝厂家申请
  rejectManufacturerRequest: async (requestId: string) => {
    const response = await apiClient.put(`/authorizations/manufacturer-requests/${requestId}/reject`, {})
    return response.data
  },

  // 获取授权详情
  getAuthorizationDetail: async (authorizationId: string) => {
    const response = await apiClient.get(`/authorizations/${authorizationId}`)
    return response.data
  },

  // 获取授权产品列表
  getAuthorizationProducts: async (authorizationId: string) => {
    const response = await apiClient.get(`/authorizations/${authorizationId}/products`)
    return response.data
  },

  // 更新授权定价
  updateAuthorizationPricing: async (authorizationId: string, data: any) => {
    const response = await apiClient.put(`/authorizations/${authorizationId}/pricing`, data)
    return response.data
  },

  // 撤销授权
  revokeAuthorization: async (authorizationId: string) => {
    const response = await apiClient.delete(`/authorizations/${authorizationId}`)
    return response.data
  },

  // 切换授权启用状态
  toggleAuthorizationEnabled: async (authorizationId: string, enabled: boolean) => {
    const response = await apiClient.put(`/authorizations/${authorizationId}/toggle-enabled`, { enabled })
    return response.data
  },

  // 选择授权文件夹
  selectAuthorizationFolder: async (authorizationId: string, folderId: string, folderName: string) => {
    const response = await apiClient.put(`/authorizations/${authorizationId}/select-folder`, {
      folderId,
      folderName,
    })
    return response.data
  },

  // 获取授权摘要
  getAuthorizationSummary: async (params?: any) => {
    const response = await apiClient.get('/authorizations/summary', { params })
    return response.data
  },

  // 获取授权产品列表
  getAuthorizedProducts: async (params?: any) => {
    const response = await apiClient.get('/authorizations/products/authorized', { params })
    return response.data
  },

  // 获取授权产品覆盖
  getProductOverrides: async (params?: any) => {
    const response = await apiClient.get('/authorizations/product-overrides', { params })
    return response.data
  },

  // 更新授权产品覆盖
  updateProductOverride: async (productId: string, data: any) => {
    const response = await apiClient.put(`/authorizations/product-override/${productId}`, data)
    return response.data
  },

  // 获取设计师产品折扣
  getDesignerProductDiscount: async (authorizationId: string, productId: string) => {
    const response = await apiClient.get(`/authorizations/${authorizationId}/designer-product-discount/${productId}`)
    return response.data
  },

  // 获取增长统计
  getGrowthStats: async (params?: any) => {
    const response = await apiClient.get('/authorizations/growth-stats', { params })
    return response.data
  },

  // 获取GMV统计
  getGmvStats: async (params?: any) => {
    const response = await apiClient.get('/authorizations/gmv-stats', { params })
    return response.data
  },
}

export default authorizationService
