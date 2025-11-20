const { errorResponse } = require('../utils/response')

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err)
  
  const status = err.status || 500
  const message = err.message || 'Internal Server Error'
  
  res.status(status).json(errorResponse(message, status))
}

module.exports = errorHandler
