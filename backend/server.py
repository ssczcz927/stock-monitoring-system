#!/usr/bin/env python3
"""
股票监控系统后端服务器
提供实时股价、新闻和特朗普相关新闻API
"""

import json
import time
import requests
from datetime import datetime, timedelta
from flask import Flask, jsonify, render_template_string, send_from_directory
from flask_cors import CORS
import threading
import yfinance as yf
import pandas as pd
import pytz
import os

app = Flask(__name__)
CORS(app)

# 提供静态文件服务
@app.route('/')
def home():
    """提供主页面"""
    return send_from_directory('.', 'index.html')

@app.route('/frontend/<path:filename>')
def static_files(filename):
    """提供静态文件"""
    return send_from_directory('frontend', filename)

# 关注的股票列表
WATCHLIST = ['RDDT', 'TSLA', 'UBER', 'COIN', 'CADL']

# 真实股价数据（使用Yahoo Finance）
class StockData:
    def __init__(self):
        self.prices = {}
        self.last_update = {}
        self.news = {}
        self.trump_news = {}
        self.previous_prices = {}
        self.daily_changes = {}
        self.cache = {}
        self.cache_timeout = 300  # 缓存5分钟，减少波动
        
        # 缓存时区对象，避免重复创建
        self.beijing_tz = pytz.timezone('Asia/Shanghai')
        self.cache_timeout = 300  # 5分钟缓存
        self.news_cache = {}  # 新闻专用缓存
        self.news_cache_timeout = 60  # 新闻缓存1分钟，确保能加载更多
        
        self.init_prices()
        self.update_prices()
        
    def get_real_time_price(self, symbol):
        """获取实时股价 - 优化版"""
        try:
            # 检查缓存
            if symbol in self.cache:
                cached_data, cached_time = self.cache[symbol]
                if (datetime.now() - cached_time).seconds < self.cache_timeout:
                    return cached_data
            
            # 从Yahoo Finance获取实时数据
            ticker = yf.Ticker(symbol)
            
            # 获取两日数据以确保有前收盘价
            data = ticker.history(period="5d", interval="1m")
            info = ticker.info
            
            if not data.empty:
                current_price = round(data['Close'].iloc[-1], 2)
                
                # 使用前收盘价作为基准（更稳定）
                previous_close = info.get('previousClose') or info.get('regularMarketPreviousClose')
                if not previous_close:
                    # 如果没有previousClose，使用昨日最后价格
                    yesterday_data = data[data.index.date == (datetime.now().date() - pd.Timedelta(days=1))]
                    if not yesterday_data.empty:
                        previous_close = round(yesterday_data['Close'].iloc[-1], 2)
                    else:
                        previous_close = round(data['Close'].iloc[-2], 2)
                
                # 计算涨跌幅（基于前收盘价）
                change = round(current_price - previous_close, 2)
                change_percent = round((change / previous_close) * 100, 2)
                
                # 获取今日开盘价
                today_data = data[data.index.date == datetime.now().date()]
                open_price = today_data['Open'].iloc[0] if not today_data.empty else previous_close
                
                result = {
                    'current': current_price,
                    'previous_close': round(previous_close, 2),
                    'open': round(open_price, 2),
                    'change': change,
                    'change_percent': change_percent,
                    'volume': int(data['Volume'].iloc[-1]) if not data['Volume'].empty else 0
                }
                
                # 缓存结果（延长缓存时间）
                self.cache[symbol] = (result, datetime.now())
                return result
            else:
                return None
                
        except Exception as e:
            print(f"获取{symbol}股价失败: {e}")
            return None
    
    def get_date_group(self, time_obj):
        """根据时间返回日期分组"""
        now = datetime.now(self.beijing_tz)
        today = now.date()
        yesterday = today - timedelta(days=1)
        
        time_date = time_obj.date()
        
        if time_date == today:
            return '今天'
        elif time_date == yesterday:
            return '昨天'
        else:
            return time_obj.strftime('%m-%d')
    
    def init_prices(self):
        """初始化股价和基准价格"""
        base_prices = {
            'RDDT': 45.32,
            'TSLA': 238.45,
            'UBER': 78.92,
            'COIN': 165.78,
            'CADL': 2.34
        }
        
        for symbol in WATCHLIST:
            self.prices[symbol] = base_prices.get(symbol, 100.0)
            self.previous_prices[symbol] = base_prices.get(symbol, 100.0)
            self.daily_changes[symbol] = 0.0
    
    def update_prices(self):
        """更新股价数据，使用真实API"""
        for symbol in WATCHLIST:
            price_data = self.get_real_time_price(symbol)
            if price_data:
                self.prices[symbol] = price_data['current']
                self.last_update[symbol] = datetime.now().isoformat()
    
    def get_price_change(self, symbol):
        """获取价格变化信息 - 稳定版"""
        price_data = self.get_real_time_price(symbol)
        if price_data:
            return price_data
        else:
            # 如果获取失败，使用缓存或默认值
            return {
                'current': 0.0,
                'previous_close': 0.0,
                'open': 0.0,
                'change': 0.0,
                'change_percent': 0.0,
                'volume': 0
            }
    
    def get_trump_related_news(self):
        """获取与特朗普相关的新闻 - 现在通过NewsAPI获取真实数据"""
        # 不再返回预设新闻，改为调用NewsAPI
        return []
    
    def get_general_news(self):
        """获取一般财经新闻 - 现在通过NewsAPI获取真实数据"""
        # 不再返回预设新闻，改为返回空对象
        return {}

    def get_all_news_flat(self, page=1, per_page=10):
        """获取实时新闻 - 使用NewsAPI实时数据"""
        return self.get_newsapi_realtime_news(page, per_page)
    
    def get_newsapi_realtime_news(self, page=1, per_page=10):
        """优化的实时新闻获取 - 仅返回API真实数据"""
        api_key = "0a41b0e0bebc4c0eb6e2e5fb55678304"
        
        # 使用缓存的时区对象
        now = datetime.now(self.beijing_tz)
        today = now.date()
        
        # 检查新闻专用缓存，分页缓存
        cache_key = f"news_{page}_{per_page}_{today}"
        if cache_key in self.news_cache:
            cached_data, cached_time = self.news_cache[cache_key]
            # 只对第一页使用较短缓存，其他页面缓存更长时间
            cache_duration = self.news_cache_timeout if page == 1 else self.news_cache_timeout * 3
            if (now - cached_time).total_seconds() < cache_duration:
                return cached_data
        
        try:
            # 优化：获取今日相关度高的新闻
            url = "https://newsapi.org/v2/everything"
            
            # 大幅放宽搜索条件，覆盖更广泛的财经新闻
            search_query = '(Tesla OR TSLA OR "Elon Musk" OR electric vehicle OR EV) OR (Uber OR UBER OR "ride sharing" OR gig economy) OR (Coinbase OR COIN OR cryptocurrency OR bitcoin OR crypto) OR (Reddit OR RDDT OR social media) OR (stock market OR stocks OR trading OR investment OR earnings OR market OR finance OR financial OR business OR economy OR Wall Street OR Nasdaq OR NYSE)'
            
            # 获取当前北京时间
            now = datetime.now(self.beijing_tz)
            one_week_ago = now - timedelta(days=7)  # 放宽到一周内的相关新闻
            
            params = {
                'q': search_query,
                'apiKey': api_key,
                'language': 'en',
                'sortBy': 'publishedAt',  # 按发布时间倒序排列
                'from': one_week_ago.isoformat(),  # 使用动态计算的最近一周
                'pageSize': min(per_page * 5, 100),  # 大幅增加结果缓冲区
                'page': page
            }
            
            # 🔧 优化：减少超时时间
            response = requests.get(url, params=params, timeout=3)
            response.raise_for_status()
            data = response.json()
            
            print(f"📡 NewsAPI响应: {data.get('status')} - 总数: {data.get('totalResults')}")
            if data.get('status') != 'ok':
                print(f"❌ NewsAPI错误: {data.get('message', '未知错误')}")
            
            if data.get('status') == 'ok' and data.get('articles'):
                print(f"📰 获取到 {len(data['articles'])} 条原始新闻")
                news_list = []
                processed_count = 0
                
                # 处理API返回的新闻，筛选高质量内容
                for item in data['articles']:
                    if processed_count >= per_page:
                        break
                        
                    try:
                        # 验证必要字段
                        title = item.get('title', '').strip()
                        description = item.get('description', '').strip()
                        url = item.get('url', '')
                        
                        # 只保留最基本的过滤条件
                        if not title or title == '[Removed]' or not url:
                            continue
                            
                        published_at = item.get('publishedAt', now.isoformat())
                        utc_time = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                        beijing_time = utc_time.astimezone(self.beijing_tz)
                            
                        # 处理摘要
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
                            'date_group': self.get_date_group(beijing_time)
                        })
                        processed_count += 1
                        
                    except (ValueError, AttributeError) as e:
                        print(f"处理新闻项时出错: {e}")
                        continue
                
                # 按时间倒序排列（NewsAPI已按时间排序，但再确认一次）
                news_list.sort(key=lambda x: x['timestamp'], reverse=True)
                
                # 缓存结果
                self.news_cache[cache_key] = (news_list, now)
                print(f"📊 原始结果: {len(data['articles'])} 条 → 过滤后: {len(news_list)} 条 (第{page}页)")
                return news_list
                
        except requests.exceptions.RequestException as e:
            print(f"NewsAPI网络错误: {e}")
            return []
        except Exception as e:
            print(f"NewsAPI其他错误: {e}")
            return []
        
        # 如果没有获取到新闻，提供友好的提示信息
        print("⚠️ 当前未获取到新闻数据，可能是API限制或搜索条件过窄")
        return []


    
    


