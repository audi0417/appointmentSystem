/**
 * 作品集管理頁面
 */

function initializePortfolio() {
    console.log('初始化作品集頁面');
    
    class PortfolioManager {
        constructor() {
            this.portfolios = [];
            this.filteredPortfolios = [];
            this.currentPage = 1;
            this.pageSize = 12;
            this.filters = {
                category: '',
                status: '',
                searchText: ''
            };

            this.categories = [
                { id: 'art', name: '造型設計' },
                { id: 'simple', name: '基礎款式' },
                { id: 'wedding', name: '婚禮系列' },
                { id: 'season', name: '季節限定' }
            ];

            this.init();
        }

        init() {
            this.initEventListeners();
            this.loadSampleData();
            this.renderPortfolios();
        }

        initEventListeners() {
            // 篩選事件
            document.getElementById('categoryFilter')?.addEventListener('change', 
                e => this.handleFilterChange('category', e.target.value));
            document.getElementById('statusFilter')?.addEventListener('change', 
                e => this.handleFilterChange('status', e.target.value));
            document.getElementById('portfolioSearch')?.addEventListener('input', 
                this.debounce(e => this.handleFilterChange('searchText', e.target.value), 300));

            // 表單提交
            const form = document.getElementById('portfolioForm');
            if (form) {
                form.addEventListener('submit', e => {
                    e.preventDefault();
                    this.savePortfolio();
                });
            }

            // 圖片上傳
            const imageInput = document.querySelector('#portfolioForm input[type="file"]');
            if (imageInput) {
                imageInput.addEventListener('change', e => this.handleImageUpload(e));
            }

            // Modal關閉按鈕
            document.querySelector('#portfolioFormModal .btn-close')?.addEventListener('click', 
                () => this.hideModal());
            document.querySelector('#portfolioFormModal .btn-secondary')?.addEventListener('click', 
                () => this.hideModal());
            
            // Modal backdrop點擊關閉
            const modal = document.getElementById('portfolioFormModal');
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.hideModal();
                    }
                });
            }
        }

        loadSampleData() {
            this.portfolios = [
                {
                    id: 1,
                    name: '春季櫻花款',
                    category: 'art',
                    categoryName: '造型設計',
                    description: '粉嫩櫻花設計，搭配細緻珍珠裝飾，完美呈現春天氛圍。',
                    status: 'active',
                    date: '2024-03-15',
                    tags: ['櫻花', '春季限定', '珍珠'],
                    images: ['/static/images/spring-sakura.jpg']
                },
                {
                    id: 2,
                    name: '優雅婚禮款',
                    category: 'wedding',
                    categoryName: '婚禮系列',
                    description: '典雅白色基調配上精緻蕾絲圖案，為新娘打造完美指尖造型。',
                    status: 'active',
                    date: '2024-02-20',
                    tags: ['婚禮', '蕾絲', '典雅'],
                    images: ['/static/images/wedding-elegant.jpg']
                },
                {
                    id: 3,
                    name: '秋意濃濃',
                    category: 'season',
                    categoryName: '季節限定',
                    description: '楓葉漸層色彩，溫暖橘紅調，完美詮釋秋天的浪漫情懷。',
                    status: 'inactive',
                    date: '2023-10-15',
                    tags: ['秋季', '楓葉', '漸層'],
                    images: ['/static/images/autumn-leaves.jpg']
                }
            ];
            
            this.filteredPortfolios = [...this.portfolios];
        }

        handleFilterChange(filterType, value) {
            this.filters[filterType] = value;
            this.currentPage = 1;
            this.filterPortfolios();
        }

        filterPortfolios() {
            let filtered = [...this.portfolios];

            // 類別篩選
            if (this.filters.category) {
                filtered = filtered.filter(portfolio => portfolio.category === this.filters.category);
            }

            // 狀態篩選
            if (this.filters.status) {
                filtered = filtered.filter(portfolio => portfolio.status === this.filters.status);
            }

            // 搜尋篩選
            if (this.filters.searchText) {
                const searchText = this.filters.searchText.toLowerCase();
                filtered = filtered.filter(portfolio => 
                    portfolio.name.toLowerCase().includes(searchText) ||
                    portfolio.description.toLowerCase().includes(searchText)
                );
            }

            this.filteredPortfolios = filtered;
            this.renderPortfolios();
        }

        renderPortfolios() {
            const container = document.getElementById('portfolioGrid');
            if (!container) return;

            if (this.filteredPortfolios.length === 0) {
                container.innerHTML = `
                    <div class="col-12">
                        <div class="text-center py-5">
                            <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                            <p class="text-muted">無相關作品</p>
                        </div>
                    </div>
                `;
                return;
            }

            container.innerHTML = this.filteredPortfolios.map(portfolio => `
                <div class="portfolio-card" data-category="${portfolio.category}" data-status="${portfolio.status}">
                    <div class="portfolio-image">
                        <img src="${portfolio.images[0]}" alt="${portfolio.name}" onerror="this.src='/static/images/sample-nail-art.svg'">
                        <span class="portfolio-status ${portfolio.status}">
                            ${portfolio.status === 'active' ? '展示中' : '已下架'}
                        </span>
                    </div>
                    <div class="portfolio-content">
                        <h3 class="portfolio-title">${this.escapeHtml(portfolio.name)}</h3>
                        <div class="portfolio-meta">
                            <span class="category">${portfolio.categoryName}</span>
                            <span class="date">${portfolio.date}</span>
                        </div>
                        <p class="portfolio-description">${this.escapeHtml(portfolio.description)}</p>
                        <div class="portfolio-tags">
                            ${portfolio.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                        </div>
                    </div>
                    <div class="portfolio-actions">
                        <button onclick="window.portfolioManager?.editPortfolio(${portfolio.id})" 
                                class="btn btn-sm btn-outline-primary" title="編輯">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="window.portfolioManager?.togglePortfolio(${portfolio.id})" 
                                class="btn btn-sm btn-outline-info" title="${portfolio.status === 'active' ? '下架' : '上架'}">
                            <i class="fas fa-${portfolio.status === 'active' ? 'eye-slash' : 'eye'}"></i>
                        </button>
                        <button onclick="window.portfolioManager?.deletePortfolio(${portfolio.id})" 
                                class="btn btn-sm btn-outline-danger" title="刪除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        showModal(portfolio = null) {
            console.log('顯示 Portfolio Modal:', portfolio);
            const modal = document.getElementById('portfolioFormModal');
            const form = document.getElementById('portfolioForm');
            const title = document.getElementById('portfolioModalTitle');

            console.log('Modal 元素:', modal);
            console.log('Form 元素:', form);
            
            if (!modal || !form) {
                console.error('找不到 Modal 或 Form 元素');
                return;
            }

            if (portfolio) {
                if (title) title.textContent = '編輯作品';
                form.dataset.portfolioId = portfolio.id;
                
                // 填充表單數據
                const nameInput = form.querySelector('input[name="name"]');
                const categorySelect = form.querySelector('select[name="category"]');
                const statusSelect = form.querySelector('select[name="status"]');
                const descriptionTextarea = form.querySelector('textarea[name="description"]');
                const tagsInput = form.querySelector('input[name="tags"]');
                
                if (nameInput) nameInput.value = portfolio.name;
                if (categorySelect) categorySelect.value = portfolio.category;
                if (statusSelect) statusSelect.value = portfolio.status;
                if (descriptionTextarea) descriptionTextarea.value = portfolio.description;
                if (tagsInput) tagsInput.value = portfolio.tags.join(', ');
                
                // 顯示現有圖片
                this.showExistingImages(portfolio.images);
            } else {
                if (title) title.textContent = '新增作品';
                form.dataset.portfolioId = '';
                form.reset();
                this.clearImagePreview();
            }

            // 使用Bootstrap modal方法顯示
            if (window.bootstrap && window.bootstrap.Modal) {
                console.log('使用 Bootstrap Modal');
                const bsModal = new window.bootstrap.Modal(modal);
                bsModal.show();
                console.log('Bootstrap Modal 已顯示');
            } else {
                console.log('使用備用 Modal 方案');
                // 備用方案：直接操作CSS
                modal.classList.add('show');
                modal.style.display = 'block';
                modal.setAttribute('aria-hidden', 'false');
                document.body.classList.add('modal-open');
                
                // 添加backdrop
                if (!document.querySelector('.modal-backdrop')) {
                    const backdrop = document.createElement('div');
                    backdrop.className = 'modal-backdrop fade show';
                    document.body.appendChild(backdrop);
                }
            }
        }

        hideModal() {
            const modal = document.getElementById('portfolioFormModal');
            if (!modal) return;
            
            // 使用Bootstrap modal方法隱藏
            if (window.bootstrap && window.bootstrap.Modal) {
                const bsModal = window.bootstrap.Modal.getInstance(modal);
                if (bsModal) {
                    bsModal.hide();
                }
            } else {
                // 備用方案：直接操作CSS
                modal.classList.remove('show');
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');
                document.body.classList.remove('modal-open');
                
                // 移除backdrop
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) {
                    backdrop.remove();
                }
            }
        }

        async savePortfolio() {
            const form = document.getElementById('portfolioForm');
            if (!form) return;

            const formData = new FormData(form);
            const portfolioData = {
                name: formData.get('name'),
                category: formData.get('category'),
                status: formData.get('status'),
                description: formData.get('description'),
                tags: formData.get('tags')?.split(',').map(tag => tag.trim()).filter(tag => tag) || []
            };

            // 驗證表單
            if (!this.validatePortfolio(portfolioData)) {
                return;
            }

            try {
                this.showLoading();

                // 模擬 API 調用
                await new Promise(resolve => setTimeout(resolve, 1000));

                const portfolioId = form.dataset.portfolioId;
                const categoryName = this.categories.find(c => c.id === portfolioData.category)?.name || '';

                if (portfolioId) {
                    // 更新現有作品
                    const index = this.portfolios.findIndex(p => p.id == portfolioId);
                    if (index !== -1) {
                        this.portfolios[index] = {
                            ...this.portfolios[index],
                            ...portfolioData,
                            categoryName
                        };
                    }
                    this.showSuccess('作品已更新');
                } else {
                    // 新增作品
                    const newPortfolio = {
                        id: Date.now(),
                        ...portfolioData,
                        categoryName,
                        date: new Date().toISOString().split('T')[0],
                        images: ['/static/images/sample-nail-art.svg']
                    };
                    this.portfolios.unshift(newPortfolio);
                    this.showSuccess('作品已新增');
                }

                this.filterPortfolios();
                this.hideModal();

            } catch (error) {
                this.showError('儲存失敗：' + error.message);
            } finally {
                this.hideLoading();
            }
        }

        validatePortfolio(portfolioData) {
            if (!portfolioData.name) {
                this.showError('請輸入作品名稱');
                return false;
            }
            if (!portfolioData.category) {
                this.showError('請選擇作品類別');
                return false;
            }
            if (!portfolioData.description) {
                this.showError('請輸入作品說明');
                return false;
            }
            return true;
        }

        editPortfolio(id) {
            console.log('編輯作品:', id);
            const portfolio = this.portfolios.find(p => p.id === id);
            if (portfolio) {
                console.log('找到作品:', portfolio);
                this.showModal(portfolio);
            } else {
                console.error('找不到作品 ID:', id);
            }
        }

        togglePortfolio(id) {
            const portfolio = this.portfolios.find(p => p.id === id);
            if (portfolio) {
                const newStatus = portfolio.status === 'active' ? 'inactive' : 'active';
                const action = newStatus === 'active' ? '上架' : '下架';
                
                if (confirm(`確定要${action}此作品嗎？`)) {
                    portfolio.status = newStatus;
                    this.filterPortfolios();
                    this.showSuccess(`作品已${action}`);
                }
            }
        }

        deletePortfolio(id) {
            if (confirm('確定要刪除此作品嗎？此操作無法復原。')) {
                this.portfolios = this.portfolios.filter(p => p.id !== id);
                this.filterPortfolios();
                this.showSuccess('作品已刪除');
            }
        }

        handleImageUpload(event) {
            const files = Array.from(event.target.files);
            const previewContainer = document.querySelector('.image-preview-container');
            
            if (!previewContainer) return;
            
            // 清空現有預覽
            previewContainer.innerHTML = '';
            
            // 檢查檔案數量
            if (files.length > 5) {
                this.showError('最多只能上傳5張圖片');
                event.target.value = '';
                return;
            }

            files.forEach((file, index) => {
                // 檢查檔案類型
                if (!file.type.startsWith('image/')) {
                    this.showError('請上傳圖片檔案');
                    return;
                }

                // 檢查檔案大小 (2MB限制)
                if (file.size > 2 * 1024 * 1024) {
                    this.showError('圖片大小不能超過2MB');
                    return;
                }

                // 顯示預覽
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.addImagePreview(e.target.result, index);
                };
                reader.readAsDataURL(file);
            });
        }

        addImagePreview(src, index) {
            const previewContainer = document.querySelector('.image-preview-container');
            if (!previewContainer) return;
            
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <img src="${src}" alt="預覽圖片 ${index + 1}">
                <button class="remove-btn" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            previewContainer.appendChild(previewItem);
        }

        showExistingImages(images) {
            const previewContainer = document.querySelector('.image-preview-container');
            if (!previewContainer) return;
            
            previewContainer.innerHTML = '';
            
            images.forEach((src, index) => {
                this.addImagePreview(src, index);
            });
        }

        clearImagePreview() {
            const previewContainer = document.querySelector('.image-preview-container');
            if (previewContainer) {
                previewContainer.innerHTML = '';
            }
        }

        // 工具方法
        escapeHtml(unsafe) {
            if (!unsafe) return '';
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        showLoading() {
            const btn = document.querySelector('#portfolioFormModal .btn-primary');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>儲存中...';
            }
        }

        hideLoading() {
            const btn = document.querySelector('#portfolioFormModal .btn-primary');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '儲存';
            }
        }

        showSuccess(message) {
            this.showNotification(message, 'success');
        }

        showError(message) {
            this.showNotification(message, 'danger');
        }

        showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
            notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
            notification.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 3000);
        }
    }

    // 創建管理器實例
    const manager = new PortfolioManager();
    
    // 將管理器設為全局變數供HTML調用
    window.portfolioManager = manager;
    
    return function cleanup() {
        // 清理事件監聽器
        document.getElementById('categoryFilter')?.removeEventListener('change');
        document.getElementById('statusFilter')?.removeEventListener('change');
        document.getElementById('portfolioSearch')?.removeEventListener('input');
        document.getElementById('portfolioForm')?.removeEventListener('submit');
        document.querySelector('#portfolioFormModal .btn-close')?.removeEventListener('click');
        document.querySelector('#portfolioFormModal .btn-secondary')?.removeEventListener('click');
        
        // 清理全局變數
        if (window.portfolioManager) {
            delete window.portfolioManager;
        }
    };
}

// 將初始化函數設為全局
window.initializePortfolio = initializePortfolio;
