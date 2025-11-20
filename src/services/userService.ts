import apiClient from '@/lib/apiClient'
import type { User } from '@/types'

export interface UserListResponse {
  success: boolean
  data: User[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const fetchUsers = async (params: Record<string, any> = {}): Promise<UserListResponse> => {
  const { data } = await apiClient.get<UserListResponse>('/api/users', { params })
  return data
}

export const updateUserProfile = async (userId: string, payload: Partial<User>) => {
  const { data } = await apiClient.put(`/api/users/${userId}`, payload)
  return data
}
