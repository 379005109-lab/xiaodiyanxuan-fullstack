// API 配置文件
// 请将您的 Sealos 后端服务地址填写到下面的 baseURL
// 注意：小程序必须使用 HTTPS 协议，且域名需要备案

const config = {
  // Sealos 后端服务地址（根域名，不含路径后缀）
  // 小程序专用接口前缀：/api/miniapp
  // 通用接口前缀：/api
  // baseURL: 'https://pkochbpmcgaa.sealoshzh.site',
  // baseURL: 'https://xiaodiyanxuan.com',
  baseURL: 'http://localhost:8080',

  // 小程序专用接口前缀（认证、商品、订单、套餐等）
  miniappPrefix: '/api/miniapp',

  // 通用接口前缀（购物车、收藏、地址、优惠券等）
  apiPrefix: '/api',
  
  // 请求超时时间（毫秒）
  timeout: 10000,
  
  // 是否开启调试模式
  debug: true
}

module.exports = config

