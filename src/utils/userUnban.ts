/**
 * 用户解禁工具
 * 用于快速解禁被封禁的用户账号
 */

/**
 * 解禁指定用户
 * @param username 用户名
 * @returns 解禁是否成功
 */
export const unbanUser = (username: string): boolean => {
  try {
    // 从localStorage获取用户列表
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    
    // 查找用户
    const userIndex = users.findIndex((u: any) => u.username === username)
    
    if (userIndex === -1) {
      console.error(`❌ 用户 ${username} 不存在`)
      return false
    }
    
    // 修改用户状态为active
    users[userIndex].status = 'active'
    
    // 保存回localStorage
    localStorage.setItem('users', JSON.stringify(users))
    
    console.log(`✅ 用户 ${username} 已解禁`)
    console.log(`📋 用户信息:`, users[userIndex])
    
    return true
  } catch (error) {
    console.error(`❌ 解禁失败:`, error)
    return false
  }
}

/**
 * 获取被封禁的用户列表
 * @returns 被封禁的用户列表
 */
export const getBannedUsers = (): any[] => {
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const bannedUsers = users.filter((u: any) => u.status === 'banned')
    
    console.log(`📋 被封禁的用户列表 (共 ${bannedUsers.length} 个):`)
    bannedUsers.forEach((u: any) => {
      console.log(`  - ${u.username} (${u.email}) - 角色: ${u.role}`)
    })
    
    return bannedUsers
  } catch (error) {
    console.error(`❌ 获取被封禁用户失败:`, error)
    return []
  }
}

/**
 * 快速解禁 xiaodi 账号
 * @returns 解禁是否成功
 */
export const unbanXiaodi = (): boolean => {
  console.log('🔓 开始解禁 xiaodi 账号...')
  const success = unbanUser('xiaodi')
  
  if (success) {
    // 同时清除认证缓存，更新当前登录用户的状态
    try {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        const authData = JSON.parse(authStorage)
        if (authData.state && authData.state.user && authData.state.user.username === 'xiaodi') {
          // 更新当前登录用户的状态
          authData.state.user.status = 'active'
          localStorage.setItem('auth-storage', JSON.stringify(authData))
          console.log('✅ 已更新当前登录用户的状态')
        }
      }
    } catch (error) {
      console.error('⚠️ 更新认证缓存失败:', error)
    }
    
    console.log('✅ xiaodi 账号已成功解禁！')
    console.log('💡 提示: 请刷新页面以查看更新')
    
    // 跳转到首页
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    }, 1000)
  } else {
    console.log('❌ xiaodi 账号解禁失败')
  }
  
  return success
}

/**
 * 创建或更新超级管理员账号
 * @param username 用户名
 * @param email 邮箱
 * @param password 密码
 * @returns 是否成功
 */
export const createOrUpdateSuperAdmin = (
  username: string = 'xiaodi',
  email: string = 'xiaodi@admin.com',
  password: string = 'admin123'
): boolean => {
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    
    // 查找是否已存在
    const existingIndex = users.findIndex((u: any) => u.username === username)
    
    const adminUser = {
      _id: `user-${Date.now()}`,
      username,
      email,
      password, // 注意：实际应用中不应该在客户端存储密码
      phone: '13800138000',
      role: 'super_admin',
      avatar: '/placeholder.svg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      balance: 0,
    }
    
    if (existingIndex >= 0) {
      // 更新现有用户
      users[existingIndex] = { ...users[existingIndex], ...adminUser, _id: users[existingIndex]._id }
      console.log(`✅ 超级管理员账号 ${username} 已更新`)
    } else {
      // 创建新用户
      users.push(adminUser)
      console.log(`✅ 超级管理员账号 ${username} 已创建`)
    }
    
    localStorage.setItem('users', JSON.stringify(users))
    console.log(`📋 账号信息:`)
    console.log(`  - 用户名: ${username}`)
    console.log(`  - 邮箱: ${email}`)
    console.log(`  - 密码: ${password}`)
    console.log(`  - 角色: 超级管理员`)
    console.log(`  - 状态: 正常`)
    
    return true
  } catch (error) {
    console.error(`❌ 创建/更新超级管理员失败:`, error)
    return false
  }
}

/**
 * 显示使用说明
 */
export const showHelp = (): void => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    用户解禁工具使用说明                        ║
╚════════════════════════════════════════════════════════════════╝

📌 快速解禁 xiaodi:
   unbanXiaodi()

📌 解禁指定用户:
   unbanUser('username')

📌 查看被封禁的用户:
   getBannedUsers()

📌 创建/更新超级管理员:
   createOrUpdateSuperAdmin('xiaodi', 'xiaodi@admin.com', 'admin123')

📌 显示帮助:
   showHelp()

💡 使用方法:
   1. 打开浏览器开发者工具 (F12)
   2. 进入 Console 标签
   3. 复制粘贴上述命令并执行
   4. 刷新页面查看更新

⚠️  注意: 这些操作会修改 localStorage 中的数据
  `)
}
