/**
 * 系統設定頁面管理器
 */
function initializeSettings() {
    class SettingsManager {
        constructor() {
            this.settings = {
                basic: {},
                api: {},
                social: {},
                notifications: {}
            };
            this.originalSettings = {};
            this.hasChanges = false;
            
            this.init();
        }

        init() {
            this.bindEvents();
            this.loadSettings();
            this.initWebhookUrls();
        }

        bindEvents() {
            // 標籤切換事件
            document.querySelectorAll('#settingsTabs button[data-bs-toggle="tab"]').forEach(tab => {
                tab.addEventListener('shown.bs.tab', (event) => {
                    const targetId = event.target.getAttribute('data-bs-target').substring(1);
                    this.onTabChanged(targetId);
                });
            });

            // 儲存按鈕
            document.getElementById('saveAllBtn')?.addEventListener('click', () => {
                this.showSaveConfirm();
            });

            document.getElementById('confirmSaveBtn')?.addEventListener('click', () => {
                this.saveAllSettings();
            });

            // 頭像上傳事件
            document.getElementById('uploadAvatarBtn')?.addEventListener('click', () => {
                document.getElementById('avatarUpload').click();
            });

            document.getElementById('avatarUpload')?.addEventListener('change', (e) => {
                if (e.target.files[0]) {
                    this.handleAvatarUpload(e.target.files[0]);
                }
            });

            document.getElementById('removeAvatarBtn')?.addEventListener('click', () => {
                this.removeAvatar();
            });

            // 營業時間相關事件
            this.bindBusinessHoursEvents();

            // API 測試按鈕
            document.getElementById('testLineBtn')?.addEventListener('click', () => {
                this.testLineApi();
            });

            document.getElementById('testMapsBtn')?.addEventListener('click', () => {
                this.testMapsApi();
            });

            document.getElementById('testFbBtn')?.addEventListener('click', () => {
                this.testFacebookApi();
            });

            document.getElementById('testIgBtn')?.addEventListener('click', () => {
                this.testInstagramApi();
            });

            // API 授權按鈕
            document.getElementById('authorizeLineBtn')?.addEventListener('click', () => {
                this.authorizeLineBot();
            });

            document.getElementById('authorizeFbBtn')?.addEventListener('click', () => {
                this.authorizeFacebook();
            });

            document.getElementById('authorizeIgBtn')?.addEventListener('click', () => {
                this.authorizeInstagram();
            });

            // 測試發文按鈕
            document.getElementById('testFbPostBtn')?.addEventListener('click', () => {
                this.testFacebookPost();
            });

            document.getElementById('testIgPostBtn')?.addEventListener('click', () => {
                this.testInstagramPost();
            });

            // 表單變更監聽
            document.querySelectorAll('#basicInfoForm input, #basicInfoForm textarea').forEach(input => {
                input.addEventListener('input', () => this.onSettingsChanged());
            });

            document.querySelectorAll('#apiSettingsForm input').forEach(input => {
                input.addEventListener('input', () => this.onSettingsChanged());
            });

            document.querySelectorAll('#socialMediaForm input').forEach(input => {
                input.addEventListener('input', () => this.onSettingsChanged());
            });

            document.querySelectorAll('#notificationForm input').forEach(input => {
                input.addEventListener('change', () => this.onSettingsChanged());
            });
        }

        bindBusinessHoursEvents() {
            // 日期卡片點擊事件
            document.querySelectorAll('.day-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (e.target.closest('.day-status')) return; // 忽略開關點擊
                    this.openTimeSettingModal(card.dataset.day);
                });
            });

            // 營業狀態切換
            document.querySelectorAll('.day-toggle').forEach(toggle => {
                toggle.addEventListener('change', (e) => {
                    this.toggleBusinessDay(e.target, e.target.closest('.day-card').dataset.day);
                });
            });

            // 快速操作按鈕
            document.getElementById('setAllBusinessDays')?.addEventListener('click', () => {
                this.openBulkTimeSettingModal();
            });

            document.getElementById('copyFromPrevious')?.addEventListener('click', () => {
                this.copyFromPreviousDay();
            });

            // Modal 內的事件
            this.bindModalEvents();
        }

        bindModalEvents() {
            // 時間設定 Modal 事件
            document.getElementById('modalDayToggle')?.addEventListener('change', (e) => {
                this.toggleModalTimeInputs(e.target.checked);
            });

            document.getElementById('modalOpenTime')?.addEventListener('change', () => {
                this.updateDurationDisplay();
            });

            document.getElementById('modalCloseTime')?.addEventListener('change', () => {
                this.updateDurationDisplay();
            });

            // 快速時間按鈕
            document.querySelectorAll('.quick-time').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const time = e.target.dataset.time;
                    const isOpenTime = e.target.closest('.col-6').querySelector('#modalOpenTime');
                    if (isOpenTime) {
                        document.getElementById('modalOpenTime').value = time;
                    } else {
                        document.getElementById('modalCloseTime').value = time;
                    }
                    this.updateDurationDisplay();
                });
            });

            // 預設時段按鈕
            document.querySelectorAll('.preset-schedule').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const openTime = e.target.dataset.open;
                    const closeTime = e.target.dataset.close;
                    document.getElementById('modalOpenTime').value = openTime;
                    document.getElementById('modalCloseTime').value = closeTime;
                    this.updateDurationDisplay();
                });
            });

            // 儲存時間設定
            document.getElementById('saveTimeSettings')?.addEventListener('click', () => {
                this.saveTimeSettings();
            });

            // 批量設定相關
            document.getElementById('saveBulkTimeSettings')?.addEventListener('click', () => {
                this.saveBulkTimeSettings();
            });
        }

        async loadSettings() {
            try {
                this.showLoading();
                
                // 模擬 API 調用
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // 載入預設設定
                this.settings = {
                    basic: {
                        storeName: '美甲工作室',
                        storeNameEn: 'Nail Studio',
                        phone: '02-1234-5678',
                        email: 'info@nailstudio.com',
                        address: '台北市信義區信義路五段7號',
                        description: '專業美甲服務，打造您的指尖時尚',
                        avatar: '/static/images/default-store.png'
                    },
                    api: {
                        lineChannelId: '',
                        lineChannelSecret: '',
                        lineAccessToken: '',
                        googleMapsApiKey: ''
                    },
                    social: {
                        fbAppId: '',
                        fbAppSecret: '',
                        fbPageToken: '',
                        fbPageId: '',
                        fbAutoPost: false,
                        fbPostBooking: false,
                        igAccountId: '',
                        igAccessToken: '',
                        igAutoPost: false,
                        igDefaultHashtags: '#美甲 #nailart #taipei'
                    },
                    notifications: {
                        emailNewBooking: true,
                        emailBookingReminder: true,
                        emailCancellation: true,
                        lineNewBooking: false,
                        lineBookingReminder: false,
                        systemMaintenance: true,
                        systemUpdate: true
                    }
                };

                this.originalSettings = JSON.parse(JSON.stringify(this.settings));
                this.populateForm();
                
            } catch (error) {
                console.error('載入設定失敗:', error);
                this.showError('載入設定失敗');
            } finally {
                this.hideLoading();
            }
        }

        populateForm() {
            // 填充基本資料表單
            Object.keys(this.settings.basic).forEach(key => {
                const input = document.querySelector(`[name="${key}"]`);
                if (input && key !== 'avatar') {
                    input.value = this.settings.basic[key] || '';
                }
            });

            // 設置頭像
            const avatarImg = document.getElementById('storeAvatar');
            if (avatarImg) {
                avatarImg.src = this.settings.basic.avatar || '/static/images/default-store.png';
            }

            // 填充 API 設定表單
            Object.keys(this.settings.api).forEach(key => {
                const input = document.querySelector(`[name="${key}"]`);
                if (input) {
                    input.value = this.settings.api[key] || '';
                }
            });

            // 填充社群媒體表單
            Object.keys(this.settings.social).forEach(key => {
                const input = document.querySelector(`[name="${key}"]`);
                if (input) {
                    if (input.type === 'checkbox') {
                        input.checked = this.settings.social[key] || false;
                    } else {
                        input.value = this.settings.social[key] || '';
                    }
                }
            });

            // 填充通知設定表單
            Object.keys(this.settings.notifications).forEach(key => {
                const input = document.querySelector(`[name="${key}"]`);
                if (input && input.type === 'checkbox') {
                    input.checked = this.settings.notifications[key] || false;
                }
            });
        }

        initWebhookUrls() {
            const webhookUrl = document.getElementById('lineWebhookUrl');
            if (webhookUrl) {
                webhookUrl.textContent = `${window.location.origin}/api/webhook/line`;
            }
        }

        toggleBusinessDay(toggle, dayName) {
            const dayCard = toggle.closest('.day-card');
            const timeDisplay = dayCard.querySelector('.time-display');
            const timeInfo = timeDisplay.querySelector('.time-info');
            const closedInfo = timeDisplay.querySelector('.closed-info');
            const hiddenInputs = dayCard.querySelectorAll('input[type="hidden"]');

            if (toggle.checked) {
                // 啟用營業
                dayCard.classList.remove('closed');
                timeInfo.classList.add('active');
                closedInfo.classList.remove('active');
                
                // 設定預設時間
                const openTime = timeDisplay.dataset.open || '10:00';
                const closeTime = timeDisplay.dataset.close || '18:00';
                hiddenInputs[0].value = openTime; // open time
                hiddenInputs[1].value = closeTime; // close time
                
                timeInfo.querySelector('.open-time').textContent = openTime;
                timeInfo.querySelector('.close-time').textContent = closeTime;
            } else {
                // 禁用營業
                dayCard.classList.add('closed');
                timeInfo.classList.remove('active');
                closedInfo.classList.add('active');
                
                hiddenInputs[0].value = '';
                hiddenInputs[1].value = '';
            }

            this.onSettingsChanged();
        }

        openTimeSettingModal(dayName) {
            const dayCard = document.querySelector(`.day-card[data-day="${dayName}"]`);
            const toggle = dayCard.querySelector('.day-toggle');
            const timeDisplay = dayCard.querySelector('.time-display');
            
            // 設定 Modal 標題
            const dayNames = {
                'monday': '週一',
                'tuesday': '週二', 
                'wednesday': '週三',
                'thursday': '週四',
                'friday': '週五',
                'saturday': '週六',
                'sunday': '週日'
            };
            
            document.getElementById('modalDayName').textContent = dayNames[dayName];
            
            // 設定當前狀態
            const modalToggle = document.getElementById('modalDayToggle');
            modalToggle.checked = toggle.checked;
            
            // 設定時間
            const currentOpenTime = timeDisplay.dataset.open || '10:00';
            const currentCloseTime = timeDisplay.dataset.close || '18:00';
            
            document.getElementById('modalOpenTime').value = currentOpenTime;
            document.getElementById('modalCloseTime').value = currentCloseTime;
            
            // 儲存當前編輯的日期
            this.currentEditingDay = dayName;
            
            // 更新顯示狀態
            this.toggleModalTimeInputs(toggle.checked);
            this.updateDurationDisplay();
            
            // 顯示 Modal
            const modal = new bootstrap.Modal(document.getElementById('timeSettingModal'));
            modal.show();
        }

        toggleModalTimeInputs(enabled) {
            const timeInputsContainer = document.getElementById('timeInputsContainer');
            const closedNotice = document.getElementById('closedNotice');
            
            if (enabled) {
                timeInputsContainer.style.display = 'block';
                closedNotice.style.display = 'none';
            } else {
                timeInputsContainer.style.display = 'none';
                closedNotice.style.display = 'block';
            }
        }

        updateDurationDisplay() {
            const openTime = document.getElementById('modalOpenTime').value;
            const closeTime = document.getElementById('modalCloseTime').value;
            
            if (openTime && closeTime) {
                const open = new Date(`2000-01-01T${openTime}:00`);
                const close = new Date(`2000-01-01T${closeTime}:00`);
                
                if (close > open) {
                    const diffMs = close - open;
                    const hours = Math.floor(diffMs / (1000 * 60 * 60));
                    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    
                    let durationText = `${hours} 小時`;
                    if (minutes > 0) {
                        durationText += ` ${minutes} 分鐘`;
                    }
                    
                    document.getElementById('durationDisplay').textContent = durationText;
                } else {
                    document.getElementById('durationDisplay').textContent = '時間設定有誤';
                }
            }
        }

        saveTimeSettings() {
            if (!this.currentEditingDay) return;
            
            const modalToggle = document.getElementById('modalDayToggle');
            const openTime = document.getElementById('modalOpenTime').value;
            const closeTime = document.getElementById('modalCloseTime').value;
            
            // 驗證時間
            if (modalToggle.checked && (!openTime || !closeTime)) {
                this.showError('請設定完整的營業時間');
                return;
            }
            
            if (modalToggle.checked && openTime >= closeTime) {
                this.showError('結束時間必須晚於開始時間');
                return;
            }
            
            // 更新日期卡片
            const dayCard = document.querySelector(`.day-card[data-day="${this.currentEditingDay}"]`);
            const toggle = dayCard.querySelector('.day-toggle');
            const timeDisplay = dayCard.querySelector('.time-display');
            const hiddenInputs = dayCard.querySelectorAll('input[type="hidden"]');
            
            toggle.checked = modalToggle.checked;
            
            if (modalToggle.checked) {
                timeDisplay.dataset.open = openTime;
                timeDisplay.dataset.close = closeTime;
                hiddenInputs[0].value = openTime;
                hiddenInputs[1].value = closeTime;
                
                timeDisplay.querySelector('.open-time').textContent = openTime;
                timeDisplay.querySelector('.close-time').textContent = closeTime;
                
                dayCard.classList.remove('closed');
                timeDisplay.querySelector('.time-info').classList.add('active');
                timeDisplay.querySelector('.closed-info').classList.remove('active');
            } else {
                timeDisplay.dataset.open = '';
                timeDisplay.dataset.close = '';
                hiddenInputs[0].value = '';
                hiddenInputs[1].value = '';
                
                dayCard.classList.add('closed');
                timeDisplay.querySelector('.time-info').classList.remove('active');
                timeDisplay.querySelector('.closed-info').classList.add('active');
            }
            
            this.onSettingsChanged();
            
            // 關閉 Modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('timeSettingModal'));
            modal.hide();
            
            this.showSuccess('營業時間設定已儲存');
        }

        openBulkTimeSettingModal() {
            const modal = new bootstrap.Modal(document.getElementById('bulkTimeSettingModal'));
            modal.show();
        }

        saveBulkTimeSettings() {
            const selectedDays = Array.from(document.querySelectorAll('.bulk-day:checked')).map(cb => cb.value);
            const openTime = document.getElementById('bulkOpenTime').value;
            const closeTime = document.getElementById('bulkCloseTime').value;
            
            if (selectedDays.length === 0) {
                this.showError('請選擇要設定的日期');
                return;
            }
            
            if (!openTime || !closeTime) {
                this.showError('請設定完整的營業時間');
                return;
            }
            
            if (openTime >= closeTime) {
                this.showError('結束時間必須晚於開始時間');
                return;
            }
            
            // 更新選中的日期
            selectedDays.forEach(dayName => {
                const dayCard = document.querySelector(`.day-card[data-day="${dayName}"]`);
                const toggle = dayCard.querySelector('.day-toggle');
                const timeDisplay = dayCard.querySelector('.time-display');
                const hiddenInputs = dayCard.querySelectorAll('input[type="hidden"]');
                
                // 啟用營業
                toggle.checked = true;
                dayCard.classList.remove('closed');
                
                // 設定時間
                timeDisplay.dataset.open = openTime;
                timeDisplay.dataset.close = closeTime;
                hiddenInputs[0].value = openTime;
                hiddenInputs[1].value = closeTime;
                
                timeDisplay.querySelector('.open-time').textContent = openTime;
                timeDisplay.querySelector('.close-time').textContent = closeTime;
                
                timeDisplay.querySelector('.time-info').classList.add('active');
                timeDisplay.querySelector('.closed-info').classList.remove('active');
            });
            
            this.onSettingsChanged();
            
            // 關閉 Modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('bulkTimeSettingModal'));
            modal.hide();
            
            this.showSuccess(`已設定 ${selectedDays.length} 天的營業時間`);
        }

        copyFromPreviousDay() {
            const dayCards = document.querySelectorAll('.day-card');
            let previousCard = null;
            
            for (let i = 0; i < dayCards.length; i++) {
                const currentCard = dayCards[i];
                
                if (previousCard) {
                    const prevToggle = previousCard.querySelector('.day-toggle');
                    const prevTimeDisplay = previousCard.querySelector('.time-display');
                    
                    const currentToggle = currentCard.querySelector('.day-toggle');
                    const currentTimeDisplay = currentCard.querySelector('.time-display');
                    const hiddenInputs = currentCard.querySelectorAll('input[type="hidden"]');
                    
                    // 複製狀態
                    currentToggle.checked = prevToggle.checked;
                    
                    if (prevToggle.checked) {
                        const openTime = prevTimeDisplay.dataset.open;
                        const closeTime = prevTimeDisplay.dataset.close;
                        
                        currentTimeDisplay.dataset.open = openTime;
                        currentTimeDisplay.dataset.close = closeTime;
                        hiddenInputs[0].value = openTime;
                        hiddenInputs[1].value = closeTime;
                        
                        currentTimeDisplay.querySelector('.open-time').textContent = openTime;
                        currentTimeDisplay.querySelector('.close-time').textContent = closeTime;
                        
                        currentCard.classList.remove('closed');
                        currentTimeDisplay.querySelector('.time-info').classList.add('active');
                        currentTimeDisplay.querySelector('.closed-info').classList.remove('active');
                    } else {
                        currentTimeDisplay.dataset.open = '';
                        currentTimeDisplay.dataset.close = '';
                        hiddenInputs[0].value = '';
                        hiddenInputs[1].value = '';
                        
                        currentCard.classList.add('closed');
                        currentTimeDisplay.querySelector('.time-info').classList.remove('active');
                        currentTimeDisplay.querySelector('.closed-info').classList.add('active');
                    }
                }
                
                previousCard = currentCard;
            }
            
            this.onSettingsChanged();
            this.showSuccess('已複製前一日的營業時間設定');
        }

        async handleAvatarUpload(file) {
            if (!file) return;

            // 驗證檔案類型
            if (!file.type.startsWith('image/')) {
                this.showError('請上傳圖片檔案');
                return;
            }

            // 驗證檔案大小 (2MB)
            if (file.size > 2 * 1024 * 1024) {
                this.showError('圖片大小不能超過 2MB');
                return;
            }

            try {
                this.showLoading();

                // 創建預覽
                const reader = new FileReader();
                reader.onload = (e) => {
                    const avatarImg = document.getElementById('storeAvatar');
                    if (avatarImg) {
                        avatarImg.src = e.target.result;
                    }
                    
                    this.settings.basic.avatar = e.target.result;
                    this.onSettingsChanged();
                };
                reader.readAsDataURL(file);

                // 模擬上傳
                await new Promise(resolve => setTimeout(resolve, 1500));
                this.showSuccess('頭像上傳成功');

            } catch (error) {
                console.error('頭像上傳失敗:', error);
                this.showError('頭像上傳失敗');
            } finally {
                this.hideLoading();
            }
        }

        removeAvatar() {
            const avatarImg = document.getElementById('storeAvatar');
            if (avatarImg) {
                avatarImg.src = '/static/images/default-store.png';
            }
            
            this.settings.basic.avatar = '/static/images/default-store.png';
            this.onSettingsChanged();
            this.showSuccess('頭像已移除');
        }

        // API 測試方法
        async testLineApi() {
            const channelId = document.querySelector('[name="lineChannelId"]')?.value;
            const channelSecret = document.querySelector('[name="lineChannelSecret"]')?.value;
            const accessToken = document.querySelector('[name="lineAccessToken"]')?.value;

            if (!channelId || !channelSecret || !accessToken) {
                this.showError('請先填寫 LINE API 相關資訊');
                return;
            }

            try {
                this.updateConnectionStatus('lineStatus', 'testing', '測試中...');
                
                // 模擬 API 測試
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // 模擬成功結果
                const success = Math.random() > 0.3; // 70% 成功率
                
                if (success) {
                    this.updateConnectionStatus('lineStatus', 'connected', '連接成功');
                    this.showSuccess('LINE API 連接測試成功');
                } else {
                    this.updateConnectionStatus('lineStatus', 'disconnected', '連接失敗');
                    this.showError('LINE API 連接測試失敗，請檢查設定');
                }
                
            } catch (error) {
                console.error('LINE API 測試失敗:', error);
                this.updateConnectionStatus('lineStatus', 'disconnected', '測試失敗');
                this.showError('LINE API 測試失敗');
            }
        }

        async testMapsApi() {
            const apiKey = document.querySelector('[name="googleMapsApiKey"]')?.value;

            if (!apiKey) {
                this.showError('請先填寫 Google Maps API Key');
                return;
            }

            try {
                this.updateConnectionStatus('mapsStatus', 'testing', '測試中...');
                
                // 模擬 API 測試
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                const success = Math.random() > 0.2; // 80% 成功率
                
                if (success) {
                    this.updateConnectionStatus('mapsStatus', 'connected', 'API 有效');
                    this.showSuccess('Google Maps API 測試成功');
                } else {
                    this.updateConnectionStatus('mapsStatus', 'disconnected', 'API 無效');
                    this.showError('Google Maps API 測試失敗，請檢查 API Key');
                }
                
            } catch (error) {
                console.error('Google Maps API 測試失敗:', error);
                this.updateConnectionStatus('mapsStatus', 'disconnected', '測試失敗');
                this.showError('Google Maps API 測試失敗');
            }
        }

        async testFacebookApi() {
            const appId = document.querySelector('[name="fbAppId"]')?.value;
            const appSecret = document.querySelector('[name="fbAppSecret"]')?.value;
            const pageToken = document.querySelector('[name="fbPageToken"]')?.value;

            if (!appId || !appSecret || !pageToken) {
                this.showError('請先填寫 Facebook API 相關資訊');
                return;
            }

            try {
                this.updateConnectionStatus('fbStatus', 'testing', '測試中...');
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const success = Math.random() > 0.3;
                
                if (success) {
                    this.updateConnectionStatus('fbStatus', 'connected', '連接成功');
                    this.showSuccess('Facebook API 連接測試成功');
                } else {
                    this.updateConnectionStatus('fbStatus', 'disconnected', '連接失敗');
                    this.showError('Facebook API 連接測試失敗');
                }
                
            } catch (error) {
                console.error('Facebook API 測試失敗:', error);
                this.updateConnectionStatus('fbStatus', 'disconnected', '測試失敗');
                this.showError('Facebook API 測試失敗');
            }
        }

        async testFacebookPost() {
            try {
                this.showLoading();
                
                // 模擬發文測試
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const success = Math.random() > 0.2;
                
                if (success) {
                    this.showSuccess('Facebook 測試發文成功！已發布到您的 Facebook 專頁');
                } else {
                    this.showError('Facebook 測試發文失敗，請檢查權限設定');
                }
                
            } catch (error) {
                console.error('Facebook 發文測試失敗:', error);
                this.showError('Facebook 發文測試失敗');
            } finally {
                this.hideLoading();
            }
        }

        async testInstagramApi() {
            const accountId = document.querySelector('[name="igAccountId"]')?.value;
            const accessToken = document.querySelector('[name="igAccessToken"]')?.value;

            if (!accountId || !accessToken) {
                this.showError('請先填寫 Instagram API 相關資訊');
                return;
            }

            try {
                this.updateConnectionStatus('igStatus', 'testing', '測試中...');
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const success = Math.random() > 0.3;
                
                if (success) {
                    this.updateConnectionStatus('igStatus', 'connected', '連接成功');
                    this.showSuccess('Instagram API 連接測試成功');
                } else {
                    this.updateConnectionStatus('igStatus', 'disconnected', '連接失敗');
                    this.showError('Instagram API 連接測試失敗');
                }
                
            } catch (error) {
                console.error('Instagram API 測試失敗:', error);
                this.updateConnectionStatus('igStatus', 'disconnected', '測試失敗');
                this.showError('Instagram API 測試失敗');
            }
        }

        async testInstagramPost() {
            try {
                this.showLoading();
                
                // 模擬發文測試
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const success = Math.random() > 0.2;
                
                if (success) {
                    this.showSuccess('Instagram 測試發文成功！已發布到您的 Instagram 帳戶');
                } else {
                    this.showError('Instagram 測試發文失敗，請檢查權限設定');
                }
                
            } catch (error) {
                console.error('Instagram 發文測試失敗:', error);
                this.showError('Instagram 發文測試失敗');
            } finally {
                this.hideLoading();
            }
        }

        // 授權方法
        authorizeLineBot() {
            const channelId = document.querySelector('[name="lineChannelId"]')?.value;
            
            if (!channelId) {
                this.showError('請先填寫 LINE Channel ID');
                return;
            }

            // 模擬授權流程
            const authUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/line/callback')}&state=authorize&scope=bot`;
            
            this.showConfirm(
                'LINE Bot 授權',
                '將會開啟新視窗進行 LINE Bot 授權，請確認後繼續。',
                () => {
                    window.open(authUrl, 'lineAuth', 'width=600,height=400');
                }
            );
        }

        authorizeFacebook() {
            const appId = document.querySelector('[name="fbAppId"]')?.value;
            
            if (!appId) {
                this.showError('請先填寫 Facebook App ID');
                return;
            }

            // 模擬 Facebook 授權流程
            const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/facebook/callback')}&scope=pages_manage_posts,pages_read_engagement&response_type=code`;
            
            this.showConfirm(
                'Facebook 授權',
                '將會開啟新視窗進行 Facebook 授權，請確認後繼續。',
                () => {
                    window.open(authUrl, 'facebookAuth', 'width=600,height=400');
                }
            );
        }

        authorizeInstagram() {
            // Instagram 使用 Facebook Login
            this.showInfo(
                'Instagram 授權說明',
                'Instagram API 需要透過 Facebook 帳戶進行授權。請先完成 Facebook 授權設定。'
            );
        }

        updateConnectionStatus(statusId, status, text) {
            const statusElement = document.getElementById(statusId);
            if (!statusElement) return;

            const indicator = statusElement.querySelector('.status-indicator');
            const statusText = statusElement.querySelector('.status-text');

            if (indicator) {
                indicator.className = `status-indicator ${status}`;
            }
            
            if (statusText) {
                statusText.textContent = text;
            }
        }

        onTabChanged(targetId) {
            // 標籤切換時的處理
            console.log('切換到標籤:', targetId);
        }

        onSettingsChanged() {
            this.hasChanges = true;
            this.updateSaveButton();
        }

        updateSaveButton() {
            const saveBtn = document.getElementById('saveAllBtn');
            if (saveBtn) {
                if (this.hasChanges) {
                    saveBtn.classList.add('btn-warning');
                    saveBtn.classList.remove('btn-success');
                    saveBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 有未儲存的變更';
                } else {
                    saveBtn.classList.add('btn-success');
                    saveBtn.classList.remove('btn-warning');
                    saveBtn.innerHTML = '<i class="fas fa-save"></i> 儲存所有設定';
                }
            }
        }

        showSaveConfirm() {
            if (!this.hasChanges) {
                this.showInfo('提示', '目前沒有需要儲存的變更。');
                return;
            }

            // 生成變更摘要
            const changes = this.getChangeSummary();
            const summaryElement = document.getElementById('saveSummary');
            
            if (summaryElement && changes.length > 0) {
                summaryElement.innerHTML = `
                    <h6><i class="fas fa-list"></i> 變更摘要</h6>
                    <ul>
                        ${changes.map(change => `<li>${change}</li>`).join('')}
                    </ul>
                `;
            } else {
                summaryElement.innerHTML = '<p>準備儲存所有設定變更。</p>';
            }

            // 顯示確認對話框
            const modal = new bootstrap.Modal(document.getElementById('saveConfirmModal'));
            modal.show();
        }

        getChangeSummary() {
            const changes = [];
            
            // 比較設定變更（簡化版本）
            if (this.hasChanges) {
                changes.push('基本資料設定');
                changes.push('API 連接設定');
                changes.push('社群媒體設定');
                changes.push('通知偏好設定');
            }
            
            return changes;
        }

        async saveAllSettings() {
            try {
                this.showLoading();
                
                // 收集所有表單資料
                const allSettings = {
                    basic: this.collectFormData('basicInfoForm'),
                    api: this.collectFormData('apiSettingsForm'),
                    social: this.collectFormData('socialMediaForm'),
                    notifications: this.collectFormData('notificationForm')
                };

                // 模擬儲存 API 調用
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // 更新本地設定
                this.settings = allSettings;
                this.originalSettings = JSON.parse(JSON.stringify(allSettings));
                this.hasChanges = false;
                
                // 關閉確認對話框
                const modal = bootstrap.Modal.getInstance(document.getElementById('saveConfirmModal'));
                if (modal) modal.hide();
                
                this.updateSaveButton();
                this.showSuccess('所有設定已成功儲存');
                
            } catch (error) {
                console.error('儲存設定失敗:', error);
                this.showError('儲存設定失敗，請稍後再試');
            } finally {
                this.hideLoading();
            }
        }

        collectFormData(formId) {
            const form = document.getElementById(formId);
            if (!form) return {};

            const formData = new FormData(form);
            const data = {};

            for (let [key, value] of formData.entries()) {
                const input = form.querySelector(`[name="${key}"]`);
                if (input && input.type === 'checkbox') {
                    data[key] = input.checked;
                } else {
                    data[key] = value;
                }
            }

            // 處理未選中的 checkbox
            const checkboxes = form.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                if (!data.hasOwnProperty(checkbox.name)) {
                    data[checkbox.name] = false;
                }
            });

            return data;
        }

        // 工具方法
        showLoading() {
            const loadingHtml = `
                <div class="loading-overlay">
                    <div class="loading-spinner"></div>
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

        showInfo(title, message) {
            this.showAlert(title, message, 'info');
        }

        showConfirm(title, message, callback) {
            this.showAlert(title, message, 'confirm', callback);
        }

        showNotification(message, type = 'info') {
            // 移除現有通知
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
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', alertHtml);
            
            // 自動移除
            setTimeout(() => {
                const alert = document.querySelector('.notification-alert');
                if (alert) alert.remove();
            }, 5000);
        }

        showAlert(title, message, type = 'info', callback = null) {
            const modalId = 'tempAlertModal';
            
            // 移除現有的臨時 modal
            const existingModal = document.getElementById(modalId);
            if (existingModal) existingModal.remove();

            const isConfirm = type === 'confirm';
            const iconClass = type === 'error' ? 'fas fa-exclamation-triangle text-danger' :
                             type === 'success' ? 'fas fa-check-circle text-success' :
                             type === 'confirm' ? 'fas fa-question-circle text-warning' :
                             'fas fa-info-circle text-info';
            
            const modalHtml = `
                <div class="modal fade" id="${modalId}" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="${iconClass}"></i> ${title}
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <p>${message}</p>
                            </div>
                            <div class="modal-footer">
                                ${isConfirm ? 
                                    '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>' +
                                    '<button type="button" class="btn btn-primary" id="confirmAlertBtn">確認</button>' :
                                    '<button type="button" class="btn btn-primary" data-bs-dismiss="modal">確定</button>'
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            const modal = new bootstrap.Modal(document.getElementById(modalId));
            modal.show();
            
            // 處理確認按鈕
            if (isConfirm && callback) {
                const confirmBtn = document.getElementById('confirmAlertBtn');
                if (confirmBtn) {
                    confirmBtn.addEventListener('click', () => {
                        modal.hide();
                        callback();
                    });
                }
            }
            
            // 清理 modal
            document.getElementById(modalId).addEventListener('hidden.bs.modal', () => {
                document.getElementById(modalId).remove();
            });
        }
    }
    
    const manager = new SettingsManager();
    
    // 設為全域變數
    window.settingsManager = manager;
    
    return function cleanup() {
        // 清理事件監聽器
        if (window.settingsManager) {
            delete window.settingsManager;
        }
    };
}

// 設為全域函數
window.initializeSettings = initializeSettings;