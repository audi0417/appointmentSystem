# 美甲預約系統 - CSS 架構文檔

這個文檔描述了美甲預約系統的 CSS 架構和使用指南，以確保整個應用程序的視覺一致性。

## 架構概述

CSS 架構採用模塊化設計，基於以下幾個核心組件：

1. **變量系統**: 所有設計變量（顏色、字體、間距等）集中在 `variables.css` 中
2. **功能組件**: 按功能劃分的 CSS 組件（按鈕、表格、排版等）
3. **頁面特定樣式**: 特定頁面的專屬樣式（儀表板、預約管理等）
4. **主樣式文件**: 整合所有通用組件的 `main.css`

## 文件結構

```
/css
├── variables.css     # 設計變量
├── typography.css    # 文字排版與字體
├── buttons.css       # 按鈕樣式
├── tables.css        # 表格樣式
├── main.css          # 主樣式文件（整合共享組件）
├── admin.css         # 管理介面特定樣式
├── appointments.css  # 預約管理頁面樣式
├── members.css       # 會員管理頁面樣式
├── services.css      # 服務項目頁面樣式
└── portfolio.css     # 作品集頁面樣式
```

## 使用指南

### 在 HTML 模板中引入 CSS

所有頁面應首先引入 `main.css`，然後再引入頁面特定的 CSS 文件：

```html
<!-- 通用樣式 -->
<link href="{{ url_for('static', filename='css/main.css') }}" rel="stylesheet">
<!-- 頁面特定樣式 -->
<link href="{{ url_for('static', filename='css/admin.css') }}" rel="stylesheet">
```

### 設計變量

使用 `variables.css` 中定義的 CSS 變量來保持一致性：

```css
/* 不推薦 */
.element {
  color: #DB7093;
  font-size: 1.2rem;
  padding: 10px;
}

/* 推薦 */
.element {
  color: var(--primary-color);
  font-size: var(--font-size-lg);
  padding: var(--space-2);
}
```

### 按鈕使用

使用標準的按鈕類來保持一致性：

```html
<!-- 主要按鈕 -->
<button class="btn btn-primary">保存</button>

<!-- 次要按鈕 -->
<button class="btn btn-outline">取消</button>

<!-- 危險操作按鈕 -->
<button class="btn btn-danger">刪除</button>

<!-- 小型按鈕 -->
<button class="btn btn-sm btn-primary">確認</button>

<!-- 圖標按鈕 -->
<button class="btn-icon">
  <i class="bx bx-edit"></i>
</button>
```

### 表格使用

按照標準表格結構和類名：

```html
<div class="table-container">
  <table class="table">
    <thead>
      <tr>
        <th>編號</th>
        <th>名稱</th>
        <th>狀態</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>
          <div class="customer-info">
            <img src="avatar.png" alt="客戶頭像">
            <div class="details">
              <div class="name">陳小姐</div>
              <div class="phone">0912-345-678</div>
            </div>
          </div>
        </td>
        <td>
          <span class="status-badge pending">待確認</span>
        </td>
        <td>
          <div class="action-buttons">
            <button class="action-btn view"><i class="bx bx-detail"></i></button>
            <button class="action-btn edit"><i class="bx bx-edit"></i></button>
            <button class="action-btn delete"><i class="bx bx-trash"></i></button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### 實用類

使用標準的實用類來快速應用樣式：

```html
<!-- 間距 -->
<div class="mb-4">底部間距</div>
<div class="mt-3">頂部間距</div>

<!-- 布局 -->
<div class="d-flex align-items-center justify-content-between">
  <div>左側內容</div>
  <div>右側內容</div>
</div>

<!-- 文本對齊 -->
<p class="text-center">居中文本</p>
```

## 響應式設計

系統使用斷點：

- 小屏幕：`max-width: 576px`
- 中屏幕：`max-width: 768px`
- 大屏幕：`max-width: 1024px`

## 擴展指南

1. 新增組件時，先檢查是否可以使用現有的樣式類
2. 需要新建樣式時，盡量複用設計變量
3. 頁面特定的樣式應放在對應的 CSS 文件中
4. 共用的樣式組件應添加到 `main.css` 中

## 維護注意事項

1. 盡量避免在 HTML 中使用內聯樣式
2. 避免使用硬編碼顏色值，始終使用變量
3. 定期檢查和清理未使用的 CSS 類
4. 遵循命名一致性，使用語義化的類名
