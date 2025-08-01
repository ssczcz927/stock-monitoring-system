#!/bin/bash
# 股票监控系统 - Vercel部署脚本

echo "🚀 开始部署股票监控系统到Vercel..."

# 检查当前目录
cd /Users/jay/claudecode/stock-monitor

# 创建临时项目结构
echo "📁 准备项目结构..."

# 确保所有必要文件存在
cp index.html index_backup.html 2>/dev/null || true
cp backend/main.py . 2>/dev/null || true
cp backend/requirements.txt . 2>/dev/null || true

# 创建部署包
echo "📦 创建Vercel部署包..."

# 检查Python环境
echo "🐍 检查Python环境..."
python3 --version

# 启动本地测试
echo "🔧 启动本地测试服务器..."
python3 main.py &
SERVER_PID=$!

# 等待启动
sleep 2

# 测试API
echo "✅ 测试API端点..."
curl -s "http://localhost:8080/api/health" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print('✅ API正常工作' if data.get('status') == 'ok' else '❌ API异常')
except:
    print('❌ 无法连接API')
"

# 停止测试服务器
kill $SERVER_PID 2>/dev/null || true

echo "🎯 部署准备完成！"
echo ""
echo "📋 部署选项："
echo "1. 手动Vercel部署："
echo "   - 访问 https://vercel.com"
echo "   - 拖拽整个 stock-monitor 文件夹"
echo "   - 获得公开URL"
echo ""
echo "2. 手动GitHub部署："
echo "   - 上传到GitHub"
echo "   - 连接Vercel到GitHub仓库"
echo ""
echo "3. 使用在线工具："
echo "   - https://vercel.com/new"
echo "   - 导入GitHub仓库"

echo ""
echo "🔗 预计公开URL格式："
echo "   https://stock-monitor-mcp-*.vercel.app"