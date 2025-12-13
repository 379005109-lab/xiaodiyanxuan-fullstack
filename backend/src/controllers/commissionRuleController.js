const CommissionRule = require('../models/CommissionRule')
const Manufacturer = require('../models/Manufacturer')

// 获取所有分成规则（按厂家分组）
exports.list = async (req, res) => {
  try {
    const { status = 'active' } = req.query
    
    const rules = await CommissionRule.find({ status })
      .sort({ manufacturerName: 1 })
      .lean()
    
    res.json({
      success: true,
      data: rules
    })
  } catch (error) {
    console.error('获取分成规则列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取分成规则列表失败'
    })
  }
}

// 获取单个厂家的分成规则
exports.getByManufacturer = async (req, res) => {
  try {
    const { manufacturerId } = req.params
    
    let rule = await CommissionRule.findOne({ 
      manufacturerId,
      status: 'active'
    }).lean()
    
    // 如果没有规则，返回空但带厂家信息
    if (!rule) {
      const manufacturer = await Manufacturer.findById(manufacturerId)
      if (!manufacturer) {
        return res.status(404).json({
          success: false,
          message: '厂家不存在'
        })
      }
      
      return res.json({
        success: true,
        data: null,
        manufacturer: {
          _id: manufacturer._id,
          name: manufacturer.fullName || manufacturer.name,
          code: manufacturer.shortName || manufacturer.code
        }
      })
    }
    
    res.json({
      success: true,
      data: rule
    })
  } catch (error) {
    console.error('获取厂家分成规则失败:', error)
    res.status(500).json({
      success: false,
      message: '获取分成规则失败'
    })
  }
}

// 创建或更新分成规则
exports.save = async (req, res) => {
  try {
    const { manufacturerId } = req.params
    const { channels, notes, version } = req.body
    
    // 检查厂家是否存在
    const manufacturer = await Manufacturer.findById(manufacturerId)
    if (!manufacturer) {
      return res.status(404).json({
        success: false,
        message: '厂家不存在'
      })
    }
    
    // 查找现有规则
    let rule = await CommissionRule.findOne({ 
      manufacturerId,
      status: 'active'
    })
    
    if (rule) {
      // 更新现有规则
      rule.channels = channels
      rule.notes = notes
      rule.version = version || rule.version
      rule.updatedBy = req.user?._id
      await rule.save()
    } else {
      // 创建新规则
      rule = new CommissionRule({
        manufacturerId,
        manufacturerName: manufacturer.fullName || manufacturer.name,
        manufacturerCode: manufacturer.shortName || manufacturer.code || 'DEFAULT',
        channels: channels || [],
        notes,
        version: version || '1.0',
        status: 'active',
        createdBy: req.user?._id,
        updatedBy: req.user?._id
      })
      await rule.save()
    }
    
    res.json({
      success: true,
      message: '分成规则保存成功',
      data: rule
    })
  } catch (error) {
    console.error('保存分成规则失败:', error)
    res.status(500).json({
      success: false,
      message: '保存分成规则失败'
    })
  }
}

// 添加渠道
exports.addChannel = async (req, res) => {
  try {
    const { manufacturerId } = req.params
    const channelData = req.body
    
    let rule = await CommissionRule.findOne({ 
      manufacturerId,
      status: 'active'
    })
    
    if (!rule) {
      // 如果没有规则，先创建
      const manufacturer = await Manufacturer.findById(manufacturerId)
      if (!manufacturer) {
        return res.status(404).json({
          success: false,
          message: '厂家不存在'
        })
      }
      
      rule = new CommissionRule({
        manufacturerId,
        manufacturerName: manufacturer.fullName || manufacturer.name,
        manufacturerCode: manufacturer.shortName || manufacturer.code || 'DEFAULT',
        channels: [],
        status: 'active',
        createdBy: req.user?._id
      })
    }
    
    // 计算新渠道的索引
    const maxIndex = rule.channels.reduce((max, ch) => Math.max(max, ch.index), 0)
    channelData.index = maxIndex + 1
    
    rule.channels.push(channelData)
    rule.updatedBy = req.user?._id
    await rule.save()
    
    res.json({
      success: true,
      message: '渠道添加成功',
      data: rule
    })
  } catch (error) {
    console.error('添加渠道失败:', error)
    res.status(500).json({
      success: false,
      message: '添加渠道失败'
    })
  }
}

// 更新渠道
exports.updateChannel = async (req, res) => {
  try {
    const { manufacturerId, channelId } = req.params
    const channelData = req.body
    
    const rule = await CommissionRule.findOne({ 
      manufacturerId,
      status: 'active'
    })
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: '分成规则不存在'
      })
    }
    
    const channel = rule.channels.id(channelId)
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: '渠道不存在'
      })
    }
    
    // 更新渠道数据
    Object.assign(channel, channelData)
    rule.updatedBy = req.user?._id
    await rule.save()
    
    res.json({
      success: true,
      message: '渠道更新成功',
      data: rule
    })
  } catch (error) {
    console.error('更新渠道失败:', error)
    res.status(500).json({
      success: false,
      message: '更新渠道失败'
    })
  }
}

// 删除渠道
exports.deleteChannel = async (req, res) => {
  try {
    const { manufacturerId, channelId } = req.params
    
    const rule = await CommissionRule.findOne({ 
      manufacturerId,
      status: 'active'
    })
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: '分成规则不存在'
      })
    }
    
    rule.channels.pull(channelId)
    rule.updatedBy = req.user?._id
    await rule.save()
    
    res.json({
      success: true,
      message: '渠道删除成功',
      data: rule
    })
  } catch (error) {
    console.error('删除渠道失败:', error)
    res.status(500).json({
      success: false,
      message: '删除渠道失败'
    })
  }
}

// 添加子规则
exports.addSubRule = async (req, res) => {
  try {
    const { manufacturerId, channelId } = req.params
    const subRuleData = req.body
    
    const rule = await CommissionRule.findOne({ 
      manufacturerId,
      status: 'active'
    })
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: '分成规则不存在'
      })
    }
    
    const channel = rule.channels.id(channelId)
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: '渠道不存在'
      })
    }
    
    channel.subRules.push(subRuleData)
    rule.updatedBy = req.user?._id
    await rule.save()
    
    res.json({
      success: true,
      message: '子规则添加成功',
      data: rule
    })
  } catch (error) {
    console.error('添加子规则失败:', error)
    res.status(500).json({
      success: false,
      message: '添加子规则失败'
    })
  }
}

// 删除分成规则
exports.delete = async (req, res) => {
  try {
    const { manufacturerId } = req.params
    
    const rule = await CommissionRule.findOneAndUpdate(
      { manufacturerId, status: 'active' },
      { status: 'archived', updatedBy: req.user?._id },
      { new: true }
    )
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: '分成规则不存在'
      })
    }
    
    res.json({
      success: true,
      message: '分成规则已删除'
    })
  } catch (error) {
    console.error('删除分成规则失败:', error)
    res.status(500).json({
      success: false,
      message: '删除分成规则失败'
    })
  }
}
