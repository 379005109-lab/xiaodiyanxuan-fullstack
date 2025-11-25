import { create } from 'zustand'

interface AuthModalState {
  isOpen: boolean
  mode: 'login' | 'register'
  openLogin: () => void
  openRegister: () => void
  close: () => void
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  mode: 'login',
  
  openLogin: () => set({ isOpen: true, mode: 'login' }),
  openRegister: () => set({ isOpen: true, mode: 'register' }),
  close: () => set({ isOpen: false }),
}))
