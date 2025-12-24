const TierSystem = require('../models/TierSystem')
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

const getTierSystem = async (req, res) => {
  try {
    const manufacturerId = resolveManufacturerId(req)
    if (!manufacturerId) {
      return res.status(400).json(errorResponse('manufacturerId is required', 400))
    }

    const doc = await TierSystem.findOne({ manufacturerId }).lean()
    return res.json(successResponse(doc, 'ok'))
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

    const payload = req.body || {}
    const update = {
      manufacturerId,
      profitSettings: payload.profitSettings || {},
      roleModules: Array.isArray(payload.roleModules) ? payload.roleModules : [],
      authorizedAccounts: Array.isArray(payload.authorizedAccounts) ? payload.authorizedAccounts : [],
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
  getEffectiveTierRule
}
