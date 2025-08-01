// 增强版实时新闻流 - 支持10条新闻和无限滚动
class SimpleNewsStream {
    constructor() {
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMore = true;
        this.newsContainer = null;
        this.loadingElement = null;
        this.isInitialized = false;
        
        // 使用防抖处理滚动事件
        this.scrollTimeout = null;
        this.debounceDelay = 200;
        
        // 确保DOM加载完成后初始化
        this.init();
    }

    init() {
        this.newsContainer = document.getElementById('newsContainer');
        this.loadingElement = document.getElementById('loadingMore');
        
        if (!this.newsContainer) {
            console.error('新闻容器未找到');
            return;
        }
        
        console.log('🚀 初始化增强版新闻流...');
        this.loadNews();
        this.setupScrollListener();
        this.isInitialized = true;
    }

    async loadNews(reset = false) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading(true);
        
        try {
            if (reset) {
                this.currentPage = 1;
                this.hasMore = true;
            }
            
            const response = await fetch(`http://localhost:8085/api/news/flat/${this.currentPage}`);
            const data = await response.json();
            
            const news = data.news || [];
            
            if (reset || this.currentPage === 1) {
                this.newsContainer.innerHTML = '';
            }
            
            if (news.length === 0) {
                if (this.currentPage === 1) {
                    this.showEmptyState();
                } else {
                    this.hasMore = false;
                }
            } else {
                news.forEach(item => {
                    const card = this.createNewsCard(item);
                    this.newsContainer.appendChild(card);
                });
                
                // 检查是否还有更多内容
                this.hasMore = news.length === 10; // 假设API返回10条为满页
                
                console.log(`📰 已加载第${this.currentPage}页，${news.length}条新闻`);
            }
            
        } catch (error) {
            console.error('❌ 加载新闻失败:', error);
            if (this.currentPage === 1) {
                this.showErrorState();
            }
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    setupScrollListener() {
        window.addEventListener('scroll', () => {
            if (this.scrollTimeout) {
                clearTimeout(this.scrollTimeout);
            }
            
            this.scrollTimeout = setTimeout(() => {
                this.handleScroll();
            }, this.debounceDelay);
        });
    }

    handleScroll() {
        if (!this.hasMore || this.isLoading) return;
        
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // 当滚动到距离底部200px时触发加载
        const threshold = 200;
        
        if (scrollTop + windowHeight >= documentHeight - threshold) {
            this.currentPage++;
            this.loadNews();
        }
    }

    createNewsCard(item) {
        const card = document.createElement('div');
        card.className = 'news-card-modern fade-in';
        
        // 格式化北京时间显示
        const beijingTime = item.beijing_time || new Date(item.timestamp).toLocaleString('zh-CN');
        const dateGroup = item.date_group || '';
        
        card.innerHTML = `
            <div class="news-content">
                <a href="${item.url}" target="_blank" class="news-title-link">
                    <h3 class="news-title">${item.title}</h3>
                </a>
                <p class="news-summary">${item.summary}</p>
                <div class="news-meta">
                    <span class="source">${item.source}</span>
                    <span class="time">${dateGroup} ${beijingTime}</span>
                    <span class="sentiment ${item.sentiment}">●</span>
                </div>
            </div>
        `;
        return card;
    }

    showLoading(show) {
        if (this.loadingElement) {
            this.loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    showEmptyState() {
        this.newsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fas fa-newspaper" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                <h3>暂无相关新闻</h3>
                <p>暂无与目标股票相关的新闻，请稍后再试</p>
            </div>
        `;
    }

    showErrorState() {
        this.newsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--error-red);">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                <h3>加载失败</h3>
                <p>新闻加载失败，请检查网络连接后重试</p>
                <button onclick="window.newsStream.loadNews(true)" class="refresh-btn">
                    <i class="fas fa-sync-alt"></i> 重新加载
                </button>
            </div>
        `;
    }

    // 公开方法：重新加载新闻
    reload() {
        this.loadNews(true);
    }
}

// 初始化增强版新闻流
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('newsContainer')) {
        window.newsStream = new SimpleNewsStream();
    }
});