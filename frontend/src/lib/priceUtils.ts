/**
 * 价格折扣计算工具
 */

import { Category } from '@/types'

/**
 * 根据用户角色和分类折扣计算最终价格
 * @param basePrice 原价
 * @param userRole 用户角色
 * @param categoryDiscounts 分类折扣数组
 * @returns 折扣后价格
 */
export function calculateDiscountedPrice(
  basePrice: number,
  userRole: string | undefined,
  categoryDiscounts: Array<{ role: string; discountPercent: number }> | undefined
): number {
  if (!userRole || !categoryDiscounts || categoryDiscounts.length === 0) {
    return basePrice
  }

  // 查找该角色的折扣
  const discount = categoryDiscounts.find(d => d.role === userRole)
  
  if (!discount) {
    return basePrice
  }

  // 计算折扣价格
  const discountPercent = discount.discountPercent || 100
  return Math.round(basePrice * discountPercent / 100)
}

/**
 * 获取用户角色的折扣百分比
 * @param userRole 用户角色
 * @param categoryDiscounts 分类折扣数组
 * @returns 折扣百分比 (如 80 表示8折)
 */
export function getDiscountPercent(
  userRole: string | undefined,
  categoryDiscounts: Array<{ role: string; discountPercent: number }> | undefined
): number {
  if (!userRole || !categoryDiscounts || categoryDiscounts.length === 0) {
    return 100
  }

  const discount = categoryDiscounts.find(d => d.role === userRole)
  return discount?.discountPercent || 100
}

/**
 * 检查是否有折扣
 */
export function hasDiscount(
  userRole: string | undefined,
  categoryDiscounts: Array<{ role: string; discountPercent: number }> | undefined
): boolean {
  const percent = getDiscountPercent(userRole, categoryDiscounts)
  return percent < 100
}
