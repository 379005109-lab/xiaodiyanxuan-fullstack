// Build cache bust: 20260108-v2
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response')
const FileService = require('../services/fileService')
const Category = require('../models/Category')
const Product = require('../models/Product')
const Authorization = require('../models/Authorization')

/**
 * 获取所有分类（树状结构）
 * GET /api/categories
 */
const listCategories = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
    res.set('Surrogate-Control', 'no-store')
    const { page, limit, status, manufacturerId } = req.query
    
    let query = {}
    if (status) {
      query.status = status
    }

    const user = req.user
    // Check both manufacturerId and manufacturerIds (plural)
    const userManufacturerId = user?.manufacturerId || user?.manufacturerIds?.[0]
    console.log('[listCategories] req.user exists:', !!user, 'role:', user?.role, 'manufacturerId:', user?.manufacturerId, 'manufacturerIds:', user?.manufacturerIds, 'userManufacturerId:', userManufacturerId)
    
    // enterprise_admin and enterprise_staff with manufacturerId should see filtered categories
    const isManufacturerAccount = userManufacturerId && 
      ['enterprise_admin', 'enterprise_staff', 'manufacturer_admin', 'manufacturer_staff'].includes(user?.role)
    
    console.log('[listCategories] isManufacturerAccount:', isManufacturerAccount)
    
    // For manufacturer accounts, get categories that have their own products or authorized products
    let categoryIdsWithProducts = null
    let productCountByCategory = {}
    
    if (isManufacturerAccount) {
      // Get own products' categories
      const ownProducts = await Product.find({ 
        manufacturerId: userManufacturerId, 
        status: 'active' 
      }).select('category').lean()
      
      console.log('[listCategories] ownProducts count:', ownProducts.length)
      
      // Get authorized products
      const authorizations = await Authorization.find({
        toManufacturer: userManufacturerId,
        status: 'active'
      }).lean()
      
      console.log('[listCategories] authorizations count:', authorizations.length)
      
      let authorizedProductIds = []
      for (const auth of authorizations) {
        if (auth.scope === 'all') {
          const authProds = await Product.find({ 
            manufacturerId: auth.fromManufacturer, 
            status: 'active' 
          }).select('category').lean()
          authorizedProductIds.push(...authProds.map(p => ({ category: p.category })))
        } else if (auth.products?.length) {
          const authProds = await Product.find({ 
            _id: { $in: auth.products }, 
            status: 'active' 
          }).select('category').lean()
          authorizedProductIds.push(...authProds)
        }
      }
      
      // Combine and count by category
      const allProducts = [...ownProducts, ...authorizedProductIds]
      console.log('[listCategories] allProducts count:', allProducts.length)
      
      const categorySet = new Set()
      allProducts.forEach(p => {
        if (p.category) {
          const catId = String(p.category._id || p.category)
          categorySet.add(catId)
          productCountByCategory[catId] = (productCountByCategory[catId] || 0) + 1
        }
      })
      categoryIdsWithProducts = Array.from(categorySet)
      console.log('[listCategories] categoryIdsWithProducts:', categoryIdsWithProducts.length, categoryIdsWithProducts.slice(0, 5))
    }

    if (isManufacturerAccount) {
      // Only show categories that have products
      if (categoryIdsWithProducts && categoryIdsWithProducts.length > 0) {
        query._id = { $in: categoryIdsWithProducts }
      } else {
        // No products, return empty
        return res.json({
          success: true,
          data: [],
          pagination: { page: 1, limit: 0, total: 0, totalPages: 1 }
        })
      }
    } else if (manufacturerId) {
      query.manufacturerId = manufacturerId
    }

    // 如果没有分页参数，返回树状结构
    if (!page && !limit) {
      const allCategories = await Category.find(query)
        .populate('manufacturerId', 'name')
        .sort({ order: 1, createdAt: -1 })
      
      // 构建树状结构
      const categoryMap = {}
      const tree = []

      // 第一遍：创建映射
      allCategories.forEach(cat => {
        const catObj = cat.toObject()
        // Add product count for manufacturer accounts
        if (isManufacturerAccount) {
          catObj.productCount = productCountByCategory[String(cat._id)] || 0
        }
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
      .populate('manufacturerId', 'name')
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
    let { name, description, order, status, icon, image, parentId, level, slug, manufacturerId } = req.body

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

    let resolvedManufacturerId = manufacturerId || null
    let resolvedLevel = level || 1

    if (parentId) {
      const parentCat = await Category.findById(parentId).select('_id manufacturerId level')
      if (!parentCat) {
        return res.status(400).json(errorResponse('父分类不存在', 400))
      }
      resolvedManufacturerId = parentCat.manufacturerId || null
      resolvedLevel = (parentCat.level || 1) + 1
    }

    const category = new Category({
      name,
      slug,
      description,
      icon,
      image,
      manufacturerId: resolvedManufacturerId,
      parentId: parentId || null,
      level: resolvedLevel,
      order: order || 0,
      status: status || 'active',
      updatedAt: new Date()
    })

    const user = req.user
    if (user?.manufacturerId && user.role !== 'super_admin' && user.role !== 'admin') {
      category.manufacturerId = user.manufacturerId
    }

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
    const { name, description, order, status, image, icon, parentId, level, slug, manufacturerId } = req.body

    const existing = await Category.findById(id).select('_id manufacturerId parentId')
    if (!existing) {
      return res.status(404).json(errorResponse('分类不存在', 404))
    }
    const existingManufacturerId = existing.manufacturerId ? String(existing.manufacturerId) : ''

    const nextParentId = parentId !== undefined ? (parentId || null) : (existing.parentId || null)
    const existingParentId = existing.parentId ? String(existing.parentId) : ''
    const nextParentIdStr = nextParentId ? String(nextParentId) : ''
    const parentChanged = parentId !== undefined && existingParentId !== nextParentIdStr

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
    if (manufacturerId !== undefined) updateData.manufacturerId = manufacturerId || null

    // 子分类：厂家/层级应继承父分类（避免 2/3 级分类厂家与 1 级不一致）
    let parentCat = null
    if (nextParentId) {
      parentCat = await Category.findById(nextParentId).select('_id manufacturerId level')
      if (!parentCat) {
        return res.status(400).json(errorResponse('父分类不存在', 400))
      }
      updateData.manufacturerId = parentCat.manufacturerId || null
      updateData.level = (parentCat.level || 1) + 1
    }

    const user = req.user
    if (user?.manufacturerId && user.role !== 'super_admin' && user.role !== 'admin') {
      updateData.manufacturerId = user.manufacturerId
    }

    const targetManufacturerId = updateData.manufacturerId !== undefined
      ? (updateData.manufacturerId || null)
      : (existing.manufacturerId || null)
    const targetManufacturerIdStr = targetManufacturerId ? String(targetManufacturerId) : ''
    const manufacturerWillChange = targetManufacturerIdStr !== existingManufacturerId

    // 若厂家将改变：预先检查目标厂家下 name/slug 唯一性，避免父级改完、子级改失败造成脏数据
    let descendantIds = []
    if (manufacturerWillChange) {
      const queue = [existing._id]
      const subtreeIds = [existing._id]
      while (queue.length > 0) {
        const children = await Category.find({ parentId: { $in: queue } }).select('_id').lean()
        if (!children || children.length === 0) break
        const ids = children.map(c => c._id)
        subtreeIds.push(...ids)
        queue.splice(0, queue.length, ...ids)
      }

      const subtreeDocs = await Category.find({ _id: { $in: subtreeIds } })
        .select('name slug')
        .lean()
      const names = subtreeDocs.map(d => d.name).filter(Boolean)
      const slugs = subtreeDocs.map(d => d.slug).filter(Boolean)

      const nameConflict = names.length > 0
        ? await Category.findOne({
            manufacturerId: targetManufacturerId || null,
            name: { $in: names },
            _id: { $nin: subtreeIds }
          }).select('_id name').lean()
        : null
      if (nameConflict) {
        return res.status(400).json(errorResponse(`目标厂家下已存在同名分类：${nameConflict.name}，无法变更厂家`, 400))
      }

      const slugConflict = slugs.length > 0
        ? await Category.findOne({
            manufacturerId: targetManufacturerId || null,
            slug: { $in: slugs },
            _id: { $nin: subtreeIds }
          }).select('_id slug').lean()
        : null
      if (slugConflict) {
        return res.status(400).json(errorResponse(`目标厂家下已存在相同标识：${slugConflict.slug}，无法变更厂家`, 400))
      }

      descendantIds = subtreeIds.filter(x => String(x) !== String(existing._id))
    }

    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!category) {
      return res.status(404).json(errorResponse('分类不存在', 404))
    }

    if (manufacturerWillChange && descendantIds.length > 0) {
      await Category.updateMany(
        { _id: { $in: descendantIds } },
        { $set: { manufacturerId: targetManufacturerId || null, updatedAt: new Date() } }
      )
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

    // 标准化折扣数据，确保同时有 discount 和 discountPercent 字段
    const normalizedDiscounts = discounts.map(d => ({
      role: d.role,
      roleName: d.roleName,
      discount: d.discount ?? d.discountPercent ?? 100,
      discountPercent: d.discount ?? d.discountPercent ?? 100
    }))
    
    // 更新所有分类的折扣设置
    const result = await Category.updateMany(
      {},
      { 
        $set: { 
          discounts: normalizedDiscounts,
          hasDiscount: normalizedDiscounts.some(d => d.discount < 100),
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
    const { manufacturerId } = req.query
    const user = req.user
    // Check both manufacturerId and manufacturerIds (plural)
    const userManufacturerId = user?.manufacturerId || user?.manufacturerIds?.[0]
    console.log('[getCategoryStats] req.user exists:', !!user, 'role:', user?.role, 'userManufacturerId:', userManufacturerId)
    
    // enterprise_admin and enterprise_staff with manufacturerId should see filtered stats
    const isManufacturerAccount = userManufacturerId && 
      ['enterprise_admin', 'enterprise_staff', 'manufacturer_admin', 'manufacturer_staff'].includes(user?.role)
    
    console.log('[getCategoryStats] isManufacturerAccount:', isManufacturerAccount)

    let totalProducts = 0
    let categoryCount = 0
    
    if (isManufacturerAccount) {
      // Count own products
      const ownProductCount = await Product.countDocuments({ 
        manufacturerId: userManufacturerId, 
        status: 'active' 
      })
      
      // Count authorized products
      const authorizations = await Authorization.find({
        toManufacturer: userManufacturerId,
        status: 'active'
      }).lean()
      
      console.log('[getCategoryStats] userManufacturerId:', userManufacturerId, 'ownProductCount:', ownProductCount, 'authCount:', authorizations.length)
      
      let authorizedCount = 0
      for (const auth of authorizations) {
        if (auth.scope === 'all') {
          authorizedCount += await Product.countDocuments({ 
            manufacturerId: auth.fromManufacturer, 
            status: 'active' 
          })
        } else if (auth.products?.length) {
          authorizedCount += auth.products.length
        }
      }
      
      totalProducts = ownProductCount + authorizedCount
      
      // Get categories with products
      const ownProducts = await Product.find({ 
        manufacturerId: userManufacturerId, 
        status: 'active' 
      }).select('category').lean()
      
      const categorySet = new Set(ownProducts.map(p => String(p.category?._id || p.category)).filter(Boolean))
      
      for (const auth of authorizations) {
        let authProds = []
        if (auth.scope === 'all') {
          authProds = await Product.find({ 
            manufacturerId: auth.fromManufacturer, 
            status: 'active' 
          }).select('category').lean()
        } else if (auth.products?.length) {
          authProds = await Product.find({ 
            _id: { $in: auth.products }, 
            status: 'active' 
          }).select('category').lean()
        }
        authProds.forEach(p => {
          if (p.category) categorySet.add(String(p.category._id || p.category))
        })
      }
      categoryCount = categorySet.size
    } else {
      const query = {}
      if (manufacturerId) {
        query.manufacturerId = manufacturerId
      }
      categoryCount = await Category.countDocuments(query)
      totalProducts = await Product.countDocuments()
    }

    const withDiscount = 0

    res.json(successResponse({
      total: categoryCount,
      active: categoryCount,
      inactive: 0,
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
