const TierSystem = require('../models/TierSystem')
const ManufacturerOrder = require('../models/ManufacturerOrder')
const Manufacturer = require('../models/Manufacturer')
const mongoose = require('mongoose')
const { successResponse, errorResponse } = require('../utils/response')

const resolveManufacturerId = (req) => {
  const user = req.user
  if (!user) return null

  const isAdmin = user.role === 'super_admin' || user.role === 'admin'
  if (isAdmin) {
    const mid = req.query.manufacturerId || req.body?.manufacturerId
    return mid ? String(mid) : null
  }

  if (user.manufacturerId) return String(user.manufacturerId)
  return null
}

const resolveCompanyName = (req) => {
  const raw = req.query.companyName || req.body?.companyName
  return raw ? String(raw).trim() : ''
}

const resolveCompanyId = (req) => {
  const raw = req.query.companyId || req.body?.companyId
  if (!raw) return ''
  const id = String(raw).trim()
  return mongoose.Types.ObjectId.isValid(id) ? id : ''
}

const getTierSystem = async (req, res) => {
  try {
    const manufacturerId = resolveManufacturerId(req)
    if (!manufacturerId) {
      return res.status(400).json(errorResponse('manufacturerId is required', 400))
    }

    const companyId = resolveCompanyId(req)
    const companyName = resolveCompanyName(req)

    const doc = await TierSystem.findOne({ manufacturerId }).lean()

    if (!companyId && !companyName) {
      return res.json(successResponse(doc, 'ok'))
    }

    const systems = Array.isArray(doc?.companySystems) ? doc.companySystems : []
    let found = null
    if (companyId) {
      found = systems.find((s) => String(s?.companyId || '') === String(companyId)) || null
      // 兼容旧数据：companyId 未命中时，允许回退到 companyName
      if (!found && companyName) {
        found = systems.find((s) => String(s?.companyName || '') === companyName) || null
      }
    } else {
      found = systems.find((s) => String(s?.companyName || '') === companyName) || null
    }
    if (!found) {
      return res.json(successResponse(null, 'ok'))
    }

    const payload = {
      manufacturerId: String(manufacturerId),
      companyId: companyId || String(found?.companyId || ''),
      companyName: companyName || String(found?.companyName || ''),
      profitSettings: found.profitSettings || {},
      roleModules: Array.isArray(found.roleModules) ? found.roleModules : [],
      authorizedAccounts: Array.isArray(found.authorizedAccounts) ? found.authorizedAccounts : [],
      commissionRules: Array.isArray(found.commissionRules) ? found.commissionRules : [],
    }
    return res.json(successResponse(payload, 'ok'))
  } catch (err) {
    return res.status(500).json(errorResponse(err.message, 500))
  }
}

