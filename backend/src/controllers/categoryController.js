const { successResponse, errorResponse, paginatedResponse } = require('../utils/response')
const FileService = require('../services/fileService')
const Category = require('../models/Category')
const Product = require('../models/Product')

/**
 * 获取所有分类（树状结构）
 * GET /api/categories
 */
const listCategories = async (req, res) => {
  try {
    const { page, limit, status } = req.query
    
    let query = {}
    if (status) {
      query.status = status
    }

    // 如果没有分页参数，返回树状结构
    if (!page && !limit) {
      const allCategories = await Category.find(query).sort({ order: 1, createdAt: -1 })
      
      // 构建树状结构
      const categoryMap = {}
      const tree = []

      // 第一遍：创建映射
      allCategories.forEach(cat => {
        const catObj = cat.toObject()
        categoryMap[cat._id] = Object.assign({}, catObj, { children: [] })
      })

      // 第二遍：构建树
      allCategories.forEach(cat => {
        if (cat.parentId && categoryMap[cat.parentId]) {
          // 是子分类，添加到父分类的 children
          categoryMap[cat.parentId].children.push(categoryMap[cat._id])
        } else {
          // 是顶级分类，添加到树根
          tree.push(categoryMap[cat._id])
        }
      })

      // 直接返回树状数据，确保 children 字段存在
      return res.json({
        success: true,
        data: tree,
        pagination: {
          page: 1,
          limit: allCategories.length,
          total: allCategories.length,
          totalPages: 1
        }
      })
    }

    // 有分页参数，返回扁平列表
    const skip = (page - 1) * limit
    const total = await Category.countDocuments(query)
    const categories = await Category.find(query)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    res.json(paginatedResponse(categories, total, page, limit))
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
    let { name, description, order, status, icon, image, parentId, level, slug } = req.body

    if (!name) {
      return res.status(400).json(errorResponse('分类名称不能为空', 400))
    }

    // 如果前端没有提供slug或slug为空，自动生成
    if (!slug || slug.trim() === '') {
      slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '')
      // 如果生成的slug还是空（全是特殊字符），使用时间戳
      if (!slug) {
        slug = `category-${Date.now()}`
      }
    }

    const category = new Category({
      name,
      slug,
      description,
      icon,
      image,
      parentId: parentId || null,
      level: level || 1,
      order: order || 0,
      status: status || 'active',
      updatedAt: new Date()
    })

    await category.save()

    res.status(201).json(successResponse(category, '分类创建成功'))
  } catch (err) {
    console.error('Create category error:', err)
    if (err.code === 11000) {
      // 检查是否是slug冲突
      if (err.keyPattern && err.keyPattern.slug) {
        return res.status(400).json(errorResponse('分类标识已存在，请使用不同的分类名称', 400))
      }
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
    const { name, description, order, status, image, icon, parentId, level, slug } = req.body

    // 构建更新对象，只包含有值的字段
    const updateData = { updatedAt: new Date() }
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (order !== undefined) updateData.order = order
    if (status !== undefined) updateData.status = status
    if (image !== undefined) updateData.image = image
    if (icon !== undefined) updateData.icon = icon
    if (parentId !== undefined) updateData.parentId = parentId || null
    if (level !== undefined) updateData.level = level
    if (slug !== undefined) updateData.slug = slug

    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
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
 * 批量设置所有分类折扣
 * POST /api/categories/discounts/batch
 */
const batchSetDiscount = async (req, res) => {
  try {
    const { discounts } = req.body

    if (!discounts || !Array.isArray(discounts)) {
      return res.status(400).json(errorResponse('折扣数据格式错误', 400))
    }

    // 更新所有分类的折扣设置
    const result = await Category.updateMany(
      {},
      { 
        $set: { 
          discounts: discounts,
          hasDiscount: discounts.some(d => d.discount < 100),
          updatedAt: new Date()
        }
      }
    )

    res.json(successResponse({
      modifiedCount: result.modifiedCount,
      message: `已为 ${result.modifiedCount} 个分类设置折扣`
    }))
  } catch (err) {
    console.error('Batch set discount error:', err)
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
  batchSetDiscount,
  uploadImage,
  uploadIcon
}
