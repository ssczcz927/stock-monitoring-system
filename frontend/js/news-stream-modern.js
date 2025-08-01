// 现代化新闻流实现
class ModernNewsStream {
    constructor() {
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMore = true;
        this.newsContainer = null;
        this.loadingElement = null;
        this.observer = null;
        
        this.init();
    }

    init() {
        this.newsContainer = document.getElementById('newsContainer');
        this.loadingElement = document.getElementById('loadingMore');
        
        if (!this.newsContainer) {
            console.error('newsContainer not found');
            return;
        }
        
        console.log('初始化新闻流...');
        this.newsContainer.innerHTML = '';
        this.loadNewsPage(1);
        this.setupIntersectionObserver();
    }

    setupContainer() {
        this.newsContainer.innerHTML = '';
        this.newsContainer.className = 'modern-news-container';
    }

    async loadInitialNews() {
        console.log('开始加载初始新闻...');
        await this.loadNewsPage(1);
        this.setupIntersectionObserver();
    }

    async loadNewsPage(page) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading(true);
        
        try {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const apiBase = isLocal ? 'http://localhost:8090' : '';
            const response = await fetch(`${apiBase}/api/news/flat/${page}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            const news = data.news || [];
            this.hasMore = data.has_more !== undefined ? data.has_more : (news.length === 10);
            
            if (page === 1) {
                this.newsContainer.innerHTML = '';
            }
            
            this.renderNews(news);
            this.currentPage = page;
            
            // 如果没有更多数据，显示提示
            if (!this.hasMore) {
                this.showEndMessage();
            }
            
        } catch (error) {
            console.error('加载新闻失败:', error);
            this.renderError('加载新闻失败，请稍后重试');
        } finally {
            this.showLoading(false);
            this.isLoading = false;
        }
    }

    renderNews(newsList) {
        if (!this.newsContainer) return;
        
        newsList.forEach(news => {
            const newsCard = this.createNewsCard(news);
            this.newsContainer.appendChild(newsCard);
        });
        
        this.addFadeInAnimation();
        
        // 设置最后一个元素的观察器
        const cards = this.newsContainer.querySelectorAll('.news-card-modern');
        if (cards.length > 0) {
            const lastCard = cards[cards.length - 1];
            if (this.lastElementObserver) {
                this.lastElementObserver.observe(lastCard);
            }
        }
    }

    createNewsCard(news) {
        const card = document.createElement('div');
        card.className = 'news-card-modern clickable-card';
        
        const timeAgo = this.formatTime(news.timestamp);
        const sentimentIcon = this.getSentimentIcon(news.sentiment);
        
        card.innerHTML = `
            <div class="news-content">
                <h3 class="news-title">${news.title}</h3>
                <p class="news-summary">${news.summary}</p>
                <div class="news-meta">
                    <span class="source">${news.source}</span>
                    <span class="sentiment ${news.sentiment}">${sentimentIcon}</span>
                    <span class="time">${timeAgo}</span>
                </div>
            </div>
        `;
        
        // 整个卡片可点击
        card.addEventListener('click', (e) => {
            if (news.url && news.url !== '#') {
                window.open(news.url, '_blank');
            }
        });
        
        // 鼠标悬停效果
        card.style.cursor = 'pointer';
        
        return card;
    }

    setupInfiniteScroll() {
        const options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isLoading) {
                    this.loadMoreNews();
                }
            });
        }, options);

        // 监听最后一个新闻元素
        this.lastElementObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadMoreNews();
                }
            });
        }, options);
    }

.loadMoreNews() {
        this.currentPage++;
        this.loadNewsPage(this.currentPage);
    }

    startAutoRefresh() {
        // 每5分钟自动刷新新闻
        setInterval(() => {
            this.reset();
        }, 5 * 60 * 1000);
    }

    setupBottomRefresh() {
        // 添加底部刷新指示器
        const bottomRefresh = document.createElement('div');
        bottomRefresh.className = 'bottom-refresh';
        bottomRefresh.innerHTML = `
            <div class="refresh-btn" style="text-align: center; padding: 20px;">
                <button class="refresh-more-btn" style="background: var(--primary-blue); color: white; border: none; padding: 12px 24px; border-radius: 20px; cursor: pointer; font-weight: 500;">
                    <i class="fas fa-sync-alt"></i> 加载更多新闻
                </button>
            </div>
        `;
        
        if (this.newsContainer) {
            this.newsContainer.appendChild(bottomRefresh);
            
            // 点击加载更多
            bottomRefresh.querySelector('.refresh-more-btn').addEventListener('click', () => {
                this.loadMoreNews();
            });
        }
    }

    formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        return `${days}天前`;
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
        const cards = this.newsContainer.querySelectorAll('.news-card-modern');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }

    showLoading(show = true) {
        if (this.loadingElement) {
            this.loadingElement.style.display = show ? 'block' : 'none';
        }
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

    addBottomRefresh() {
        // 移除旧的刷新按钮
        const oldBtn = this.newsContainer.querySelector('.bottom-refresh');
        if (oldBtn) {
            oldBtn.remove();
        }
        
        if (!this.hasMore) return;
        
        // 添加新的刷新按钮
        const bottomRefresh = document.createElement('div');
        bottomRefresh.className = 'bottom-refresh';
        bottomRefresh.innerHTML = `
            <div class="refresh-btn" style="text-align: center; padding: 20px;">
                <button class="refresh-more-btn" style="background: var(--primary-blue); color: white; border: none; padding: 12px 24px; border-radius: 20px; cursor: pointer; font-weight: 500;">
                    <i class="fas fa-sync-alt"></i> 加载更多新闻
                </button>
            </div>
        `;
        
        this.newsContainer.appendChild(bottomRefresh);
        
        // 点击加载更多
        bottomRefresh.querySelector('.refresh-more-btn').addEventListener('click', () => {
            this.loadMoreNews();
        });
    }

    showEndMessage() {
        const message = document.createElement('div');
        message.className = 'end-message';
        message.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                <i class="fas fa-check-circle" style="font-size: 24px; margin-bottom: 10px;"></i>
                <p>已加载全部新闻</p>
            </div>
        `;
        this.newsContainer.appendChild(message);
    }

    reset() {
        this.currentPage = 1;
        this.hasMore = true;
        this.newsContainer.innerHTML = '';
        this.loadInitialNews();
    }
}

// 初始化现代化新闻流
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('newsContainer')) {
        window.newsStream = new ModernNewsStream();
        window.newsStream.startAutoRefresh();
    }
});