const { successResponse, errorResponse } = require('../utils/response')
const User = require('../models/User')

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

module.exports = {
  getProfile,
  updateProfile
}
