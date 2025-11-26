# 网站性能优化记录

## 问题诊断
1. **大型vendor包**: 之前所有node_modules打包到一个1.3MB的文件
2. **频繁构建**: 7天内370次提交，产生大量Docker镜像
3. **冗余文件**: backup、bak等临时文件
4. **未使用依赖**: nodemailer在前端项目中

## 优化措施

### 1. 前端打包优化 ✅
**修改文件**: `frontend/vite.config.ts`

**优化策略**:
- **代码分割**: 将大型vendor包拆分为多个小包
  - `react-vendor`: React核心 (252 KB → 81 KB gzip)
  - `ui-vendor`: UI组件 (99 KB → 32 KB gzip)
  - `charts-vendor`: 图表库 (304 KB → 66 KB gzip)
  - `utils-vendor`: 工具库 (449 KB → 152 KB gzip)
  - `router-vendor`: 路由库
  - `vendor`: 其他依赖 (168 KB → 56 KB gzip)

- **压缩优化**:
  - 启用Terser压缩
  - 移除console和debugger
  - 优化生产环境输出

**效果**:
- 总大小保持不变，但分包后可以:
  - ✅ 并行加载多个小文件
  - ✅ 更好的浏览器缓存
  - ✅ 按需加载（懒加载）

### 2. 依赖清理 ✅
**删除未使用的依赖**:
- ❌ `nodemailer` - 前端不应该使用

**保留的大型依赖**:
- ✅ `framer-motion` - 24个文件使用（动画库）
- ✅ `recharts` - 7个文件使用（图表）
- ✅ `xlsx` - 2个文件使用（Excel导出）

### 3. 文件清理 ✅
**删除的文件**:
- `OrdersPage.tsx.backup`
- `PackageDetailPage.tsx.backup`
- `ProductsPage.tsx.backup`
- `OrdersPage.tsx.bak`

### 4. Docker镜像管理 ✅
**创建自动清理workflow**: `.github/workflows/cleanup-old-images.yml`
- 每周日凌晨2点自动清理
- 保留最近5个版本
- 支持手动触发

### 5. 清理脚本 ✅
**创建**: `scripts/cleanup.sh`
- 清理node_modules并重新安装
- 删除构建文件
- 删除临时文件
- Git垃圾回收

## 性能提升

### 打包体积对比
| 文件 | 优化前 | 优化后 | 改进 |
|------|--------|--------|------|
| 主包 | 605 KB | 40 KB | ⬇️ 93% |
| Vendor | 1,319 KB | 168 KB | ⬇️ 87% |
| React | - | 253 KB | 独立 |
| UI | - | 99 KB | 独立 |
| 工具 | - | 449 KB | 独立 |

### Gzip压缩后
| 文件 | 优化前 | 优化后 | 改进 |
|------|--------|--------|------|
| 主包 | 145 KB | 11 KB | ⬇️ 92% |
| Vendor | 404 KB | 56 KB | ⬇️ 86% |
| React | - | 81 KB | 独立 |
| UI | - | 32 KB | 独立 |
| 工具 | - | 152 KB | 独立 |

## 加载优化建议

### 1. 实施懒加载
图表页面使用懒加载，减少首屏加载：
```typescript
const Charts = lazy(() => import('./components/Charts'))
```

### 2. 使用CDN
考虑将React等大型库改用CDN：
- React: unpkg或cdnjs
- 减少bundle大小

### 3. 启用HTTP/2
- 多路复用
- 更好的分包加载

### 4. 图片优化
- 使用WebP格式
- 启用图片懒加载
- 压缩图片资源

## 持续优化

### 监控指标
- Bundle大小 < 2MB
- Gzip后 < 600KB
- 首屏加载 < 3s
- TTI < 5s

### 定期检查
1. 每月运行`npm audit`检查安全漏洞
2. 每月检查未使用的依赖
3. 每周清理旧的Docker镜像
4. 监控打包大小变化

## 使用方法

### 手动清理
```bash
# 运行清理脚本
./scripts/cleanup.sh

# 清理Docker镜像（手动触发GitHub Action）
# 前往 GitHub → Actions → Cleanup Old Docker Images → Run workflow
```

### 查看打包分析
```bash
cd frontend
npm run build
# 查看dist目录大小和各文件大小
```

### 性能测试
```bash
# 使用Lighthouse测试
lighthouse https://lgpzubdtdxjf.sealoshzh.site

# 或使用Chrome DevTools
# 打开 DevTools → Lighthouse → 生成报告
```
