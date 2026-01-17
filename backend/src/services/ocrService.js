/**
 * OCR服务 - 营业执照识别
 * 使用阿里云文字识别API
 */

const https = require('https')
const crypto = require('crypto')

// 阿里云OCR配置（复用SMS的AccessKey）
const ACCESS_KEY_ID = process.env.ALIYUN_SMS_ACCESS_KEY_ID || process.env.ALIYUN_ACCESS_KEY_ID
const ACCESS_KEY_SECRET = process.env.ALIYUN_SMS_ACCESS_KEY_SECRET || process.env.ALIYUN_ACCESS_KEY_SECRET

/**
 * 生成阿里云API签名
 */
function generateSignature(method, params, accessKeySecret) {
  const sortedParams = Object.keys(params).sort().map(key => {
    return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
  }).join('&')
  
  const stringToSign = `${method}&${encodeURIComponent('/')}&${encodeURIComponent(sortedParams)}`
  const hmac = crypto.createHmac('sha1', accessKeySecret + '&')
  hmac.update(stringToSign)
  return hmac.digest('base64')
}

/**
 * 识别营业执照
 * @param {string} imageUrl - 图片URL
 * @returns {Promise<Object>} - 识别结果
 */
async function recognizeBusinessLicense(imageUrl) {
  if (!ACCESS_KEY_ID || !ACCESS_KEY_SECRET) {
    console.warn('OCR Service: 阿里云AccessKey未配置，使用模拟数据')
    // 返回模拟数据用于测试
    return {
      success: true,
      data: {
        companyName: '',
        creditCode: '',
        legalPerson: '',
        address: '',
        registeredCapital: '',
        businessScope: '',
        establishDate: '',
        validPeriod: ''
      },
      message: 'OCR服务未配置，请手动填写'
    }
  }

  try {
    // 阿里云OCR API参数
    const timestamp = new Date().toISOString().replace(/\.\d{3}/, '')
    const nonce = Math.random().toString(36).substring(2, 15)
    
    const params = {
      AccessKeyId: ACCESS_KEY_ID,
      Action: 'RecognizeBusinessLicense',
      Format: 'JSON',
      ImageURL: imageUrl,
      RegionId: 'cn-shanghai',
      SignatureMethod: 'HMAC-SHA1',
      SignatureNonce: nonce,
      SignatureVersion: '1.0',
      Timestamp: timestamp,
      Version: '2019-12-30'
    }
    
    params.Signature = generateSignature('GET', params, ACCESS_KEY_SECRET)
    
    const queryString = Object.keys(params).map(key => {
      return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
    }).join('&')
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'ocr-api.cn-hangzhou.aliyuncs.com',
        path: `/?${queryString}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
      
      const req = https.request(options, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          try {
            const result = JSON.parse(data)
            if (result.Data) {
              resolve({
                success: true,
                data: {
                  companyName: result.Data.Name || '',
                  creditCode: result.Data.RegisterNumber || '',
                  legalPerson: result.Data.LegalPerson || '',
                  address: result.Data.Address || '',
                  registeredCapital: result.Data.Capital || '',
                  businessScope: result.Data.Business || '',
                  establishDate: result.Data.EstablishDate || '',
                  validPeriod: result.Data.ValidPeriod || ''
                }
              })
            } else {
              resolve({
                success: false,
                message: result.Message || '识别失败',
                data: {}
              })
            }
          } catch (e) {
            resolve({
              success: false,
              message: '解析响应失败',
              data: {}
            })
          }
        })
      })
      
      req.on('error', (e) => {
        resolve({
          success: false,
          message: e.message,
          data: {}
        })
      })
      
      req.end()
    })
  } catch (error) {
    console.error('OCR识别失败:', error)
    return {
      success: false,
      message: error.message,
      data: {}
    }
  }
}

/**
 * 简单的本地OCR模拟（用于开发测试）
 * 实际生产环境应使用阿里云OCR API
 */
async function mockRecognizeBusinessLicense(imageUrl) {
  // 模拟处理延迟
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return {
    success: true,
    data: {
      companyName: '',
      creditCode: '',
      legalPerson: '',
      address: '',
      registeredCapital: '',
      businessScope: '',
      establishDate: '',
      validPeriod: ''
    },
    message: '请手动填写营业执照信息'
  }
}

module.exports = {
  recognizeBusinessLicense,
  mockRecognizeBusinessLicense
}
