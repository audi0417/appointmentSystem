// 作品集頁面功能
document.addEventListener('DOMContentLoaded', function() {
    initializePortfolio();
});

// 初始化作品集功能
function initializePortfolio() {
    initializeImageUpload();
    initializeFormValidation();
    initializeFilters();
    initializeLightbox();
    bindEventListeners();
}

// 圖片上傳預覽功能
function initializeImageUpload() {
    const imageInput = document.querySelector('#portfolioForm input[type="file"]');
    const previewContainer = document.querySelector('.image-preview-container');

    imageInput.addEventListener('change', function(e) {
        // 清空預覽區
        previewContainer.innerHTML = '';
        
        // 檢查檔案數量
        if (e.target.files.length > 5) {
            showError('最多只能上傳5張圖片');
            e.target.value = '';
            return;
        }

        // 處理每個選擇的檔案
        Array.from(e.target.files).forEach((file, index) => {
            // 檢查檔案類型
            if (!file.type.startsWith('image/')) {
                showError('請上傳圖片檔案');
                return;
            }

            // 檢查檔案大小 (2MB限制)
            if (file.size > 2 * 1024 * 1024) {
                showError('圖片大小不能超過2MB');
                return;
            }

            // 創建預覽元素
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            
            const img = document.createElement('img');
            const reader = new FileReader();
            
            reader.onload = function(e) {
                img.src = e.target.result;
            }
            
            // 新增刪除按鈕
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.onclick = function() {
                previewItem.remove();
                // TODO: 處理檔案陣列
            }

            previewItem.appendChild(img);
            previewItem.appendChild(removeBtn);
            previewContainer.appendChild(previewItem);
            
            reader.readAsDataURL(file);
        });
    });
}

// 表單驗證
function initializeFormValidation() {
    const form = document.getElementById('portfolioForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm(form)) {
            savePortfolio(form);
        }
    });
}

// 驗證表單資料
function validateForm(form) {
    let isValid = true;
    
    // 檢查必填欄位
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showError(`${field.previousElementSibling.textContent}不能為空`);
            isValid = false;
        }
    });

    // 檢查圖片是否已上傳
    const previewContainer = document.querySelector('.image-preview-container');
    if (!previewContainer.children.length) {
        showError('請至少上傳一張圖片');
        isValid = false;
    }

    return isValid;
}

// 儲存作品資料
function savePortfolio(form) {
    // 收集表單資料
    const formData = new FormData(form);
    
    // TODO: 發送API請求
    console.log('儲存作品', Object.fromEntries(formData));
    
    // 模擬成功儲存
    showSuccess('作品已儲存');
    closeModal('portfolioFormModal');
    resetForm(form);
}

// 初始化篩選功能
function initializeFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.querySelector('.search-group input');

    // 類別篩選
    categoryFilter.addEventListener('change', function() {
        filterPortfolio();
    });

    // 狀態篩選
    statusFilter.addEventListener('change', function() {
        filterPortfolio();
    });

    // 搜尋功能
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterPortfolio();
        }, 300);
    });
}

// 篩選作品
function filterPortfolio() {
    const category = document.getElementById('categoryFilter').value;
    const status = document.getElementById('statusFilter').value;
    const searchTerm = document.querySelector('.search-group input').value.toLowerCase();

    const portfolioCards = document.querySelectorAll('.portfolio-card');

    portfolioCards.forEach(card => {
        let shouldShow = true;

        // 類別篩選
        if (category && card.dataset.category !== category) {
            shouldShow = false;
        }

        // 狀態篩選
        if (status && card.dataset.status !== status) {
            shouldShow = false;
        }

        // 搜尋篩選
        if (searchTerm) {
            const title = card.querySelector('.portfolio-title').textContent.toLowerCase();
            const description = card.querySelector('.portfolio-description').textContent.toLowerCase();
            if (!title.includes(searchTerm) && !description.includes(searchTerm)) {
                shouldShow = false;
            }
        }

        card.style.display = shouldShow ? 'block' : 'none';
    });
}

// 初始化Lightbox
function initializeLightbox() {
    lightbox.option({
        'resizeDuration': 200,
        'wrapAround': true,
        'albumLabel': "作品 %1 / %2"
    });
}

// 綁定事件監聽器
function bindEventListeners() {
    // 刪除作品
    document.querySelectorAll('.action-btn.delete').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const card = e.target.closest('.portfolio-card');
            if (confirm('確定要刪除這個作品嗎？')) {
                // TODO: 發送刪除API請求
                card.remove();
                showSuccess('作品已刪除');
            }
        });
    });

    // 切換狀態
    document.querySelectorAll('.action-btn.toggle').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const card = e.target.closest('.portfolio-card');
            const statusBadge = card.querySelector('.portfolio-status');
            const isActive = statusBadge.classList.contains('active');
            
            // 切換狀態
            statusBadge.classList.toggle('active');
            statusBadge.classList.toggle('inactive');
            statusBadge.textContent = isActive ? '已下架' : '展示中';
            
            // TODO: 發送狀態更新API請求
            showSuccess(`作品已${isActive ? '下架' : '上架'}`);
        });
    });
}

// 顯示成功訊息
function showSuccess(message) {
    // TODO: 實作提示訊息元件
    console.log('Success:', message);
}

// 顯示錯誤訊息
function showError(message) {
    // TODO: 實作提示訊息元件
    console.error('Error:', message);
}

// 關閉Modal
function closeModal(modalId) {
    const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
    modal.hide();
}

// 重置表單
function resetForm(form) {
    form.reset();
    document.querySelector('.image-preview-container').innerHTML = '';
}