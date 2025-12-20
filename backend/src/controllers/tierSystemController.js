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

module.exports = {
  getTierSystem,
  upsertTierSystem
}
