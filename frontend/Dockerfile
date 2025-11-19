# Stage 1: build
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: production image
FROM nginx:1.25-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
# 可选：自定义 Nginx 配置，如需 SPA 支持取消注释
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
