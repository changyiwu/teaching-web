---
name: Math Interactive Webpage Builder (互動數學教材網頁建置器)
description: 當使用者提供國中/高中數學教材、PDF、Word 檔，或要求針對特定章節/小節製作教學網頁、互動 Canvas 元件、隨堂評量時，觸發此技能。
---

# 互動數學教材網頁建置指引

本技能指引旨在自動化將數學教材（如 PDF、Word）轉化為高質感、具備 HTML5 Canvas 視覺互動探索、以及即時回饋隨堂評量的線上教學網頁。

## 1. 觸發條件與準備工作
* **觸發語境**：當使用者提及「針對這份教材做一個教學網頁」、「分析教材」、「製作小節網頁」並附上 PDF/Word 檔案路徑，或提供章節代號（如 `1-1-1`）時。
* **準備工作**：
  1. 確認教材檔案格式（`.pdf`, `.doc`, `.docx`）與目標輸出資料夾（預設為 `/materials/V-C-S/`）。
  2. 確保專案具備全域的 `index.html` 入口及 `background.png` 資源。

## 2. 檔案解析與文本提取工作流
* **對於 PDF 檔案**：
  * 使用 Python 腳本（依賴 `PyMuPDF` / `fitz` 庫）提取全文字元。
  * 將提取出的文本以 `utf-8` 編碼寫入臨時文字檔，以避免主控台編碼錯誤（如 Windows CP950 錯誤）。
* **對於 Word 舊格式 (.doc)**：
  * **關鍵注意**：為避免虛擬硬碟（如 Google Drive）網路串流延遲導致 Word COM 程式當掉，必須先將 `.doc` 複製到本地臨時目錄。
  * 使用 `win32com.client.Dispatch("Word.Application")` 開啟檔案（設定 `Encoding=950` 繁體中文），另存為 XML 標準格式的 `.docx`，再解析 `word/document.xml` 讀取文字。

## 3. 重點概念結構化拆解
分析提取出的教材文字，將其歸納為 **重點 1、重點 2、重點 3、重點 4** 等核心區塊。每個重點區塊必須包含以下三個要素：
1. **重點整理敘述 (Explanation Card)**：
   * 用簡明扼要的清單或表格條列出該概念的核心定理、定義及運算性質。
2. **視覺互動探索 (Interactive Canvas Card)**：
   * 評估該概念是否適合進行 Canvas 視覺化（例如溫度計、數線坐標、相反數對稱、絕對值距離等）。
   * 於 HTML 中建立 `<canvas>` 容器、動態數值標籤（如 `temp-val`）及控制滑桿（`input[type="range"]`）。
3. **隨堂形成性評量 (Formative Assessment Quiz)**：
   * 針對該重點設計 2-3 題單選題。
   * 題目使用 `<label class="option-label">` 包裹 `radio` 按鈕。
   * 提供「提交答案」按鈕，並實作解鎖與反饋邏輯。作答完畢後顯示正確/錯誤狀態樣式，並平滑展開（`slideDown`）詳細的數學原理解析。

## 4. UI 視覺設計與美學規範 (Aesthetics & Theme)
* **主題風格**：與主入口網站風格保持一致，採用極致質感的暗黑科技感（Glassmorphism，磨砂玻璃風）。
* **背景與光暈**：
  * 背景圖：使用 `linear-gradient(rgba(10, 8, 28, 0.8), rgba(10, 8, 28, 0.8)), url('../../background.png')`。
  * 背景光暈：加入 3 個使用 `filter: blur(120px)` 的彩色浮動 Blob 圓球，設定無限循環的漂浮動畫（`blob-float`）。
* **重點區塊主題配色 (Themed Concept Colors)**：
  * 每個重點區塊應分配其獨有的主題配色（如：重點 1 玫瑰紅、重點 2 水青綠、重點 3 魔法紫、重點 4 香檳金）。
  * 標題（`.section-title`）應設計為對應的主題漸層文字，並將核心數學專有名詞（`strong`）染上對應主題亮色，打破單調色調。
* **評量選項個性化配色 (Vibrant Quiz Options)**：
  * 單選選項卡在 `:hover` 與 `.selected` 時，應根據 A/B/C/D 給予不同的彩色微光與邊框（A 紅、B 綠、C 青/藍、D 橙/黃），並同步變更單選鈕的 `accent-color`，使作答富有趣味性。
* **總結與情境配色 (Summary & Context Styling)**：
  * 網頁末尾的「小節總結與核心回顧」應使用獨特的漸層標題，且左右回顧卡片與情境段落應著上不同的主題色彩（如回顧搭配薄荷綠、生活故事搭配亮藍色），提升完課視覺體驗。
* **水豚（卡皮巴拉）插圖**：
  * 配合教材各區塊（如冰淇淋、溫泉、尺規），使用生圖技能（`generate_image`）繪製專屬的「呆萌卡通水豚貼紙風」插圖。
  * 插圖規格：寬度限制為 `220px`，並設定卡片邊框、投射陰影與 Hover Zoom 特效，置於說明區塊底部。

## 5. Canvas 互動開發與定位修正
* **事件對齊公式（極重要）**：
  * 為防止 Canvas 經 CSS 縮放或在 Retina 高解析度螢幕上出現「滑鼠/手指位置與畫布元件對不起來」的偏移 Bug，**必須**在計算座標時乘上縮放比率：
    ```javascript
    function getMouseX(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = (e.touches && e.touches.length > 0) 
        ? e.touches[0].clientX 
        : ((e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0].clientX : e.clientX);
      const relativeX = clientX - rect.left;
      return relativeX * (canvas.width / rect.width);
    }
    ```
* **繪圖優化**：
  * 使用 `ctx.shadowBlur` 與亮色（如 `var(--accent)`、`var(--secondary)`）繪製發光點。
  * 加入反光高光線，提升幾何元素的立體感與精緻感。
  * 同步綁定 `mousedown/mousemove/mouseup` 以及 `touchstart/touchmove/touchend` 以支援觸控平板。

## 6. 整合與部署
* **資料夾配置**：將 HTML、CSS、JS 與插圖存放在 `/materials/V-C-S/` 子目錄下。
* **更新主入口**：
  * 在主入口的 `script.js` 中，將對應小節的狀態標記更新為「已完成」（`completed`），使首頁能順暢跳轉至該教材網頁。
* **驗證機制**：
  * 寫入檔案後，執行完整性檢查，確保相對路徑（如 `../../index.html`）正確，網頁跳轉順暢。
