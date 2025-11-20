const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const { login, refresh, logout } = require('../controllers/authController')

// POST /api/auth/login - Universal login (username/password or code)
router.post('/login', login)

// POST /api/auth/wxlogin - WeChat login (backward compatibility)
router.post('/wxlogin', login)

// POST /api/auth/refresh - Refresh token
router.post('/refresh', auth, refresh)

// POST /api/auth/logout - Logout
router.post('/logout', auth, logout)

module.exports = router
