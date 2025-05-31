// ===== 全域變數 =====
let router;

// ===== 路由管理 =====
class Router {
    constructor() {
        this.routes = {};
        this.currentPage = "";
        this.currentCleanup = null;
        this.isTransitioning = false;
        
        window.addEventListener("hashchange", this.handleRoute.bind(this));
        window.addEventListener("load", this.handleRoute.bind(this));
    }

    addRoute(path, handler) {
        this.routes[path] = handler;
    }

    async handleRoute() {
        // 防止重複觸發
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        try {
            // 獲取當前路徑
            const hash = window.location.hash.slice(1) || "dashboard";
            
            // 如果是相同頁面，不需要重新載入
            if (this.currentPage === hash) {
                this.isTransitioning = false;
                return;
            }
            
            this.currentPage = hash;
            
            // 執行清理函數
            if (this.currentCleanup) {
                this.currentCleanup();
                this.currentCleanup = null;
            }
            
            // 更新導航狀態
            this.updateNavigation();
            
            // 顯示載入動畫
            this.showLoading();

            const mainContent = document.querySelector(".main-content");

            if (this.routes[hash]) {
                try {
                    const cleanupFunc = await this.routes[hash]();
                    if (typeof cleanupFunc === "function") {
                        this.currentCleanup = cleanupFunc;
                    }
                    
                    // 初始化頁面特定功能
                    await this.initializePageFeatures(hash);
                    
                } catch (error) {
                    console.error("頁面載入失敗:", error);
                    mainContent.innerHTML = '<div class="error-message">頁面載入失敗</div>';
                }
            } else {
                mainContent.innerHTML = `<div class="error-message">找不到頁面: ${hash}</div>`;
            }

        } catch (error) {
            console.error("路由處理失敗:", error);
            const mainContent = document.querySelector(".main-content");
            mainContent.innerHTML = '<div class="error-message">頁面載入失敗</div>';
        } finally {
            this.hideLoading();
            this.isTransitioning = false;
        }
    }

    async initializePageFeatures(page) {
        // 延遲執行以確保DOM完全載入
        setTimeout(async () => {
            switch(page) {
                case 'dashboard':
                    if (typeof initializeDashboard === 'function') await initializeDashboard();
                    break;
                case 'appointments':
                    if (typeof initializeAppointments === 'function') await initializeAppointments();
                    break;
                case 'members':
                    if (typeof initializeMembers === 'function') await initializeMembers();
                    break;
                case 'portfolio':
                    if (typeof initializePortfolio === 'function') await initializePortfolio();
                    break;
                case 'services':
                    if (typeof initializeServices === 'function') await initializeServices();
                    break;
                case 'settings':
                    if (typeof initializeSettings === 'function') await initializeSettings();
                    break;
            }
        }, 100);
    }

    updateNavigation() {
        // 只更新導航狀態，不重新渲染側邊欄
        document.querySelectorAll(".nav-links li").forEach((listItem) => {
            listItem.classList.remove("active");
        });
        
        document.querySelectorAll(".nav-links a").forEach((link) => {
            const page = link.getAttribute("href").substring(1) || "dashboard";
            const listItem = link.parentElement;
            if (page === this.currentPage) {
                listItem.classList.add("active");
            }
        });
    }

    navigateTo(path) {
        if (this.isTransitioning) return;
        window.location.hash = path;
    }

    showLoading() {
        const mainContent = document.querySelector(".main-content");
        const existingLoader = mainContent.querySelector('.page-loader');
        if (existingLoader) return;
        
        const loader = document.createElement('div');
        loader.className = 'page-loader';
        loader.innerHTML = '<div class="spinner"></div><span>載入中...</span>';
        
        // 只在主內容區顯示加載動畫
        mainContent.style.position = 'relative';
        mainContent.appendChild(loader);
    }

    hideLoading() {
        const loader = document.querySelector('.page-loader');
        if (loader) {
            // 淡出效果
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 300);
        }
    }
}

