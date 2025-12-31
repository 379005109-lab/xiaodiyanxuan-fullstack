const { CommissionSystem, ChannelNode, CHANNEL_TYPES, ROLE_CODES } = require('../models/CommissionSystem')
const Manufacturer = require('../models/Manufacturer')

// 获取厂家的分成体系
exports.getByManufacturer = async (req, res) => {
  try {
    const { manufacturerId } = req.params
    const userId = req.user._id
    const userRole = req.user.role
    
    let system = await CommissionSystem.findOne({ manufacturerId })
      .populate('createdBy', 'username nickname')
    
    if (!system) {
      // 如果不存在，获取厂家信息准备创建
      const manufacturer = await Manufacturer.findById(manufacturerId)
      if (!manufacturer) {
        return res.status(404).json({ message: '厂家不存在' })
      }
      
      return res.json({
        exists: false,
        manufacturer: {
          _id: manufacturer._id,
          name: manufacturer.name,
          code: manufacturer.code || manufacturer.name.substring(0, 2).toUpperCase()
        }
      })
    }
    
    // 获取所有渠道节点
    let channels = await ChannelNode.find({ commissionSystemId: system._id })
      .populate('createdBy', 'username nickname')
      .populate('userId', 'username nickname')
      .sort({ level: 1, createdAt: 1 })
    
    // 可见性控制：非管理员只能看到自己创建的渠道及其子渠道
    const isAdmin = userRole === 'admin' || userRole === 'super_admin'
    const isManufacturerOwner = system.createdBy?.toString() === userId.toString()
    
    if (!isAdmin && !isManufacturerOwner) {
      // 找到当前用户创建的渠道
      const userChannelIds = channels
        .filter(c => c.createdBy?._id?.toString() === userId.toString())
        .map(c => c._id.toString())
      
      // 过滤：只保留用户创建的渠道及其子渠道
      channels = channels.filter(channel => {
        // 用户自己创建的
        if (channel.createdBy?._id?.toString() === userId.toString()) {
          return true
        }
        // 是用户创建渠道的子渠道
        if (channel.path.some(p => userChannelIds.includes(p.toString()))) {
          return true
        }
        // 是用户的父级渠道（需要显示路径）
        const userChannel = channels.find(c => 
          c.createdBy?._id?.toString() === userId.toString() &&
          c.path.includes(channel._id)
        )
        if (userChannel) {
          // 隐藏敏感信息
          return {
            ...channel.toObject(),
            commissionRate: null, // 隐藏具体分成比例
            contact: null,
            notes: null,
            _hiddenInfo: true
          }
        }
        return false
      })
    }
    
    // 构建树形结构
    const channelTree = buildChannelTree(channels)
    
    // 计算统计信息
    const stats = {
      totalChannels: channels.length,
      totalAllocatedRate: system.allocatedRate,
      availableRate: system.totalMarginRate - system.factoryRetainRate - system.allocatedRate,
      byType: {}
    }
    
    Object.values(CHANNEL_TYPES).forEach(type => {
      stats.byType[type] = channels.filter(c => c.type === type).length
    })
    
    res.json({
      exists: true,
      system: {
        _id: system._id,
        manufacturerId: system.manufacturerId,
        manufacturerName: system.manufacturerName,
        manufacturerCode: system.manufacturerCode,
        totalMarginRate: system.totalMarginRate,
        marginType: system.marginType,
        factoryRetainRate: system.factoryRetainRate,
        allocatedRate: system.allocatedRate,
        availableRate: system.totalMarginRate - system.factoryRetainRate - system.allocatedRate,
        status: system.status,
        version: system.version,
        createdAt: system.createdAt,
        updatedAt: system.updatedAt
      },
      channels: channelTree,
      channelList: channels,
      stats,
      isAdmin,
      isManufacturerOwner,
      channelTypes: CHANNEL_TYPES,
      roleCodes: ROLE_CODES
    })
  } catch (error) {
    console.error('获取分成体系失败:', error)
    res.status(500).json({ message: '获取分成体系失败', error: error.message })
  }
}

