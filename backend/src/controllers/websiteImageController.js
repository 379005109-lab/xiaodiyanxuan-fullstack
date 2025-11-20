const WebsiteImage = require('../models/WebsiteImage');
const { successResponse, errorResponse } = require('../utils/response');

// 获取所有首页图片配置
const getAllImages = async (req, res) => {
  try {
    const images = await WebsiteImage.find();
    
    // 格式化响应数据
    const data = {};
    images.forEach(img => {
      data[img.section] = img.items || [];
    });
    
    return successResponse(res, data, '获取成功');
  } catch (error) {
    console.error('获取首页图片配置失败:', error);
    return errorResponse(res, '获取首页图片配置失败', error.message, 500);
  }
};

// 获取特定部分的图片配置
const getImagesBySection = async (req, res) => {
  try {
    const { section } = req.params;
    
    // 验证 section 值
    const validSections = ['supply-chain', 'full-house', 'pricing', 'designer-resources', 'mini-program'];
    if (!validSections.includes(section)) {
      return errorResponse(res, '无效的分类', '分类值不正确', 400);
    }
    
    const images = await WebsiteImage.findOne({ section });
    
    if (!images) {
      return successResponse(res, { items: [] }, '获取成功');
    }
    
    return successResponse(res, images, '获取成功');
  } catch (error) {
    console.error('获取首页图片配置失败:', error);
    return errorResponse(res, '获取首页图片配置失败', error.message, 500);
  }
};

// 保存首页图片配置
const saveImages = async (req, res) => {
  try {
    const { section, items } = req.body;
    
    // 验证必填字段
    if (!section || !items) {
      return errorResponse(res, '缺少必填字段', 'section 和 items 为必填', 400);
    }
    
    // 验证 section 值
    const validSections = ['supply-chain', 'full-house', 'pricing', 'designer-resources', 'mini-program'];
    if (!validSections.includes(section)) {
      return errorResponse(res, '无效的分类', '分类值不正确', 400);
    }
    
    // 验证 items 是否为数组
    if (!Array.isArray(items)) {
      return errorResponse(res, '无效的数据格式', 'items 必须是数组', 400);
    }
    
    const result = await WebsiteImage.findOneAndUpdate(
      { section },
      {
        section,
        items,
        updatedAt: new Date(),
        updatedBy: req.user?._id
      },
      { upsert: true, new: true }
    );
    
    return successResponse(res, result, '配置已保存');
  } catch (error) {
    console.error('保存首页图片配置失败:', error);
    return errorResponse(res, '保存首页图片配置失败', error.message, 500);
  }
};

// 更新特定项目
const updateImage = async (req, res) => {
  try {
    const { section, itemId } = req.params;
    const { title, url, image, order } = req.body;
    
    // 验证 section 值
    const validSections = ['supply-chain', 'full-house', 'pricing', 'designer-resources', 'mini-program'];
    if (!validSections.includes(section)) {
      return errorResponse(res, '无效的分类', '分类值不正确', 400);
    }
    
    const result = await WebsiteImage.findOneAndUpdate(
      { section, 'items.id': itemId },
      {
        $set: {
          'items.$': {
            id: itemId,
            title: title || undefined,
            url: url || undefined,
            image: image || undefined,
            order: order !== undefined ? order : undefined,
            updatedAt: new Date()
          }
        }
      },
      { new: true }
    );
    
    if (!result) {
      return errorResponse(res, '项目不存在', '找不到指定的项目', 404);
    }
    
    return successResponse(res, result, '更新成功');
  } catch (error) {
    console.error('更新首页图片项目失败:', error);
    return errorResponse(res, '更新首页图片项目失败', error.message, 500);
  }
};

// 删除特定项目
const deleteImage = async (req, res) => {
  try {
    const { section, itemId } = req.params;
    
    // 验证 section 值
    const validSections = ['supply-chain', 'full-house', 'pricing', 'designer-resources', 'mini-program'];
    if (!validSections.includes(section)) {
      return errorResponse(res, '无效的分类', '分类值不正确', 400);
    }
    
    const result = await WebsiteImage.findOneAndUpdate(
      { section },
      { $pull: { items: { id: itemId } } },
      { new: true }
    );
    
    if (!result) {
      return errorResponse(res, '项目不存在', '找不到指定的项目', 404);
    }
    
    return successResponse(res, result, '已删除');
  } catch (error) {
    console.error('删除首页图片项目失败:', error);
    return errorResponse(res, '删除首页图片项目失败', error.message, 500);
  }
};

module.exports = {
  getAllImages,
  getImagesBySection,
  saveImages,
  updateImage,
  deleteImage
};
