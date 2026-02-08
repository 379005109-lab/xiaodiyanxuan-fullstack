# 构建阶段 - Updated 2026-02-08
FROM node:18-bullseye-slim AS builder

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --omit=dev

# 最终阶段
FROM node:18-bullseye-slim

WORKDIR /app

ARG GIT_SHA
ENV GIT_SHA=$GIT_SHA

# 安装 dumb-init 用于优雅关闭
RUN apt-get update \
  && apt-get install -y --no-install-recommends dumb-init \
  && rm -rf /var/lib/apt/lists/*

# 从构建阶段复制 node_modules
COPY --from=builder /app/node_modules ./node_modules

# Cache bust arg - 变化时强制重新 COPY
ARG CACHEBUST
ARG GIT_SHA
RUN echo "Cache bust: ${CACHEBUST:-none} SHA: ${GIT_SHA:-none}" && date

# 复制应用代码 - 确保每次构建都是最新代码
COPY --chown=node:node . .

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# 使用 dumb-init 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