// 创建分成体系
exports.createSystem = async (req, res) => {
  try {
    const { manufacturerId } = req.params
    const { totalMarginRate, marginType, factoryRetainRate, manufacturerCode } = req.body
    const userId = req.user._id
    
    // 检查是否已存在
    const existing = await CommissionSystem.findOne({ manufacturerId })
    if (existing) {
      return res.status(400).json({ message: '该厂家已存在分成体系' })
    }
    
    // 获取厂家信息
    const manufacturer = await Manufacturer.findById(manufacturerId)
    if (!manufacturer) {
      return res.status(404).json({ message: '厂家不存在' })
    }
    
    // 生成厂家代码（如果未提供）
    const code = manufacturerCode || generateManufacturerCode(manufacturer.name)
    
    const system = new CommissionSystem({
      manufacturerId,
      manufacturerName: manufacturer.name,
      manufacturerCode: code,
      totalMarginRate: totalMarginRate || 40,
      marginType: marginType || 'fixed',
      factoryRetainRate: factoryRetainRate || 0,
      allocatedRate: 0,
      codeCounter: 0,
      status: 'active',
      createdBy: userId,
      updatedBy: userId
    })
    
    await system.save()
    
    res.status(201).json({
      message: '分成体系创建成功',
      system
    })
  } catch (error) {
    console.error('创建分成体系失败:', error)
    res.status(500).json({ message: '创建分成体系失败', error: error.message })
  }
}

// 更新分成体系
exports.updateSystem = async (req, res) => {
  try {
    const { manufacturerId } = req.params
    const { totalMarginRate, marginType, factoryRetainRate, manufacturerCode, status, notes } = req.body
    const userId = req.user._id
    
    const system = await CommissionSystem.findOne({ manufacturerId })
    if (!system) {
      return res.status(404).json({ message: '分成体系不存在' })
    }
    
    // 验证新的毛利率不能小于已分配的
    if (totalMarginRate !== undefined) {
      const minRequired = system.factoryRetainRate + system.allocatedRate
      if (totalMarginRate < minRequired) {
        return res.status(400).json({ 
          message: `总毛利率不能小于已分配的比例 ${minRequired}%` 
        })
      }
      system.totalMarginRate = totalMarginRate
    }
    
    if (marginType) system.marginType = marginType
    if (factoryRetainRate !== undefined) {
      const maxRetain = system.totalMarginRate - system.allocatedRate
      if (factoryRetainRate > maxRetain) {
        return res.status(400).json({ 
          message: `厂家自留比例不能超过 ${maxRetain}%` 
        })
      }
      system.factoryRetainRate = factoryRetainRate
    }
    if (manufacturerCode) system.manufacturerCode = manufacturerCode.toUpperCase()
    if (status) system.status = status
    if (notes !== undefined) system.notes = notes
    
    system.updatedBy = userId
    await system.save()
    
    res.json({
      message: '分成体系更新成功',
      system
    })
  } catch (error) {
    console.error('更新分成体系失败:', error)
    res.status(500).json({ message: '更新分成体系失败', error: error.message })
  }
}

// 创建渠道节点
exports.createChannel = async (req, res) => {
  try {
    const { manufacturerId } = req.params
    const { name, type, parentId, commissionRate, contact, notes } = req.body
    const userId = req.user._id
    
    // 获取分成体系
    const system = await CommissionSystem.findOne({ manufacturerId })
    if (!system) {
      return res.status(404).json({ message: '分成体系不存在，请先创建' })
    }
    
    let level = 0
    let path = []
    let parentNode = null
    let availableRate = system.totalMarginRate - system.factoryRetainRate - system.allocatedRate
    
    // 如果有父级渠道
    if (parentId) {
      parentNode = await ChannelNode.findById(parentId)
      if (!parentNode) {
        return res.status(404).json({ message: '父级渠道不存在' })
      }
      
      // 验证父级渠道属于同一体系
      if (parentNode.commissionSystemId.toString() !== system._id.toString()) {
        return res.status(400).json({ message: '父级渠道不属于该分成体系' })
      }
      
      level = parentNode.level + 1
      path = [...parentNode.path, parentNode._id]
      availableRate = parentNode.commissionRate - parentNode.allocatedRate
    }
    
    // 验证分成比例
    if (commissionRate > availableRate) {
      return res.status(400).json({ 
        message: `分成比例超出可分配范围，当前可分配: ${availableRate}%` 
      })
    }
    
    // 生成渠道编码
    const code = await CommissionSystem.generateChannelCode(system._id, type)
    
    // 创建渠道节点
    const channel = new ChannelNode({
      code,
      name,
      type,
      parentId: parentId || null,
      commissionSystemId: system._id,
      level,
      path,
      commissionRate,
      allocatedRate: 0,
      availableRate: commissionRate,
      contact,
      notes,
      createdBy: userId,
      isActive: true
    })
    
    await channel.save()
    
    // 更新父级或体系的已分配比例
    if (parentNode) {
      parentNode.allocatedRate += commissionRate
      parentNode.availableRate = parentNode.commissionRate - parentNode.allocatedRate
      await parentNode.save()
    } else {
      system.allocatedRate += commissionRate
      await system.save()
    }
    
    res.status(201).json({
      message: '渠道创建成功',
      channel,
      generatedCode: code
    })
  } catch (error) {
    console.error('创建渠道失败:', error)
    res.status(500).json({ message: '创建渠道失败', error: error.message })
  }
}

