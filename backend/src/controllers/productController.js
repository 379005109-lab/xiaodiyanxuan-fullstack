const { successResponse, errorResponse, paginatedResponse } = require('../utils/response')
const { getProducts, getProductById, getCategories, getStyles, searchProducts } = require('../services/productService')
const browseHistoryService = require('../services/browseHistoryService')
const FileService = require('../services/fileService')
const Product = require('../models/Product')
const Authorization = require('../models/Authorization')
const TierSystem = require('../models/TierSystem')
const Style = require('../models/Style')
const Manufacturer = require('../models/Manufacturer')
const { canViewCostPrice } = require('../services/priceService')

const getProductOwnerManufacturerId = (product) => {
  if (!product) return null
  const direct = product.manufacturerId?._id || product.manufacturerId
  if (direct) return direct.toString()
  const skuManufacturerId = product.skus?.[0]?.manufacturerId
  if (skuManufacturerId) return skuManufacturerId.toString()
  return null
}

// 为视频文件ID添加.mp4后缀，方便前端识别
const markVideoIds = (product) => {
  if (!product) return product
  const result = { ...product }
  if (Array.isArray(result.skus)) {
    result.skus = result.skus.map(sku => {
      if (!sku) return sku
      const newSku = { ...sku }
      if (Array.isArray(newSku.videos)) {
        newSku.videos = newSku.videos.map(v => v ? `${v}.mp4` : v)
      }
      return newSku
    })
  }
  return result
}

const resolveTierDocForAuth = (tierDocRaw, auth) => {
  if (!tierDocRaw || typeof tierDocRaw !== 'object') return tierDocRaw
  const companyId = auth?.tierCompanyId ? String(auth.tierCompanyId) : ''
  const companyName = auth?.tierCompanyName ? String(auth.tierCompanyName) : ''
  if (!companyId && !companyName) return tierDocRaw

  const systems = Array.isArray(tierDocRaw.companySystems) ? tierDocRaw.companySystems : []
  let found = null
  if (companyId) {
    found = systems.find((s) => String(s?.companyId || '') === companyId) || null
  }
  if (!found && companyName) {
    found = systems.find((s) => String(s?.companyName || '') === companyName) || null
  }
  if (!found) return tierDocRaw

  return {
    manufacturerId: tierDocRaw.manufacturerId,
    profitSettings: found.profitSettings || {},
    roleModules: Array.isArray(found.roleModules) ? found.roleModules : [],
    authorizedAccounts: Array.isArray(found.authorizedAccounts) ? found.authorizedAccounts : [],
    commissionRules: Array.isArray(found.commissionRules) ? found.commissionRules : [],
  }
}

const getAuthorizationViewerKey = (user) => {
  if (!user) return null
  if (user.manufacturerId) return `m:${user.manufacturerId.toString()}`
  const userId = user._id || user.id
  if (!userId) return null
  return `u:${userId.toString()}`
}

const normalizeCategoryId = (category) => {
  if (!category) return null
  if (typeof category === 'string') return category
  const id = category._id || category.id
  if (!id) return null
  return id.toString()
}

const findAuthorizationForUserAndProduct = async (user, product) => {
  const ownerManufacturerId = getProductOwnerManufacturerId(product)
  if (!ownerManufacturerId) return null

  if (user?.manufacturerId && user.manufacturerId.toString() === ownerManufacturerId) {
    return { _isOwner: true }
  }

  const query = {
    status: 'active',
    $or: [
      { validUntil: { $exists: false } },
      { validUntil: { $gt: new Date() } }
    ]
  }

  if (user?.manufacturerId) {
    query.toManufacturer = user.manufacturerId
  } else if (user?.role === 'designer') {
    query.toDesigner = user._id
  } else {
    return null
  }

  const authorizations = await Authorization.find(query).lean()
  const categoryId = normalizeCategoryId(product.category)

  for (const auth of authorizations) {
    if (auth.fromManufacturer?.toString?.() !== ownerManufacturerId) continue

    if (auth.scope === 'all') return auth

    if (auth.scope === 'category' && categoryId && Array.isArray(auth.categories)) {
      const ok = auth.categories.some(c => c?.toString?.() === categoryId)
      if (ok) return auth
    }

    if (auth.scope === 'specific' && Array.isArray(auth.products)) {
      const ok = auth.products.some(p => p?.toString?.() === product._id?.toString?.())
      if (ok) return auth
    }

    if (auth.scope === 'mixed') {
      if (categoryId && Array.isArray(auth.categories)) {
        const okCategory = auth.categories.some(c => c?.toString?.() === categoryId)
        if (okCategory) return auth
      }
      if (Array.isArray(auth.products)) {
        const okProduct = auth.products.some(p => p?.toString?.() === product._id?.toString?.())
        if (okProduct) return auth
      }
    }
  }

  return null
}

const getAuthorizedTakePrice = (auth, product) => {
  const authModel = new Authorization(auth)
  return authModel.getAuthorizedPrice(product)
}

const allowCostPriceForUser = (user) => {
  if (!user) return false
  if (user.role === 'admin') return true
  return canViewCostPrice(user)
}

const stripCostPriceFromProduct = (product) => {
  if (!product || !Array.isArray(product.skus)) return product
  return {
    ...product,
    materialConfigs: product.materialConfigs || [],
    materialDescriptionOptions: product.materialDescriptionOptions || [],
    otherMaterialsText: product.otherMaterialsText || '',
    otherMaterialsImage: product.otherMaterialsImage || '',
    skus: product.skus.map((sku) => {
      if (!sku || typeof sku !== 'object') return sku
      const { costPrice, ...rest } = sku
      return rest
    })
  }
}

const getProductCostPrice = (product) => {
  const sku = product?.skus?.[0]
  if (!sku) return 0
  const val = sku.costPrice
  return Number.isFinite(val) ? val : 0
}

