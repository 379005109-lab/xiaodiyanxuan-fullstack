# 🚀 后续步骤 - 立即行动

**当前状态**: ✅ 后端实现完成  
**下一步**: 测试 → 前端集成 → 部署

---

## 📋 立即行动清单

### ✅ 第 1 步: 验证后端 (5 分钟)

```bash
# 1. 检查后端服务是否运行
pm2 status

# 2. 如果没有运行，启动它
pm2 start ecosystem.config.js

# 3. 检查健康状态
curl http://localhost:8080/health
```

### ✅ 第 2 步: 运行测试 (10 分钟)

```bash
# 1. 进入后端目录
cd /home/devbox/project/backend

# 2. 运行测试脚本
bash test-new-modules.sh

# 3. 或手动测试
curl http://localhost:8080/api/website-images
curl -X POST http://localhost:8080/api/design-requests \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "测试",
    "userPhone": "13800138000",
    "description": "测试设计需求"
  }'
```

### ✅ 第 3 步: 查看日志 (5 分钟)

```bash
# 查看后端日志
pm2 logs xiaodiyanxuan-api

# 或查看特定错误
pm2 logs xiaodiyanxuan-api --err
```

---

## 📝 前端团队需要做的

### 1. 创建 Service 文件

**文件**: `src/services/websiteImageService.ts`
```typescript
import apiClient from './apiClient';

export const websiteImageService = {
  // 获取所有首页图片配置
  getAllImages: () => apiClient.get('/website-images'),
  
  // 获取特定部分的图片配置
  getImagesBySection: (section: string) => 
    apiClient.get(`/website-images/${section}`),
  
  // 保存图片配置
  saveImages: (section: string, items: any[]) => 
    apiClient.post('/website-images/save', { section, items }),
  
  // 更新特定项目
  updateImage: (section: string, itemId: string, data: any) => 
    apiClient.put(`/website-images/${section}/${itemId}`, data),
  
  // 删除特定项目
  deleteImage: (section: string, itemId: string) => 
    apiClient.delete(`/website-images/${section}/${itemId}`)
};
```

**文件**: `src/services/designRequestService.ts`
```typescript
import apiClient from './apiClient';

export const designRequestService = {
  // 获取所有设计需求
  getAllRequests: (params?: any) => 
    apiClient.get('/design-requests', { params }),
  
  // 获取单个设计需求
  getRequestById: (id: string) => 
    apiClient.get(`/design-requests/${id}`),
  
  // 提交设计需求
  createRequest: (data: any) => 
    apiClient.post('/design-requests', data),
  
  // 更新状态
  updateStatus: (id: string, status: string) => 
    apiClient.put(`/design-requests/${id}/status`, { status }),
  
  // 更新备注
  updateNotes: (id: string, notes: string) => 
    apiClient.put(`/design-requests/${id}/notes`, { notes }),
  
  // 分配设计师
  assignDesigner: (id: string, designerId: string) => 
    apiClient.put(`/design-requests/${id}/assign`, { designerId }),
  
  // 删除需求
  deleteRequest: (id: string) => 
    apiClient.delete(`/design-requests/${id}`),
  
  // 获取统计
  getStats: () => 
    apiClient.get('/design-requests/stats/summary')
};
```

### 2. 在组件中使用

```typescript
import { websiteImageService } from '@/services/websiteImageService';
import { designRequestService } from '@/services/designRequestService';

// 获取首页图片
const images = await websiteImageService.getAllImages();

// 提交设计需求
const result = await designRequestService.createRequest({
  userName: '张三',
  userPhone: '13800138000',
  description: '三室两厅装修',
  images: []
});
```

---

## 🧪 完整的测试命令

### 测试首页图片管理

