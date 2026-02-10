# 构建阶段 - Updated 2026-02-09 - Force rebuild partner card style
FROM node:18-alpine AS builder

# Cache bust arg
ARG CACHEBUST=20260130

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖（使用 npm install 代替 npm ci，更宽松）
RUN npm install --legacy-peer-deps

# 复制源代码 - 清除旧代码防止缓存
ARG GIT_SHA=unknown
RUN echo "Cache bust: $CACHEBUST SHA: $GIT_SHA" && rm -rf /app/src /app/public /app/index.html 2>/dev/null || true
COPY . .

# 构建应用
RUN npm run build && echo "BUILD OK - $(ls -la /app/dist/assets/*.js | wc -l) JS files"

# 运行阶段
FROM nginx:alpine

# 安装 curl 用于健康检查
RUN apk add --no-cache curl

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
