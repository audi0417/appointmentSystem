/**
 * 預約管理系統
 * @module appointments
 */
function initializeAppointments() {
    // 載入服務項目
    loadServices();
    
    // 生成時間選項
    generateTimeOptions();
        
    // 監聽日期變更
    document.querySelector('input[name="appointmentDate"]').addEventListener('change', checkAvailability);
        
    // 表單驗證
    initFormValidation();
    // 防止重複初始化
    if (window.appointmentsInitialized) return;

    // ===== 常數定義 =====
    const APPOINTMENT_STATUS = {
        PENDING: 'pending',
        CONFIRMED: 'confirmed',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled'
    };

    const STATUS_LABELS = {
        [APPOINTMENT_STATUS.PENDING]: '待確認',
        [APPOINTMENT_STATUS.CONFIRMED]: '已確認',
        [APPOINTMENT_STATUS.COMPLETED]: '已完成',
        [APPOINTMENT_STATUS.CANCELLED]: '已取消'
    };

    const API_ENDPOINTS = {
        LIST: '/api/appointments',
        CREATE: '/api/appointments',
        UPDATE: (id) => `/api/appointments/${id}`,
        DELETE: (id) => `/api/appointments/${id}`,
        STATUS: (id) => `/api/appointments/${id}/status`
    };

    // ===== 狀態管理 =====
    const state = {
        appointments: [],
        filteredAppointments: [],
        currentPage: 1,
        pageSize: 10,
        filters: {
            status: '',
            date: '',
            service: '',
            searchText: ''
        },
        loading: false,
        selectedIds: new Set()
    };

    // ===== 工具函數 =====
    function formatDateTime(dateTime) {
        return new Date(dateTime).toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: 'TWD'
        }).format(amount);
    }

    function showLoading() {
        state.loading = true;
        const loadingEl = document.createElement('div');
        loadingEl.className = 'loading-overlay';
        loadingEl.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        document.body.appendChild(loadingEl);
    }

    function hideLoading() {
        state.loading = false;
        const loadingEl = document.querySelector('.loading-overlay');
        if (loadingEl) {
            loadingEl.remove();
        }
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        const container = document.getElementById('toast-container') || (() => {
            const div = document.createElement('div');
            div.id = 'toast-container';
            div.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(div);
            return div;
        })();

        container.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    function debounce(func, wait) {
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

    // ===== API 請求處理 =====
    async function fetchAPI(endpoint, options = {}) {
        try {
            const response = await fetch(endpoint, {
                headers: {
                    'Content-Type': 'application/json',
                    // 可以在這裡添加認證標頭
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`API請求失敗: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API錯誤:', error);
            throw error;
        }
    }

    // ===== 預約數據處理 =====
    async function loadAppointments() {
        try {
            showLoading();
            const data = await fetchAPI(API_ENDPOINTS.LIST);
            state.appointments = data;
            applyFilters();
        } catch (error) {
            showToast('載入預約資料失敗', 'danger');
        } finally {
            hideLoading();
        }
    }

    async function createAppointment(appointmentData) {
        try {
            showLoading();
            await fetchAPI(API_ENDPOINTS.CREATE, {
                method: 'POST',
                body: JSON.stringify(appointmentData)
            });
            showToast('預約建立成功');
            await loadAppointments();
        } catch (error) {
            showToast('建立預約失敗', 'danger');
        } finally {
            hideLoading();
        }
    }

    async function updateAppointment(id, appointmentData) {
        try {
            showLoading();
            await fetchAPI(API_ENDPOINTS.UPDATE(id), {
                method: 'PUT',
                body: JSON.stringify(appointmentData)
            });
            showToast('預約更新成功');
            await loadAppointments();
        } catch (error) {
            showToast('更新預約失敗', 'danger');
        } finally {
            hideLoading();
        }
    }

    async function updateAppointmentStatus(id, status) {
        try {
            showLoading();
            await fetchAPI(API_ENDPOINTS.STATUS(id), {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });
            showToast('狀態更新成功');
            await loadAppointments();
        } catch (error) {
            showToast('更新狀態失敗', 'danger');
        } finally {
            hideLoading();
        }
    }

    async function deleteAppointment(id) {
        try {
            showLoading();
            await fetchAPI(API_ENDPOINTS.DELETE(id), {
                method: 'DELETE'
            });
            showToast('預約刪除成功');
            await loadAppointments();
        } catch (error) {
            showToast('刪除預約失敗', 'danger');
        } finally {
            hideLoading();
        }
    }

    // ===== 篩選功能 =====
    function applyFilters() {
        let filtered = [...state.appointments];

        if (state.filters.status) {
            filtered = filtered.filter(app => app.status === state.filters.status);
        }

        if (state.filters.date) {
            filtered = filtered.filter(app => 
                app.appointmentDate.startsWith(state.filters.date)
            );
        }

        if (state.filters.service) {
            filtered = filtered.filter(app => 
                app.serviceType === state.filters.service
            );
        }

        if (state.filters.searchText) {
            const searchText = state.filters.searchText.toLowerCase();
            filtered = filtered.filter(app => 
                app.customerName.toLowerCase().includes(searchText) ||
                app.phone.includes(searchText)
            );
        }

        state.filteredAppointments = filtered;
        renderAppointments();
        updatePagination();
    }

    // ===== 事件處理 =====
    function handleFilterChange(event) {
        const { id, value } = event.target;
        switch(id) {
            case 'statusFilter':
                state.filters.status = value;
                break;
            case 'dateFilter':
                state.filters.date = value;
                break;
            case 'serviceFilter':
                state.filters.service = value;
                break;
            case 'searchInput':
                state.filters.searchText = value;
                break;
        }
        state.currentPage = 1;
        applyFilters();
    }

    function handleCheckboxChange(event) {
        const row = event.target.closest('tr');
        const id = row.dataset.id;
        
        if (event.target.checked) {
            state.selectedIds.add(id);
        } else {
            state.selectedIds.delete(id);
        }
        
        updateBulkActionButtons();
    }

    function handleSelectAll(event) {
        const checkboxes = document.querySelectorAll('.appointment-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = event.target.checked;
            const row = checkbox.closest('tr');
            const id = row.dataset.id;
            if (event.target.checked) {
                state.selectedIds.add(id);
            } else {
                state.selectedIds.delete(id);
            }
        });
        
        updateBulkActionButtons();
    }

    function updateBulkActionButtons() {
        const bulkActions = document.querySelector('.bulk-actions');
        if (bulkActions) {
            bulkActions.style.display = state.selectedIds.size > 0 ? 'block' : 'none';
        }
    }
    // ===== UI渲染 =====
    function renderAppointments() {
        const startIndex = (state.currentPage - 1) * state.pageSize;
        const endIndex = startIndex + state.pageSize;
        const pageData = state.filteredAppointments.slice(startIndex, endIndex);

        const tbody = document.getElementById('appointmentsList');
        if (!tbody) return;

        tbody.innerHTML = pageData.map(appointment => `
            <tr data-id="${appointment.id}">
                <td>
                    <input type="checkbox" class="appointment-checkbox" 
                           ${state.selectedIds.has(appointment.id) ? 'checked' : ''}>
                </td>
                <td>#${appointment.id}</td>
                <td>
                    <div class="customer-info">
                        <img src="${appointment.customerAvatar || 'default-avatar.png'}" alt="Avatar">
                        <div class="details">
                            <div class="name">${appointment.customerName}</div>
                            <div class="phone">${appointment.phone}</div>
                        </div>
                    </div>
                </td>
                <td>${appointment.serviceType}</td>
                <td>${formatDateTime(appointment.appointmentDate)}</td>
                <td>${formatCurrency(appointment.amount)}</td>
                <td>
                    <span class="status-badge ${appointment.status}">
                        ${STATUS_LABELS[appointment.status]}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn" onclick="viewAppointment('${appointment.id}')" title="查看詳情">
                            <i class='bx bx-detail'></i>
                        </button>
                        <button class="action-btn" onclick="editAppointment('${appointment.id}')" title="編輯">
                            <i class='bx bx-edit'></i>
                        </button>
                        <button class="action-btn" onclick="deleteAppointment('${appointment.id}')" title="刪除">
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // 重新綁定checkbox事件
        tbody.querySelectorAll('.appointment-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', handleCheckboxChange);
        });
    }

    function updatePagination() {
        const totalPages = Math.ceil(state.filteredAppointments.length / state.pageSize);
        const pagination = document.querySelector('.pagination');
        if (!pagination) return;

        let html = `
            <li class="page-item ${state.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${state.currentPage - 1})">上一頁</a>
            </li>
        `;

        for (let i = 1; i <= totalPages; i++) {
            html += `
                <li class="page-item ${state.currentPage === i ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `;
        }

        html += `
            <li class="page-item ${state.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${state.currentPage + 1})">下一頁</a>
            </li>
        `;

        pagination.innerHTML = html;
    }

    // ===== 表單處理與驗證 =====
    function validateForm(data) {
        const errors = [];

        // 驗證客戶資訊
        if (!data.customerName?.trim()) {
            errors.push('請輸入客戶姓名');
        }
        if (!data.phone?.trim()) {
            errors.push('請輸入聯絡電話');
        } else if (!/^09\d{8}$/.test(data.phone)) {
            errors.push('請輸入正確的手機號碼格式');
        }

        // 驗證服務項目
        if (!data.serviceType) {
            errors.push('請選擇服務項目');
        }

        // 驗證預約時間
        if (!data.appointmentDate) {
            errors.push('請選擇預約日期');
        }
        if (!data.appointmentTime) {
            errors.push('請選擇預約時間');
        }

        // 顯示錯誤訊息
        if (errors.length > 0) {
            showToast(errors.join('<br>'), 'danger');
            return false;
        }

        return true;
    }

    async function handleFormSubmit() {
        const form = document.getElementById('appointmentForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // 驗證表單
        if (!validateForm(data)) {
            return;
        }

        try {
            showLoading();

            // 處理額外服務
            data.extraServices = formData.getAll('extraService');

            // 處理時間格式
            data.appointmentDateTime = `${data.appointmentDate}T${data.appointmentTime}`;

            // 根據是否有ID決定是新增還是更新
            if (data.id) {
                await updateAppointment(data.id, data);
            } else {
                await createAppointment(data);
            }

            // 關閉模態框
            const modal = bootstrap.Modal.getInstance(document.getElementById('addAppointmentModal'));
            modal.hide();

            // 重置表單
            resetForm();

            // 重新載入預約列表
            await loadAppointments();

            // 顯示成功訊息
            showToast(data.id ? '預約更新成功' : '預約建立成功', 'success');

        } catch (error) {
            console.error('表單提交錯誤:', error);
            showToast(data.id ? '更新預約失敗' : '建立預約失敗', 'danger');
        } finally {
            hideLoading();
        }
    }
    // ===== 表單輔助函數 =====
    function handleSaveAppointment() {
        const form = document.getElementById('appointmentForm');
        if (form) {
            form.dispatchEvent(new Event('submit'));
        }
    }

    function resetForm() {
        const form = document.getElementById('appointmentForm');
        if (form) {
            form.reset();

            // 清除隱藏的ID欄位
            const idInput = form.querySelector('input[name="id"]');
            if (idInput) {
                idInput.value = '';
            }

            // 重置所有驗證狀態
            form.querySelectorAll('.is-invalid').forEach(element => {
                element.classList.remove('is-invalid');
            });

            // 清除所有錯誤訊息
            form.querySelectorAll('.invalid-feedback').forEach(element => {
                element.remove();
            });
        }
    }

    function showFormError(element, message) {
        // 添加錯誤類別
        element.classList.add('is-invalid');

        // 創建錯誤訊息元素
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;

        // 插入錯誤訊息
        element.parentNode.appendChild(errorDiv);
    }

    function clearFormErrors() {
        const form = document.getElementById('appointmentForm');
        if (form) {
            form.querySelectorAll('.is-invalid').forEach(element => {
                element.classList.remove('is-invalid');
            });
            form.querySelectorAll('.invalid-feedback').forEach(element => {
                element.remove();
            });
        }
    }

    // ===== 表單驗證初始化 =====
    function initializeFormValidation() {
        const form = document.getElementById('appointmentForm');
        if (!form) return;

        // 電話號碼驗證
        const phoneInput = form.querySelector('input[name="phone"]');
        if (phoneInput) {
            phoneInput.addEventListener('input', function() {
                const isValid = /^09\d{8}$/.test(this.value);
                if (!isValid && this.value) {
                    showFormError(this, '請輸入正確的手機號碼格式');
                } else {
                    this.classList.remove('is-invalid');
                    const feedback = this.parentNode.querySelector('.invalid-feedback');
                    if (feedback) {
                        feedback.remove();
                    }
                }
            });
        }

        // 日期時間驗證
        const dateInput = form.querySelector('input[name="appointmentDate"]');
        if (dateInput) {
            dateInput.addEventListener('change', function() {
                const selectedDate = new Date(this.value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (selectedDate < today) {
                    showFormError(this, '不能選擇過去的日期');
                } else {
                    this.classList.remove('is-invalid');
                    const feedback = this.parentNode.querySelector('.invalid-feedback');
                    if (feedback) {
                        feedback.remove();
                    }
                }
            });

            // 設定最小日期為今天
            dateInput.min = new Date().toISOString().split('T')[0];
        }

        // 時間選擇驗證
        const timeSelect = form.querySelector('select[name="appointmentTime"]');
        if (timeSelect) {
            // 動態生成時間選項
            generateTimeOptions(timeSelect);

            timeSelect.addEventListener('change', function() {
                if (!this.value) {
                    showFormError(this, '請選擇預約時間');
                } else {
                    this.classList.remove('is-invalid');
                    const feedback = this.parentNode.querySelector('.invalid-feedback');
                    if (feedback) {
                        feedback.remove();
                    }
                }
            });
        }
    }

    // ===== 時間選項生成 =====
    function generateTimeOptions(selectElement) {
        // 清空現有選項
        selectElement.innerHTML = '<option value="">請選擇時間</option>';

        // 營業時間設定（這裡假設是 10:00-18:00）
        const startHour = 10;
        const endHour = 18;
        const interval = 30; // 每30分鐘一個時段

        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += interval) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const option = document.createElement('option');
                option.value = time;
                option.textContent = time;
                selectElement.appendChild(option);
            }
        }
    }

    // ===== 匯出功能 =====
    function exportAppointments(format = 'csv') {
        const data = state.filteredAppointments;
        
        if (data.length === 0) {
            showToast('沒有可匯出的資料', 'warning');
            return;
        }

        try {
            switch (format) {
                case 'csv':
                    exportToCSV(data);
                    break;
                case 'excel':
                    exportToExcel(data);
                    break;
                default:
                    throw new Error('不支援的匯出格式');
            }
        } catch (error) {
            showToast('匯出失敗', 'danger');
            console.error('Export error:', error);
        }
    }

    function exportToCSV(data) {
        const headers = ['預約編號', '客戶姓名', '電話', '服務項目', '預約時間', '金額', '狀態'];
        const csvContent = [
            headers.join(','),
            ...data.map(item => [
                item.id,
                item.customerName,
                item.phone,
                item.serviceType,
                formatDateTime(item.appointmentDate),
                item.amount,
                STATUS_LABELS[item.status]
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `appointments_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }

    // ===== 初始化事件監聽 =====
    function initializeEventListeners() {
        // 篩選器事件
        document.getElementById('statusFilter')?.addEventListener('change', handleFilterChange);
        document.getElementById('dateFilter')?.addEventListener('change', handleFilterChange);
        document.getElementById('serviceFilter')?.addEventListener('change', handleFilterChange);
        document.getElementById('searchInput')?.addEventListener('input', debounce(handleFilterChange, 300));
        document.getElementById('pageSize')?.addEventListener('change', (e) => {
            state.pageSize = parseInt(e.target.value);
            state.currentPage = 1;
            renderAppointments();
            updatePagination();
        });

        // 全選checkbox
        document.getElementById('selectAll')?.addEventListener('change', handleSelectAll);

        // 批量操作按鈕
        document.getElementById('bulkDelete')?.addEventListener('click', () => {
            if (confirm('確定要刪除選中的預約嗎？')) {
                const deletePromises = Array.from(state.selectedIds).map(id => deleteAppointment(id));
                Promise.all(deletePromises)
                    .then(() => {
                        state.selectedIds.clear();
                        loadAppointments();
                    })
                    .catch(error => {
                        console.error('批量刪除失敗:', error);
                        showToast('批量刪除失敗', 'danger');
                    });
            }
        });

        // 表單提交
        const form = document.getElementById('appointmentForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                handleFormSubmit();
            });
        }
    }

    // ===== 全域函數導出 =====
    window.viewAppointment = function(id) {
        const appointment = state.appointments.find(a => a.id === id);
        if (appointment) {
            showAppointmentDetails(appointment);
        }
    };

    window.editAppointment = function(id) {
        const appointment = state.appointments.find(a => a.id === id);
        if (appointment) {
            showAppointmentModal(appointment);
        }
    };

    window.deleteAppointment = function(id) {
        if (confirm('確定要刪除此預約嗎？')) {
            deleteAppointment(id);
        }
    };

    window.changePage = function(page) {
        const totalPages = Math.ceil(state.filteredAppointments.length / state.pageSize);
        if (page < 1 || page > totalPages) return;
        
        state.currentPage = page;
        renderAppointments();
        updatePagination();
    };

    // ===== 詳細資訊顯示 =====
    function showAppointmentDetails(appointment) {
        const modal = document.getElementById('appointmentDetailsModal');
        const modalBody = modal.querySelector('.modal-body');

        modalBody.innerHTML = `
            <div class="appointment-details">
                <div class="details-group">
                    <h6>客戶資訊</h6>
                    <p><strong>姓名：</strong>${appointment.customerName}</p>
                    <p><strong>電話：</strong>${appointment.phone}</p>
                </div>
                <div class="details-group">
                    <h6>預約資訊</h6>
                    <p><strong>服務項目：</strong>${appointment.serviceType}</p>
                    <p><strong>預約時間：</strong>${formatDateTime(appointment.appointmentDate)}</p>
                    <p><strong>金額：</strong>${formatCurrency(appointment.amount)}</p>
                    <p><strong>狀態：</strong><span class="status-badge ${appointment.status}">${STATUS_LABELS[appointment.status]}</span></p>
                </div>
                ${appointment.extraServices?.length ? `
                    <div class="details-group">
                        <h6>額外服務</h6>
                        <p>${appointment.extraServices.join(', ')}</p>
                    </div>
                ` : ''}
                ${appointment.notes ? `
                    <div class="details-group">
                        <h6>備註</h6>
                        <p>${appointment.notes}</p>
                    </div>
                ` : ''}
            </div>
        `;

        new bootstrap.Modal(modal).show();
    }

    // ===== 初始化執行 =====
    initializeEventListeners();
    initializeFormValidation();
    loadAppointments();

    // 標記已初始化
    window.appointmentsInitialized = true;

    // ===== 返回清理函數 =====
    return function cleanup() {
        // 移除事件監聽
        document.getElementById('statusFilter')?.removeEventListener('change', handleFilterChange);
        document.getElementById('dateFilter')?.removeEventListener('change', handleFilterChange);
        document.getElementById('serviceFilter')?.removeEventListener('change', handleFilterChange);
        document.getElementById('searchInput')?.removeEventListener('input', handleFilterChange);
        document.getElementById('pageSize')?.removeEventListener('change', handlePageSizeChange);
        document.getElementById('selectAll')?.removeEventListener('change', handleSelectAll);

        // 清除全域函數
        delete window.viewAppointment;
        delete window.editAppointment;
        delete window.deleteAppointment;
        delete window.changePage;

        // 清除狀態
        state.appointments = [];
        state.filteredAppointments = [];
        state.selectedIds.clear();
        
        // 移除初始化標記
        window.appointmentsInitialized = false;
    };
}

// ===== 模組導出 =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initializeAppointments };
} else {
    window.initializeAppointments = initializeAppointments;
}