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
    const { name, phone, province, city, district, address, isDefault } = req.body
    
    if (!name || !phone || !address) {
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
    
    res.status(201).json(successResponse(newAddress))
  } catch (err) {
    console.error('Create address error:', err)
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

module.exports = {
  list,
  create,
  update,
  remove
}
