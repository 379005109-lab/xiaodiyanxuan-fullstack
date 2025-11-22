import apiClient from '@/lib/apiClient'

/**
 * 上传文件到云端存储
 * @param file 要上传的文件
 * @returns 包含文件 ID 的响应
 */
export const uploadFile = async (file: File) => {
  try {
    console.log(`📤 开始上传文件: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`)
    console.log(`📍 API 端点: /files/upload`)
    
    const formData = new FormData()
    formData.append('file', file)

    console.log(`🔗 完整请求 URL 将是: ${apiClient.defaults.baseURL}/files/upload`)
    
    const response = await apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    console.log(`✅ 文件上传成功:`, response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ 文件上传失败:')
    console.error('错误信息:', error.message)
    console.error('错误详情:', error.response?.data || error)
    console.error('请求 URL:', error.config?.url)
    console.error('请求方法:', error.config?.method)
    throw error
  }
}

/**
 * 获取文件 URL
 * @param fileId 文件 ID
 * @returns 文件 URL
 */
export const getFileUrl = (fileId: string): string => {
  // 如果fileId已经是完整URL，直接返回
  if (fileId.startsWith('http') || fileId.startsWith('/api/')) {
    return fileId
  }
  // 如果是base64数据，直接返回
  if (fileId.startsWith('data:')) {
    return fileId
  }
  // 否则构造正确的API路径
  return `/api/files/${fileId}`
}

/**
 * 下载文件
 * @param fileId 文件 ID
 * @returns 文件 Blob
 */
export const downloadFile = async (fileId: string) => {
  try {
    const response = await apiClient.get(`/files/${fileId}`, {
      responseType: 'blob'
    })
    return response.data
  } catch (error: any) {
    console.error('文件下载失败:', error)
    throw error
  }
}

/**
 * 获取文件信息
 * @param fileId 文件 ID
 * @returns 文件信息
 */
export const getFileInfo = async (fileId: string) => {
  try {
    const response = await apiClient.get(`/upload/info/${fileId}`)
    return response.data
  } catch (error: any) {
    console.error('获取文件信息失败:', error)
    throw error
  }
}

/**
 * 删除文件
 * @param fileId 文件 ID
 * @returns 删除结果
 */
export const deleteFile = async (fileId: string) => {
  try {
    const response = await apiClient.delete(`/upload/${fileId}`)
    return response.data
  } catch (error: any) {
    console.error('文件删除失败:', error)
    throw error
  }
}

