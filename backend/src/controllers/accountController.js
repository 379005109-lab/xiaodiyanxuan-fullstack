const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const User = require('../models/User')
const Organization = require('../models/Organization')
const { successResponse, errorResponse } = require('../utils/response')
const { USER_ROLES, ORGANIZATION_TYPES } = require('../config/constants')

// ==================== 组织管理 ====================

/**
 * 获取组织列表（平台/企业）
 */
const getOrganizations = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query
    
    const filter = {}
    if (type) filter.type = type
    if (status) filter.status = status
    
    const total = await Organization.countDocuments(filter)
    const organizations = await Organization.find(filter)
      .populate('adminUserId', 'username nickname phone email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
    
    res.json(successResponse({
      list: organizations,
      pagination: { total, page: Number(page), limit: Number(limit) }
    }))
  } catch (err) {
    res.status(500).json(errorResponse(err.message))
  }
}

/**
 * 创建组织（平台/企业）
 */
const createOrganization = async (req, res) => {
  try {
    const { name, type, contactPerson, contactPhone, contactEmail, description } = req.body
    
    if (!name || !type) {
      return res.status(400).json(errorResponse('名称和类型不能为空'))
    }
    
    if (!Object.values(ORGANIZATION_TYPES).includes(type)) {
      return res.status(400).json(errorResponse('无效的组织类型'))
    }
    
    const organization = new Organization({
      name,
      type,
      contactPerson,
      contactPhone,
      contactEmail,
      description,
      createdBy: req.user._id,
    })
    
    await organization.save()
    res.json(successResponse(organization, '组织创建成功'))
  } catch (err) {
    res.status(500).json(errorResponse(err.message))
  }
}

/**
 * 更新组织
 */
const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    
    // 不允许修改类型
    delete updates.type
    delete updates.code
    
    const organization = await Organization.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    )
    
    if (!organization) {
      return res.status(404).json(errorResponse('组织不存在'))
    }
    
    res.json(successResponse(organization, '更新成功'))
  } catch (err) {
    res.status(500).json(errorResponse(err.message))
  }
}

/**
 * 删除组织
 */
const deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params
    
    // 检查是否有关联用户
    const userCount = await User.countDocuments({ organizationId: id })
    if (userCount > 0) {
      return res.status(400).json(errorResponse(`该组织下还有 ${userCount} 个用户，请先删除用户`))
    }
    
    await Organization.findByIdAndDelete(id)
    res.json(successResponse(null, '删除成功'))
  } catch (err) {
    res.status(500).json(errorResponse(err.message))
  }
}

/**
 * 设置组织折扣配置
 */
const setOrganizationDiscount = async (req, res) => {
  try {
    const { id } = req.params
    const { defaultDiscount, canViewCostPrice, categoryDiscounts } = req.body
    
    const organization = await Organization.findById(id)
    if (!organization) {
      return res.status(404).json(errorResponse('组织不存在'))
    }
    
    organization.discountConfig = {
      defaultDiscount: defaultDiscount ?? organization.discountConfig?.defaultDiscount,
      canViewCostPrice: canViewCostPrice ?? organization.discountConfig?.canViewCostPrice,
      categoryDiscounts: categoryDiscounts ?? organization.discountConfig?.categoryDiscounts,
    }
    
    await organization.save()
    res.json(successResponse(organization, '折扣配置已更新'))
  } catch (err) {
    res.status(500).json(errorResponse(err.message))
  }
}

// ==================== 用户账号管理 ====================

/**
 * 获取用户列表
 */
