// ===== 初始化設定 =====
// CSRF 令牌設置
// ===== 初始化設定 =====
// CSRF 設置
document.addEventListener('DOMContentLoaded', function() {
  // 獲取 CSRF token
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  
  if (token) {
      // 設置 axios 預設 header
      if (window.axios) {
          axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
      }
      
      // 設置 jQuery ajax 預設 header
      $.ajaxSetup({
          beforeSend: function(xhr, settings) {
              if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
                  xhr.setRequestHeader("X-CSRFToken", token);
              }
          }
      });
  }
  
  // 初始化其他功能
  initSidebar();
  initEventListeners();
  registerRoutes();
});

// ... 其餘代碼保持不變

// ===== 路由管理 =====
class Router {
    constructor() {
        this.routes = {};
        this.currentPage = "";
        this.currentCleanup = null;
        
        window.addEventListener("hashchange", this.handleRoute.bind(this));
        window.addEventListener("load", this.handleRoute.bind(this));
    }

    addRoute(path, handler) {
        this.routes[path] = handler;
    }

    async handleRoute() {
        try {
            // 執行清理函數
            if (this.currentCleanup) {
                this.currentCleanup();
                this.currentCleanup = null;
            }

            // 獲取當前路徑並顯示載入中提示
            const hash = window.location.hash.slice(1) || "dashboard";
            this.currentPage = hash;
            this.showLoading();
            
            // 更新導航
            this.updateNavigation();

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
                showError(`找不到頁面: ${hash}`);
            }

        } catch (error) {
            console.error("路由處理失敗:", error);
            showError("頁面載入失敗");
        } finally {
            this.hideLoading();
        }
    }

    async initializePageFeatures(page) {
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
        }
    }

    updateNavigation() {
        document.querySelectorAll(".nav-links a").forEach((link) => {
            const page = link.getAttribute("href").substring(1) || "dashboard";
            const listItem = link.parentElement;
            if (page === this.currentPage) {
                listItem.classList.add("active");
            } else {
                listItem.classList.remove("active");
            }
        });
    }

    navigateTo(path) {
        window.location.hash = path;
    }

    showLoading() {
        const loader = document.createElement('div');
        loader.className = 'loader';
        loader.innerHTML = '<span>載入中...</span>';
        document.body.appendChild(loader);
    }

    hideLoading() {
        const loader = document.querySelector('.loader');
        if (loader) loader.remove();
    }
}

// ===== 側邊欄控制 =====
function initSidebar() {
    const sidebarToggle = document.getElementById("sidebar-toggle");
    const sidebar = document.querySelector(".sidebar");

    sidebarToggle?.addEventListener("click", () => {
        sidebar?.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
        if (
            sidebar &&
            !sidebar.contains(e.target) &&
            sidebarToggle &&
            !sidebarToggle.contains(e.target) &&
            window.innerWidth <= 768
        ) {
            sidebar.classList.remove("active");
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) {
            sidebar?.classList.remove("active");
        }
    });
}

// ===== 事件監聽初始化 =====
function initEventListeners() {
    document.querySelectorAll(".nav-links a").forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const page = link.getAttribute("href").substring(1);
            router.navigateTo(page);
        });
    });
}
  
  // ===== 工具函數 =====
  // 日期格式化
  function formatDate(date) {
    return new Date(date).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  
  // 金額格式化
  function formatCurrency(amount) {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
    }).format(amount);
  }
  
  // ===== 通知處理 =====
  function showNotification(message, type = "info") {
    const notificationDiv = document.createElement("div");
    notificationDiv.className = `notification ${type}`;
    notificationDiv.textContent = message;
    
    document.body.appendChild(notificationDiv);
    
    setTimeout(() => {
      notificationDiv.remove();
    }, 3000);
  }
  
  // ===== 錯誤處理 =====
  function showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "alert alert-danger";
    errorDiv.role = "alert";
    errorDiv.textContent = message;
    
    const mainContent = document.querySelector(".main-content");
    mainContent.prepend(errorDiv);
  
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
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
  // ===== 註冊路由 =====
  function registerRoutes() {
    // Dashboard 路由
    router.addRoute("dashboard", async () => {
        const mainContent = document.querySelector(".main-content");
        try {
            const response = await fetch("/admin/dashboard");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const html = await response.text();
            mainContent.innerHTML = html;
            
            // 初始化儀表板功能
            if (typeof initializeDashboard === 'function') {
                await initializeDashboard();
            }
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
            
            // 初始化預約管理功能
            if (typeof initializeAppointments === 'function') {
                await initializeAppointments();
            }
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
            
            // 初始化會員管理功能
            if (typeof initializeMembers === 'function') {
                await initializeMembers();
            }
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
            
            // 初始化服務項目功能
            if (typeof initializeServices === 'function') {
                await initializeServices();
            }
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
            
            // 初始化作品集功能
            if (typeof initializePortfolio === 'function') {
                await initializePortfolio();
            }
        } catch (error) {
            console.error("載入作品集失敗:", error);
            mainContent.innerHTML = '<div class="error-message">載入失敗</div>';
        }
    });
}
// ===== 實例化路由 =====
const router = new Router();

// ===== 檢查初始路由 =====
window.addEventListener("load", () => {
    if (!window.location.hash) {
        window.location.hash = "#dashboard";
    }
});