// 更新渠道节点
exports.updateChannel = async (req, res) => {
  try {
    const { channelId } = req.params
    const { name, commissionRate, contact, notes, isActive } = req.body
    const userId = req.user._id
    const userRole = req.user.role
    
    const channel = await ChannelNode.findById(channelId)
    if (!channel) {
      return res.status(404).json({ message: '渠道不存在' })
    }
    
    // 权限检查：只有创建者或管理员可以编辑
    const isAdmin = userRole === 'admin' || userRole === 'super_admin'
    if (!isAdmin && channel.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: '无权限修改此渠道' })
    }
    
    // 更新分成比例
    if (commissionRate !== undefined && commissionRate !== channel.commissionRate) {
      const system = await CommissionSystem.findById(channel.commissionSystemId)
      let parent = channel.parentId ? await ChannelNode.findById(channel.parentId) : null
      
      const oldRate = channel.commissionRate
      const diff = commissionRate - oldRate
      
      // 验证新比例
      let availableRate
      if (parent) {
        availableRate = parent.commissionRate - parent.allocatedRate + oldRate
      } else {
        availableRate = system.totalMarginRate - system.factoryRetainRate - system.allocatedRate + oldRate
      }
      
      if (commissionRate > availableRate) {
        return res.status(400).json({ 
          message: `分成比例超出可分配范围，最大可设置: ${availableRate}%` 
        })
      }
      
      // 验证不能小于已分配给下级的
      if (commissionRate < channel.allocatedRate) {
        return res.status(400).json({ 
          message: `分成比例不能小于已分配给下级的 ${channel.allocatedRate}%` 
        })
      }
      
      channel.commissionRate = commissionRate
      channel.availableRate = commissionRate - channel.allocatedRate
      
      // 更新父级或体系的已分配比例
      if (parent) {
        parent.allocatedRate += diff
        parent.availableRate = parent.commissionRate - parent.allocatedRate
        await parent.save()
      } else {
        system.allocatedRate += diff
        await system.save()
      }
    }
    
    if (name) channel.name = name
    if (contact) channel.contact = { ...channel.contact, ...contact }
    if (notes !== undefined) channel.notes = notes
    if (isActive !== undefined) channel.isActive = isActive
    
    await channel.save()
    
    res.json({
      message: '渠道更新成功',
      channel
    })
  } catch (error) {
    console.error('更新渠道失败:', error)
    res.status(500).json({ message: '更新渠道失败', error: error.message })
  }
}

// 删除渠道节点
exports.deleteChannel = async (req, res) => {
  try {
    const { channelId } = req.params
    const userId = req.user._id
    const userRole = req.user.role
    
    const channel = await ChannelNode.findById(channelId)
    if (!channel) {
      return res.status(404).json({ message: '渠道不存在' })
    }
    
    // 权限检查
    const isAdmin = userRole === 'admin' || userRole === 'super_admin'
    if (!isAdmin && channel.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: '无权限删除此渠道' })
    }
    
    // 检查是否有子渠道
    const childCount = await ChannelNode.countDocuments({ parentId: channelId })
    if (childCount > 0) {
      return res.status(400).json({ 
        message: `该渠道下有 ${childCount} 个子渠道，请先删除子渠道` 
      })
    }
    
    // 释放分成比例
    const system = await CommissionSystem.findById(channel.commissionSystemId)
    if (channel.parentId) {
      const parent = await ChannelNode.findById(channel.parentId)
      if (parent) {
        parent.allocatedRate -= channel.commissionRate
        parent.availableRate = parent.commissionRate - parent.allocatedRate
        await parent.save()
      }
    } else {
      system.allocatedRate -= channel.commissionRate
      await system.save()
    }
    
    await channel.deleteOne()
    
    res.json({ message: '渠道删除成功' })
  } catch (error) {
    console.error('删除渠道失败:', error)
    res.status(500).json({ message: '删除渠道失败', error: error.message })
  }
}