const getUsers = async (req, res) => {
  try {
    const { role, organizationId, status, keyword, page = 1, limit = 20 } = req.query
    const currentUser = req.user
    
    const filter = {}
    
    // 权限过滤：非超级管理员只能看自己组织的用户
    if (currentUser.role !== USER_ROLES.SUPER_ADMIN) {
      if (currentUser.organizationId) {
        filter.organizationId = currentUser.organizationId
      } else {
        return res.status(403).json(errorResponse('无权限查看用户列表'))
      }
    } else {
      if (organizationId) filter.organizationId = organizationId
    }
    
    if (role) filter.role = role
    if (status) filter.status = status
    if (keyword) {
      filter.$or = [
        { username: { $regex: keyword, $options: 'i' } },
        { nickname: { $regex: keyword, $options: 'i' } },
        { phone: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
      ]
    }
    
    const total = await User.countDocuments(filter)
    const users = await User.find(filter)
      .select('-password')
      .populate('organizationId', 'name type code')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
    
    res.json(successResponse({
      list: users,
      pagination: { total, page: Number(page), limit: Number(limit) }
    }))
  } catch (err) {
    res.status(500).json(errorResponse(err.message))
  }
}

/**
 * 创建用户账号
 */
const createUser = async (req, res) => {
  try {
    const { username, password, nickname, phone, email, role, organizationId } = req.body
    const currentUser = req.user
    
    if (!username || !password) {
      return res.status(400).json(errorResponse('用户名和密码不能为空'))
    }
    
    // 检查用户名是否已存在
    const existing = await User.findOne({ username })
    if (existing) {
      return res.status(400).json(errorResponse('用户名已存在'))
    }
    
    // 权限检查
    const allowedRoles = getAllowedRolesToCreate(currentUser)
    if (!allowedRoles.includes(role)) {
      return res.status(403).json(errorResponse('无权限创建该角色的用户'))
    }
    
    // 组织归属检查
    let targetOrgId = organizationId
    if ([USER_ROLES.PLATFORM_STAFF, USER_ROLES.ENTERPRISE_ADMIN, USER_ROLES.ENTERPRISE_STAFF].includes(role)) {
      if (!targetOrgId && currentUser.organizationId) {
        targetOrgId = currentUser.organizationId
      }
      if (!targetOrgId) {
        return res.status(400).json(errorResponse('平台/企业账号需要指定组织'))
      }
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const user = new User({
      username,
      password: hashedPassword,
      nickname: nickname || username,
      phone,
      email,
      role,
      organizationId: targetOrgId,
      createdBy: currentUser._id,
    })
    
    await user.save()
    
    // 更新组织用户计数
    if (targetOrgId) {
      await Organization.findByIdAndUpdate(targetOrgId, { $inc: { 'quota.usedUsers': 1 } })
    }
    
    const result = user.toObject()
    delete result.password
    
    res.json(successResponse(result, '用户创建成功'))
  } catch (err) {
    res.status(500).json(errorResponse(err.message))
  }
}

/**
 * 更新用户
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    const currentUser = req.user
    
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json(errorResponse('用户不存在'))
    }
    
    // 权限检查 - 超级管理员或 admin 角色可以修改所有用户
    const isAdmin = ['super_admin', 'admin', 'platform_admin'].includes(currentUser.role)
    if (!isAdmin) {
      // 非管理员只能修改同组织用户
      if (user.organizationId?.toString() !== currentUser.organizationId?.toString()) {
        return res.status(403).json(errorResponse('无权限修改该用户'))
      }
    }
    
    // 不允许直接修改的字段
    delete updates.password
    delete updates.openId
    delete updates.createdBy
    
    // 如果修改角色，检查权限（管理员可以设置任何角色）
    if (updates.role && !isAdmin) {
      const allowedRoles = getAllowedRolesToCreate(currentUser)
      if (!allowedRoles.includes(updates.role)) {
        return res.status(403).json(errorResponse('无权限设置该角色'))
      }
    }
    
    Object.assign(user, updates)
    await user.save()
    
    const result = user.toObject()
    delete result.password
    
    res.json(successResponse(result, '更新成功'))
  } catch (err) {
    console.error('更新用户失败:', err)
    res.status(500).json(errorResponse(err.message))
  }
}

/**
 * 重置用户密码
 */
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params
    const { newPassword } = req.body
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json(errorResponse('密码长度不能少于6位'))
    }
    
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json(errorResponse('用户不存在'))
    }
    
    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()
    
    res.json(successResponse(null, '密码重置成功'))
  } catch (err) {
    res.status(500).json(errorResponse(err.message))
  }
}

/**
 * 删除用户
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params
    const currentUser = req.user
    
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json(errorResponse('用户不存在'))
    }
    
    // 不能删除自己
    if (user._id.toString() === currentUser._id.toString()) {
      return res.status(400).json(errorResponse('不能删除自己的账号'))
    }
    
    // 权限检查
    if (currentUser.role !== USER_ROLES.SUPER_ADMIN) {
      if (user.organizationId?.toString() !== currentUser.organizationId?.toString()) {
        return res.status(403).json(errorResponse('无权限删除该用户'))
      }
    }
    
    // 更新组织用户计数
    if (user.organizationId) {
      await Organization.findByIdAndUpdate(user.organizationId, { $inc: { 'quota.usedUsers': -1 } })
    }
    
    await User.findByIdAndDelete(id)
    res.json(successResponse(null, '删除成功'))
  } catch (err) {
    res.status(500).json(errorResponse(err.message))
  }
}

// ==================== 特殊账号管理 ====================

/**
 * 生成特殊账号（一次性访问码）
 */