const sanitizeProductForAuthorizedViewer = (product, takePrice, labelPrice1, allowCostPrice = false, tierPricing = null, manufacturerDisplayName = '小迪严选（平台）') => {
  const rawCostPrice = allowCostPrice ? getProductCostPrice(product) : 0
  const resolvedCostPrice = allowCostPrice
    ? (rawCostPrice > 0 ? rawCostPrice : (Number.isFinite(takePrice) ? takePrice : 0))
    : 0
  return {
    _id: product._id,
    name: product.name,
    productCode: product.productCode,
    category: product.category,
    series: product.series,
    seriesImage: product.seriesImage,
    thumbnail: product.thumbnail,
    images: product.images,
    videos: product.videos || [],
    videoTitles: product.videoTitles || [],
    status: product.status,
    skus: product.skus || [],
    materialConfigs: product.materialConfigs || [],
    materialDescriptionOptions: product.materialDescriptionOptions || [],
    otherMaterialsText: product.otherMaterialsText || '',
    otherMaterialsImage: product.otherMaterialsImage || '',
    specifications: product.specifications,
    style: product.style,
    styles: product.styles,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    takePrice,
    labelPrice1,
    manufacturerDisplayName,
    ...(allowCostPrice && resolvedCostPrice > 0 ? { costPrice: resolvedCostPrice } : {}),
    ...(tierPricing ? { tierPricing } : {}),
  }
}

const getSkuRetailPrice = (sku) => {
  if (!sku || typeof sku !== 'object') return 0
  const price = Number(sku.price || 0)
  const discountPrice = Number(sku.discountPrice || 0)
  if (Number.isFinite(discountPrice) && discountPrice > 0 && discountPrice < price) return discountPrice
  return Number.isFinite(price) ? price : 0
}

