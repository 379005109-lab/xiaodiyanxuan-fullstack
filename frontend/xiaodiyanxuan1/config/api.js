// API 配置文件
// 请将您的 Sealos 后端服务地址填写到下面的 baseURL
// 注意：小程序必须使用 HTTPS 协议，且域名需要备案

const config = {
  // Sealos 后端服务地址
  // 当前后端地址：http://houduanceshi.ns-cxxiwxce:5000
  // ⚠️ 需要配置为 HTTPS 域名才能在小程序中使用
  // 请在 Sealos 中配置 Ingress 和域名，然后替换下面的地址
  baseURL: 'https://pkochbpmcgaa.sealoshzh.site/api/miniapp',  // 请替换为实际的 HTTPS 地址
  
  // 请求超时时间（毫秒）
  timeout: 10000,
  
  // 是否开启调试模式
  debug: true
}

module.exports = config

