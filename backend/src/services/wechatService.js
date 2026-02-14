/**
 * 微信小程序服务 - access_token 管理 & 小程序码生成
 */
const axios = require('axios')
const FileService = require('./fileService')

const APPID = process.env.WECHAT_APPID || process.env.WX_APPID || ''
const SECRET = process.env.WECHAT_APPSECRET || process.env.WX_SECRET || ''

// 内存缓存 access_token（有效期 2 小时，提前 5 分钟刷新）
let tokenCache = { token: '', expiresAt: 0 }

/**
 * 获取微信小程序 access_token（带缓存）
 */
async function getAccessToken() {
  if (!APPID || !SECRET) {
    throw new Error('未配置 WECHAT_APPID / WECHAT_APPSECRET')
  }

  const now = Date.now()
  if (tokenCache.token && tokenCache.expiresAt > now) {
    return tokenCache.token
  }

  console.log('[WeChat] 获取新的 access_token ...')
  const res = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
    params: {
      grant_type: 'client_credential',
      appid: APPID,
      secret: SECRET
    },
    timeout: 10000
  })

  if (res.data.errcode) {
    throw new Error(`获取 access_token 失败: ${res.data.errcode} ${res.data.errmsg}`)
  }

  tokenCache = {
    token: res.data.access_token,
    expiresAt: now + (res.data.expires_in - 300) * 1000 // 提前 5 分钟过期
  }

  console.log('[WeChat] access_token 获取成功，有效期:', res.data.expires_in, '秒')
  return tokenCache.token
}

/**
 * 生成小程序码（wxacode.getUnlimited）
 * @param {string} scene - 场景值，最多 32 字符
 * @param {string} page  - 小程序页面路径（不能带参数）
 * @param {object} options - 可选参数
 * @returns {Promise<Buffer>} - 图片 Buffer (PNG)
 */
async function generateMiniappQRCode(scene = '', page = 'pages/index/index', options = {}) {
  const accessToken = await getAccessToken()

  const body = {
    scene: scene || 'default',
    page: page,
    width: options.width || 430,
    auto_color: false,
    line_color: options.lineColor || { r: 0, g: 0, b: 0 },
    is_hyaline: options.isHyaline || false
  }

  console.log('[WeChat] 生成小程序码, scene:', scene, 'page:', page)

  const res = await axios.post(
    `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`,
    body,
    {
      responseType: 'arraybuffer',
      timeout: 15000
    }
  )

  // 微信返回的如果是 JSON 就是错误
  const contentType = res.headers['content-type'] || ''
  if (contentType.includes('application/json') || contentType.includes('text/plain')) {
    const errData = JSON.parse(Buffer.from(res.data).toString())
    throw new Error(`生成小程序码失败: ${errData.errcode} ${errData.errmsg}`)
  }

  return Buffer.from(res.data)
}

/**
 * 生成小程序码并保存到 GridFS
 * @param {string} scene - 场景值
 * @param {string} page  - 页面路径
 * @param {object} options - 可选参数
 * @returns {Promise<object>} - { fileId, url }
 */
async function generateAndSaveQRCode(scene = '', page = 'pages/index/index', options = {}) {
  const buffer = await generateMiniappQRCode(scene, page, options)

  const filename = `wxacode_${Date.now()}.png`
  const result = await FileService.uploadToGridFS(buffer, filename, 'image/png', {
    type: 'wxacode',
    scene: scene,
    page: page
  })

  console.log('[WeChat] 小程序码已保存, fileId:', result.fileId)
  return {
    fileId: result.fileId,
    url: `/api/files/${result.fileId}`
  }
}

module.exports = {
  getAccessToken,
  generateMiniappQRCode,
  generateAndSaveQRCode
}
