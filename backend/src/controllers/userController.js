const { successResponse, errorResponse, paginatedResponse } = require('../utils/response')
const User = require('../models/User')
const { calculatePagination } = require('../utils/helpers')

// 获取所有用户（管理员功能）
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, pageSize = 50, role, status } = req.query
    const { skip, pageSize: size } = calculatePagination(page, pageSize)
    
    // 构建查询条件
    const query = {}
    if (role) query.role = role
    if (status) query.status = status
    
    const total = await User.countDocuments(query)
    const users = await User.find(query)
      .select('-password -__v')
      .sort('-createdAt')
      .skip(skip)
      .limit(size)
      .lean()
    
    res.json(paginatedResponse(users, total, page, size))
  } catch (err) {
    console.error('Get all users error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-__v')
    if (!user) {
      return res.status(404).json(errorResponse('User not found', 404))
    }
    res.json(successResponse(user))
  } catch (err) {
    console.error('Get profile error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

const updateProfile = async (req, res) => {
  try {
    const { nickname, avatar, phone, email } = req.body
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { nickname, avatar, phone, email, updatedAt: new Date() },
      { new: true }
    )
    
    res.json(successResponse(user))
  } catch (err) {
    console.error('Update profile error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 更新用户信息（管理员功能）
const updateUserById = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    
    // 不允许直接修改密码
    delete updates.password
    
    const user = await User.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).select('-password -__v')
    
    if (!user) {
      return res.status(404).json(errorResponse('User not found', 404))
    }
    
    res.json(successResponse(user))
  } catch (err) {
    console.error('Update user error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

module.exports = {
  getAllUsers,
  getProfile,
  updateProfile,
  updateUserById
}
