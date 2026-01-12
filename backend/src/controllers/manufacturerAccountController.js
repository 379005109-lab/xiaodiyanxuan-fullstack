const User = require('../models/User')
const Manufacturer = require('../models/Manufacturer')
const bcrypt = require('bcryptjs')
const { USER_TYPES, USER_ROLES } = require('../config/constants')

// 获取厂家的所有账号
exports.getAccounts = async (req, res) => {
  try {
    const { manufacturerId } = req.params
    
    const accounts = await User.find({
      $or: [
        { manufacturerId },
        { manufacturerIds: manufacturerId }
      ]
    })
      .select('-password')
      .sort({ createdAt: -1 })
    
    res.json({
      success: true,
      data: accounts
    })
  } catch (error) {
    console.error('获取厂家账号列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取账号列表失败'
    })
  }
}

// 创建厂家账号
exports.createAccount = async (req, res) => {
  try {
    const { manufacturerId } = req.params
    const { username, password, nickname, accountType, permissions, expiresAt } = req.body
    
    // 检查厂家是否存在
    const manufacturer = await Manufacturer.findById(manufacturerId)
    if (!manufacturer) {
      return res.status(404).json({
        success: false,
        message: '厂家不存在'
      })
    }
    
    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      })
    }
    
    // 检查配额
    const accountTypeMap = {
      'auth': 'authAccounts',
      'sub': 'subAccounts',
      'designer': 'designerAccounts'
    }
    
    if (accountType && accountTypeMap[accountType]) {
      const quotaField = accountTypeMap[accountType]
      const quota = manufacturer.accountQuota?.[quotaField] || 0
      const usage = manufacturer.accountUsage?.[quotaField] || 0
      
      if (usage >= quota) {
        return res.status(400).json({
          success: false,
          message: `${accountType === 'auth' ? '授权账号' : accountType === 'sub' ? '子账号' : '设计师账号'}配额已用完`
        })
      }
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // 创建账号
    const normalizedAccountType = accountType || 'normal'
    const isDesigner = normalizedAccountType === 'designer'
    const isAuthAccount = normalizedAccountType === 'auth'
    const user = new User({
      username,
      password: hashedPassword,
      nickname: nickname || username,
      manufacturerId: isDesigner ? null : manufacturerId,
      manufacturerIds: [manufacturerId],
      accountType: normalizedAccountType,
      role: isDesigner ? USER_ROLES.DESIGNER : (isAuthAccount ? USER_ROLES.ENTERPRISE_ADMIN : USER_ROLES.ENTERPRISE_STAFF),
      userType: isDesigner ? USER_TYPES.DESIGNER : USER_TYPES.ADMIN,
      permissions: permissions || {},
      specialAccountConfig: {
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      status: 'active'
    })
    
    await user.save()
    
    // 更新厂家账号使用量
    if (accountType && accountTypeMap[accountType]) {
      const quotaField = accountTypeMap[accountType]
      await Manufacturer.findByIdAndUpdate(manufacturerId, {
        $inc: { [`accountUsage.${quotaField}`]: 1 }
      })
    }
    
    res.json({
      success: true,
      message: '账号创建成功',
      data: {
        _id: user._id,
        username: user.username,
        nickname: user.nickname,
        accountType: user.accountType,
        permissions: user.permissions,
        status: user.status
      }
    })
  } catch (error) {
    console.error('创建厂家账号失败:', error)
    res.status(500).json({
      success: false,
      message: '创建账号失败'
    })
  }
}

// 更新厂家账号
exports.updateAccount = async (req, res) => {
  try {
    const { manufacturerId, accountId } = req.params
    const { nickname, accountType, permissions, expiresAt, status } = req.body
    
    const user = await User.findOne({
      _id: accountId,
      $or: [
        { manufacturerId },
        { manufacturerIds: manufacturerId }
      ]
    })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '账号不存在'
      })
    }
    
    const oldAccountType = user.accountType
    
    // 如果账号类型改变，需要更新配额使用量
    if (accountType && accountType !== oldAccountType) {
      const manufacturer = await Manufacturer.findById(manufacturerId)
      
      const accountTypeMap = {
        'auth': 'authAccounts',
        'sub': 'subAccounts',
        'designer': 'designerAccounts'
      }
      
      // 检查新类型的配额
      if (accountTypeMap[accountType]) {
        const quotaField = accountTypeMap[accountType]
        const quota = manufacturer.accountQuota?.[quotaField] || 0
        const usage = manufacturer.accountUsage?.[quotaField] || 0
        
        if (usage >= quota) {
          return res.status(400).json({
            success: false,
            message: `${accountType === 'auth' ? '授权账号' : accountType === 'sub' ? '子账号' : '设计师账号'}配额已用完`
          })
        }
      }
      
      // 减少旧类型的使用量
      if (oldAccountType && accountTypeMap[oldAccountType]) {
        await Manufacturer.findByIdAndUpdate(manufacturerId, {
          $inc: { [`accountUsage.${accountTypeMap[oldAccountType]}`]: -1 }
        })
      }
      
      // 增加新类型的使用量
      if (accountTypeMap[accountType]) {
        await Manufacturer.findByIdAndUpdate(manufacturerId, {
          $inc: { [`accountUsage.${accountTypeMap[accountType]}`]: 1 }
        })
      }
      
      user.accountType = accountType
      const isDesigner = accountType === 'designer'
      const isAuthAccount = accountType === 'auth'
      user.role = isDesigner ? USER_ROLES.DESIGNER : (isAuthAccount ? USER_ROLES.ENTERPRISE_ADMIN : USER_ROLES.ENTERPRISE_STAFF)
      user.userType = isDesigner ? USER_TYPES.DESIGNER : USER_TYPES.ADMIN
      if (isDesigner) {
        user.manufacturerId = null
        const existing = Array.isArray(user.manufacturerIds) ? user.manufacturerIds.map(String) : []
        if (!existing.includes(String(manufacturerId))) {
          user.manufacturerIds = [...(user.manufacturerIds || []), manufacturerId]
        }
      } else {
        user.manufacturerId = manufacturerId
        user.manufacturerIds = [manufacturerId]
      }
    }
    
    if (nickname) user.nickname = nickname
    if (permissions) user.permissions = { ...user.permissions, ...permissions }
    if (expiresAt !== undefined) {
      user.specialAccountConfig = user.specialAccountConfig || {}
      user.specialAccountConfig.expiresAt = expiresAt ? new Date(expiresAt) : null
    }
    if (status) user.status = status
    
    await user.save()
    
    res.json({
      success: true,
      message: '账号更新成功',
      data: user
    })
  } catch (error) {
    console.error('更新厂家账号失败:', error)
    res.status(500).json({
      success: false,
      message: '更新账号失败'
    })
  }
}

