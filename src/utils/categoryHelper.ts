import { Category, UserRole } from '@/types'

const flattenCategories = (categories: Category[]): Category[] => {
  const result: Category[] = []

  const traverse = (cat: Category) => {
    result.push(cat)
    ;(cat.children || []).forEach(traverse)
  }

  categories.forEach(traverse)
  return result
}

export const createCategoryLookup = (categories: Category[]): Map<string, Category> => {
  const flat = flattenCategories(categories)
  const map = new Map<string, Category>()
  flat.forEach((cat) => {
    map.set(cat._id, cat)
    if (cat.slug) map.set(cat.slug, cat)
    map.set(cat.name, cat)
  })
  return map
}

export const getRoleDiscountMultiplier = (
  lookup: Map<string, Category>,
  role?: UserRole,
  categoryKey?: string
): number => {
  if (!role || !categoryKey) return 1
  const category = lookup.get(categoryKey)
  if (!category || !category.discounts?.length) return 1
  const entry = category.discounts.find((d) => d.role === role)
  if (!entry || typeof entry.discount !== 'number') return 1
  return entry.discount / 100
}
