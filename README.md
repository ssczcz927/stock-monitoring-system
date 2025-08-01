# 🚀 股票实时监控系统

## 📊 功能特点

### ✅ 实时股价监控
- **关注股票**: RDDT, TSLA, UBER, COIN, CADL
- **实时更新**: 每60秒自动刷新
- **价格展示**: 包含当前价格、涨跌幅

### 📰 新闻汇总
- **特朗普相关动态**: 专门收集特朗普提及的股票新闻
- **个股新闻**: 每个股票的最新相关新闻
- **新闻摘要**: 标题 + 详细摘要

### 🎨 现代化界面
- **响应式设计**: 适配手机、平板、桌面
- **实时显示**: 最后更新时间
- **交互式手风琴**: 新闻分类展示

## 🚀 快速启动

### 1. 启动后端服务器
```bash
cd stock-monitor/backend
pip install -r requirements.txt
python server.py
```

### 2. 访问前端界面
```bash
# 方法1: 直接打开
open ../index.html

# 方法2: 使用本地服务器
cd stock-monitor
python -m http.server 8080
# 然后访问 http://localhost:8080
```

## 🌐 API接口

### 获取所有数据
```
GET http://localhost:5000/api/all-data
```

### 获取实时股价
```
GET http://localhost:5000/api/prices
```

### 获取特朗普相关新闻
```
GET http://localhost:5000/api/trump-news
```

### 获取股票新闻
```
GET http://localhost:5000/api/news
```

## 📋 使用说明

### 浏览器操作
1. **自动刷新**: 系统每60秒自动更新所有数据
2. **手动刷新**: 点击页面顶部的刷新按钮
3. **查看新闻**: 点击股票新闻的手风琴标题展开详情

### 调试工具
在浏览器控制台输入：
```javascript
// 手动刷新数据
StockUtils.refresh()

// 停止自动更新
StockUtils.stopAuto()

// 开始自动更新
StockUtils.startAuto()
```

## 📊 数据展示

### 股价卡片
- **实时价格**: 当前股价
- **涨跌幅**: 当日涨跌百分比
- **更新时间**: 最后刷新时间

### 新闻卡片
- **标题**: 新闻标题
- **摘要**: 详细内容摘要
- **来源**: 新闻来源
- **时间**: 发布时间

## ⚠️ 免责声明

- 数据仅供参考，不构成投资建议
- 投资有风险，入市需谨慎
- 股价数据为模拟数据，实际应用中请使用真实API

## 🔧 技术栈

- **后端**: Python Flask
- **前端**: HTML5, CSS3, JavaScript
- **实时更新**: setInterval + Fetch API
- **响应式设计**: CSS Grid + Flexbox