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
    
    // 更新素材
    const material = await Material.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    // 如果素材名称发生变化，同步更新
    let updatedMaterialCount = 0;
    let updatedProductCount = 0;
    
    if (oldName && newName && oldName !== newName) {
      console.log(`🔄 [素材更新] 名称变更: "${oldName}" -> "${newName}"`);
      
      // 查找所有以旧名称为前缀的素材（子SKU）
      // 无论当前素材是否标记为类别，只要有子素材就更新
      // 格式: "三级分类名-SKU型号" 如 "A类新宝马-63"
      const childMaterials = await Material.find({
        name: { $regex: `^${oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-` }
      });
      
      const hasChildren = childMaterials.length > 0;
      
      if (hasChildren) {
        console.log(`🔄 [分类更新] 发现 ${childMaterials.length} 个子素材，开始更新名称前缀...`);
        
        for (const child of childMaterials) {
          const oldChildName = child.name;
          const newChildName = child.name.replace(oldName, newName);
          
          await Material.findByIdAndUpdate(child._id, { name: newChildName });
          updatedMaterialCount++;
          console.log(`  ✅ 更新子素材: "${oldChildName}" -> "${newChildName}"`);
        }
        
        console.log(`🔄 [分类更新] 共更新 ${updatedMaterialCount} 个子素材`);
      }
      
      // 同步更新所有商品SKU中的材质名称
      console.log(`🔄 [商品更新] 开始同步更新商品...`);
      const products = await Product.find({});
      
      // 构建需要替换的名称映射（旧名 -> 新名）
      const nameReplacements = new Map();
      nameReplacements.set(oldName, newName);
      
      // 如果有子素材，添加所有子SKU的名称映射
      if (hasChildren) {
        const updatedChildMaterials = await Material.find({
          name: { $regex: `^${newName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-` }
        });
        for (const child of updatedChildMaterials) {
          // 计算对应的旧名称
          const oldChildName = child.name.replace(newName, oldName);
          nameReplacements.set(oldChildName, child.name);
        }
      }
      
      for (const product of products) {
        let productModified = false;
        
        if (product.skus && Array.isArray(product.skus)) {
          for (const sku of product.skus) {
            // 更新 material 字段中的材质名称
            if (sku.material && typeof sku.material === 'object') {
              for (const [categoryKey, materials] of Object.entries(sku.material)) {
                if (Array.isArray(materials)) {
                  for (let i = 0; i < materials.length; i++) {
                    const materialName = materials[i];
                    // 精确匹配
                    if (nameReplacements.has(materialName)) {
                      const newMaterialName = nameReplacements.get(materialName);
                      materials[i] = newMaterialName;
                      productModified = true;
                      console.log(`  ✅ 更新商品 "${product.name}" 材质: "${materialName}" -> "${newMaterialName}"`);
                    }
                    // 前缀匹配（针对有子素材的分类更新）
                    else if (hasChildren && materialName.startsWith(oldName + '-')) {
                      const newMaterialName = materialName.replace(oldName, newName);
                      materials[i] = newMaterialName;
                      productModified = true;
                      console.log(`  ✅ 更新商品 "${product.name}" 材质(前缀): "${materialName}" -> "${newMaterialName}"`);
                    }
                  }
                }
              }
            }
            
            // 更新 materialUpgradePrices/materialImages/materialDescriptions 中的键名
            const fieldsToUpdate = ['materialUpgradePrices', 'materialImages', 'materialDescriptions'];
            for (const field of fieldsToUpdate) {
              if (sku[field]) {
                const keysToUpdate = [];
                for (const key of Object.keys(sku[field])) {
                  if (nameReplacements.has(key)) {
                    keysToUpdate.push({ oldKey: key, newKey: nameReplacements.get(key) });
                  } else if (hasChildren && key.startsWith(oldName + '-')) {
                    keysToUpdate.push({ oldKey: key, newKey: key.replace(oldName, newName) });
                  }
                }
                for (const { oldKey, newKey } of keysToUpdate) {
                  sku[field][newKey] = sku[field][oldKey];
                  delete sku[field][oldKey];
                  productModified = true;
                }
              }
            }
          }
        }
        
        // 保存修改后的商品
        if (productModified) {
          await product.save();
          updatedProductCount++;
        }
      }
      
      console.log(`🔄 [素材更新] 同步完成，更新 ${updatedMaterialCount} 个子素材，${updatedProductCount} 个商品`);
    }
    
    let message = '素材已更新';
    if (updatedMaterialCount > 0 || updatedProductCount > 0) {
      const parts = [];
      if (updatedMaterialCount > 0) parts.push(`${updatedMaterialCount} 个子素材`);
      if (updatedProductCount > 0) parts.push(`${updatedProductCount} 个商品`);
      message = `素材已更新，同时更新了 ${parts.join(' 和 ')} 中的材质名称`;
    }
    
    res.json({ 
      success: true, 
      data: material,
      updatedMaterialCount,
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
