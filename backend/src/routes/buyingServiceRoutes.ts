import express from 'express'
import {
  createBuyingServiceRequest,
  getAllBuyingServiceRequests,
  updateBuyingServiceRequestStatus,
  deleteBuyingServiceRequest
} from '../controllers/buyingServiceController'
const { auth } = require('../middleware/auth')

const router = express.Router()

// 用户创建预约
router.post('/', auth, createBuyingServiceRequest)

// 管理员获取所有预约
router.get('/', auth, getAllBuyingServiceRequests)

// 管理员更新预约状态
router.put('/:id/status', auth, updateBuyingServiceRequestStatus)

// 管理员删除预约
router.delete('/:id', auth, deleteBuyingServiceRequest)

export default router
