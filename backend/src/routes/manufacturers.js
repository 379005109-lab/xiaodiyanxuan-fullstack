const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const { list, listAll, get, create, update, remove } = require('../controllers/manufacturerController')

// 需要认证
router.use(auth)

// GET /api/manufacturers - 获取厂家列表（分页）
router.get('/', list)

// GET /api/manufacturers/all - 获取所有厂家（不分页，用于下拉选择）
router.get('/all', listAll)

// GET /api/manufacturers/:id - 获取单个厂家
router.get('/:id', get)

// POST /api/manufacturers - 创建厂家
router.post('/', create)

// PUT /api/manufacturers/:id - 更新厂家
router.put('/:id', update)

// DELETE /api/manufacturers/:id - 删除厂家
router.delete('/:id', remove)

// POST /api/manufacturers/:id/set-password - 设置厂家登录账号密码
const Manufacturer = require('../models/Manufacturer')
router.post('/:id/set-password', async (req, res) => {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '请提供用户名和密码' })
    }
    
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码至少6位' })
    }
    
    // 检查用户名是否已存在
    const existing = await Manufacturer.findOne({ username, _id: { $ne: req.params.id } })
    if (existing) {
      return res.status(400).json({ success: false, message: '用户名已被使用' })
    }
    
    const manufacturer = await Manufacturer.findById(req.params.id)
    if (!manufacturer) {
      return res.status(404).json({ success: false, message: '厂家不存在' })
    }
    
    manufacturer.username = username
    manufacturer.password = password
    await manufacturer.save()
    
    res.json({ success: true, message: '账号密码设置成功' })
  } catch (error) {
    console.error('设置密码失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

module.exports = router
