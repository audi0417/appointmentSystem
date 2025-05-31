/**
 * 預約管理完整功能實作
 */

class AppointmentManager {
    constructor() {
        this.appointments = [];
        this.filteredAppointments = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.selectedIds = new Set();
        this.modal = null;
        
        this.filters = {
            status: '',
            date: '',
            service: '',
            searchText: ''
        };

        this.statusLabels = {
            pending: '待確認',
            confirmed: '已確認', 
            completed: '已完成',
            cancelled: '已取消'
        };

        this.services = [
            { id: 1, name: '基礎保養', price: 800, duration: 60 },
            { id: 2, name: '凝膠美甲', price: 1200, duration: 90 },
            { id: 3, name: '美甲設計', price: 1500, duration: 120 },
            { id: 4, name: '手部護理', price: 600, duration: 45 }
        ];

        this.init();
    }

    init() {
        this.initModal();
        this.initEventListeners();
        this.initTimeSlots();
        this.initServiceOptions();
        this.loadSampleData();
        this.renderAppointments();
        this.bindActionButtons();
    }

    initModal() {
        const modalElement = document.getElementById('appointmentModal');
        if (modalElement) {
            this.modal = new bootstrap.Modal(modalElement);
            
            // Modal 關閉時重置表單
            modalElement.addEventListener('hidden.bs.modal', () => {
                this.resetForm();
            });
        }
    }

    initEventListeners() {
        // 篩選事件
        document.getElementById('statusFilter')?.addEventListener('change', 
            e => this.handleFilterChange('status', e.target.value));
        document.getElementById('dateFilter')?.addEventListener('change', 
            e => this.handleFilterChange('date', e.target.value));
        document.getElementById('serviceFilter')?.addEventListener('change', 
            e => this.handleFilterChange('service', e.target.value));
        document.getElementById('searchInput')?.addEventListener('input', 
            this.debounce(e => this.handleFilterChange('searchText', e.target.value), 300));

        // 表單提交
        const form = document.getElementById('appointmentForm');
        if (form) {
            form.addEventListener('submit', e => {
                e.preventDefault();
                this.saveAppointment();
            });
        }

        // 分頁大小變更
        document.getElementById('pageSizeSelect')?.addEventListener('change', e => {
            this.pageSize = parseInt(e.target.value);
            this.currentPage = 1;
            this.renderAppointments();
        });

        // 全選checkbox
        document.getElementById('selectAll')?.addEventListener('change', 
            e => this.handleSelectAll(e));

        // 預約日期變更時更新可用時間
        const dateInput = document.querySelector('input[name="appointmentDate"]');
        if (dateInput) {
            dateInput.addEventListener('change', () => this.updateAvailableTimeSlots());
            // 設置最小日期為今天
            dateInput.min = new Date().toISOString().split('T')[0];
        }

        // 電話號碼格式驗證
        const phoneInput = document.querySelector('input[name="phone"]');
        if (phoneInput) {
            phoneInput.addEventListener('input', this.validatePhone);
        }
    }

