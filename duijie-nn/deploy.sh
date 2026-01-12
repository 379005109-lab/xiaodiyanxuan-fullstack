#!/bin/bash
set -e

echo "🚀 Deploying duijie-nn to Sealos..."

# Set kubeconfig
export KUBECONFIG="/home/devbox/project/kubeconfig (7).yaml"

# Build the project
echo "📦 Building project..."
npm run build

# Get pod name
POD_NAME=$(kubectl get pods -n ns-cxxiwxce -l app=duijie-nn --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}')

if [ -z "$POD_NAME" ]; then
    echo "❌ No running pod found. Applying deployment..."
    kubectl apply -f k8s-deploy.yaml
    sleep 10
    POD_NAME=$(kubectl get pods -n ns-cxxiwxce -l app=duijie-nn --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}')
fi

echo "📤 Copying files to pod: $POD_NAME"
kubectl cp dist/. ns-cxxiwxce/$POD_NAME:/usr/share/nginx/html/

echo ""
echo "✅ Deployment complete!"
echo "🌐 Website: https://duijie-nn-cxxiwxce.sealoshzh.site"
echo ""
echo "📊 Pod status:"
kubectl get pods -n ns-cxxiwxce -l app=duijie-nn
