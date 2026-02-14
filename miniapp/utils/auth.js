/**
 * 登录状态检查工具
 */

function checkLogin() {
  try {
    return !!wx.getStorageSync('token')
  } catch (e) {
    return false
  }
}

function requireLogin() {
  if (checkLogin()) return true
  wx.navigateTo({ url: '/pages/login/index' })
  return false
}

module.exports = { checkLogin, requireLogin }
