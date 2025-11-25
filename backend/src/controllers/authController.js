const { successResponse, errorResponse } = require('../utils/response')
const { wxLogin, usernamePasswordLogin, refreshToken, registerWithPhone } = require('../services/authService')
const { sendVerificationCode, verifyCode } = require('../services/smsService')

const login = async (req, res) => {
  try {
    const { code, username, password } = req.body
    
    // 用户名/密码登录
    if (username && password) {
      const result = await usernamePasswordLogin(username, password)
      return res.json(successResponse(result))
    }
    
    // 微信登录
    if (code) {
      const result = await wxLogin(code)
      return res.json(successResponse(result))
    }
    
    // 都没有提供
    return res.status(400).json(errorResponse('Username/password or code is required', 400))
  } catch (err) {
    console.error('Login error:', err)
    res.status(401).json(errorResponse(err.message, 401))
  }
}

// 发送短信验证码
const sendCode = async (req, res) => {
  try {
    const { phone } = req.body
    
    if (!phone) {
      return res.status(400).json(errorResponse('手机号不能为空', 400))
    }
    
    const result = await sendVerificationCode(phone)
    
    if (result.success) {
      // 开发环境返回验证码（方便测试）
      const response = { message: result.message }
      if (result.code) {
        response.code = result.code
      }
      return res.json(successResponse(response))
    } else {
      return res.status(400).json(errorResponse(result.message, 400))
    }
  } catch (err) {
    console.error('Send code error:', err)
    res.status(500).json(errorResponse('发送验证码失败', 500))
  }
}

// 手机号注册
const register = async (req, res) => {
  try {
    const { phone, password, verifyCode: code } = req.body
    
    if (!phone || !password || !code) {
      return res.status(400).json(errorResponse('请填写完整信息', 400))
    }
    
    // 验证短信验证码
    const isValid = verifyCode(phone, code)
    if (!isValid) {
      return res.status(400).json(errorResponse('验证码无效或已过期', 400))
    }
    
    // 注册用户
    const result = await registerWithPhone(phone, password)
    return res.json(successResponse(result))
  } catch (err) {
    console.error('Register error:', err)
    res.status(400).json(errorResponse(err.message, 400))
  }
}

const refresh = async (req, res) => {
  try {
    const result = await refreshToken(req.userId)
    res.json(successResponse(result))
  } catch (err) {
    console.error('Refresh token error:', err)
    res.status(401).json(errorResponse(err.message, 401))
  }
}

const logout = (req, res) => {
  res.json(successResponse(null, 'Logged out successfully'))
}

module.exports = {
  login,
  sendCode,
  register,
  refresh,
  logout
}
