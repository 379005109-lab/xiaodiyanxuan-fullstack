const { successResponse, errorResponse, paginatedResponse } = require('../utils/response')
const Address = require('../models/Address')
const { calculatePagination } = require('../utils/helpers')

const list = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    const { skip, pageSize: size } = calculatePagination(page, pageSize)
    
    const total = await Address.countDocuments({ userId: req.userId })
    const addresses = await Address.find({ userId: req.userId })
      .sort('-isDefault -createdAt')
      .skip(skip)
      .limit(size)
      .lean()
    
    res.json(paginatedResponse(addresses, total, page, size))
  } catch (err) {
    console.error('List addresses error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

const create = async (req, res) => {
  try {
    console.log('📍 [Address] Create address request')
    console.log('📍 [Address] userId:', req.userId)
    console.log('📍 [Address] body:', JSON.stringify(req.body, null, 2))
    
    const { name, phone, province, city, district, address, isDefault } = req.body
    
    if (!name || !phone || !address) {
      console.error('❌ [Address] Missing required fields')
      return res.status(400).json(errorResponse('Name, phone, and address are required', 400))
    }
    
    // If this is default, unset other defaults
    if (isDefault) {
      await Address.updateMany({ userId: req.userId }, { isDefault: false })
    }
    
    const newAddress = await Address.create({
      userId: req.userId,
      name,
      phone,
      province,
      city,
      district,
      address,
      isDefault: isDefault || false
    })
    
    console.log('✅ [Address] Address created:', newAddress._id)
    res.status(201).json(successResponse(newAddress))
  } catch (err) {
    console.error('❌ [Address] Create address error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

const update = async (req, res) => {
  try {
    const { id } = req.params
    const { name, phone, province, city, district, address, isDefault } = req.body
    
    // If this is default, unset other defaults
    if (isDefault) {
      await Address.updateMany({ userId: req.userId, _id: { $ne: id } }, { isDefault: false })
    }
    
    const updatedAddress = await Address.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { name, phone, province, city, district, address, isDefault, updatedAt: new Date() },
      { new: true }
    )
    
    if (!updatedAddress) {
      return res.status(404).json(errorResponse('Address not found', 404))
    }
    
    res.json(successResponse(updatedAddress))
  } catch (err) {
    console.error('Update address error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

const remove = async (req, res) => {
  try {
    const { id } = req.params
    
    const address = await Address.findOneAndDelete({ _id: id, userId: req.userId })
    if (!address) {
      return res.status(404).json(errorResponse('Address not found', 404))
    }
    
    res.json(successResponse(null, 'Address deleted'))
  } catch (err) {
    console.error('Delete address error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

const setDefault = async (req, res) => {
  try {
    const { id } = req.params
    
    // Unset all defaults for this user
    await Address.updateMany({ userId: req.userId }, { isDefault: false })
    
    // Set this address as default
    const address = await Address.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { isDefault: true, updatedAt: new Date() },
      { new: true }
    )
    
    if (!address) {
      return res.status(404).json(errorResponse('Address not found', 404))
    }
    
    res.json(successResponse(address))
  } catch (err) {
    console.error('Set default address error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

module.exports = {
  list,
  create,
  update,
  remove,
  setDefault
}
