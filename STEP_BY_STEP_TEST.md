# 📋 逐步测试指南 - 请按顺序操作

## 准备工作
1. 打开浏览器
2. 按 `F12` 打开开发者工具
3. 切换到 **Console** 标签
4. 保持开发者工具打开状态

---

## 测试1: 购物车规格材质信息

### 步骤A: 清空旧数据
```javascript
// 在Console中执行：
localStorage.clear()
location.reload()
```

### 步骤B: 添加新商品
1. 访问任意商品详情页
2. **重要**：选择不同的材质选项（如果有的话）
3. 点击"加入购物车"
4. 打开购物车页面

### 步骤C: 查看结果
**看到了规格材质信息吗？**
- [ ] 能看到规格
- [ ] 能看到面料
- [ ] 能看到填充
- [ ] 能看到框架
- [ ] 能看到脚架
- [ ] 什么都看不到

**如果看不到**，在Console执行：
```javascript
const cart = JSON.parse(localStorage.getItem('cart-storage') || '{}')
console.log('Cart items:', cart.state?.items)
console.log('First item:', cart.state?.items?.[0])
```
**请把输出内容告诉我！**

---

## 测试2: 购物车结算栏消失问题

### 步骤A: 添加商品
1. 确保购物车有3个商品
2. 确认底部结算栏是否显示

### 步骤B: 删除商品
1. 删除其中1个商品
2. **立即观察**底部结算栏是否还在

### 步骤C: 查看Console
如果结算栏消失了，在Console查看：
```javascript
const cart = JSON.parse(localStorage.getItem('cart-storage') || '{}')
console.log('Items count:', cart.state?.items?.length)
console.log('Should show checkout:', cart.state?.items?.length > 0)
```
**请把输出告诉我！**

---

## 测试3: 收藏功能

### 步骤A: 尝试收藏第1个商品
1. 打开商品详情页
2. 点击收藏图标（心形）
3. 查看Console有没有错误
4. 切换到 **Network** 标签
5. 找到 `favorites` 请求
6. 点击该请求，查看：
   - **Status**: 是多少？（200? 400? 500?）
   - **Response**: 返回了什么内容？

**请把Status和Response告诉我！**

### 步骤B: 尝试收藏第2个商品
1. 打开另一个商品详情页
2. 点击收藏图标
3. 再次查看Network的 `favorites` 请求
   - **Status**: 是多少？
   - **Response**: 返回了什么？

**请告诉我两次收藏的结果！**

---

## 测试4: 对比数字位置

### 步骤A: 添加对比商品
1. 打开商品详情页
2. 点击"加入对比"按钮
3. 添加2-3个商品到对比

### 步骤B: 检查数字显示位置
**Header右上角**（网页顶部）：
- [ ] 能看到对比图标（天平/Scale图标）
- [ ] 对比图标上有红色数字
- [ ] 对比图标上没有数字

**商品详情页的"加入对比"按钮**：
- [ ] 按钮上有数字
- [ ] 按钮上没有数字

### 步骤C: 如果都没有数字
在Console执行：
```javascript
const compare = JSON.parse(localStorage.getItem('compare-storage') || '{}')
console.log('Compare items:', compare.state?.compareItems)
console.log('Compare count:', compare.state?.compareItems?.length)
```
**请把输出告诉我！**

---

## 测试5: 订单页面规格材质信息

### 步骤A: 查看我的订单
1. 访问"我的订单"页面
2. 查看订单中的商品

**能看到以下信息吗？**
- [ ] 规格
- [ ] 面料 + 加价
- [ ] 填充 + 加价
- [ ] 框架 + 加价
- [ ] 脚架 + 加价

**如果看不到**：
这可能是因为订单是旧的（在代码更新前创建的）。
需要创建一个新订单来测试。

---

## 📸 需要的截图

如果可以，请提供以下截图：
1. **购物车页面** - 显示商品详情部分
2. **Network标签** - 收藏请求的Response
3. **Console标签** - 上述命令的输出
4. **Header右上角** - 对比图标区域

---

## 🎯 最重要的信息

**请务必告诉我**：
1. 收藏第2个商品时，Network返回的Status和Response内容
2. 购物车localStorage中的商品数据（`cart.state.items[0]`）
3. Console有什么错误信息
4. 删除商品后，items.length是多少

有了这些信息，我可以准确找到问题所在！
