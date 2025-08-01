# 免费新闻API配置
NEWS_API_CONFIG = {
    # 方案1：NewsData.io (推荐)
    'newsdata': {
        'key': 'YOUR_NEWSAPI_KEY_HERE',  # 替换为真实key
        'base_url': 'https://newsdata.io/api/1/news',
        'free_limit': 200,  # 请求/天
        'endpoint': '/api/v1/news'
    },
    
    # 方案2：NewsAPI (备选)
    'newsapi': {
        'key': 'YOUR_NEWSAPI_KEY_HERE',  # 替换为真实key
        'base_url': 'https://newsapi.org/v2/everything',
        'free_limit': 100,  # 请求/天
        'endpoint': '/v2/everything'
    },
    
    # 方案3：Currents API (备选)
    'currents': {
        'key': 'YOUR_CURRENTS_KEY_HERE',  # 替换为真实key
        'base_url': 'https://api.currentsapi.services/v1/search',
        'free_limit': 600,  # 请求/天
        'endpoint': '/v1/search'
    },
    
    # 方案4：Mediastack (备选)
    'mediastack': {
        'key': 'YOUR_MEDIASTACK_KEY_HERE',  # 替换为真实key
        'base_url': 'http://api.mediastack.com/v1/news',
        'free_limit': 500,  # 请求/月
        'endpoint': '/v1/news'
    }
}

# 使用说明：
# 1. 选择任一API注册
# 2. 替换上面的YOUR_XXX_KEY_HERE为真实key
# 3. 在server.py中引用对应的配置