const { successResponse, errorResponse, paginatedResponse } = require('../utils/response')
const FileService = require('../services/fileService')
const Category = require('../models/Category')
const Product = require('../models/Product')

/**
 * 获取分类列表
 * GET /api/categories
 */
const listCategories = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status = 'active' } = req.query

    const query = status ? { status } : {}
    const skip = (page - 1) * pageSize
    const limit = parseInt(pageSize)

    const categories = await Category.find(query)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Category.countDocuments(query)

    res.json(paginatedResponse(categories, total, page, pageSize))
  } catch (err) {
    console.error('List categories error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

/**
 * 获取单个分类
 * GET /api/categories/:id
 */
const getCategory = async (req, res) => {
  try {
    const { id } = req.params

    const category = await Category.findById(id)
    if (!category) {
      return res.status(404).json(errorResponse('分类不存在', 404))
    }

    res.json(successResponse(category))
  } catch (err) {
    console.error('Get category error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

/**
 * 创建分类
 * POST /api/categories
 */
const createCategory = async (req, res) => {
  try {
    const { name, description, order, status } = req.body

    if (!name) {
      return res.status(400).json(errorResponse('分类名称不能为空', 400))
    }

    const category = new Category({
      name,
      description,
      order: order || 0,
      status: status || 'active'
    })

    await category.save()

    res.status(201).json(successResponse(category))
  } catch (err) {
    console.error('Create category error:', err)
    if (err.code === 11000) {
      return res.status(400).json(errorResponse('分类名称已存在', 400))
    }
    res.status(500).json(errorResponse(err.message, 500))
  }
}

/**
 * 更新分类
 * PUT /api/categories/:id
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, order, status } = req.body

    const category = await Category.findByIdAndUpdate(
      id,
      { name, description, order, status, updatedAt: new Date() },
      { new: true, runValidators: true }
    )

    if (!category) {
      return res.status(404).json(errorResponse('分类不存在', 404))
    }

    res.json(successResponse(category))
  } catch (err) {
    console.error('Update category error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

/**
 * 删除分类
 * DELETE /api/categories/:id
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params

    const category = await Category.findByIdAndDelete(id)
    if (!category) {
      return res.status(404).json(errorResponse('分类不存在', 404))
    }

    res.json(successResponse({ id, message: '分类删除成功' }))
  } catch (err) {
    console.error('Delete category error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

/**
 * 上传分类图片
 * POST /api/categories/:id/upload-image
 */
const uploadImage = async (req, res) => {
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

    // 更新分类图片
    const category = await Category.findByIdAndUpdate(
      id,
      { image: fileResult.url, updatedAt: new Date() },
      { new: true }
    )

    if (!category) {
      return res.status(404).json(errorResponse('分类不存在', 404))
    }

    res.json(successResponse({
      categoryId: category._id,
      image: category.image,
      fileId: fileResult.fileId,
      message: '分类图片上传成功'
    }))
  } catch (err) {
    console.error('Upload image error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

/**
 * 上传分类图标
 * POST /api/categories/:id/upload-icon
 */
const uploadIcon = async (req, res) => {
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

    // 更新分类图标
    const category = await Category.findByIdAndUpdate(
      id,
      { icon: fileResult.url, updatedAt: new Date() },
      { new: true }
    )

    if (!category) {
      return res.status(404).json(errorResponse('分类不存在', 404))
    }

    res.json(successResponse({
      categoryId: category._id,
      icon: category.icon,
      fileId: fileResult.fileId,
      message: '分类图标上传成功'
    }))
  } catch (err) {
    console.error('Upload icon error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

/**
 * 获取分类统计
 * GET /api/categories/stats
 */
const getCategoryStats = async (req, res) => {
  try {
    const total = await Category.countDocuments()
    const activeCount = await Category.countDocuments({ status: 'active' })
    const inactiveCount = await Category.countDocuments({ status: 'inactive' })

    // 统计商品总数
    const totalProducts = await Product.countDocuments()

    // 目前数据模型中没有明确的 "优惠" 标记，这里先返回 0，避免前端访问 undefined
    const withDiscount = 0

    res.json(successResponse({
      total,
      active: activeCount,
      inactive: inactiveCount,
      totalProducts,
      withDiscount
    }))
  } catch (err) {
    console.error('Get category stats error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
  uploadImage,
  uploadIcon
}