const getProductRetailPrice = (product) => {
  const skus = Array.isArray(product?.skus) ? product.skus : []
  const skuPrices = skus.map(getSkuRetailPrice).filter((v) => Number.isFinite(v) && v > 0)
  if (skuPrices.length > 0) return Math.min(...skuPrices)
  const base = Number(product?.basePrice || 0)
  return Number.isFinite(base) ? base : 0
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

const computeTierPricing = ({ tierDoc, user, product, auth }) => {
  if (!tierDoc || !user || !product) return null

  const { module, rule } = pickTierRuleForUser(tierDoc, user)
  if (!module || !rule) return null

  const minSaleDiscountRate = Number(tierDoc?.profitSettings?.minSaleDiscountRate ?? 1)
  const safeMinSaleRate = Number.isFinite(minSaleDiscountRate) ? Math.max(0, Math.min(1, minSaleDiscountRate)) : 1

  const retailPrice = getProductRetailPrice(product)
  if (!Number.isFinite(retailPrice) || retailPrice <= 0) return null

  // 单品折扣覆盖：优先读取授权里的 productPrices.discount（只覆盖折扣比例，不覆盖返佣）
  let overrideDiscountRate = null
  const pp = auth?.priceSettings?.productPrices
  if (Array.isArray(pp)) {
    const matched = pp.find((x) => String(x?.productId || '') === String(product?._id || ''))
    const d = matched?.discount
    if (typeof d === 'number' && Number.isFinite(d) && d > 0 && d <= 1) {
      overrideDiscountRate = d
    }
  }

  const discountType = rule.discountType || (typeof rule.minDiscountPrice === 'number' ? 'minPrice' : 'rate')
  const ruleDiscountRate = typeof rule.discountRate === 'number' && Number.isFinite(rule.discountRate)
    ? Math.max(0, Math.min(1, rule.discountRate))
    : 1
  const minDiscountPrice = typeof rule.minDiscountPrice === 'number' && Number.isFinite(rule.minDiscountPrice)
    ? Math.max(0, rule.minDiscountPrice)
    : undefined

  let discountedPrice = 0
  if (overrideDiscountRate) {
    discountedPrice = retailPrice * overrideDiscountRate
  } else if (discountType === 'minPrice') {
    discountedPrice = Number(minDiscountPrice || 0)
  } else {
    discountedPrice = retailPrice * ruleDiscountRate
  }

  // 全局最低折扣保护（基于 SKU 售价）
  const minAllowed = retailPrice * safeMinSaleRate
  discountedPrice = Math.max(discountedPrice, minAllowed)

  discountedPrice = Math.round(discountedPrice)

  const commissionRateRaw = typeof rule.commissionRate === 'number' && Number.isFinite(rule.commissionRate)
    ? rule.commissionRate
    : 0
  const commissionRate = Math.max(0.01, Math.min(0.5, commissionRateRaw))
  const commissionAmount = Math.round(discountedPrice * commissionRate)
  const netCostPrice = Math.round(discountedPrice - commissionAmount)

  return {
    source: 'tierSystem',
    authorizationId: auth?._id,
    roleModuleId: module?._id,
    roleModuleCode: module?.code,
    roleModuleName: module?.name,
    discountRuleId: rule?._id,
    discountRuleName: rule?.name,
    discountType,
    discountRate: overrideDiscountRate ? overrideDiscountRate : (discountType === 'rate' ? ruleDiscountRate : undefined),
    minDiscountPrice: discountType === 'minPrice' ? (minDiscountPrice ?? 0) : undefined,
    overrideDiscountRate: overrideDiscountRate || undefined,
    retailPrice,
    discountedPrice,
    commissionRate,
    commissionAmount,
    netCostPrice,
  }
}

const computeAuthorizationPricingFallback = ({ product, auth }) => {
  if (!product || !auth) return null

  const retailPrice = getProductRetailPrice(product)
  if (!Number.isFinite(retailPrice) || retailPrice <= 0) return null

  let discountRate = null
  if (typeof auth.minDiscountRate === 'number' && Number.isFinite(auth.minDiscountRate) && auth.minDiscountRate > 0) {
    discountRate = Math.max(0.01, Math.min(1, auth.minDiscountRate / 100))
  } else if (typeof auth.priceSettings?.globalDiscount === 'number' && Number.isFinite(auth.priceSettings.globalDiscount)) {
    discountRate = Math.max(0.01, Math.min(1, auth.priceSettings.globalDiscount))
  }

  let commissionRate = null
  if (typeof auth.commissionRate === 'number' && Number.isFinite(auth.commissionRate) && auth.commissionRate >= 0) {
    commissionRate = Math.max(0, Math.min(0.5, auth.commissionRate / 100))
  } else if (typeof auth.priceSettings?.commissionRate === 'number' && Number.isFinite(auth.priceSettings.commissionRate)) {
    commissionRate = Math.max(0, Math.min(0.5, auth.priceSettings.commissionRate))
  }

  if (!discountRate || commissionRate === null) return null

  const discountedPrice = Math.round(retailPrice * discountRate)
  const commissionAmount = Math.round(discountedPrice * commissionRate)
  const netCostPrice = Math.round(discountedPrice - commissionAmount)

  return {
    source: 'authorization',
    authorizationId: auth?._id,
    discountType: 'rate',
    discountRate,
    retailPrice,
    discountedPrice,
    commissionRate,
    commissionAmount,
    netCostPrice,
  }
}

const isManufacturerScopedUser = (user) => {
  return Boolean(user?.manufacturerId)
}

const listProducts = async (req, res) => {
  try {
    const { page = 1, pageSize = 10000, search, categoryId, styleId, sortBy } = req.query

    const user = req.user
    const platformManufacturerId = '6948fca5630729ca224ec425'
    
    // Debug logging
    console.log('[listProducts] user:', user ? { id: user._id, role: user.role, manufacturerId: user.manufacturerId } : 'NO USER')

    // 统一分类映射
    const Category = require('../models/Category')
    const allCategories = await Category.find({}).lean()
    const categoryMap = new Map()
    allCategories.forEach(cat => {
      categoryMap.set(cat._id.toString(), cat.name)
      if (cat.slug) categoryMap.set(cat.slug, cat.name)
    })

    const attachCategoryName = (items) => {
      return (items || []).map(p => {
        let categoryName = ''
        if (p?.category) {
          if (typeof p.category === 'object' && p.category.name) {
            categoryName = p.category.name
          } else if (typeof p.category === 'string') {
            categoryName = categoryMap.get(p.category) || p.category
          } else if (p.category._id) {
            categoryName = categoryMap.get(p.category._id.toString()) || ''
          }
        }
        return { ...p, categoryName }
      })
    }

    // 超级管理员/管理员（无厂家绑定）：显示所有商品
    if ((user?.role === 'super_admin' || user?.role === 'admin') && !user?.manufacturerId) {
      const query = {}
      if (search) query.$text = { $search: search }
      if (categoryId) {
        query.$or = [
          { 'category.id': categoryId },
          { 'category._id': categoryId },
          { category: categoryId },
        ]
      }
      if (styleId) query['style.id'] = styleId
      
      const total = await Product.countDocuments(query)
      const products = await Product.find(query)
        .sort(sortBy || 'order -createdAt')
        .skip((parseInt(page) - 1) * parseInt(pageSize))
        .limit(parseInt(pageSize))
        .lean()
      
      res.json(paginatedResponse(attachCategoryName(products), total, parseInt(page), parseInt(pageSize)))
      return
    }

    // 厂家/设计师/有厂家绑定的管理员：自有 + 已授权 + 平台自营
    // 注意：即使是 admin/super_admin，如果绑定了厂家，也按厂家权限过滤
    if ((user?.manufacturerId || user?.role === 'designer')) {
      const isDesigner = user?.role === 'designer'
      const authQuery = {
        status: 'active',
        $or: [
          { validUntil: { $exists: false } },
          { validUntil: { $gt: new Date() } }
        ]
      }

      if (isDesigner) {
        authQuery.toDesigner = user._id
      } else {
        authQuery.toManufacturer = user.manufacturerId
      }

      const authorizations = await Authorization.find(authQuery).lean()
      const authorizedProductIds = new Set()
      const authByProduct = new Map()
      const hiddenProductIds = new Set()
      const productOverridesMap = new Map()

      for (const auth of authorizations) {
        if (auth.isEnabled === false) continue

        if (auth.productOverrides) {
          for (const [productId, override] of Object.entries(auth.productOverrides)) {
            productOverridesMap.set(productId, override)
            if (override.hidden === true) hiddenProductIds.add(productId)
          }
        }

        if (auth.scope === 'all') {
          const manufacturerOid = auth.fromManufacturer
          const products = await Product.find({
            $or: [
              { manufacturerId: manufacturerOid },
              { 'skus.manufacturerId': manufacturerOid },
            ],
            status: 'active'
          }).select('_id').lean()
          products.forEach(p => {
            authorizedProductIds.add(p._id.toString())
            authByProduct.set(p._id.toString(), auth)
          })
        } else if (auth.scope === 'category') {
          const manufacturerOid = auth.fromManufacturer
          const products = await Product.find({
            $and: [
              {
                $or: [
                  { manufacturerId: manufacturerOid },
                  { 'skus.manufacturerId': manufacturerOid },
                ],
              },
              { status: 'active' },
              {
                $or: [
                  { category: { $in: auth.categories || [] } },
                  { 'category._id': { $in: auth.categories || [] } },
                  { 'category.id': { $in: auth.categories || [] } },
                ],
              },
            ]
          }).select('_id').lean()
          products.forEach(p => {
            authorizedProductIds.add(p._id.toString())
            authByProduct.set(p._id.toString(), auth)
          })
        } else if (auth.scope === 'specific') {
          ;(auth.products || []).forEach(pid => {
            authorizedProductIds.add(pid.toString())
            authByProduct.set(pid.toString(), auth)
          })
        } else if (auth.scope === 'mixed') {
          const manufacturerOid = auth.fromManufacturer
          if (Array.isArray(auth.categories) && auth.categories.length > 0) {
            const products = await Product.find({
              $and: [
                {
                  $or: [
                    { manufacturerId: manufacturerOid },
                    { 'skus.manufacturerId': manufacturerOid },
                  ],
                },
                { status: 'active' },
                {
                  $or: [
                    { category: { $in: auth.categories || [] } },
                    { 'category._id': { $in: auth.categories || [] } },
                    { 'category.id': { $in: auth.categories || [] } },
                  ],
                },
              ]
            }).select('_id').lean()
            products.forEach(p => {
              authorizedProductIds.add(p._id.toString())
              authByProduct.set(p._id.toString(), auth)
            })
          }

          ;(auth.products || []).forEach(pid => {
            authorizedProductIds.add(pid.toString())
            authByProduct.set(pid.toString(), auth)
          })
        }
      }

      const onlyAuthorized = req.query.onlyAuthorized === 'true'
      // 严格模式：厂家账号只显示自有商品 + 授权商品，不再默认显示平台商品
      // 设计师账号显示授权商品 + 平台商品
      console.log('[listProducts] Manufacturer mode - authorizedProductIds:', authorizedProductIds.size, 'userMfgId:', user.manufacturerId)
      const baseOr = isDesigner
        ? [
            { _id: { $in: Array.from(authorizedProductIds) } },
          ]
        : [
            { _id: { $in: Array.from(authorizedProductIds) } },
            { manufacturerId: user.manufacturerId },
            { 'skus.manufacturerId': user.manufacturerId },
          ]

      const accessQuery = onlyAuthorized
        ? { _id: { $in: Array.from(authorizedProductIds) }, status: 'active' }
        : { $or: baseOr, status: 'active' }

      if (search) accessQuery.$text = { $search: search }

      if (categoryId) {
        const categoryFilter = {
          $or: [
            { 'category.id': categoryId },
            { 'category._id': categoryId },
            { category: categoryId },
          ]
        }
        accessQuery.$and = [categoryFilter]
      }

      if (styleId) accessQuery['style.id'] = styleId

      const total = await Product.countDocuments(accessQuery)
      const products = await Product.find(accessQuery)
        .sort(sortBy || 'order -createdAt')
        .skip((parseInt(page) - 1) * parseInt(pageSize))
        .limit(parseInt(pageSize))
        .lean()

      const ownerIds = Array.from(new Set(products.map(getProductOwnerManufacturerId).filter(Boolean)))
      const tierDocs = ownerIds.length > 0
        ? await TierSystem.find({ manufacturerId: { $in: ownerIds } }).lean()
        : []
      const tierByOwnerId = new Map((tierDocs || []).map((d) => [String(d.manufacturerId), d]))

      const manufacturerDocs = ownerIds.length > 0
        ? await Manufacturer.find({ _id: { $in: ownerIds } }).select('_id fullName shortName name').lean()
        : []
      const manufacturerById = new Map((manufacturerDocs || []).map((m) => [String(m._id), m]))

      const includeHidden = req.query.includeHidden === 'true'
      const shaped = products
        .filter(p => includeHidden || !hiddenProductIds.has(p._id.toString()))
        .map(p => {
          const ownerManufacturerId = getProductOwnerManufacturerId(p)
          const tierDocRaw = ownerManufacturerId ? tierByOwnerId.get(ownerManufacturerId) : null
          const auth = authByProduct.get(p._id.toString())
          const tierDoc = resolveTierDocForAuth(tierDocRaw, auth)
          const tierPricing = computeTierPricing({ tierDoc, user, product: p, auth }) || computeAuthorizationPricingFallback({ product: p, auth })

          const productIdStr = p._id.toString()
          const override = productOverridesMap.get(productIdStr)
          const overrideFields = {}
          if (override) {
            if (override.price !== undefined) overrideFields.overridePrice = override.price
            if (override.hidden !== undefined) overrideFields.isHidden = override.hidden
          }

          const manufacturerDoc = ownerManufacturerId ? manufacturerById.get(ownerManufacturerId) : null
          const manufacturerDisplayName = manufacturerDoc
            ? (manufacturerDoc.fullName || manufacturerDoc.shortName || manufacturerDoc.name || '未知厂家')
            : '小迪严选（平台）'

          if (!isDesigner && ownerManufacturerId && ownerManufacturerId === user.manufacturerId.toString()) {
            return { ...p, manufacturerDisplayName, ...overrideFields, ...(tierPricing ? { tierPricing } : {}) }
          }
          if (!auth) {
            return { ...sanitizeProductForAuthorizedViewer(p, 0, 0, false, tierPricing, manufacturerDisplayName), ...overrideFields }
          }

          const takePrice = getAuthorizedTakePrice(auth, p)
          const key = getAuthorizationViewerKey(user)
          const labelPrice1 = (p.authorizedLabelPrices && key) ? (p.authorizedLabelPrices[key] || takePrice) : takePrice
          const allow = allowCostPriceForUser(user)

          return { ...sanitizeProductForAuthorizedViewer(p, takePrice, labelPrice1, allow, tierPricing, manufacturerDisplayName), ...overrideFields }
        })

      res.json(paginatedResponse(attachCategoryName(shaped), total, parseInt(page), parseInt(pageSize)))
      return
    }

    // 平台/公开：仅平台自营 + 已合作厂家（授权有效且启用）
    const coopAuthQuery = {
      authorizationType: 'manufacturer',
      toManufacturer: platformManufacturerId,
      status: 'active',
      isEnabled: { $ne: false },
      $or: [
        { validUntil: { $exists: false } },
        { validUntil: { $gt: new Date() } }
      ]
    }
    // 先查所有授权看看 isEnabled 的真实状态
    const allAuths = await Authorization.find({
      authorizationType: 'manufacturer',
      toManufacturer: platformManufacturerId
    }).select('fromManufacturer isEnabled status _id').lean()
    console.log('[Product Filter] ALL auths:', JSON.stringify(allAuths.map(a => ({ id: a._id?.toString(), from: a.fromManufacturer?.toString(), isEnabled: a.isEnabled, status: a.status }))))
    
    const coopAuths = await Authorization.find(coopAuthQuery).select('fromManufacturer isEnabled status').lean()
    console.log('[Product Filter] filtered coopAuths:', JSON.stringify(coopAuths.map(a => ({ from: a.fromManufacturer?.toString(), isEnabled: a.isEnabled, status: a.status }))))
    const cooperatedManufacturerIds = Array.from(new Set((coopAuths || [])
      .map(a => (a?.fromManufacturer ? a.fromManufacturer.toString() : ''))
      .filter(Boolean)))

    const allowedManufacturerIds = Array.from(new Set([platformManufacturerId, ...cooperatedManufacturerIds]))
    console.log('[Product Filter] platform:', platformManufacturerId, 'coopAuths:', coopAuths?.length || 0, 'allowed:', JSON.stringify(allowedManufacturerIds))

    // 严格模式：不再显示无 manufacturerId 的商品，只显示平台自营 + 已启用合作厂家的商品
    const accessQuery = {
      status: 'active',
      $or: [
        { manufacturerId: { $in: allowedManufacturerIds } },
        { 'skus.manufacturerId': { $in: allowedManufacturerIds } },
      ]
    }

    if (search) accessQuery.$text = { $search: search }

    if (categoryId) {
      const categoryFilter = {
        $or: [
          { 'category.id': categoryId },
          { 'category._id': categoryId },
          { category: categoryId },
        ]
      }
      accessQuery.$and = [categoryFilter]
    }

    if (styleId) accessQuery['style.id'] = styleId

    const total = await Product.countDocuments(accessQuery)
    const products = await Product.find(accessQuery)
      .sort(sortBy || 'order -createdAt')
      .skip((parseInt(page) - 1) * parseInt(pageSize))
      .limit(parseInt(pageSize))
      .lean()

    const allow = allowCostPriceForUser(user)
    const safeProducts = allow ? products : products.map(stripCostPriceFromProduct)

    res.json(paginatedResponse(attachCategoryName(safeProducts), total, parseInt(page), parseInt(pageSize)))
  } catch (err) {
    console.error('List products error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

const getProduct = async (req, res) => {
  try {
    const { id } = req.params
    const product = await getProductById(id)

    const user = req.user
    if (user?.role === 'designer') {
      if (product?.status !== 'active') {
        return res.status(404).json(errorResponse('商品不存在', 404))
      }

      const ownerManufacturerId = getProductOwnerManufacturerId(product)
      const auth = await findAuthorizationForUserAndProduct(user, product)

      const tierDocRaw = ownerManufacturerId
        ? await TierSystem.findOne({ manufacturerId: ownerManufacturerId }).lean()
        : null
      const tierDoc = resolveTierDocForAuth(tierDocRaw, auth)
      const tierPricing = computeTierPricing({ tierDoc, user, product, auth }) || computeAuthorizationPricingFallback({ product, auth })

      let takePrice
      let labelPrice1
      if (auth && !auth._isOwner) {
        takePrice = getAuthorizedTakePrice(auth, product)
        const key = getAuthorizationViewerKey(user)
        labelPrice1 = (product.authorizedLabelPrices && key) ? (product.authorizedLabelPrices[key] || takePrice) : takePrice
      }

      const safeProduct = markVideoIds(stripCostPriceFromProduct(product))
      return res.json(successResponse({
        ...safeProduct,
        ...(typeof takePrice === 'number' ? { takePrice } : {}),
        ...(typeof labelPrice1 === 'number' ? { labelPrice1 } : {}),
        ...(tierPricing ? { tierPricing } : {}),
      }))
    }

    if (user?.manufacturerId && user.role !== 'super_admin' && user.role !== 'admin') {
      const ownerManufacturerId = getProductOwnerManufacturerId(product)
      if (ownerManufacturerId && ownerManufacturerId === user.manufacturerId.toString()) {
        return res.json(successResponse(markVideoIds(product)))
      }

      const auth = await findAuthorizationForUserAndProduct(user, product)
      if (!auth || auth._isOwner) {
        return res.status(403).json(errorResponse('您没有此商品的授权', 403))
      }

      let takePrice = getAuthorizedTakePrice(auth, product)
      const key = getAuthorizationViewerKey(user)
      let labelPrice1 = (product.authorizedLabelPrices && key) ? (product.authorizedLabelPrices[key] || takePrice) : takePrice
      
      // 检查是否有价格覆盖
      const productOverride = auth.productOverrides?.get?.(id) || auth.productOverrides?.[id]
      console.log('[getProduct] productOverride:', productOverride)
      if (productOverride?.price) {
        takePrice = productOverride.price
        labelPrice1 = productOverride.price
        console.log('[getProduct] 使用覆盖价格:', productOverride.price)
      }
      
      console.log('[getProduct] 最终价格:', { takePrice, labelPrice1 })
      
      const allow = allowCostPriceForUser(user)

      const tierDocRaw = ownerManufacturerId
        ? await TierSystem.findOne({ manufacturerId: ownerManufacturerId }).lean()
        : null
      const tierDoc = resolveTierDocForAuth(tierDocRaw, auth)
      const tierPricing = computeTierPricing({ tierDoc, user, product, auth }) || computeAuthorizationPricingFallback({ product, auth })
      
      const finalData = markVideoIds(sanitizeProductForAuthorizedViewer(product, takePrice, labelPrice1, allow, tierPricing))
      console.log('[getProduct] 返回数据中的价格:', { takePrice: finalData.takePrice, labelPrice1: finalData.labelPrice1 })

      return res.json(successResponse(finalData))
    }
    
    // 异步记录浏览历史（如果用户已登录）
    const userId = req.user?._id || req.user?.id
    if (userId) {
      browseHistoryService.recordBrowse(userId, id, {
        source: req.headers['x-platform'] || 'web',
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection?.remoteAddress
      }).catch(err => console.error('记录浏览历史失败:', err))
    }
    
    const allow = allowCostPriceForUser(user)
    const strippedProduct = allow ? product : stripCostPriceFromProduct(product)
    const finalProduct = markVideoIds(strippedProduct)
    console.log('🔥 [getProduct] Final product materialConfigs count:', finalProduct.materialConfigs?.length || 0)
    console.log('🔥 [getProduct] Final product keys:', Object.keys(finalProduct).filter(k => k.includes('material')))
    const response = successResponse(finalProduct)
    console.log('🔥 [getProduct] Response data has materialConfigs:', 'materialConfigs' in response.data)
    console.log('🔥 [getProduct] Response data materialConfigs count:', response.data.materialConfigs?.length || 0)
    console.log('🔥 [getProduct] About to send response')
    res.json(response)
  } catch (err) {
    console.error('Get product error:', err)
    const status = err.status || 500
    res.status(status).json(errorResponse(err.message, status))
  }
}

const getProductCategories = async (req, res) => {
  try {
    const categories = await getCategories()
    res.json(successResponse(categories))
  } catch (err) {
    console.error('Get categories error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

const getProductStyles = async (req, res) => {
  try {
    const styles = await getStyles()
    res.json(successResponse(styles))
  } catch (err) {
    console.error('Get styles error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

const search = async (req, res) => {
  try {
    const { keyword, page = 1, pageSize = 10 } = req.query
    
    if (!keyword) {
      return res.status(400).json(errorResponse('Keyword is required', 400))
    }
    
    const manufacturerId = isManufacturerScopedUser(req.user) ? req.user.manufacturerId : undefined
    const result = manufacturerId
      ? await searchProducts(keyword, page, pageSize, manufacturerId)
      : await searchProducts(keyword, page, pageSize)
    res.json(paginatedResponse(result.products, result.total, result.page, result.pageSize))
  } catch (err) {
    console.error('Search error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

/**
 * 上传产品缩略图
 * POST /api/products/:productId/upload-thumbnail
 */
const uploadThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse('未找到上传的文件', 400))
    }

    const { productId } = req.params
    const storage = req.query.storage || 'gridfs'

    // 上传文件
    const fileResult = await FileService.upload(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      storage
    )

    // 更新产品缩略图
    const product = await Product.findByIdAndUpdate(
      productId,
      { thumbnail: fileResult.url },
      { new: true }
    )

    if (!product) {
      return res.status(404).json(errorResponse('产品不存在', 404))
    }

    res.json(successResponse({
      productId: product._id,
      thumbnail: product.thumbnail,
      fileId: fileResult.fileId,
      message: '缩略图上传成功'
    }))
  } catch (err) {
    console.error('Upload thumbnail error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

/**
 * 上传产品图片
 * POST /api/products/:productId/upload-images
 */
const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json(errorResponse('未找到上传的文件', 400))
    }

    const { productId } = req.params
    const storage = req.query.storage || 'gridfs'

    // 上传所有文件
    const fileResults = []
    for (const file of req.files) {
      const fileResult = await FileService.upload(
        file.buffer,
        file.originalname,
        file.mimetype,
        storage
      )
      fileResults.push(fileResult)
    }

    // 获取产品
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json(errorResponse('产品不存在', 404))
    }

    // 添加新图片到现有图片
    const newImages = fileResults.map(f => f.url)
    product.images = [...(product.images || []), ...newImages]
    await product.save()

    res.json(successResponse({
      productId: product._id,
      images: product.images,
      uploadedCount: fileResults.length,
      message: `成功上传 ${fileResults.length} 张图片`
    }))
  } catch (err) {
    console.error('Upload images error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

/**
 * 删除产品图片
 * DELETE /api/products/:productId/images/:imageIndex
 */
const deleteImage = async (req, res) => {
  try {
    const { productId, imageIndex } = req.params

    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json(errorResponse('产品不存在', 404))
    }

    const index = parseInt(imageIndex)
    if (index < 0 || index >= product.images.length) {
      return res.status(400).json(errorResponse('图片索引无效', 400))
    }

    product.images.splice(index, 1)
    await product.save()

    res.json(successResponse({
      productId: product._id,
      images: product.images,
      message: '图片删除成功'
    }))
  } catch (err) {
    console.error('Delete image error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 创建单个商品
const createProduct = async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'super_admin' && !req.user.permissions?.canManageProducts)) {
      return res.status(403).json(errorResponse('无权限创建商品', 403))
    }

    const productData = req.body

    // 兼容 materialDescriptionOptions 可能为字符串/异常结构
    if (productData.materialDescriptionOptions) {
      let options = productData.materialDescriptionOptions
      if (typeof options === 'string') {
        try {
          options = JSON.parse(options)
        } catch (e) {
          console.warn('🔴 [创建商品] materialDescriptionOptions 解析失败:', e.message)
          options = []
        }
      }
      if (!Array.isArray(options)) options = []
      productData.materialDescriptionOptions = options
        .map((o, idx) => {
          if (!o || typeof o !== 'object') return null
          const id = String(o.id || `md-${idx}`)
          const text = String(o.text || '')
          return { id, text }
        })
        .filter(Boolean)
    }

    // 设置产品拥有者（谁上传谁就是拥有者）
    productData.ownerId = req.user._id || req.user.id
    productData.ownerName = req.user.nickname || req.user.username || req.user.name

    // 如果前端已指定厂家ID，则使用前端传入的值；否则使用用户的厂家ID
    if (!productData.manufacturerId && req.user.manufacturerId && req.user.role !== 'super_admin') {
      productData.manufacturerId = req.user.manufacturerId
    }

    if (!productData.manufacturerId && productData.skus?.[0]?.manufacturerId) {
      productData.manufacturerId = productData.skus[0].manufacturerId
    }

    // 如果仍然没有manufacturerId，默认分配给平台厂家
    const platformManufacturerId = '6948fca5630729ca224ec425'
    if (!productData.manufacturerId || productData.manufacturerId === '' || productData.manufacturerId === 'undefined') {
      const mongoose = require('mongoose')
      productData.manufacturerId = new mongoose.Types.ObjectId(platformManufacturerId)
      console.log('🔥 [创建商品] 未指定厂家，默认分配给平台:', platformManufacturerId)
    }

    // 厂家体系账号：同步 SKU 的厂家归属，防止通过 SKU 绕过
    if (req.user?.manufacturerId && req.user.role !== 'super_admin' && Array.isArray(productData.skus)) {
      productData.skus = productData.skus.map(sku => ({
        ...sku,
        manufacturerId: req.user.manufacturerId
      }))
    }
    
    // 调试日志：检查category字段
    console.log('🔥 [创建商品] 商品名称:', productData.name)
    console.log('🔥 [创建商品] 接收到的category:', productData.category)

    // 处理 SKU 数据，确保 materialCategories 和 specRemark 正确保存
    if (productData.skus && Array.isArray(productData.skus)) {
      productData.skus = productData.skus.map(sku => ({
        ...sku,
        specRemark: sku.specRemark || '', // 确保specRemark被保存
        materialCategories: sku.materialCategories || [],
        material: sku.material || {},
        materialUpgradePrices: sku.materialUpgradePrices || {},
        videos: Array.isArray(sku.videos) ? sku.videos : [],
        images: Array.isArray(sku.images) ? sku.images : [],
        effectImages: Array.isArray(sku.effectImages) ? sku.effectImages : [],
        inspectionImages: Array.isArray(sku.inspectionImages) ? sku.inspectionImages : [],
        deliveryImages: Array.isArray(sku.deliveryImages) ? sku.deliveryImages : [],
      }))
    }

    // 创建商品
    const product = await Product.create(productData)
    
    // 调试日志：确认保存后的category
    console.log('🔥 [创建商品] 保存后的category:', product.category)

    res.status(201).json(successResponse(product, '商品创建成功'))
  } catch (err) {
    console.error('Create product error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 更新商品
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params
    const productData = req.body

    // 兼容 materialDescriptionOptions 可能为字符串/异常结构
    if (productData.materialDescriptionOptions) {
      let options = productData.materialDescriptionOptions
      if (typeof options === 'string') {
        try {
          options = JSON.parse(options)
        } catch (e) {
          console.warn('🔴 [更新商品] materialDescriptionOptions 解析失败:', e.message)
          options = []
        }
      }
      if (!Array.isArray(options)) options = []
      productData.materialDescriptionOptions = options
        .map((o, idx) => {
          if (!o || typeof o !== 'object') return null
          const id = String(o.id || `md-${idx}`)
          const text = String(o.text || '')
          return { id, text }
        })
        .filter(Boolean)
    }

    const existingProduct = await Product.findById(id)
    if (!existingProduct) {
      return res.status(404).json(errorResponse('商品不存在', 404))
    }

    if (!req.user) {
      return res.status(403).json(errorResponse('无权限更新商品', 403))
    }

    const ownerManufacturerId = getProductOwnerManufacturerId(existingProduct)
    const isOwner = req.user.role === 'super_admin' || req.user.role === 'admin' || (req.user.manufacturerId && ownerManufacturerId && req.user.manufacturerId.toString() === ownerManufacturerId)

    // 非归属方：仅允许改标1价（不要求 canManageProducts）
    if (!isOwner && req.user.manufacturerId) {
      const allowedKeys = ['labelPrice1']
      const providedKeys = Object.keys(productData || {}).filter(k => productData[k] !== undefined)
      const hasOnlyAllowed = providedKeys.every(k => allowedKeys.includes(k))
      if (!hasOnlyAllowed) {
        return res.status(403).json(errorResponse('仅允许修改标1价', 403))
      }

      const auth = await findAuthorizationForUserAndProduct(req.user, existingProduct)
      if (!auth || auth._isOwner) {
        return res.status(403).json(errorResponse('您没有此商品的授权', 403))
      }

      const takePrice = getAuthorizedTakePrice(auth, existingProduct.toObject())
      const nextLabelPrice = Number(productData.labelPrice1)
      if (!Number.isFinite(nextLabelPrice)) {
        return res.status(400).json(errorResponse('标1价无效', 400))
      }
      if (nextLabelPrice < takePrice) {
        return res.status(400).json(errorResponse('标1价不能低于拿货价', 400))
      }

      const key = getAuthorizationViewerKey(req.user)
      if (!key) {
        return res.status(400).json(errorResponse('无法识别授权账号', 400))
      }

      const prices = existingProduct.authorizedLabelPrices || {}
      prices[key] = nextLabelPrice
      existingProduct.authorizedLabelPrices = prices
      existingProduct.updatedAt = Date.now()
      await existingProduct.save()

      return res.json(successResponse(
        sanitizeProductForAuthorizedViewer(existingProduct.toObject(), takePrice, nextLabelPrice),
        '标1价更新成功'
      ))
    }

    // 归属方/平台管理员：正常更新，但需要管理权限（兼容旧 admin 角色）
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin' && !req.user.permissions?.canManageProducts) {
      return res.status(403).json(errorResponse('无权限更新商品', 403))
    }

    if (req.user.manufacturerId && req.user.role !== 'super_admin') {
      productData.manufacturerId = req.user.manufacturerId
      if (productData.skus && Array.isArray(productData.skus)) {
        productData.skus = productData.skus.map(sku => ({
          ...sku,
          manufacturerId: req.user.manufacturerId
        }))
      }
    }

    if (!productData.manufacturerId && productData.skus?.[0]?.manufacturerId) {
      productData.manufacturerId = productData.skus[0].manufacturerId
    }
    
    // 调试日志：检查更新数据
    console.log('🔥 [更新商品] ID:', id)
    console.log('🔥 [更新商品] 商品名称:', productData.name)
    console.log('🔥 [更新商品] 接收到的materialConfigs:', JSON.stringify(productData.materialConfigs || []))
    console.log('🔥 [更新商品] 接收到的category:', productData.category)
    console.log('🔥 [更新商品] 接收到的categories:', productData.categories)
    console.log('🔥 [更新商品] 接收到的styles:', productData.styles)
    if (productData.skus) {
      console.log('🔥 [更新商品] 接收到的SKU数量:', productData.skus.length)
      productData.skus.forEach((sku, idx) => {
        console.log(`🔥 [更新商品] SKU${idx + 1}: code="${sku.code}", spec="${sku.spec}", specRemark="${sku.specRemark || ''}", videos=${JSON.stringify(sku.videos || [])}, images数量=${sku.images?.length || 0}`)
      })
    }

    // 处理 SKU 数据，确保字段格式正确
    if (productData.skus && Array.isArray(productData.skus)) {
      productData.skus = productData.skus.map(sku => {
        // 确保 files 是数组格式（可能从前端接收到字符串）
        let files = sku.files || []
        if (typeof files === 'string') {
          try {
            files = JSON.parse(files)
          } catch (e) {
            console.warn('🔴 [更新商品] SKU files 解析失败:', e.message)
            files = []
          }
        }
        
        return {
          ...sku,
          specRemark: sku.specRemark || '', // 确保specRemark被保存
          materialCategories: sku.materialCategories || [],
          material: sku.material || {},
          materialUpgradePrices: sku.materialUpgradePrices || {},
          files: Array.isArray(files) ? files : [],
          videos: Array.isArray(sku.videos) ? sku.videos : [],
          images: Array.isArray(sku.images) ? sku.images : [],
          effectImages: Array.isArray(sku.effectImages) ? sku.effectImages : [],
          inspectionImages: Array.isArray(sku.inspectionImages) ? sku.inspectionImages : [],
          deliveryImages: Array.isArray(sku.deliveryImages) ? sku.deliveryImages : [],
        }
      })
      console.log('🔥 [更新商品] 处理后的SKU数据:', productData.skus.map(s => ({ code: s.code, spec: s.spec, specRemark: s.specRemark, files: s.files?.length || 0 })))
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { ...productData, updatedAt: Date.now() },
      { new: true, runValidators: false }
    )

    if (!product) {
      return res.status(404).json(errorResponse('商品不存在', 404))
    }
    
    // 调试日志：确认保存后的数据
    console.log('🔥 [更新商品] 保存后的materialConfigs:', JSON.stringify(product.materialConfigs || []))
    console.log('🔥 [更新商品] 保存后的category:', product.category)
    console.log('🔥 [更新商品] 保存后的categories:', product.categories)
    console.log('🔥 [更新商品] 保存后的styles:', product.styles)
    if (product.skus) {
      console.log('🔥 [更新商品] 保存后的SKU数量:', product.skus.length)
      product.skus.forEach((sku, idx) => {
        console.log(`🔥 [更新商品] 保存后SKU${idx + 1}: code="${sku.code}", images数量=${sku.images?.length || 0}`)
        if (sku.images && sku.images.length > 0) {
          console.log(`🔥 [更新商品] SKU${idx + 1}图片: [${sku.images.slice(0, 2).join(', ')}...]`)
        }
      })
    }

    res.json(successResponse(product, '商品更新成功'))
  } catch (err) {
    console.error('🔴 [更新商品] 错误:', err)
    console.error('🔴 [更新商品] 错误堆栈:', err.stack)
    console.error('🔴 [更新商品] 错误名称:', err.name)
    res.status(500).json(errorResponse(err.message || '更新商品失败', 500))
  }
}

// 删除商品
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params

    if (isManufacturerScopedUser(req.user)) {
      const existing = await Product.findById(id).select('manufacturerId').lean()
      if (!existing) {
        return res.status(404).json(errorResponse('商品不存在', 404))
      }
      if (existing.manufacturerId?.toString() !== req.user.manufacturerId?.toString()) {
        return res.status(403).json(errorResponse('无权限删除该商品', 403))
      }
    }

    const product = await Product.findByIdAndDelete(id)

    if (!product) {
      return res.status(404).json(errorResponse('商品不存在', 404))
    }

    res.json(successResponse(null, '商品删除成功'))
  } catch (err) {
    console.error('Delete product error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 批量导入商品
const bulkImport = async (req, res) => {
  try {
    const products = req.body

    // 验证是否为数组
    if (!Array.isArray(products)) {
      return res.status(400).json(errorResponse('请求体必须是数组', 400))
    }

    if (products.length === 0) {
      return res.status(400).json(errorResponse('商品列表不能为空', 400))
    }

    // 收集所有商品中的风格标签
    const allStyles = new Set()
    products.forEach(p => {
      if (p.styles && Array.isArray(p.styles)) {
        p.styles.forEach(s => {
          if (s && s.trim()) allStyles.add(s.trim())
        })
      }
      // 兼容单个 style 字段
      if (p.style && typeof p.style === 'string' && p.style.trim()) {
        allStyles.add(p.style.trim())
      }
    })

    // 查询已存在的风格
    const existingStyles = await Style.find({ name: { $in: Array.from(allStyles) } }).lean()
    const existingStyleNames = new Set(existingStyles.map(s => s.name))

    // 创建不存在的风格
    const newStyles = Array.from(allStyles).filter(s => !existingStyleNames.has(s))
    if (newStyles.length > 0) {
      const stylesToCreate = newStyles.map(name => ({
        name,
        status: 'active',
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
      await Style.insertMany(stylesToCreate, { ordered: false })
      console.log(`自动创建了 ${newStyles.length} 个新风格标签:`, newStyles)
    }

    // 为每个商品添加必要字段
    const productsWithDefaults = products.map(p => ({
      ...p,
      status: p.status || 'active',
      stock: p.stock || 0,
      sales: p.sales || 0,
      views: p.views || 0,
      images: p.images || [],
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    // 批量插入商品
    const result = await Product.insertMany(productsWithDefaults, { ordered: false })

    res.status(201).json(successResponse({
      imported: result.length,
      products: result,
      newStyles: newStyles
    }, `批量导入成功${newStyles.length > 0 ? `，自动创建了 ${newStyles.length} 个新风格标签` : ''}`))
  } catch (err) {
    console.error('Bulk import error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 更新产品分层定价配置
const updateProductPricing = async (req, res) => {
  try {
    const { id } = req.params
    const { pricingMode, tierPricingConfig } = req.body

    const product = await Product.findById(id)
    if (!product) {
      return res.status(404).json(errorResponse('商品不存在', 404))
    }

    // 检查权限：只有产品拥有者或super_admin可以修改定价
    const isOwner = String(product.ownerId) === String(req.user._id || req.user.id)
    const isSuperAdmin = req.user.role === 'super_admin'
    
    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json(errorResponse('只有产品拥有者可以修改定价配置', 403))
    }

    // 更新定价配置
    const updateData = {}
    if (pricingMode) {
      updateData.pricingMode = pricingMode
    }
    if (tierPricingConfig) {
      updateData.tierPricingConfig = tierPricingConfig
    }
    updateData.updatedAt = new Date()

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )

    res.json(successResponse(updatedProduct, '定价配置更新成功'))
  } catch (err) {
    console.error('Update product pricing error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 获取产品定价配置
const getProductPricing = async (req, res) => {
  try {
    const { id } = req.params

    const product = await Product.findById(id)
      .select('name ownerId ownerName pricingMode tierPricingConfig basePrice')
      .populate('ownerId', 'username nickname')

    if (!product) {
      return res.status(404).json(errorResponse('商品不存在', 404))
    }

    // 检查权限：只有产品拥有者或super_admin可以查看定价配置
    const isOwner = String(product.ownerId) === String(req.user._id || req.user.id)
    const isSuperAdmin = req.user.role === 'super_admin'
    
    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json(errorResponse('只有产品拥有者可以查看定价配置', 403))
    }

    res.json(successResponse(product, '获取定价配置成功'))
  } catch (err) {
    console.error('Get product pricing error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCategories,
  getProductStyles,
  search,
  bulkImport,
  updateProductPricing,
  getProductPricing
}
