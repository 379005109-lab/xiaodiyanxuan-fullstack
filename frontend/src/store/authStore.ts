import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
  updateUserRole: (role: User['role']) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (user, token) => {
        // 同时保存token到localStorage，确保其他组件可以读取
        localStorage.setItem('token', token)
        set({ user, token, isAuthenticated: true })
      },
      
      logout: () => {
        // 清除localStorage中的token
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false })
      },
      
      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null
        }))
      },
      
      updateUserRole: (role) => {
        set((state) => ({
          user: state.user ? { ...state.user, role } : null
        }))
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)

