/**
 * 小程序多语言工具
 * 支持：中文(zh)、英语(en)、泰语(th)、越南语(vi)、印尼语(id)、马来语(ms)、菲律宾语(tl)
 */

// 导入各语言包
import zh from './locales/zh'
import en from './locales/en'
import th from './locales/th'
import vi from './locales/vi'
import id from './locales/id'
import ms from './locales/ms'
import tl from './locales/tl'

// 语言映射
const locales = { zh, en, th, vi, id, ms, tl }

// 语言列表（用于切换界面展示）
export const languages = [
  { code: 'zh', name: '中文', nativeName: '中文' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino' }
]

// 当前语言
let currentLang = 'zh'

/**
 * 初始化语言
 * @returns {string} 当前语言代码
 */
export function initLanguage() {
  // 优先从本地存储读取
  const storedLang = wx.getStorageSync('app_language')
  if (storedLang && locales[storedLang]) {
    currentLang = storedLang
    return currentLang
  }
  
  // 尝试获取系统语言
  try {
    const systemInfo = wx.getSystemInfoSync()
    const sysLang = systemInfo.language || 'zh_CN'
    
    // 映射系统语言到应用语言
    const langMap = {
      'zh_CN': 'zh', 'zh_TW': 'zh', 'zh_HK': 'zh',
      'en': 'en', 'en_US': 'en', 'en_GB': 'en',
      'th': 'th', 'th_TH': 'th',
      'vi': 'vi', 'vi_VN': 'vi',
      'id': 'id', 'id_ID': 'id',
      'ms': 'ms', 'ms_MY': 'ms',
      'fil': 'tl', 'tl': 'tl'
    }
    
    currentLang = langMap[sysLang] || 'zh'
  } catch (e) {
    currentLang = 'zh'
  }
  
  wx.setStorageSync('app_language', currentLang)
  return currentLang
}

/**
 * 获取当前语言
 * @returns {string} 当前语言代码
 */
export function getLanguage() {
  return currentLang
}

/**
 * 设置语言
 * @param {string} lang 语言代码
 * @returns {boolean} 是否成功
 */
export function setLanguage(lang) {
  if (!locales[lang]) {
    console.warn(`Language "${lang}" not supported`)
    return false
  }
  
  currentLang = lang
  wx.setStorageSync('app_language', lang)
  
  // 触发全局事件通知页面更新
  const app = getApp()
  if (app && app.globalData) {
    app.globalData.language = lang
  }
  
  return true
}

/**
 * 翻译函数
 * @param {string} key 翻译键，支持点号分隔，如 'home.title'
 * @param {object} params 插值参数，如 {count: 5}
 * @returns {string} 翻译后的文本
 */
export function t(key, params = {}) {
  const locale = locales[currentLang] || locales.zh
  
  // 支持点号分隔的键
  const keys = key.split('.')
  let value = locale
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      // 回退到中文
      value = locales.zh
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey]
        } else {
          return key // 找不到则返回原始key
        }
      }
      break
    }
  }
  
  if (typeof value !== 'string') {
    return key
  }
  
  // 处理插值 {{param}}
  return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
    return params[paramKey] !== undefined ? params[paramKey] : match
  })
}

/**
 * 获取当前语言的完整翻译对象（用于页面setData）
 * @returns {object} 翻译对象
 */
export function getLocale() {
  return locales[currentLang] || locales.zh
}

// 默认导出
export default {
  initLanguage,
  getLanguage,
  setLanguage,
  t,
  getLocale,
  languages
}
