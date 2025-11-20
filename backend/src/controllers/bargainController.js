const { successResponse, errorResponse, paginatedResponse } = require('../utils/response')
const Bargain = require('../models/Bargain')
const Product = require('../models/Product')
const { calculatePagination } = require('../utils/helpers')
const FileService = require('../services/fileService')

const list = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    const { skip, pageSize: size } = calculatePagination(page, pageSize)
    
    const total = await Bargain.countDocuments({ status: 'active' })
    const bargains = await Bargain.find({ status: 'active' })
      .sort('-createdAt')
      .skip(skip)
      .limit(size)
      .lean()
    
    res.json(paginatedResponse(bargains, total, page, size))
  } catch (err) {
    console.error('List bargains error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

const start = async (req, res) => {
  try {
    const { productId, targetPrice } = req.body
    
    if (!productId || !targetPrice) {
      return res.status(400).json(errorResponse('Product ID and target price are required', 400))
    }
    
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json(errorResponse('Product not found', 404))
    }
    
    const bargain = await Bargain.create({
      productId,
      productName: product.name,
      thumbnail: product.thumbnail,
      originalPrice: product.basePrice,
      targetPrice,
      currentPrice: product.basePrice,
      userId: req.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    })
    
    res.status(201).json(successResponse(bargain))
  } catch (err) {
    console.error('Start bargain error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

const getMyBargains = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    const { skip, pageSize: size } = calculatePagination(page, pageSize)
    
    const total = await Bargain.countDocuments({ userId: req.userId })
    const bargains = await Bargain.find({ userId: req.userId })
      .sort('-createdAt')
      .skip(skip)
      .limit(size)
      .lean()
    
    res.json(paginatedResponse(bargains, total, page, size))
  } catch (err) {
    console.error('Get my bargains error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

const help = async (req, res) => {
  try {
    const { id } = req.params
    const { priceReduction = 1 } = req.body
    
    const bargain = await Bargain.findById(id)
    if (!bargain) {
      return res.status(404).json(errorResponse('Bargain not found', 404))
    }
    
    if (bargain.status !== 'active') {
      return res.status(400).json(errorResponse('Bargain is not active', 400))
    }
    
    // Check if already helped
    const alreadyHelped = bargain.helpers.some(h => h.userId === req.userId.toString())
    if (alreadyHelped) {
      return res.status(400).json(errorResponse('You have already helped with this bargain', 400))
    }
    
    bargain.helpers.push({
      userId: req.userId.toString(),
      helpedAt: new Date(),
      priceReduction
    })
    
    bargain.currentPrice = Math.max(bargain.targetPrice, bargain.currentPrice - priceReduction)
    bargain.helpCount = bargain.helpers.length
    
    if (bargain.currentPrice <= bargain.targetPrice) {
      bargain.status = 'completed'
      bargain.completedAt = new Date()
    }
    
    await bargain.save()
    res.json(successResponse(bargain))
  } catch (err) {
    console.error('Help bargain error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

/**
 * 上传砍价商品缩略图
 * POST /api/bargains/:id/upload-thumbnail
 */
const uploadThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse('未找到上传的文件', 400))
    }

    const { id } = req.params
    const storage = req.query.storage || 'gridfs'

    // 上传文件
    const fileResult = await FileService.upload(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      storage
    )

    // 更新砍价缩略图
    const bargain = await Bargain.findByIdAndUpdate(
      id,
      { thumbnail: fileResult.url, updatedAt: new Date() },
      { new: true }
    )

    if (!bargain) {
      return res.status(404).json(errorResponse('砍价不存在', 404))
    }

    res.json(successResponse({
      bargainId: bargain._id,
      thumbnail: bargain.thumbnail,
      fileId: fileResult.fileId,
      message: '砍价缩略图上传成功'
    }))
  } catch (err) {
    console.error('Upload thumbnail error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

module.exports = {
  list,
  start,
  getMyBargains,
  help,
  uploadThumbnail
}
