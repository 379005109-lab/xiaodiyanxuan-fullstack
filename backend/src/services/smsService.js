/**
 * 短信验证码服务
 * 
 * 目前使用模拟实现，实际使用时需要接入短信服务商：
 * - 阿里云短信
 * - 腾讯云短信
 * - 其他服务商
 */

// 验证码存储（生产环境应使用Redis）
const verificationCodes = new Map()

// 验证码有效期（5分钟）
const CODE_EXPIRY = 5 * 60 * 1000

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
    return { success: false, message: '请求过于频繁，请稍后再试' }
  }
  
  // 生成验证码
  const code = generateCode()
  
  // TODO: 接入实际短信服务
  // 以下是阿里云短信示例代码：
  /*
  const Core = require('@alicloud/pop-core')
  const client = new Core({
    accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
    endpoint: 'https://dysmsapi.aliyuncs.com',
    apiVersion: '2017-05-25'
  })
  
  const params = {
    PhoneNumbers: phone,
    SignName: '小迪严选',
    TemplateCode: 'SMS_XXXXXXXX',
    TemplateParam: JSON.stringify({ code })
  }
  
  await client.request('SendSms', params, { method: 'POST' })
  */
  
  // 模拟发送（开发环境）
  console.log(`📱 [SMS] 发送验证码到 ${phone}: ${code}`)
  
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
  
  return { success: true, message: '验证码已发送', code: process.env.NODE_ENV === 'development' ? code : undefined }
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
  verifyCode
}
