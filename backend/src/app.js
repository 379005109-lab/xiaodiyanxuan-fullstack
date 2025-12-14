const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const compression = require('compression')
const errorHandler = require('./middleware/errorHandler')

const app = express()

// CORS 中间件 - 必须在 helmet 之前
// 为避免生产环境因环境变量失效而导致 500，改为宽松模式：
// 1. 总是允许请求的 Origin（若存在）
// 2. 仍然从 CORS_ORIGIN 环境变量中读取白名单，仅用于日志告警，不再拒绝请求
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map(o => o.trim())

    // 如果没有 Origin（如 curl/Postman）直接通过
    if (!origin) return callback(null, true)

    // 若白名单包含 * 或明确包含该 Origin，则允许；否则仅告警但仍放行，避免生产异常
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    console.warn(`⚠️  [CORS] 非白名单 Origin: ${origin}，已放行但请检查 CORS_ORIGIN 配置`)
    return callback(null, true)
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}))

// 安全中间件 - 在 CORS 之后
app.use(helmet({
  crossOriginResourcePolicy: false // 不设置 CORP，让 CORS 处理
}))
app.use(compression())

// 日志中间件
app.use(morgan('dev'))

// JSON 解析中间件 - 增加请求体大小限制到500MB支持大量图片上传
app.use(express.json({ limit: '500mb' }))
app.use(express.urlencoded({ extended: true, limit: '500mb' }))

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() })
})

// API 路由
app.use('/api/auth', require('./routes/auth'))
app.use('/api/cart', require('./routes/cart'))
app.use('/api/orders', require('./routes/orders'))
app.use('/api/favorites', require('./routes/favorites'))
app.use('/api/addresses', require('./routes/addresses'))
app.use('/api/coupons', require('./routes/coupons'))
app.use('/api/users', require('./routes/users'))
app.use('/api/home', require('./routes/home'))
app.use('/api/compare', require('./routes/compare'))
app.use('/api/notifications', require('./routes/notifications'))
app.use('/api/products', require('./routes/products'))
app.use('/api/categories', require('./routes/categories'))
app.use('/api/materials', require('./routes/materials'))
app.use('/api/dashboard', require('./routes/dashboard'))
app.use('/api/site-config', require('./routes/siteConfig'))
app.use('/api/customization', require('./routes/customization'))
app.use('/api/concierge', require('./routes/concierge'))

// 账号管理路由
app.use('/api/accounts', require('./routes/accounts'))

// 文件上传路由
app.use('/api/files', require('./routes/files'))
app.use('/api/bargains', require('./routes/bargains'))
app.use('/api/packages', require('./routes/packages'))
app.use('/api/banners', require('./routes/banners'))
app.use('/api/buying-service-requests', require('./routes/buyingService'))
app.use('/api/refunds', require('./routes/refunds'))
app.use('/api/browse-history', require('./routes/browseHistory'))
app.use('/api/manufacturers', require('./routes/manufacturers'))
app.use('/api/commission-rules', require('./routes/commissionRules'))
app.use('/api/commission-system', require('./routes/commissionSystem'))
app.use('/api/channel-partners', require('./routes/channelPartners'))
app.use('/api/referrals', require('./routes/referral'))
app.use('/api/manufacturer-orders', require('./routes/manufacturerOrder'))
app.use('/api/image-search', require('./routes/imageSearch'))
app.use('/api/authorizations', require('./routes/authorizations'))

// 微信小程序专用接口
app.use('/api/miniapp', require('./routes/miniapp'))
// 兼容小程序端 /api/miniapp/api/xxx 格式的请求
app.use('/api/miniapp/api', require('./routes/miniapp'))

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: 'Not Found',
    data: null
  })
})

// 错误处理中间件
app.use(errorHandler)

module.exports = app
// Force rebuild
