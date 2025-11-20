const { successResponse, errorResponse } = require('../utils/response')
const { wxLogin, usernamePasswordLogin, refreshToken } = require('../services/authService')

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
  refresh,
  logout
}