// ===== 側邊欄控制 =====
function initSidebar() {
    const sidebarToggle = document.getElementById("sidebar-toggle");
    const sidebar = document.querySelector(".sidebar");
    const mainContent = document.querySelector(".main-content");
    
    // 創建手機版遮罩層
    let overlay = document.querySelector('.sidebar-overlay');
    
    function createOverlay() {
        if (!overlay && window.innerWidth <= 768) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
            
            // 遮罩層點擊事件
            overlay.addEventListener("click", () => {
                sidebar?.classList.remove("active");
                overlay.classList.remove("active");
            });
        }
    }
    
    function removeOverlay() {
        if (overlay && window.innerWidth > 768) {
            overlay.remove();
            overlay = null;
        }
    }

    sidebarToggle?.addEventListener("click", () => {
        if (window.innerWidth <= 768) {
            // 手機版功能：顯示/隱藏側邊欄
            const isActive = sidebar?.classList.toggle("active");
            if (overlay) {
                overlay.classList.toggle("active", isActive);
            }
        } else {
            // 桌面版功能：收合/展開側邊欄
            const isCollapsed = sidebar?.classList.toggle("collapsed");
            mainContent?.classList.toggle("sidebar-collapsed", isCollapsed);
            document.body.classList.toggle("sidebar-collapsed", isCollapsed); // 添加 body class
            
            // 保存狀態到 localStorage
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        }
    });

    // 點擊側邊欄外部關閉側邊欄（僅手機版）
    document.addEventListener("click", (e) => {
        if (
            window.innerWidth <= 768 &&
            sidebar &&
            sidebar.classList.contains("active") &&
            !sidebar.contains(e.target) &&
            sidebarToggle &&
            !sidebarToggle.contains(e.target)
        ) {
            sidebar.classList.remove("active");
            if (overlay) {
                overlay.classList.remove("active");
            }
        }
    });

    // 視窗大小變更時的處理
    function handleResize() {
        if (window.innerWidth > 768) {
            // 桌面版：移除手機版狀態，恢復收合狀態
            sidebar?.classList.remove("active");
            if (overlay) {
                overlay.classList.remove("active");
            }
            removeOverlay();
            
            // 恢復保存的收合狀態
            const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            sidebar?.classList.toggle("collapsed", isCollapsed);
            mainContent?.classList.toggle("sidebar-collapsed", isCollapsed);
            document.body.classList.toggle("sidebar-collapsed", isCollapsed); // 添加 body class
            
        } else {
            // 手機版：移除桌面版狀態，創建遮罩層
            sidebar?.classList.remove("collapsed");
            mainContent?.classList.remove("sidebar-collapsed");
            document.body.classList.remove("sidebar-collapsed"); // 移除 body class
            createOverlay();
        }
    }
    
    // 初始化時處理
    handleResize();
    
    // 確保初始化時狀態同步
    if (window.innerWidth > 768) {
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            document.body.classList.add("sidebar-collapsed");
        }
    }
    
    // 監聽視窗大小變更
    window.addEventListener("resize", handleResize);
}

// ===== 事件監聽初始化 =====
function initEventListeners() {
    document.querySelectorAll(".nav-links a").forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const page = link.getAttribute("href").substring(1);
            if (router) {
                router.navigateTo(page);
            }
        });
    });
}

// ===== 註冊路由 =====
function registerRoutes() {
    if (!router) return;
    
    // Dashboard 路由
    router.addRoute("dashboard", async () => {
        const mainContent = document.querySelector(".main-content");
        try {
            const response = await fetch("/admin/dashboard");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const html = await response.text();
            mainContent.innerHTML = html;
        } catch (error) {
            console.error("載入儀表板失敗:", error);
            mainContent.innerHTML = '<div class="error-message">載入失敗</div>';
        }
    });

    // 預約管理路由
    router.addRoute("appointments", async () => {
        const mainContent = document.querySelector(".main-content");
        try {
            const response = await fetch("/admin/appointments");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const html = await response.text();
            mainContent.innerHTML = html;
        } catch (error) {
            console.error("載入預約管理失敗:", error);
            mainContent.innerHTML = '<div class="error-message">載入失敗</div>';
        }
    });

    // 會員管理路由
    router.addRoute("members", async () => {
        const mainContent = document.querySelector(".main-content");
        try {
            const response = await fetch("/admin/members");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const html = await response.text();
            mainContent.innerHTML = html;
        } catch (error) {
            console.error("載入會員管理失敗:", error);
            mainContent.innerHTML = '<div class="error-message">載入失敗</div>';
        }
    });

    // 服務項目路由
    router.addRoute("services", async () => {
        const mainContent = document.querySelector(".main-content");
        try {
            const response = await fetch("/admin/services");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const html = await response.text();
            mainContent.innerHTML = html;
        } catch (error) {
            console.error("載入服務項目失敗:", error);
            mainContent.innerHTML = '<div class="error-message">載入失敗</div>';
        }
    });

    // 作品集路由
    router.addRoute("portfolio", async () => {
        const mainContent = document.querySelector(".main-content");
        try {
            const response = await fetch("/admin/portfolio");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const html = await response.text();
            mainContent.innerHTML = html;
        } catch (error) {
            console.error("載入作品集失敗:", error);
            mainContent.innerHTML = '<div class="error-message">載入失敗</div>';
        }
    });

    // 系統設定路由
    router.addRoute("settings", async () => {
        const mainContent = document.querySelector(".main-content");
        try {
            const response = await fetch("/admin/settings");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const html = await response.text();
            mainContent.innerHTML = html;
        } catch (error) {
            console.error("載入系統設定失敗:", error);
            mainContent.innerHTML = '<div class="error-message">載入失敗</div>';
        }
    });
}

// ===== 工具函數 =====
function formatDate(date) {
    return new Date(date).toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("zh-TW", {
        style: "currency",
        currency: "TWD",
    }).format(amount);
}

// ===== API 請求封裝 =====
const API = {
    async get(endpoint) {
        try {
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("API 請求失敗:", error);
            throw error;
        }
    },

    async post(endpoint, data) {
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("API 請求失敗:", error);
            throw error;
        }
    }
};

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
    // 獲取 CSRF token
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    
    if (token) {
        // 設置 axios 預設 header
        if (window.axios) {
            axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
        }
        
        // 設置 jQuery ajax 預設 header
        if (window.$) {
            $.ajaxSetup({
                beforeSend: function(xhr, settings) {
                    if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
                        xhr.setRequestHeader("X-CSRFToken", token);
                    }
                }
            });
        }
    }
    
    // 初始化路由器
    router = new Router();
    
    // 初始化其他功能
    initSidebar();
    initEventListeners();
    registerRoutes();
    
    // 設置初始路由
    if (!window.location.hash) {
        window.location.hash = "#dashboard";
    }
});
