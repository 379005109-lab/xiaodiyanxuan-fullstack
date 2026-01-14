const TierSystem = require('../models/TierSystem')
const Authorization = require('../models/Authorization')

/**
 * 计算订单的分层返佣
 * @param {String} userId - 下单用户ID
 * @param {Number} orderAmount - 订单金额
 * @param {String} manufacturerId - 厂家ID
 * @param {String} tierCompanyId - 公司ID（可选）
 * @param {String} tierCompanyName - 公司名称（可选）
 * @returns {Array} 返佣计算结果数组
 */
const calculateTieredCommissions = async (userId, orderAmount, manufacturerId, tierCompanyId = '', tierCompanyName = '') => {
  if (!userId || !orderAmount || !manufacturerId) return []

  try {
    // 1. 获取分层体系数据
    const tierDocRaw = await TierSystem.findOne({ manufacturerId }).lean()
    if (!tierDocRaw) return []

    // 2. 选择对应公司的子体系（如果有）
    let tierDoc = tierDocRaw
    const cid = String(tierCompanyId || '').trim()
    const cname = String(tierCompanyName || '').trim()
    
    if (cid || cname) {
      const systems = Array.isArray(tierDocRaw.companySystems) ? tierDocRaw.companySystems : []
      let found = null
      if (cid) {
        found = systems.find((s) => String(s?.companyId || '') === cid) || null
      }
      if (!found && cname) {
        found = systems.find((s) => String(s?.companyName || '') === cname) || null
      }
      if (found) {
        tierDoc = {
          manufacturerId: tierDocRaw.manufacturerId,
          profitSettings: found.profitSettings || {},
          roleModules: Array.isArray(found.roleModules) ? found.roleModules : [],
          authorizedAccounts: Array.isArray(found.authorizedAccounts) ? found.authorizedAccounts : [],
          commissionRules: Array.isArray(found.commissionRules) ? found.commissionRules : [],
        }
      }
    }

    const accounts = Array.isArray(tierDoc.authorizedAccounts) ? tierDoc.authorizedAccounts : []
    
    // 3. 找到下单用户在分层体系中的账号
    const orderAccount = accounts.find(a => String(a?.userId || '') === String(userId))
    if (!orderAccount) return []

    // 4. 向上遍历所有上级账号，计算返佣
    const commissions = []
    const accountMap = new Map(accounts.map(a => [String(a._id), a]))
    
    let currentAccount = orderAccount
    let depth = 0
    const visited = new Set()
    
    while (currentAccount && depth < 10) {
      const accountId = String(currentAccount._id)
      
      // 防止循环引用
      if (visited.has(accountId)) break
      visited.add(accountId)
      
      // 查找该账号针对当前深度的返佣规则
      const rules = Array.isArray(currentAccount.depthBasedCommissionRules) 
        ? currentAccount.depthBasedCommissionRules 
        : []
      
      const rule = rules.find(r => Number(r?.depth || -1) === depth)
      
      if (rule && typeof rule.commissionRate === 'number' && rule.commissionRate > 0) {
        const rate = Math.max(0, Math.min(1, rule.commissionRate))
        const amount = Math.round(orderAmount * rate)
        
        commissions.push({
          accountId: accountId,
          userId: String(currentAccount.userId || ''),
          username: String(currentAccount.username || ''),
          nickname: String(currentAccount.nickname || currentAccount.username || ''),
          depth: depth,
          commissionRate: rate,
          commissionAmount: amount,
          tierCompanyId: cid || '',
          tierCompanyName: cname || '',
          calculatedAt: new Date()
        })
      }
      
      // 移动到父级账号
      const parentId = currentAccount.parentId ? String(currentAccount.parentId) : ''
      if (!parentId) break
      
      currentAccount = accountMap.get(parentId) || null
      depth++
    }
    
    return commissions
  } catch (err) {
    console.error('calculateTieredCommissions error:', err)
    return []
  }
}

module.exports = {
  calculateTieredCommissions
}
