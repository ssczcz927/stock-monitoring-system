// 新闻流无限滚动加载
class NewsStream {
    constructor() {
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMore = true;
        this.newsCache = new Map();
        this.preloadCache = new Map();
        
        this.init();
    }

    init() {
        this.newsContainer = document.getElementById('newsContainer');
        this.loadingMore = document.getElementById('loadingMore');
        this.loadMoreBtn = document.getElementById('loadMoreBtn');
        
        if (!this.newsContainer) return;
        
        this.loadInitialNews();
        this.setupInfiniteScroll();
    }

    async loadInitialNews() {
        await this.loadNewsPage(1);
        this.setupIntersectionObserver();
    }

    async loadNewsPage(page) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading(true);
        
        try {
            // 检查缓存
            if (this.newsCache.has(page)) {
                const news = this.newsCache.get(page);
                this.renderNews(news, page === 1);
                this.hasMore = news.length === 10;
                this.hideLoading();
                this.isLoading = false;
                
                // 预加载下一页
                this.preloadNextPage(page + 1);
                return;
            }
            
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const apiBase = isLocal ? 'http://localhost:8090' : '';
            const response = await fetch(`${apiBase}/api/news/flat/${page}`);
            const data = await response.json();
            
            // 缓存结果
            this.newsCache.set(page, data.news);
            
            this.renderNews(data.news, page === 1);
            this.hasMore = data.has_more;
            this.currentPage = page;
            
            // 预加载下一页
            this.preloadNextPage(page + 1);
            
        } catch (error) {
            console.error('加载新闻失败:', error);
            this.renderError('加载新闻失败，请稍后重试');
        } finally {
            this.hideLoading();
            this.isLoading = false;
        }
    }

    async preloadNextPage(page) {
        if (this.preloadCache.has(page)) return;
        
        try {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const apiBase = isLocal ? 'http://localhost:8090' : '';
            const response = await fetch(`${apiBase}/api/news/flat/${page}`);
            const data = await response.json();
            this.preloadCache.set(page, data.news);
            console.log(`📦 预加载第${page}页完成`);
        } catch (error) {
            console.warn(`预加载第${page}页失败:`, error);
        }
    }

    renderNews(newsList, isInitial = false) {
        if (!this.newsContainer) return;
        
        if (isInitial) {
            this.newsContainer.innerHTML = '';
        }
        
        newsList.forEach(news => {
            const newsCard = this.createNewsCard(news);
            this.newsContainer.appendChild(newsCard);
        });
        
        // 添加淡入动画
        this.addFadeInAnimation();
    }

    createNewsCard(news) {
        const card = document.createElement('div');
        card.className = 'news-card fade-in';
        card.innerHTML = `
            <div class="news-header">
                <span class="company-tag ${news.company.toLowerCase()}">${news.company}</span>
                <span class="category-tag ${news.category.toLowerCase().replace(' ', '-')}">${news.category}</span>
                <span class="sentiment ${news.sentiment}">${this.getSentimentIcon(news.sentiment)}</span>
            </div>
            <div class="news-title">${news.title}</div>
            <div class="news-summary">${news.summary}</div>
            <div class="news-meta">
                <span class="news-source"><i class="fas fa-building"></i> ${news.source}</span>
                <span class="news-time"><i class="fas fa-clock"></i> ${this.formatTime(news.timestamp)}</span>
                <span class="relevance">相关度: ${Math.round(news.relevance * 100)}%</span>
            </div>
        `;
        return card;
    }

    setupInfiniteScroll() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.hasMore && !this.isLoading) {
                    this.loadMoreNews();
                }
            });
        }, options);

        // 创建加载更多指示器
        this.createLoadingIndicator();
    }

    setupIntersectionObserver() {
        const loadingIndicator = this.createLoadingIndicator();
        this.observer.observe(loadingIndicator);
    }

    createLoadingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'scroll-trigger';
        indicator.style.height = '1px';
        indicator.style.visibility = 'hidden';
        this.newsContainer.appendChild(indicator);
        return indicator;
    }

    loadMoreNews() {
        if (this.hasMore && !this.isLoading) {
            this.currentPage++;
            this.loadNewsPage(this.currentPage);
        }
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return '刚刚';
        if (diffMins < 60) return `${diffMins}分钟前`;
        if (diffHours < 24) return `${diffHours}小时前`;
        return `${diffDays}天前`;
    }

    getSentimentIcon(sentiment) {
        const icons = {
            'positive': '📈',
            'neutral': '📊',
            'negative': '📉'
        };
        return icons[sentiment] || '📊';
    }

    addFadeInAnimation() {
        const cards = this.newsContainer.querySelectorAll('.fade-in');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    showLoading(show = true) {
        if (this.loadingMore) {
            this.loadingMore.style.display = show ? 'block' : 'none';
        }
    }

    hideLoading() {
        this.showLoading(false);
    }

    renderError(message) {
        if (this.newsContainer) {
            this.newsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    ${message}
                </div>
            `;
        }
    }

    // 预加载管理
    async preloadPages() {
        const preloadPromises = [];
        for (let i = this.currentPage + 1; i <= this.currentPage + 3; i++) {
            if (!this.preloadCache.has(i)) {
                preloadPromises.push(this.preloadNextPage(i));
            }
        }
        await Promise.all(preloadPromises);
    }

    // 重置新闻流
    reset() {
        this.currentPage = 1;
        this.hasMore = true;
        this.newsContainer.innerHTML = '';
        this.loadInitialNews();
    }

    // 获取所有新闻（用于调试）
    getCachedNews() {
        return {
            cache: Array.from(this.newsCache.entries()),
            preload: Array.from(this.preloadCache.entries()),
            currentPage: this.currentPage
        };
    }
}

// 初始化新闻流
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('newsContainer')) {
        window.newsStream = new NewsStream();
    }
});