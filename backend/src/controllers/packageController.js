const { successResponse, errorResponse, paginatedResponse } = require('../utils/response')
const Package = require('../models/Package')
const Product = require('../models/Product')
const { calculatePagination } = require('../utils/helpers')
const FileService = require('../services/fileService')

const list = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    const { skip, pageSize: size } = calculatePagination(page, pageSize)
    
    const total = await Package.countDocuments({ status: 'active' })
    const packages = await Package.find({ status: 'active' })
      .sort('-createdAt')
      .skip(skip)
      .limit(size)
      .lean()
    
    // 填充商品详细信息
    for (let pkg of packages) {
      if (pkg.categories) {
        for (let category of pkg.categories) {
          if (category.products && Array.isArray(category.products)) {
            // 提取商品ID（兼容旧数据：可能是字符串ID或完整对象）
            const productIds = category.products.map(p => {
              if (typeof p === 'string') {
                return p  // 新数据：字符串ID
              } else if (p && p._id) {
                return p._id.toString()  // 旧数据：完整对象，提取ID
              } else if (p && p.id) {
                return p.id  // 旧数据：已转换的对象，提取id
              }
              return null
            }).filter(id => id !== null)
            
            // 查询商品详细信息
            const products = await Product.find({ _id: { $in: productIds } }).lean()
            
            // 创建商品ID到商品对象的映射，保持原有顺序
            const productMap = {}
            products.forEach(p => {
              productMap[p._id.toString()] = p
            })
            
            // 替换商品ID为商品详细信息，保持顺序，处理已删除商品
            category.products = productIds.map(productId => {
              const product = productMap[productId]
              
              // 商品已被删除
              if (!product) {
                return {
                  id: productId.toString(),
                  name: '该商品已下架',
                  image: null,
                  basePrice: 0,
                  packagePrice: 0,
                  price: 0,
                  specs: '',
                  description: '该商品已从商品库中删除',
                  materials: {},
                  materialImages: {},
                  skus: [],
                  specifications: {},
                  videos: [],
                  isDeleted: true,
                  status: 'inactive'
                }
              }
              
              // 返回完整的商品数据
              return {
                id: product._id.toString(),
                name: product.name,
                image: product.images && product.images[0] ? product.images[0] : null,
                images: product.images || [],
                basePrice: product.basePrice,
                packagePrice: product.packagePrice || product.basePrice,
                price: product.basePrice, // 兼容旧代码
                specs: product.skus && product.skus[0] ? product.skus[0].dimensions || '' : '',
                description: product.description || '',
                category: product.category,
                materials: product.materials || {},
                materialImages: product.materialImages || {},
                skus: product.skus || [],
                specifications: product.specifications || {},
                videos: product.videos || [],
                stock: product.stock,
                sales: product.sales,
                status: product.status,
                isDeleted: false
              }
            })
          }
        }
      }
    }
    
    res.json(paginatedResponse(packages, total, page, size))
  } catch (err) {
    console.error('List packages error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

const getPackage = async (req, res) => {
  try {
    const { id } = req.params
    
    const pkg = await Package.findById(id).lean()
    if (!pkg) {
      return res.status(404).json(errorResponse('Package not found', 404))
    }
    
    // 填充商品详细信息
    if (pkg.categories) {
      for (let category of pkg.categories) {
        if (category.products && Array.isArray(category.products)) {
          // 提取商品ID（兼容旧数据：可能是字符串ID或完整对象）
          const productIds = category.products.map(p => {
            if (typeof p === 'string') {
              return p  // 新数据：字符串ID
            } else if (p && p._id) {
              return p._id.toString()  // 旧数据：完整对象，提取ID
            } else if (p && p.id) {
              return p.id  // 旧数据：已转换的对象，提取id
            }
            return null
          }).filter(id => id !== null)
          
          // 查询商品详细信息
          const products = await Product.find({ _id: { $in: productIds } }).lean()
          
          // 创建商品ID到商品对象的映射，保持原有顺序
          const productMap = {}
          products.forEach(p => {
            productMap[p._id.toString()] = p
          })
          
          // 替换商品ID为商品详细信息，保持顺序，处理已删除商品
          category.products = productIds.map(productId => {
            const product = productMap[productId]
            
            // 商品已被删除
            if (!product) {
              return {
                id: productId.toString(),
                name: '该商品已下架',
                image: null,
                basePrice: 0,
                packagePrice: 0,
                price: 0,
                specs: '',
                description: '该商品已从商品库中删除',
                materials: {},
                materialImages: {},
                skus: [],
                specifications: {},
                videos: [],
                isDeleted: true,
                status: 'inactive'
              }
            }
            
            // 返回完整的商品数据
            return {
              id: product._id.toString(),
              name: product.name,
              image: product.images && product.images[0] ? product.images[0] : null,
              images: product.images || [],
              basePrice: product.basePrice,
              packagePrice: product.packagePrice || product.basePrice,
              price: product.basePrice, // 兼容旧代码
              specs: product.skus && product.skus[0] ? product.skus[0].dimensions || '' : '',
              description: product.description || '',
              category: product.category,
              materials: product.materials || {},
              materialImages: product.materialImages || {},
              skus: product.skus || [],
              specifications: product.specifications || {},
              videos: product.videos || [],
              stock: product.stock,
              sales: product.sales,
              status: product.status,
              isDeleted: false
            }
          })
        }
      }
    }
    
    res.json(successResponse(pkg))
  } catch (err) {
    console.error('Get package error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

/**
 * 上传套餐缩略图
 * POST /api/packages/:id/upload-thumbnail
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

    // 更新套餐缩略图
    const pkg = await Package.findByIdAndUpdate(
      id,
      { thumbnail: fileResult.url, updatedAt: new Date() },
      { new: true }
    )

    if (!pkg) {
      return res.status(404).json(errorResponse('套餐不存在', 404))
    }

    res.json(successResponse({
      packageId: pkg._id,
      thumbnail: pkg.thumbnail,
      fileId: fileResult.fileId,
      message: '套餐缩略图上传成功'
    }))
  } catch (err) {
    console.error('Upload thumbnail error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

/**
 * 上传套餐图片
 * POST /api/packages/:id/upload-images
 */
const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json(errorResponse('未找到上传的文件', 400))
    }

    const { id } = req.params
    const storage = req.query.storage || 'gridfs'

    // 上传所有文件
    const fileResults = []
    for (const file of req.files) {
      const fileResult = await FileService.upload(
        file.buffer,
        file.originalname,
        file.mimetype,
        storage
      )
      fileResults.push(fileResult)
    }

    // 获取套餐
    const pkg = await Package.findById(id)
    if (!pkg) {
      return res.status(404).json(errorResponse('套餐不存在', 404))
    }

    // 添加新图片到现有图片
    const newImages = fileResults.map(f => f.url)
    pkg.images = [...(pkg.images || []), ...newImages]
    await pkg.save()

    res.json(successResponse({
      packageId: pkg._id,
      images: pkg.images,
      uploadedCount: fileResults.length,
      message: `成功上传 ${fileResults.length} 张图片`
    }))
  } catch (err) {
    console.error('Upload images error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

/**
 * 创建套餐
 * POST /api/packages
 */
const create = async (req, res) => {
  try {
    const packageData = req.body;
    const pkg = await Package.create(packageData);
    
    res.status(201).json(successResponse(pkg, '套餐创建成功'));
  } catch (err) {
    console.error('Create package error:', err);
    res.status(500).json(errorResponse(err.message, 500));
  }
};

/**
 * 更新套餐
 * PUT /api/packages/:id
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date() };
    
    const pkg = await Package.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!pkg) {
      return res.status(404).json(errorResponse('套餐不存在', 404));
    }
    
    res.json(successResponse(pkg, '套餐更新成功'));
  } catch (err) {
    console.error('Update package error:', err);
    res.status(500).json(errorResponse(err.message, 500));
  }
};

/**
 * 删除套餐
 * DELETE /api/packages/:id
 */
const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pkg = await Package.findByIdAndDelete(id);
    
    if (!pkg) {
      return res.status(404).json(errorResponse('套餐不存在', 404));
    }
    
    res.json(successResponse(null, '套餐删除成功'));
  } catch (err) {
    console.error('Delete package error:', err);
    res.status(500).json(errorResponse(err.message, 500));
  }
};

module.exports = {
  list,
  getPackage,
  create,
  update,
  deletePackage,
  uploadThumbnail,
  uploadImages
}
