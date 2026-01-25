/**
 * 短信验证码服务 - 阿里云短信
 */

const Dysmsapi20170525 = require('@alicloud/dysmsapi20170525')
const OpenApi = require('@alicloud/openapi-client')
const Util = require('@alicloud/tea-util')

// 阿里云短信配置（从环境变量读取）
const SMS_CONFIG = {
  accessKeyId: process.env.ALIYUN_SMS_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET || '',
  signName: (process.env.ALIYUN_SMS_SIGN_NAME || '深圳市乌伯视界网络科技').trim(),
  templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE || 'SMS_498875086' // 登录模板（包含time变量）
}

console.log('📱 [SMS] 配置加载:', {
  accessKeyId: SMS_CONFIG.accessKeyId ? SMS_CONFIG.accessKeyId.substring(0, 8) + '...' : 'MISSING',
  signName: SMS_CONFIG.signName,
  signNameLength: SMS_CONFIG.signName.length,
  signNameHex: Buffer.from(SMS_CONFIG.signName).toString('hex'),
  templateCode: SMS_CONFIG.templateCode
})

const sendTemplateSms = async (phone, templateCode, templateParam) => {
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return { success: false, message: '手机号格式不正确' }
  }

  try {
    if (!SMS_CONFIG.accessKeyId || !SMS_CONFIG.accessKeySecret) {
      console.error('📱 [SMS] 阿里云短信配置缺失')
      return { success: false, message: '短信服务未配置' }
    }
    if (!templateCode) {
      return { success: false, message: '短信模板未配置' }
    }

    const client = createClient()
    const sendSmsRequest = new Dysmsapi20170525.SendSmsRequest({
      phoneNumbers: phone,
      signName: SMS_CONFIG.signName,
      templateCode,
      templateParam: JSON.stringify(templateParam || {})
    })

    const runtime = new Util.RuntimeOptions({})
    const response = await client.sendSmsWithOptions(sendSmsRequest, runtime)

    console.log(`📱 [SMS] 发送模板短信到 ${phone}, 响应:`, JSON.stringify(response.body))

    if (response.body.code === 'OK') {
      return { success: true, message: '发送成功' }
    }

    console.error(`📱 [SMS] 发送失败:`, response.body.message)
    return { success: false, message: response.body.message || '发送失败' }
  } catch (error) {
    console.error(`📱 [SMS] 发送异常:`, error)
    return { success: false, message: '短信发送失败，请稍后重试' }
  }
}

const sendNewOrderNotification = async (phone, payload) => {
  const templateCode = process.env.ALIYUN_SMS_NEW_ORDER_TEMPLATE_CODE || ''
  return sendTemplateSms(phone, templateCode, payload)
}

// 验证码存储（生产环境应使用Redis）
const verificationCodes = new Map()

// 验证码有效期（5分钟）
const CODE_EXPIRY = 5 * 60 * 1000

// 创建阿里云短信客户端
const createClient = () => {
  const config = new OpenApi.Config({
    accessKeyId: SMS_CONFIG.accessKeyId,
    accessKeySecret: SMS_CONFIG.accessKeySecret,
  })
  config.endpoint = 'dysmsapi.aliyuncs.com'
  return new Dysmsapi20170525.default(config)
}

/**
 * 生成6位随机验证码
 */
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * 发送短信验证码
 * @param {string} phone 手机号
 * @returns {Promise<{success: boolean, message: string}>}
 */
const sendVerificationCode = async (phone) => {
  // 验证手机号格式
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return { success: false, message: '手机号格式不正确' }
  }
  
  // 检查是否频繁发送（1分钟内只能发送一次）
  const existing = verificationCodes.get(phone)
  if (existing && Date.now() - existing.createdAt < 60000) {
    const remainingSeconds = Math.ceil((60000 - (Date.now() - existing.createdAt)) / 1000)
    return { success: false, message: `请${remainingSeconds}秒后再试` }
  }
  
  // 生成验证码
  const code = generateCode()
  
  try {
    // 检查配置
    if (!SMS_CONFIG.accessKeyId || !SMS_CONFIG.accessKeySecret) {
      console.error('📱 [SMS] 阿里云短信配置缺失')
      return { success: false, message: '短信服务未配置' }
    }
    
    // 创建阿里云短信客户端
    const client = createClient()
    
    // 构建请求
    const sendSmsRequest = new Dysmsapi20170525.SendSmsRequest({
      phoneNumbers: phone,
      signName: SMS_CONFIG.signName,
      templateCode: SMS_CONFIG.templateCode,
      templateParam: JSON.stringify({ code, time: '5' })
    })
    
    const runtime = new Util.RuntimeOptions({})
    
    // 发送短信
    const response = await client.sendSmsWithOptions(sendSmsRequest, runtime)
    
    console.log(`📱 [SMS] 发送验证码到 ${phone}, 响应:`, JSON.stringify(response.body))
    
    if (response.body.code === 'OK') {
      // 存储验证码
      verificationCodes.set(phone, {
        code,
        createdAt: Date.now()
      })
      
      // 设置过期清理
      setTimeout(() => {
        const stored = verificationCodes.get(phone)
        if (stored && stored.code === code) {
          verificationCodes.delete(phone)
        }
      }, CODE_EXPIRY)
      
      return { success: true, message: '验证码已发送' }
    } else {
      console.error(`📱 [SMS] 发送失败:`, response.body.message)
      return { success: false, message: response.body.message || '发送失败' }
    }
  } catch (error) {
    console.error(`📱 [SMS] 发送异常:`, error)
    return { success: false, message: '短信发送失败，请稍后重试' }
  }
}

/**
 * 验证短信验证码
 * @param {string} phone 手机号
 * @param {string} code 验证码
 * @returns {boolean}
 */
const verifyCode = (phone, code) => {
  const stored = verificationCodes.get(phone)
  
  if (!stored) {
    return false
  }
  
  // 检查是否过期
  if (Date.now() - stored.createdAt > CODE_EXPIRY) {
    verificationCodes.delete(phone)
    return false
  }
  
  // 验证码匹配
  if (stored.code === code) {
    verificationCodes.delete(phone) // 验证成功后删除
    return true
  }
  
  return false
}

module.exports = {
  sendVerificationCode,
  verifyCode,
  sendTemplateSms,
  sendNewOrderNotification
}
