/**
 * 店铺信息相关接口（小程序端）
 */
const express = require('express')
const router = express.Router()

// ========== 响应格式 ==========
const success = (data, message = 'success') => ({ code: 0, data, message })
const error = (code, message) => ({ code, message })

// 图片URL处理 — 只返回相对路径
const getImageUrl = (img) => {
  if (!img) return ''
  if (img.startsWith('http')) return img
  return `/api/files/${img}`
}

/**
 * GET /api/miniapp/shop/info
 * 获取店铺信息（公开接口，无需登录）
 * Query: manufacturerId - 可选，指定厂家
 */
router.get('/info', async (req, res) => {
  try {
    const StoreDecoration = require('../models/StoreDecoration')
    const Manufacturer = require('../models/Manufacturer')

    const { manufacturerId } = req.query

    // 1. 从店铺装修配置中读取 storeHeader
    const query = { isDefault: true, type: 'homepage' }
    if (manufacturerId) {
      query.manufacturerId = manufacturerId
      query.ownerType = 'manufacturer'
    } else {
      query.ownerType = 'platform'
    }

    const decoration = await StoreDecoration.findOne(query).lean()
    let headerConfig = {}
    if (decoration && decoration.value && decoration.value.components) {
      const headerComp = decoration.value.components.find(c => c && c.type === 'storeHeader')
      if (headerComp && headerComp.config) {
        headerConfig = headerComp.config
      }
    }

    // 2. 如果有 manufacturerId，从 Manufacturer 补充更多数据
    let manufacturer = null
    if (manufacturerId) {
      manufacturer = await Manufacturer.findById(manufacturerId).lean()
    }

    // 3. 合并数据，优先用装修配置
    const shopInfo = {
      name: headerConfig.name || manufacturer?.fullName || manufacturer?.name || '小迪严选',
      logo: getImageUrl(headerConfig.logo || manufacturer?.logo || ''),
      contactName: headerConfig.contactName || manufacturer?.contactName || '',
      phone: headerConfig.phone || manufacturer?.contactPhone || manufacturer?.settings?.phone || '',
      address: headerConfig.address || manufacturer?.address || manufacturer?.settings?.companyAddress || '',
      description: headerConfig.description || manufacturer?.description || '',
      isVerified: headerConfig.isVerified !== undefined ? headerConfig.isVerified : (manufacturer?.certification?.status === 'approved'),
      businessHours: headerConfig.businessHours || '9:00-18:00',
      factoryArea: headerConfig.factoryArea || '',
      showroomArea: headerConfig.showroomArea || '',
      craftProcesses: headerConfig.craftProcesses || '',
      latitude: headerConfig.latitude || 0,
      longitude: headerConfig.longitude || 0,
      qrCodeImage: getImageUrl(headerConfig.qrCodeImage || manufacturer?.settings?.wechatQrCode || '')
    }

    res.json(success(shopInfo))
  } catch (err) {
    console.error('获取店铺信息失败:', err)
    res.status(500).json(error(500, err.message))
  }
})

/**
 * GET /api/miniapp/shop/poster
 * 获取店铺海报数据（公开接口）
 * Query: manufacturerId - 可选
 */
router.get('/poster', async (req, res) => {
  try {
    const StoreDecoration = require('../models/StoreDecoration')
    const Manufacturer = require('../models/Manufacturer')

    const { manufacturerId } = req.query

    const query = { isDefault: true, type: 'homepage' }
    if (manufacturerId) {
      query.manufacturerId = manufacturerId
      query.ownerType = 'manufacturer'
    } else {
      query.ownerType = 'platform'
    }

    const decoration = await StoreDecoration.findOne(query).lean()
    let headerConfig = {}
    if (decoration && decoration.value && decoration.value.components) {
      const headerComp = decoration.value.components.find(c => c && c.type === 'storeHeader')
      if (headerComp && headerComp.config) {
        headerConfig = headerComp.config
      }
    }

    let manufacturer = null
    if (manufacturerId) {
      manufacturer = await Manufacturer.findById(manufacturerId).lean()
    }

    const posterData = {
      name: headerConfig.name || manufacturer?.fullName || manufacturer?.name || '小迪严选',
      logo: getImageUrl(headerConfig.logo || manufacturer?.logo || ''),
      contactName: headerConfig.contactName || manufacturer?.contactName || '',
      phone: headerConfig.phone || manufacturer?.contactPhone || '',
      address: headerConfig.address || manufacturer?.address || '',
      qrCodeImage: getImageUrl(headerConfig.qrCodeImage || manufacturer?.settings?.wechatQrCode || '')
    }

    res.json(success(posterData))
  } catch (err) {
    console.error('获取店铺海报数据失败:', err)
    res.status(500).json(error(500, err.message))
  }
})

module.exports = router