// 删除/收回厂家账号
exports.deleteAccount = async (req, res) => {
  try {
    const { manufacturerId, accountId } = req.params
    
    const user = await User.findOne({
      _id: accountId,
      $or: [
        { manufacturerId },
        { manufacturerIds: manufacturerId }
      ]
    })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '账号不存在'
      })
    }
    
    const accountType = user.accountType
    
    // 删除账号
    await User.findByIdAndDelete(accountId)
    
    // 更新厂家账号使用量
    const accountTypeMap = {
      'auth': 'authAccounts',
      'sub': 'subAccounts',
      'designer': 'designerAccounts'
    }
    
    if (accountType && accountTypeMap[accountType]) {
      await Manufacturer.findByIdAndUpdate(manufacturerId, {
        $inc: { [`accountUsage.${accountTypeMap[accountType]}`]: -1 }
      })
    }
    
    res.json({
      success: true,
      message: '账号已删除'
    })
  } catch (error) {
    console.error('删除厂家账号失败:', error)
    res.status(500).json({
      success: false,
      message: '删除账号失败'
    })
  }
}

// 重置账号密码
exports.resetPassword = async (req, res) => {
  try {
    const { manufacturerId, accountId } = req.params
    const { newPassword } = req.body
    
    const user = await User.findOne({
      _id: accountId,
      $or: [
        { manufacturerId },
        { manufacturerIds: manufacturerId }
      ]
    })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '账号不存在'
      })
    }
    
    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()
    
    res.json({
      success: true,
      message: '密码重置成功'
    })
  } catch (error) {
    console.error('重置密码失败:', error)
    res.status(500).json({
      success: false,
      message: '重置密码失败'
    })
  }
}

// 更新厂家设置信息（LOGO、电话、收款信息等）
exports.updateSettings = async (req, res) => {
  try {
    const { manufacturerId } = req.params
    const { logo, settings } = req.body
    
    const manufacturer = await Manufacturer.findById(manufacturerId)
    if (!manufacturer) {
      return res.status(404).json({
        success: false,
        message: '厂家不存在'
      })
    }
    
    if (logo) manufacturer.logo = logo
    if (settings) {
      manufacturer.settings = {
        ...manufacturer.settings?.toObject?.() || manufacturer.settings || {},
        ...settings
      }
    }
    
    await manufacturer.save()
    
    res.json({
      success: true,
      message: '设置更新成功',
      data: manufacturer
    })
  } catch (error) {
    console.error('更新厂家设置失败:', error)
    res.status(500).json({
      success: false,
      message: '更新设置失败'
    })
  }
}

// 提交企业认证
exports.submitCertification = async (req, res) => {
  try {
    const { manufacturerId } = req.params
    const { certification } = req.body
    
    const manufacturer = await Manufacturer.findById(manufacturerId)
    if (!manufacturer) {
      return res.status(404).json({
        success: false,
        message: '厂家不存在'
      })
    }
    
    manufacturer.certification = {
      ...certification,
      status: 'pending'
    }
    
    await manufacturer.save()
    
    res.json({
      success: true,
      message: '认证信息已提交，等待审核',
      data: manufacturer.certification
    })
  } catch (error) {
    console.error('提交企业认证失败:', error)
    res.status(500).json({
      success: false,
      message: '提交认证失败'
    })
  }
}

// 审核企业认证（管理员用）
exports.reviewCertification = async (req, res) => {
  try {
    const { manufacturerId } = req.params
    const { status, reviewNote } = req.body
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的审核状态'
      })
    }
    
    const manufacturer = await Manufacturer.findById(manufacturerId)
    if (!manufacturer) {
      return res.status(404).json({
        success: false,
        message: '厂家不存在'
      })
    }
    
    manufacturer.certification = manufacturer.certification || {}
    manufacturer.certification.status = status
    manufacturer.certification.reviewNote = reviewNote
    if (status === 'approved') {
      manufacturer.certification.certifiedAt = new Date()
    }
    
    await manufacturer.save()
    
    res.json({
      success: true,
      message: status === 'approved' ? '认证已通过' : '认证已拒绝',
      data: manufacturer.certification
    })
  } catch (error) {
    console.error('审核企业认证失败:', error)
    res.status(500).json({
      success: false,
      message: '审核失败'
    })
  }
}
