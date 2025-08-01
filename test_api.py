#!/usr/bin/env python3
"""
测试股票监控API
"""
import requests
import json

def test_news_api():
    """测试新闻API"""
    try:
        url = "http://localhost:8085/api/news/flat/1"
        print(f"正在测试: {url}")
        
        response = requests.get(url, timeout=10)
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"返回数据结构: {list(data.keys())}")
            
            news = data.get('news', [])
            print(f"新闻数量: {len(news)}")
            
            if news:
                print("第一条新闻示例:")
                first_news = news[0]
                for key, value in first_news.items():
                    print(f"  {key}: {value}")
            else:
                print("⚠️ 没有返回新闻数据")
                
        else:
            print(f"❌ API请求失败: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到服务器，请确保服务器已启动")
    except Exception as e:
        print(f"❌ 测试失败: {e}")

def test_prices_api():
    """测试股价API"""
    try:
        url = "http://localhost:8085/api/all-data"
        print(f"\n正在测试: {url}")
        
        response = requests.get(url, timeout=10)
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"股价数据: {list(data.get('prices', {}).keys())}")
        else:
            print(f"❌ API请求失败: {response.text}")
            
    except Exception as e:
        print(f"❌ 测试失败: {e}")

if __name__ == "__main__":
    print("🧪 开始API测试...")
    test_news_api()
    test_prices_api()
    print("\n✅ 测试完成")