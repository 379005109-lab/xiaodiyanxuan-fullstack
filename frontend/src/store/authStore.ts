import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'
import { getCurrentUserAPI, getTenantListAPI, switchTenantAPI } from '@/services/authService'

interface Tenant {
  id: string
  name: string
  [key: string]: any
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loginLoading: boolean
  menuList: any[]
  permissionList: any[]
  tenantList: Tenant[]
  currentTenant: Tenant | null
  firstRouter: any
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
  updateUserRole: (role: User['role']) => void
  setLoginLoading: (status: boolean) => void
  updateToken: (token: string) => void
  getUserInfo: () => Promise<any[]>
  getTenantList: () => Promise<void>
  switchTenant: (tenantId: string) => Promise<void>
  setCurrentTenant: (tenant: Tenant) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: localStorage.getItem('token') || null,
      isAuthenticated: !!localStorage.getItem('token'),
      loginLoading: false,
      menuList: [],
      permissionList: [],
      tenantList: [],
      currentTenant: null,
      firstRouter: null,
      
      login: (user, token) => {
        // 统一 token 存储格式，与 Vue 项目保持一致
        // token 格式应为 "Bearer xxx"
        const tokenValue = token.startsWith('Bearer ') ? token : `Bearer ${token}`
        localStorage.setItem('token', tokenValue)
        // 同时保存 access_token（不带 Bearer 前缀），供 API 客户端使用
        const accessToken = token.replace('Bearer ', '')
        localStorage.setItem('access_token', accessToken)
        set({ user, token: tokenValue, isAuthenticated: true, loginLoading: false })
        // 登录后获取租户列表
        get().getTenantList()
      },
      
      logout: () => {
        // 清除所有认证相关的 localStorage
        localStorage.removeItem('token')
        localStorage.removeItem('access_token')
        localStorage.removeItem('admin_redirect_completed')
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false, 
          menuList: [], 
          permissionList: [],
          tenantList: [],
          currentTenant: null,
          firstRouter: null
        })
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
      
      setLoginLoading: (status) => {
        set({ loginLoading: status })
      },
      
      updateToken: (token) => {
        localStorage.setItem('token', token)
        set({ token })
      },
      
      getUserInfo: async (tokenOverride?: string) => {
        const { token, user: currentUser } = get()
        const currentToken = tokenOverride || token
        if (!currentToken) return []
        
        try {
          set({ loginLoading: true })
          // 从token中提取access_token
          const accessToken = currentToken.replace('Bearer ', '')
          const userInfoResponse = await getCurrentUserAPI(accessToken)
          
          const { data } = userInfoResponse
          if (!data) {
            throw new Error('验证失败，请重新登录。')
          }
          
          console.log('后端返回的权限数据:', data)
          
          if (!data.menuList || data.menuList.length === 0) {
            console.warn('后端返回的menuList为空，使用默认菜单')
            // 不抛出错误，而是使用空数组，这样会触发默认菜单
            set({ 
              menuList: [],
              permissionList: data.permissionList || [],
              firstRouter: null,
              loginLoading: false
            })
            return []
          }
          
          const routerList: any[] = []
          
          // 移动函数声明到函数体根级
          const setData = (list: any[]) => {
            for (let i = 0; i < list.length; i++) {
              const e = list[i]
              // 权限标识，当路由name
              const name = e.permission.replace(/\./g, '-')
              e.vueName = name
              if (e.type === '0') {
                e.path = '/' + e.permission
                if (e.hasChildren && e.children.length) {
                  setData(e.children)
                }
              }
              if (e.type === '1') {
                e.path = '/' + e.path
                const newObj = {
                  path: e.path,
                  name: name,
                  meta: {
                    title: name,
                    icon: e.icon,
                    zhTitle: e.name,
                    modelId: e.id
                  }
                }
                routerList.push(newObj)
              }
            }
          }
          
          setData(data.menuList)
          console.log('处理后的菜单数据:', data.menuList)
          console.log('生成的路由列表:', routerList)
          
          // 只有当用户信息真正改变时才更新，避免不必要的重渲染
          const userChanged = JSON.stringify(currentUser) !== JSON.stringify(data.userInfo)
          
          set({ 
            ...(userChanged && { user: data.userInfo }),
            menuList: data.menuList,
            permissionList: data.permissionList || [],
            firstRouter: routerList[0],
            loginLoading: false
          })
          
          return routerList
        } catch (error) {
          console.error('获取用户信息失败:', error)
          set({ loginLoading: false })
          // 发生错误时使用空菜单列表
          set({ menuList: [] })
          throw error
        }
      },
      
      getTenantList: async () => {
        try {
          const tenantListResponse = await getTenantListAPI()
          const tenantList = tenantListResponse.data || []
          set({ tenantList })
          // 如果有租户列表且当前租户为空，设置第一个租户为当前租户
          if (tenantList.length > 0 && !get().currentTenant) {
            set({ currentTenant: tenantList[0] })
          }
        } catch (error) {
          console.error('获取租户列表失败:', error)
        }
      },
      
      switchTenant: async (tenantId) => {
        try {
          set({ loginLoading: true })
          await switchTenantAPI({ tenantId })
          // 切换租户后重新获取用户信息
          await get().getUserInfo()
          // 更新当前租户
          const tenantList = get().tenantList
          const currentTenant = tenantList.find(tenant => tenant.id === tenantId) || null
          set({ currentTenant })
          set({ loginLoading: false })
        } catch (error) {
          console.error('切换租户失败:', error)
          set({ loginLoading: false })
        }
      },
      
      setCurrentTenant: (tenant) => {
        set({ currentTenant: tenant })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        menuList: state.menuList,
        permissionList: state.permissionList,
        tenantList: state.tenantList,
        currentTenant: state.currentTenant,
        firstRouter: state.firstRouter
      })
    }
  )
)

