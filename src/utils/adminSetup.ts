/**
 * 超级管理员账号设置工具
 * 用于创建和管理超级管理员账号
 */

import { User } from '@/types'

/**
 * 创建超级管理员账号
 */
export const createSuperAdmin = () => {
  const superAdmin: User = {
    _id: 'super-admin-zcd',
    username: 'zcd',
    email: 'zcd@admin.com',
    phone: '13800138000',
    role: 'super_admin',
    avatar: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
    balance: 0,
    tags: [],
  }

  // 获取现有用户数据
  const users = JSON.parse(localStorage.getItem('users') || '[]')

  // 检查用户是否已存在
  const existingIndex = users.findIndex((u: User) => u._id === superAdmin._id)

  if (existingIndex >= 0) {
    console.log('⚠️ 超级管理员账号已存在')
    console.log('用户信息:', users[existingIndex])
    return users[existingIndex]
  }

  // 添加超级管理员
  users.push(superAdmin)
  localStorage.setItem('users', JSON.stringify(users))

  console.log('✅ 超级管理员账号创建成功！')
  console.log('')
  console.log('📋 账号信息：')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`   用户名: zcd`)
  console.log(`   密码: asd123..`)
  console.log(`   邮箱: ${superAdmin.email}`)
  console.log(`   手机: ${superAdmin.phone}`)
  console.log(`   角色: ${superAdmin.role}`)
  console.log(`   状态: ${superAdmin.status}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log('🎉 现在可以使用以下凭证登录：')
  console.log('   账号: zcd')
  console.log('   密码: asd123..')
  console.log('')

  return superAdmin
}

/**
 * 获取超级管理员账号
 */
export const getSuperAdmin = (): User | null => {
  const users = JSON.parse(localStorage.getItem('users') || '[]')
  return users.find((u: User) => u._id === 'super-admin-zcd') || null
}

/**
 * 删除超级管理员账号
 */
export const deleteSuperAdmin = () => {
  const users = JSON.parse(localStorage.getItem('users') || '[]')
  const filteredUsers = users.filter((u: User) => u._id !== 'super-admin-zcd')
  localStorage.setItem('users', JSON.stringify(filteredUsers))
  console.log('✅ 超级管理员账号已删除')
}

/**
 * 验证超级管理员账号
 */
export const verifySuperAdmin = (username: string, password: string): boolean => {
  if (username !== 'zcd' || password !== 'asd123..') {
    return false
  }
  const admin = getSuperAdmin()
  return admin !== null
}

/**
 * 初始化超级管理员（如果不存在则创建）
 */
export const initSuperAdmin = () => {
  const existing = getSuperAdmin()
  if (existing) {
    console.log('✅ 超级管理员账号已存在')
    return existing
  }
  return createSuperAdmin()
}