    initTimeSlots() {
        const timeSelect = document.querySelector('select[name="appointmentTime"]');
        if (!timeSelect) return;

        timeSelect.innerHTML = '<option value="">請選擇時間</option>';

        // 營業時間 10:00-18:00，每30分鐘一個時段
        for (let hour = 10; hour < 18; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const option = document.createElement('option');
                option.value = time;
                option.textContent = time;
                timeSelect.appendChild(option);
            }
        }
    }

    initServiceOptions() {
        const serviceSelects = document.querySelectorAll('select[name="serviceId"], #serviceFilter');
        
        serviceSelects.forEach(select => {
            if (select.id === 'serviceFilter') {
                select.innerHTML = '<option value="">所有服務</option>';
            } else {
                select.innerHTML = '<option value="">請選擇服務</option>';
            }
            
            this.services.forEach(service => {
                const option = document.createElement('option');
                option.value = service.id;
                option.textContent = `${service.name} - NT$ ${service.price} (${service.duration}分鐘)`;
                select.appendChild(option);
            });
        });
    }

    loadSampleData() {
        // 載入示例數據
        this.appointments = [
            {
                id: 1,
                customerName: '王小美',
                phone: '0912345678',
                serviceId: 1,
                serviceName: '基礎保養',
                appointmentDate: '2024-12-15',
                appointmentTime: '14:00',
                amount: 800,
                status: 'pending',
                notes: '第一次預約',
                createdAt: '2024-12-10T10:00:00'
            },
            {
                id: 2,
                customerName: '李小華',
                phone: '0923456789',
                serviceId: 2,
                serviceName: '凝膠美甲',
                appointmentDate: '2024-12-16',
                appointmentTime: '15:30',
                amount: 1200,
                status: 'confirmed',
                notes: '',
                createdAt: '2024-12-11T11:30:00'
            },
            {
                id: 3,
                customerName: '陳小雯',
                phone: '0934567890',
                serviceId: 3,
                serviceName: '美甲設計',
                appointmentDate: '2024-12-14',
                appointmentTime: '10:00',
                amount: 1500,
                status: 'completed',
                notes: '客製化花紋設計',
                createdAt: '2024-12-09T14:15:00'
            }
        ];
        
        this.filteredAppointments = [...this.appointments];
    }

    handleFilterChange(filterType, value) {
        this.filters[filterType] = value;
        this.currentPage = 1;
        this.filterAppointments();
    }

    filterAppointments() {
        let filtered = [...this.appointments];

        // 狀態篩選
        if (this.filters.status) {
            filtered = filtered.filter(apt => apt.status === this.filters.status);
        }

        // 日期篩選
        if (this.filters.date) {
            filtered = filtered.filter(apt => apt.appointmentDate === this.filters.date);
        }

        // 服務篩選
        if (this.filters.service) {
            filtered = filtered.filter(apt => apt.serviceId == this.filters.service);
        }

        // 搜尋篩選
        if (this.filters.searchText) {
            const searchText = this.filters.searchText.toLowerCase();
            filtered = filtered.filter(apt => 
                apt.customerName.toLowerCase().includes(searchText) ||
                apt.phone.includes(searchText)
            );
        }

        this.filteredAppointments = filtered;
        this.renderAppointments();
        this.updatePagination();
    }

    renderAppointments() {
        console.log('渲染預約列表 - 開始');
        const tbody = document.getElementById('appointmentsList');
        if (!tbody) {
            console.error('找不到 appointmentsList 元素');
            return;
        }

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageData = this.filteredAppointments.slice(startIndex, endIndex);

        console.log('渲染數據:', pageData.length, '筆');

        if (pageData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4">
                        <div class="text-muted">
                            <i class="fas fa-inbox fa-2x mb-2"></i>
                            <p>暫無預約資料</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        // 生成表格 HTML
        const tableHTML = pageData.map(appointment => {
            const statusClass = appointment.status || 'pending';
            const statusLabel = this.statusLabels[statusClass] || '未知';
            
            // 為待確認狀態的預約顯示確認按鈕
            const confirmButton = appointment.status === 'pending' ? `
                <button type="button" 
                        class="btn btn-sm btn-outline-success" 
                        title="確認"
                        data-action="confirm"
                        data-id="${appointment.id}"
                        style="min-width: 36px; height: 36px;">
                    <i class="fas fa-check"></i>
                </button>
            ` : '';
            
            return `
                <tr data-id="${appointment.id}">
                    <td>
                        <input type="checkbox" class="form-check-input appointment-checkbox" 
                               value="${appointment.id}" 
                               ${this.selectedIds.has(appointment.id.toString()) ? 'checked' : ''}>
                    </td>
                    <td>#${appointment.id.toString().padStart(4, '0')}</td>
                    <td>
                        <div class="customer-info">
                            <div class="customer-avatar">
                                <i class="fas fa-user-circle fa-2x text-muted"></i>
                            </div>
                            <div class="customer-details">
                                <div class="customer-name">${this.escapeHtml(appointment.customerName)}</div>
                                <div class="customer-phone">${appointment.phone}</div>
                            </div>
                        </div>
                    </td>
                    <td class="service-name">${this.escapeHtml(appointment.serviceName)}</td>
                    <td class="appointment-time">${this.formatDateTime(appointment.appointmentDate, appointment.appointmentTime)}</td>
                    <td class="appointment-amount">NT$ ${appointment.amount.toLocaleString()}</td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            ${statusLabel}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button type="button" 
                                    class="btn btn-sm btn-outline-info" 
                                    title="查看"
                                    data-action="view"
                                    data-id="${appointment.id}"
                                    style="min-width: 36px; height: 36px;">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button type="button" 
                                    class="btn btn-sm btn-outline-primary" 
                                    title="編輯"
                                    data-action="edit"
                                    data-id="${appointment.id}"
                                    style="min-width: 36px; height: 36px;">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${confirmButton}
                            <button type="button" 
                                    class="btn btn-sm btn-outline-danger" 
                                    title="刪除"
                                    data-action="delete"
                                    data-id="${appointment.id}"
                                    style="min-width: 36px; height: 36px;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = tableHTML;
        console.log('表格 HTML 已設定');

        // 重新綁定checkbox事件
        tbody.querySelectorAll('.appointment-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', e => this.handleCheckboxChange(e));
        });

        // 綁定操作按鈕事件
        this.bindActionButtons();
        
        console.log('渲染預約列表 - 完成');
    }

    updatePagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        const totalPages = Math.ceil(this.filteredAppointments.length / this.pageSize);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // 上一頁
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage - 1}">上一頁</a>
            </li>
        `;

        // 頁碼
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${this.currentPage === i ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        // 下一頁
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage + 1}">下一頁</a>
            </li>
        `;

        pagination.innerHTML = paginationHTML;
        
        // 綁定分頁事件
        setTimeout(() => this.bindPaginationEvents(), 0);
    }

    changePage(page) {
        const totalPages = Math.ceil(this.filteredAppointments.length / this.pageSize);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderAppointments();
        this.updatePagination();
    }

    handleSelectAll(event) {
        const checkboxes = document.querySelectorAll('.appointment-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = event.target.checked;
            const id = checkbox.value;
            if (event.target.checked) {
                this.selectedIds.add(id);
            } else {
                this.selectedIds.delete(id);
            }
        });
        this.updateBulkActions();
    }

    handleCheckboxChange(event) {
        const id = event.target.value;
        if (event.target.checked) {
            this.selectedIds.add(id);
        } else {
            this.selectedIds.delete(id);
        }
        this.updateBulkActions();
    }

    updateBulkActions() {
        const bulkActions = document.querySelector('.bulk-actions');
        if (bulkActions) {
            bulkActions.style.display = this.selectedIds.size > 0 ? 'block' : 'none';
        }
    }

    bindActionButtons() {
        const tbody = document.getElementById('appointmentsList');
        if (!tbody) {
            console.error('bindActionButtons: 找不到 tbody 元素');
            return;
        }

        // 使用事件委託處理按鈕點擊
        tbody.removeEventListener('click', this.handleActionButtonClick);
        tbody.addEventListener('click', this.handleActionButtonClick.bind(this));
        
        // 檢查按鈕是否存在
        const buttons = tbody.querySelectorAll('button[data-action]');
        console.log('bindActionButtons: 找到', buttons.length, '個操作按鈕');
        
        // 為每個按鈕添加調試信息
        buttons.forEach((btn, index) => {
            console.log(`按鈕 ${index + 1}: action=${btn.dataset.action}, id=${btn.dataset.id}`);
        });
    }

    bindPaginationEvents() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        pagination.removeEventListener('click', this.handlePaginationClick);
        pagination.addEventListener('click', this.handlePaginationClick.bind(this));
    }

    handlePaginationClick(event) {
        event.preventDefault();
        const link = event.target.closest('a[data-page]');
        if (!link) return;
        
        const page = parseInt(link.dataset.page);
        if (page && !isNaN(page)) {
            this.changePage(page);
        }
    }

    handleActionButtonClick(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;

        event.preventDefault();
        event.stopPropagation();

        const action = button.dataset.action;
        const id = parseInt(button.dataset.id);

        if (!id) return;

        switch (action) {
            case 'view':
                this.viewAppointment(id);
                break;
            case 'edit':
                this.editAppointment(id);
                break;
            case 'confirm':
                this.confirmAppointment(id);
                break;
            case 'delete':
                this.deleteAppointment(id);
                break;
            default:
                console.warn('未知的操作類型:', action);
        }
    }

    async saveAppointment() {
        const form = document.getElementById('appointmentForm');
        if (!form) return;

        // 驗證表單
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        const formData = new FormData(form);
        const appointmentData = {
            customerName: formData.get('customerName'),
            phone: formData.get('phone'),
            serviceId: parseInt(formData.get('serviceId')),
            appointmentDate: formData.get('appointmentDate'),
            appointmentTime: formData.get('appointmentTime'),
            notes: formData.get('notes')
        };

        // 電話格式驗證
        if (!this.isValidPhone(appointmentData.phone)) {
            this.showError('請輸入正確的手機號碼格式 (09xxxxxxxx)');
            return;
        }

        try {
            this.showLoading();

            // 模擬API調用
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 獲取服務資訊
            const service = this.services.find(s => s.id === appointmentData.serviceId);
            
            const editId = form.dataset.editId;
            
            if (editId) {
                // 編輯模式
                const existingAppointment = this.appointments.find(a => a.id == editId);
                if (existingAppointment) {
                    existingAppointment.customerName = appointmentData.customerName;
                    existingAppointment.phone = appointmentData.phone;
                    existingAppointment.serviceId = appointmentData.serviceId;
                    existingAppointment.serviceName = service.name;
                    existingAppointment.appointmentDate = appointmentData.appointmentDate;
                    existingAppointment.appointmentTime = appointmentData.appointmentTime;
                    existingAppointment.amount = service.price;
                    existingAppointment.notes = appointmentData.notes;
                }
                
                this.filterAppointments();
                this.modal.hide();
                this.showSuccess('預約更新成功！');
            } else {
                // 新增模式
                const newAppointment = {
                    id: Date.now(), // 簡單的ID生成
                    customerName: appointmentData.customerName,
                    phone: appointmentData.phone,
                    serviceId: appointmentData.serviceId,
                    serviceName: service.name,
                    appointmentDate: appointmentData.appointmentDate,
                    appointmentTime: appointmentData.appointmentTime,
                    amount: service.price,
                    status: 'pending',
                    notes: appointmentData.notes,
                    createdAt: new Date().toISOString()
                };

                this.appointments.unshift(newAppointment);
                this.filterAppointments();
                
                this.modal.hide();
                this.showSuccess('預約創建成功！');
            }

        } catch (error) {
            this.showError('操作失敗：' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    viewAppointment(id) {
        const appointment = this.appointments.find(a => a.id === id);
        if (!appointment) return;

        // 顯示預約詳情（簡單的alert，可以改為更精美的modal）
        const details = `
預約詳情：
編號：#${appointment.id.toString().padStart(4, '0')}
客戶：${appointment.customerName}
電話：${appointment.phone}
服務：${appointment.serviceName}
時間：${this.formatDateTime(appointment.appointmentDate, appointment.appointmentTime)}
金額：NT$ ${appointment.amount.toLocaleString()}
狀態：${this.statusLabels[appointment.status]}
備註：${appointment.notes || '無'}
        `;
        alert(details);
    }

    editAppointment(id) {
        const appointment = this.appointments.find(a => a.id === id);
        if (!appointment) return;

        // 填充表單數據
        const form = document.getElementById('appointmentForm');
        if (form) {
            form.customerName.value = appointment.customerName;
            form.phone.value = appointment.phone;
            form.serviceId.value = appointment.serviceId;
            form.appointmentDate.value = appointment.appointmentDate;
            form.appointmentTime.value = appointment.appointmentTime;
            form.notes.value = appointment.notes;
            
            // 設置編輯模式
            form.dataset.editId = appointment.id;
            
            // 更改標題
            document.querySelector('#appointmentModal .modal-title').textContent = '編輯預約';
            
            this.modal.show();
        }
    }

    confirmAppointment(id) {
        if (confirm('確定要確認此預約嗎？')) {
            const appointment = this.appointments.find(a => a.id === id);
            if (appointment) {
                appointment.status = 'confirmed';
                this.filterAppointments();
                this.showSuccess('預約已確認');
            }
        }
    }

    deleteAppointment(id) {
        if (confirm('確定要刪除此預約嗎？此操作無法復原。')) {
            this.appointments = this.appointments.filter(a => a.id !== id);
            this.filterAppointments();
            this.showSuccess('預約已刪除');
        }
    }

    updateAvailableTimeSlots() {
        // 這裡可以根據選擇的日期檢查已預約的時間段
        // 暫時保持所有時間段可用
    }

    resetForm() {
        const form = document.getElementById('appointmentForm');
        if (form) {
            form.reset();
            form.classList.remove('was-validated');
            form.removeAttribute('data-edit-id');
            
            // 重置標題
            document.querySelector('#appointmentModal .modal-title').textContent = '新增預約';
        }
    }

    // 工具方法
    validatePhone(event) {
        const phone = event.target.value;
        const isValid = /^09\d{8}$/.test(phone);
        event.target.setCustomValidity(isValid ? '' : '請輸入正確的手機號碼格式');
    }

    isValidPhone(phone) {
        return /^09\d{8}$/.test(phone);
    }

    formatDateTime(date, time) {
        const dateObj = new Date(date + 'T' + time);
        return dateObj.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'short'
        }) + ' ' + time;
    }

    escapeHtml(unsafe) {
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
        const btn = document.querySelector('#appointmentModal .btn-primary');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>儲存中...';
        }
    }

    hideLoading() {
        const btn = document.querySelector('#appointmentModal .btn-primary');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '儲存預約';
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

// 全域函數
function saveAppointment() {
    if (window.appointmentManager) {
        window.appointmentManager.saveAppointment();
    }
}

function bulkDelete() {
    if (window.appointmentManager && window.appointmentManager.selectedIds.size > 0) {
        if (confirm(`確定要刪除 ${window.appointmentManager.selectedIds.size} 個預約嗎？`)) {
            const idsToDelete = Array.from(window.appointmentManager.selectedIds).map(Number);
            window.appointmentManager.appointments = window.appointmentManager.appointments.filter(
                a => !idsToDelete.includes(a.id)
            );
            window.appointmentManager.selectedIds.clear();
            window.appointmentManager.filterAppointments();
            window.appointmentManager.showSuccess('已刪除選中的預約');
        }
    }
}

// 初始化函數
function initializeAppointments() {
    console.log('初始化預約管理頁面');
    
    // 延遲初始化以確保 DOM 完全載入
    setTimeout(() => {
        try {
            window.appointmentManager = new AppointmentManager();
            console.log('AppointmentManager 初始化成功');
        } catch (error) {
            console.error('AppointmentManager 初始化失敗:', error);
            // 重試一次
            setTimeout(() => {
                try {
                    window.appointmentManager = new AppointmentManager();
                    console.log('AppointmentManager 重試初始化成功');
                } catch (retryError) {
                    console.error('AppointmentManager 重試初始化失敗:', retryError);
                }
            }, 500);
        }
    }, 100);
}

// 清理函數
function cleanupAppointments() {
    if (window.appointmentManager) {
        window.appointmentManager = null;
    }
}

// 導出函數
window.initializeAppointments = initializeAppointments;
window.saveAppointment = saveAppointment;
window.bulkDelete = bulkDelete;
