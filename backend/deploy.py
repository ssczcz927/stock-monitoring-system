#!/usr/bin/env python3
"""
股票监控系统部署脚本
提供公开可访问的接口
"""

import os
import sys
import json
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

# 添加当前目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 导入已有的股票数据类
from server import StockData

app = Flask(__name__)
CORS(app)

# 初始化股票数据
stock_data = StockData()

# 静态文件服务
@app.route('/')
def index():
    """提供主页面"""
    return send_from_directory(os.path.dirname(os.path.dirname(__file__)), 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    """提供静态文件"""
    return send_from_directory(os.path.dirname(os.path.dirname(__file__)), filename)

# API端点
@app.route('/api/prices')
def get_prices():
    """获取实时股价"""
    stock_data.update_prices()
    return jsonify({
        "prices": stock_data.prices,
        "last_update": stock_data.last_update,
        "timestamp": __import__('datetime').datetime.now().isoformat()
    })

@app.route('/api/all-data')
def get_all_data():
    """获取所有数据"""
    stock_data.update_prices()
    
    # 获取股价详细信息
    prices_detail = {}
    for symbol in ['RDDT', 'TSLA', 'UBER', 'COIN', 'CADL']:
        prices_detail[symbol] = stock_data.get_price_change(symbol)
    
    return jsonify({
        "prices": prices_detail,
        "last_update": stock_data.last_update,
        "timestamp": __import__('datetime').datetime.now().isoformat()
    })

@app.route('/api/news/flat')
@app.route('/api/news/flat/<int:page>')
def get_flat_news(page=1):
    """获取扁平化的新闻列表，支持分页"""
    per_page = 10
    news = stock_data.get_all_news_flat(page, per_page)
    
    return jsonify({
        "news": news,
        "page": page,
        "per_page": per_page,
        "has_more": len(news) == per_page,
        "timestamp": __import__('datetime').datetime.now().isoformat()
    })

@app.route('/api/health')
def health():
    """健康检查"""
    return jsonify({"status": "ok", "message": "股票监控系统运行正常"})

if __name__ == '__main__':
    print("🚀 股票监控系统部署中...")
    print("📊 公开访问地址即将生成...")
    
    # 获取公开IP地址
    try:
        import requests
        public_ip = requests.get('https://api.ipify.org', timeout=5).text
        print(f"🌐 公网IP: {public_ip}")
    except:
        public_ip = "localhost"
        print("🏠 使用本地部署")
    
    # 启动服务器
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
    print(f"✅ 系统已部署在: http://{public_ip}:{port}")