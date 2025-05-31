// ===== 儀表板初始化 =====
function initializeDashboard() {
    console.log('初始化儀表板頁面');
    
    // 變數宣告
    let calendar;

    // ===== 初始化 =====
    function init() {
        // 等待 DOM 和套件都準備好
        waitForDependencies().then(() => {
            initCalendar();
            initEventListeners();
            loadDashboardData();
        }).catch(error => {
            console.error('初始化失敗:', error);
        });
    }

    // ===== 等待依賴準備 =====
    function waitForDependencies() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 100; // 10秒超時
            
            const checkDependencies = () => {
                const hasFullCalendar = typeof FullCalendar !== 'undefined';
                const hasCalendarEl = !!document.getElementById('calendar');
                
                console.log('Dependency check:', {
                    FullCalendar: hasFullCalendar,
                    CalendarElement: hasCalendarEl,
                    Attempt: attempts + 1
                });
                
                if (hasFullCalendar && hasCalendarEl) {
                    console.log('所有依賴都已準備就緒');
                    resolve();
                    return true;
                }
                
                return false;
            };
            
            // 立即檢查一次
            if (checkDependencies()) return;
            
            const interval = setInterval(() => {
                attempts++;
                
                if (checkDependencies()) {
                    clearInterval(interval);
                } else if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    const error = new Error(`載入相依套件超時 (${attempts} 次嘗試)`);
                    console.error(error);
                    reject(error);
                }
            }, 100);
        });
    }

    // ===== 行事曆初始化 =====
    function initCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) {
            console.warn('找不到日曆元素');
            return;
        }

        try {
            calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                locale: 'zh-tw',
                height: 'auto',
                aspectRatio: 1.35,
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth'
                },
                buttonText: {
                    today: '今天',
                    month: '月',
                    week: '週',
                    day: '日'
                },
                dayMaxEvents: 3,
                moreLinkText: function(num) {
                    return '+' + num + ' 個';
                },
                events: [
                    {
                        title: '林小姐 - 基礎保養',
                        start: '2025-05-30T14:30:00',
                        backgroundColor: '#DB7093',
                        borderColor: '#DB7093',
                        textColor: '#ffffff'
                    },
                    {
                        title: '陳先生 - 凝臠美甲',
                        start: '2025-05-28T10:00:00',
                        backgroundColor: '#87CEEB',
                        borderColor: '#87CEEB',
                        textColor: '#ffffff'
                    }
                ],
                eventClick: function(info) {
                    showEventDetails(info.event);
                },
                dateClick: function(info) {
                    showAddEventModal(info.date);
                }
            });

            calendar.render();
            console.log('日曆初始化成功');
        } catch (error) {
            console.error('日曆初始化失敗:', error);
        }
    }

    // ===== 事件監聽初始化 =====
    function initEventListeners() {
        // 待辦事項勾選
        document.querySelectorAll('.task-item input[type="checkbox"]')
            .forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const taskItem = this.closest('.task-item');
                    if (this.checked) {
                        taskItem.style.opacity = '0.5';
                        taskItem.style.textDecoration = 'line-through';
                    } else {
                        taskItem.style.opacity = '1';
                        taskItem.style.textDecoration = 'none';
                    }
                    updateTaskStatus(taskItem.dataset.id, this.checked);
                });
            });
    }

    // ===== 資料載入與更新 =====
    function loadDashboardData() {
        updateSummaryCards({
            todayBookings: 8,
            newMembers: 24,
            monthlyRevenue: 52680,
            avgRating: 4.8
        });
    }

    function updateSummaryCards(data) {
        document.querySelectorAll('.card-info .number').forEach(el => {
            const key = el.closest('.card').dataset.type;
            if (data[key]) {
                el.textContent = data[key].toLocaleString();
            }
        });
    }

    // ===== 事件處理函數 =====
    function showEventDetails(event) {
        console.log('Event details:', event);
        
        // 顯示預約詳情
        const details = `
預約詳情：
標題：${event.title}
日期：${event.start.toLocaleDateString('zh-TW')}
時間：${event.start.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
        `;
        
        if (confirm(details + '\n\n是否要編輯此預約？')) {
            // 跳轉到預約管理頁面
            window.location.hash = '#appointments';
        }
    }

    function showAddEventModal(date) {
        console.log('Add event for date:', date);
        
        const dateStr = date.toLocaleDateString('zh-TW');
        const result = confirm(`新增預約\n日期：${dateStr}\n\n點擊「確定」前往預約管理頁面新增預約`);
        
        if (result) {
            // 將選擇的日期儲存在 localStorage 中
            localStorage.setItem('selectedAppointmentDate', date.toISOString().split('T')[0]);
            // 跳轉到預約管理頁面
            window.location.hash = '#appointments';
            // 小延遲後觸發新增預約按鈕
            setTimeout(() => {
                const addButton = document.querySelector('button[data-bs-toggle="modal"][data-bs-target="#appointmentModal"]');
                if (addButton) {
                    addButton.click();
                    // 如果有預約日期輸入框，自動填入日期
                    setTimeout(() => {
                        const dateInput = document.querySelector('input[name="appointmentDate"]');
                        if (dateInput) {
                            dateInput.value = localStorage.getItem('selectedAppointmentDate');
                            localStorage.removeItem('selectedAppointmentDate');
                        }
                    }, 200);
                }
            }, 500);
        }
    }

    function updateTaskStatus(taskId, completed) {
        console.log('Update task:', taskId, completed);
    }

    // ===== 清理函數 =====
    function cleanup() {
        if (calendar) {
            calendar.destroy();
            calendar = null;
        }
    }

    // ===== 初始化調用 =====
    init();

    // ===== 返回清理函數 =====
    return cleanup;
}

// ===== 導出全局函數 =====
window.initializeDashboard = initializeDashboard;