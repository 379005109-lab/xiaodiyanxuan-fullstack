const jwt = require('jsonwebtoken')
const bcryptjs = require('bcryptjs')
const User = require('../models/User')
const Manufacturer = require('../models/Manufacturer')
const { AuthenticationError } = require('../utils/errors')

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  )
}

const ensureProfileCompleted = async (user) => {
  if (!user || user.profileCompleted) return user

  const hasNickname = user.nickname && user.nickname.trim() !== ''
  const hasGender = user.gender && ['male', 'female'].includes(user.gender)

  if (hasNickname && hasGender) {
    user.profileCompleted = true
    if (!user.profileCompletedAt) user.profileCompletedAt = new Date()
  }

  return user
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

  await assertManufacturerNotExpired(user)
  
  user.lastLoginAt = new Date()
  await ensureProfileCompleted(user)
  await user.save()
  
  const token = generateToken(user._id)
  
  return {
    token,
    user: {
      id: user._id,
      _id: user._id,
      openId: user.openId,
      nickname: user.nickname,
      avatar: user.avatar,
      gender: user.gender,
      profileCompleted: user.profileCompleted,
      manufacturerId: user.manufacturerId || null,
      manufacturerIds: user.manufacturerIds || [],
      permissions: user.permissions || {},
      accountType: user.accountType,
      status: user.status,
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

const assertManufacturerNotExpired = async (user) => {
  if (!user) return
  if (user.role === 'super_admin' || user.role === 'admin' || user.role === 'platform_admin') return

  const mids = []
  if (user.manufacturerId) mids.push(String(user.manufacturerId))
  if (Array.isArray(user.manufacturerIds) && user.manufacturerIds.length) {
    for (const id of user.manufacturerIds) {
      const s = String(id)
      if (s && !mids.includes(s)) mids.push(s)
    }
  }

  if (!mids.length) return

  const manufacturers = await Manufacturer.find({ _id: { $in: mids } }).select('status expiryDate').lean()
  const now = new Date()
  const expired = (manufacturers || []).some(m => m?.status === 'active' && m?.expiryDate && now > new Date(m.expiryDate))
  if (expired) throw new AuthenticationError('厂家效期已到期')
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

  await assertManufacturerNotExpired(user)
  
  // 更新最后登录时间
  user.lastLoginAt = new Date()
  await ensureProfileCompleted(user)
  await user.save()
  
  // 生成 token
  const token = generateToken(user._id)
  
  return {
    token,
    user: {
      id: user._id,
      _id: user._id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      gender: user.gender,
      profileCompleted: user.profileCompleted,
      manufacturerId: user.manufacturerId || null,
      manufacturerIds: user.manufacturerIds || [],
      permissions: user.permissions || {},
      accountType: user.accountType,
      status: user.status,
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

  await assertManufacturerNotExpired(user)
  
  // 更新最后登录时间
  user.lastLoginAt = new Date()
  await ensureProfileCompleted(user)
  await user.save()
  
  // 生成 token
  const token = generateToken(user._id)
  
  return {
    token,
    user: {
      id: user._id,
      _id: user._id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      gender: user.gender,
      profileCompleted: user.profileCompleted,
      manufacturerId: user.manufacturerId || null,
      manufacturerIds: user.manufacturerIds || [],
      permissions: user.permissions || {},
      accountType: user.accountType,
      status: user.status,
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

  await assertManufacturerNotExpired(user)
  
  // 更新最后登录时间
  user.lastLoginAt = new Date()
  await ensureProfileCompleted(user)
  await user.save()
  
  // 生成 token
  const token = generateToken(user._id)
  
  return {
    token,
    user: {
      id: user._id,
      _id: user._id,
      phone: user.phone,
      username: user.username,
      nickname: user.nickname || user.username,
      avatar: user.avatar,
      gender: user.gender,
      profileCompleted: user.profileCompleted,
      manufacturerId: user.manufacturerId || null,
      manufacturerIds: user.manufacturerIds || [],
      permissions: user.permissions || {},
      accountType: user.accountType,
      status: user.status,
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
