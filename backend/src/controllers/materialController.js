const Material = require('../models/Material');
const MaterialCategory = require('../models/MaterialCategory');

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
    const material = await Material.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!material) {
      return res.status(404).json({ success: false, message: '材质不存在' });
    }
    
    res.json({ success: true, data: material });
  } catch (error) {
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
