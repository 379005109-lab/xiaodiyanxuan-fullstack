const express = require('express')
const router = express.Router()
const SiteSettings = require('../models/SiteSettings')
const { auth } = require('../middleware/auth')
const { successResponse, errorResponse } = require('../utils/response')

router.get('/me', auth, async (req, res) => {
  try {
    let settings = await SiteSettings.findOne({ userId: req.userId }).lean()
    
    if (!settings) {
      settings = await SiteSettings.findOne({ isGlobal: true }).lean()
    }
    
    if (!settings) {
      settings = {
        siteName: 'XIAODI',
        siteSubtitle: 'SUPPLY CHAIN',
        siteLogo: ''
      }
    }
    
    res.json(successResponse(settings))
  } catch (error) {
    console.error('获取网站设置失败:', error)
    res.status(500).json(errorResponse('获取网站设置失败', 500))
  }
})

router.put('/me', auth, async (req, res) => {
  try {
    const { siteName, siteSubtitle, siteLogo } = req.body
    
    let settings = await SiteSettings.findOne({ userId: req.userId })
    
    if (settings) {
      if (siteName !== undefined) settings.siteName = siteName
      if (siteSubtitle !== undefined) settings.siteSubtitle = siteSubtitle
      if (siteLogo !== undefined) settings.siteLogo = siteLogo
      await settings.save()
    } else {
      settings = await SiteSettings.create({
        userId: req.userId,
        siteName: siteName || 'XIAODI',
        siteSubtitle: siteSubtitle || 'SUPPLY CHAIN',
        siteLogo: siteLogo || '',
        isGlobal: false
      })
    }
    
    res.json(successResponse(settings))
  } catch (error) {
    console.error('更新网站设置失败:', error)
    res.status(500).json(errorResponse('更新网站设置失败', 500))
  }
})

module.exports = router
