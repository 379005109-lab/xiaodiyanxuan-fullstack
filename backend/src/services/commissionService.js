const TierSystem = require('../models/TierSystem')
const Authorization = require('../models/Authorization')
const User = require('../models/User')

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
    const cid = String(tierCompanyId || '').trim()
    const cname = String(tierCompanyName || '').trim()

    const authTreeResult = await (async () => {
      const query = {
        fromManufacturer: manufacturerId,
        status: 'active',
        $or: [
          { boundUserIds: userId },
          { boundUserId: userId }
        ]
      }

      if (cid) {
        query.$and = [
          {
            $or: [
              { tierCompanyId: cid },
              { _id: cid }
            ]
          }
        ]
      }

      const matchedNodes = await Authorization.find(query)
        .select('_id parentAuthorizationId tierLevel tierCompanyId tierCompanyName boundUserIds boundUserId tierDepthBasedCommissionRules')
        .lean()

      if (!Array.isArray(matchedNodes) || matchedNodes.length === 0) return []

      // 如果同一用户被绑定到多个层级，优先选择最深的层级
      const startNode = matchedNodes
        .slice()
        .sort((a, b) => Number(b?.tierLevel || 0) - Number(a?.tierLevel || 0))[0]

      const commissions = []
      const visited = new Set()
      const cache = new Map([[String(startNode._id), startNode]])

      let currentNode = startNode
      let depth = 0

      while (currentNode && depth < 10) {
        const nodeId = String(currentNode._id)
        if (visited.has(nodeId)) break
        visited.add(nodeId)

        const rules = Array.isArray(currentNode.tierDepthBasedCommissionRules)
          ? currentNode.tierDepthBasedCommissionRules
          : []
        const rule = rules.find(r => Number(r?.depth || -1) === depth)
        const rawRate = rule && typeof rule.commissionRate === 'number' ? Number(rule.commissionRate) : 0
        const rate = Math.max(0, Math.min(1, rawRate))

        const recipients = (() => {
          const primary = currentNode.boundUserId ? String(currentNode.boundUserId?._id || currentNode.boundUserId) : ''
          if (primary) return [primary]
          const ids = []
          const list = Array.isArray(currentNode.boundUserIds) ? currentNode.boundUserIds : []
          list.forEach(id => ids.push(String(id?._id || id)))
          if (currentNode.boundUserId) ids.push(String(currentNode.boundUserId?._id || currentNode.boundUserId))
          return [...new Set(ids.filter(Boolean))]
        })()

        if (rate > 0 && recipients.length > 0) {
          const totalNodeAmount = Math.round(Number(orderAmount) * rate)
          const n = recipients.length
          const base = Math.floor(totalNodeAmount / n)
          const rem = totalNodeAmount - base * n

          recipients.forEach((rid, idx) => {
            const amount = base + (idx === n - 1 ? rem : 0)
            if (amount <= 0) return
            commissions.push({
              accountId: nodeId,
              userId: rid,
              username: '',
              nickname: '',
              depth,
              commissionRate: Number(orderAmount) > 0 ? amount / Number(orderAmount) : 0,
              commissionAmount: amount,
              tierCompanyId: cid || (currentNode.tierCompanyId ? String(currentNode.tierCompanyId) : ''),
              tierCompanyName: cname || (currentNode.tierCompanyName ? String(currentNode.tierCompanyName) : ''),
              calculatedAt: new Date()
            })
          })
        }

        const parentId = currentNode.parentAuthorizationId ? String(currentNode.parentAuthorizationId) : ''
        if (!parentId) break

        if (!cache.has(parentId)) {
          const parent = await Authorization.findById(parentId)
            .select('_id parentAuthorizationId tierLevel tierCompanyId tierCompanyName boundUserIds boundUserId tierDepthBasedCommissionRules')
            .lean()
          if (parent) cache.set(parentId, parent)
        }

        currentNode = cache.get(parentId) || null
        depth++
      }

      if (commissions.length === 0) return []

      const userIds = [...new Set(commissions.map(c => String(c.userId)))]
      const users = await User.find({ _id: { $in: userIds } }).select('_id username nickname').lean()
      const userMap = new Map((users || []).map(u => [String(u._id), u]))

      commissions.forEach(c => {
        const u = userMap.get(String(c.userId))
        if (u) {
          c.username = String(u.username || '')
          c.nickname = String(u.nickname || u.username || '')
        }
      })

      return commissions
    })()

    if (authTreeResult && authTreeResult.length > 0) {
      return authTreeResult
    }

    // 1. 获取分层体系数据
    const tierDocRaw = await TierSystem.findOne({ manufacturerId }).lean()
    if (!tierDocRaw) return []

    // 2. 选择对应公司的子体系（如果有）
    let tierDoc = tierDocRaw

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
