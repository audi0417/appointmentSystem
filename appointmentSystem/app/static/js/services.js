/**
 * 服務項目管理功能
 */

// 編輯服務項目
function editService(serviceId) {
    console.log('編輯服務項目:', serviceId);
    // 打開編輯Modal
    const modal = new bootstrap.Modal(document.getElementById('serviceFormModal'));
    const modalTitle = document.getElementById('serviceModalTitle');
    modalTitle.textContent = '編輯服務項目';
    modal.show();
}

// 刪除服務項目
function deleteService(serviceId) {
    if (confirm('確定要刪除此服務項目嗎？')) {
        console.log('刪除服務項目:', serviceId);
        // TODO: 實際的刪除邏輯
        showSuccessMessage('服務項目已刪除');
    }
}

// 切換服務狀態
function toggleServiceStatus(serviceId) {
    console.log('切換服務狀態:', serviceId);
    // TODO: 實際的狀態切換邏輯
    showSuccessMessage('服務狀態已更新');
}

// 顯示成功訊息
function showSuccessMessage(message) {
    // 創建通知元素
    const notification = document.createElement('div');
    notification.className = 'alert alert-success alert-dismissible fade show position-fixed';
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // 3秒後自動移除
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// 初始化服務項目篩選功能
function initializeServicesFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('serviceSearch');

    // 篩選功能
    function filterServices() {
        const categoryValue = categoryFilter?.value || '';
        const statusValue = statusFilter?.value || '';
        const searchValue = searchInput?.value.toLowerCase() || '';

        const serviceCards = document.querySelectorAll('.service-card');
        
        serviceCards.forEach(card => {
            let shouldShow = true;

            // 類別篩選
            if (categoryValue && card.dataset.category !== categoryValue) {
                shouldShow = false;
            }

            // 狀態篩選
            if (statusValue && card.dataset.status !== statusValue) {
                shouldShow = false;
            }

            // 搜尋篩選
            if (searchValue) {
                const title = card.querySelector('.service-title')?.textContent.toLowerCase() || '';
                const description = card.querySelector('.service-description')?.textContent.toLowerCase() || '';
                if (!title.includes(searchValue) && !description.includes(searchValue)) {
                    shouldShow = false;
                }
            }

            card.style.display = shouldShow ? 'block' : 'none';
        });
    }

    // 綁定事件
    categoryFilter?.addEventListener('change', filterServices);
    statusFilter?.addEventListener('change', filterServices);
    
    // 搜尋防抖
    let searchTimeout;
    searchInput?.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(filterServices, 300);
    });
}

// 表單提交處理
function handleServiceFormSubmit() {
    const form = document.getElementById('serviceForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const serviceData = {
            name: formData.get('name'),
            category: formData.get('category'),
            status: formData.get('status'),
            duration: formData.get('duration'),
            price: formData.get('price'),
            description: formData.get('description')
        };

        console.log('保存服務項目:', serviceData);
        
        // 關閉Modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('serviceFormModal'));
        modal.hide();
        
        showSuccessMessage('服務項目已保存');
        
        // 重置表單
        form.reset();
    });
}

// 頁面初始化
function initializeServices() {
    console.log('初始化服務項目頁面');
    initializeServicesFilters();
    handleServiceFormSubmit();
}

// 確保函數在全域可用
window.editService = editService;
window.deleteService = deleteService;
window.toggleServiceStatus = toggleServiceStatus;
window.initializeServices = initializeServices;
