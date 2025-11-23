# 待修复问题清单

## 1. 前端收藏显示问题 ❌

### 问题
收藏页面无法正确显示收藏的商品

### 根本原因
**API路径不一致**：

**文件**: `frontend/src/services/favoriteService.ts`

```typescript
// Line 18: 获取收藏 - 使用 /favorites
const response = await apiClient.get('/favorites', { params: { page, limit } })

// Line 40: 删除收藏 - 使用 /api/favorites/
await apiClient.delete(`/api/favorites/${favoriteId}`)

// Line 49: 检查收藏 - 使用 /api/favorites/
const response = await apiClient.get(`/api/favorites/check/${productId}`)
```

**问题**: 路径不统一，导致请求失败

### 修复方案
统一所有API路径，去掉 `/api` 前缀（因为apiClient已配置baseURL）

---

## 2. 套餐管理问题 ❌

### 问题A: 无法保存，不知道是本地还是数据库

**文件**: `frontend/src/pages/admin/PackageManagementPage.tsx`

**当前实现**:
```typescript
// Line 69: 从localStorage读取
const existingPackages: Package[] = JSON.parse(localStorage.getItem('packages') || '[]');

// 保存时也是localStorage
```

**问题**: 
- ✅ 数据保存在浏览器localStorage
- ❌ 不是保存到数据库
- ❌ 清除缓存数据就丢失

### 问题B: 商品读取是假数据

**当前实现**:
```typescript
// Line 37-44: 使用mock数据
const mockProducts: Product[] = [
  { id: 1, name: '现代简约布艺沙发', price: 2999, ... },
  { id: 2, name: '轻奢科技绒沙发', price: 3599, ... },
  // ...
];
```

**问题**:
- ❌ 不是从商品管理读取真实数据
- ❌ 无法选择实际的商品

### 修复方案
1. 使用真实的package API（`/api/packages`）
2. 使用真实的product API（`/api/products`）

---

## 3. 素材管理新建逻辑问题 ❌

### 问题
新建材质默认会归类到"other"分组

**文件**: `frontend/src/pages/admin/MaterialManagement.tsx`

**当前实现**:
```typescript
// Line 657: 默认归类为'other'
let groupKey = 'other';
if (material.name.includes('普通皮')) {
  groupKey = '普通皮';
} else if (material.name.includes('全青皮')) {
  groupKey = '全青皮';
}
// ... 其他判断
```

**问题**:
- ❌ 新建材质自动归类到"other"小分类
- ✅ 应该：新建材质是独立一栏，不自动归类
- ✅ 正确：只有在商品下添加材质时才归类

### 修复方案
1. 删除自动归类逻辑
2. 新建材质显示为独立项
3. 只在商品材质选择时显示分组

---

## 修复优先级

### 高优先级（严重影响功能）
1. ✅ **收藏API路径** - 简单修复，影响大
2. ✅ **套餐管理API** - 需要连接真实数据

### 中优先级（UX问题）
3. ✅ **素材管理分组** - 逻辑调整

---

## 技术细节

### 收藏API修复

**Before**:
```typescript
await apiClient.delete(`/api/favorites/${favoriteId}`)
```

**After**:
```typescript
await apiClient.delete(`/favorites/${favoriteId}`)
```

### 套餐管理修复

**需要创建/确认的API**:
```typescript
// 1. 套餐API
GET    /api/packages       // 获取套餐列表
GET    /api/packages/:id   // 获取单个套餐
POST   /api/packages       // 创建套餐
PUT    /api/packages/:id   // 更新套餐
DELETE /api/packages/:id   // 删除套餐

// 2. 使用现有商品API
GET    /api/products       // 获取商品列表
```

### 素材管理修复

**删除自动分组**:
```typescript
// Before
let groupKey = 'other';
if (material.name.includes('普通皮')) groupKey = '普通皮';

// After
// 直接显示材质，不自动分组
```

---

## 测试计划

### 测试1: 收藏功能
1. 添加商品到收藏
2. 访问收藏页面
3. 验证商品正确显示
4. 删除收藏
5. 验证更新成功

### 测试2: 套餐管理
1. 创建新套餐
2. 选择真实商品
3. 保存套餐
4. 刷新页面
5. 验证数据持久化

### 测试3: 素材管理
1. 新建材质
2. 验证不自动归类到other
3. 显示为独立材质
4. 在商品中使用材质
5. 验证分组正确

---

## 实施步骤

1. **修复收藏API路径** (5分钟)
2. **修复套餐管理连接真实API** (30分钟)
3. **修复素材管理分组逻辑** (15分钟)
4. **测试验证** (15分钟)
5. **部署** (5分钟)

**总计**: 约70分钟