const createSpecialAccount = async (req, res) => {
  try {
    const { note, expiresInHours = 24, maxUsage = 1 } = req.body
    const currentUser = req.user
    
    // 生成访问码
    const accessCode = crypto.randomBytes(4).toString('hex').toUpperCase()
    
    // 生成临时用户名
    const username = `guest_${accessCode}`
    
    const user = new User({
      username,
      password: await bcrypt.hash(accessCode, 10),
      nickname: `访客_${accessCode}`,
      role: USER_ROLES.SPECIAL_GUEST,
      specialAccountConfig: {
        accessCode,
        expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
        maxUsage,
        usedCount: 0,
        note,
      },
      createdBy: currentUser._id,
    })
    
    await user.save()
    
    res.json(successResponse({
      accessCode,
      username,
      expiresAt: user.specialAccountConfig.expiresAt,
      maxUsage,
      note,
    }, '特殊账号创建成功'))
  } catch (err) {
    res.status(500).json(errorResponse(err.message))
  }
}

/**
 * 获取特殊账号列表
 */
const getSpecialAccounts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    
    const filter = { role: USER_ROLES.SPECIAL_GUEST }
    
    const total = await User.countDocuments(filter)
    const users = await User.find(filter)
      .select('-password')
      .populate('createdBy', 'username nickname')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
    
    res.json(successResponse({
      list: users,
      pagination: { total, page: Number(page), limit: Number(limit) }
    }))
  } catch (err) {
    res.status(500).json(errorResponse(err.message))
  }
}

/**
 * 使特殊账号失效
 */
const invalidateSpecialAccount = async (req, res) => {
  try {
    const { id } = req.params
    
    const user = await User.findById(id)
    if (!user || user.role !== USER_ROLES.SPECIAL_GUEST) {
      return res.status(404).json(errorResponse('特殊账号不存在'))
    }
    
    user.status = 'expired'
    await user.save()
    
    res.json(successResponse(null, '账号已失效'))
  } catch (err) {
    res.status(500).json(errorResponse(err.message))
  }
}

// ==================== 辅助函数 ====================

/**
 * 获取当前用户可以创建的角色列表
 */
const getAllowedRolesToCreate = (currentUser) => {
  switch (currentUser.role) {
    case USER_ROLES.SUPER_ADMIN:
      return Object.values(USER_ROLES)
    case USER_ROLES.PLATFORM_ADMIN:
      return [USER_ROLES.PLATFORM_STAFF]
    case USER_ROLES.ENTERPRISE_ADMIN:
      return [USER_ROLES.ENTERPRISE_STAFF]
    default:
      return []
  }
}

/**
 * 获取角色统计
 */
const getRoleStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ])
    
    const orgStats = await Organization.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ])
    
    res.json(successResponse({
      roleStats: stats,
      organizationStats: orgStats,
    }))
  } catch (err) {
    res.status(500).json(errorResponse(err.message))
  }
}

/**
 * 获取用户看板统计数据
 */
const getDashboard = async (req, res) => {
  try {
    // 总用户数
    const totalUsers = await User.countDocuments()
    
    // 今日新增用户
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayNewUsers = await User.countDocuments({ createdAt: { $gte: today } })
    
    // 本月新增用户
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthNewUsers = await User.countDocuments({ createdAt: { $gte: thisMonth } })
    
    // 活跃用户（7天内有登录）
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const activeUsers = await User.countDocuments({ lastLoginAt: { $gte: weekAgo } })
    
    // 按角色统计
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
    
    // 按状态统计
    const statusStats = await User.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
    
    // 被标记的用户（如批量下载）
    const taggedUsers = await User.countDocuments({ tags: { $exists: true, $ne: [] } })
    
    // 批量下载标签用户
    const bulkDownloadUsers = await User.countDocuments({ tags: '批量下载' })
    
    // 组织统计
    const orgStats = await Organization.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ])
    
    // 最近注册用户
    const recentUsers = await User.find()
      .select('nickname username phone role status createdAt lastLoginAt tags')
      .sort({ createdAt: -1 })
      .limit(10)
    
    // 最近被标记的用户
    const recentTaggedUsers = await User.find({ tags: { $exists: true, $ne: [] } })
      .select('nickname username phone role status tags downloadStats createdAt')
      .sort({ 'downloadStats.firstTaggedAt': -1 })
      .limit(10)
    
    res.json(successResponse({
      overview: {
        totalUsers,
        todayNewUsers,
        monthNewUsers,
        activeUsers,
        taggedUsers,
        bulkDownloadUsers,
      },
      roleStats,
      statusStats,
      orgStats,
      recentUsers,
      recentTaggedUsers,
    }))
  } catch (err) {
    res.status(500).json(errorResponse(err.message))
  }
}

module.exports = {
  // 组织管理
  getOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  setOrganizationDiscount,
  // 用户管理
  getUsers,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser,
  // 特殊账号
  createSpecialAccount,
  getSpecialAccounts,
  invalidateSpecialAccount,
  // 统计与看板
  getRoleStats,
  getDashboard,
}
