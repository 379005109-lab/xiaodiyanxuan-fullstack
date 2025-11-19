const jwt = require('jsonwebtoken')
const { errorResponse } = require('../utils/response')

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(401).json(errorResponse('No token provided', 401))
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch (err) {
    return res.status(401).json(errorResponse('Invalid token', 401))
  }
}

const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.userId = decoded.userId
    }
    next()
  } catch (err) {
    next()
  }
}

module.exports = { auth, optionalAuth }
