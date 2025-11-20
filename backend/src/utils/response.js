// Unified response format - 前端期望的格式
const successResponse = (data = null, message = '操作成功') => {
  return {
    success: true,
    data,
    message
  }
}

const errorResponse = (message = '错误', code = 400, data = null) => {
  return {
    success: false,
    message,
    error: data,
    code
  }
}

const paginatedResponse = (list = [], total = 0, page = 1, pageSize = 10) => {
  return {
    success: true,
    data: list,
    pagination: {
      page: parseInt(page),
      limit: parseInt(pageSize),
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse
}