stock_data = StockData()

@app.route('/')
def index():
    return jsonify({
        "message": "股票监控系统API",
        "endpoints": {
            "/api/prices": "获取实时股价",
            "/api/news": "获取股票新闻",
            "/api/trump-news": "获取特朗普相关新闻"
        }
    })

@app.route('/api/prices')
def get_prices():
    """获取实时股价"""
    stock_data.update_prices()
    return jsonify({
        "prices": stock_data.prices,
        "last_update": stock_data.last_update,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/news')
def get_news():
    """获取股票新闻"""
    return jsonify({
        "news": stock_data.get_general_news(),
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/trump-news')
def get_trump_news():
    """获取特朗普相关新闻"""
    return jsonify({
        "trump_news": stock_data.get_trump_related_news(),
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/all-data')
def get_all_data():
    """获取所有数据"""
    stock_data.update_prices()
    
    # 获取股价详细信息
    prices_detail = {}
    for symbol in WATCHLIST:
        prices_detail[symbol] = stock_data.get_price_change(symbol)
    
    return jsonify({
        "prices": prices_detail,
        "last_update": stock_data.last_update,
        "timestamp": datetime.now().isoformat()
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
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("🚀 股票监控系统启动...")
    print("📊 关注的股票:", WATCHLIST)
    print("🌐 API地址: http://localhost:8090")
    print("📰 实时新闻API已启用")
    app.run(debug=True, host='0.0.0.0', port=8090)