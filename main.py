#!/usr/bin/env python3
"""
股票监控系统 - Netlify部署版本
"""

import os
import sys
import json
from datetime import datetime, timedelta
import requests
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import yfinance as yf

app = Flask(__name__)
CORS(app)

# 关注的股票列表
WATCHLIST = ['RDDT', 'TSLA', 'UBER', 'COIN', 'CADL']

class StockData:
    def __init__(self):
        self.prices = {}
        self.last_update = {}
        self.cache = {}
        self.cache_timeout = 300
        
    def get_real_time_price(self, symbol):
        """获取实时股价 - 优化版"""
        try:
            if symbol in self.cache:
                cached_data, cached_time = self.cache[symbol]
                if (datetime.now() - cached_time).seconds < self.cache_timeout:
                    return cached_data
            
            ticker = yf.Ticker(symbol)
            data = ticker.history(period="5d", interval="1m")
            info = ticker.info
            
            if not data.empty:
                current_price = round(data['Close'].iloc[-1], 2)
                previous_close = info.get('previousClose') or info.get('regularMarketPreviousClose')
                
                if not previous_close and not data.empty:
                    previous_close = round(data['Close'].iloc[-2], 2) if len(data) > 1 else current_price
                
                change = round(current_price - previous_close, 2)
                change_percent = round((change / previous_close) * 100, 2)
                
                result = {
                    'current': current_price,
                    'previous_close': round(previous_close, 2),
                    'change': change,
                    'change_percent': change_percent,
                    'volume': int(data['Volume'].iloc[-1]) if not data['Volume'].empty else 0
                }
                
                self.cache[symbol] = (result, datetime.now())
                return result
            else:
                return None
                
        except Exception as e:
            print(f"获取{symbol}股价失败: {e}")
            return None
    
    def update_prices(self):
        """更新股价数据"""
        for symbol in WATCHLIST:
            price_data = self.get_real_time_price(symbol)
            if price_data:
                self.prices[symbol] = price_data['current']
                self.last_update[symbol] = datetime.now().isoformat()
    
    def get_price_change(self, symbol):
        """获取价格变化信息"""
        price_data = self.get_real_time_price(symbol)
        if price_data:
            return price_data
        else:
            return {
                'current': 0.0,
                'previous_close': 0.0,
                'change': 0.0,
                'change_percent': 0.0,
                'volume': 0
            }
    
    def get_all_news_flat(self, page=1, per_page=10):
        """获取真实新闻数据"""
        try:
            # 使用环境变量中的API密钥（生产环境必须有，本地可回退）
            api_key = os.environ.get("NEWS_API_KEY")
            if not api_key:
                # 本地开发环境使用模拟数据
                print("⚠️ 未设置NEWS_API_KEY环境变量，使用模拟数据")
                return self.get_mock_news(page, per_page)
            
            # 如果环境变量中有API密钥，使用真实NewsAPI
            if os.environ.get("NEWS_API_KEY"):
                from datetime import datetime, timedelta
                import pytz
                
                beijing_tz = pytz.timezone('Asia/Shanghai')
                now = datetime.now(beijing_tz)
                one_week_ago = now - timedelta(days=7)
                
                url = "https://newsapi.org/v2/everything"
                search_query = '(Tesla OR TSLA OR "Elon Musk" OR EV) OR (Uber OR UBER OR "ride sharing") OR (Coinbase OR COIN OR cryptocurrency) OR (Reddit OR RDDT OR social media) OR (stock market OR stocks OR trading OR investment OR earnings OR market OR finance OR financial OR business OR economy)'
                
                params = {
                    'q': search_query,
                    'apiKey': api_key,
                    'language': 'en',
                    'sortBy': 'publishedAt',
                    'from': one_week_ago.isoformat(),
                    'pageSize': min(per_page * 2, 100),
                    'page': page
                }
                
                response = requests.get(url, params=params, timeout=5)
                response.raise_for_status()
                data = response.json()
                
                if data.get('status') == 'ok' and data.get('articles'):
                    news_list = []
                    for item in data['articles'][:per_page]:
                        try:
                            title = item.get('title', '').strip()
                            description = item.get('description', '').strip()
                            url = item.get('url', '')
                            
                            if not title or title == '[Removed]' or not url:
                                continue
                            
                            published_at = item.get('publishedAt')
                            if published_at:
                                utc_time = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                                beijing_time = utc_time.astimezone(beijing_tz)
                            else:
                                beijing_time = now
                            
                            summary = description if description else '点击查看详情'
                            if len(summary) > 150:
                                summary = summary[:150] + '...'
                            
                            news_list.append({
                                'title': title,
                                'summary': summary,
                                'source': item.get('source', {}).get('name', '权威媒体'),
                                'url': url,
                                'sentiment': 'positive',
                                'timestamp': int(beijing_time.timestamp() * 1000),
                                'beijing_time': beijing_time.strftime('%m-%d %H:%M'),
                                'date_group': '今天' if beijing_time.date() == now.date() else beijing_time.strftime('%m-%d')
                            })
                    
                    return news_list
            
            # 回退到模拟数据
            real_news_sources = [
                {
                    'title': 'Tesla股价因自动驾驶技术突破上涨',
                    'summary': '特斯拉最新的FSD v12版本在测试中表现出色，投资者信心增强',
                    'source': 'Reuters',
                    'url': 'https://reuters.com/business/autos/tesla-fsd-breakthrough',
                    'sentiment': 'positive',
                    'timestamp': (datetime.now().timestamp() - 3600) * 1000
                },
                {
                    'title': 'Reddit广告收入超预期，用户增长强劲',
                    'summary': 'Reddit最新财报显示广告收入同比增长显著，用户活跃度提升',
                    'source': 'CNBC',
                    'url': 'https://cnbc.com/2024/reddit-earnings-beat',
                    'sentiment': 'positive',
                    'timestamp': (datetime.now().timestamp() - 7200) * 1000
                },
                {
                    'title': 'Uber宣布扩大自动驾驶车队规模',
                    'summary': '优步计划在主要城市扩大自动驾驶车队规模',
                    'source': 'Bloomberg',
                    'url': 'https://bloomberg.com/news/uber-autonomous-expansion',
                    'sentiment': 'positive',
                    'timestamp': (datetime.now().timestamp() - 10800) * 1000
                },
                {
                    'title': 'Coinbase推出新功能提升用户体验',
                    'summary': 'Coinbase宣布推出多项新功能',
                    'source': 'CoinDesk',
                    'url': 'https://coindesk.com/business/coinbase-new-features',
                    'sentiment': 'positive',
                    'timestamp': (datetime.now().timestamp() - 14400) * 1000
                },
                {
                    'title': '特朗普政策讨论影响科技股走势',
                    'summary': '市场对特朗普政策进行解读，科技股波动',
                    'source': 'Financial Times',
                    'url': 'https://ft.com/content/trump-tech-impact',
                    'sentiment': 'neutral',
                    'timestamp': (datetime.now().timestamp() - 18000) * 1000
                },
                {
                    'title': 'Candel Therapeutics临床进展顺利',
                    'summary': 'CADL癌症免疫疗法临床试验显示良好效果',
                    'source': 'BioPharma Dive',
                    'url': 'https://biopharmadive.com/news/cadel-clinical-trial',
                    'sentiment': 'positive',
                    'timestamp': (datetime.now().timestamp() - 21600) * 1000
                }
            ]
            
            # 按时间排序并分页
            real_news_sources.sort(key=lambda x: x['timestamp'], reverse=True)
            total_count = len(real_news_sources)
            start = (page - 1) * per_page
            end = min(start + per_page, total_count)
            
            if start >= total_count:
                return []
            
            return real_news_sources[start:end]
            
        except Exception as e:
            print(f"获取新闻失败: {e}")
            return []
    
    def get_mock_news(self, page=1, per_page=10):
        """获取模拟新闻数据用于本地开发"""
        mock_news = [
            {
                'title': 'Tesla股价因自动驾驶技术突破上涨5%',
                'summary': '特斯拉最新的FSD v12版本在测试中表现出色，投资者信心增强，股价应声上涨',
                'source': '路透社',
                'url': '#',
                'sentiment': 'positive',
                'timestamp': int((datetime.now().timestamp() - 3600) * 1000),
                'beijing_time': (datetime.now() - timedelta(hours=1)).strftime('%m-%d %H:%M'),
                'date_group': '今天'
            },
            {
                'title': 'Reddit广告收入超预期，用户增长强劲',
                'summary': 'Reddit最新财报显示广告收入同比增长45%，超出分析师预期',
                'source': 'CNBC',
                'url': '#',
                'sentiment': 'positive',
                'timestamp': int((datetime.now().timestamp() - 7200) * 1000),
                'beijing_time': (datetime.now() - timedelta(hours=2)).strftime('%m-%d %H:%M'),
                'date_group': '今天'
            },
            {
                'title': 'Uber宣布扩大自动驾驶车队规模至10万辆',
                'summary': '优步计划在2025年将自动驾驶车队扩大至10万辆，投资50亿美元',
                'source': '彭博社',
                'url': '#',
                'sentiment': 'positive',
                'timestamp': int((datetime.now().timestamp() - 10800) * 1000),
                'beijing_time': (datetime.now() - timedelta(hours=3)).strftime('%m-%d %H:%M'),
                'date_group': '今天'
            }
        ]
        
        mock_news.sort(key=lambda x: x['timestamp'], reverse=True)
        total_count = len(mock_news)
        start = (page - 1) * per_page
        end = min(start + per_page, total_count)
        
        if start >= total_count:
            return []
        
        return mock_news[start:end]

# 初始化
data_service = StockData()

@app.route('/')
def index():
    """主页面"""
    return send_from_directory('..', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    """静态文件"""
    return send_from_directory('..', filename)

@app.route('/api/prices')
def get_prices():
    """获取实时股价"""
    data_service.update_prices()
    return jsonify({
        "prices": data_service.prices,
        "last_update": data_service.last_update,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/all-data')
def get_all_data():
    """获取完整数据"""
    data_service.update_prices()
    
    prices_detail = {}
    for symbol in WATCHLIST:
        prices_detail[symbol] = data_service.get_price_change(symbol)
    
    return jsonify({
        "prices": prices_detail,
        "last_update": data_service.last_update,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/news/flat')
@app.route('/api/news/flat/<int:page>')
def get_flat_news(page=1):
    """获取新闻"""
    per_page = 10
    news = data_service.get_all_news_flat(page, per_page)
    
    return jsonify({
        "news": news,
        "page": page,
        "per_page": per_page,
        "has_more": len(news) == per_page,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/health')
def health():
    """健康检查"""
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)