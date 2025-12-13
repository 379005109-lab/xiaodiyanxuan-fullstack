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
      gender: user.gender,
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
  // 查找用户（支持用户名或手机号）
  const user = await User.findOne({ 
    $or: [
      { username },
      { phone: username }
    ]
  })
  
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
      nickname: user.nickname,
      avatar: user.avatar,
      gender: user.gender,
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
      nickname: user.nickname,
      avatar: user.avatar,
      gender: user.gender,
      role: user.userType,
      userType: user.userType
    }
  }
}

/**
 * 手机号登录/注册（验证码验证后调用）
 * 如果用户存在则登录，不存在则自动注册
 * @param {string} phone 手机号
 */
const loginOrRegisterWithPhone = async (phone) => {
  // 查找用户
  let user = await User.findOne({ 
    $or: [
      { phone },
      { username: phone }
    ]
  })
  
  // 如果用户不存在，自动注册
  if (!user) {
    // 加密密码（使用手机号作为默认密码）
    const hashedPassword = await bcryptjs.hash(phone, 10)
    
    user = await User.create({
      phone,
      username: phone,
      password: hashedPassword,
      role: 'customer',
      userType: 'customer',
      status: 'active'
    })
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
      phone: user.phone,
      username: user.username,
      nickname: user.nickname || user.username,
      avatar: user.avatar,
      role: user.role || user.userType || 'customer',
      userType: user.role || user.userType || 'customer'
    }
  }
}

/**
 * 手机号注册（旧接口，保留兼容）
 */
const registerWithPhone = async (phone, password) => {
  return loginOrRegisterWithPhone(phone)
}

module.exports = {
  generateToken,
  wxLogin,
  usernamePasswordLogin,
  registerWithPhone,
  verifyToken,
  refreshToken
}
