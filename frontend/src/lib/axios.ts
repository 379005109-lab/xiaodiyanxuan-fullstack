import axios, { AxiosInstance, AxiosError } from 'axios'

// 防止多次401重定向（使用sessionStorage持久化）
const REDIRECT_KEY = 'auth_redirecting';
const isRedirecting = () => sessionStorage.getItem(REDIRECT_KEY) === 'true';
const setRedirecting = (val: boolean) => {
  if (val) {
    sessionStorage.setItem(REDIRECT_KEY, 'true');
    setTimeout(() => sessionStorage.removeItem(REDIRECT_KEY), 5000);
  } else {
    sessionStorage.removeItem(REDIRECT_KEY);
  }
};

// 多个可用的API地址（按优先级排序）
const API_URLS = [
  'https://pkochbpmcgaa.sealoshzh.site/api', // 后端API地址
  'https://lgpzubdtdxjf.sealoshzh.site/api', // 前端代理地址
  'https://xiaodiyanxuan.com/api',            // 备用域名
  '/api'                                       // 相对路径（最后降级）
]

// 从localStorage获取上次成功的API地址
const getLastSuccessfulAPI = (): string => {
  return localStorage.getItem('api_base_url') || API_URLS[0]
}

// 保存成功的API地址
const saveSuccessfulAPI = (url: string) => {
  localStorage.setItem('api_base_url', url)
  console.log('✅ API地址已保存:', url)
}

// 创建axios实例
const createAPIInstance = (baseURL: string): AxiosInstance => {
  return axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

// 当前使用的API实例
let currentAPI = createAPIInstance(getLastSuccessfulAPI())
let currentAPIIndex = API_URLS.indexOf(getLastSuccessfulAPI())
if (currentAPIIndex === -1) currentAPIIndex = 0

console.log('🌐 初始API地址:', API_URLS[currentAPIIndex])

// 切换到下一个API地址
const switchToNextAPI = (): boolean => {
  currentAPIIndex++
  if (currentAPIIndex >= API_URLS.length) {
    currentAPIIndex = 0 // 回到第一个
    return false // 所有API都尝试过了
  }
  
  const newURL = API_URLS[currentAPIIndex]
  console.log('🔄 切换API地址:', newURL)
  currentAPI = createAPIInstance(newURL)
  setupInterceptors(currentAPI)
  return true
}

// 设置拦截器
const setupInterceptors = (instance: AxiosInstance) => {
  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  instance.interceptors.response.use(
    (response) => {
      // 请求成功，保存当前API地址
      const baseURL = instance.defaults.baseURL
      if (baseURL) {
        saveSuccessfulAPI(baseURL)
      }
      return response.data
    },
    async (error: AxiosError) => {
      // 处理401错误，防止重复重定向
      if (error.response?.status === 401 && !isRedirecting()) {
        setRedirecting(true);
        localStorage.removeItem('token')
        setTimeout(() => {
          window.location.href = '/'
        }, 100)
        return Promise.reject(error)
      }
      
      // 如果是网络错误或502/503/504错误，尝试切换API
      const shouldSwitch = 
        !error.response || 
        error.response.status === 502 || 
        error.response.status === 503 || 
        error.response.status === 504 ||
        error.code === 'ERR_NETWORK'
      
      if (shouldSwitch) {
        console.warn('⚠️ API请求失败，尝试切换域名', error.message)
        
        // 尝试切换到下一个API
        if (switchToNextAPI()) {
          console.log('🔄 重试请求...')
          // 使用新的API实例重试请求
          if (error.config) {
            try {
              const response = await currentAPI.request(error.config)
              return response
            } catch (retryError) {
              console.error('❌ 重试也失败了', retryError)
            }
          }
        } else {
          console.error('❌ 所有API地址都失败了')
        }
      }
      
      return Promise.reject(error)
    }
  )
}

// 初始化拦截器
setupInterceptors(currentAPI)

// 导出API实例
const api = new Proxy(currentAPI, {
  get(target, prop) {
    return currentAPI[prop as keyof AxiosInstance]
  }
})

export default api

