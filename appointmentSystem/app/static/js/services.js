/**
 * 服務項目管理頁面
 */

function initializeServices() {
    console.log('初始化服務項目頁面');
    
    class ServiceManager {
        constructor() {
            this.services = [];
            this.filteredServices = [];
            this.currentPage = 1;
            this.pageSize = 12;
            this.filters = {
                category: '',
                status: '',
                searchText: ''
            };

            this.categories = [
                { id: 'basic', name: '基礎美甲' },
                { id: 'gel', name: '凝膠美甲' },
                { id: 'design', name: '美甲設計' },
                { id: 'care', name: '手部保養' }
            ];

            this.init();
        }

        init() {
            this.initEventListeners();
            this.initCategoryOptions();
            this.loadSampleData();
            this.renderServices();
        }

        initEventListeners() {
            // 篩選事件
            document.getElementById('categoryFilter')?.addEventListener('change', 
                e => this.handleFilterChange('category', e.target.value));
            document.getElementById('statusFilter')?.addEventListener('change', 
                e => this.handleFilterChange('status', e.target.value));
            document.getElementById('serviceSearch')?.addEventListener('input', 
                this.debounce(e => this.handleFilterChange('searchText', e.target.value), 300));

            // 新增服務按鈕
            document.getElementById('addServiceBtn')?.addEventListener('click', 
                () => this.showModal());

            // 表單提交
            const form = document.getElementById('serviceForm');
            if (form) {
                form.addEventListener('submit', e => {
                    e.preventDefault();
                    this.saveService();
                });
            }

            // 圖片上傳
            const imageInput = document.querySelector('#serviceForm input[type="file"]');
            if (imageInput) {
                imageInput.addEventListener('change', e => this.handleImageUpload(e));
            }

            // Modal關閉按鈕
            document.querySelector('#serviceFormModal .close')?.addEventListener('click', 
                () => this.hideModal());
            document.getElementById('cancelServiceBtn')?.addEventListener('click', 
                () => this.hideModal());
        }

        initCategoryOptions() {
            const categorySelects = document.querySelectorAll('select[name="category"], #categoryFilter');
            
            categorySelects.forEach(select => {
                if (select.id === 'categoryFilter') {
                    select.innerHTML = '<option value="">所有類別</option>';
                } else {
                    select.innerHTML = '<option value="">請選擇類別</option>';
                }
                
                this.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    select.appendChild(option);
                });
            });
        }

        loadSampleData() {
            this.services = [
                {
                    id: 1,
                    name: '基礎保養',
                    category: 'basic',
                    categoryName: '基礎美甲',
                    description: '包含指甲修型、死皮處理、指緣保養、基礎保濕等完整基礎護理。',
                    price: 800,
                    duration: 60,
                    status: 'active',
                    image: '/static/images/sample-nail-art.svg'
                },
                {
                    id: 2,
                    name: '凝膠美甲',
                    category: 'gel',
                    categoryName: '凝膠美甲',
                    description: '使用高品質凝膠材料，持久不易剝落，多種顏色選擇。',
                    price: 1200,
                    duration: 90,
                    status: 'active',
                    image: '/static/images/sample-nail-art.svg'
                },
                {
                    id: 3,
                    name: '美甲設計',
                    category: 'design',
                    categoryName: '美甲設計',
                    description: '客製化設計服務，包含繪畫、貼鑽、漸層等多種技法。',
                    price: 1500,
                    duration: 120,
                    status: 'active',
                    image: '/static/images/sample-nail-art.svg'
                },
                {
                    id: 4,
                    name: '手部護理',
                    category: 'care',
                    categoryName: '手部保養',
                    description: '深層清潔、去角質、保濕護理，讓雙手柔嫩光滑。',
                    price: 600,
                    duration: 45,
                    status: 'inactive',
                    image: '/static/images/sample-nail-art.svg'
                }
            ];
            
            this.filteredServices = [...this.services];
        }

        handleFilterChange(filterType, value) {
            this.filters[filterType] = value;
            this.currentPage = 1;
            this.filterServices();
        }

        filterServices() {
            let filtered = [...this.services];

            // 類別篩選
            if (this.filters.category) {
                filtered = filtered.filter(service => service.category === this.filters.category);
            }

            // 狀態篩選
            if (this.filters.status) {
                filtered = filtered.filter(service => service.status === this.filters.status);
            }

            // 搜尋篩選
            if (this.filters.searchText) {
                const searchText = this.filters.searchText.toLowerCase();
                filtered = filtered.filter(service => 
                    service.name.toLowerCase().includes(searchText) ||
                    service.description.toLowerCase().includes(searchText)
                );
            }

            this.filteredServices = filtered;
            this.renderServices();
        }

        renderServices() {
            const container = document.getElementById('servicesGrid');
            if (!container) return;

            if (this.filteredServices.length === 0) {
                container.innerHTML = `
                    <div class="col-12">
                        <div class="text-center py-5">
                            <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                            <p class="text-muted">暫無服務項目</p>
                        </div>
                    </div>
                `;
                return;
            }

            container.innerHTML = this.filteredServices.map(service => `
                <div class="service-card" data-category="${service.category}" data-status="${service.status}">
                    <div class="service-image">
                        <img src="${service.image}" alt="${service.name}" onerror="this.src='/static/images/sample-nail-art.svg'">
                        <span class="status-badge ${service.status}">
                            ${service.status === 'active' ? '上架中' : '已下架'}
                        </span>
                    </div>
                    <div class="service-content">
                        <h5 class="service-title">${this.escapeHtml(service.name)}</h5>
                        <div class="service-meta">
                            <span class="duration"><i class="fas fa-clock"></i> ${service.duration}分鐘</span>
                            <span class="price">NT$ ${service.price}</span>
                        </div>
                        <p class="service-description">${this.escapeHtml(service.description)}</p>
                        <div class="category-tag">${service.categoryName}</div>
                    </div>
                    <div class="service-actions">
                        <button onclick="window.serviceManager?.editService(${service.id})" 
                                class="action-btn edit" title="編輯">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="window.serviceManager?.toggleService(${service.id})" 
                                class="action-btn toggle" title="${service.status === 'active' ? '下架' : '上架'}">
                            <i class="fas fa-${service.status === 'active' ? 'eye-slash' : 'eye'}"></i>
                        </button>
                        <button onclick="window.serviceManager?.deleteService(${service.id})" 
                                class="action-btn delete" title="刪除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        showModal(service = null) {
            const modal = document.getElementById('serviceFormModal');
            const form = document.getElementById('serviceForm');
            const title = document.getElementById('serviceModalTitle');

            if (!modal || !form) return;

            if (service) {
                if (title) title.textContent = '編輯服務項目';
                form.dataset.serviceId = service.id;
                
                // 填充表單數據
                const nameInput = form.querySelector('input[name="name"]');
                const categorySelect = form.querySelector('select[name="category"]');
                const statusSelect = form.querySelector('select[name="status"]');
                const durationInput = form.querySelector('input[name="duration"]');
                const priceInput = form.querySelector('input[name="price"]');
                const descriptionTextarea = form.querySelector('textarea[name="description"]');
                
                if (nameInput) nameInput.value = service.name;
                if (categorySelect) categorySelect.value = service.category;
                if (statusSelect) statusSelect.value = service.status;
                if (durationInput) durationInput.value = service.duration;
                if (priceInput) priceInput.value = service.price;
                if (descriptionTextarea) descriptionTextarea.value = service.description;
                
                // 顯示現有圖片
                this.showExistingImage(service.image);
            } else {
                if (title) title.textContent = '新增服務項目';
                form.dataset.serviceId = '';
                form.reset();
                this.clearImagePreview();
            }

            modal.style.display = 'block';
        }

        hideModal() {
            const modal = document.getElementById('serviceFormModal');
            if (modal) {
                modal.style.display = 'none';
            }
        }

        async saveService() {
            const form = document.getElementById('serviceForm');
            if (!form) return;

            const formData = new FormData(form);
            const serviceData = {
                name: formData.get('name'),
                category: formData.get('category'),
                status: formData.get('status'),
                duration: parseInt(formData.get('duration')),
                price: parseInt(formData.get('price')),
                description: formData.get('description')
            };

            // 驗證表單
            if (!this.validateService(serviceData)) {
                return;
            }

            try {
                this.showLoading();

                // 模擬API調用
                await new Promise(resolve => setTimeout(resolve, 1000));

                const serviceId = form.dataset.serviceId;
                const categoryName = this.categories.find(c => c.id === serviceData.category)?.name || '';

                if (serviceId) {
                    // 更新現有服務
                    const index = this.services.findIndex(s => s.id == serviceId);
                    if (index !== -1) {
                        this.services[index] = {
                            ...this.services[index],
                            ...serviceData,
                            categoryName
                        };
                    }
                    this.showSuccess('服務項目已更新');
                } else {
                    // 新增服務
                    const newService = {
                        id: Date.now(),
                        ...serviceData,
                        categoryName,
                        image: '/static/images/sample-nail-art.svg'
                    };
                    this.services.unshift(newService);
                    this.showSuccess('服務項目已新增');
                }

                this.filterServices();
                this.hideModal();

            } catch (error) {
                this.showError('儲存失敗：' + error.message);
            } finally {
                this.hideLoading();
            }
        }

        validateService(serviceData) {
            if (!serviceData.name) {
                this.showError('請輸入服務名稱');
                return false;
            }
            if (!serviceData.category) {
                this.showError('請選擇服務類別');
                return false;
            }
            if (!serviceData.duration || serviceData.duration <= 0) {
                this.showError('請輸入正確的服務時長');
                return false;
            }
            if (!serviceData.price || serviceData.price <= 0) {
                this.showError('請輸入正確的服務價格');
                return false;
            }
            return true;
        }

        editService(id) {
            const service = this.services.find(s => s.id === id);
            if (service) {
                this.showModal(service);
            }
        }

        toggleService(id) {
            const service = this.services.find(s => s.id === id);
            if (service) {
                const newStatus = service.status === 'active' ? 'inactive' : 'active';
                const action = newStatus === 'active' ? '上架' : '下架';
                
                if (confirm(`確定要${action}此服務項目嗎？`)) {
                    service.status = newStatus;
                    this.filterServices();
                    this.showSuccess(`服務項目已${action}`);
                }
            }
        }

        deleteService(id) {
            if (confirm('確定要刪除此服務項目嗎？此操作無法復原。')) {
                this.services = this.services.filter(s => s.id !== id);
                this.filterServices();
                this.showSuccess('服務項目已刪除');
            }
        }

        handleImageUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            // 檢查檔案類型
            if (!file.type.startsWith('image/')) {
                this.showError('請上傳圖片檔案');
                event.target.value = '';
                return;
            }

            // 檢查檔案大小 (2MB限制)
            if (file.size > 2 * 1024 * 1024) {
                this.showError('圖片大小不能超過2MB');
                event.target.value = '';
                return;
            }

            // 顯示預覽
            const reader = new FileReader();
            reader.onload = (e) => {
                this.showImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }

        showImagePreview(src) {
            const preview = document.querySelector('.image-preview');
            if (preview) {
                preview.innerHTML = `<img src="${src}" alt="預覽圖片" style="max-width: 100%; height: auto;">`;
            }
        }

        showExistingImage(src) {
            this.showImagePreview(src);
        }

        clearImagePreview() {
            const preview = document.querySelector('.image-preview');
            if (preview) {
                preview.innerHTML = '';
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
            const btn = document.querySelector('#serviceFormModal .btn-primary');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>儲存中...';
            }
        }

        hideLoading() {
            const btn = document.querySelector('#serviceFormModal .btn-primary');
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
    const manager = new ServiceManager();
    
    // 將管理器設為全局變數供HTML調用
    window.serviceManager = manager;
    
    return function cleanup() {
        // 清理事件監聽器
        document.getElementById('categoryFilter')?.removeEventListener('change');
        document.getElementById('statusFilter')?.removeEventListener('change');
        document.getElementById('serviceSearch')?.removeEventListener('input');
        document.getElementById('addServiceBtn')?.removeEventListener('click');
        document.getElementById('serviceForm')?.removeEventListener('submit');
        document.querySelector('#serviceFormModal .close')?.removeEventListener('click');
        document.getElementById('cancelServiceBtn')?.removeEventListener('click');
        
        // 清理全局變數
        if (window.serviceManager) {
            delete window.serviceManager;
        }
    };
}

// 將初始化函數設為全局
window.initializeServices = initializeServices;