```bash
# 1. 获取所有配置
curl http://localhost:8080/api/website-images

# 2. 获取特定部分
curl http://localhost:8080/api/website-images/supply-chain

# 3. 保存配置 (需要 token)
curl -X POST http://localhost:8080/api/website-images/save \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "section": "supply-chain",
    "items": [
      {
        "id": "1",
        "title": "强大供应链体系",
        "url": "/supply-chain",
        "image": "https://example.com/image.jpg",
        "order": 1
      }
    ]
  }'

# 4. 更新项目
curl -X PUT http://localhost:8080/api/website-images/supply-chain/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "更新的标题",
    "url": "/supply-chain",
    "image": "https://example.com/new-image.jpg",
    "order": 1
  }'

# 5. 删除项目
curl -X DELETE http://localhost:8080/api/website-images/supply-chain/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 测试设计管理

```bash
# 1. 提交设计需求 (公开)
curl -X POST http://localhost:8080/api/design-requests \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "张三",
    "userPhone": "13800138000",
    "userEmail": "zhangsan@example.com",
    "description": "三室两厅装修设计",
    "images": ["https://example.com/image1.jpg"]
  }'

# 2. 获取列表 (需要 token)
curl http://localhost:8080/api/design-requests \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. 按状态筛选
curl "http://localhost:8080/api/design-requests?status=pending&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. 搜索
curl "http://localhost:8080/api/design-requests?search=张三" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. 获取详情
curl http://localhost:8080/api/design-requests/REQUEST_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# 6. 更新状态
curl -X PUT http://localhost:8080/api/design-requests/REQUEST_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "in_progress" }'

# 7. 更新备注
curl -X PUT http://localhost:8080/api/design-requests/REQUEST_ID/notes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "notes": "已分配给设计师李四" }'

# 8. 分配设计师
curl -X PUT http://localhost:8080/api/design-requests/REQUEST_ID/assign \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "designerId": "DESIGNER_ID" }'

# 9. 获取统计
curl http://localhost:8080/api/design-requests/stats/summary \
  -H "Authorization: Bearer YOUR_TOKEN"

# 10. 删除需求
curl -X DELETE http://localhost:8080/api/design-requests/REQUEST_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 时间估计

| 任务 | 时间 | 负责人 |
|------|------|--------|
| 后端测试 | 15 分钟 | 后端 |
| 前端 Service 创建 | 30 分钟 | 前端 |
| 前端组件集成 | 1 小时 | 前端 |
| 端到端测试 | 30 分钟 | 前端 |
| 部署 | 30 分钟 | 运维 |
| **总计** | **3 小时** | - |

---

## 🔍 常见问题

### Q: 如何获取 Admin Token?
**A**: 使用管理员账号登录，获取 JWT Token
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

### Q: 如何处理图片上传?
**A**: 使用现有的 `/api/upload` 端点
```bash
curl -X POST http://localhost:8080/api/upload \
  -F "file=@image.jpg" \
  -F "type=website-image"
```

### Q: 如何测试权限?
**A**: 不带 Token 访问需要权限的端点
```bash
curl -X POST http://localhost:8080/api/website-images/save \
  -H "Content-Type: application/json" \
  -d '{"section":"supply-chain","items":[]}'
# 应该返回 401 或 403
```

### Q: 如何调试?
**A**: 查看后端日志
```bash
pm2 logs xiaodiyanxuan-api
```

---

## 📞 联系方式

有任何问题，请查看:
- 详细计划: `BACKEND_INTEGRATION_PLAN.md`
- 快速指南: `QUICK_BACKEND_GUIDE.md`
- 实现报告: `BACKEND_IMPLEMENTATION_COMPLETE.md`

---

## ✅ 检查清单

### 后端
- [x] 模型创建
- [x] 控制器实现
- [x] 路由配置
- [x] 主服务器集成
- [ ] 本地测试通过
- [ ] 代码提交

### 前端
- [ ] Service 创建
- [ ] 组件集成
- [ ] 本地测试
- [ ] 公网测试

### 部署
- [ ] 代码提交
- [ ] 镜像构建
- [ ] 镜像推送
- [ ] Kubernetes 更新
- [ ] 公网验证

---

## 🎉 现在就开始吧！

1. ✅ **后端已完成** - 可以立即测试
2. 🔄 **前端集成** - 创建 Service 并集成
3. 🚀 **部署** - 构建镜像并部署

---

**最后更新**: 2025-11-20  
**版本**: 1.0  
**状态**: ✅ 准备就绪
