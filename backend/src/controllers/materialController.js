const Material = require('../models/Material');
const MaterialCategory = require('../models/MaterialCategory');
const Product = require('../models/Product');

// 获取所有材质
exports.list = async (req, res) => {
  try {
    const { categoryId, status, page, limit } = req.query;
    const query = {};
    
    if (categoryId) query.categoryId = categoryId;
    if (status) query.status = status;
    
    // 如果没有指定 limit，则返回所有材质（不分页）
    let materialsQuery = Material.find(query).sort({ order: 1, createdAt: -1 });
    
    if (limit) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit);
      materialsQuery = materialsQuery.limit(limitNum).skip((pageNum - 1) * limitNum);
    }
    
    const materials = await materialsQuery;
    const total = await Material.countDocuments(query);
    
    res.json({ 
      success: true, 
      data: materials,
      pagination: {
        total,
        page: parseInt(page) || 1,
        limit: limit ? parseInt(limit) : total,
        pages: limit ? Math.ceil(total / parseInt(limit)) : 1
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 获取单个材质
exports.get = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, message: '材质不存在' });
    }
    res.json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 创建材质
exports.create = async (req, res) => {
  try {
    const material = await Material.create(req.body);
    res.status(201).json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 更新材质
exports.update = async (req, res) => {
  try {
    // 先获取原素材信息
    const oldMaterial = await Material.findById(req.params.id);
    if (!oldMaterial) {
      return res.status(404).json({ success: false, message: '材质不存在' });
    }
    
    const oldName = oldMaterial.name;
    const newName = req.body.name;
    
    console.log(`🔄 [素材更新] ID: ${req.params.id}`);
    console.log(`   数据库中素材名: "${oldName}"`);
    console.log(`   前端传递新名: "${newName}"`);
    
    let updatedProductCount = 0;
    let material = oldMaterial;
    
    // 移除不需要保存的字段
    const updateData = { ...req.body };
    delete updateData.originalGroupName;
    
    {
      // ========== 普通编辑模式 ==========
      // 直接更新单个素材
      material = await Material.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );
      
      // 如果名称变化，更新商品中的引用（精确匹配）
      if (oldName && newName && oldName !== newName) {
        console.log(`🔄 [普通编辑] 素材名变更: "${oldName}" -> "${newName}"`);
        
        const products = await Product.find({});
        for (const product of products) {
          let productModified = false;
          
          if (product.skus && Array.isArray(product.skus)) {
            for (const sku of product.skus) {
              if (sku.material && typeof sku.material === 'object') {
                for (const [categoryKey, materials] of Object.entries(sku.material)) {
                  if (Array.isArray(materials)) {
                    for (let i = 0; i < materials.length; i++) {
                      // 精确匹配，只更新完全相同的名称
                      if (materials[i] === oldName) {
                        materials[i] = newName;
                        productModified = true;
                      }
                    }
                  }
                }
              }
              
              const fieldsToUpdate = ['materialUpgradePrices', 'materialImages', 'materialDescriptions'];
              for (const field of fieldsToUpdate) {
                if (sku[field] && sku[field][oldName] !== undefined) {
                  sku[field][newName] = sku[field][oldName];
                  delete sku[field][oldName];
                  productModified = true;
                }
              }
            }
          }
          
          if (productModified) {
            await product.save();
            updatedProductCount++;
          }
        }
      }
    }
    
    let message = '素材已更新';
    if (updatedProductCount > 0) {
      message = `素材已更新，同时更新了 ${updatedProductCount} 个商品中的材质名称`;
    }
    
    res.json({ 
      success: true, 
      data: material,
      updatedProductCount,
      message
    });
  } catch (error) {
    console.error('更新素材失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 删除材质
exports.delete = async (req, res) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);
    
    if (!material) {
      return res.status(404).json({ success: false, message: '材质不存在' });
    }
    
    res.json({ success: true, message: '材质已删除' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 批量删除
exports.batchDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '请提供要删除的ID列表' });
    }
    
    const result = await Material.deleteMany({ _id: { $in: ids } });
    
    res.json({ 
      success: true, 
      message: `已删除${result.deletedCount}个材质` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 统计
exports.stats = async (req, res) => {
  try {
    const [total, pending, approved, rejected, offline] = await Promise.all([
      Material.countDocuments(),
      Material.countDocuments({ status: 'pending' }),
      Material.countDocuments({ status: 'approved' }),
      Material.countDocuments({ status: 'rejected' }),
      Material.countDocuments({ status: 'offline' })
    ]);
    
    res.json({ 
      success: true, 
      data: { total, pending, approved, rejected, offline } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== 分类相关 =====

// 获取所有分类
exports.listCategories = async (req, res) => {
  try {
    const categories = await MaterialCategory.find().sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 创建分类
exports.createCategory = async (req, res) => {
  try {
    const category = await MaterialCategory.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 更新分类
exports.updateCategory = async (req, res) => {
  try {
    const category = await MaterialCategory.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({ success: false, message: '分类不存在' });
    }
    
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 删除分类
exports.deleteCategory = async (req, res) => {
  try {
    // 检查是否有材质使用此分类
    const count = await Material.countDocuments({ categoryId: req.params.id });
    
    if (count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `该分类下还有${count}个材质，无法删除` 
      });
    }
    
    const category = await MaterialCategory.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({ success: false, message: '分类不存在' });
    }
    
    res.json({ success: true, message: '分类已删除' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 批量获取材质图片（根据名称列表，支持模糊匹配）
exports.getImagesByNames = async (req, res) => {
  try {
    const { names } = req.body;
    
    if (!names || !Array.isArray(names) || names.length === 0) {
      return res.json({ success: true, data: {} });
    }
    
    // 获取所有有图片的材质
    const allMaterials = await Material.find(
      { image: { $exists: true, $ne: '' } },
      { name: 1, image: 1, _id: 0 }
    ).lean();
    
    const result = {};
    
    // 辅助函数：提取核心名称（去掉数字后缀）
    const extractCoreName = (name) => {
      return name.replace(/[-_]?\d+$/, '').trim();
    };
    
    // 辅助函数：提取最后一部分（用于 "A类头层真皮-软椅-621" -> "软椅621"）
    const extractLastPart = (name) => {
      const parts = name.split(/[-–—]/);
      if (parts.length >= 2) {
        // 取最后两部分组合，如 "软椅" + "621" = "软椅621"
        const lastTwo = parts.slice(-2);
        if (/^\d+$/.test(lastTwo[1])) {
          return lastTwo[0] + lastTwo[1];
        }
        return parts[parts.length - 1];
      }
      return name;
    };
    
    for (const queryName of names) {
      if (!queryName) continue;
      
      // 1. 精确匹配
      let match = allMaterials.find(m => m.name === queryName);
      
      // 2. 素材库名称是查询名称的前缀
      if (!match) {
        match = allMaterials.find(m => queryName.startsWith(m.name + '-'));
      }
      
      // 3. 查询名称是素材库名称的前缀
      if (!match) {
        match = allMaterials.find(m => m.name.startsWith(queryName + '-'));
      }
      
      // 4. 提取核心名称匹配（去掉编号）
      if (!match) {
        const queryParts = queryName.split('-');
        for (let i = queryParts.length - 1; i >= 1; i--) {
          const prefix = queryParts.slice(0, i).join('-');
          match = allMaterials.find(m => m.name.startsWith(prefix + '-') || m.name === prefix);
          if (match) break;
        }
      }
      
      // 5. 匹配素材库名称的最后部分（如 "A类头层真皮-软椅-621" 匹配查询 "软椅621"）
      if (!match) {
        match = allMaterials.find(m => {
          const lastPart = extractLastPart(m.name);
          return lastPart === queryName;
        });
      }
      
      // 6. 素材库名称包含查询名称（模糊匹配）
      if (!match) {
        match = allMaterials.find(m => m.name.includes(queryName));
      }
      
      // 7. 查询名称包含素材库名称的核心部分
      if (!match) {
        match = allMaterials.find(m => {
          const coreName = extractCoreName(m.name);
          return queryName.includes(coreName) && coreName.length >= 2;
        });
      }
      
      // 8. 匹配末尾数字编号（如 "软椅621" 匹配 "...软银621"）
      if (!match) {
        const numMatch = queryName.match(/(\d{2,})$/);
        if (numMatch) {
          const numPart = numMatch[1];
          match = allMaterials.find(m => m.name.endsWith(numPart) || m.name.includes('-' + numPart));
        }
      }
      
      if (match && match.image) {
        result[queryName] = match.image;
      }
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
