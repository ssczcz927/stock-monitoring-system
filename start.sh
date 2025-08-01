#!/bin/bash

echo "🚀 启动股票实时监控系统..."

# 检查Python是否已安装
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装，请先安装Python3"
    exit 1
fi

# 启动后端服务器
echo "📊 启动后端服务器..."
cd backend

# 检查是否已安装依赖
if ! python3 -c "import flask" 2> /dev/null; then
    echo "📦 安装依赖..."
    pip3 install -r requirements.txt
fi

# 启动后端（后台运行）
python3 server.py &
BACKEND_PID=$!

echo "🌐 后端服务器启动完成 (PID: $BACKEND_PID)"

# 等待2秒让服务器启动
sleep 2

# 启动前端
echo "🖥️  启动前端界面..."
cd ..

# 方法1: 直接打开HTML文件
open index.html

# 方法2: 使用本地服务器（备用）
# python3 -m http.server 8080 &
echo "✅ 系统启动完成！"
echo "📱 访问地址: file:///Users/jay/claudecode/stock-monitor/index.html"
echo "🌐 API地址: http://localhost:5000"
echo "🔍 使用说明: 查看README.md"

# 添加清理函数
cleanup() {
    echo "🛑 正在关闭系统..."
    kill $BACKEND_PID 2> /dev/null || true
    exit 0
}

# 捕获退出信号
trap cleanup SIGINT SIGTERM

# 保持脚本运行
echo "按 Ctrl+C 退出系统"
wait $BACKEND_PID