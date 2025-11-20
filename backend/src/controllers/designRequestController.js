const DesignRequest = require('../models/DesignRequest');
const { successResponse, errorResponse } = require('../utils/response');

// 获取所有设计需求
const getAllRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { userPhone: { $regex: search, $options: 'i' } }
      ];
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    const total = await DesignRequest.countDocuments(filter);
    const data = await DesignRequest.find(filter)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });
    
    const pagination = {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    };
    
    return successResponse(res, { data, pagination }, '获取成功');
  } catch (error) {
    console.error('获取设计需求列表失败:', error);
    return errorResponse(res, '获取设计需求列表失败', error.message, 500);
  }
};

// 获取单个设计需求详情
const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await DesignRequest.findById(id);
    
    if (!request) {
      return errorResponse(res, '设计需求不存在', '找不到指定的设计需求', 404);
    }
    
    return successResponse(res, request, '获取成功');
  } catch (error) {
    console.error('获取设计需求详情失败:', error);
    return errorResponse(res, '获取设计需求详情失败', error.message, 500);
  }
};

// 提交设计需求
const createRequest = async (req, res) => {
  try {
    const { userName, userPhone, userEmail, description, images } = req.body;
    
    // 验证必填字段
    if (!userName || !userPhone || !description) {
      return errorResponse(res, '缺少必填字段', '用户名、电话和描述为必填', 400);
    }
    
    const newRequest = new DesignRequest({
      userId: req.user?._id,
      userName,
      userPhone,
      userEmail,
      description,
      images: images || [],
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const result = await newRequest.save();
    
    return successResponse(res, result, '设计需求已提交');
  } catch (error) {
    console.error('提交设计需求失败:', error);
    return errorResponse(res, '提交设计需求失败', error.message, 500);
  }
};

// 更新设计需求状态
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // 验证状态值
    const validStatuses = ['pending', 'in_progress', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, '无效的状态值', '状态必须是 pending、in_progress、completed 或 rejected', 400);
    }
    
    const updateData = {
      status,
      updatedAt: new Date()
    };
    
    // 如果状态为 completed，设置完成时间
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }
    
    const result = await DesignRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!result) {
      return errorResponse(res, '设计需求不存在', '找不到指定的设计需求', 404);
    }
    
    return successResponse(res, result, '状态已更新');
  } catch (error) {
    console.error('更新设计需求状态失败:', error);
    return errorResponse(res, '更新设计需求状态失败', error.message, 500);
  }
};

// 更新设计需求备注
const updateNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const result = await DesignRequest.findByIdAndUpdate(
      id,
      {
        notes,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!result) {
      return errorResponse(res, '设计需求不存在', '找不到指定的设计需求', 404);
    }
    
    return successResponse(res, result, '备注已更新');
  } catch (error) {
    console.error('更新设计需求备注失败:', error);
    return errorResponse(res, '更新设计需求备注失败', error.message, 500);
  }
};

// 分配设计需求给设计师
const assignDesigner = async (req, res) => {
  try {
    const { id } = req.params;
    const { designerId } = req.body;
    
    if (!designerId) {
      return errorResponse(res, '缺少必填字段', 'designerId 为必填', 400);
    }
    
    const result = await DesignRequest.findByIdAndUpdate(
      id,
      {
        assignedTo: designerId,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!result) {
      return errorResponse(res, '设计需求不存在', '找不到指定的设计需求', 404);
    }
    
    return successResponse(res, result, '已分配设计师');
  } catch (error) {
    console.error('分配设计师失败:', error);
    return errorResponse(res, '分配设计师失败', error.message, 500);
  }
};

// 删除设计需求
const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await DesignRequest.findByIdAndDelete(id);
    
    if (!result) {
      return errorResponse(res, '设计需求不存在', '找不到指定的设计需求', 404);
    }
    
    return successResponse(res, {}, '已删除');
  } catch (error) {
    console.error('删除设计需求失败:', error);
    return errorResponse(res, '删除设计需求失败', error.message, 500);
  }
};

// 获取设计需求统计
const getStats = async (req, res) => {
  try {
    const stats = await DesignRequest.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
        }
      }
    ]);
    
    const data = stats[0] || {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      rejected: 0
    };
    
    return successResponse(res, data, '获取成功');
  } catch (error) {
    console.error('获取设计需求统计失败:', error);
    return errorResponse(res, '获取设计需求统计失败', error.message, 500);
  }
};

module.exports = {
  getAllRequests,
  getRequestById,
  createRequest,
  updateStatus,
  updateNotes,
  assignDesigner,
  deleteRequest,
  getStats
};
