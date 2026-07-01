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

## 3. 引起動機與重點概念結構化
分析提取出的教材文字，將其規劃為**課前引起動機**與數個**概念重點區塊**：

* **課前引起動機 (Pre-class Motivation Comic)**：
  - 於教材網頁的最上方（所有重點區塊之前）插入一個「課前暖身漫畫」區塊，用於引導與激發學生的學習興趣。
  - **內容與情境**：以教材中的素養扉頁或生活情境為藍本（例如冰箱設定負溫度代表什麼意思、玉山最低溫等）。
  - **角色與風格**：使用「可愛卡皮巴拉水豚風（Capybara Style）」，繪製與主題相關的 2x2 四格漫畫。
  - **對白後製規格**：
    - 生圖時加入 `no readable text, no speech bubbles` 以免亂碼。對白統一使用專案後製指令碼 `add_captions.ps1` 加上。
    - 對白框規格：字體大小設為 `20`px Bold（粗體微軟正黑體），對白框高度設為 `75`px，底色為半透明柔和乳白，以利智慧板投影的高對比閱讀。
    - **數學正確性**：若漫畫中繪有數線，必須嚴格確保**僅在右側（正向）有單向箭頭**，左側（負向）則為無箭頭的平直直線，符合國中數學數線三要素的標準定義。

* **重點區塊拆解**：
  不限於 4 個重點，而是由 AI 根據教材內容的豐富度與邏輯結構，自主規劃與拆解適當的重點數量（例如 3、4 或 5 個重點區塊）。每個重點區塊必須包含以下三個要素：
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
  * 每個重點區塊應分配其獨有的主題配色（例如：玫瑰紅、水青綠、魔法紫、香檳金、天空藍等不同的亮色系），以區分各重點的主題。
  * 標題（`.section-title`）應設計為對應的主題漸層文字，並將核心數學專有名詞（`strong`）染上對應主題亮色，打破單調色調。
* **評量選項統一主題色與雙欄響應式排版 (Uniform Theme & Responsive Double Columns for Quiz Options)**：
  * 題目中的 A、B、C、D 四個選項應採用**一致的主題色彩**（而非多色混雜）。預設文字為灰白色 (`#cbd5e1`)，Hover 與 Selected 狀態時統一轉為對應小節的精緻主題色（如第一冊的紫色 `#8b5cf6`），且文字高亮為純白色。
  * **排版寬度與響應式**：選項容器（`.options-container`）在電腦或平板開啟時，應採用雙欄排版（一列 2 個選項，如 `grid-template-columns: repeat(2, 1fr)`）；在手機等小螢幕（如小於 640px）則以媒體查詢回退為單欄（一列 1 個選項），兼顧平板操作與手機閱讀。
* **總結與情境配色 (Summary & Context Styling)**：
  * 網頁末尾的「小節總結與核心回顧」應使用獨特的漸層標題，且左右回顧卡片與情境段落應著上不同的主題色彩（如回顧搭配薄荷綠、生活故事搭配亮藍色），提升完課視覺體驗。
* **插圖生成與關聯性規範 (Illustration Quantity & Relevancy)**：
  * **豐富的插圖張數**：為了充實網頁的視覺豐富度與趣味性，每個教學網頁應至少生成並放置 **4 至 6 張** 專屬插圖（包含課前引起動機漫畫、各重點說明卡片、特定評量題目或結尾總結卡片）。
  * **高度內容關聯性**：插圖絕對不能是通用的裝飾，必須與所處的**教材內容、重點概念或題目情境緊密相關**。
    * *例*：若重點為「指數記法（細胞分裂）」，應生成「水豚科學家拿著放大鏡觀察分裂細胞」的插圖。
    * *例*：若題目為「太空中的天文距離」，應生成「水豚宇航員在太空漫步」的插圖。
    * *例*：若題目為「溫度升降」，應生成「水豚在雪地裡泡溫泉」或「水豚吃冰棒」的插圖。
  * **插圖風格與規格**：
    * 風格統一為「呆萌卡通水豚貼紙風（Capybara Sticker Style）」，生圖時使用與主旨相符的主題描述。
    * 插圖規格：網頁內的插圖寬度限制為 `220px`，並設定卡片邊框、投射陰影與 Hover Zoom 特效，置於說明區塊或題目卡片底部的合適位置。

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
* **相反數鏡像命名與標記一致性 (Opposite Point Naming Consistency)**：
  * 在開發相反數的視覺鏡像對稱時，點 A 在原點另一側的對稱點**必須統一命名為 A'**（A Prime）。
  * 確保 HTML 引導說明、數值顯示面板（即使內部 id 為了代碼安全保留為 `opp-b`）、Canvas 繪圖文字 (`ctx.fillText("A'", ...)`) 以及下方詳解所出現的稱呼完全一致為 `A'`，不得混用「點 B」與「點 A'」造成教學困擾。

## 6. 整合與部署
* **資料夾配置**：將 HTML、CSS、JS 與插圖存放在 `/materials/V-C-S/` 子目錄下。
* **更新主入口**：
  * 在主入口的 `script.js` 中，將對應小節的狀態標記更新為「已完成」（`completed`），使首頁能順暢跳轉至該教材網頁。
* **驗證機制**：
  * 寫入檔案後，執行完整性檢查，確保相對路徑（如 `../../index.html`）正確，網頁跳轉順暢。

## 7. 數學符號與 LaTeX (MathJax) 格式規範
* **MathJax 載入**：在 HTML `<head>` 中引入：
  `<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js" async></script>`。
* **基本格式與字元清理**：
  * 所有變數（如 \(a, b, x\)）、坐標（如 \(A(a)\)）、負數與算式，統一包裹在行內定界符 `\( ... \)` 中，以顯示為精美斜體。
  * **嚴禁**在 LaTeX `\( ... \)` 內部使用全形中文運算子（如 `＋`、`－`），必須全面轉換為半形標準符號 `+`、`-`，以防止渲染間距異常。
* **去除冗餘括號**：
  * 除了為避免運算子相鄰的括號（如 `+ (-5)`）外，算式開頭首項與最終結果絕不加上括號。
  * 正確寫法：`-5 + (-3) = -8`。錯誤寫法：`(-5) + (-3) = (-8)`。
* **線段記法**：國中教材線段長度直接寫為 `AB`、`AC` 等字母組合，不使用上橫線 `\overline{AB}`。
* **JavaScript 動態字串轉義（極重要）**：
  * 在 JS 模板字串（反單引號 `\`...\``）中動態寫入 `innerHTML` 時，單反斜線 `\` 會被 JS 吞掉。
  * **必須使用雙反斜線轉義**：寫成 `\\(`, `\\)`, `\\frac`。否則會造成 HTML 輸出為一般括號與 `rac` 換頁亂碼。
* **Hex 顏色渲染防錯**：
  * **嚴禁**在 LaTeX 內部使用 `\color{#hex}`（`#` 在 LaTeX 模式下會觸發巨集參數報錯）。
  * 必須將 HTML 著色標籤寫在 LaTeX 外部：`<span style="color: #fda4af">\(a\)</span>`，這能 100% 正常顯色。
* **Flexbox 對齊排版防錯**：
  * 對於動態寫入的說明回饋區（如 `.visual-feedback`，帶有 `display: flex`），將 `innerHTML` 的內容整體包裹在單一 block 容器 `<div style="width: 100%; text-align: center; line-height: 1.6; font-size: 0.95rem;">...</div>` 內，防止行內標籤與 `br` 被 flex 拆分橫向排列。

