// 完整的实时新闻板块 - NewsAPI集成
class RealtimeNewsSystem {
    constructor() {
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMore = true;
        this.newsContainer = null;
        this.loadingElement = null;
        this.backToTop = null;
        
        this.init();
    }

    init() {
        this.newsContainer = document.getElementById('newsContainer');
        this.loadingElement = document.getElementById('loadingMore');
        this.backToTop = document.getElementById('backToTop');
        
        if (!this.newsContainer) {
            console.error('新闻容器未找到');
            return;
        }

        console.log('🚀 初始化实时新闻系统...');
        this.loadNews();
        this.setupScrollListener();
        this.setupBackToTop();
        this.setupAutoRefresh();
    }

    async loadNews(reset = false) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading(true);
        
        try {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const apiBase = isLocal ? 'http://localhost:8090' : '';
            const response = await fetch(`${apiBase}/api/news/flat/${this.currentPage}`);
            const data = await response.json();
            
            const news = data.news || [];
            this.hasMore = data.has_more !== undefined ? data.has_more : (news.length === 10);
            
            if (reset || this.currentPage === 1) {
                this.newsContainer.innerHTML = '';
            }
            
            if (news.length === 0 && this.currentPage === 1) {
                this.showEmptyState();
            } else {
                this.renderNews(news);
                this.addFadeInAnimation();
            }
            
            console.log(`✅ 已加载 ${news.length} 条实时新闻`);
            
        } catch (error) {
            console.error('❌ 加载新闻失败:', error);
            this.showError('加载新闻失败，请稍后重试');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    renderNews(newsList) {
        if (!this.newsContainer) return;
        
        const newsHTML = newsList.map((news, index) => `
            <div class="news-card-modern realtime-card" data-index="${index}" style="opacity: 0; transform: translateY(20px);">
                <div class="news-content">
                    <h3 class="news-title">${this.escapeHtml(news.title)}</h3>
                    <p class="news-summary">${this.escapeHtml(news.summary || '')}</p>
                    
                    <div class="news-meta">
                        <span class="news-source">
                            <i class="fas fa-newspaper"></i> ${news.source}
                        </span>
                        <span class="news-time" data-timestamp="${news.timestamp}">
                            ${this.formatTime(news.timestamp)}
                        </span>
                        <span class="news-sentiment ${news.sentiment}">
                            ${this.getSentimentIcon(news.sentiment)}
                        </span>
                    </div>
                </div>
                
                <div class="news-actions">
                    <button class="read-more-btn" onclick="window.open('${news.url}', '_blank')">
                        <i class="fas fa-external-link-alt"></i> 阅读原文
                    </button>
                </div>
            </div>
        `).join('');
        
        this.newsContainer.insertAdjacentHTML('beforeend', newsHTML);
    }

    setupScrollListener() {
        // 无限滚动监听
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (this.shouldLoadMore()) {
                    this.loadMore();
                }
            }, 200);
        });

        // 回到顶部按钮显示逻辑
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > 500) {
                this.backToTop?.classList.add('show');
            } else {
                this.backToTop?.classList.remove('show');
            }
        });
    }

    setupBackToTop() {
        if (this.backToTop) {
            this.backToTop.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    setupAutoRefresh() {
        // 每2分钟自动刷新最新新闻
        setInterval(() => {
            this.refreshNews();
        }, 2 * 60 * 1000);

        // 页面可见性API - 重新激活时刷新
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.refreshNews();
            }
        });
    }

    loadMore() {
        if (this.hasMore && !this.isLoading) {
            this.currentPage++;
            this.loadNews();
        }
    }

    refreshNews() {
        this.currentPage = 1;
        this.hasMore = true;
        this.loadNews(true);
    }

    shouldLoadMore() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        return scrollTop + windowHeight >= documentHeight - 100;
    }

    showLoading(show = true) {
        if (this.loadingElement) {
            this.loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    showError(message) {
        if (this.newsContainer) {
            this.newsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    ${message}
                </div>
            `;
        }
    }

    showEmptyState() {
        if (this.newsContainer) {
            this.newsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-newspaper"></i>
                    <h3>暂无新闻</h3>
                    <p>请稍后再试或检查网络连接</p>
                </div>
            `;
        }
    }

    addFadeInAnimation() {
        const cards = this.newsContainer.querySelectorAll('.realtime-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}天前`;
        if (hours > 0) return `${hours}小时前`;
        if (minutes > 0) return `${minutes}分钟前`;
        return '刚刚';
    }

    getSentimentIcon(sentiment) {
        const icons = {
            'positive': '📈',
            'neutral': '📊',
            'negative': '📉'
        };
        return icons[sentiment] || '📊';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化实时新闻系统
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('newsContainer')) {
        window.newsSystem = new RealtimeNewsSystem();
    }
});