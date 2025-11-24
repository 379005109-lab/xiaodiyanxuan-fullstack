const { successResponse, errorResponse } = require('../utils/response')
const SiteConfig = require('../models/SiteConfig')

// 获取所有配置
const list = async (req, res) => {
  try {
    const configs = await SiteConfig.find().lean()
    const configMap = {}
    configs.forEach(config => {
      configMap[config.key] = config.value
    })
    res.json(successResponse(configMap))
  } catch (err) {
    console.error('List site configs error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 获取单个配置
const get = async (req, res) => {
  try {
    const { key } = req.params
    const config = await SiteConfig.findOne({ key })
    
    if (!config) {
      return res.status(404).json(errorResponse('Config not found', 404))
    }
    
    res.json(successResponse(config))
  } catch (err) {
    console.error('Get site config error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 更新配置
const update = async (req, res) => {
  try {
    const { key } = req.params
    const { value, type, label, description } = req.body
    
    const config = await SiteConfig.findOneAndUpdate(
      { key },
      { 
        value, 
        type: type || 'text',
        label,
        description,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    )
    
    res.json(successResponse(config))
  } catch (err) {
    console.error('Update site config error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 批量更新配置
const batchUpdate = async (req, res) => {
  try {
    const { configs } = req.body // { key1: value1, key2: value2, ... }
    
    if (!configs || typeof configs !== 'object') {
      return res.status(400).json(errorResponse('Invalid configs format', 400))
    }
    
    const updates = Object.entries(configs).map(([key, value]) => 
      SiteConfig.findOneAndUpdate(
        { key },
        { value, updatedAt: new Date() },
        { upsert: true, new: true }
      )
    )
    
    await Promise.all(updates)
    
    res.json(successResponse({ message: 'Configs updated successfully' }))
  } catch (err) {
    console.error('Batch update site configs error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

module.exports = {
  list,
  get,
  update,
  batchUpdate
}
