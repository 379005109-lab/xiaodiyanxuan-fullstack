# 📱 阿里云短信服务配置指南

## 🔍 当前状态分析

### 代码已完备 ✅
- ✅ 短信服务代码已实现 (`/backend/src/services/smsService.js`)
- ✅ 控制器已集成 (`/backend/src/controllers/authController.js`)
- ✅ 阿里云SDK已安装 (`@alicloud/dysmsapi20170525`)

### 缺少配置 ❌
需要在后端环境变量中配置阿里云短信参数

---

## 🛠️ 配置步骤

### 第1步: 阿里云控制台配置

1. **登录阿里云控制台**
   - 访问：https://ecs.console.aliyun.com/

2. **开通短信服务**
   - 搜索"短信服务"
   - 开通服务

3. **创建签名**
   - 签名名称：`深圳市乌伯视界网络科技`（已在代码中配置）
   - 签名来源：企业全称
   - 适用场景：通用

4. **创建模板**
   - 模板类型：验证码
   - 模板名称：登录验证码
   - 模板内容：`您的验证码是${code}，${time}分钟内有效，请勿泄露。`
   - 获取模板CODE（如：SMS_498875086）

5. **获取AccessKey**
   - 访问：https://ram.console.aliyun.com/users
   - 创建用户或使用现有用户
   - 获取 AccessKey ID 和 AccessKey Secret

---

### 第2步: 后端环境变量配置

在 `/home/devbox/project/backend/.env` 文件中添加：

```env
# 阿里云短信服务配置
ALIYUN_SMS_ACCESS_KEY_ID=你的AccessKey_ID
ALIYUN_SMS_ACCESS_KEY_SECRET=你的AccessKey_Secret
ALIYUN_SMS_SIGN_NAME=深圳市乌伯视界网络科技
ALIYUN_SMS_TEMPLATE_CODE=SMS_498875086
```

---

### 第3步: 重启后端服务

```bash
# 重启后端Pod
kubectl rollout restart deployment/xiaodiyanxuan-api -n ns-cxxiwxce
```

---

## 📋 当前代码配置

### 短信服务配置
```javascript
const SMS_CONFIG = {
  accessKeyId: process.env.ALIYUN_SMS_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET || '',
  signName: process.env.ALIYUN_SMS_SIGN_NAME || '深圳市乌伯视界网络科技',
  templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE || 'SMS_498875086'
}
```

### API端点
- **发送验证码**: `POST /api/auth/send-code`
- **注册**: `POST /api/auth/register`
- **登录**: `POST /api/auth/login`

---

## 🧪 测试方法

### 1. 检查配置
```bash
curl -X POST https://pkochbpmcgaa.sealoshzh.site/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000"}'
```

### 2. 预期响应
**成功**:
```json
{
  "success": true,
  "data": {
    "message": "验证码已发送"
  }
}
```

**失败（配置缺失）**:
```json
{
  "success": false,
  "message": "短信服务未配置"
}
```

---

## 🔧 故障排除

### 问题1: "短信服务未配置"
**原因**: 环境变量未设置
**解决**: 添加 `.env` 配置并重启服务

### 问题2: "签名不存在"
**原因**: 签名未审核通过
**解决**: 在阿里云控制台检查签名状态

### 问题3: "模板不存在"
**原因**: 模板CODE错误
**解决**: 检查模板CODE是否正确

### 问题4: "权限不足"
**原因**: AccessKey权限不够
**解决**: 给用户添加短信服务权限

---

## 📊 图片显示问题修复

### 问题
选配中心的商品图片显示不正确

### 解决方案
已修复图片URL逻辑：
1. 优先使用真实图片API
2. 为每个商品指定专属的高质量图片
3. 添加错误处理机制

```typescript
// 图片URL优先级：
// 1. SKU图片: /api/files/{imageId}
// 2. 商品图片: /api/files/{imageId}  
// 3. 专属高质量图片（按商品名称）
// 4. 默认备用图片
```

---

## 🎯 下一步操作

1. **配置阿里云短信**（按上述步骤）
2. **重启后端服务**
3. **测试短信发送**
4. **验证注册登录流程**

---

**配置完成后，短信验证码功能将正常工作！** 📱
