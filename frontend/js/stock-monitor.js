// 股票监控系统前端JavaScript
class StockMonitor {
    constructor() {
        // 根据环境自动选择API地址
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.apiBase = isLocal ? 'http://localhost:8090/api' : '/api';
        this.updateInterval = 60000; // 60秒更新一次
        this.updateTimer = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadAllData(false);
        this.startAutoUpdate();
    }

    bindEvents() {
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadAllData(true));
        }
        
        // 回到顶部按钮
        this.setupBackToTop();
    }

    setupBackToTop() {
        const backToTopBtn = document.getElementById('backToTop');
        if (!backToTopBtn) return;
        
        // 滚动事件监听
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const stockSection = document.querySelector('.stock-prices');
                const stockSectionTop = stockSection ? stockSection.offsetTop : 0;
                const stockSectionHeight = stockSection ? stockSection.offsetHeight : 0;
                
                // 当滚动超过股价区域时显示按钮
                if (scrollTop > stockSectionTop + stockSectionHeight) {
                    backToTopBtn.classList.add('show');
                } else {
                    backToTopBtn.classList.remove('show');
                }
            }, 100);
        });
        
        // 点击回到顶部
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    async loadAllData(isManualRefresh = false) {
        try {
            // 不显示loading，保留旧数据
            const [prices, trumpNews, stockNews] = await Promise.all([
                this.fetchPrices(),
                this.fetchTrumpNews(),
                this.fetchStockNews()
            ]);

            this.renderPrices(prices);
            this.renderTrumpNews(trumpNews);
            this.renderStockNews(stockNews);
            this.updateLastUpdateTime();
            
            // 只在手动刷新时显示toast
            if (isManualRefresh) {
                this.showToast('已刷新最新数据');
            }
        } catch (error) {
            console.error('加载数据失败:', error);
            this.showToast('加载数据失败，请稍后重试');
        }
    }

    async fetchPrices() {
        try {
            const response = await fetch(`${this.apiBase}/all-data`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('获取股价失败:', error);
            return this.getMockPrices();
        }
    }

    async fetchTrumpNews() {
        try {
            const response = await fetch(`${this.apiBase}/trump-news`);
            const data = await response.json();
            return data.trump_news || [];
        } catch (error) {
            console.error('获取特朗普新闻失败:', error);
            return this.getMockTrumpNews();
        }
    }

    async fetchStockNews() {
        try {
            const response = await fetch(`${this.apiBase}/news`);
            const data = await response.json();
            return data.news || {};
        } catch (error) {
            console.error('获取股票新闻失败:', error);
            return this.getMockStockNews();
        }
    }

    renderPrices(data) {
        const stockGrid = document.getElementById('stockGrid');
        if (!stockGrid) return;

        const stocks = ['RDDT', 'TSLA', 'UBER', 'COIN', 'CADL'];
        const pricesDetail = data.prices || {};
        const lastUpdate = data.last_update || {};

        stockGrid.innerHTML = stocks.map(symbol => {
            const priceData = pricesDetail[symbol] || {};
            const currentPrice = priceData.current || 0;
            const change = priceData.change || 0;
            const changePercent = priceData.change_percent || 0;
            const isPositive = change >= 0;

            return `
                <div class="stock-card fade-in">
                    <div class="stock-symbol">${symbol}</div>
                    <div class="stock-price">$${currentPrice.toFixed(2)}</div>
                    <div class="stock-change ${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%)
                    </div>
                    <div class="stock-time">
                        ${lastUpdate[symbol] ? new Date(lastUpdate[symbol]).toLocaleTimeString('zh-CN') : '实时'}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderTrumpNews(news) {
        const trumpNews = document.getElementById('trumpNews');
        if (!trumpNews) return;

        const newsList = news || this.getMockTrumpNews();

        trumpNews.innerHTML = newsList.map(item => `
            <div class="news-card fade-in">
                <div class="news-title">${item.title}</div>
                <div class="news-summary">${item.summary}</div>
                <div class="news-meta">
                    <span class="news-source">${item.source}</span>
                    <span class="news-time">
                        ${new Date(item.timestamp).toLocaleString('zh-CN')}
                    </span>
                </div>
            </div>
        `).join('');
    }

    renderStockNews(news) {
        const stockNews = document.getElementById('stockNews');
        if (!stockNews) return;

        const newsData = news || this.getMockStockNews();
        const stocks = ['RDDT', 'TSLA', 'UBER', 'COIN', 'CADL'];

        stockNews.innerHTML = stocks.map(symbol => {
            const news = newsData[symbol] || [];
            return `
                <div class="accordion-item">
                    <div class="accordion-header" onclick="toggleAccordion(this)">
                        <h3>${symbol} 相关新闻</h3>
                        <span>${news.length} 条</span>
                    </div>
                    <div class="accordion-content" style="display: none;">
                        ${news.map(item => `
                            <div class="news-item">
                                <div class="news-title">${item.title}</div>
                                <div class="news-summary">${item.summary}</div>
                                <div class="news-meta">
                                    <span class="news-source">${item.source}</span>
                                    <span class="news-time">${new Date(item.timestamp).toLocaleString('zh-CN')}</span>
                                </div>
                            </div>
                        `).join('')}
                        ${news.length === 0 ? '<p class="no-news">暂无相关新闻</p>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    updateLastUpdateTime() {
        const lastUpdate = document.getElementById('lastUpdate');
        if (lastUpdate) {
            lastUpdate.textContent = new Date().toLocaleString('zh-CN');
        }
    }

    startAutoUpdate() {
        this.updateTimer = setInterval(() => {
            this.loadAllData(false);
        }, this.updateInterval);
    }

    stopAutoUpdate() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }

    showLoading() {
        // 不再显示加载中，保留旧数据
    }

    hideLoading() {
        // 加载完成后自动隐藏loading状态
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'success') {
        // 查找或创建toast
        let toast = document.getElementById('globalToast');
        
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'globalToast';
            toast.className = `toast toast-${type}`;
            document.body.appendChild(toast);
        }
        
        // 清空之前的状态
        const existingTimeout = toast.getAttribute('data-timeout');
        if (existingTimeout) {
            clearTimeout(parseInt(existingTimeout));
        }
        
        // 更新内容
        toast.textContent = message;
        toast.className = `toast toast-${type}`;
        
        // 显示并居中
        toast.style.display = 'block';
        setTimeout(() => toast.classList.add('show'), 10);
        
        // 设置新的定时器
        const timeoutId = setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.style.display = 'none';
            }, 300);
        }, 3000);
        
        toast.setAttribute('data-timeout', timeoutId);
    }

    // Mock数据（用于API不可用时的演示）
    getMockPrices() {
        return {
            prices: {
                'RDDT': 45.32,
                'TSLA': 238.45,
                'UBER': 78.92,
                'COIN': 165.78,
                'CADL': 2.34
            },
            last_update: {
                'RDDT': new Date().toISOString(),
                'TSLA': new Date().toISOString(),
                'UBER': new Date().toISOString(),
                'COIN': new Date().toISOString(),
                'CADL': new Date().toISOString()
            }
        };
    }

    getMockTrumpNews() {
        return [
            {
                title: "特朗普在Truth Social上提及特斯拉自动驾驶",
                summary: "前总统特朗普在Truth Social平台发文讨论特斯拉自动驾驶技术对未来交通的影响，特别提到FSD系统可能改变美国交通格局。",
                timestamp: new Date().toISOString(),
                source: "Truth Social",
                keywords: ["TSLA", "自动驾驶", "特朗普"]
            },
            {
                title: "特朗普顾问团队与优步高管会面",
                summary: "特朗普竞选团队与优步高层就共享经济和劳工政策进行深度交流，讨论如何平衡平台经济与传统就业。",
                timestamp: new Date().toISOString(),
                source: "Bloomberg",
                keywords: ["UBER", "政策", "特朗普"]
            },
            {
                title: "特朗普对加密货币监管立场引发COIN股价波动",
                summary: "特朗普最新表态支持加密货币创新，称将减轻对数字资产的监管压力，COIN股价应声上涨3.2%。",
                timestamp: new Date().toISOString(),
                source: "Reuters",
                keywords: ["COIN", "加密货币", "特朗普"]
            }
        ];
    }

    getMockStockNews() {
        return {
            'RDDT': [
                {
                    title: "Reddit股价因广告收入超预期上涨",
                    summary: "Reddit最新财报显示广告收入同比增长45%，超出分析师预期，用户增长持续强劲。",
                    timestamp: new Date().toISOString(),
                    source: "CNBC"
                }
            ],
            'TSLA': [
                {
                    title: "特斯拉Q3交付量创历史新高",
                    summary: "特斯拉第三季度交付46万辆电动车，同比增长42%，创历史新高，中国市场表现突出。",
                    timestamp: new Date().toISOString(),
                    source: "Tesla IR"
                }
            ],
            'UBER': [
                {
                    title: "优步宣布扩大自动驾驶车队",
                    summary: "优步计划在2025年将自动驾驶车队规模扩大至10万辆，投资50亿美元研发无人驾驶技术。",
                    timestamp: new Date().toISOString(),
                    source: "Uber News"
                }
            ],
            'COIN': [
                {
                    title: "Coinbase推出新交易功能",
                    summary: "Coinbase宣布推出永续合约交易功能，支持50倍杠杆，面向专业投资者开放。",
                    timestamp: new Date().toISOString(),
                    source: "Coinbase Blog"
                }
            ],
            'CADL': [
                {
                    title: "Candel Therapeutics获得FDA突破性疗法认定",
                    summary: "CADL的癌症免疫疗法获得FDA突破性疗法认定，股价飙升25%，预计明年开始三期临床。",
                    timestamp: new Date().toISOString(),
                    source: "FDA"
                }
            ]
        };
    }
}

// 手风琴功能
try {
    window.toggleAccordion = function(header) {
        const content = header.nextElementSibling;
        const isOpen = content.style.display === 'block';
        
        // 关闭所有其他手风琴
        document.querySelectorAll('.accordion-content').forEach(item => {
            item.style.display = 'none';
        });
        
        // 切换当前手风琴
        content.style.display = isOpen ? 'none' : 'block';
    };
} catch (e) {
    console.log('手风琴功能初始化完成');
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 股票监控系统启动...');
    window.stockMonitor = new StockMonitor();
    
    // 添加一些实用工具
    window.StockUtils = {
        refresh: () => window.stockMonitor.loadAllData(),
        stopAuto: () => window.stockMonitor.stopAutoUpdate(),
        startAuto: () => window.stockMonitor.startAutoUpdate()
    };
    
    console.log('💡 调试命令:');
    console.log('🔄 StockUtils.refresh() - 手动刷新');
    console.log('⏸️ StockUtils.stopAuto() - 停止自动更新');
    console.log('▶️ StockUtils.startAuto() - 开始自动更新');
});