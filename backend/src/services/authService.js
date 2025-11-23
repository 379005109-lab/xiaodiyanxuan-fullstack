const jwt = require('jsonwebtoken')
const bcryptjs = require('bcryptjs')
const User = require('../models/User')
const { AuthenticationError } = require('../utils/errors')

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  )
}

const wxLogin = async (code) => {
  // In production, verify code with WeChat API
  // For now, we'll use a mock implementation
  
  // Mock: extract openId from code (in real implementation, call WeChat API)
  const openId = `openid_${code}`
  
  let user = await User.findOne({ openId })
  
  if (!user) {
    user = await User.create({
      openId,
      nickname: `User_${code.substring(0, 8)}`,
      userType: 'customer'
    })
  }
  
  user.lastLoginAt = new Date()
  await user.save()
  
  const token = generateToken(user._id)
  
  return {
    token,
    user: {
      id: user._id,
      openId: user.openId,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.userType,
      userType: user.userType
    }
  }
}

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (err) {
    throw new AuthenticationError('Invalid token')
  }
}

const refreshToken = async (userId) => {
  const user = await User.findById(userId)
  if (!user) {
    throw new AuthenticationError('User not found')
  }
  
  const token = generateToken(user._id)
  return { token }
}

const usernamePasswordLogin = async (username, password) => {
  // 查找用户
  const user = await User.findOne({ username })
  
  if (!user) {
    throw new AuthenticationError('用户不存在')
  }
  
  // 验证密码（使用 bcrypt）
  const isPasswordValid = await bcryptjs.compare(password, user.password)
  if (!isPasswordValid) {
    throw new AuthenticationError('密码错误')
  }
  
  // 更新最后登录时间
  user.lastLoginAt = new Date()
  await user.save()
  
  // 生成 token
  const token = generateToken(user._id)
  
  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      avatar: user.avatar,
      role: user.role || user.userType || 'customer',
      userType: user.role || user.userType || 'customer'
    }
  }
}

const adminLogin = async (username, password) => {
  // 查找用户
  const user = await User.findOne({ username })
  
  if (!user) {
    throw new AuthenticationError('用户不存在')
  }
  
  // 验证密码（使用 bcrypt）
  const isPasswordValid = await bcryptjs.compare(password, user.password)
  if (!isPasswordValid) {
    throw new AuthenticationError('密码错误')
  }
  
  // 更新最后登录时间
  user.lastLoginAt = new Date()
  await user.save()
  
  // 生成 token
  const token = generateToken(user._id)
  
  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      avatar: user.avatar,
      role: user.userType,
      userType: user.userType
    }
  }
}

module.exports = {
  generateToken,
  wxLogin,
  usernamePasswordLogin,
  verifyToken,
  refreshToken
}