// 获取渠道详情（包含子渠道）
exports.getChannelDetail = async (req, res) => {
  try {
    const { channelId } = req.params
    const userId = req.user._id
    const userRole = req.user.role
    
    const channel = await ChannelNode.findById(channelId)
      .populate('createdBy', 'username nickname')
      .populate('userId', 'username nickname')
      .populate('parentId', 'name code')
    
    if (!channel) {
      return res.status(404).json({ message: '渠道不存在' })
    }
    
    // 获取子渠道
    const children = await ChannelNode.find({ parentId: channelId })
      .populate('createdBy', 'username nickname')
      .sort({ createdAt: 1 })
    
    // 可见性控制
    const isAdmin = userRole === 'admin' || userRole === 'super_admin'
    const isCreator = channel.createdBy?._id?.toString() === userId.toString()
    
    let visibleChildren = children
    if (!isAdmin && !isCreator) {
      // 非管理员且非创建者，只显示自己创建的子渠道
      visibleChildren = children.filter(c => 
        c.createdBy?._id?.toString() === userId.toString()
      )
    }
    
    res.json({
      channel,
      children: visibleChildren,
      stats: {
        childCount: children.length,
        visibleChildCount: visibleChildren.length,
        allocatedRate: channel.allocatedRate,
        availableRate: channel.commissionRate - channel.allocatedRate
      },
      permissions: {
        canEdit: isAdmin || isCreator,
        canDelete: isAdmin || isCreator,
        canAddChild: true
      }
    })
  } catch (error) {
    console.error('获取渠道详情失败:', error)
    res.status(500).json({ message: '获取渠道详情失败', error: error.message })
  }
}

// 获取所有分成体系列表
exports.listSystems = async (req, res) => {
  try {
    const systems = await CommissionSystem.find({ status: { $ne: 'archived' } })
      .populate('manufacturerId', 'name status')
      .populate('createdBy', 'username nickname')
      .sort({ createdAt: -1 })
    
    // 获取每个体系的渠道统计
    const systemsWithStats = await Promise.all(systems.map(async (system) => {
      const channelCount = await ChannelNode.countDocuments({ 
        commissionSystemId: system._id,
        isActive: true
      })
      
      return {
        ...system.toObject(),
        channelCount,
        availableRate: system.totalMarginRate - system.factoryRetainRate - system.allocatedRate
      }
    }))
    
    res.json({
      systems: systemsWithStats,
      channelTypes: CHANNEL_TYPES,
      roleCodes: ROLE_CODES
    })
  } catch (error) {
    console.error('获取分成体系列表失败:', error)
    res.status(500).json({ message: '获取分成体系列表失败', error: error.message })
  }
}

// 辅助函数：构建树形结构
function buildChannelTree(channels) {
  const map = {}
  const roots = []
  
  // 创建映射
  channels.forEach(channel => {
    map[channel._id.toString()] = {
      ...channel.toObject(),
      children: []
    }
  })
  
  // 构建树
  channels.forEach(channel => {
    const node = map[channel._id.toString()]
    if (channel.parentId) {
      const parent = map[channel.parentId.toString()]
      if (parent) {
        parent.children.push(node)
      } else {
        // 父级不可见时作为根节点
        roots.push(node)
      }
    } else {
      roots.push(node)
    }
  })
  
  return roots
}

// 辅助函数：生成厂家代码
function generateManufacturerCode(name) {
  // 简单的拼音首字母提取（实际项目中可使用 pinyin 库）
  const codeMap = {
    '各色': 'GS',
    '诗歌': 'SG',
    '科凡': 'KF',
    '美的': 'MD',
    '格力': 'GL',
    '海尔': 'HE'
  }
  
  return codeMap[name] || name.substring(0, 2).toUpperCase()
}
