# 前端商城白屏问题诊断指南

## 🔍 诊断步骤

### 步骤1：检查Console错误

1. 打开浏览器（建议无痕模式）
2. 访问：http://lgpzubdtdxjf.sealoshzh.site/
3. 按 **F12** 打开开发者工具
4. 查看 **Console** 标签页

**记录以下信息**：
- 是否有红色错误信息？
- 错误信息内容是什么？
- 是否提示某个JS文件加载失败？

### 步骤2：检查Network

1. 切换到 **Network** 标签页
2. 刷新页面（Ctrl+R）
3. 查看所有请求

**检查**：
- `index-*.js` 文件是否成功加载（状态200）？
- 是否有404或502错误？
- 哪个文件加载失败了？

### 步骤3：检查Elements

1. 切换到 **Elements** 标签页
2. 查看 `<div id="root"></div>` 内部

**情况分析**：
- 如果root内部为空 → JS未执行
- 如果有内容但不显示 → CSS问题
- 如果有错误边界组件 → 组件渲染错误

---

## 🐛 常见问题和解决方案

### 问题1：JS文件404

**症状**：
```
Failed to load resource: the server responded with a status of 404
index-sSWpV9Wx.js 404 (Not Found)
```

**原因**：
- 前端构建后文件名变了，但HTML还引用旧文件
- ConfigMap未更新

**解决方案**：
重新构建并部署前端（参考FINAL_STATUS_AND_TODO.md）

---

### 问题2：路由404

**症状**：
- 首页白屏
- 访问其他页面正常

**原因**：
- Nginx配置问题
- try_files配置错误

**解决方案**：
检查nginx配置是否有 `try_files $uri $uri/ /index.html;`

---

### 问题3：API调用失败

**症状**：
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
或
502 Bad Gateway
```

**原因**：
- 后端服务未启动
- API URL配置错误

**解决方案**：
```bash
# 检查后端Pod状态
kubectl get pods -n ns-cxxiwxce -l app=xiaodiyanxuan-api

# 测试API
curl http://lgpzubdtdxjf.sealoshzh.site/api/health
```

---

### 问题4：React渲染错误

**症状**：
Console显示React错误，如：
```
Uncaught Error: Minified React error #...
或
TypeError: Cannot read property '...' of undefined
```

**原因**：
- 组件代码有bug
- 数据格式不匹配
- 依赖缺失

**解决方案**：
1. 查看完整错误栈
2. 定位出错的组件
3. 检查该组件的代码

---

## 💡 快速测试方法

### 测试1：HTML是否正确

```bash
curl http://lgpzubdtdxjf.sealoshzh.site/ | grep "root"
```

应该看到：`<div id="root"></div>`

### 测试2：JS文件是否存在

```bash
# 获取JS文件名
JS_FILE=$(curl -s http://lgpzubdtdxjf.sealoshzh.site/ | grep -o 'index-[^.]*\.js')
echo "JS文件: $JS_FILE"

# 测试JS文件是否可访问
curl -I http://lgpzubdtdxjf.sealoshzh.site/assets/$JS_FILE
```

应该返回 `200 OK`

### 测试3：后端API是否正常

```bash
curl http://lgpzubdtdxjf.sealoshzh.site/api/health
```

应该返回：`{"status":"ok",...}`

---

## 🔧 修复建议

### 如果是JS文件404

需要重新部署前端：

```bash
# 1. 重新构建
cd /home/devbox/project/frontend
npm run build

# 2. 更新ConfigMap
cd dist && tar czf /tmp/fe.tar.gz *
export KUBECONFIG="/home/devbox/project/kubeconfig (7).yaml"
kubectl delete configmap xiaodiyanxuan-frontend-html -n ns-cxxiwxce
kubectl create configmap xiaodiyanxuan-frontend-html --from-file=frontend-dist.tar.gz=/tmp/fe.tar.gz -n ns-cxxiwxce

# 3. 重启Pod
kubectl delete pods -n ns-cxxiwxce -l app=xiaodiyanxuan-frontend

# 4. 等待30秒后测试
```

### 如果是组件错误

1. 记录完整的错误信息
2. 定位出错组件
3. 检查该组件的代码
4. 修复后重新构建部署

### 如果是API错误

1. 检查后端Pod状态
2. 查看后端日志
3. 重启后端Pod

---

## 📝 诊断结果模板

请按以下格式提供诊断结果：

```
【诊断结果】
1. Console错误：
   - 错误信息：[粘贴错误信息]
   - 错误文件：[哪个文件报错]

2. Network状态：
   - HTML加载：[成功/失败]
   - JS文件加载：[成功/失败，文件名]
   - API请求：[成功/失败，哪个API]

3. 页面表现：
   - root元素内容：[空/有内容/错误边界]
   - 具体症状：[描述看到的情况]

4. 其他信息：
   - 浏览器：[Chrome/Firefox/等]
   - 是否无痕模式：[是/否]
```

---

**请按照步骤1-3进行诊断，并提供诊断结果！**
