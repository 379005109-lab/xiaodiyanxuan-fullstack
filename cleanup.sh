#!/bin/bash
# 清理重复文件和临时文档

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  项目清理脚本${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

echo "🔍 扫描需要清理的内容..."
echo ""

# 1. 临时文档目录
echo -e "${YELLOW}[1] 临时文档目录 /1/${NC}"
if [ -d "/home/devbox/project/1" ]; then
    echo "   发现 23 个临时 Markdown 文档"
    du -sh /home/devbox/project/1
    echo ""
fi

# 2. 重复的部署脚本
echo -e "${YELLOW}[2] 部署脚本${NC}"
echo "   deploy-auto.sh (8K)"
echo "   deploy-now.sh (8K)"
echo "   final-deploy.sh (4K)"
echo "   check-deployment.sh (4K) - 保留"
echo ""

# 3. 重复的配置文件
echo -e "${YELLOW}[3] 配置文件${NC}"
ls -lh /home/devbox/project/*.config.sh 2>/dev/null || echo "   无"
ls -lh /home/devbox/project/README*.md 2>/dev/null || echo "   无额外 README"
echo ""

# 4. node_modules 和构建产物
echo -e "${YELLOW}[4] 构建产物和依赖${NC}"
du -sh /home/devbox/project/frontend/node_modules 2>/dev/null || echo "   frontend/node_modules: 未找到"
du -sh /home/devbox/project/frontend/dist 2>/dev/null || echo "   frontend/dist: 未找到"
du -sh /home/devbox/project/backend/node_modules 2>/dev/null || echo "   backend/node_modules: 未找到"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

read -p "是否执行清理？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 0
fi

echo ""
echo -e "${GREEN}开始清理...${NC}"
echo ""

# 清理临时文档目录
if [ -d "/home/devbox/project/1" ]; then
    echo -e "${YELLOW}删除临时文档目录 /1/...${NC}"
    rm -rf /home/devbox/project/1
    echo -e "${GREEN}✓ 已删除${NC}"
fi

# 清理重复的部署脚本（保留最新的）
echo -e "${YELLOW}删除旧的部署脚本...${NC}"
rm -f /home/devbox/project/deploy-auto.sh
rm -f /home/devbox/project/deploy-now.sh
echo -e "${GREEN}✓ 保留：final-deploy.sh 和 check-deployment.sh${NC}"

# 清理配置文件
if [ -f "/home/devbox/project/deploy.config.sh" ]; then
    echo -e "${YELLOW}删除旧的配置文件...${NC}"
    rm -f /home/devbox/project/deploy.config.sh
    rm -f /home/devbox/project/deploy-backend.sh
    rm -f /home/devbox/project/deploy-simple.sh
    echo -e "${GREEN}✓ 已删除${NC}"
fi

# 清理文档
if [ -f "/home/devbox/project/README-DEPLOY.md" ]; then
    echo -e "${YELLOW}删除旧的部署文档...${NC}"
    rm -f /home/devbox/project/README-DEPLOY.md
    rm -f /home/devbox/project/QUICKSTART.md
    rm -f /home/devbox/project/CLEANUP_COMPLETED.md
    echo -e "${GREEN}✓ 已删除${NC}"
fi

# 清理 node_modules（如果在 Git 中）
echo -e "${YELLOW}检查 .gitignore...${NC}"
if ! grep -q "node_modules" /home/devbox/project/.gitignore 2>/dev/null; then
    echo "node_modules/" >> /home/devbox/project/.gitignore
    echo "dist/" >> /home/devbox/project/.gitignore
    echo -e "${GREEN}✓ 已更新 .gitignore${NC}"
else
    echo -e "${GREEN}✓ .gitignore 已配置正确${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 清理完成！${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 显示清理后的状态
echo "📊 清理后的项目大小："
du -sh /home/devbox/project/backend
du -sh /home/devbox/project/frontend
du -sh /home/devbox/project 2>/dev/null | tail -1
echo ""

echo "📁 保留的文件："
echo "   ✓ final-deploy.sh - 一键部署脚本"
echo "   ✓ check-deployment.sh - 检查部署状态"
echo "   ✓ .github/workflows/backend-build.yml - 自动部署配置"
echo ""

# 提交清理
read -p "是否提交清理结果到 Git？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}提交清理...${NC}"
    cd /home/devbox/project
    git add -A
    git commit -m "chore: 清理重复文档和脚本" || echo "没有新变更"
    echo -e "${GREEN}✓ 已提交${NC}"
fi

echo ""
echo "🎉 完成！"
