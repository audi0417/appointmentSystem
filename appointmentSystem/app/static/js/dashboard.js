// ===== 使用 IIFE 避免全域變數污染 =====
(function() {
    // 變數宣告
    let calendar;
    let salesChart;

    // ===== 初始化 =====
    function init() {
        // 等待 DOM 和套件都準備好
        waitForDependencies().then(() => {
            initCalendar();
            initSalesChart();
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
            const interval = setInterval(() => {
                if (
                    typeof FullCalendar !== 'undefined' &&
                    typeof Chart !== 'undefined' &&
                    document.getElementById('calendar') &&
                    document.getElementById('salesChart')
                ) {
                    clearInterval(interval);
                    resolve();
                } else if (attempts >= 50) { // 5秒後超時
                    clearInterval(interval);
                    reject(new Error('載入相依套件超時'));
                }
                attempts++;
            }, 100);
        });
    }

    // ===== 行事曆初始化 =====
    function initCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'zh-tw',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            buttonText: {
                today: '今天',
                month: '月',
                week: '週',
                day: '日'
            },
            events: [
                {
                    title: '林小姐 - 基礎保養',
                    start: '2024-11-25T14:30:00',
                    backgroundColor: '#DB7093',
                    borderColor: '#DB7093'
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
    }

    // ===== 圖表初始化 =====
    function initSalesChart() {
        const chartEl = document.getElementById('salesChart');
        if (!chartEl) return;

        const ctx = chartEl.getContext('2d');
        salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['週一', '週二', '週三', '週四', '週五', '週六', '週日'],
                datasets: [{
                    label: '營業額',
                    data: [12000, 19000, 15000, 17000, 22000, 25000, 20000],
                    backgroundColor: 'rgba(219, 112, 147, 0.2)',
                    borderColor: '#DB7093',
                    borderWidth: 2,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    // ===== 事件監聽初始化 =====
    function initEventListeners() {
        // 時期選擇器
        document.querySelectorAll('.period-selector button').forEach(button => {
            button.addEventListener('click', function() {
                document.querySelectorAll('.period-selector button')
                    .forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                updateSalesChart(this.textContent);
            });
        });

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

    function updateSalesChart(period) {
        const data = {
            '週': [12000, 19000, 15000, 17000, 22000, 25000, 20000],
            '月': [150000, 180000, 200000, 170000],
            '年': [2000000, 2200000, 1800000, 2500000]
        };

        if (salesChart && data[period]) {
            salesChart.data.datasets[0].data = data[period];
            salesChart.update();
        }
    }

    // ===== 事件處理函數 =====
    function showEventDetails(event) {
        console.log('Event details:', event);
    }

    function showAddEventModal(date) {
        console.log('Add event for date:', date);
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
        if (salesChart) {
            salesChart.destroy();
            salesChart = null;
        }
    }

    // ===== 初始化調用 =====
    init();

    // ===== 導出清理函數 =====
    window.dashboardCleanup = cleanup;
})();