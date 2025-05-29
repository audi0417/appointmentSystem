function initializeMembers() {
    class MemberManager {
        constructor() {
            this.members = [];
            this.filteredMembers = [];
            this.currentPage = 1;
            this.itemsPerPage = 10;
            this.initializeEventListeners();
            this.loadMembers();
        }
    
        initializeEventListeners() {
            // 新增會員按鈕
            const addBtn = document.getElementById('addMemberBtn');
            if (addBtn) {
                addBtn.addEventListener('click', () => this.showModal());
            }
    
            // 搜尋功能
            const searchInput = document.getElementById('memberSearch');
            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    this.applyFilters();
                });
            }
            
            // 篩選功能
            const statusFilter = document.getElementById('statusFilter');
            if (statusFilter) {
                statusFilter.addEventListener('change', () => this.applyFilters());
            }
            
            const levelFilter = document.getElementById('levelFilter');
            if (levelFilter) {
                levelFilter.addEventListener('change', () => this.applyFilters());
            }
    
            // Modal 相關事件
            const modal = document.getElementById('memberModal');
            if (modal) {
                modal.addEventListener('hidden.bs.modal', () => {
                    this.resetForm();
                });
            }
            
            // 取消按鈕
            const cancelBtn = document.getElementById('cancelBtn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.hideModal());
            }
            
            // 表單提交
            const form = document.getElementById('memberForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleFormSubmit();
                });
            }
        }
    
        async loadMembers() {
            try {
                // 只在初始化時載入模擬資料
                if (this.members.length === 0) {
                    this.members = [
                        {
                            id: 1,
                            name: '王小明',
                            phone: '0912345678',
                            email: 'wang@example.com',
                            joinDate: '2024-01-15',
                            birthday: '1990-05-15',
                            status: 'active',
                            level: 'vip',
                            totalSpending: 15000,
                            points: 500,
                            notes: 'VIP會員，偏好自然風格'
                        },
                        {
                            id: 2,
                            name: '李小華',
                            phone: '0923456789',
                            email: 'lee@example.com',
                            joinDate: '2024-02-20',
                            birthday: '1985-08-22',
                            status: 'active',
                            level: 'normal',
                            totalSpending: 8000,
                            points: 200,
                            notes: '定期客戶'
                        },
                        {
                            id: 3,
                            name: '張美玲',
                            phone: '0934567890',
                            email: 'chang@example.com',
                            joinDate: '2024-03-10',
                            birthday: '1992-12-03',
                            status: 'inactive',
                            level: 'normal',
                            totalSpending: 5000,
                            points: 100,
                            notes: '暫停使用'
                        }
                    ];
                }
                this.applyFilters();
            } catch (error) {
                console.error('載入會員資料失敗:', error);
                this.showError('載入會員資料失敗');
            }
        }
    
        applyFilters() {
            const statusFilter = document.getElementById('statusFilter')?.value;
            const levelFilter = document.getElementById('levelFilter')?.value;
            const searchText = document.getElementById('memberSearch')?.value || '';
            
            let filtered = [...this.members];
            
            // 狀態篩選
            if (statusFilter) {
                filtered = filtered.filter(member => member.status === statusFilter);
            }
            
            // 等級篩選
            if (levelFilter) {
                filtered = filtered.filter(member => member.level === levelFilter);
            }
            
            // 搜尋篩選
            if (searchText) {
                const searchLower = searchText.toLowerCase();
                filtered = filtered.filter(member => 
                    member.name.toLowerCase().includes(searchLower) ||
                    member.phone.includes(searchText) ||
                    (member.email && member.email.toLowerCase().includes(searchLower))
                );
            }
            
            this.filteredMembers = filtered;
            
            // 確保當前頁面在有效範圍內
            const totalPages = Math.ceil(this.filteredMembers.length / this.itemsPerPage);
            if (this.currentPage > totalPages && totalPages > 0) {
                this.currentPage = totalPages;
            } else if (this.currentPage < 1) {
                this.currentPage = 1;
            }
            
            this.renderMembers();
        }
    
        renderMembers() {
            const tbody = document.getElementById('membersTableBody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
    
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const endIndex = startIndex + this.itemsPerPage;
            const paginatedMembers = this.filteredMembers.slice(startIndex, endIndex);
    
            paginatedMembers.forEach(member => {
                const tr = document.createElement('tr');
                tr.setAttribute('data-member-id', member.id); // 為高亮效果添加屬性
                tr.innerHTML = `
                    <td>
                        <input type="checkbox" class="form-check-input member-checkbox">
                    </td>
                    <td>${member.id}</td>
                    <td>
                        <div class="member-info">
                            <div class="member-avatar">
                                <div style="width:40px;height:40px;background:#f0f0f0;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#666;">
                                    ${member.name.charAt(0)}
                                </div>
                            </div>
                            <div class="member-details">
                                <div class="member-name">${this.escapeHtml(member.name)}</div>
                                <div class="member-id">#${member.id}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="contact-info">
                            <div>${member.phone}</div>
                            <div>${member.email || '-'}</div>
                        </div>
                    </td>
                    <td>
                        <span class="member-level ${member.level}">
                            ${member.level === 'vip' ? 'VIP會員' : '一般會員'}
                        </span>
                    </td>
                    <td>
                        <div class="consumption-stats">
                            <div class="stats-item">
                                <span class="stats-label">累計消費</span>
                                <span class="stats-value">NT$ ${member.totalSpending.toLocaleString()}</span>
                            </div>
                            <div class="stats-item">
                                <span class="stats-label">點數</span>
                                <span class="stats-value">${member.points}</span>
                            </div>
                        </div>
                    </td>
                    <td>${new Date(member.joinDate).toLocaleDateString('zh-TW')}</td>
                    <td>
                        <span class="status-badge ${member.status}">
                            ${member.status === 'active' ? '正常' : '停用'}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button onclick="window.memberManager?.editMember(${member.id})" class="action-btn btn-edit" title="編輯">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="window.memberManager?.deleteMember(${member.id})" class="action-btn btn-delete" title="刪除">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
    
            this.renderPagination();
        }
    
        renderPagination() {
            const totalPages = Math.ceil(this.filteredMembers.length / this.itemsPerPage);
            const pagination = document.getElementById('membersPagination');
            if (!pagination) return;
            
            pagination.innerHTML = '';
    
            for (let i = 1; i <= totalPages; i++) {
                const button = document.createElement('button');
                button.textContent = i;
                button.classList.add('page-btn');
                if (i === this.currentPage) button.classList.add('active');
                button.addEventListener('click', () => {
                    this.currentPage = i;
                    this.renderMembers();
                });
                pagination.appendChild(button);
            }
        }
    
        async handleFormSubmit() {
            const form = document.getElementById('memberForm');
            if (!form) return;
            
            // 驗證表單
            if (!this.validateForm(form)) {
                return;
            }
            
            // 收集表單資料
            const formData = new FormData(form);
            const memberData = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                birthday: formData.get('birthday'),
                level: formData.get('level'),
                status: formData.get('status'),
                notes: formData.get('notes')
            };
    
            try {
                this.showLoading();
                const memberId = form.dataset.memberId;
                
                if (memberId) {
                    await this.updateMember(memberId, memberData);
                    this.showSuccess('會員資料更新成功');
                    // 高亮顯示更新的會員
                    this.highlightUpdatedMember(memberId);
                } else {
                    const newMember = await this.createMember(memberData);
                    this.showSuccess('新增會員成功');
                    // 高亮顯示新增的會員
                    this.highlightUpdatedMember(newMember.id);
                }
                
                this.hideModal();
                // 直接重新應用篩選並渲染，不重新載入模擬資料
                this.applyFilters();
            } catch (error) {
                console.error('儲存會員資料失敗:', error);
                this.showError('儲存會員資料失敗: ' + error.message);
            } finally {
                this.hideLoading();
            }
        }
    
        async createMember(memberData) {
            // 模擬新增API調用延遲
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const newMember = {
                id: this.members.length > 0 ? Math.max(...this.members.map(m => m.id)) + 1 : 1,
                ...memberData,
                joinDate: new Date().toISOString().split('T')[0],
                totalSpending: 0,
                points: 0
            };
            this.members.push(newMember);
            console.log('新會員已新增:', newMember);
            return newMember;
        }
    
        async updateMember(memberId, memberData) {
            // 模擬更新API調用延遲
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const index = this.members.findIndex(m => m.id == memberId);
            if (index !== -1) {
                // 保留原有的統計資料，只更新可編輯的欄位
                this.members[index] = { 
                    ...this.members[index], 
                    ...memberData,
                    // 確保不會意外覆蓋重要的統計資料
                    id: this.members[index].id,
                    joinDate: this.members[index].joinDate,
                    totalSpending: this.members[index].totalSpending,
                    points: this.members[index].points
                };
                console.log('會員資料已更新:', this.members[index]);
            }
            return this.members[index];
        }
    
        async deleteMember(memberId) {
            if (!confirm('確定要刪除此會員嗎？')) return;
    
            try {
                this.showLoading();
                // 模擬刪除API調用延遲
                await new Promise(resolve => setTimeout(resolve, 500));
                
                this.members = this.members.filter(m => m.id != memberId);
                // 刪除後直接重新應用篩選並渲染
                this.applyFilters();
                this.showSuccess('會員已成功刪除');
            } catch (error) {
                console.error('刪除會員失敗:', error);
                this.showError('刪除會員失敗');
            } finally {
                this.hideLoading();
            }
        }

        editMember(memberId) {
            const member = this.members.find(m => m.id == memberId);
            if (member) {
                this.showModal(member);
            }
        }
        
        // 在成功更新後高亮顯示更新的會員行
        highlightUpdatedMember(memberId) {
            setTimeout(() => {
                const memberRow = document.querySelector(`tr[data-member-id="${memberId}"]`);
                if (memberRow) {
                    memberRow.classList.add('updated-highlight');
                    setTimeout(() => {
                        memberRow.classList.remove('updated-highlight');
                    }, 2000);
                }
            }, 100);
        }
        
        // 除錯工具方法
        debugCurrentState() {
            console.log('=== 會員管理狀態 ===');
            console.log('總會員數:', this.members.length);
            console.log('篩選後會員數:', this.filteredMembers.length);
            console.log('當前頁面:', this.currentPage);
            console.log('每頁顯示:', this.itemsPerPage);
            console.log('會員清單:', this.members);
            console.log('篩選後清單:', this.filteredMembers);
            console.log('========================');
        }
    
        showModal(member = null) {
            const modal = document.getElementById('memberModal');
            const form = document.getElementById('memberForm');
            const modalTitle = document.getElementById('modalTitle');
    
            if (!modal || !form) {
                console.error('Modal elements not found');
                return;
            }

            // 清除之前的表單狀態
            this.resetForm();

            if (member) {
                if (modalTitle) modalTitle.textContent = '編輯會員';
                form.dataset.memberId = member.id;
                
                // 填充表單資料
                const fields = {
                    'name': member.name,
                    'phone': member.phone,
                    'email': member.email || '',
                    'birthday': member.birthday || '',
                    'level': member.level || 'normal',
                    'status': member.status || 'active',
                    'notes': member.notes || ''
                };
                
                Object.keys(fields).forEach(key => {
                    const input = form.querySelector(`[name="${key}"]`);
                    if (input) {
                        input.value = fields[key];
                    }
                });
            } else {
                if (modalTitle) modalTitle.textContent = '新增會員';
                form.dataset.memberId = '';
            }
    
            // 使用 Bootstrap Modal API
            try {
                if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    const bsModal = new bootstrap.Modal(modal);
                    bsModal.show();
                } else {
                    // 備用方案 - 使用原生方式顯示
                    modal.classList.add('show');
                    modal.style.display = 'block';
                    modal.setAttribute('aria-hidden', 'false');
                    document.body.classList.add('modal-open');
                    
                    // 添加背景遮罩
                    if (!document.querySelector('.modal-backdrop')) {
                        const backdrop = document.createElement('div');
                        backdrop.className = 'modal-backdrop fade show';
                        document.body.appendChild(backdrop);
                        
                        // 點擊背景關閉模態框
                        backdrop.addEventListener('click', () => this.hideModal());
                    }
                }
            } catch (error) {
                console.error('Error showing modal:', error);
                // 最基本的顯示方式
                modal.style.display = 'block';
            }
        }
    
        hideModal() {
            const modal = document.getElementById('memberModal');
            if (!modal) return;
            
            try {
                if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    const bsModal = bootstrap.Modal.getInstance(modal);
                    if (bsModal) {
                        bsModal.hide();
                    } else {
                        // 如果實例不存在，創建新的實例並隱藏
                        const newModal = new bootstrap.Modal(modal);
                        newModal.hide();
                    }
                } else {
                    // 備用方案 - 使用原生方式隱藏
                    modal.classList.remove('show');
                    modal.style.display = 'none';
                    modal.setAttribute('aria-hidden', 'true');
                    document.body.classList.remove('modal-open');
                    
                    // 移除背景遮罩
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) {
                        backdrop.remove();
                    }
                }
            } catch (error) {
                console.error('Error hiding modal:', error);
                // 最基本的隱藏方式
                modal.style.display = 'none';
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) backdrop.remove();
                document.body.classList.remove('modal-open');
            }
        }

        resetForm() {
            const form = document.getElementById('memberForm');
            if (!form) return;
            
            form.reset();
            form.classList.remove('was-validated');
            form.dataset.memberId = '';
            
            // 清除驗證錯誤
            form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
            form.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
            
            // 設置預設值
            const levelSelect = form.querySelector('[name="level"]');
            const statusSelect = form.querySelector('[name="status"]');
            if (levelSelect) levelSelect.value = 'normal';
            if (statusSelect) statusSelect.value = 'active';
        }
    
        validateForm(form) {
            let isValid = true;
            
            // 清除之前的驗證狀態
            form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
            form.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
            
            // 驗證姓名
            const nameInput = form.querySelector('[name="name"]');
            if (!nameInput.value.trim()) {
                this.setFieldError(nameInput, '請輸入姓名');
                isValid = false;
            }
            
            // 驗證電話
            const phoneInput = form.querySelector('[name="phone"]');
            if (!phoneInput.value.trim()) {
                this.setFieldError(phoneInput, '請輸入電話號碼');
                isValid = false;
            } else if (!/^09\d{8}$/.test(phoneInput.value)) {
                this.setFieldError(phoneInput, '請輸入正確的手機號碼格式 (09xxxxxxxx)');
                isValid = false;
            }
            
            // 驗證 Email (如果有輸入的話)
            const emailInput = form.querySelector('[name="email"]');
            if (emailInput.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
                this.setFieldError(emailInput, '請輸入正確的Email格式');
                isValid = false;
            }
            
            return isValid;
        }
        
        setFieldError(field, message) {
            field.classList.add('is-invalid');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback';
            errorDiv.textContent = message;
            field.parentNode.appendChild(errorDiv);
        }
        
        showLoading() {
            // 移除現有的載入中提示
            const existingLoading = document.querySelector('.loading-overlay');
            if (existingLoading) existingLoading.remove();
            
            const loadingHtml = `
                <div class="loading-overlay" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(255,255,255,0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                ">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">載入中...</span>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', loadingHtml);
        }
        
        hideLoading() {
            const loading = document.querySelector('.loading-overlay');
            if (loading) loading.remove();
        }
        
        showSuccess(message) {
            this.showNotification(message, 'success');
        }
        
        showError(message) {
            this.showNotification(message, 'error');
        }
        
        showNotification(message, type = 'info') {
            // 移除現有的通知
            const existingAlert = document.querySelector('.notification-alert');
            if (existingAlert) existingAlert.remove();
            
            const alertClass = type === 'success' ? 'alert-success' : 
                              type === 'error' ? 'alert-danger' : 'alert-info';
            
            const alertHtml = `
                <div class="alert ${alertClass} alert-dismissible fade show notification-alert" role="alert" style="
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    min-width: 300px;
                ">
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', alertHtml);
            
            // 3秒後自動移除
            setTimeout(() => {
                const alert = document.querySelector('.notification-alert');
                if (alert) alert.remove();
            }, 3000);
        }
    
        escapeHtml(unsafe) {
            if (!unsafe) return '';
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
    }
    
    const manager = new MemberManager();
    
    // 將manager設為全局變數供HTML調用
    window.memberManager = manager;
    
    return function cleanup() {
        // 移除事件監聽
        const addBtn = document.getElementById('addMemberBtn');
        const searchInput = document.getElementById('memberSearch');
        const statusFilter = document.getElementById('statusFilter');
        const levelFilter = document.getElementById('levelFilter');
        const cancelBtn = document.getElementById('cancelBtn');
        const form = document.getElementById('memberForm');
        const modal = document.getElementById('memberModal');
        
        if (addBtn) addBtn.removeEventListener('click', () => {});
        if (searchInput) searchInput.removeEventListener('input', () => {});
        if (statusFilter) statusFilter.removeEventListener('change', () => {});
        if (levelFilter) levelFilter.removeEventListener('change', () => {});
        if (cancelBtn) cancelBtn.removeEventListener('click', () => {});
        if (form) form.removeEventListener('submit', () => {});
        if (modal) modal.removeEventListener('hidden.bs.modal', () => {});
        
        // 清理全局變數
        if (window.memberManager) {
            delete window.memberManager;
        }
    };
}

// 將初始化函數設為全局
window.initializeMembers = initializeMembers;
