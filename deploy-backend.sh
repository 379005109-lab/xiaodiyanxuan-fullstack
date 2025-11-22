#!/bin/bash

# 后端部署脚本
# Backend deployment script

set -e  # Exit on error

echo "🚀 开始部署后端..."
echo "🚀 Starting backend deployment..."
echo ""

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 错误：未找到Docker"
    echo "❌ Error: Docker not found"
    echo ""
    echo "请先安装Docker："
    echo "Please install Docker first:"
    echo "  https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker已安装"
echo "✅ Docker is installed"
echo ""

# 1. 构建后端镜像
echo "📦 步骤 1/5: 构建后端Docker镜像..."
echo "📦 Step 1/5: Building backend Docker image..."
cd /home/devbox/project/backend

docker build -t ghcr.io/379005109-lab/xiaodiyanxuan-backend:latest .

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    echo "❌ Build failed"
    exit 1
fi

echo "✅ 镜像构建成功"
echo "✅ Image built successfully"
echo ""

# 2. 登录GitHub Container Registry
echo "🔐 步骤 2/5: 登录GitHub Container Registry..."
echo "🔐 Step 2/5: Login to GitHub Container Registry..."
echo ""
echo "请输入GitHub Personal Access Token:"
echo "Please enter your GitHub Personal Access Token:"
echo "(需要 write:packages 权限 / Requires write:packages permission)"
echo ""

docker login ghcr.io -u 379005109-lab

if [ $? -ne 0 ]; then
    echo "❌ 登录失败"
    echo "❌ Login failed"
    exit 1
fi

echo "✅ 登录成功"
echo "✅ Login successful"
echo ""

# 3. 推送镜像
echo "📤 步骤 3/5: 推送镜像到Registry..."
echo "📤 Step 3/5: Pushing image to registry..."

docker push ghcr.io/379005109-lab/xiaodiyanxuan-backend:latest

if [ $? -ne 0 ]; then
    echo "❌ 推送失败"
    echo "❌ Push failed"
    exit 1
fi

echo "✅ 镜像推送成功"
echo "✅ Image pushed successfully"
echo ""

# 4. 更新Kubernetes
echo "🔧 步骤 4/5: 更新Kubernetes deployment..."
echo "🔧 Step 4/5: Updating Kubernetes deployment..."

export KUBECONFIG="/home/devbox/project/kubeconfig (7).yaml"

kubectl set image deployment/xiaodiyanxuan-api \
  api=ghcr.io/379005109-lab/xiaodiyanxuan-backend:latest \
  -n ns-cxxiwxce

kubectl rollout restart deployment/xiaodiyanxuan-api -n ns-cxxiwxce

echo "✅ Deployment已更新"
echo "✅ Deployment updated"
echo ""

# 5. 等待并验证
echo "⏳ 步骤 5/5: 等待Pod就绪..."
echo "⏳ Step 5/5: Waiting for pods..."

kubectl rollout status deployment/xiaodiyanxuan-api -n ns-cxxiwxce --timeout=300s

echo ""
echo "🔍 验证部署..."
echo "🔍 Verifying deployment..."
sleep 10

# 测试登录API
ROLE=$(curl -s -X POST http://lgpzubdtdxjf.sealoshzh.site/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['user'].get('role', 'N/A'))" 2>/dev/null)

echo ""
echo "======================================"
echo "📊 部署结果 | Deployment Result"
echo "======================================"
echo "登录API测试: $ROLE"
echo "Login API test: $ROLE"
echo ""

if [ "$ROLE" = "super_admin" ]; then
    echo "✅ 部署成功！后端已更新！"
    echo "✅ Deployment successful! Backend updated!"
    echo ""
    echo "🎉 现在前端商城应该可以正常显示了！"
    echo "🎉 Frontend should now work properly!"
    echo ""
    echo "请在无痕模式下测试："
    echo "Please test in incognito mode:"
    echo "  http://lgpzubdtdxjf.sealoshzh.site/"
else
    echo "⚠️ 角色返回值不正确: $ROLE"
    echo "⚠️ Role value incorrect: $ROLE"
    echo ""
    echo "可能需要等待更长时间，或检查Pod日志："
    echo "May need to wait longer, or check pod logs:"
    echo "  kubectl logs -n ns-cxxiwxce -l app=xiaodiyanxuan-api --tail=50"
fi

echo ""
echo "======================================"
echo ""
echo "✅ 部署流程完成！"
echo "✅ Deployment process complete!"
