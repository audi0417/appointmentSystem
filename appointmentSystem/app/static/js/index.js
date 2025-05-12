// ========== 常數和配置 ==========
const CONFIG = {
    PHONE_REGEX: /^09\d{8}$/,
    NAME_REGEX: /^[\u4e00-\u9fa5]{2,}$/,
    DATE_FORMAT: "Y-m-d",
    STORAGE_KEY: 'bookingData',
    API_ENDPOINT: '/api/booking'  // 實際環境請更換
};

// ========== 全局狀態 ==========
const state = {
    currentStep: 1,
    selectedService: '',
    selectedDate: '',
    selectedTime: '',
};

// ========== 工具函數 ==========
const utils = {
    // 驗證電話
    validatePhone: (phone) => CONFIG.PHONE_REGEX.test(phone),
    
    // 驗證姓名
    validateName: (name) => CONFIG.NAME_REGEX.test(name),
    
    // 顯示錯誤訊息
    showError: (element, message) => {
        const existingError = element.nextElementSibling;
        if (existingError?.classList.contains('error-message')) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        element.parentNode.appendChild(errorDiv);
        element.classList.add('error-shake');
        
        setTimeout(() => {
            element.classList.remove('error-shake');
        }, 500);
    },
    
    // 清除錯誤訊息
    clearError: (element) => {
        const errorMsg = element.nextElementSibling;
        if (errorMsg?.classList.contains('error-message')) {
            errorMsg.remove();
        }
    },
    
    // 動畫效果
    fadeIn: (element) => {
        element.style.opacity = 0;
        element.style.display = 'block';
        
        (function fade() {
            let val = parseFloat(element.style.opacity);
            if (!((val += .1) > 1)) {
                element.style.opacity = val;
                requestAnimationFrame(fade);
            }
        })();
    }
};