const upsertTierSystem = async (req, res) => {
  try {
    const manufacturerId = resolveManufacturerId(req)
    if (!manufacturerId) {
      return res.status(400).json(errorResponse('manufacturerId is required', 400))
    }

    const companyId = resolveCompanyId(req)
    const companyName = resolveCompanyName(req)

    const payload = req.body || {}

    if (companyId || companyName) {
      let doc = await TierSystem.findOne({ manufacturerId })
      if (!doc) {
        doc = new TierSystem({ manufacturerId })
      }

      const nextSystem = {
        ...(companyId ? { companyId } : {}),
        ...(companyName ? { companyName } : {}),
        profitSettings: payload.profitSettings || {},
        roleModules: Array.isArray(payload.roleModules) ? payload.roleModules : [],
        authorizedAccounts: Array.isArray(payload.authorizedAccounts) ? payload.authorizedAccounts : [],
        commissionRules: Array.isArray(payload.commissionRules) ? payload.commissionRules : [],
        updatedBy: req.user?._id,
        updatedAt: new Date().toISOString(),
      }

      const list = Array.isArray(doc.companySystems) ? doc.companySystems : []
      let idx = -1
      if (companyId) {
        idx = list.findIndex((s) => String(s?.companyId || '') === String(companyId))
        // 兼容旧数据：如果 companyId 未命中但 companyName 命中，则复用旧条目并补齐 companyId
        if (idx < 0 && companyName) {
          idx = list.findIndex((s) => String(s?.companyName || '') === String(companyName))
        }
      } else {
        idx = list.findIndex((s) => String(s?.companyName || '') === String(companyName))
      }

      if (idx >= 0) {
        list[idx] = { ...(list[idx] || {}), ...nextSystem }
      } else {
        list.push(nextSystem)
      }

      doc.companySystems = list
      doc.updatedBy = req.user?._id
      await doc.save()
      return res.json(successResponse(nextSystem, '保存成功'))
    }

    const update = {
      manufacturerId,
      profitSettings: payload.profitSettings || {},
      roleModules: Array.isArray(payload.roleModules) ? payload.roleModules : [],
      authorizedAccounts: Array.isArray(payload.authorizedAccounts) ? payload.authorizedAccounts : [],
      commissionRules: Array.isArray(payload.commissionRules) ? payload.commissionRules : [],
      companySystems: Array.isArray(payload.companySystems) ? payload.companySystems : [],
      updatedBy: req.user?._id
    }

    const doc = await TierSystem.findOneAndUpdate(
      { manufacturerId },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean()

    return res.json(successResponse(doc, '保存成功'))
  } catch (err) {
    return res.status(500).json(errorResponse(err.message, 500))
  }
}

const getReconciliation = async (req, res) => {
  try {
    const manufacturerId = resolveManufacturerId(req)
    if (!manufacturerId) {
      return res.status(400).json(errorResponse('manufacturerId is required', 400))
    }

    const manufacturer = await Manufacturer.findById(manufacturerId).select('_id name fullName shortName defaultCommission').lean()
    if (!manufacturer) {
      return res.status(404).json(errorResponse('manufacturer not found', 404))
    }

    const commissionRate = Number(manufacturer.defaultCommission || 0)

    const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : new Date()
    const startDate = req.query.startDate
      ? new Date(String(req.query.startDate))
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json(errorResponse('invalid date range', 400))
    }

    const mid = new mongoose.Types.ObjectId(String(manufacturerId))
    const pipeline = [
      { $match: { manufacturerId: mid, status: 'completed' } },
      { $addFields: { completedAtEffective: { $ifNull: ['$completedAt', '$updatedAt'] } } },
      { $match: { completedAtEffective: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAtEffective' } },
          orderCount: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: -1 } }
    ]

    const rows = await ManufacturerOrder.aggregate(pipeline)
    const list = (rows || []).map(r => {
      const total = Number(r.totalAmount || 0)
      const settlementAmount = Math.round(total * (commissionRate / 100))
      return {
        date: r._id,
        manufacturerId: String(manufacturer._id),
        manufacturerName: manufacturer.fullName || manufacturer.name || manufacturer.shortName || '',
        orderCount: Number(r.orderCount || 0),
        totalAmount: total,
        commissionRate,
        settlementAmount,
        status: 'pending'
      }
    })

    return res.json(successResponse({
      manufacturerId: String(manufacturer._id),
      manufacturerName: manufacturer.fullName || manufacturer.name || manufacturer.shortName || '',
      commissionRate,
      startDate,
      endDate,
      list
    }, 'ok'))
  } catch (err) {
    return res.status(500).json(errorResponse(err.message, 500))
  }
}

const pickTierRuleForUser = (tierDoc, user) => {
  if (!tierDoc || !user) return { module: null, rule: null }
  const modules = Array.isArray(tierDoc.roleModules) ? tierDoc.roleModules : []
  const accounts = Array.isArray(tierDoc.authorizedAccounts) ? tierDoc.authorizedAccounts : []
  const uid = (user._id || user.id)?.toString?.() || ''

  const account = accounts.find((a) => String(a?.userId || '') === uid) || null
  const module = account
    ? modules.find((m) => String(m?._id || '') === String(account.roleModuleId || ''))
    : modules.find((m) => String(m?.code || '') === String(user.role || ''))

  const effectiveModule = module || modules.find((m) => m?.isActive !== false) || modules[0] || null
  const rules = Array.isArray(effectiveModule?.discountRules) ? effectiveModule.discountRules : []
  const ruleById = account?.discountRuleId
    ? rules.find((r) => String(r?._id || '') === String(account.discountRuleId || ''))
    : null
  const rule = ruleById || rules.find((r) => r?.isDefault) || rules[0] || null
  return { module: effectiveModule, rule }
}

const getEffectiveTierRule = async (req, res) => {
  try {
    const user = req.user
    const manufacturerId = req.query.manufacturerId ? String(req.query.manufacturerId) : ''
    if (!manufacturerId) {
      return res.status(400).json(errorResponse('manufacturerId is required', 400))
    }

    const doc = await TierSystem.findOne({ manufacturerId }).lean()
    if (!doc) {
      return res.json(successResponse(null, 'no tier system'))
    }

    const { module, rule } = pickTierRuleForUser(doc, user)
    if (!module || !rule) {
      return res.json(successResponse(null, 'no matching rule'))
    }

    return res.json(successResponse({
      manufacturerId: String(doc.manufacturerId),
      profitSettings: doc.profitSettings || {},
      roleModule: {
        _id: module._id,
        code: module.code,
        name: module.name
      },
      discountRule: {
        _id: rule._id,
        name: rule.name,
        discountType: rule.discountType,
        discountRate: rule.discountRate,
        minDiscountPrice: rule.minDiscountPrice,
        commissionRate: rule.commissionRate
      }
    }, 'ok'))
  } catch (err) {
    return res.status(500).json(errorResponse(err.message, 500))
  }
}

module.exports = {
  getTierSystem,
  upsertTierSystem,
  getEffectiveTierRule,
  getReconciliation
}