// ========== UI控制器 ==========
const UI = {
    // 更新進度條
    updateProgressBar: () => {
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            if (index + 1 <= state.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    },
    
    // 更新按鈕狀態
    updateButtons: () => {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        prevBtn.style.display = state.currentStep === 1 ? 'none' : 'block';
        nextBtn.textContent = state.currentStep === 3 ? '確認預約' : '下一步';
    },
    
    // 更新預約摘要
    updateSummary: () => {
        if (state.currentStep === 3) {
            document.getElementById('selected-service').textContent = 
                `服務項目：${state.selectedService === 'basic' ? '基礎美甲' : '凝膠美甲'}`;
            document.getElementById('selected-datetime').textContent = 
                `預約時間：${state.selectedDate} ${state.selectedTime}`;
            document.getElementById('total-price').textContent = 
                `總金額：NT$ ${state.selectedService === 'basic' ? '800' : '1200'}`;
        }
    },
    
    // 顯示載入中
    showLoading: () => {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="spinner"></div>
            <p>預約處理中...</p>
        `;
        document.body.appendChild(loadingOverlay);
        return loadingOverlay;
    },
    
    // 顯示成功頁面
    showSuccessPage: () => {
        const container = document.querySelector('.container');
        container.innerHTML = `
            <div class="success-page">
                <div class="success-icon">✓</div>
                <h2>預約成功！</h2>
                <div class="booking-details">
                    <p>服務項目：${state.selectedService === 'basic' ? '基礎美甲' : '凝膠美甲'}</p>
                    <p>預約時間：${state.selectedDate} ${state.selectedTime}</p>
                    <p>預約人：${document.getElementById('name').value}</p>
                </div>
                <div class="reminder">
                    <h3>溫馨提醒</h3>
                    <ul>
                        <li>請於預約時間前10分鐘到達</li>
                        <li>如需取消預約，請提前24小時告知</li>
                        <li>當日請戴口罩，配合防疫措施</li>
                    </ul>
                </div>
                <button class="btn btn-primary" onclick="window.close()">完成</button>
            </div>
        `;
    }
};

// ========== 數據控制器 ==========
const DataController = {
    // 儲存資料至本地
    saveToLocal: () => {
        const bookingData = {
            service: state.selectedService,
            date: state.selectedDate,
            time: state.selectedTime,
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            note: document.getElementById('note').value
        };
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(bookingData));
    },
    
    // 從本地讀取資料
    loadFromLocal: () => {
        const data = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (data) {
            const bookingData = JSON.parse(data);
            state.selectedService = bookingData.service;
            state.selectedDate = bookingData.date;
            state.selectedTime = bookingData.time;
            
            document.getElementById('name').value = bookingData.name;
            document.getElementById('phone').value = bookingData.phone;
            document.getElementById('note').value = bookingData.note;
            
            // 更新服務選擇UI
            document.querySelectorAll('.service-card').forEach(card => {
                if (card.dataset.service === bookingData.service) {
                    card.style.border = '2px solid #DB7093';
                }
            });
        }
    }
};

// ========== 表單控制器 ==========
const FormController = {
    // 驗證當前步驟
    validateStep: (step) => {
        switch(step) {
            case 1:
                if (!state.selectedService) {
                    alert('請選擇服務項目');
                    return false;
                }
                return true;
                
            case 2:
                if (!state.selectedDate || !state.selectedTime) {
                    alert('請選擇日期和時間');
                    return false;
                }
                return true;
                
            case 3:
                const name = document.getElementById('name').value;
                const phone = document.getElementById('phone').value;
                
                if (!name || !phone) {
                    alert('請填寫姓名和電話');
                    return false;
                }
                
                if (!utils.validateName(name)) {
                    utils.showError(document.getElementById('name'), '請輸入正確的中文姓名');
                    return false;
                }
                
                if (!utils.validatePhone(phone)) {
                    utils.showError(document.getElementById('phone'), '請輸入正確的手機號碼');
                    return false;
                }
                
                return true;
                
            default:
                return false;
        }
    },
    
    // 提交預約
    submitBooking: async () => {
        if (FormController.validateStep(3)) {
            const loadingOverlay = UI.showLoading();
            
            const bookingData = {
                service: state.selectedService,
                date: state.selectedDate,
                time: state.selectedTime,
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value,
                note: document.getElementById('note').value
            };

            try {
                // 這裡應該要有實際的API呼叫
                // const response = await fetch(CONFIG.API_ENDPOINT, {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json',
                //     },
                //     body: JSON.stringify(bookingData)
                // });
                
                // 模擬API延遲
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                localStorage.removeItem(CONFIG.STORAGE_KEY);
                document.body.removeChild(loadingOverlay);
                UI.showSuccessPage();
                
            } catch (error) {
                console.error('預約失敗：', error);
                alert('預約失敗，請稍後再試');
                document.body.removeChild(loadingOverlay);
            }
        }
    }
};

// ========== 初始化 ==========
function init() {
    // 初始化日期選擇器
    flatpickr("#datepicker", {
        minDate: "today",
        dateFormat: CONFIG.DATE_FORMAT,
        disableMobile: false, // 允許在移動設備上使用原生日期選擇器
        disable: [
            function(date) {
                return (date.getDay() === 0);
            }
        ],
        onChange: function(selectedDates, dateStr) {
            state.selectedDate = dateStr;
        },
        // 移動端優化配置
        static: true, // 防止日期選擇器位置偏移
        onOpen: function(selectedDates, dateStr, instance) {
            // 移動端時，強制滾動到頂部避免遮擋
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    window.scrollTo(0, instance.calendarContainer.offsetTop);
                }, 0);
            }
        }
    });
    
    // 補充：阻止雙指縮放
    document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
    });

    // 服務卡片點擊事件
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('.service-card').forEach(c => {
                c.style.border = 'none';
            });
            this.style.border = '2px solid #DB7093';
            state.selectedService = this.dataset.service;
        });
    });

    // 時段選擇事件
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.addEventListener('click', function() {
            document.querySelectorAll('.time-slot').forEach(s => {
                s.classList.remove('selected');
            });
            this.classList.add('selected');
            state.selectedTime = this.textContent;
        });
    });

    // 表單即時驗證
    document.getElementById('name').addEventListener('input', function() {
        if (this.value && !utils.validateName(this.value)) {
            utils.showError(this, '請輸入正確的中文姓名');
        } else {
            utils.clearError(this);
        }
    });

    document.getElementById('phone').addEventListener('input', function() {
        if (this.value && !utils.validatePhone(this.value)) {
            utils.showError(this, '請輸入正確的手機號碼格式');
        } else {
            utils.clearError(this);
        }
    });

    // 導航按鈕事件
    document.getElementById('nextBtn').addEventListener('click', () => {
        if (FormController.validateStep(state.currentStep)) {
            if (state.currentStep < 3) {
                state.currentStep++;
                document.querySelectorAll('.step').forEach(step => {
                    step.style.display = 'none';
                });
                utils.fadeIn(document.getElementById(`step${state.currentStep}`));
                UI.updateProgressBar();
                UI.updateButtons();
                UI.updateSummary();
            } else {
                FormController.submitBooking();
            }
        }
    });

    document.getElementById('prevBtn').addEventListener('click', () => {
        if (state.currentStep > 1) {
            state.currentStep--;
            document.querySelectorAll('.step').forEach(step => {
                step.style.display = 'none';
            });
            utils.fadeIn(document.getElementById(`step${state.currentStep}`));
            UI.updateProgressBar();
            UI.updateButtons();
        }
    });

    // 載入本地儲存的資料
    DataController.loadFromLocal();
    
    // 定期儲存資料
    setInterval(DataController.saveToLocal, 5000);
}

// 啟動應用
document.addEventListener('DOMContentLoaded', init);